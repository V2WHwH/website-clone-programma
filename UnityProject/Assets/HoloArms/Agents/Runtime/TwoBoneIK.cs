using UnityEngine;

namespace HoloArms.Agents
{
    /// <summary>
    /// Analytic two-bone IK (shoulder–elbow–wrist) with a pole hint.
    /// Produces the two joint FRAMES (forward = bone direction, up = bend
    /// plane toward the pole). Callers map frames onto their bones through a
    /// bind-time offset, so the solver works for any bone-axis convention:
    /// identity offsets for the procedural rig (+z bone axis), measured
    /// offsets for imported FBX rigs. No allocations per solve.
    /// </summary>
    public static class TwoBoneIK
    {
        public static void SolveFrames(Vector3 shoulder, float l1, float l2,
                                       Vector3 target, Vector3 poleHint,
                                       out Quaternion upperFrame, out Quaternion foreFrame)
        {
            var toTarget = target - shoulder;
            var dist = toTarget.magnitude;
            if (dist < 0.0005f)
            {
                upperFrame = foreFrame = Quaternion.identity;
                return;
            }
            var dir = toTarget / dist;
            dist = Mathf.Clamp(dist, Mathf.Abs(l1 - l2) + 0.0005f, l1 + l2 - 0.0005f);

            var poleDir = poleHint - shoulder;
            poleDir -= Vector3.Dot(poleDir, dir) * dir;
            if (poleDir.sqrMagnitude < 1e-6f)
                poleDir = Vector3.Cross(dir, Vector3.up).sqrMagnitude > 1e-6f
                    ? Vector3.Cross(dir, Vector3.up)
                    : Vector3.right;
            poleDir.Normalize();

            var cosA = Mathf.Clamp((l1 * l1 + dist * dist - l2 * l2) / (2f * l1 * dist), -1f, 1f);
            var sinA = Mathf.Sqrt(Mathf.Max(0f, 1f - cosA * cosA));
            var elbow = shoulder + dir * (cosA * l1) + poleDir * (sinA * l1);
            var clampedTarget = shoulder + dir * dist;

            upperFrame = Quaternion.LookRotation(elbow - shoulder, poleDir);
            foreFrame = Quaternion.LookRotation(clampedTarget - elbow, poleDir);
        }
    }
}
