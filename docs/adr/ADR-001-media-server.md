# ADR-001 — Media server / SFU: LiveKit (self-hosted)

**Status:** Proposed (awaiting Desmond) · **Date:** 2026-08-27 · **Informs:** `STREAMING.md`, `ARCHITECTURE.md`

## Context

We need a WebRTC SFU that: routes portrait 4K between one browser sender and 1..n Windows receivers
plus a return feed; supports simulcast now and SVC/AV1 later; exposes room-scoped tokens our control
plane can mint; self-hosts in the EU; and leaves the door open for recording/egress (post-M8) without
a re-platform. Media must not be forced through JavaScript (project rule) — the server is infrastructure
we operate, not code we write.

## Proposed decision

**LiveKit, self-hosted (open source, Go)** in our EU region, one deployment per environment.
Client SDKs for web (sender, and receiver if ADR-002's Chromium path is approved) and native
(if the receiver goes native later). Room tokens minted exclusively by our control plane.

Why this one: first-class simulcast/SVC and adaptive subscription (the "down fast, up slow" ladder in
`STREAMING.md` §4 maps to built-in mechanisms), AV1 support, active development, egress/recording
components exist for later, and the operational shape (single Go binary + Redis for multi-node) is
manageable for a small team. LiveKit Cloud exists as a managed escape hatch with the same API if
self-hosting becomes an operational burden — that switch would not touch application code.

## Rejected alternatives

1. **mediasoup** — excellent, minimal SFU library; but it is a *library*, not a server: signaling,
   scaling, recording, token model and ops tooling are all ours to build and maintain. That is weeks of
   infrastructure work that LiveKit ships tested, and it permanently raises the cost of every later
   feature (egress, multi-node). Rejected on total cost of ownership, not capability.
2. **Janus** — mature C SFU with a plugin model; but modern client-side features we depend on
   (simulcast/SVC ergonomics, adaptive streaming, first-party web/native SDK quality) require more
   custom plugin and client work, and the per-plugin architecture adds operational surface. Rejected:
   more glue, fewer guarantees, older client story.

Also considered, rejected faster: fully managed video APIs (Daily/Agora/Twilio-class) — vendor
lock-in on the core of the product, per-minute pricing at 4K, and less control over the honesty
telemetry we require at every chain stage.

## Consequences

- We operate Redis alongside the SFU for multi-node later; single-node needs neither.
- Our control plane stays the only token minter (`SECURITY.md` §4) — LiveKit's own API keys live
  server-side only.
- M2's TURN requirement is satisfied with coturn deployed next to the SFU (LiveKit integrates but does
  not replace it).

## Revisit triggers

Self-hosting consumes disproportionate ops time (→ LiveKit Cloud); a hard requirement appears that
LiveKit cannot meet (→ re-open with measurements); license/community health changes materially.
