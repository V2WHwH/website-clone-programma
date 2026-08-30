# Milestone Backlog

> Milestone 0 deliverable 10. Matches spec §26; each milestone ships with
> testable acceptance criteria. Test matrix per area: spec §27.

## M0 — Architecture + Figma  ◀ current
- [x] Architecture document set (`Docs/00–09`)
- [x] Module diagram, runtime/editor separation, data model, event model
- [x] Display topology model, network sync design, quality strategy
- [x] Figma design system (F2) + IA (F1) — file `4F1MYTtxdladmJ8NnVNdYA`
- [x] Figma key screens (F3: all 12) + flow strips A–D (F4; interactive
      prototype reactions still to wire in the Figma UI)
- [x] `/FigmaHandoff` extraction (F5): tokens.json, components.md, screens.md
- Rule: **no fake production claim** at any point.

## M1 — Single arm visual proof  ◀ in progress
One realistic rigged arm; wall clipping; extension/retraction; IK target
movement; contact + wall shadow; light calibration; 2160×3840 portrait
profile; quality menu.
**Accept:** stable 60 FPS on reference GPU (RTX 4090); no visible geometry
behind wall; shadow reacts in real time to light direction; settings persist.
**Status 2026-08-30:** engineering scaffold delivered in `UnityProject/`
(wall occlusion, procedural placeholder arm + two-bone IK, light rig,
SSAO/contact-shadow volume, quality presets + auto controller, Look & Depth
panel, versioned persistence, scene wizard). Awaiting first open + 60 FPS
validation on the user's RTX 4090 (checklist in `UnityProject/README.md`);
realistic-arm asset swap (ContentSamples GLB / licensed scan) still open.

## M2 — Multi-arm local scene
Dynamic left/right arms; reach volumes; neighbour graph; two-hand
interactions; handshake/high-five; object grip/handoff.
**Accept:** handoff without teleport; arms addable/removable at runtime.

## M3 — Object/content workflow
GLB/glTF runtime import; PNG/JPG/WEBP card creation (aspect, thickness,
bevel, materials, cutout, frame); grip editing; Product Relay template;
asset library.
**Accept:** advertiser adds a product with zero Unity editing.

## M4 — Multi-display independent nodes
Coordinator + nodes; GlobalWallCoordinateSystem; topology settings;
synchronized timeline; object transfer between nodes; health panel.
**Accept:** boundary handoff clean under injected delay/jitter; node
disconnect/reconnect and coordinator restart recover; no GPU spanning.

## M5 — Camera tracking
Camera manager; person detection/tracking provider; temporary TrackIDs;
direction/velocity/dwell; calibration wizard; point/wave/follow behaviours.
**Accept:** multi-person crossing, stop, reversal, occlusion, camera
disconnect all handled per test matrix.

## M6 — Conditional interactions
Direction-following product relay; dwell triggers; crowd triggers;
cooldowns/frequency caps; attract mode.
**Accept:** no oscillation on direction reversal; caps honored; attract
mode after 60 s of no people.

## M7 — Photo experience
Camera prop; consent/countdown state machine; local capture; PhotoCard
object; PhotoDropEmitter; catch/pass/present; configurable TTL/deletion;
QR retrieval interface.
**Accept:** consent accepted/rejected/timeout, capture failure, frame
failure, TTL deletion all pass; no hidden capture by default.

## M8 — Campaign/analytics production layer
Campaign scheduling; templates (Product Relay, Gift Offer, Product Reveal,
Photo Moment, Point+CTA, Toss/Catch, Multi-hand Reveal, Brand Celebration);
advertiser asset packaging (ContentPackage); analytics dashboard/export;
content validation.
**Accept:** campaign created end-to-end without source edits; analytics
export CSV/JSON with zero PII.

## M9 — Production hardening
Crash recovery; watchdog; auto-start; safe mode; offline mode; network
reconnect; structured logs; diagnostics bundle; asset checksums; update
strategy; operator roles; kiosk lock; long soak tests.
**Accept:** definition of production quality (spec §32) fully satisfied,
including 8 h/24 h+ soak with no allocation spikes or frame-time drift.

## Cross-cutting definition of done (every milestone)
- Versioned config round-trips (unknown keys preserved).
- No new per-frame allocations in show playback paths.
- Health/diagnostics coverage for every new subsystem.
- UI built from the Figma system, not invented ad hoc.
