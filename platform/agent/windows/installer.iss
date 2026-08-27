; M8 — HEREweHOLO Beam Receiver Setup (Inno Setup script)
; Build on a Windows machine with Inno Setup 6:  iscc installer.iss
; Produces: HEREweHOLO Beam Receiver Setup.exe  (install / repair / update / uninstall)
;
; HONESTY NOTE: this script is authored and reviewed here, but building and validating the
; actual .exe (plus Authenticode signing and the 24 h soak test) is the M8 gate and happens
; on real Windows hardware. Nothing in this repository claims that has been done.
;
; Layout installed:
;   {app}\agent\           watchdog.mjs, updater.mjs (the receiver agent)
;   {app}\node\            bundled Node.js runtime (place a node-vXX-win-x64 dist here pre-build)
;   {app}\config.env       RECEIVER_URL / UPDATE_URL / UPDATE_CHANNEL / UPDATE_PUBKEY
;   install.ps1            registers the Scheduled Task (autostart), power settings, toasts off

#define AppName "HEREweHOLO Beam Receiver"
#define AppVersion "0.3.0"
#define Publisher "HEREweHOLO"

[Setup]
AppId={{B9E1C5A7-4D2E-4A14-9C1F-HEREWEHOLO01}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#Publisher}
DefaultDirName={autopf}\HEREweHOLO\BeamReceiver
DefaultGroupName=HEREweHOLO
OutputBaseFilename=HEREweHOLO Beam Receiver Setup
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
CloseApplications=yes
; Signing is configured on the build machine:  SignTool=herewholo $f
UninstallDisplayIcon={app}\node\node.exe

[Files]
Source: "..\watchdog.mjs";  DestDir: "{app}\agent"; Flags: ignoreversion
Source: "..\updater.mjs";   DestDir: "{app}\agent"; Flags: ignoreversion
Source: "install.ps1";      DestDir: "{app}";       Flags: ignoreversion
Source: "node\*";           DestDir: "{app}\node";  Flags: ignoreversion recursesubdirs
Source: "config.env";       DestDir: "{app}";       Flags: onlyifdoesntexist  ; keep operator config on update

[Run]
; Autostart (Scheduled Task at logon), no-sleep power plan, notifications off, firewall rule.
Filename: "powershell.exe"; \
  Parameters: "-ExecutionPolicy Bypass -File ""{app}\install.ps1"" -AppDir ""{app}"""; \
  Flags: runhidden waituntilterminated; StatusMsg: "Configuring unattended operation…"

[UninstallRun]
Filename: "powershell.exe"; \
  Parameters: "-ExecutionPolicy Bypass -File ""{app}\install.ps1"" -AppDir ""{app}"" -Uninstall"; \
  Flags: runhidden waituntilterminated; RunOnceId: "UnregisterBeam"

[UninstallDelete]
Type: filesandordirs; Name: "{app}\agent-updates"
