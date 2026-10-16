using System.Collections.Generic;
using HoloArms.Rendering;
using UnityEngine;

namespace HoloArms.Agents
{
    /// <summary>
    /// Loads a Blender-rigged arm FBX (Tools/blender: generate_arms.py or
    /// rig_scanned_arm.py) from Resources/Arms and adapts it to the shared
    /// rig contract: bone lookup by name, IK frame offsets measured at bind
    /// time (axis-convention independent), palm direction from the
    /// PalmMarker bone, identity skin tint, and identity accessories sized
    /// from the actual skinned surface.
    ///
    /// Asset choice per identity: Masculine → Scan01 (Higgsfield scan, the
    /// most realistic asset), Feminine → Feminine, Androgynous → Masculine.
    /// Returns null when no asset is present, so callers fall back to the
    /// capsule placeholder.
    /// </summary>
    public static class RiggedArmBuilder
    {
        private static readonly string[] FingerNames = { "Index", "Middle", "Ring", "Pinky" };
        private static readonly Color ScanReferenceTone = new Color(0.87f, 0.70f, 0.60f);

        public static ProceduralArmRig TryBuild(Transform parent, ArmIdentityProfile id, bool leftSide,
                                                string appearance)
        {
            if (appearance == "Capsule") return null;

            string asset = id.Gender switch
            {
                GenderPresentation.Masculine => appearance == "Procedural" ? "Masculine" : "Scan01",
                GenderPresentation.Feminine => "Feminine",
                _ => "Masculine"
            };
            string side = leftSide ? "L" : "R";
            var prefab = Resources.Load<GameObject>($"Arms/Arm_{asset}_{side}");
            if (prefab == null && asset == "Scan01")
            {
                asset = "Masculine";
                prefab = Resources.Load<GameObject>($"Arms/Arm_{asset}_{side}");
            }
            if (prefab == null) return null;

            var inst = Object.Instantiate(prefab, parent, false);
            inst.name = $"Arm_{asset}_{side}";
            inst.transform.localScale = Vector3.one * id.ArmScale;

            var bones = new Dictionary<string, Transform>();
            foreach (var t in inst.GetComponentsInChildren<Transform>(true))
                bones.TryAdd(t.name, t);
            if (!bones.TryGetValue("Shoulder", out var shoulder) ||
                !bones.TryGetValue("Elbow", out var elbow) ||
                !bones.TryGetValue("Wrist", out var wrist) ||
                !bones.TryGetValue("PalmMarker", out var palmMarker))
            {
                Debug.LogWarning($"[HoloArms.Rig] {inst.name} misses contract bones; using the capsule arm.");
                Object.Destroy(inst);
                return null;
            }

            var upperDir = (elbow.position - shoulder.position).normalized;
            var foreDir = (wrist.position - elbow.position).normalized;
            var palm = PalmNormal(palmMarker.position, wrist.position, foreDir);

            var rig = new ProceduralArmRig
            {
                Root = inst.transform,
                Upper = shoulder,
                Fore = elbow,
                Hand = wrist,
                UpperLen = Vector3.Distance(shoulder.position, elbow.position),
                ForeLen = Vector3.Distance(elbow.position, wrist.position),
                UpperOffset = Quaternion.Inverse(
                    Quaternion.LookRotation(upperDir, Orthogonal(palm, upperDir))) * shoulder.rotation,
                ForeOffset = Quaternion.Inverse(
                    Quaternion.LookRotation(foreDir, Orthogonal(palm, foreDir))) * elbow.rotation,
                PalmMarker = palmMarker,
                FusedFingers = asset.StartsWith("Scan"),
                IsImported = true,
                Fingers = new Transform[FingerNames.Length][],
                Thumb = Chain(bones, "Thumb")
            };
            for (int i = 0; i < FingerNames.Length; i++) rig.Fingers[i] = Chain(bones, FingerNames[i]);

            rig.Skin = inst.GetComponentInChildren<SkinnedMeshRenderer>();
            if (rig.Skin != null)
            {
                // Bones swing outside the bind-pose bounds; never cull a visible arm.
                rig.Skin.updateWhenOffscreen = true;
                ApplySkin(rig.Skin, id, textured: asset.StartsWith("Scan"));
            }

            ApplyAccessories(rig, id, palm);
            return rig;
        }

        private static Transform[] Chain(Dictionary<string, Transform> bones, string finger)
        {
            var chain = new Transform[3];
            for (int k = 0; k < 3; k++)
            {
                if (!bones.TryGetValue($"{finger}_{k + 1}", out chain[k])) return null;
            }
            return chain;
        }

        internal static Vector3 PalmNormal(Vector3 marker, Vector3 wrist, Vector3 foreDir)
            => Orthogonal(marker - wrist, foreDir);

        internal static Vector3 Orthogonal(Vector3 v, Vector3 axis)
        {
            var o = v - Vector3.Dot(v, axis) * axis;
            return o.sqrMagnitude > 1e-8f ? o.normalized : Vector3.Cross(axis, Vector3.right).normalized;
        }

        // ---------- skin ----------

        private static void ApplySkin(SkinnedMeshRenderer smr, ArmIdentityProfile id, bool textured)
        {
            Texture albedo = null;
            var src = smr.sharedMaterial;
            if (src != null)
            {
                if (src.HasProperty("_BaseColorMap")) albedo = src.GetTexture("_BaseColorMap");
                if (albedo == null && src.HasProperty("_MainTex")) albedo = src.GetTexture("_MainTex");
            }

            var m = HdrpMaterials.Lit(id.SkinTone, smoothness: 0.42f);
            if (textured && albedo != null)
            {
                // Multiplicative tint shifts the scan's light skin toward the
                // identity's tone; production assets carry per-tone texture sets.
                var tone = id.SkinTone;
                var tint = new Color(
                    Mathf.Clamp(tone.r / ScanReferenceTone.r, 0.25f, 1.1f),
                    Mathf.Clamp(tone.g / ScanReferenceTone.g, 0.25f, 1.1f),
                    Mathf.Clamp(tone.b / ScanReferenceTone.b, 0.25f, 1.1f));
                m.SetTexture("_BaseColorMap", albedo);
                m.SetColor(HdrpMaterials.BaseColorId, tint);
            }
            smr.sharedMaterial = m;
        }

        // ---------- accessories sized from the skinned surface ----------

        private static void ApplyAccessories(ProceduralArmRig rig, ArmIdentityProfile id, Vector3 palm)
        {
            if (rig.Skin == null) return;
            var baked = new Mesh();
            rig.Skin.BakeMesh(baked, true);
            var t = rig.Skin.transform;
            var toWorld = Matrix4x4.TRS(t.position, t.rotation, Vector3.one);
            var verts = baked.vertices;
            for (int i = 0; i < verts.Length; i++) verts[i] = toWorld.MultiplyPoint3x4(verts[i]);
            Object.Destroy(baked);

            var elbow = rig.Fore.position;
            var foreDir = (rig.Hand.position - elbow).normalized;
            var socket = Socket(rig.Fore, elbow, foreDir, palm, "AccessorySocket_Forearm");

            float along = rig.ForeLen * 0.88f;
            if (id.Watch != WatchStyle.None)
            {
                float r = RadiusAt(verts, elbow, foreDir, along, 0.06f) * 1.04f;
                var strap = id.Watch == WatchStyle.Sport ? new Color(0.1f, 0.1f, 0.12f) : new Color(0.15f, 0.1f, 0.07f);
                ProceduralArmBuilder.Band(socket, along, r, 0.016f, strap);
                // Watch face on the back of the wrist (opposite the palm = -up in socket space).
                var face = GameObject.CreatePrimitive(PrimitiveType.Cube);
                face.name = "watchFace";
                Object.Destroy(face.GetComponent<Collider>());
                face.transform.SetParent(socket, false);
                face.transform.localPosition = new Vector3(0f, -r * 1.06f, along);
                face.transform.localScale = new Vector3(0.026f, 0.008f, 0.03f);
                face.GetComponent<MeshRenderer>().sharedMaterial = HdrpMaterials.Lit(
                    id.Watch == WatchStyle.Smartwatch ? new Color(0.05f, 0.05f, 0.06f) : new Color(0.85f, 0.85f, 0.88f), 0.9f);
                along -= 0.028f;
            }
            if (id.LeatherBracelet)
            {
                ProceduralArmBuilder.Band(socket, along, RadiusAt(verts, elbow, foreDir, along, 0.06f) * 1.03f,
                                          0.012f, new Color(0.36f, 0.22f, 0.12f));
                along -= 0.02f;
            }
            if (id.MetalBracelet)
            {
                ProceduralArmBuilder.Band(socket, along, RadiusAt(verts, elbow, foreDir, along, 0.06f) * 1.05f,
                                          0.006f, new Color(0.8f, 0.8f, 0.85f), 0.95f);
                along -= 0.016f;
            }
            if (id.BeadBracelet)
            {
                ProceduralArmBuilder.Band(socket, along, RadiusAt(verts, elbow, foreDir, along, 0.06f) * 1.06f,
                                          0.009f, new Color(0.55f, 0.3f, 0.45f));
            }

            // Rings on the proximal phalanx (index → ring finger).
            if (id.RingCount > 0 && rig.Fingers != null)
            {
                var ringCol = id.Rings switch
                {
                    RingStyle.Gold => new Color(0.85f, 0.68f, 0.25f),
                    RingStyle.Silver => new Color(0.82f, 0.83f, 0.87f),
                    _ => new Color(0.45f, 0.45f, 0.48f)
                };
                for (int i = 0; i < Mathf.Min(id.RingCount, 3); i++)
                {
                    var chain = rig.Fingers[i];
                    if (chain == null) continue;
                    var a = chain[0].position;
                    var dir = (chain[1].position - a).normalized;
                    float len = Vector3.Distance(a, chain[1].position);
                    var rs = Socket(chain[0], a, dir, palm, "AccessorySocket_Ring");
                    float r = RadiusAt(verts, a, dir, len * 0.45f, 0.014f) * 1.08f;
                    ProceduralArmBuilder.Band(rs, len * 0.45f, r, 0.0035f, ringCol, 0.95f);
                }
            }
            // Tattoos and painted nails on textured/imported arms need texture
            // layers (HDRP decals / nail mask) — production-pipeline item.
        }

        private static Transform Socket(Transform bone, Vector3 origin, Vector3 dir, Vector3 palm, string name)
        {
            var s = new GameObject(name).transform;
            s.SetParent(bone, false);
            s.position = origin;
            s.rotation = Quaternion.LookRotation(dir, Orthogonal(palm, dir)); // +z along the bone, +y toward the palm
            // Cancel any import scale on the bone chain so sizes below are metres.
            var ls = bone.lossyScale;
            s.localScale = new Vector3(1f / ls.x, 1f / ls.y, 1f / ls.z);
            return s;
        }

        /// <summary>Median distance from the bone axis of skin vertices in a thin slab at `along`.</summary>
        private static float RadiusAt(Vector3[] verts, Vector3 origin, Vector3 dir, float along,
                                      float maxRadius, float slab = 0.006f)
        {
            var ds = new List<float>();
            foreach (var v in verts)
            {
                var d = v - origin;
                float s = Vector3.Dot(d, dir);
                if (Mathf.Abs(s - along) > slab) continue;
                float r = (d - s * dir).magnitude;
                if (r < maxRadius) ds.Add(r);
            }
            if (ds.Count == 0) return maxRadius * 0.5f;
            ds.Sort();
            return ds[(int)(ds.Count * 0.6f)]; // slightly above median: rings/bands sit on, not in, the skin
        }
    }
}
