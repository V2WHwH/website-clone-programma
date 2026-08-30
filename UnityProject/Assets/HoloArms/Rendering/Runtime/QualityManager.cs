using System;
using System.Collections.Generic;
using HoloArms.Core;
using HoloArms.Core.Diagnostics;
using UnityEngine;
using UnityEngine.Rendering;

namespace HoloArms.Rendering
{
    public interface IQualityManager
    {
        string Preset { get; }
        int CurrentTier { get; }
        string CurrentTierName { get; }
        bool AutoEnabled { get; }
        IReadOnlyList<string> ChangeLog { get; }
        void ApplyPreset(string preset);
        void Tick();
    }

    /// <summary>
    /// Quality presets + Auto Quality Controller (spec §9).
    ///
    /// Tiers degrade in the mandated order — non-critical effects first,
    /// then shadow resolution, then AO, then render scale — and the arm's
    /// skin/finger quality is untouched by every tier. Hysteresis on the
    /// averaged frame time: degrade after a sustained overrun, upgrade only
    /// after long sustained headroom. Every automatic change is logged and
    /// published as a QualityChangedEvent.
    ///
    /// Render scale uses HDRP dynamic resolution
    /// (DynamicResolutionHandler.SetDynamicResScaler); it only bites when
    /// "Dynamic Resolution" is ticked in the HDRP asset — the setup wizard
    /// reminds you, and without it the other tiers still work.
    /// </summary>
    public sealed class QualityManager : IQualityManager
    {
        private const int TierCount = 5;
        private static readonly string[] TierNames =
        {
            "Ultra", "High (reduced effects)", "Balanced (reduced shadows)",
            "Performance (reduced AO)", "Floor (reduced render scale)"
        };

        private readonly IHealthMonitor _health;
        private readonly IEventBus _events;
        private readonly LightRigController _lights;
        private readonly VolumeController _volume;
        private readonly List<string> _log = new List<string>();

        private float _budgetMs = 1000f / 60f;
        private float _overrunSince = -1f;
        private float _headroomSince = -1f;
        private int _tier;
        private float _renderScalePct = 100f;
        private float _renderScaleMinPct = 65f;
        private bool _scalerInstalled;

        public string Preset { get; private set; } = "Auto";
        public bool AutoEnabled => Preset == "Auto";
        public int CurrentTier => _tier;
        public string CurrentTierName => TierNames[Mathf.Clamp(_tier, 0, TierCount - 1)];
        public IReadOnlyList<string> ChangeLog => _log;

        public QualityManager(IHealthMonitor health, IEventBus events,
                              LightRigController lights, VolumeController volume,
                              int targetFps, float renderScaleMin)
        {
            _health = health;
            _events = events;
            _lights = lights;
            _volume = volume;
            _budgetMs = 1000f / Mathf.Max(30, targetFps);
            _renderScaleMinPct = Mathf.Clamp(renderScaleMin * 100f, 50f, 100f);
            InstallScaler();
        }

        private void InstallScaler()
        {
            try
            {
                DynamicResolutionHandler.SetDynamicResScaler(
                    () => _renderScalePct,
                    DynamicResScalePolicyType.ReturnsPercentage);
                _scalerInstalled = true;
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[HoloArms.Quality] Dynamic resolution scaler unavailable: {e.Message}");
            }
        }

        public void ApplyPreset(string preset)
        {
            Preset = preset;
            switch (preset)
            {
                case "Ultra": SetTier(0, "preset Ultra"); break;
                case "High": SetTier(1, "preset High"); break;
                case "Balanced": SetTier(2, "preset Balanced"); break;
                case "Performance": SetTier(3, "preset Performance"); break;
                case "Auto": SetTier(Mathf.Clamp(_tier, 0, TierCount - 1), "preset Auto (controller active)"); break;
                default: Log($"unknown preset '{preset}' ignored"); break;
            }
        }

        public void Tick()
        {
            if (!AutoEnabled) return;
            var now = Time.unscaledTime;
            var avg = _health.AverageFrameTimeMs;

            // Sustained overrun (>1.15x budget for 3 s) → degrade one tier.
            if (avg > _budgetMs * 1.15f)
            {
                _headroomSince = -1f;
                if (_overrunSince < 0f) _overrunSince = now;
                else if (now - _overrunSince > 3f && _tier < TierCount - 1)
                {
                    SetTier(_tier + 1, $"frame {avg:F1} ms > budget {_budgetMs:F1} ms (sustained)");
                    _overrunSince = -1f;
                }
            }
            // Sustained headroom (<0.8x budget for 10 s) → upgrade one tier.
            else if (avg < _budgetMs * 0.80f)
            {
                _overrunSince = -1f;
                if (_headroomSince < 0f) _headroomSince = now;
                else if (now - _headroomSince > 10f && _tier > 0)
                {
                    SetTier(_tier - 1, $"headroom {avg:F1} ms (sustained)");
                    _headroomSince = -1f;
                }
            }
            else
            {
                _overrunSince = -1f;
                _headroomSince = -1f;
            }
        }

        private void SetTier(int tier, string reason)
        {
            var from = CurrentTierName;
            _tier = Mathf.Clamp(tier, 0, TierCount - 1);

            // Cumulative application, spec §9 order. Skin/finger quality of
            // the arm is deliberately absent from every tier.
            bool contactShadows = true;
            int shadowRes = 4096;
            bool ao = true;
            float aoIntensityScale = 1f;
            _renderScalePct = 100f;

            switch (_tier)
            {
                case 0: // Ultra
                    shadowRes = 4096; break;
                case 1: // reduced non-critical effects
                    shadowRes = 2048; break;
                case 2: // reduced shadow resolution
                    shadowRes = 1024; break;
                case 3: // reduced AO / secondary lighting
                    shadowRes = 1024; aoIntensityScale = 0.5f; break;
                case 4: // reduced render scale (last resort before health warning)
                    shadowRes = 1024; ao = false; _renderScalePct = _renderScaleMinPct; break;
            }

            _lights.SetShadowResolution(shadowRes);
            _lights.SetContactShadows(contactShadows); // presence protected at every tier
            _volume.SetAoEnabled(ao);
            if (ao) _volume.SetAoIntensity(aoIntensityScale);

            if (_tier == TierCount - 1)
                Debug.LogWarning("[HoloArms.Quality] Lowest tier active — if FPS is still under target, raise a health warning instead of degrading the illusion further.");

            Log($"{from} → {CurrentTierName} ({reason})");
            _events.Publish(new QualityChangedEvent(from, CurrentTierName, reason));
        }

        private void Log(string msg)
        {
            var line = $"{Time.unscaledTime:F1}s  {msg}";
            _log.Add(line);
            if (_log.Count > 50) _log.RemoveAt(0);
            Debug.Log($"[HoloArms.Quality] {msg}");
        }
    }
}
