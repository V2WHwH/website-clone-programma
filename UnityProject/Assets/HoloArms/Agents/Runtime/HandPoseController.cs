using UnityEngine;

namespace HoloArms.Agents
{
    public enum HandPose { Relaxed, Point, Offer }

    /// <summary>
    /// Procedural hand animation for imported rigs (spec §12 layers "Finger
    /// Grip Pose" + "Micro Motion"): per-finger curl, thumb, wrist flex and
    /// wrist twist, eased toward pose targets at the arm's personal speed.
    ///
    /// Curl axes are measured at bind time as cross(boneDir, palmNormal), so
    /// positive curl always closes toward the palm regardless of the FBX
    /// axis convention. Scanned assets have fused fingers: neighbouring
    /// curls are coupled (max difference) so the skin between them never
    /// tears — the pointing gesture is therefore subtler on those assets.
    /// </summary>
    public sealed class HandPoseController
    {
        private struct Joint
        {
            public Transform T;
            public Quaternion BindLocal;
            public Vector3 CurlAxisLocal;
            public Vector3 TwistAxisLocal;
        }

        private readonly Joint[][] _fingers;   // Index, Middle, Ring, Pinky
        private readonly Joint[] _thumb;
        private readonly Joint _wrist;
        private readonly bool _fused;
        private readonly float[] _curl = new float[5];   // 0-3 fingers, 4 thumb (degrees)
        private readonly float[] _target = new float[5];
        private float _wristFlex;
        private float _wristTwist;
        private readonly float _phase;

        private static readonly float[] JointGain = { 1.0f, 1.15f, 0.85f };
        private const float FusedMaxNeighbourDelta = 12f;

        public HandPoseController(ProceduralArmRig rig, float phase)
        {
            _phase = phase;
            _fused = rig.FusedFingers;
            var foreDir = (rig.Hand.position - rig.Fore.position).normalized;
            var palm = RiggedArmBuilder.PalmNormal(rig.PalmMarker.position, rig.Hand.position, foreDir);

            _wrist = Make(rig.Hand, foreDir, palm);
            _wrist.TwistAxisLocal = Quaternion.Inverse(rig.Hand.rotation) * foreDir;

            _fingers = new Joint[rig.Fingers.Length][];
            for (int f = 0; f < rig.Fingers.Length; f++) _fingers[f] = MakeChain(rig.Fingers[f], palm);
            _thumb = MakeChain(rig.Thumb, palm);

            for (int i = 0; i < 4; i++) _curl[i] = 15f;
            _curl[4] = 10f;
        }

        private static Joint[] MakeChain(Transform[] chain, Vector3 palm)
        {
            if (chain == null) return null;
            var joints = new Joint[chain.Length];
            for (int k = 0; k < chain.Length; k++)
            {
                var dir = k + 1 < chain.Length
                    ? (chain[k + 1].position - chain[k].position).normalized
                    : (chain[k].position - chain[k - 1].position).normalized;
                joints[k] = Make(chain[k], dir, palm);
            }
            return joints;
        }

        private static Joint Make(Transform t, Vector3 boneDir, Vector3 palm)
        {
            var axisWorld = Vector3.Cross(boneDir, palm);
            if (axisWorld.sqrMagnitude < 1e-8f) axisWorld = Vector3.Cross(boneDir, Vector3.up);
            return new Joint
            {
                T = t,
                BindLocal = t.localRotation,
                CurlAxisLocal = Quaternion.Inverse(t.rotation) * axisWorld.normalized
            };
        }

        /// <summary>Forearm twist (degrees) the arm should add to its forearm frame; the other half lives in the wrist.</summary>
        public float ForearmTwist => _wristTwist;

        public void Tick(HandPose pose, MotionStyle style, PersonalityProfile p, float dt)
        {
            // --- pose targets (degrees per finger joint; thumb; wrist) ---
            float tension = Mathf.Lerp(1.25f, 0.8f, p.Confidence);   // shy/nervous hands curl in
            float limp = Mathf.Lerp(1.3f, 0.9f, p.Energy);            // bored/tired hands droop
            var target = _target;
            float flex, twist;
            switch (pose)
            {
                case HandPose.Point:
                    target[0] = 2f; target[1] = 75f; target[2] = 82f; target[3] = 86f; target[4] = 38f;
                    flex = -5f; twist = -60f;
                    break;
                case HandPose.Offer:
                    target[0] = 6f; target[1] = 8f; target[2] = 10f; target[3] = 12f; target[4] = 4f;
                    flex = -18f; twist = 170f; // palm up, wrist slightly extended
                    break;
                default:
                    target[0] = 12f * tension; target[1] = 18f * tension;
                    target[2] = 24f * tension; target[3] = 30f * tension; target[4] = 12f;
                    flex = 10f * limp; twist = 0f;
                    break;
            }

            if (_fused) Couple(target);

            // --- ease toward targets at the arm's personal speed ---
            float k = 1f - Mathf.Exp(-dt * Mathf.Lerp(3f, 12f, style.MoveSpeed / 1.5f));
            for (int i = 0; i < 5; i++) _curl[i] = Mathf.Lerp(_curl[i], target[i], k);
            _wristFlex = Mathf.Lerp(_wristFlex, flex, k);
            _wristTwist = Mathf.Lerp(_wristTwist, twist, k * 0.7f);

            // --- micro motion: per-finger noise scaled by temperament ---
            float t = Time.time;
            float microDeg = style.MicroMotion * 420f;   // ≈2°–9°
            float wave = pose == HandPose.Relaxed ? 1f : 0.35f;
            for (int f = 0; f < _fingers.Length; f++)
            {
                if (_fingers[f] == null) continue;
                float n = (Mathf.PerlinNoise(t * (0.9f + 0.25f * f), _phase + f * 3.1f) - 0.5f) * 2f;
                float noise = n * microDeg * wave;
                if (_fused) noise *= 0.5f;
                ApplyChain(_fingers[f], _curl[f] + noise);
            }
            if (_thumb != null)
                ApplyChain(_thumb, _curl[4] + (Mathf.PerlinNoise(t * 0.7f, _phase + 17f) - 0.5f) * microDeg);

            float wristNoise = (Mathf.PerlinNoise(t * 0.5f, _phase + 31f) - 0.5f) * microDeg;
            _wrist.T.localRotation = _wrist.BindLocal
                * Quaternion.AngleAxis(_wristTwist * 0.5f, _wrist.TwistAxisLocal)
                * Quaternion.AngleAxis(_wristFlex + wristNoise, _wrist.CurlAxisLocal);
        }

        private static void ApplyChain(Joint[] chain, float curl)
        {
            for (int j = 0; j < chain.Length; j++)
                chain[j].T.localRotation = chain[j].BindLocal
                    * Quaternion.AngleAxis(curl * JointGain[j], chain[j].CurlAxisLocal);
        }

        /// <summary>Limit curl differences between neighbouring fused fingers (both directions).</summary>
        private static void Couple(float[] c)
        {
            for (int pass = 0; pass < 2; pass++)
            {
                for (int i = 1; i < 4; i++)
                    c[i] = Mathf.Clamp(c[i], c[i - 1] - FusedMaxNeighbourDelta, c[i - 1] + FusedMaxNeighbourDelta);
                for (int i = 2; i >= 0; i--)
                    c[i] = Mathf.Clamp(c[i], c[i + 1] - FusedMaxNeighbourDelta, c[i + 1] + FusedMaxNeighbourDelta);
            }
        }
    }
}
