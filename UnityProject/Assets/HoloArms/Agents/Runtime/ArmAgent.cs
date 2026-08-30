using HoloArms.Rendering;
using UnityEngine;

namespace HoloArms.Agents
{
    public enum ArmTaskType { None, PointAt, Offer }

    /// <summary>
    /// An arm with an identity and a personality (Docs/10). The root hides
    /// BEHIND the wall plane (z &gt; 0); ordinary depth testing occludes
    /// everything not yet emerged. Idle motion is shaped by temperament +
    /// emotion; group tasks from the director are MANDATORY — personality
    /// only colors reaction delay, speed, posture and hesitation, never
    /// participation (cooperation contract).
    /// </summary>
    public sealed class ArmAgent : MonoBehaviour
    {
        public enum ArmState { Hidden, Emerging, Extended, Retracting }

        public ArmState State { get; private set; } = ArmState.Hidden;
        public string ArmId { get; private set; }
        public bool LeftSide { get; private set; }
        public ArmIdentityProfile Identity { get; private set; }
        public PersonalityProfile Personality { get; private set; }
        public ArmTaskType CurrentTask => _task;

        private ProceduralArmRig _rig;
        private Vector3 _anchorWorld;
        private float _extension;
        private float _extensionTarget;
        private float _maxDepth = 0.45f;
        private float _swayPhase;

        // Group task state
        private ArmTaskType _task = ArmTaskType.None;
        private Vector3 _taskTarget;
        private float _taskAssignedAt;
        private float _reactionDelay;
        private Vector3 _currentIkTarget;

        public float MaxReach => _rig != null ? _rig.UpperLen + _rig.ForeLen : 0f;

        public void Initialize(string armId, WallPortalSystem wall, float anchorX, float anchorY,
                               ArmIdentityProfile identity, PersonalityProfile personality)
        {
            ArmId = armId;
            Identity = identity;
            Personality = personality;
            LeftSide = anchorX <= 0f; // side purely from wall position
            _anchorWorld = wall.AnchorToWorld(anchorX, anchorY);

            _rig = ProceduralArmBuilder.Build(transform, identity, LeftSide);
            _rig.Root.position = _anchorWorld + new Vector3(0f, 0f, 0.10f);
            _swayPhase = Mathf.Abs(armId.GetHashCode() % 1000) * 0.1f;
            _currentIkTarget = BehindWallTarget();
            ApplyIk(_currentIkTarget);
        }

        public void ConfigureDepth(float depthStrength0To100, string extensionPreset)
        {
            float presetScale = extensionPreset == "Near" ? 0.6f : extensionPreset == "Deep" ? 1.35f : 1f;
            _maxDepth = Mathf.Min(
                Mathf.Lerp(0.15f, 0.55f, depthStrength0To100 / 100f) * presetScale * Identity.ArmScale,
                MaxReach * 0.92f);
        }

        public void Extend() { _extensionTarget = 1f; if (State == ArmState.Hidden) State = ArmState.Emerging; }
        public void Retract() { _extensionTarget = 0f; State = ArmState.Retracting; }
        public void Toggle() { if (_extensionTarget > 0.5f) Retract(); else Extend(); }

        public void SetEmotion(EmotionState emotion) => Personality.SetEmotion(emotion);

        // ----- Cooperation contract (Docs/10 §3) -----

        /// <summary>Mandatory group task. Always accepted; style is personal.</summary>
        public void AssignTask(ArmTaskType type, Vector3 worldTarget)
        {
            if (_task != type)
            {
                _taskAssignedAt = Time.time;
                _reactionDelay = Personality.CurrentStyle().ReactionDelay;
            }
            _task = type;
            _taskTarget = worldTarget;
            if (type != ArmTaskType.None) Extend();
        }

        public void UpdateTaskTarget(Vector3 worldTarget) => _taskTarget = worldTarget;
        public void ClearTask() => _task = ArmTaskType.None;

        private void Update()
        {
            var style = Personality.CurrentStyle();

            float extendRate = Mathf.Lerp(0.4f, 1.4f, style.MoveSpeed / 1.5f);
            _extension = Mathf.MoveTowards(_extension, _extensionTarget, Time.deltaTime * extendRate);
            if (State == ArmState.Emerging && _extension >= 0.999f) State = ArmState.Extended;
            if (State == ArmState.Retracting && _extension <= 0.001f) State = ArmState.Hidden;

            var desired = DesiredTarget(style);
            // Personality-speed approach with hesitation wobble (bounded so
            // group actions stay legible from a distance).
            float speed = style.MoveSpeed * (0.7f + 0.3f * _extension);
            _currentIkTarget = Vector3.MoveTowards(_currentIkTarget, desired, speed * Time.deltaTime);
            if (style.Hesitation > 0.01f && _task != ArmTaskType.None)
            {
                float w = style.Hesitation * 0.012f;
                _currentIkTarget += new Vector3(
                    (Mathf.PerlinNoise(Time.time * 3.7f, _swayPhase) - 0.5f) * w,
                    (Mathf.PerlinNoise(_swayPhase, Time.time * 4.3f) - 0.5f) * w, 0f);
            }
            ApplyIk(_currentIkTarget);
        }

        private Vector3 BehindWallTarget() => _anchorWorld + new Vector3(0f, 0f, 0.06f);

        private Vector3 DesiredTarget(MotionStyle style)
        {
            bool reacting = _task != ArmTaskType.None &&
                            Time.time >= _taskAssignedAt + _reactionDelay;

            if (reacting && _extension > 0.3f)
            {
                var shoulder = _rig.Root.position;
                switch (_task)
                {
                    case ArmTaskType.PointAt:
                    {
                        // Point: extend along the direction toward the target.
                        var dir = (_taskTarget - shoulder).normalized;
                        return shoulder + dir * (MaxReach * 0.93f);
                    }
                    case ArmTaskType.Offer:
                    {
                        // Offer: present forward at chest height toward the viewer.
                        return _anchorWorld + new Vector3(0f, style.PostureLift * 0.5f, -_maxDepth);
                    }
                }
            }

            // Temperament/emotion-driven idling.
            float t = Time.time * style.SwaySpeed + _swayPhase;
            float sway = (Mathf.PerlinNoise(t, 0.3f) - 0.5f) * 2f * style.SwayAmplitude;
            float bob = (Mathf.PerlinNoise(0.7f, t * 1.3f) - 0.5f) * 2f * style.SwayAmplitude * 0.7f;
            float micro = (Mathf.PerlinNoise(t * 4.1f, 7.7f) - 0.5f) * 2f * style.MicroMotion;

            float depth = Mathf.SmoothStep(-0.06f, _maxDepth + style.PostureForward, _extension);
            return _anchorWorld + new Vector3(
                sway * _extension,
                (bob + style.PostureLift) * _extension + micro,
                -depth);
        }

        private void ApplyIk(Vector3 target)
        {
            if (_rig == null) return;
            var pole = _rig.Root.position + new Vector3(LeftSide ? 0.25f : -0.25f, -0.6f, -0.1f);
            TwoBoneIK.Solve(_rig.Upper, _rig.Fore, _rig.UpperLen, _rig.ForeLen, target, pole);
            _rig.Hand.localRotation = Quaternion.Euler(_task == ArmTaskType.Offer ? -20f : 12f, 0f, 0f);
        }
    }
}
