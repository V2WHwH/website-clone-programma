using UnityEngine;
using UnityEngine.Rendering.HighDefinition;

namespace HoloArms.Rendering
{
    /// <summary>
    /// Key / fill / rim rig driven by Look &amp; Depth values (spec §8).
    /// Shadow direction follows key-light azimuth/elevation in real time —
    /// Milestone 1 acceptance requires the wall shadow to react live.
    ///
    /// NOTE: this file and VolumeController.cs concentrate every
    /// HDRP-version-specific API call. If a HDRP upgrade moves a member,
    /// fix it here — nothing else in the codebase talks to HDRP lights.
    /// </summary>
    public sealed class LightRigController : MonoBehaviour
    {
        private Light _key;
        private HDAdditionalLightData _keyHd;
        private Light _fill;
        private Light _rim;

        private float _azimuthDeg = 215f;
        private float _elevationDeg = 40f;

        // Room Light Match presets: key lux, fill lux, key tint.
        private static readonly (string name, float key, float fill, Color tint)[] RoomPresets =
        {
            ("Dark",   4000f,  300f, new Color(0.85f, 0.88f, 1.00f)),
            ("Indoor", 10000f, 900f, new Color(1.00f, 0.97f, 0.92f)),
            ("Bright", 25000f, 2500f, new Color(1.00f, 1.00f, 1.00f)),
        };

        public void Build()
        {
            _key = CreateLight("KeyLight", LightType.Directional, out _keyHd);
            _key.shadows = LightShadows.Soft;

            _fill = CreateLight("FillLight", LightType.Directional, out _);
            _fill.shadows = LightShadows.None;
            _fill.transform.rotation = Quaternion.Euler(35f, 160f, 0f);

            _rim = CreateLight("RimLight", LightType.Directional, out _);
            _rim.shadows = LightShadows.None;
            _rim.transform.rotation = Quaternion.Euler(10f, 355f, 0f);
            _rim.intensity = 1200f;
            _rim.color = new Color(0.7f, 0.85f, 1f);

            ApplyRoomPreset("Indoor");
            SetKeyDirection(_azimuthDeg, _elevationDeg);
            SetShadowResolution(2048);
        }

        private Light CreateLight(string name, LightType type, out HDAdditionalLightData hd)
        {
            var go = new GameObject(name);
            go.transform.SetParent(transform, false);
            var l = go.AddComponent<Light>();
            l.type = type;
            hd = go.AddComponent<HDAdditionalLightData>();
            return l;
        }

        /// <summary>Azimuth: degrees around Y (0 = facing the wall from +z). Elevation: degrees downward tilt.</summary>
        public void SetKeyDirection(float azimuthDeg, float elevationDeg)
        {
            _azimuthDeg = azimuthDeg;
            _elevationDeg = Mathf.Clamp(elevationDeg, 5f, 85f);
            _key.transform.rotation = Quaternion.Euler(_elevationDeg, _azimuthDeg, 0f);
        }

        public float AzimuthDeg => _azimuthDeg;
        public float ElevationDeg => _elevationDeg;

        /// <summary>Shadow Strength 0–100 → shadow dimmer.</summary>
        public void SetShadowStrength(float strength01To100)
        {
            var t = Mathf.Clamp01(strength01To100 / 100f);
            _key.shadowStrength = t; // honored by HDRP shadow dimmer
            if (_keyHd != null) _keyHd.shadowDimmer = t;
        }

        /// <summary>Shadow Softness 0–100 → angular diameter of the key light (softer penumbra).</summary>
        public void SetShadowSoftness(float softness01To100)
        {
            if (_keyHd == null) return;
            var t = Mathf.Clamp01(softness01To100 / 100f);
            _keyHd.angularDiameter = Mathf.Lerp(0.5f, 8f, t);
        }

        public void ApplyRoomPreset(string presetName)
        {
            foreach (var p in RoomPresets)
            {
                if (p.name != presetName) continue;
                _key.intensity = p.key;
                _key.color = p.tint;
                _fill.intensity = p.fill;
                return;
            }
            Debug.LogWarning($"[HoloArms.LightRig] Unknown room preset '{presetName}'");
        }

        public void SetShadowResolution(int resolution)
        {
            if (_keyHd == null) return;
            _keyHd.shadowResolution.useOverride = true;
            _keyHd.shadowResolution.@override = resolution;
        }

        public void SetContactShadows(bool enabled)
        {
            if (_keyHd == null) return;
            _keyHd.useContactShadow.useOverride = true;
            _keyHd.useContactShadow.@override = enabled;
        }
    }
}
