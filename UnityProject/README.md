# HOLO ARMS — UnityProject (Milestone 1: single-arm visual proof)

Unity 6 (6000.x) + HDRP + DX12, Windows 11. Reference validation GPU:
**NVIDIA RTX 4090** (M1 acceptance: stable 60 FPS).

This milestone was authored without a Unity editor in the loop — the code
compiles against the Unity 6 / HDRP 17 API surface, but **the first open +
Play on your machine is the validation step**. Everything scene-related is
built from code at Play time, so there are no hand-authored scene/asset
files to go stale.

## Quick start (path A — open this project)

1. Open `UnityProject/` with Unity Hub (any 6000.x; it may prompt to
   upgrade from 6000.0.58f1 — accept). Packages (HDRP 17, Newtonsoft JSON)
   restore automatically.
2. Menu **HoloArms → Validate Setup** — sets Linear color space and, if no
   HDRP asset is active, creates and assigns one (accept any HDRP prompts
   for global settings/resources).
3. Menu **HoloArms → Create M1 Scene**, then **Play**.
4. Game view: add a custom resolution **2160×3840** (4K portrait profile).

## Quick start (path B — fallback if HDRP misbehaves on path A)

1. Create a new project from Unity's **High Definition 3D (HDRP) template**.
2. Add `com.unity.nuget.newtonsoft-json` via Package Manager.
3. Copy `Assets/HoloArms/` into the new project's `Assets/`.
4. Continue from step 3 above (Create M1 Scene → Play).

## Controls

| Key | Action |
|---|---|
| `E` | Extend / retract the arm through the wall |
| `F1` | Toggle the Look & Depth engineering panel |

The panel carries the Basic controls from the Figma **Look & Depth** page
(Depth/Shadow Strength, Softness, Room Light, Arm Extension, key-light
azimuth/elevation, exposure, AO, contact shadow) plus the quality preset
and the Auto Quality change log. **Save settings** persists to
`%USERPROFILE%\AppData\LocalLow\<company>\<product>\holoarms.config.json`
(versioned JSON, unknown keys preserved).

## M1 acceptance checklist (validate on the 4090)

- [ ] Stable 60 FPS at 2160×3840 (panel shows FPS/frame time; tier stays Ultra/High)
- [ ] No visible arm geometry behind the wall (retract with `E`; nothing pokes through)
- [ ] Wall shadow reacts in real time to the key-light azimuth/elevation sliders
- [ ] Contact shadow visible where the arm meets the wall; AO darkens the emergence point
- [ ] Settings persist: change sliders → Save → stop Play → Play → values restored
- [ ] Quality presets switch (cycle the preset button); Auto degrades under load and logs why

## How the illusion works in M1

The wall is real opaque geometry with its front face exactly at the plane
z = 0; the arm's shoulder root sits *inside/behind* the wall (z > 0) and
the IK target extends toward the viewer (−z). Ordinary depth testing
occludes everything behind the plane — clipping is binary-correct at every
quality tier by construction. Contact shadows + SSAO + the projected key
shadow do the "attached to the wall" work. The custom clip/stencil path is
only needed for Transparent Overlay mode (composition mode B) and lands
with that mode.

## Building HoloArms.exe

Unity builds produce a **folder** with `HoloArms.exe` plus its data — no
installer needed: copy/zip the folder, double-click the exe. Three routes:

1. **In the editor** (simplest): menu **HoloArms → Build Windows Player
   (x64)** → output in `UnityProject/Builds/HoloArms_M1_Windows/`.
2. **Command line**: run `BuildScripts\build_windows.bat` (finds Unity via
   Unity Hub's default path, or pass the path to `Unity.exe` as the first
   argument / set `UNITY_PATH`). Open the project once in the editor before
   the first batch build so HDRP finishes its first-time setup.
3. **GitHub Actions** (no local Unity needed): Actions tab → *Build
   Windows Player* → Run workflow → download the `HoloArms_M1_Windows`
   artifact. Requires one-time Unity-license secrets — see the comments at
   the top of `.github/workflows/build-windows.yml`.

The player runs fullscreen; `E` and `F1` work as in the editor, and Escape
is not bound (Alt+F4 to quit — kiosk behavior lands in M9).

## Where things live

```
Assets/HoloArms/
  Core/        service registry, event bus, versioned JSON config, health monitor
  Rendering/   WallPortalSystem, LightRigController, VolumeController, QualityManager
  Agents/      TwoBoneIK, ProceduralArmBuilder (placeholder!), ArmAgent
  UI/          M1Bootstrap (composition root), M1DebugPanel (IMGUI stand-in)
  EditorTools/ HoloArms menu: Create M1 Scene, Validate Setup
```

- **HDRP API drift**: every HDRP-version-specific call is concentrated in
  `LightRigController.cs` and `VolumeController.cs` — if a HDRP upgrade
  breaks compilation, it breaks there and nowhere else.
- **Dynamic resolution tier**: the lowest auto-quality tier drives render
  scale via `DynamicResolutionHandler`; it only takes effect when
  *Dynamic Resolution* is enabled in the active HDRP asset.
- **The capsule arm is a placeholder**, never production quality (spec §6).
  The textured+rigged GLB from `ContentSamples/models/` is the first real
  mesh to swap in; the swap point is `ProceduralArmBuilder.Build` →
  a GLB-import variant with the same joint contract (upper/fore/hand,
  +z bone axis).
- **The IMGUI panel is a stand-in**; the operator application UI is
  implemented from the Figma design system (`FigmaHandoff/`), which is the
  UI source of truth.
