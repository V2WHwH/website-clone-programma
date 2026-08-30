using HoloArms.Rendering;
using UnityEngine;

namespace HoloArms.Agents
{
    /// <summary>
    /// Milestone 1 ArmAgent: one arm anchored to the wall, root BEHIND the
    /// wall plane so depth testing hides everything not yet emerged.
    /// States: Hidden → Emerging → Extended → Retracting. The IK target
    /// carries idle sway + micro motion; extension depth is driven by the
    /// Look &amp; Depth "Depth Strength" and Arm Extension preset.
    /// The full ArmAgent component set from spec §5 (emotion, social
    /// behaviour, grip, replication) grows on this class in M2+.
    /// </summary>
    public sealed class ArmAgent : MonoBehaviour
    {
        public enum ArmState { Hidden, Emerging, Extended, Retracting }

        public ArmState State { get; private set; } = ArmState.Hidden;
        public string ArmId { get; private set; }
        public bool LeftSide { get; private set; }

        private ProceduralArmRig _rig;
        private WallPortalSystem _wall;
        private Vector3 _anchorWorld;      // point on the wall plane (z = 0)
        private float _extension;          // 0 = fully behind wall, 1 = fully extended
        private float _extensionTarget;
        private float _maxDepth = 0.45f;   // metres in front of the wall at extension 1
        private float _armScale = 1f;
        private float _swayPhase;

        public float MaxReach => _rig != null ? _rig.UpperLen + _rig.ForeLen : 0f;

        public void Initialize(string armId, WallPortalSystem wall, float anchorX, float anchorY,
                               bool leftSide, float armScale)
        {
            ArmId = armId;
            _wall = wall;
            LeftSide = leftSide;
            _armScale = armScale;
            _anchorWorld = wall.AnchorToWorld(anchorX, anchorY);

            _rig = ProceduralArmBuilder.Build(transform, armScale, leftSide);
            // Root sits behind the wall: the shoulder never crosses z = 0.
            _rig.Root.position = _anchorWorld + new Vector3(0f, 0f, 0.10f);
            _swayPhase = Random.value * 100f;
            ApplyIk(BehindWallTarget());
        }

        /// <summary>Depth Strength 0–100 and extension preset → world depth of full extension.</summary>
        public void ConfigureDepth(float depthStrength0To100, string extensionPreset)
        {
            float presetScale = extensionPreset == "Near" ? 0.6f : extensionPreset == "Deep" ? 1.35f : 1f;
            // Depth clamps inside the arm's physical reach so IK never locks out.
            _maxDepth = Mathf.Min(
                Mathf.Lerp(0.15f, 0.55f, depthStrength0To100 / 100f) * presetScale * _armScale,
                MaxReach * 0.92f);
        }

        public void Extend() { _extensionTarget = 1f; if (State == ArmState.Hidden) State = ArmState.Emerging; }
        public void Retract() { _extensionTarget = 0f; State = ArmState.Retracting; }
        public void Toggle() { if (_extensionTarget > 0.5f) Retract(); else Extend(); }

        private void Update()
        {
            // Critically-damped-ish extension progress (no snapping).
            _extension = Mathf.MoveTowards(_extension, _extensionTarget, Time.deltaTime * 0.8f);
            if (State == ArmState.Emerging && _extension >= 0.999f) State = ArmState.Extended;
            if (State == ArmState.Retracting && _extension <= 0.001f) State = ArmState.Hidden;

            ApplyIk(CurrentTarget());
        }

        private Vector3 BehindWallTarget() => _anchorWorld + new Vector3(0f, 0f, 0.06f);

        private Vector3 CurrentTarget()
        {
            // Idle sway + finger-height micro motion via layered Perlin noise
            // (spec §12 micro motion layer, minimal M1 version).
            float t = Time.time * 0.35f + _swayPhase;
            float sway = (Mathf.PerlinNoise(t, 0.3f) - 0.5f) * 0.14f;
            float bob = (Mathf.PerlinNoise(0.7f, t * 1.3f) - 0.5f) * 0.10f;
            float micro = (Mathf.PerlinNoise(t * 4.1f, 7.7f) - 0.5f) * 0.012f;

            float depth = Mathf.SmoothStep(-0.06f, _maxDepth, _extension);
            var extended = _anchorWorld + new Vector3(
                sway * _extension,
                bob * _extension + micro,
                -depth); // -z = toward the viewer
            return extended;
        }

        private void ApplyIk(Vector3 target)
        {
            if (_rig == null) return;
            // Elbow pole: below and slightly to the outside, natural hang.
            var pole = _rig.Root.position + new Vector3(LeftSide ? 0.25f : -0.25f, -0.6f, -0.1f);
            TwoBoneIK.Solve(_rig.Upper, _rig.Fore, _rig.UpperLen, _rig.ForeLen, target, pole);
            // Hand keeps forearm orientation with a relaxed downward tilt.
            _rig.Hand.localRotation = Quaternion.Euler(12f, 0f, 0f);
        }
    }
}
