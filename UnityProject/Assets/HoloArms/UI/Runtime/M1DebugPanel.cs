using HoloArms.Agents;
using HoloArms.Core.Config;
using HoloArms.Core.Diagnostics;
using HoloArms.Rendering;
using UnityEngine;

namespace HoloArms.UI
{
    /// <summary>
    /// Milestone 1 engineering panel (F1 to toggle): the Basic Look &amp; Depth
    /// controls from the Figma page plus quality preset and telemetry.
    /// This is an IMGUI stand-in for engineering only — the real operator UI
    /// is implemented later from the Figma design system (FigmaHandoff/),
    /// which remains the UI source of truth. Values persist via ConfigService
    /// (M1 acceptance: settings survive restart).
    /// </summary>
    public sealed class M1DebugPanel : MonoBehaviour
    {
        private IConfigService _config;
        private IQualityManager _quality;
        private IHealthMonitor _health;
        private LightRigController _lights;
        private VolumeController _volume;
        private ArmAgent _arm;
        private M1Bootstrap _bootstrap;

        private bool _visible = true;
        private static readonly string[] Presets = { "Auto", "Ultra", "High", "Balanced", "Performance" };
        private static readonly string[] RoomLights = { "Dark", "Indoor", "Bright" };
        private static readonly string[] Extensions = { "Near", "Normal", "Deep" };

        public void Bind(IConfigService config, IQualityManager quality, IHealthMonitor health,
                         LightRigController lights, VolumeController volume, ArmAgent arm)
        {
            _config = config; _quality = quality; _health = health;
            _lights = lights; _volume = volume; _arm = arm;
            _bootstrap = GetComponent<M1Bootstrap>();
        }

        private void Update()
        {
            if (Input.GetKeyDown(KeyCode.F1)) _visible = !_visible;
        }

        private void OnGUI()
        {
            if (!_visible || _config == null) return;
            var ld = _config.Config.LookDepth;
            var q = _config.Config.Quality;

            const int w = 340;
            GUILayout.BeginArea(new Rect(12, 12, w, Screen.height - 24), GUI.skin.box);
            GUILayout.Label("<b>HOLO ARMS — M1 Look & Depth</b>  (F1 hide · E extend/retract)",
                new GUIStyle(GUI.skin.label) { richText = true });

            GUILayout.Label($"FPS {_health.AverageFps:F0}  ·  frame {_health.AverageFrameTimeMs:F1} ms  ·  " +
                            $"tier: {_quality.CurrentTierName}");
            GUILayout.Label($"Arm: {_arm.State}  ·  reach {_arm.MaxReach:F2} m");

            GUILayout.Space(6);
            ld.DepthStrength = LabeledSlider("Depth Strength", ld.DepthStrength, 0, 100);
            ld.ShadowStrength = LabeledSlider("Shadow Strength", ld.ShadowStrength, 0, 100);
            ld.ShadowSoftness = LabeledSlider("Shadow Softness", ld.ShadowSoftness, 0, 100);
            ld.KeyLightAzimuthDeg = LabeledSlider("Key azimuth °", ld.KeyLightAzimuthDeg, 120, 300);
            ld.KeyLightElevationDeg = LabeledSlider("Key elevation °", ld.KeyLightElevationDeg, 10, 80);
            ld.ExposureEv = LabeledSlider("Exposure EV", ld.ExposureEv, 6f, 13f);
            ld.AoIntensity = LabeledSlider("AO intensity", ld.AoIntensity, 0f, 2.5f);
            ld.ContactShadowOpacity = LabeledSlider("Contact shadow", ld.ContactShadowOpacity, 0f, 1f);

            ld.RoomLight = Cycle("Room Light", ld.RoomLight, RoomLights);
            ld.ArmExtension = Cycle("Arm Extension", ld.ArmExtension, Extensions);
            q.Preset = Cycle("Quality preset", q.Preset, Presets);

            if (GUI.changed)
            {
                _bootstrap.ApplyLookDepth();
                _quality.ApplyPreset(q.Preset);
            }

            GUILayout.Space(8);
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Save settings")) _config.Save();
            if (GUILayout.Button("Reload")) { _config.Load(); _bootstrap.ApplyLookDepth(); }
            GUILayout.EndHorizontal();

            GUILayout.Space(8);
            GUILayout.Label("<b>Auto Quality log</b>", new GUIStyle(GUI.skin.label) { richText = true });
            var log = _quality.ChangeLog;
            for (int i = Mathf.Max(0, log.Count - 5); i < log.Count; i++)
                GUILayout.Label(log[i], new GUIStyle(GUI.skin.label) { fontSize = 10 });

            GUILayout.EndArea();
        }

        private static float LabeledSlider(string label, float value, float min, float max)
        {
            GUILayout.BeginHorizontal();
            GUILayout.Label(label, GUILayout.Width(130));
            var v = GUILayout.HorizontalSlider(value, min, max);
            GUILayout.Label(v.ToString(max <= 20f ? "F1" : "F0"), GUILayout.Width(40));
            GUILayout.EndHorizontal();
            return v;
        }

        private static string Cycle(string label, string current, string[] options)
        {
            GUILayout.BeginHorizontal();
            GUILayout.Label(label, GUILayout.Width(130));
            int idx = System.Array.IndexOf(options, current);
            if (idx < 0) idx = 0;
            if (GUILayout.Button(options[idx]))
            {
                idx = (idx + 1) % options.Length;
                GUI.changed = true;
            }
            GUILayout.EndHorizontal();
            return options[idx];
        }
    }
}
