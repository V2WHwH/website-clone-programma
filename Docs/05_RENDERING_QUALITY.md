# Rendering Quality Strategy & Fallback Order

> Milestone 0 deliverable 6.

## 1. Pipeline baseline

- Unity 6 (LTS/current stable), **HDRP**, DirectX 12, Windows 11.
- 60 FPS target; 4K portrait (2160×3840) and landscape (3840×2160) first-class.
- Arm skin: PBR + subsurface scattering, micro-normal detail, 4K texture
  baseline (8K source optional on high-end); wrist/elbow deformation quality
  is a product requirement, not polish.
- WallPortalSystem: clip-plane/stencil occlusion, contact shadows, projected
  wall shadows, AO at emergence point (see spec §7).

## 2. Quality presets (Basic selector)

`Auto | Ultra | High | Balanced | Performance | Custom`

Preset = a named bundle of the advanced controls (shadow res/cascades,
contact shadows, SSAO/RTAO, reflections, SSS quality, AA, LOD bias, max
high-quality lights, transparent effects, texture streaming budget,
anisotropic filtering, motion blur — default conservative/off).

## 3. Resolution / upscaling selector

`Native 100% | Supersample 110–150% | Dynamic Resolution Auto |
Render Scale 50–150% | DLSS Q/B/P | DLAA | FSR Q/B/P | XeSS | TAA fallback`

**Capability detection is mandatory**: probe GPU vendor/driver/HDRP support
at startup; never show unavailable methods as selectable-working. Detection
result is logged and visible on the Quality page (Advanced).

## 4. Auto Quality Controller

Inputs: averaged GPU frame time (rolling window, e.g. 2 s), target FPS,
current tier. Hysteresis: degrade after sustained overrun (e.g. >1.15×
budget for 3 s), upgrade only after sustained headroom (e.g. <0.80× budget
for 10 s). Never oscillates per-frame. Every automatic change is logged
with reason (`QualityChanged` event → Diagnostics + Analytics).

### Degradation order (first → last)

```text
1. non-critical effects        (motion blur, transparent FX quality,
                                reflections, secondary/rim lights)
2. shadow resolution           (then cascade count; contact shadows kept
                                as long as possible — they carry the illusion)
3. AO / secondary lighting     (RTAO→SSAO→reduced radius/intensity)
4. render scale / upscaler     (native→DLSS/FSR Quality→Balanced→
                                Performance→dynamic min scale)
5. LOD / light counts          (LOD bias, max active arm LOD,
                                max high-quality lights)
LAST (protected):              arm skin shading (SSS) and finger/hand
                               geometry quality — preserved as long as
                               possible; the hand is the product.
```

Upgrade path is the exact reverse.

### Never degraded automatically

- Wall occlusion correctness (clipping is binary-correct at every tier).
- Contact shadow **presence** (intensity may reduce, never to zero while
  any shadow tier remains).
- Target FPS below configured floor — if tier 5 exhausted and FPS still
  under floor, raise a health warning instead of visually breaking the show.

## 5. Per-topology considerations

- Independent nodes each run their own controller (heterogeneous GPUs are
  expected); coordinator surfaces per-node quality tier on the Dashboard so
  an operator sees a mismatched wall at a glance.
- Combined canvas: one controller, budget measured on the full logical
  canvas.
- Transparent overlay mode: overlay pass budget excludes the external
  signage app; measure our GPU time only.

## 6. Performance engineering rules

- No repeated per-frame allocations during show playback (GC spikes are a
  release blocker; enforced by soak tests, spec §27).
- Texture streaming with explicit budget; VRAM tracked in telemetry.
- LOD profiles per ArmAgent (`PerformanceLODProfile`); 8+ arms run at
  appropriate LOD, near/hero arms keep max quality.
- Motion vectors on for temporal upscalers; motion blur default off for
  interactive clarity.
