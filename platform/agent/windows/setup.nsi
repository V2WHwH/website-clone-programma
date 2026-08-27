# M8 — HEREweHOLO Beam Receiver Setup (NSIS, cross-buildable from Linux with makensis)
#
#   node agent/windows/build-exe.mjs        # first: produces dist/HoloSeeAgent.exe
#   makensis agent/windows/setup.nsi        # then: produces dist/HEREweHOLO Beam Receiver Setup.exe
#
# Installs the agent, registers it as a logon Scheduled Task (highest privileges),
# disables sleep/display timeout, adds a firewall rule, and writes an uninstaller.
# config.env is preserved across updates. Both binaries must go through the company's
# Authenticode signing step before distribution — unsigned builds trip SmartScreen.

!define APPNAME "HEREweHOLO Beam Receiver"
!define COMPANY "HEREweHOLO"
!define VERSION "0.3.0"
!define TASKNAME "HEREweHOLO Beam Receiver"
!define UNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\HEREweHOLOBeamReceiver"

Name "${APPNAME}"
OutFile "..\..\dist\HEREweHOLO Beam Receiver Setup.exe"
InstallDir "$PROGRAMFILES64\${COMPANY}\BeamReceiver"
RequestExecutionLevel admin
SetCompressor /SOLID lzma
Unicode true

Page directory
Page instfiles
UninstPage uninstConfirm
UninstPage instfiles

Section "Install"
  SetOutPath $INSTDIR

  # stop a running agent before replacing it (repair/update)
  ExecWait 'schtasks /End /TN "${TASKNAME}"'
  ExecWait 'taskkill /F /IM HoloSeeAgent.exe'

  File "..\..\dist\HoloSeeAgent.exe"

  # keep the operator's configuration on update; seed it on first install
  IfFileExists "$INSTDIR\config.env" +2 0
    File "config.env"
  File /oname=config.env.example "config.env"

  WriteUninstaller "$INSTDIR\Uninstall.exe"

  # autostart at logon, highest privileges, restart-friendly
  ExecWait 'schtasks /Create /F /TN "${TASKNAME}" /SC ONLOGON /RL HIGHEST /TR "\"$INSTDIR\HoloSeeAgent.exe\""'

  # a kiosk must never sleep or blank
  ExecWait 'powercfg /change standby-timeout-ac 0'
  ExecWait 'powercfg /change monitor-timeout-ac 0'
  ExecWait 'powercfg /change hibernate-timeout-ac 0'

  ExecWait 'netsh advfirewall firewall add rule name="${TASKNAME}" dir=in action=allow program="$INSTDIR\HoloSeeAgent.exe" enable=yes'

  WriteRegStr HKLM "${UNINSTKEY}" "DisplayName" "${APPNAME}"
  WriteRegStr HKLM "${UNINSTKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "${UNINSTKEY}" "Publisher" "${COMPANY}"
  WriteRegStr HKLM "${UNINSTKEY}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKLM "${UNINSTKEY}" "InstallLocation" "$INSTDIR"
  WriteRegDWORD HKLM "${UNINSTKEY}" "NoModify" 1
  WriteRegDWORD HKLM "${UNINSTKEY}" "NoRepair" 1

  ExecWait 'schtasks /Run /TN "${TASKNAME}"'
SectionEnd

Section "Uninstall"
  ExecWait 'schtasks /End /TN "${TASKNAME}"'
  ExecWait 'taskkill /F /IM HoloSeeAgent.exe'
  ExecWait 'schtasks /Delete /F /TN "${TASKNAME}"'
  ExecWait 'netsh advfirewall firewall delete rule name="${TASKNAME}"'
  Delete "$INSTDIR\HoloSeeAgent.exe"
  Delete "$INSTDIR\config.env.example"
  Delete "$INSTDIR\Uninstall.exe"
  # config.env and the device profile hold the device identity — deliberately kept;
  # remove C:\ProgramData\HEREweHOLO manually to fully retire a device.
  RMDir "$INSTDIR"
  DeleteRegKey HKLM "${UNINSTKEY}"
SectionEnd
