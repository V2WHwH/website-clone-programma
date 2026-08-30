using HoloArms.Agents;
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
    /// Milestone 1 composition root. Drop this on an empty GameObject in an
    /// empty scene (or use the menu HoloArms → Create M1 Scene) and press
    /// Play: it builds wall, light rig, volume, camera, one ArmAgent and the
    /// debug panel entirely from code, loads persisted settings, and starts
    /// the quality controller.
    ///
    /// Viewer convention: the wall's front face is the plane z = 0; the
    /// camera sits on the -z side; the arm root hides at z &gt; 0 inside the
    /// wall and extends toward -z.
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
        private ArmAgent _arm;
        private M1DebugPanel _panel;

        private void Awake()
        {
            if (GraphicsSettings.currentRenderPipeline is not HDRenderPipelineAsset)
            {
                Debug.LogError(
                    "[HoloArms] Active render pipeline is not HDRP. Assign an HD Render Pipeline " +
                    "asset (menu HoloArms → Validate Setup, or create the project from the HDRP " +
                    "template) — the M1 scene will look wrong without it.");
            }

            _events = new EventBus();
            _health = new HealthMonitor(2f);
            _config = new ConfigService(_events);
            _config.Load();
            var cfg = _config.Config;

            // --- Wall (the portal plane) ---
            var wallGo = new GameObject("WallPortalSystem");
            _wall = wallGo.AddComponent<WallPortalSystem>();
            _wall.Build(cfg.Wall.PhysicalWidthM, cfg.Wall.PhysicalHeightM,
                        new Color(0.62f, 0.62f, 0.64f));

            // --- Lights & volume ---
            var rigGo = new GameObject("LightRig");
            _lights = rigGo.AddComponent<LightRigController>();
            _lights.Build();

            var volGo = new GameObject("GlobalVolume");
            _volume = volGo.AddComponent<VolumeController>();
            _volume.Build();

            // --- Camera (4K portrait profile: 2160x3840 → aspect 9:16) ---
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

            // --- The arm ---
            var armGo = new GameObject("ArmAgent R-01");
            _arm = armGo.AddComponent<ArmAgent>();
            _arm.Initialize("R-01", _wall, cfg.Arm.AnchorX, cfg.Arm.AnchorY,
                            cfg.Arm.Side == "Left", cfg.Arm.ArmScale);

            // --- Quality ---
            _quality = new QualityManager(_health, _events, _lights, _volume,
                                          cfg.Quality.TargetFps, cfg.Quality.RenderScaleMin);
            _quality.ApplyPreset(cfg.Quality.Preset);

            // --- Services + panel ---
            _services = new ServiceRegistry();
            _services.Register<IEventBus>(_events);
            _services.Register<IHealthMonitor>(_health);
            _services.Register<IConfigService>(_config);
            _services.Register<IQualityManager>(_quality);

            _panel = gameObject.AddComponent<M1DebugPanel>();
            _panel.Bind(_config, _quality, _health, _lights, _volume, _arm);

            ApplyLookDepth();
            _arm.Extend();
        }

        /// <summary>Pushes every Look &amp; Depth config value into the live scene.</summary>
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
            _arm.ConfigureDepth(ld.DepthStrength, ld.ArmExtension);
        }

        private void Update()
        {
            _health.Tick(Time.unscaledDeltaTime);
            _quality.Tick();

            if (Input.GetKeyDown(KeyCode.E)) _arm.Toggle();
        }
    }
}
