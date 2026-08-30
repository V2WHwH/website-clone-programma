using HoloArms.Agents;
using HoloArms.Behaviour;
using HoloArms.Core.Config;
using HoloArms.Core.Diagnostics;
using HoloArms.Rendering;
using UnityEngine;

namespace HoloArms.UI
{
    /// <summary>
    /// M1/M1.5 engineering panel (F1): Basic Look &amp; Depth controls,
    /// quality preset, telemetry, and the cast list — every arm's identity
    /// and temperament, plus the director's current group task. IMGUI
    /// stand-in only; the operator UI comes from the Figma system.
    /// </summary>
    public sealed class M1DebugPanel : MonoBehaviour
    {
        private IConfigService _config;
        private IQualityManager _quality;
        private IHealthMonitor _health;
        private LightRigController _lights;
        private VolumeController _volume;
        private M1Bootstrap _bootstrap;
        private RuleBasedBehaviourDirector _director;

        private bool _visible = true;
        private Vector2 _castScroll;
        private static readonly string[] Presets = { "Auto", "Ultra", "High", "Balanced", "Performance" };
        private static readonly string[] RoomLights = { "Dark", "Indoor", "Bright" };
        private static readonly string[] Extensions = { "Near", "Normal", "Deep" };

        public void Bind(IConfigService config, IQualityManager quality, IHealthMonitor health,
                         LightRigController lights, VolumeController volume,
                         M1Bootstrap bootstrap, RuleBasedBehaviourDirector director)
        {
            _config = config; _quality = quality; _health = health;
            _lights = lights; _volume = volume;
            _bootstrap = bootstrap; _director = director;
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

            const int w = 360;
            GUILayout.BeginArea(new Rect(12, 12, w, Screen.height - 24), GUI.skin.box);
            GUILayout.Label("<b>HOLO ARMS — M1 panel</b>  (F1 hide · E extend · A add arm · T group task)",
                new GUIStyle(GUI.skin.label) { richText = true });

            GUILayout.Label($"FPS {_health.AverageFps:F0} · frame {_health.AverageFrameTimeMs:F1} ms · " +
                            $"tier {_quality.CurrentTierName}");
            GUILayout.Label($"Group task: {_director.ActiveTask} · arms: {_bootstrap.Arms.Count}");

            GUILayout.Space(4);
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

            GUILayout.Space(6);
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Save settings")) _config.Save();
            if (GUILayout.Button("Reload")) { _config.Load(); _bootstrap.ApplyLookDepth(); }
            GUILayout.EndHorizontal();

            GUILayout.Space(6);
            GUILayout.Label("<b>Cast</b> (unique identity + temperament per arm)",
                new GUIStyle(GUI.skin.label) { richText = true });
            _castScroll = GUILayout.BeginScrollView(_castScroll, GUILayout.Height(150));
            foreach (var arm in _bootstrap.Arms)
            {
                GUILayout.Label(
                    $"{arm.ArmId} [{arm.Personality.Temperament}/{arm.Personality.Emotion}] " +
                    arm.Identity.Describe(),
                    new GUIStyle(GUI.skin.label) { fontSize = 10 });
            }
            GUILayout.EndScrollView();

            GUILayout.Label("<b>Auto Quality log</b>", new GUIStyle(GUI.skin.label) { richText = true });
            var log = _quality.ChangeLog;
            for (int i = Mathf.Max(0, log.Count - 4); i < log.Count; i++)
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
