using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.HighDefinition;

namespace HoloArms.Rendering
{
    /// <summary>
    /// Global HDRP Volume built from code: fixed exposure, screen-space AO
    /// (darkens the arm/wall emergence point), contact shadows (the arm-wall
    /// contact cue) and shadow distance. Every HDRP volume API lives here —
    /// see the note on LightRigController.
    /// </summary>
    public sealed class VolumeController : MonoBehaviour
    {
        private Volume _volume;
        private Exposure _exposure;
        private AmbientOcclusion _ao;
        private ContactShadows _contact;
        private HDShadowSettings _shadowSettings;

        public void Build()
        {
            _volume = gameObject.AddComponent<Volume>();
            _volume.isGlobal = true;
            _volume.priority = 10f;

            var profile = ScriptableObject.CreateInstance<VolumeProfile>();
            profile.name = "HoloArms Global Volume (runtime)";
            _volume.profile = profile;

            _exposure = profile.Add<Exposure>(true);
            _exposure.mode.value = ExposureMode.Fixed;
            _exposure.fixedExposure.value = 9.5f;

            _ao = profile.Add<AmbientOcclusion>(true);
            _ao.intensity.value = 1.0f;
            _ao.radius.value = 0.35f;

            _contact = profile.Add<ContactShadows>(true);
            _contact.enable.value = true;
            _contact.length.value = 0.25f;
            _contact.opacity.value = 0.8f;

            _shadowSettings = profile.Add<HDShadowSettings>(true);
            _shadowSettings.maxShadowDistance.value = 25f;
        }

        public void SetExposureEv(float ev) { if (_exposure != null) _exposure.fixedExposure.value = ev; }

        public void SetAoIntensity(float intensity)
        {
            if (_ao != null) _ao.intensity.value = Mathf.Clamp(intensity, 0f, 4f);
        }

        public void SetAoRadius(float radius)
        {
            if (_ao != null) _ao.radius.value = Mathf.Clamp(radius, 0.05f, 5f);
        }

        public void SetContactShadows(bool enabled, float opacity, float length)
        {
            if (_contact == null) return;
            _contact.enable.value = enabled;
            _contact.opacity.value = Mathf.Clamp01(opacity);
            _contact.length.value = Mathf.Clamp(length, 0.02f, 1f);
        }

        public void SetAoEnabled(bool enabled)
        {
            if (_ao != null) _ao.active = enabled;
        }
    }
}
