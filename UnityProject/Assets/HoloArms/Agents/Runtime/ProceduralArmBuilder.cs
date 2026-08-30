using System.Collections.Generic;
using HoloArms.Rendering;
using UnityEngine;

namespace HoloArms.Agents
{
    /// <summary>
    /// Capsule-based placeholder arm that VISIBLY carries its
    /// ArmIdentityProfile (Docs/10): skin tone, gendered proportions,
    /// watch / bracelets / rings / nails / tattoo bands.
    /// EXPLICITLY NOT PRODUCTION QUALITY (spec §6): production uses
    /// scan-quality mesh variants with real accessory sockets and tattoo
    /// texture layers; this builder makes identity testable today.
    /// </summary>
    public sealed class ProceduralArmRig
    {
        public Transform Root;       // shoulder anchor, sits BEHIND the wall (z > 0)
        public Transform Upper;      // shoulder joint (+z = bone axis)
        public Transform Fore;       // elbow joint
        public Transform Hand;       // wrist
        public float UpperLen;
        public float ForeLen;
    }

    public static class ProceduralArmBuilder
    {
        public static ProceduralArmRig Build(Transform parent, ArmIdentityProfile id, bool leftSide)
        {
            float scale = id.ArmScale;
            float upperLen = 0.30f * scale * id.LengthScale;
            float foreLen = 0.27f * scale * id.LengthScale;
            float radius = 0.045f * scale * id.RadiusScale;
            var skin = HdrpMaterials.Lit(id.SkinTone, smoothness: 0.42f);

            var root = new GameObject("ArmRoot").transform;
            root.SetParent(parent, false);

            var upper = new GameObject("Joint_Shoulder").transform;
            upper.SetParent(root, false);
            BoneVisual(upper, upperLen, radius, skin);

            var fore = new GameObject("Joint_Elbow").transform;
            fore.SetParent(upper, false);
            fore.localPosition = new Vector3(0f, 0f, upperLen);
            BoneVisual(fore, foreLen, radius * 0.9f, skin);
            JointSphere(fore, radius * 1.15f, skin);

            var hand = new GameObject("Joint_Wrist").transform;
            hand.SetParent(fore, false);
            hand.localPosition = new Vector3(0f, 0f, foreLen);
            var fingerPivots = BuildHand(hand, scale * id.RadiusScale, skin, leftSide, id);

            ApplyAccessories(fore, hand, fingerPivots, foreLen, radius, id, leftSide);

            return new ProceduralArmRig
            {
                Root = root, Upper = upper, Fore = fore, Hand = hand,
                UpperLen = upperLen, ForeLen = foreLen
            };
        }

        // ---------- identity dressing ----------

        private static void ApplyAccessories(Transform fore, Transform wrist,
            List<Transform> fingers, float foreLen, float radius,
            ArmIdentityProfile id, bool leftSide)
        {
            float bandZ = foreLen * 0.86f; // just before the wrist

            if (id.Watch != WatchStyle.None)
            {
                var strap = id.Watch == WatchStyle.Sport
                    ? new Color(0.10f, 0.10f, 0.12f) : new Color(0.15f, 0.10f, 0.07f);
                Band(fore, bandZ, radius * 1.06f, 0.016f, strap);
                var face = GameObject.CreatePrimitive(PrimitiveType.Cube);
                face.name = "watchFace";
                Object.Destroy(face.GetComponent<Collider>());
                face.transform.SetParent(fore, false);
                face.transform.localPosition = new Vector3(0f, radius * 1.12f, bandZ);
                face.transform.localScale = new Vector3(0.026f, 0.008f, 0.03f);
                var faceCol = id.Watch == WatchStyle.Smartwatch
                    ? new Color(0.05f, 0.05f, 0.06f) : new Color(0.85f, 0.85f, 0.88f);
                face.GetComponent<MeshRenderer>().sharedMaterial =
                    HdrpMaterials.Lit(faceCol, smoothness: 0.9f);
                bandZ -= 0.028f;
            }
            if (id.LeatherBracelet)
            {
                Band(fore, bandZ, radius * 1.05f, 0.012f, new Color(0.36f, 0.22f, 0.12f));
                bandZ -= 0.02f;
            }
            if (id.MetalBracelet)
            {
                Band(fore, bandZ, radius * 1.07f, 0.006f, new Color(0.8f, 0.8f, 0.85f), smooth: 0.95f);
                bandZ -= 0.016f;
            }
            if (id.BeadBracelet)
            {
                Band(fore, bandZ, radius * 1.08f, 0.009f, new Color(0.55f, 0.30f, 0.45f));
            }

            // Tattoo: placeholder = ink-colored bands on the forearm; the
            // count/width hints at the style. Production = texture layer.
            if (id.Tattoo != TattooStyle.None)
            {
                var ink = Color.Lerp(id.SkinTone, new Color(0.13f, 0.17f, 0.25f),
                                     Mathf.Lerp(0.45f, 0.85f, id.TattooIntensity));
                int bands = id.Tattoo switch
                {
                    TattooStyle.Band => 1,
                    TattooStyle.FineLine => 2,
                    TattooStyle.Floral => 3,
                    _ => 3 // Tribal
                };
                float width = id.Tattoo == TattooStyle.FineLine ? 0.004f
                            : id.Tattoo == TattooStyle.Band ? 0.02f : 0.011f;
                for (int i = 0; i < bands; i++)
                    Band(fore, foreLen * (0.30f + 0.16f * i), radius * 1.005f, width, ink, smooth: 0.42f);
            }

            // Rings on up to three fingers (skip thumb, index first).
            if (id.RingCount > 0 && fingers.Count > 0)
            {
                var ringCol = id.Rings switch
                {
                    RingStyle.Gold => new Color(0.85f, 0.68f, 0.25f),
                    RingStyle.Silver => new Color(0.82f, 0.83f, 0.87f),
                    _ => new Color(0.45f, 0.45f, 0.48f)
                };
                for (int i = 0; i < Mathf.Min(id.RingCount, 3) && i < fingers.Count; i++)
                    Band(fingers[i], 0.012f, 0.0105f, 0.004f, ringCol, smooth: 0.95f);
            }
        }

        /// <summary>Thin cylinder ring around a bone (+z axis) at distance `along`.</summary>
        private static void Band(Transform joint, float along, float radius, float halfWidth,
                                 Color color, float smooth = 0.6f)
        {
            var b = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            b.name = "band";
            Object.Destroy(b.GetComponent<Collider>());
            b.transform.SetParent(joint, false);
            b.transform.localRotation = Quaternion.Euler(90f, 0f, 0f); // cylinder y-axis → +z
            b.transform.localPosition = new Vector3(0f, 0f, along);
            b.transform.localScale = new Vector3(radius * 2f, halfWidth, radius * 2f);
            b.GetComponent<MeshRenderer>().sharedMaterial = HdrpMaterials.Lit(color, smooth);
        }

        // ---------- anatomy ----------

        private static void BoneVisual(Transform joint, float length, float radius, Material mat)
        {
            var c = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            c.name = "bone";
            Object.Destroy(c.GetComponent<Collider>());
            c.transform.SetParent(joint, false);
            c.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
            c.transform.localPosition = new Vector3(0f, 0f, length * 0.5f);
            c.transform.localScale = new Vector3(radius * 2f, length * 0.5f + radius * 0.5f, radius * 2f);
            c.GetComponent<MeshRenderer>().sharedMaterial = mat;
        }

        private static void JointSphere(Transform joint, float radius, Material mat)
        {
            var s = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            s.name = "joint";
            Object.Destroy(s.GetComponent<Collider>());
            s.transform.SetParent(joint, false);
            s.transform.localScale = Vector3.one * (radius * 2f);
            s.GetComponent<MeshRenderer>().sharedMaterial = mat;
        }

        private static List<Transform> BuildHand(Transform wrist, float scale, Material mat,
                                                 bool leftSide, ArmIdentityProfile id)
        {
            float mirror = leftSide ? -1f : 1f;
            var fingerPivots = new List<Transform>();

            var palm = GameObject.CreatePrimitive(PrimitiveType.Cube);
            palm.name = "palm";
            Object.Destroy(palm.GetComponent<Collider>());
            palm.transform.SetParent(wrist, false);
            palm.transform.localPosition = new Vector3(0f, 0f, 0.045f * scale);
            palm.transform.localScale = new Vector3(0.085f * scale, 0.03f * scale, 0.09f * scale);
            palm.GetComponent<MeshRenderer>().sharedMaterial = mat;

            float slender = id.Gender == GenderPresentation.Feminine ? 0.85f : 1f;
            for (int i = 0; i < 4; i++)
            {
                float x = (-0.03f + i * 0.02f) * scale;
                fingerPivots.Add(Finger(wrist, new Vector3(x, 0f, 0.09f * scale),
                    Quaternion.Euler(18f, 0f, 0f), 0.055f * scale, 0.008f * scale * slender, mat, id));
            }
            fingerPivots.Add(Finger(wrist, new Vector3(mirror * 0.05f * scale, 0f, 0.03f * scale),
                Quaternion.Euler(10f, mirror * 55f, 0f), 0.045f * scale, 0.009f * scale * slender, mat, id));

            return fingerPivots;
        }

        private static Transform Finger(Transform wrist, Vector3 localPos, Quaternion localRot,
                                        float length, float radius, Material mat, ArmIdentityProfile id)
        {
            var pivot = new GameObject("fingerPivot").transform;
            pivot.SetParent(wrist, false);
            pivot.localPosition = localPos;
            pivot.localRotation = localRot;

            var f = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            f.name = "finger";
            Object.Destroy(f.GetComponent<Collider>());
            f.transform.SetParent(pivot, false);
            f.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
            f.transform.localPosition = new Vector3(0f, 0f, length * 0.5f);
            f.transform.localScale = new Vector3(radius * 2f, length * 0.5f + radius * 0.5f, radius * 2f);
            f.GetComponent<MeshRenderer>().sharedMaterial = mat;

            if (id.Nails != NailStyle.Natural)
            {
                var nail = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                nail.name = "nail";
                Object.Destroy(nail.GetComponent<Collider>());
                nail.transform.SetParent(pivot, false);
                nail.transform.localPosition = new Vector3(0f, radius * 0.35f, length);
                nail.transform.localScale = Vector3.one * (radius * 1.35f);
                var col = id.Nails == NailStyle.Painted
                    ? id.NailColor
                    : Color.Lerp(id.SkinTone, Color.white, 0.35f);
                nail.GetComponent<MeshRenderer>().sharedMaterial = HdrpMaterials.Lit(col, 0.85f);
            }
            return pivot;
        }
    }
}
