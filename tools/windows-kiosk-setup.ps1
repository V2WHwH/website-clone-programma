<#
  HereWeHolo — kiosk-vergrendeling op OS-niveau (Windows 10/11)

  Wat dit script doet (als administrator uitvoeren):
    -Install   1. maakt een lokaal gebruikersaccount "holobox" (zonder wachtwoord te tonen)
               2. laat dat account automatisch inloggen bij het opstarten
               3. vervangt de Windows-shell (Verkenner) voor dát account door de
                  HereWeHolo Player, zodat er niets anders te bedienen valt
               4. schakelt voor dat account de toetscombinaties uit die uit de
                  kiosk breken (Taakbeheer via beleid)
    -Uninstall draait alles terug (shell + autologon; het account blijft bestaan)

  Gebruik:
    powershell -ExecutionPolicy Bypass -File .\windows-kiosk-setup.ps1 -Install `
      -PlayerPath "C:\Program Files\HereWeHolo Player\HereWeHolo Player.exe"
    powershell -ExecutionPolicy Bypass -File .\windows-kiosk-setup.ps1 -Uninstall

  Opmerkingen:
  - Ctrl+Alt+Del blijft altijd werken (Windows-beveiliging); met het
    beheerdersaccount kom je dus altijd terug in het systeem.
  - De Player zelf draait al fullscreen-kiosk; dit script voorkomt daarnaast
    dat een bezoeker bij de Verkenner, de taakbalk of andere apps kan.
#>
[CmdletBinding()]
param(
  [switch]$Install,
  [switch]$Uninstall,
  [string]$KioskUser = 'holobox',
  [string]$KioskPassword = 'HereWeHolo!Kiosk1',
  [string]$PlayerPath = "$env:ProgramFiles\HereWeHolo Player\HereWeHolo Player.exe"
)

$ErrorActionPreference = 'Stop'

function Assert-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p = New-Object Security.Principal.WindowsPrincipal($id)
  if (-not $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw 'Voer dit script uit als administrator (rechtsklik > Als administrator uitvoeren).'
  }
}

function Get-KioskSid {
  param([string]$User)
  (Get-LocalUser -Name $User).SID.Value
}

function Install-Kiosk {
  if (-not (Test-Path $PlayerPath)) {
    throw "Player niet gevonden op '$PlayerPath'. Installeer eerst HereWeHolo-Player-Setup-*.exe of geef -PlayerPath op."
  }

  # 1. Kiosk-account
  if (-not (Get-LocalUser -Name $KioskUser -ErrorAction SilentlyContinue)) {
    $sec = ConvertTo-SecureString $KioskPassword -AsPlainText -Force
    New-LocalUser -Name $KioskUser -Password $sec -PasswordNeverExpires -AccountNeverExpires `
      -Description 'HereWeHolo kiosk-account (automatisch ingelogd, vergrendelde shell)' | Out-Null
    Add-LocalGroupMember -Group 'Users' -Member $KioskUser -ErrorAction SilentlyContinue
    Write-Host "Account '$KioskUser' aangemaakt."
  } else {
    Write-Host "Account '$KioskUser' bestaat al — hergebruikt."
  }

  # 2. Autologon
  $wl = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon'
  Set-ItemProperty $wl -Name AutoAdminLogon -Value '1'
  Set-ItemProperty $wl -Name DefaultUserName -Value $KioskUser
  Set-ItemProperty $wl -Name DefaultPassword -Value $KioskPassword
  Set-ItemProperty $wl -Name DefaultDomainName -Value $env:COMPUTERNAME
  Write-Host 'Automatisch inloggen ingesteld.'

  # 3. Shell-vervanging alleen voor het kiosk-account (per-user Winlogon).
  #    Het profiel moet bestaan; login één keer of laad de default hive.
  $sid = Get-KioskSid $KioskUser
  $userWl = "Registry::HKEY_USERS\$sid\Software\Microsoft\Windows NT\CurrentVersion\Winlogon"
  if (-not (Test-Path "Registry::HKEY_USERS\$sid")) {
    Write-Warning "Het profiel van '$KioskUser' is nog niet aangemaakt. Log één keer in als '$KioskUser' en draai -Install daarna opnieuw; tot die tijd is de shell nog niet vervangen."
  } else {
    New-Item -Path $userWl -Force | Out-Null
    Set-ItemProperty $userWl -Name Shell -Value ('"{0}"' -f $PlayerPath)
    Write-Host "Shell voor '$KioskUser' vervangen door de HereWeHolo Player."
  }

  # 4. Taakbeheer blokkeren voor het kiosk-account
  if (Test-Path "Registry::HKEY_USERS\$sid") {
    $pol = "Registry::HKEY_USERS\$sid\Software\Microsoft\Windows\CurrentVersion\Policies\System"
    New-Item -Path $pol -Force | Out-Null
    Set-ItemProperty $pol -Name DisableTaskMgr -Value 1 -Type DWord
    Write-Host 'Taakbeheer uitgeschakeld voor het kiosk-account.'
  }

  Write-Host ''
  Write-Host 'Klaar. Herstart de pc; hij logt automatisch in en start direct de Player.'
  Write-Host 'Terug naar Windows: Ctrl+Alt+Del > Afmelden > inloggen met je beheerdersaccount.'
}

function Uninstall-Kiosk {
  $wl = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon'
  Set-ItemProperty $wl -Name AutoAdminLogon -Value '0'
  Remove-ItemProperty $wl -Name DefaultPassword -ErrorAction SilentlyContinue
  $u = Get-LocalUser -Name $KioskUser -ErrorAction SilentlyContinue
  if ($u) {
    $sid = $u.SID.Value
    $userWl = "Registry::HKEY_USERS\$sid\Software\Microsoft\Windows NT\CurrentVersion\Winlogon"
    if (Test-Path $userWl) { Remove-ItemProperty $userWl -Name Shell -ErrorAction SilentlyContinue }
    $pol = "Registry::HKEY_USERS\$sid\Software\Microsoft\Windows\CurrentVersion\Policies\System"
    if (Test-Path $pol) { Remove-ItemProperty $pol -Name DisableTaskMgr -ErrorAction SilentlyContinue }
  }
  Write-Host "Kiosk-vergrendeling verwijderd. Het account '$KioskUser' bestaat nog; verwijder het desgewenst via Instellingen > Accounts."
}

Assert-Admin
if ($Install) { Install-Kiosk }
elseif ($Uninstall) { Uninstall-Kiosk }
else { Write-Host 'Gebruik: -Install of -Uninstall (zie de toelichting bovenin dit script).' }
