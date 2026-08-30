using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace HoloArms.EditorTools
{
    /// <summary>
    /// Produces the Windows x64 player (HoloArms.exe) for Milestone 1.
    /// Three entry points, one build path:
    ///  - Editor menu: HoloArms → Build Windows Player (x64)
    ///  - Command line: BuildScripts/build_windows.bat (batchmode)
    ///  - CI: .github/workflows/build-windows.yml (game-ci)
    /// Output: UnityProject/Builds/HoloArms_M1_Windows/HoloArms.exe
    /// </summary>
    public static class WindowsBuilder
    {
        private const string ScenePath = "Assets/HoloArms/Scenes/M1_SingleArm.unity";

        private static string OutputDir =>
            Path.GetFullPath(Path.Combine(Application.dataPath, "..", "Builds", "HoloArms_M1_Windows"));

        [MenuItem("HoloArms/Build Windows Player (x64)", priority = 20)]
        public static void BuildFromMenu()
        {
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            Build(interactive: true);
        }

        /// <summary>Entry point for -executeMethod (bat script and game-ci).</summary>
        public static void BuildFromCommandLine()
        {
            try
            {
                Build(interactive: false);
            }
            catch (Exception e)
            {
                Debug.LogError($"[HoloArms.Build] Build threw: {e}");
                EditorApplication.Exit(1);
            }
        }

        private static void Build(bool interactive)
        {
            M1SceneWizard.ValidateSetup();
            if (!File.Exists(Path.GetFullPath(ScenePath)))
            {
                Debug.Log("[HoloArms.Build] M1 scene missing — creating it first.");
                M1SceneWizard.CreateM1Scene();
            }

            PlayerSettings.companyName = "HEREweHOLO";
            PlayerSettings.productName = "HOLO ARMS M1";
            PlayerSettings.runInBackground = true;
            PlayerSettings.fullScreenMode = FullScreenMode.FullScreenWindow;

            Directory.CreateDirectory(OutputDir);
            var exePath = Path.Combine(OutputDir, "HoloArms.exe");

            var options = new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = exePath,
                target = BuildTarget.StandaloneWindows64,
                options = BuildOptions.None
            };

            Debug.Log($"[HoloArms.Build] Building Windows x64 player → {exePath}");
            var report = BuildPipeline.BuildPlayer(options);
            var summary = report.summary;

            if (summary.result == BuildResult.Succeeded)
            {
                Debug.Log($"[HoloArms.Build] SUCCESS — {summary.totalSize / (1024f * 1024f):F1} MB, " +
                          $"{summary.totalTime.TotalMinutes:F1} min. Output: {OutputDir}");
                if (interactive) EditorUtility.RevealInFinder(exePath);
                else if (Application.isBatchMode) EditorApplication.Exit(0);
            }
            else
            {
                Debug.LogError($"[HoloArms.Build] FAILED — result {summary.result}, " +
                               $"{summary.totalErrors} error(s). See the editor/build log.");
                if (!interactive) EditorApplication.Exit(1);
            }
        }
    }
}
