using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace HoloArms.Core.Config
{
    /// <summary>
    /// Versioned configuration roots (spec §24). Every model carries
    /// [JsonExtensionData] so keys written by a NEWER schema survive a
    /// load/save round-trip in an older build — unknown settings are never
    /// silently discarded.
    /// </summary>
    public class HoloArmsConfig
    {
        public const int CurrentSchemaVersion = 1;

        [JsonProperty("schemaVersion")] public int SchemaVersion = CurrentSchemaVersion;
        [JsonProperty("wall")] public WallConfig Wall = new WallConfig();
        [JsonProperty("lookDepth")] public LookDepthConfig LookDepth = new LookDepthConfig();
        [JsonProperty("quality")] public QualityConfig Quality = new QualityConfig();
        [JsonProperty("arm")] public ArmConfig Arm = new ArmConfig();

        [JsonExtensionData] public IDictionary<string, JToken> Extra;
    }

    public class WallConfig
    {
        [JsonProperty("wallId")] public string WallId = "DEV_WALL_01";
        [JsonProperty("physicalWidthM")] public float PhysicalWidthM = 1.35f;
        [JsonProperty("physicalHeightM")] public float PhysicalHeightM = 2.2f;
        // Milestone 1 renders a single node; topology modes land in M4.
        [JsonProperty("topologyMode")] public string TopologyMode = "SingleNode";
        [JsonProperty("portrait4K")] public bool Portrait4K = true;

        [JsonExtensionData] public IDictionary<string, JToken> Extra;
    }

    /// <summary>Basic Look &amp; Depth page values (spec §8), 0–100 ranges.</summary>
    public class LookDepthConfig
    {
        [JsonProperty("depthStrength")] public float DepthStrength = 65f;
        [JsonProperty("shadowStrength")] public float ShadowStrength = 72f;
        [JsonProperty("shadowSoftness")] public float ShadowSoftness = 60f;
        [JsonProperty("armExtension")] public string ArmExtension = "Normal"; // Near / Normal / Deep
        [JsonProperty("roomLight")] public string RoomLight = "Indoor";       // Dark / Indoor / Bright
        [JsonProperty("keyLightAzimuthDeg")] public float KeyLightAzimuthDeg = 215f;
        [JsonProperty("keyLightElevationDeg")] public float KeyLightElevationDeg = 40f;
        [JsonProperty("exposureEv")] public float ExposureEv = 9.5f;
        [JsonProperty("aoIntensity")] public float AoIntensity = 1.0f;
        [JsonProperty("contactShadowOpacity")] public float ContactShadowOpacity = 0.8f;

        [JsonExtensionData] public IDictionary<string, JToken> Extra;
    }

    public class QualityConfig
    {
        [JsonProperty("preset")] public string Preset = "Auto"; // Auto/Ultra/High/Balanced/Performance/Custom
        [JsonProperty("targetFps")] public int TargetFps = 60;
        [JsonProperty("renderScaleMin")] public float RenderScaleMin = 0.65f;
        [JsonProperty("renderScaleMax")] public float RenderScaleMax = 1.0f;

        [JsonExtensionData] public IDictionary<string, JToken> Extra;
    }

    public class ArmConfig
    {
        [JsonProperty("side")] public string Side = "Right";
        [JsonProperty("anchorX")] public float AnchorX = 0.0f;   // metres from wall centre
        [JsonProperty("anchorY")] public float AnchorY = 1.25f;  // metres from floor
        [JsonProperty("armScale")] public float ArmScale = 1.0f;
        [JsonProperty("appearance")] public string Appearance = "PlaceholderProcedural";

        [JsonExtensionData] public IDictionary<string, JToken> Extra;
    }
}
