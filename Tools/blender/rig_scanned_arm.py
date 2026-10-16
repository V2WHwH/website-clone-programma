"""
HOLO ARMS — rig a scanned / AI-generated arm mesh (GLB) for Unity.

Image-to-3D and photogrammetry arms come without a skeleton. This script
fits the HOLO ARMS bone contract (same as generate_arms.py) to such a mesh
using a per-asset landmark file, computes analytic skin weights (bone-heat
weighting is unreliable on these meshes), keeps the original texture, and
exports right + mirrored left FBX files with embedded textures.

    Shoulder > Elbow > Wrist > {Thumb_1..3, Index_1..3, Middle_1..3,
                                Ring_1..3, Pinky_1..3, PalmMarker}

Usage:
    blender --background --python Tools/blender/rig_scanned_arm.py -- \
        --glb arm.glb --landmarks Tools/blender/landmarks/higgsfield_arm_01.json \
        --name Scan01 --out UnityProject/Assets/HoloArms/Art/Resources/Arms \
        [--preview posed.png]
"""

import argparse
import json
import math
import os
import sys

import bpy  # must precede other Blender modules when run as the bpy module
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from generate_arms import chain_weights, polyline_param, mirror_to_left, export_fbx  # noqa: E402


def centroid(verts, pred):
    sel = [v for v in verts if pred(v)]
    if not sel:
        return None
    return sum(sel, Vector()) / len(sel)


def rig(mesh, lm):
    s = lm["scale_to_metres"]
    # Normalize scale so the asset is in metres.
    mesh.scale = (s, s, s)
    bpy.ops.object.select_all(action="DESELECT")
    mesh.select_set(True)
    bpy.context.view_layer.objects.active = mesh
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    L = {k: v * s for k, v in lm.items() if isinstance(v, (int, float)) and k.endswith("_x")}
    verts = [v.co.copy() for v in mesh.data.vertices]
    th = lm["thumb"]
    tz0, tslope, tx0 = th["region_z_at_x0"] * s, th["region_z_slope"], th["region_x0"] * s

    def in_thumb(p):
        return tx0 < p.x < th["joint_x"][-1] * s + 0.01 and p.z > tz0 + tslope * (p.x - tx0)

    def axis_point(x, extra=lambda p: True, slab=0.01):
        c = centroid(verts, lambda p: abs(p.x - x) < slab and not in_thumb(p) and extra(p))
        return c if c else Vector((x, 0, 0))

    shoulder = axis_point(L["shoulder_x"])
    elbow = axis_point(L["elbow_x"])
    wrist = axis_point(L["wrist_x"])
    knuckle_x = L["knuckle_x"]
    hand_center = axis_point(knuckle_x - 0.01)

    bones = {
        "Shoulder": (shoulder, elbow, None),
        "Elbow": (elbow, wrist, "Shoulder"),
        "Wrist": (wrist, hand_center, "Elbow"),
    }

    # Fingers: Z bands (fingers are fused in scanned meshes).
    fingers = lm["fingers"]
    centers = [f["z_center"] * s for f in fingers]
    mids = [(a + b) / 2 for a, b in zip(centers, centers[1:])]
    band_h = lm["finger_band_blend"] * s
    split = lm["phalanx_split"]
    finger_chains = {}
    for f, zc in zip(fingers, centers):
        tip_x = f["tip_x"] * s
        xs = [knuckle_x]
        for sp in split:
            xs.append(xs[-1] + (tip_x - knuckle_x) * sp)
        joints = []
        for x in xs:
            c = centroid(verts, lambda p, x=x, zc=zc: abs(p.x - x) < 0.006 and abs(p.z - zc) < 0.008
                         and not in_thumb(p))
            joints.append(c if c else Vector((x, hand_center.y, zc)))
        finger_chains[f["name"]] = joints
        parent = "Wrist"
        for k in range(3):
            bn = f"{f['name']}_{k + 1}"
            bones[bn] = (joints[k], joints[k + 1], parent)
            parent = bn

    thumb_joints = []
    for x in th["joint_x"]:
        c = centroid(verts, lambda p, x=x * s: abs(p.x - x) < 0.008 and in_thumb(p))
        thumb_joints.append(c if c else Vector((x * s, hand_center.y, tz0)))
    parent = "Wrist"
    for k in range(3):
        bn = f"Thumb_{k + 1}"
        bones[bn] = (thumb_joints[k], thumb_joints[k + 1], parent)
        parent = bn

    palm = Vector(lm["palm_side"]).normalized()
    pm = (wrist + hand_center) / 2 + palm * 0.03
    bones["PalmMarker"] = (pm, pm + palm * 0.01, "Wrist")

    # --- analytic weights ---
    for name in bones:
        if name != "PalmMarker":
            mesh.vertex_groups.new(name=name)
    vg = {g.name: g for g in mesh.vertex_groups}
    elbow_x, wrist_x = elbow.x, wrist.x
    fnames = [f["name"] for f in fingers]
    t_lens = [(b - a).length for a, b in zip(thumb_joints, thumb_joints[1:])]
    t_starts = [-1.0, -0.004, t_lens[0], t_lens[0] + t_lens[1]]

    for v in mesh.data.vertices:
        p = v.co
        w = {}
        if in_thumb(p):
            w = chain_weights(polyline_param(p, thumb_joints),
                              ["Wrist", "Thumb_1", "Thumb_2", "Thumb_3"], t_starts, 0.008)
        elif p.x > knuckle_x - 0.012:
            bands = chain_weights(-p.z, fnames, [-1e9] + [-m for m in mids], band_h)
            for fname, bw in bands.items():
                j = finger_chains[fname]
                lens = [(b - a).length for a, b in zip(j, j[1:])]
                starts = [-1.0, -0.002, lens[0], lens[0] + lens[1]]
                cw = chain_weights(polyline_param(p, j),
                                   ["Wrist", f"{fname}_1", f"{fname}_2", f"{fname}_3"], starts, 0.006)
                for b, x in cw.items():
                    w[b] = w.get(b, 0.0) + x * bw
        else:
            # wide, soft elbow blend; tight wrist blend
            t1 = smooth(elbow_x - 0.04, elbow_x + 0.04, p.x)
            t2 = smooth(wrist_x - 0.015, wrist_x + 0.02, p.x)
            for b, x in (("Shoulder", 1 - t1), ("Elbow", t1 - t2), ("Wrist", t2)):
                if x > 1e-4:
                    w[b] = x
        for b, x in w.items():
            vg[b].add([v.index], x, "REPLACE")

    # --- armature ---
    arm_data = bpy.data.armatures.new("Rig_Scan")
    arm = bpy.data.objects.new("Rig_Scan", arm_data)
    bpy.context.collection.objects.link(arm)
    bpy.ops.object.select_all(action="DESELECT")
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    for name, (head, tail, _) in bones.items():
        b = arm_data.edit_bones.new(name)
        b.head, b.tail = head, tail
    for name, (_, _, parent) in bones.items():
        if parent:
            arm_data.edit_bones[name].parent = arm_data.edit_bones[parent]
    arm_data.edit_bones["PalmMarker"].use_deform = False
    bpy.ops.object.mode_set(mode="OBJECT")

    mesh.parent = arm
    mod = mesh.modifiers.new("Armature", "ARMATURE")
    mod.object = arm
    return arm, bones


def smooth(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def pose_and_render(arm, mesh, path):
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    pb = arm.pose.bones
    for b in pb:
        b.rotation_mode = "XYZ"
    pb["Elbow"].rotation_euler = (0, 0, math.radians(-30))
    for f, curl in (("Index", 14), ("Middle", 22), ("Ring", 30), ("Pinky", 38)):
        for k in range(1, 4):
            pb[f"{f}_{k}"].rotation_euler = (math.radians(curl), 0, 0)
    for k in range(1, 4):
        pb[f"Thumb_{k}"].rotation_euler = (math.radians(12), 0, 0)
    bpy.ops.object.mode_set(mode="OBJECT")

    scene = bpy.context.scene
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    scene.collection.objects.link(cam)
    hand = arm.matrix_world @ arm.pose.bones["Wrist"].tail
    cam.location = hand + Vector((-0.05, -0.55, 0.30))
    cam.rotation_euler = (hand - cam.location).to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = 35
    scene.camera = cam
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3
    sun.rotation_euler = (math.radians(45), 0, math.radians(20))
    scene.collection.objects.link(sun)
    scene.world = bpy.data.worlds.new("w")
    scene.world.color = (0.3, 0.3, 0.32)
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 24
    scene.render.resolution_x = 1100
    scene.render.resolution_y = 800
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--glb", required=True)
    ap.add_argument("--landmarks", required=True)
    ap.add_argument("--name", default="Scan01")
    ap.add_argument("--out", required=True)
    ap.add_argument("--preview", default=None)
    args = ap.parse_args(argv)
    with open(args.landmarks) as fh:
        lm = json.load(fh)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=args.glb)
    mesh = next(o for o in bpy.context.scene.objects if o.type == "MESH")
    mesh.name = f"Arm_{args.name}"
    arm, bones = rig(mesh, lm)
    unweighted = sum(1 for v in mesh.data.vertices if not v.groups)
    print(f"[HoloArms.Rig] {args.name}: {len(mesh.data.vertices)} verts, "
          f"{len(bones)} bones, unweighted {unweighted}")
    for n in ("Shoulder", "Elbow", "Wrist", "Index_1", "Thumb_1"):
        print(f"[HoloArms.Rig]   {n} head {tuple(round(c, 3) for c in bones[n][0])}")

    os.makedirs(args.out, exist_ok=True)
    export_fbx(mesh, arm, os.path.join(args.out, f"Arm_{args.name}_R.fbx"), embed_textures=True)
    l_mesh, l_arm = mirror_to_left(mesh, arm, args.name)
    export_fbx(l_mesh, l_arm, os.path.join(args.out, f"Arm_{args.name}_L.fbx"), embed_textures=True)
    bpy.data.objects.remove(l_mesh)
    bpy.data.objects.remove(l_arm)

    if args.preview:
        pose_and_render(arm, mesh, args.preview)
        print("[HoloArms.Rig] preview →", args.preview)


if __name__ == "__main__":
    main()
