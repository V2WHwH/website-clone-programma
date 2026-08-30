using System.Collections.Generic;
using HoloArms.Agents;
using HoloArms.Behaviour;
using HoloArms.Core;
using HoloArms.Core.Config;
using HoloArms.Core.Diagnostics;
using HoloArms.Rendering;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.HighDefinition;

namespace HoloArms.UI
{
    /// <summary>
    /// Composition root for the M1/M1.5 demo. Drop on an empty GameObject
    /// (or use HoloArms → Create M1 Scene) and press Play: wall, light rig,
    /// volume, camera, N uniquely-dressed arms with unique temperaments, the
    /// rule-based director with mandatory group tasks, and the debug panel —
    /// all from code.
    ///
    /// Viewer convention: wall front face at z = 0; camera on the -z side;
    /// arm roots hidden at z &gt; 0, extending toward -z.
    /// Keys: E extend/retract all · A add an arm · T force group task ·
    /// F1 panel.
    /// </summary>
    public sealed class M1Bootstrap : MonoBehaviour
    {
        [Tooltip("Camera distance from the wall in metres (typical viewer distance).")]
        public float ViewerDistanceM = 2.6f;
        [Tooltip("Viewer eye height in metres.")]
        public float ViewerEyeHeightM = 1.5f;

        private ServiceRegistry _services;
        private EventBus _events;
        private HealthMonitor _health;
        private ConfigService _config;
        private WallPortalSystem _wall;
        private LightRigController _lights;
        private VolumeController _volume;
        private QualityManager _quality;
        private RuleBasedBehaviourDirector _director;
        private ArmIdentityGenerator _identities;
        private TemperamentDealer _temperaments;
        private readonly List<ArmAgent> _arms = new List<ArmAgent>();
        private M1DebugPanel _panel;

        public IReadOnlyList<ArmAgent> Arms => _arms;

        private void Awake()
        {
            if (GraphicsSettings.currentRenderPipeline is not HDRenderPipelineAsset)
            {
                Debug.LogError(
                    "[HoloArms] Active render pipeline is not HDRP. Run HoloArms → Validate Setup " +
                    "or create the project from the HDRP template — the scene will look wrong without it.");
            }

            _events = new EventBus();
            _health = new HealthMonitor(2f);
            _config = new ConfigService(_events);
            _config.Load();
            var cfg = _config.Config;

            var wallGo = new GameObject("WallPortalSystem");
            _wall = wallGo.AddComponent<WallPortalSystem>();
            _wall.Build(cfg.Wall.PhysicalWidthM, cfg.Wall.PhysicalHeightM,
                        new Color(0.62f, 0.62f, 0.64f));

            var rigGo = new GameObject("LightRig");
            _lights = rigGo.AddComponent<LightRigController>();
            _lights.Build();

            var volGo = new GameObject("GlobalVolume");
            _volume = volGo.AddComponent<VolumeController>();
            _volume.Build();

            var cam = Camera.main;
            if (cam == null)
            {
                var camGo = new GameObject("Main Camera") { tag = "MainCamera" };
                cam = camGo.AddComponent<Camera>();
            }
            if (cam.GetComponent<HDAdditionalCameraData>() == null)
                cam.gameObject.AddComponent<HDAdditionalCameraData>();
            cam.transform.position = new Vector3(0f, ViewerEyeHeightM, -ViewerDistanceM);
            cam.transform.rotation = Quaternion.LookRotation(
                (new Vector3(0f, cfg.Wall.PhysicalHeightM * 0.55f, 0f) - cam.transform.position).normalized);
            cam.fieldOfView = 38f;
            cam.nearClipPlane = 0.05f;

            // Identity & personality casting (deterministic per seed).
            _identities = new ArmIdentityGenerator(cfg.Arm.IdentitySeed);
            _temperaments = new TemperamentDealer(cfg.Arm.IdentitySeed);

            var dirGo = new GameObject("BehaviourDirector");
            _director = dirGo.AddComponent<RuleBasedBehaviourDirector>();
            _director.Initialize(cfg.Wall.PhysicalWidthM, cfg.Arm.IdentitySeed);

            int count = Mathf.Clamp(cfg.Arm.ArmCount, 1, 12);
            for (int i = 0; i < count; i++) SpawnArm();

            _quality = new QualityManager(_health, _events, _lights, _volume,
                                          cfg.Quality.TargetFps, cfg.Quality.RenderScaleMin);
            _quality.ApplyPreset(cfg.Quality.Preset);

            _services = new ServiceRegistry();
            _services.Register<IEventBus>(_events);
            _services.Register<IHealthMonitor>(_health);
            _services.Register<IConfigService>(_config);
            _services.Register<IQualityManager>(_quality);

            _panel = gameObject.AddComponent<M1DebugPanel>();
            _panel.Bind(_config, _quality, _health, _lights, _volume, this, _director);

            ApplyLookDepth();
            foreach (var a in _arms) a.Extend();
        }

        /// <summary>Adds one arm with a fresh unique identity + temperament, spread across the wall.</summary>
        public ArmAgent SpawnArm()
        {
            var cfg = _config.Config;
            int index = _arms.Count;
            var identity = _identities.Generate();
            var personality = new PersonalityProfile(_temperaments.Deal());

            // Spread anchors across the wall width; stagger heights slightly.
            float usable = cfg.Wall.PhysicalWidthM * 0.72f;
            float x = _arms.Count == 0 ? 0f
                : (index % 2 == 1 ? 1f : -1f) * usable * 0.5f * ((index + 1) / 2) / 3f;
            float y = cfg.Arm.AnchorY + (index % 3 - 1) * 0.22f;

            var go = new GameObject($"ArmAgent {(index + 1):00}");
            var arm = go.AddComponent<ArmAgent>();
            arm.Initialize($"A-{index + 1:00}", _wall, x, y, identity, personality);
            arm.ConfigureDepth(cfg.LookDepth.DepthStrength, cfg.LookDepth.ArmExtension);
            arm.Extend();
            _arms.Add(arm);
            _director.Register(arm);
            Debug.Log($"[HoloArms] Spawned {arm.ArmId}: {personality.Temperament} · {identity.Describe()}");
            return arm;
        }

        public void ApplyLookDepth()
        {
            var ld = _config.Config.LookDepth;
            _lights.SetKeyDirection(ld.KeyLightAzimuthDeg, ld.KeyLightElevationDeg);
            _lights.SetShadowStrength(ld.ShadowStrength);
            _lights.SetShadowSoftness(ld.ShadowSoftness);
            _lights.ApplyRoomPreset(ld.RoomLight);
            _lights.SetContactShadows(true);
            _volume.SetExposureEv(ld.ExposureEv);
            _volume.SetAoIntensity(ld.AoIntensity);
            _volume.SetContactShadows(true, ld.ContactShadowOpacity, 0.25f);
            foreach (var a in _arms) a.ConfigureDepth(ld.DepthStrength, ld.ArmExtension);
        }

        private void Update()
        {
            _health.Tick(Time.unscaledDeltaTime);
            _quality.Tick();

            if (Input.GetKeyDown(KeyCode.E)) foreach (var a in _arms) a.Toggle();
            if (Input.GetKeyDown(KeyCode.A))
            {
                SpawnArm();
                _config.Config.Arm.ArmCount = _arms.Count;
            }
            if (Input.GetKeyDown(KeyCode.T)) _director.TriggerGroupTask(ArmTaskType.PointAt);
        }
    }
}
