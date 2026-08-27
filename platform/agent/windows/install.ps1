# M5 — HoloSee kiosk install for Windows (run as the kiosk user, elevated).
# NOTE: authored for the M8 installer groundwork; not testable in the Linux CI sandbox —
# validate on real Holobox hardware per the M5 gate before shipping.
param(
  [Parameter(Mandatory = $true)][string]$ReceiverUrl,
  [string]$Chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe",
  [string]$ProfileDir = "$env:LOCALAPPDATA\HoloSee\profile",
  [string]$NodeExe = "node"
)

$ErrorActionPreference = "Stop"
$agentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$watchdog = Join-Path (Split-Path -Parent $agentDir) "watchdog.mjs"

# 1) Scheduled task: watchdog at logon, restart on failure — the receiver survives reboots.
$action = New-ScheduledTaskAction -Execute $NodeExe -Argument "`"$watchdog`"" -WorkingDirectory (Split-Path -Parent $watchdog)
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit (New-TimeSpan -Days 3650) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "HoloSee Watchdog" -Action $action -Trigger $trigger -Settings $settings -Force

# Environment for the task (machine scope so the task sees it)
[Environment]::SetEnvironmentVariable("RECEIVER_URL", $ReceiverUrl, "Machine")
[Environment]::SetEnvironmentVariable("CHROMIUM", $Chrome, "Machine")
[Environment]::SetEnvironmentVariable("PROFILE_DIR", $ProfileDir, "Machine")

# 2) Never sleep, never blank — the Holobox is always on.
powercfg /change standby-timeout-ac 0
powercfg /change monitor-timeout-ac 0
powercfg /change hibernate-timeout-ac 0

# 3) Quiet the OS on the glass.
reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\PushNotifications" /v ToastEnabled /t REG_DWORD /d 0 /f
reg add "HKCU\Control Panel\Desktop" /v ScreenSaveActive /t REG_SZ /d 0 /f

Write-Host "Installed. Remaining manual steps (documented, deliberate):"
Write-Host "  - Auto-login: set DefaultUserName/DefaultPassword/AutoAdminLogon under"
Write-Host "    HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon (or use Autologon.exe from Sysinternals)."
Write-Host "  - Windows Update active hours + restart policy per fleet policy (M7)."
Write-Host "  - Reboot and verify: machine -> login -> watchdog -> kiosk receiver -> ONLINE, no human action."
