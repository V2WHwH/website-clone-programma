# HOLO ARMS / WALL HANDS ENGINE — Product Overview

> Milestone 0 deliverable 1: concise restatement of the product goal.
> Source of truth: `CLAUDE_CODE_MASTER_SPEC.md` (master specification).

## What we are building

A production-grade, modular **Windows 11 / Unity 6 (HDRP, DX12)** application for
HEREweHOLO / Holowall / Holobox installations. It is simultaneously:

1. **An art / public-engagement experience** — realistic 3D arms and hands that
   emerge from the rear plane of a display wall, interact with each other,
   with objects, and with tracked passersby.
2. **A commercial advertising platform** — advertisers load products, images and
   campaign media without touching Unity; campaigns are scheduled, triggered,
   frequency-capped and measured.

## The core illusion (non-negotiable)

- Arms exist virtually **behind** the wall plane; only the portion crossing the
  plane is visible (depth/stencil or clip-plane occlusion).
- Contact shadows, projected wall shadows, AO around the emergence point,
  correct perspective and light matching make the arm feel **attached to the
  wall**, not floating in front of a screen.
- Multiple arms cooperate: they pass physical-looking 3D objects and photo
  cards hand to hand — across screens — without teleporting.

## What it is NOT

- Not a signage player with pre-rendered arm videos.
- Not dependent on GPU display spanning (Mosaic/Eyefinity are never required).
- Not a surveillance system: tracking uses temporary session TrackIDs, local
  processing, no facial recognition, no identity database; photos require
  explicit opt-in and auto-delete after a TTL.

## Primary pillars

| Pillar | Meaning |
|---|---|
| Visual realism | Scan-quality arm assets, PBR + SSS skin, real-time shadows/AO; placeholder assets are never claimed to be production quality |
| Display modularity | Independent nodes, combined canvas, or multi-node global wall — operator-selectable, never GPU spanning |
| Object continuity | IK-driven grip handoff with ownership transfer; objects never teleport or duplicate across screens |
| Behaviour depth | Layered animation with emotion as a motion-style modifier, not one-shot clips |
| Operator simplicity | Basic mode with human-readable presets; Advanced mode for integrators |
| 24/7 reliability | Auto-start, watchdog, safe fallback scene, reconnect, diagnostics, soak-tested |
| Privacy by design | Local processing, opt-in photos, TTL deletion, privacy masks, audit log |

## Delivery order (mandated)

1. **Milestone 0** — this architecture package + Figma UX/UI design system and
   flows (Figma is the UI source of truth; implementation follows it).
2. **Milestones 1–9** — staged engineering roadmap
   (see `08_MILESTONE_BACKLOG.md`), each with testable acceptance criteria.

## Guiding principle

> If a shortcut harms the wall illusion, hand realism, object continuity,
> display modularity or 24/7 stability — take the more robust architecture.
