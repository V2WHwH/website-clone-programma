using HoloArms.UI;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.HighDefinition;
using UnityEngine.SceneManagement;

namespace HoloArms.EditorTools
{
    /// <summary>
    /// One-click Milestone 1 setup. If anything here trips over an editor/HDRP
    /// version difference, the manual fallback in UnityProject/README.md is:
    /// create the project from Unity's HDRP template, copy Assets/HoloArms in,
    /// make an empty scene, add M1Bootstrap to an empty GameObject, press Play.
    /// </summary>
    public static class M1SceneWizard
    {
        private const string ScenePath = "Assets/HoloArms/Scenes/M1_SingleArm.unity";
        private const string HdrpAssetPath = "Assets/HoloArms/HDRenderPipelineAsset.asset";

        [MenuItem("HoloArms/Create M1 Scene", priority = 0)]
        public static void CreateM1Scene()
        {
            ValidateSetup();

            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            var bootstrapGo = new GameObject("HoloArms.M1");
            bootstrapGo.AddComponent<M1Bootstrap>();

            // A placeholder camera so the empty scene isn't black before Play;
            // M1Bootstrap repositions/configures it on Play.
            var camGo = new GameObject("Main Camera") { tag = "MainCamera" };
            camGo.AddComponent<Camera>();
            camGo.AddComponent<HDAdditionalCameraData>();
            camGo.transform.position = new Vector3(0f, 1.5f, -2.6f);

            EditorSceneManager.SaveScene(scene, ScenePath);
            Debug.Log($"[HoloArms] M1 scene saved to {ScenePath}. Press Play. Keys: E extend/retract, F1 panel. " +
                      "Set the Game view to 2160x3840 (9:16 portrait) for the 4K portrait profile.");
        }

        [MenuItem("HoloArms/Validate Setup", priority = 1)]
        public static void ValidateSetup()
        {
            if (PlayerSettings.colorSpace != ColorSpace.Linear)
            {
                PlayerSettings.colorSpace = ColorSpace.Linear;
                Debug.Log("[HoloArms] Color space set to Linear.");
            }

            if (GraphicsSettings.currentRenderPipeline is HDRenderPipelineAsset)
            {
                Debug.Log("[HoloArms] HDRP pipeline active ✓");
            }
            else
            {
                var hdrp = AssetDatabase.LoadAssetAtPath<HDRenderPipelineAsset>(HdrpAssetPath);
                if (hdrp == null)
                {
                    hdrp = ScriptableObject.CreateInstance<HDRenderPipelineAsset>();
                    AssetDatabase.CreateAsset(hdrp, HdrpAssetPath);
                    AssetDatabase.SaveAssets();
                }
                GraphicsSettings.defaultRenderPipeline = hdrp;
                Debug.Log("[HoloArms] Created and assigned a default HDRenderPipelineAsset. " +
                          "Accept any HDRP wizard prompts (global settings, default resources). " +
                          "For dynamic-resolution tiers, also enable Dynamic Resolution in this asset. " +
                          "If rendering misbehaves, prefer creating the project from the HDRP template " +
                          "and copying Assets/HoloArms in (see UnityProject/README.md).");
            }
        }
    }
}
