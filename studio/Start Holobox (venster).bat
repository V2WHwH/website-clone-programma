@echo off
title HereWeHolo Studio - venstermodus
rem ============================================================
rem  Zelfde app, maar in een gewoon venster in plaats van
rem  fullscreen kiosk. Handig tijdens het inrichten.
rem ============================================================
setlocal

set "APP=%~dp0index.html"
set "PROFILE=%LOCALAPPDATA%\HereWeHolo\kiosk-profile"

if not exist "%APP%" (
  echo.
  echo   index.html niet gevonden naast dit startbestand.
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
  echo.
  pause
  exit /b 1
)

set "URL=file:///%APP:\=/%"

start "" "%BROWSER%" ^
  --app="%URL%" ^
  --window-size=1280,860 ^
  --user-data-dir="%PROFILE%" ^
  --autoplay-policy=no-user-gesture-required ^
  --allow-file-access-from-files ^
  --ignore-gpu-blocklist ^
  --enable-gpu-rasterization ^
  --enable-zero-copy ^
  --no-first-run

exit /b 0
