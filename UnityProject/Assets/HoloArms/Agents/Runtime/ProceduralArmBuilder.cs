using HoloArms.Rendering;
using UnityEngine;

namespace HoloArms.Agents
{
    /// <summary>
    /// Capsule-based placeholder arm. EXPLICITLY NOT PRODUCTION QUALITY
    /// (spec §6): the production pipeline expects scan-quality licensed
    /// rigged meshes (see ContentSamples/ for the Higgsfield GLB placeholder
    /// you can swap in via the mesh import path). This builder exists so the
    /// M1 illusion mechanics — clipping, IK, shadows — are testable today.
    /// </summary>
    public sealed class ProceduralArmRig
    {
        public Transform Root;       // shoulder anchor, sits BEHIND the wall (z < 0)
        public Transform Upper;      // shoulder joint (+z = bone axis)
        public Transform Fore;       // elbow joint
        public Transform Hand;       // wrist
        public float UpperLen;
        public float ForeLen;
    }

    public static class ProceduralArmBuilder
    {
        private static readonly Color SkinColor = new Color(0.85f, 0.68f, 0.58f);

        public static ProceduralArmRig Build(Transform parent, float scale, bool leftSide)
        {
            float upperLen = 0.30f * scale;
            float foreLen = 0.27f * scale;
            float radius = 0.045f * scale;
            var skin = HdrpMaterials.Lit(SkinColor, smoothness: 0.42f);

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
            BuildHand(hand, scale, radius, skin, leftSide);

            return new ProceduralArmRig
            {
                Root = root, Upper = upper, Fore = fore, Hand = hand,
                UpperLen = upperLen, ForeLen = foreLen
            };
        }

        /// <summary>Capsule along the joint's +z, from joint to child joint.</summary>
        private static void BoneVisual(Transform joint, float length, float radius, Material mat)
        {
            var c = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            c.name = "bone";
            Object.Destroy(c.GetComponent<Collider>());
            c.transform.SetParent(joint, false);
            c.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
            c.transform.localPosition = new Vector3(0f, 0f, length * 0.5f);
            // Capsule mesh is 2 units tall along y at scale 1.
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

        private static void BuildHand(Transform wrist, float scale, float armRadius, Material mat, bool leftSide)
        {
            float mirror = leftSide ? -1f : 1f;

            var palm = GameObject.CreatePrimitive(PrimitiveType.Cube);
            palm.name = "palm";
            Object.Destroy(palm.GetComponent<Collider>());
            palm.transform.SetParent(wrist, false);
            palm.transform.localPosition = new Vector3(0f, 0f, 0.045f * scale);
            palm.transform.localScale = new Vector3(0.085f * scale, 0.03f * scale, 0.09f * scale);
            palm.GetComponent<MeshRenderer>().sharedMaterial = mat;

            // Four fingers, slightly curled; thumb to the side.
            for (int i = 0; i < 4; i++)
            {
                float x = (-0.03f + i * 0.02f) * scale;
                Finger(wrist, new Vector3(x, 0f, 0.09f * scale), Quaternion.Euler(18f, 0f, 0f),
                       0.055f * scale, 0.008f * scale, mat);
            }
            Finger(wrist, new Vector3(mirror * 0.05f * scale, 0f, 0.03f * scale),
                   Quaternion.Euler(10f, mirror * 55f, 0f), 0.045f * scale, 0.009f * scale, mat);
        }

        private static void Finger(Transform wrist, Vector3 localPos, Quaternion localRot,
                                   float length, float radius, Material mat)
        {
            var f = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            f.name = "finger";
            Object.Destroy(f.GetComponent<Collider>());
            f.transform.SetParent(wrist, false);
            var pivot = new GameObject("fingerPivot").transform;
            pivot.SetParent(wrist, false);
            pivot.localPosition = localPos;
            pivot.localRotation = localRot;
            f.transform.SetParent(pivot, false);
            f.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
            f.transform.localPosition = new Vector3(0f, 0f, length * 0.5f);
            f.transform.localScale = new Vector3(radius * 2f, length * 0.5f + radius * 0.5f, radius * 2f);
            f.GetComponent<MeshRenderer>().sharedMaterial = mat;
        }
    }
}
