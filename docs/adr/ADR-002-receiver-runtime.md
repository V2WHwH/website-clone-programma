# ADR-002 — HoloSee receiver runtime: Chromium shell now, native gate at M6

**Status:** Proposed (awaiting Desmond) · **Date:** 2026-08-27 · **Informs:** `ARCHITECTURE.md` §2, M5/M6/M8

## Context

The receiver decodes and renders portrait 4K on a Windows PC driving the Holobox, unattended for
months, in kiosk mode. This choice constrains GPU access and zero-copy rendering, so it is not a
preference question — but it is also on the critical path of every milestone from M1 on, and WebRTC
maturity outside Chromium is the single biggest schedule risk.

## Proposed decision

**Phase 1 (M1–M5): Electron/Chromium playback shell + separate Node/Go device agent.**
Chromium's WebRTC stack is the reference implementation: hardware H.264/VP9/AV1 decode via D3D11,
proven 4K playback, and the exact same code path as the browser sender — which halves our debugging
surface while the streaming core stabilizes. Kiosk mode, watchdog and fallback content are agent/OS
concerns and independent of this choice.

**Phase 2 (M6 gate): measured go/no-go on native.** The M6 benchmark harness runs the acceptance
scenario at `2160 × 3840 @ 30` on reference hardware. The Chromium shell **stays** only if it holds:
GPU ≤ 60%, zero dropped frames over 30 min, VRAM flat, decode latency within the budget in
`STREAMING.md` §1. If it fails any of these, we build the native playback process —
**Rust + GStreamer (D3D11/DXVA zero-copy path)** — behind the same agent, and the swap is invisible
to the cloud. The native path is designed now (process boundary in `ARCHITECTURE.md` keeps playback
isolated) so the gate is a swap, not a rewrite.

## Rejected alternatives

1. **Native-first from day 1 (C++/Rust + libwebrtc or GStreamer)** — highest ceiling
   (true zero-copy), but libwebrtc integration and portrait-4K rendering plumbing would consume the
   early milestones on infrastructure instead of proving the product end to end. Rejected for
   sequencing, not for capability — it remains the explicit fallback at the M6 gate.
2. **WinUI 3 / Media Foundation app** — good decode story, but WebRTC support is not first-class:
   we would glue a third-party WebRTC stack to MF ourselves and own every codec/adaptation bug alone.
   Rejected: highest integration risk with the smallest community behind it.

## Consequences

- Two receiver processes from M1 (agent + playback) — that boundary is what makes the M6 swap cheap.
- Electron adds ~150 MB footprint and Chromium update cadence; the M8 updater must handle it.
- We accept Chromium's compositor between decode and glass in phase 1 — measured, if it costs us the
  4K claim, the gate fires.

## Revisit triggers

M6 benchmark failure (→ native path, already specified); Chromium removes/changes a codec path we
depend on; fleet hardware turns out weaker than reference (→ ladder + gate re-run on the real floor).
