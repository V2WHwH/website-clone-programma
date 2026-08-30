using UnityEngine;

namespace HoloArms.Core.Diagnostics
{
    public interface IHealthMonitor
    {
        float AverageFrameTimeMs { get; }
        float AverageFps { get; }
        void Tick(float unscaledDeltaTime);
    }

    /// <summary>
    /// Rolling frame-time average used by the Auto Quality Controller and the
    /// debug panel. Exponential moving average over roughly the configured
    /// window; no per-frame allocation.
    /// </summary>
    public sealed class HealthMonitor : IHealthMonitor
    {
        private readonly float _windowSeconds;
        private float _avgMs = 16.7f;
        private bool _first = true;

        public HealthMonitor(float windowSeconds = 2f)
        {
            _windowSeconds = Mathf.Max(0.25f, windowSeconds);
        }

        public float AverageFrameTimeMs => _avgMs;
        public float AverageFps => _avgMs > 0.01f ? 1000f / _avgMs : 0f;

        public void Tick(float unscaledDeltaTime)
        {
            var ms = unscaledDeltaTime * 1000f;
            if (_first) { _avgMs = ms; _first = false; return; }
            // EMA whose time constant matches the window.
            var alpha = Mathf.Clamp01(unscaledDeltaTime / _windowSeconds);
            _avgMs = Mathf.Lerp(_avgMs, ms, alpha);
        }
    }
}
