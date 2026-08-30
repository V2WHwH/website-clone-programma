@echo off
setlocal EnableDelayedExpansion
REM ============================================================
REM HOLO ARMS - Windows x64 player build (Milestone 1)
REM Usage:
REM   build_windows.bat
REM   build_windows.bat "C:\Program Files\Unity\Hub\Editor\6000.0.58f1\Editor\Unity.exe"
REM Or set UNITY_PATH to your Unity.exe beforehand.
REM Output: UnityProject\Builds\HoloArms_M1_Windows\HoloArms.exe
REM Tip: open the project once in the editor before the first
REM      batch build so HDRP finishes its first-time setup.
REM ============================================================

set "UNITY_EXE=%~1"
if "%UNITY_EXE%"=="" set "UNITY_EXE=%UNITY_PATH%"
if "%UNITY_EXE%"=="" (
  for /d %%D in ("%ProgramFiles%\Unity\Hub\Editor\6000.*") do set "UNITY_EXE=%%D\Editor\Unity.exe"
)
if not exist "%UNITY_EXE%" (
  echo [HoloArms] Unity editor not found. Pass the path to Unity.exe as the
  echo first argument or set the UNITY_PATH environment variable.
  exit /b 1
)

set "PROJ=%~dp0..\UnityProject"
echo [HoloArms] Using Unity: %UNITY_EXE%
echo [HoloArms] Project:     %PROJ%
echo [HoloArms] Building... log: %~dp0build_windows.log

"%UNITY_EXE%" -batchmode -quit ^
  -projectPath "%PROJ%" ^
  -buildTarget Win64 ^
  -executeMethod HoloArms.EditorTools.WindowsBuilder.BuildFromCommandLine ^
  -logFile "%~dp0build_windows.log"

if errorlevel 1 (
  echo [HoloArms] BUILD FAILED - see build_windows.log
  exit /b 1
)
echo [HoloArms] BUILD OK: %PROJ%\Builds\HoloArms_M1_Windows\HoloArms.exe
endlocal
