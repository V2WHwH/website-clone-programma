# ============================================================
# HOLO ARMS - one-shot laptop setup (Windows, PowerShell)
#
#   powershell -ExecutionPolicy Bypass -File BuildScripts\setup_laptop.ps1
#   (or, before cloning: download this file and run it from any folder)
#
# 1. clones / updates the repo (branch claude/new-session-5zudln)
# 2. optionally regenerates the rigged arms with your local Blender
# 3. opens UnityProject in Unity 6000.5.10f1 (or the newest 6000.x found)
# ============================================================
param(
    [string]$Dir = "$env:USERPROFILE\Documents\website-clone-programma",
    [switch]$RegenerateArms
)
$ErrorActionPreference = "Stop"
$Branch = "claude/new-session-5zudln"
$Repo = "https://github.com/V2WHwH/website-clone-programma.git"

function Find-First($patterns) {
    foreach ($p in $patterns) {
        $hit = Get-ChildItem -Path $p -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1
        if ($hit) { return $hit.FullName }
    }
    return $null
}

# --- 1. repo ---
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[HoloArms] git not found. Install it from https://git-scm.com/download/win and rerun." -ForegroundColor Red
    exit 1
}
if (Test-Path "$Dir\.git") {
    Write-Host "[HoloArms] Updating $Dir"
    git -C $Dir fetch origin $Branch
    git -C $Dir checkout $Branch
    git -C $Dir pull origin $Branch
} else {
    Write-Host "[HoloArms] Cloning into $Dir"
    git clone -b $Branch $Repo $Dir
}

# --- 2. optional: regenerate arms with local Blender ---
if ($RegenerateArms) {
    $blender = Find-First @("$env:ProgramFiles\Blender Foundation\Blender*\blender.exe")
    if (-not $blender) {
        Write-Host "[HoloArms] Blender not found under Program Files\Blender Foundation - skipping." -ForegroundColor Yellow
    } else {
        $out = "$Dir\UnityProject\Assets\HoloArms\Art\Resources\Arms"
        Write-Host "[HoloArms] Regenerating procedural arms with $blender"
        & $blender --background --python "$Dir\Tools\blender\generate_arms.py" -- --out $out
        $glb = "$Dir\ContentSamples\models\arm_textured_rigged.glb"
        if (Test-Path $glb) {
            Write-Host "[HoloArms] Re-rigging the scanned arm"
            & $blender --background --python "$Dir\Tools\blender\rig_scanned_arm.py" -- `
                --glb $glb --landmarks "$Dir\Tools\blender\landmarks\higgsfield_arm_01.json" `
                --name Scan01 --out $out
        }
    }
}

# --- 3. open in Unity ---
$unity = Find-First @(
    "$env:ProgramFiles\Unity\Hub\Editor\6000.5.10f1\Editor\Unity.exe",
    "$env:ProgramFiles\Unity\Hub\Editor\6000.*\Editor\Unity.exe")
if (-not $unity) {
    Write-Host "[HoloArms] Unity 6 editor not found. In Unity Hub use Add > Add project from disk > $Dir\UnityProject" -ForegroundColor Yellow
    exit 0
}
Write-Host "[HoloArms] Opening $Dir\UnityProject with $unity"
Write-Host "[HoloArms] In the editor: HoloArms > Validate Setup, HoloArms > Create M1 Scene, Play. Keys: E A T F1."
Start-Process -FilePath $unity -ArgumentList "-projectPath `"$Dir\UnityProject`""
