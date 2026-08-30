using UnityEngine;

namespace HoloArms.Agents
{
    /// <summary>
    /// Analytic two-bone IK (shoulder–elbow–wrist) with a pole hint.
    /// Joints are a strict parent chain: upper → fore (local +z = bone axis,
    /// fore at local (0,0,L1), hand at local (0,0,L2)); the solver only sets
    /// the two joint world rotations, so the chain stays rigid. No
    /// allocations per solve.
    /// </summary>
    public static class TwoBoneIK
    {
        public static void Solve(Transform upper, Transform fore, float l1, float l2,
                                 Vector3 target, Vector3 poleHint)
        {
            var s = upper.position;
            var toTarget = target - s;
            var dist = toTarget.magnitude;
            var maxReach = l1 + l2 - 0.0005f;
            if (dist < 0.0005f) return;
            var dir = toTarget / dist;
            dist = Mathf.Clamp(dist, Mathf.Abs(l1 - l2) + 0.0005f, maxReach);

            // Bend plane from the pole hint, projected perpendicular to dir.
            var poleDir = poleHint - s;
            poleDir -= Vector3.Dot(poleDir, dir) * dir;
            if (poleDir.sqrMagnitude < 1e-6f)
                poleDir = Vector3.Cross(dir, Vector3.up).sqrMagnitude > 1e-6f
                    ? Vector3.Cross(dir, Vector3.up)
                    : Vector3.right;
            poleDir.Normalize();

            // Law of cosines: shoulder interior angle.
            var cosA = Mathf.Clamp((l1 * l1 + dist * dist - l2 * l2) / (2f * l1 * dist), -1f, 1f);
            var sinA = Mathf.Sqrt(Mathf.Max(0f, 1f - cosA * cosA));
            var elbow = s + dir * (cosA * l1) + poleDir * (sinA * l1);

            var clampedTarget = s + dir * dist;
            upper.rotation = Quaternion.LookRotation(elbow - s, poleDir);
            fore.rotation = Quaternion.LookRotation(clampedTarget - elbow, poleDir);
        }
    }
}
