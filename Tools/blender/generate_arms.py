"""
HOLO ARMS — rigged arm generator (Blender 4.2+ / 5.x, headless).

Builds one continuous, organic arm + hand mesh (upper arm, forearm, palm,
four three-joint fingers, three-joint thumb), skins it to an armature with
automatic weights, and exports FBX files Unity imports directly:

    Arm_Masculine_R.fbx  Arm_Masculine_L.fbx
    Arm_Feminine_R.fbx   Arm_Feminine_L.fbx

Bone contract (Unity side: RiggedArmBuilder):
    Shoulder > Elbow > Wrist > {Thumb_1..3, Index_1..3, Middle_1..3,
                                Ring_1..3, Pinky_1..3, PalmMarker}
PalmMarker is a non-deforming bone whose head sits on the palm side of the
hand, so Unity can derive the finger curl direction without depending on
FBX axis conventions.

This is a stylised-anatomical engineering asset: far better than capsule
placeholders (one skinned surface, real wrist/finger deformation), but NOT
the scan-quality production asset spec §6 requires.

Usage (from the repo root):
    blender --background --python Tools/blender/generate_arms.py -- \
        --out UnityProject/Assets/HoloArms/Art/Resources/Arms [--preview preview.png]
"""

import argparse
import math
import sys

import bpy  # must precede bmesh when running as the standalone bpy module
import bmesh
from mathutils import Vector

# ---------------------------------------------------------------------------
# Anatomy (metres). Right arm in Blender space: shoulder at origin, arm along
# +X, palm facing -Z (down), thumb toward +Y.
# ---------------------------------------------------------------------------

BASE = {
    "upper_len": 0.30,
    "fore_len": 0.27,
    "palm_len": 0.095,
    # (name, knuckle offset along +X from wrist, offset along Y, length, radius at base)
    "fingers": [
        ("Index", 0.092, 0.024, 0.078, 0.0090),
        ("Middle", 0.096, 0.007, 0.086, 0.0092),
        ("Ring", 0.092, -0.010, 0.080, 0.0087),
        ("Pinky", 0.083, -0.026, 0.064, 0.0078),
    ],
    "phalanx_split": (0.46, 0.30, 0.24),
}

VARIANTS = {
    # thickness multiplier, finger slenderness, length multiplier
    "Masculine": {"radius": 1.10, "finger": 1.06, "length": 1.03},
    "Feminine": {"radius": 0.86, "finger": 0.86, "length": 0.97},
}


def ellipse_ring(bm, center, tangent, width, thickness, segs=20):
    """One elliptical vertex ring perpendicular to `tangent`; width along the
    side axis (Y-ish), thickness along the palm normal (Z-ish)."""
    t = tangent.normalized()
    up = Vector((0, 0, 1)) if abs(t.z) < 0.9 else Vector((0, 1, 0))
    side = up.cross(t).normalized()
    normal = t.cross(side).normalized()
    ring = []
    for i in range(segs):
        a = 2 * math.pi * i / segs
        p = center + side * (math.cos(a) * width) + normal * (math.sin(a) * thickness)
        ring.append(bm.verts.new(p))
    return ring


def _catmull(p0, p1, p2, p3, t):
    t2, t3 = t * t, t * t * t
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
                  + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)


def densify(values, sub):
    """Catmull-Rom resample so width/position changes have no kinks."""
    n = len(values)
    out = []
    for i in range(n - 1):
        p0 = values[max(i - 1, 0)]
        p1, p2 = values[i], values[i + 1]
        p3 = values[min(i + 2, n - 1)]
        for k in range(sub):
            out.append(_catmull(p0, p1, p2, p3, k / sub))
    out.append(values[-1])
    return out


def tube(name, path, widths, thicknesses, segs=20, sub=4):
    """Lofted closed tube through `path` with per-point elliptical sections and
    rounded end caps. Returns a mesh object."""
    if sub > 1 and len(path) > 2:
        path = densify(path, sub)
        widths = densify(widths, sub)
        thicknesses = densify(thicknesses, sub)
    bm = bmesh.new()
    rings = []
    n = len(path)
    for i, p in enumerate(path):
        tan = (path[min(i + 1, n - 1)] - path[max(i - 1, 0)])
        rings.append(ellipse_ring(bm, p, tan, widths[i], thicknesses[i], segs))
    for a, b in zip(rings, rings[1:]):
        for i in range(segs):
            j = (i + 1) % segs
            bm.faces.new((a[i], a[j], b[j], b[i]))
    # Rounded caps: shrink toward a pole over a few rings.
    for end, sign in ((0, -1), (n - 1, 1)):
        tan = (path[min(end + 1, n - 1)] - path[max(end - 1, 0)]).normalized() * sign
        prev = rings[end]
        w, th = widths[end], thicknesses[end]
        steps = 3
        for k in range(1, steps + 1):
            f = k / (steps + 1)
            ang = f * math.pi / 2
            c = path[end] + tan * (math.sin(ang) * min(w, th))
            ring = ellipse_ring(bm, c, tan * sign, w * math.cos(ang), th * math.cos(ang), segs)
            for i in range(segs):
                j = (i + 1) % segs
                if sign > 0:
                    bm.faces.new((prev[i], prev[j], ring[j], ring[i]))
                else:
                    bm.faces.new((prev[i], ring[i], ring[j], prev[j]))
            prev = ring
        pole = bm.verts.new(path[end] + tan * min(w, th))
        for i in range(segs):
            j = (i + 1) % segs
            if sign > 0:
                bm.faces.new((prev[i], prev[j], pole))
            else:
                bm.faces.new((prev[i], pole, prev[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    return ob


def smoothstep(a, b, x):
    if b <= a:
        return 1.0 if x >= b else 0.0
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def chain_weights(s, bones, starts, half_window):
    """Weights along a bone chain for a scalar position `s`: bone i owns
    [starts[i], starts[i+1]); boundaries blend over +-half_window. Sums to 1."""
    t = [1.0] + [smoothstep(st - half_window, st + half_window, s) for st in starts[1:]] + [0.0]
    return {b: t[i] - t[i + 1] for i, b in enumerate(bones) if t[i] - t[i + 1] > 1e-4}


def polyline_param(p, pts):
    """Arc-length parameter of the point on polyline `pts` closest to `p`
    (extrapolated before the first point, so in-palm finger roots get s < 0)."""
    best, best_d, acc = 0.0, float("inf"), 0.0
    for a, b in zip(pts, pts[1:]):
        ab = b - a
        L = ab.length
        u = (p - a).dot(ab) / (L * L)
        if a is pts[0]:
            u = min(u, 1.0)
        else:
            u = max(0.0, min(1.0, u))
        q = a + ab * u
        d = (p - q).length
        if d < best_d:
            best_d, best = d, acc + u * L
        acc += L
    return best


def apply_weights(ob, weight_fn):
    """Analytic skin weights per vertex, stored as vertex groups."""
    groups = {}
    for v in ob.data.vertices:
        for bone, w in weight_fn(v.co).items():
            g = groups.get(bone) or ob.vertex_groups.new(name=bone)
            groups[bone] = g
            g.add([v.index], w, "REPLACE")


def lerp_list(a, b, n):
    return [a + (b - a) * i / (n - 1) for i in range(n)]


def build_variant(variant_name, v):
    """Returns (mesh_obj, armature_obj) for a RIGHT arm."""
    R, F, L = v["radius"], v["finger"], v["length"]
    upper = BASE["upper_len"] * L
    fore = BASE["fore_len"] * L
    elbow = Vector((upper, 0, 0))
    wrist = Vector((upper + fore, 0, 0))

    parts = []

    # Upper arm + forearm as one tube (elbow included) for a continuous silhouette.
    xs = [-0.04, 0.0, upper * 0.35, upper * 0.75, upper, upper + fore * 0.2,
          upper + fore * 0.55, upper + fore * 0.85, upper + fore]
    path = [Vector((x, 0, 0)) for x in xs]
    # widths (side) / thicknesses (palm normal) — forearm flattens toward the wrist
    w = [0.050, 0.052, 0.047, 0.041, 0.038, 0.042, 0.037, 0.030, 0.027]
    t = [0.050, 0.052, 0.046, 0.040, 0.037, 0.039, 0.031, 0.022, 0.019]
    arm_tube = tube("arm", path, [x * R for x in w], [x * R for x in t], segs=28)
    apply_weights(arm_tube, lambda co: chain_weights(
        co.x, ["Shoulder", "Elbow", "Wrist"], [-1.0, upper, upper + fore + 0.004], 0.035))
    parts.append(arm_tube)

    # Palm: wide, thin, slightly domed toward the back of the hand.
    palm_len = BASE["palm_len"] * L
    px = lerp_list(0.0, palm_len, 6)
    ppath = [wrist + Vector((x, 0.0, 0.002 * math.sin(math.pi * i / 5))) for i, x in enumerate(px)]
    pw = [0.027, 0.034, 0.039, 0.042, 0.043, 0.041]
    pt = [0.019, 0.016, 0.015, 0.014, 0.013, 0.011]
    palm = tube("palm", ppath, [x * R for x in pw], [x * R for x in pt], segs=28)
    apply_weights(palm, lambda co: {"Wrist": 1.0})
    parts.append(palm)

    bones = {}  # name -> (head, tail, parent)
    bones["Shoulder"] = (Vector((0, 0, 0)), elbow, None)
    bones["Elbow"] = (elbow, wrist, "Shoulder")
    bones["Wrist"] = (wrist, wrist + Vector((palm_len * 0.75, 0, 0)), "Elbow")

    # Fingers: slight fan + natural droop toward the palm.
    split = BASE["phalanx_split"]
    for fname, kx, ky, flen, frad in BASE["fingers"]:
        flen *= L
        frad *= F * R ** 0.3
        base = wrist + Vector((kx * L, ky * R ** 0.5, -0.002))
        direction = Vector((1.0, ky * 0.9, -0.04)).normalized()
        joints = [base]
        for s in split:
            joints.append(joints[-1] + direction * (flen * s))
        # Finger tube starts inside the palm so the remesh fuses them.
        fpath = [base - direction * 0.012] + joints
        widths = [frad, frad, frad * 0.92, frad * 0.82, frad * 0.72]
        ftube = tube(fname, fpath, widths, [x * 0.92 for x in widths], segs=14)
        lens = [flen * x for x in split]
        starts = [-1.0, -0.002, lens[0], lens[0] + lens[1]]
        fbones = ["Wrist"] + [f"{fname}_{k}" for k in (1, 2, 3)]
        apply_weights(ftube, lambda co, j=joints, st=starts, fb=fbones: chain_weights(
            polyline_param(co, j), fb, st, 0.005))
        parts.append(ftube)
        parent = "Wrist"
        for k in range(3):
            bn = f"{fname}_{k + 1}"
            bones[bn] = (joints[k], joints[k + 1], parent)
            parent = bn

    # Thumb: from the base of the palm, out toward +Y and slightly under.
    tb = wrist + Vector((0.018 * L, 0.020 * R ** 0.5, -0.006))
    tdir = Vector((0.62, 0.72, -0.30)).normalized()
    tlens = [0.042 * L, 0.033 * L, 0.028 * L]
    tj = [tb]
    for tl in tlens:
        tj.append(tj[-1] + tdir * tl)
        tdir = (tdir + Vector((0.35, -0.12, 0.0))).normalized()  # curve toward the fingers
    trad = 0.0115 * F * R ** 0.3
    parts.append(tube("Thumb", [tb - tdir * 0.01] + tj,
                      [trad * 1.25, trad * 1.15, trad, trad * 0.9, trad * 0.8],
                      [trad * 1.05, trad, trad * 0.9, trad * 0.82, trad * 0.75], segs=14))
    tstarts = [-1.0, -0.002, tlens[0], tlens[0] + tlens[1]]
    apply_weights(parts[-1], lambda co: chain_weights(
        polyline_param(co, tj), ["Wrist", "Thumb_1", "Thumb_2", "Thumb_3"], tstarts, 0.007))
    parent = "Wrist"
    for k in range(3):
        bn = f"Thumb_{k + 1}"
        bones[bn] = (tj[k], tj[k + 1], parent)
        parent = bn

    # Non-deforming marker on the palm side (-Z) of the hand.
    pm = wrist + Vector((palm_len * 0.5, 0, -0.03))
    bones["PalmMarker"] = (pm, pm + Vector((0, 0, -0.01)), "Wrist")

    # --- fuse parts into one watertight organic surface ---
    bpy.ops.object.select_all(action="DESELECT")
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    src = bpy.context.view_layer.objects.active   # analytic weights live here
    src.name = f"WeightSource_{variant_name}"

    bpy.ops.object.duplicate()
    mesh = bpy.context.view_layer.objects.active
    mesh.name = f"Arm_{variant_name}"
    mesh.vertex_groups.clear()

    rm = mesh.modifiers.new("remesh", "REMESH")
    rm.mode = "VOXEL"
    rm.voxel_size = 0.0014
    sm = mesh.modifiers.new("smooth", "SMOOTH")
    sm.factor = 0.6
    sm.iterations = 6
    dec = mesh.modifiers.new("decimate", "DECIMATE")
    dec.ratio = 0.18
    for m in ("remesh", "smooth", "decimate"):
        bpy.ops.object.modifier_apply(modifier=m)
    bpy.ops.object.shade_smooth()

    # Transfer the analytic weights onto the remeshed surface (bone-heat
    # weighting is unreliable on fused organic meshes: it produced spikes).
    for g in src.vertex_groups:
        mesh.vertex_groups.new(name=g.name)
    dt = mesh.modifiers.new("weights", "DATA_TRANSFER")
    dt.object = src
    dt.use_vert_data = True
    dt.data_types_verts = {"VGROUP_WEIGHTS"}
    dt.vert_mapping = "POLYINTERP_NEAREST"
    dt.layers_vgroup_select_src = "ALL"
    dt.layers_vgroup_select_dst = "NAME"
    bpy.ops.object.modifier_apply(modifier="weights")
    bpy.data.objects.remove(src)

    # Normalize so every vertex's weights sum to 1.
    for v in mesh.data.vertices:
        tot = sum(g.weight for g in v.groups)
        if tot > 1e-6:
            for g in v.groups:
                g.weight /= tot

    # --- armature ---
    arm_data = bpy.data.armatures.new(f"Rig_{variant_name}")
    arm = bpy.data.objects.new(f"Rig_{variant_name}", arm_data)
    bpy.context.collection.objects.link(arm)
    bpy.ops.object.select_all(action="DESELECT")
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm_data.edit_bones
    for name, (head, tail, _) in bones.items():
        b = eb.new(name)
        b.head, b.tail = head, tail
        b.roll = 0.0
    for name, (_, _, parent) in bones.items():
        if parent:
            eb[name].parent = eb[parent]
            eb[name].use_connect = False
    eb["PalmMarker"].use_deform = False
    bpy.ops.object.mode_set(mode="OBJECT")

    mesh.parent = arm
    mod = mesh.modifiers.new("Armature", "ARMATURE")
    mod.object = arm

    unweighted = sum(1 for vtx in mesh.data.vertices if not vtx.groups)
    return mesh, arm, unweighted


def mirror_to_left(mesh, arm, variant_name):
    """Duplicate and mirror across Y (thumb side flips) to make a LEFT arm."""
    bpy.ops.object.select_all(action="DESELECT")
    mesh.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.duplicate()
    new = list(bpy.context.selected_objects)
    l_arm = next(o for o in new if o.type == "ARMATURE")
    l_mesh = next(o for o in new if o.type == "MESH")
    l_arm.scale.y = -1
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    # Applying a negative scale flips face winding; fix normals.
    bpy.ops.object.select_all(action="DESELECT")
    l_mesh.select_set(True)
    bpy.context.view_layer.objects.active = l_mesh
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    l_arm.name = f"Rig_{variant_name}_L"
    l_mesh.name = f"Arm_{variant_name}_L"
    return l_mesh, l_arm


def export_fbx(mesh, arm, path, embed_textures=False):
    bpy.ops.object.select_all(action="DESELECT")
    mesh.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.fbx(
        filepath=path,
        use_selection=True,
        object_types={"ARMATURE", "MESH"},
        add_leaf_bones=False,
        bake_anim=False,
        apply_scale_options="FBX_SCALE_UNITS",
        mesh_smooth_type="FACE",
        axis_forward="-Z",
        axis_up="Y",
        path_mode="COPY" if embed_textures else "AUTO",
        embed_textures=embed_textures,
    )


def render_preview(path, closeup=False):
    scene = bpy.context.scene
    objs = [o for o in scene.objects if o.type == "MESH"]
    skin = bpy.data.materials.new("PreviewSkin")
    skin.diffuse_color = (0.80, 0.58, 0.47, 1)
    if skin.node_tree is None and hasattr(skin, "use_nodes"):
        skin.use_nodes = True
    bsdf = skin.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.80, 0.58, 0.47, 1)
        bsdf.inputs["Roughness"].default_value = 0.5
    for o in objs:
        o.data.materials.clear()
        o.data.materials.append(skin)
    # Stack variants vertically by moving the ROOT objects (armatures); moving
    # a skinned mesh away from its armature makes bones rotate about the
    # wrong pivots.
    roots = [o for o in scene.objects if o.parent is None and o.type in ("ARMATURE", "MESH")]
    for i, o in enumerate(roots):
        o.location.z = -i * 0.16

    cam_data = bpy.data.cameras.new("cam")
    cam = bpy.data.objects.new("cam", cam_data)
    scene.collection.objects.link(cam)
    if closeup:
        cam.location = (0.80, -0.38, 0.12)
        target = Vector((0.66, 0.02, -0.10))
    else:
        cam.location = (0.42, -0.55, 0.42)
        target = Vector((0.45, 0.0, -0.22))
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    cam_data.lens = 30
    scene.camera = cam

    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.5
    sun.rotation_euler = (math.radians(40), math.radians(15), math.radians(30))
    scene.collection.objects.link(sun)
    if scene.world is None:
        scene.world = bpy.data.worlds.new("w")
    scene.world.color = (0.25, 0.27, 0.3)

    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 24
    scene.render.resolution_x = 1100
    scene.render.resolution_y = 900
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def pose_test(arm):
    """Bend the elbow and curl the fingers so the preview shows deformation."""
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    pb = arm.pose.bones
    pb["Elbow"].rotation_mode = "XYZ"
    pb["Elbow"].rotation_euler = (0, 0, math.radians(35))
    pb["Wrist"].rotation_mode = "XYZ"
    pb["Wrist"].rotation_euler = (math.radians(-20), 0, 0)
    for f, curl in (("Index", 10), ("Middle", 35), ("Ring", 55), ("Pinky", 70)):
        for k in range(1, 4):
            b = pb[f"{f}_{k}"]
            b.rotation_mode = "XYZ"
            b.rotation_euler = (math.radians(-curl), 0, 0)
    for k in range(1, 4):
        b = pb[f"Thumb_{k}"]
        b.rotation_mode = "XYZ"
        b.rotation_euler = (math.radians(-15), 0, 0)
    bpy.ops.object.mode_set(mode="OBJECT")


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--preview", default=None)
    ap.add_argument("--pose-test", action="store_true",
                    help="pose the right arms (elbow bend, finger curl) before the preview render")
    args = ap.parse_args(argv)

    import os
    os.makedirs(args.out, exist_ok=True)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    report = []
    for name, v in VARIANTS.items():
        mesh, arm, unweighted = build_variant(name, v)
        export_fbx(mesh, arm, os.path.join(args.out, f"Arm_{name}_R.fbx"))
        l_mesh, l_arm = mirror_to_left(mesh, arm, name)
        export_fbx(l_mesh, l_arm, os.path.join(args.out, f"Arm_{name}_L.fbx"))
        report.append(f"{name}: {len(mesh.data.polygons)} faces, "
                      f"{len(arm.data.bones)} bones, unweighted verts {unweighted}")
        # Keep only right arms in the scene for the preview.
        bpy.data.objects.remove(l_mesh)
        bpy.data.objects.remove(l_arm)

    for line in report:
        print("[HoloArms.Blender]", line)
    if args.preview:
        if args.pose_test:
            for ob in [o for o in bpy.context.scene.objects if o.type == "ARMATURE"]:
                pose_test(ob)
        render_preview(args.preview, closeup=args.pose_test)
        print("[HoloArms.Blender] preview →", args.preview)


if __name__ == "__main__":
    main()
