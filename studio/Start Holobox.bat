@echo off
title HereWeHolo Studio
rem ============================================================
rem  HereWeHolo Studio - kiosk starter (geen installatie nodig)
rem  Start de presentatie fullscreen in Chrome of Edge, met
rem  GPU-versnelling en autoplay aan. Sluiten: Alt+F4.
rem ============================================================
setlocal

set "APP=%~dp0index.html"
set "PROFILE=%LOCALAPPDATA%\HereWeHolo\kiosk-profile"

if not exist "%APP%" (
  echo.
  echo   index.html niet gevonden naast dit startbestand.
  echo   Zet "Start Holobox.bat" in dezelfde map als index.html.
  echo.
  pause
  exit /b 1
)

set "BROWSER="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" set "BROWSER=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if not defined BROWSER (
  echo.
  echo   Geen Google Chrome of Microsoft Edge gevonden.
  echo   Installeer een van beide en start dit bestand opnieuw.
  echo.
  pause
  exit /b 1
)

rem Eigen profielmap: de presentatie en video's blijven bewaard en staan
rem los van het normale browsergebruik van deze computer.
set "URL=file:///%APP:\=/%"

start "" "%BROWSER%" ^
  --kiosk ^
  --user-data-dir="%PROFILE%" ^
  --autoplay-policy=no-user-gesture-required ^
  --allow-file-access-from-files ^
  --ignore-gpu-blocklist ^
  --enable-gpu-rasterization ^
  --enable-zero-copy ^
  --disable-features=TranslateUI,DefaultBrowserPrompt ^
  --no-first-run ^
  --disable-session-crashed-bubble ^
  --disable-pinch ^
  --overscroll-history-navigation=0 ^
  "%URL%"

exit /b 0
