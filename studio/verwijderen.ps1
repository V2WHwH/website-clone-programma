<#
  HereWeHolo - alles van deze computer verwijderen

  Haalt weg:
    - de Windows-app (via zijn eigen uninstaller, als hij geinstalleerd is)
    - alle video's, de indeling en de instellingen van de app
      (%APPDATA%\HereWeHolo Player, met logboeken en caches)
    - het browserprofiel van de exe-loze versie
      (%LOCALAPPDATA%\HereWeHolo, gemaakt door "Start Holobox.bat")
    - snelkoppelingen op het bureaublad, in het startmenu en in Opstarten
    - als administrator gestart: de kioskvergrendeling (automatisch inloggen
      en de vervangen shell), en desgewenst het account "holobox"

  Gebruik: dubbelklik "HereWeHolo verwijderen.bat". Voor de kioskvergrendeling:
  rechtsklik > Als administrator uitvoeren.
  Zonder vragen (voor beheerders): verwijderen.ps1 -Ja [-KioskAccountOok]
#>
[CmdletBinding()]
param(
  [switch]$Ja,               # niet vragen, gewoon verwijderen
  [switch]$KioskAccountOok   # met -Ja: ook het account "holobox" verwijderen
)

$ErrorActionPreference = 'Continue'
$KioskUser = 'holobox'

function Test-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  (New-Object Security.Principal.WindowsPrincipal($id)).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-Grootte([string]$Pad) {
  try {
    $b = (Get-ChildItem -LiteralPath $Pad -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    if (-not $b) { return '' }
    if ($b -ge 1GB) { return ' ({0:N1} GB)' -f ($b / 1GB) }
    if ($b -ge 1MB) { return ' ({0:N0} MB)' -f ($b / 1MB) }
    return ' ({0:N0} kB)' -f ($b / 1KB)
  } catch { return '' }
}

# ---- Wat er op deze computer staat ----
$mappen = @(@(
  @{ Wat = "Video's, indeling en instellingen (Windows-app)"; Pad = (Join-Path $env:APPDATA 'HereWeHolo Player') },
  @{ Wat = 'Caches van de Windows-app';                       Pad = (Join-Path $env:APPDATA 'hereweholo-player') },
  @{ Wat = 'Browserversie (Start Holobox.bat)';               Pad = (Join-Path $env:LOCALAPPDATA 'HereWeHolo') },
  @{ Wat = 'Updater-cache';                                   Pad = (Join-Path $env:LOCALAPPDATA 'hereweholo-player-updater') },
  @{ Wat = 'Programma (Windows-app)';                         Pad = (Join-Path $env:LOCALAPPDATA 'Programs\HereWeHolo Player') },
  @{ Wat = 'Programma (voor alle gebruikers)';                Pad = (Join-Path $env:ProgramFiles 'HereWeHolo Player') }
) | Where-Object { Test-Path -LiteralPath $_.Pad })

$snelkoppelingen = @(foreach ($dir in @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('CommonDesktopDirectory'),
                                         [Environment]::GetFolderPath('Startup'), [Environment]::GetFolderPath('Programs'))) {
  if ($dir -and (Test-Path -LiteralPath $dir)) {
    Get-ChildItem -LiteralPath $dir -Filter 'HereWeHolo*.lnk' -ErrorAction SilentlyContinue
  }
})
$startmenuMap = Join-Path ([Environment]::GetFolderPath('Programs')) 'HereWeHolo'

$uninstallKeys = @(@('HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
                   'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*') |
  ForEach-Object { Get-ItemProperty $_ -ErrorAction SilentlyContinue } |
  Where-Object { $_.DisplayName -like 'HereWeHolo Player*' })

$wl = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon'
$winlogon = Get-ItemProperty $wl -ErrorAction SilentlyContinue
$kioskAccount = $null
try { $kioskAccount = Get-LocalUser -Name $KioskUser -ErrorAction SilentlyContinue } catch { }
$kioskAan = $kioskAccount -and $winlogon -and ($winlogon.DefaultUserName -eq $KioskUser) -and ($winlogon.AutoAdminLogon -eq '1')
$admin = Test-Admin

# ---- Overzicht en bevestiging ----
Write-Host ''
Write-Host '  HereWeHolo van deze computer verwijderen' -ForegroundColor Cyan
Write-Host '  ----------------------------------------'
if ($mappen.Count -eq 0 -and $snelkoppelingen.Count -eq 0 -and $uninstallKeys.Count -eq 0 -and -not (Test-Path -LiteralPath $startmenuMap) -and -not $kioskAan) {
  Write-Host '  Er staat niets meer van HereWeHolo op deze computer.' -ForegroundColor Green
  exit 0
}
Write-Host '  Dit gaat weg:'
foreach ($m in $mappen) { Write-Host ('    - {0}{1}' -f $m.Wat, (Get-Grootte $m.Pad)); Write-Host ('      {0}' -f $m.Pad) -ForegroundColor DarkGray }
if ($snelkoppelingen.Count -or (Test-Path -LiteralPath $startmenuMap)) { Write-Host '    - snelkoppelingen (bureaublad, startmenu, Opstarten)' }
if ($uninstallKeys.Count) { Write-Host '    - de app uit de lijst Geinstalleerde apps' }
if ($kioskAan) {
  if ($admin) { Write-Host "    - de kioskvergrendeling (automatisch inloggen als '$KioskUser', vervangen shell)" }
  else { Write-Host "  LET OP: de kioskvergrendeling staat aan. Start dit bestand als administrator om die ook terug te draaien." -ForegroundColor Yellow }
}
Write-Host ''
Write-Host '  Dit kan niet ongedaan worden gemaakt. Maak eerst een back-up via het menu:' -ForegroundColor Yellow
Write-Host '  Opslaan & beheer > Alles exporteren.' -ForegroundColor Yellow
Write-Host ''
if (-not $Ja) {
  $antwoord = Read-Host '  Typ JA om alles definitief te verwijderen'
  if ($antwoord -ne 'JA') { Write-Host '  Niets verwijderd.'; exit 1 }
}

# ---- 1. Draaiende onderdelen stoppen ----
Get-Process -Name 'HereWeHolo Player' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-CimInstance Win32_Process -Filter "Name='chrome.exe' OR Name='msedge.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like '*HereWeHolo\kiosk-profile*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 1

# ---- 2. De app via zijn eigen uninstaller ----
foreach ($k in $uninstallKeys) {
  if ($k.UninstallString -match '^"([^"]+)"\s*(.*)$') {
    $exe = $Matches[1]; $extra = $Matches[2]
    if (Test-Path -LiteralPath $exe) {
      Write-Host '  App verwijderen...'
      # _?= laat de uninstaller op zijn plek draaien in plaats van vanuit een
      # tijdelijke kopie, zodat -Wait echt wacht tot hij klaar is
      $map = Split-Path $exe -Parent
      Start-Process -FilePath $exe -ArgumentList "/S $extra _?=$map" -Wait -ErrorAction SilentlyContinue
      if ($mappen.Pad -notcontains $map) { $mappen += @{ Wat = 'Programma'; Pad = $map } }
    }
  }
  Remove-Item -LiteralPath $k.PSPath -Recurse -Force -ErrorAction SilentlyContinue
}

# ---- 3. Mappen en snelkoppelingen ----
$mislukt = @()
foreach ($m in $mappen) {
  # een net afgesloten programma houdt zijn bestanden soms nog even vast
  for ($i = 0; $i -lt 5 -and (Test-Path -LiteralPath $m.Pad); $i++) {
    if ($i) { Start-Sleep -Seconds 1 }
    Remove-Item -LiteralPath $m.Pad -Recurse -Force -ErrorAction SilentlyContinue
  }
  if (Test-Path -LiteralPath $m.Pad) { $mislukt += $m.Pad }
}
foreach ($s in $snelkoppelingen) { Remove-Item -LiteralPath $s.FullName -Force -ErrorAction SilentlyContinue }
if (Test-Path -LiteralPath $startmenuMap) { Remove-Item -LiteralPath $startmenuMap -Recurse -Force -ErrorAction SilentlyContinue }

# ---- 4. Kioskvergrendeling (alleen als administrator) ----
if ($kioskAan -and $admin) {
  Set-ItemProperty $wl -Name AutoAdminLogon -Value '0'
  Remove-ItemProperty $wl -Name DefaultPassword -ErrorAction SilentlyContinue
  $sid = $kioskAccount.SID.Value
  $userWl = "Registry::HKEY_USERS\$sid\Software\Microsoft\Windows NT\CurrentVersion\Winlogon"
  if (Test-Path $userWl) { Remove-ItemProperty $userWl -Name Shell -ErrorAction SilentlyContinue }
  $pol = "Registry::HKEY_USERS\$sid\Software\Microsoft\Windows\CurrentVersion\Policies\System"
  if (Test-Path $pol) { Remove-ItemProperty $pol -Name DisableTaskMgr -ErrorAction SilentlyContinue }
  Write-Host '  Kioskvergrendeling teruggedraaid.'
}
if ($kioskAccount -and $admin) {
  $weg = $KioskAccountOok
  if (-not $Ja) { $weg = (Read-Host "  Ook het Windows-account '$KioskUser' en zijn profiel verwijderen? Typ JA of druk Enter om te bewaren") -eq 'JA' }
  if ($weg) {
    $sid = $kioskAccount.SID.Value
    Remove-LocalUser -Name $KioskUser -ErrorAction SilentlyContinue
    Get-CimInstance Win32_UserProfile -ErrorAction SilentlyContinue | Where-Object { $_.SID -eq $sid } |
      Remove-CimInstance -ErrorAction SilentlyContinue
    Write-Host "  Account '$KioskUser' verwijderd."
  }
}

# ---- Klaar ----
Write-Host ''
if ($mislukt) {
  Write-Host '  Niet alles kon weg (een bestand is nog in gebruik):' -ForegroundColor Yellow
  $mislukt | ForEach-Object { Write-Host "    $_" }
  Write-Host '  Start de computer opnieuw op en draai dit bestand nog een keer.' -ForegroundColor Yellow
  exit 2
}
Write-Host '  Klaar: HereWeHolo is van deze computer verwijderd.' -ForegroundColor Green
Write-Host '  De map met de download zelf (waar dit bestand in staat) kun je nu ook weggooien.'
Write-Host '  Heb je index.html ooit in je gewone Chrome of Edge geopend (zonder Start Holobox.bat),'
Write-Host '  wis dan daar ook de sitegegevens: Instellingen > Privacy > Browsegegevens wissen.'
exit 0
