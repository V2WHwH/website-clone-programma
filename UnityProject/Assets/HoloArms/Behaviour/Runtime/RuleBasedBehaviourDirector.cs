using System.Collections.Generic;
using HoloArms.Agents;
using UnityEngine;

namespace HoloArms.Behaviour
{
    /// <summary>
    /// v1 of IBehaviourDirector (spec §16): rule-based, no AI required.
    /// Issues MANDATORY group tasks to every registered arm (cooperation
    /// contract, Docs/10 §3) — pointing at a passerby, offering toward the
    /// viewer — and rotates per-arm emotions between tasks so the wall
    /// never looks mechanically repetitive.
    ///
    /// Until real tracking lands (M5) a virtual passerby walks along the
    /// wall; the same task API will be fed by PersonTrack events later.
    /// </summary>
    public sealed class RuleBasedBehaviourDirector : MonoBehaviour
    {
        private readonly List<ArmAgent> _arms = new List<ArmAgent>();
        private System.Random _rng;

        private float _wallWidth = 1.35f;
        private float _nextTaskAt;
        private float _taskEndsAt;
        private ArmTaskType _activeTask = ArmTaskType.None;

        // Virtual passerby
        private float _walkerX;
        private int _walkerDir = 1;
        private const float WalkerSpeed = 0.55f;   // m/s
        private const float WalkerZ = -1.3f;       // in front of the wall
        private const float WalkerY = 1.6f;

        public ArmTaskType ActiveTask => _activeTask;
        public Vector3 WalkerPosition { get; private set; }

        public void Initialize(float wallWidthM, int seed)
        {
            _wallWidth = wallWidthM;
            _rng = new System.Random(seed);
            _walkerX = -_wallWidth;
            _nextTaskAt = Time.time + 6f;
        }

        public void Register(ArmAgent arm)
        {
            if (!_arms.Contains(arm)) _arms.Add(arm);
        }

        /// <summary>Force a group task now (debug key / future campaign trigger).</summary>
        public void TriggerGroupTask(ArmTaskType type)
        {
            StartTask(type == ArmTaskType.None ? ArmTaskType.PointAt : type);
        }

        private void Update()
        {
            // Virtual passerby walks back and forth in front of the wall.
            _walkerX += _walkerDir * WalkerSpeed * Time.deltaTime;
            float limit = _wallWidth * 0.9f;
            if (Mathf.Abs(_walkerX) > limit) { _walkerDir = -_walkerDir; _walkerX = Mathf.Clamp(_walkerX, -limit, limit); }
            WalkerPosition = new Vector3(_walkerX, WalkerY, WalkerZ);

            var now = Time.time;
            if (_activeTask != ArmTaskType.None)
            {
                if (now >= _taskEndsAt) EndTask();
                else if (_activeTask == ArmTaskType.PointAt)
                    foreach (var a in _arms) a.UpdateTaskTarget(WalkerPosition);
                return;
            }

            if (now >= _nextTaskAt && _arms.Count > 0)
            {
                // 60% point at the passerby, 40% offer toward the viewer.
                StartTask(_rng.NextDouble() < 0.6 ? ArmTaskType.PointAt : ArmTaskType.Offer);
            }
        }

        private void StartTask(ArmTaskType type)
        {
            _activeTask = type;
            _taskEndsAt = Time.time + (type == ArmTaskType.PointAt ? 7f : 5f);
            foreach (var a in _arms)
                a.AssignTask(type, type == ArmTaskType.PointAt ? WalkerPosition : Vector3.zero);
            Debug.Log($"[HoloArms.Director] Group task {type} → {_arms.Count} arm(s) (mandatory; style is personal)");
        }

        private void EndTask()
        {
            _activeTask = ArmTaskType.None;
            foreach (var a in _arms)
            {
                a.ClearTask();
                // Rotate emotions between tasks: mostly back to the
                // temperament default, sometimes a fresh color.
                if (_rng.NextDouble() < 0.35)
                {
                    var all = (EmotionState[])System.Enum.GetValues(typeof(EmotionState));
                    a.SetEmotion(all[_rng.Next(all.Length)]);
                }
                else
                {
                    a.SetEmotion(PersonalityProfile.DefaultEmotion(a.Personality.Temperament));
                }
            }
            // Cooldown/frequency cap (spec §14) — 12–24 s between group tasks.
            _nextTaskAt = Time.time + 12f + (float)_rng.NextDouble() * 12f;
        }
    }
}
