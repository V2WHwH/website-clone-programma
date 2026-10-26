@echo off
title HereWeHolo verwijderen
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0verwijderen.ps1" %*
echo.
pause
