using System;
using System.IO;
using Newtonsoft.Json;
using UnityEngine;

namespace HoloArms.Core.Config
{
    public interface IConfigService
    {
        HoloArmsConfig Config { get; }
        void Load();
        void Save();
        string ConfigPath { get; }
    }

    /// <summary>
    /// JSON persistence with schema versioning (spec §24). Migrations run
    /// oldest→newest on load; unknown keys are preserved through the
    /// [JsonExtensionData] fields on the models.
    /// </summary>
    public sealed class ConfigService : IConfigService
    {
        private readonly IEventBus _events;
        public HoloArmsConfig Config { get; private set; } = new HoloArmsConfig();
        public string ConfigPath { get; }

        public ConfigService(IEventBus events, string fileName = "holoarms.config.json")
        {
            _events = events;
            ConfigPath = Path.Combine(Application.persistentDataPath, fileName);
        }

        public void Load()
        {
            try
            {
                if (!File.Exists(ConfigPath))
                {
                    Debug.Log($"[HoloArms.Config] No config at {ConfigPath}; using defaults.");
                    Config = new HoloArmsConfig();
                    return;
                }
                var json = File.ReadAllText(ConfigPath);
                var loaded = JsonConvert.DeserializeObject<HoloArmsConfig>(json);
                if (loaded == null)
                {
                    Debug.LogWarning("[HoloArms.Config] Config file unreadable; using defaults.");
                    Config = new HoloArmsConfig();
                    return;
                }
                Migrate(loaded);
                Config = loaded;
                Debug.Log($"[HoloArms.Config] Loaded schema v{loaded.SchemaVersion} from {ConfigPath}");
            }
            catch (Exception e)
            {
                Debug.LogError($"[HoloArms.Config] Load failed ({e.Message}); using defaults.");
                Config = new HoloArmsConfig();
            }
        }

        public void Save()
        {
            try
            {
                Config.SchemaVersion = HoloArmsConfig.CurrentSchemaVersion;
                var json = JsonConvert.SerializeObject(Config, Formatting.Indented);
                File.WriteAllText(ConfigPath, json);
                _events?.Publish(new ConfigChangedEvent("all"));
                Debug.Log($"[HoloArms.Config] Saved to {ConfigPath}");
            }
            catch (Exception e)
            {
                Debug.LogError($"[HoloArms.Config] Save failed: {e.Message}");
            }
        }

        private static void Migrate(HoloArmsConfig cfg)
        {
            // Migrations run in order; each step raises SchemaVersion by one.
            // v1 is the first shipped schema, so nothing to do yet. Pattern:
            // if (cfg.SchemaVersion < 2) { ...transform...; cfg.SchemaVersion = 2; }
            if (cfg.SchemaVersion > HoloArmsConfig.CurrentSchemaVersion)
            {
                Debug.LogWarning(
                    $"[HoloArms.Config] Config schema v{cfg.SchemaVersion} is newer than this build " +
                    $"(v{HoloArmsConfig.CurrentSchemaVersion}). Unknown settings are preserved on save.");
            }
        }
    }
}
