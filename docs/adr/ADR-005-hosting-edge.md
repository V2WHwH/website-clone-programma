# ADR-005 — Hosting & edge topology: one EU region first, expand on measurements

**Status:** Proposed (awaiting Desmond) · **Date:** 2026-08-27 · **Informs:** `ARCHITECTURE.md` §5, M2, M7

## Context

HEREweHOLO's customers are EU-first with international senders (the acceptance scenario streams
New York → Amsterdam). Media latency is dominated by sender↔SFU↔receiver path length; the control
plane is latency-insensitive. We need EU data residency, TURN that works from hostile networks, and a
topology that can add regions without re-architecture — but multi-region on day one is cost and
complexity without data.

## Proposed decision

- **One EU region** hosting everything: control plane, PostgreSQL, SFU, TURN.
  Provider proposal: **Hetzner (Falkenstein/Nuremberg)** — EU-owned, strong price/performance for
  bandwidth-heavy media (egress pricing is the dominant cost driver of this product), dedicated vCPU
  options for the SFU. **AWS eu-central-1 is the acceptable alternative** if Desmond prefers managed
  services (RDS, backups) over cost — the deployment is containerized either way, so this is a
  provider decision, not an architecture decision.
- **TURN co-located** with the SFU, UDP + TCP + TLS/443 (M2's forced-relay test runs against it).
  A second TURN node lands in North America together with the first NA device deployment — TURN first,
  SFU regions later: relay placement fixes most of the far-sender pain at a fraction of the cost.
- **Region-aware room placement from day one in the data model** (sessions record their edge route —
  the UI already shows it), so adding an SFU region later is configuration plus data, not schema
  changes.
- Latency SLOs from `STREAMING.md` §1 are recorded per session; **region expansion is triggered by
  that data**, not by intuition.

## Rejected alternatives

1. **Multi-region mesh from day one** — real global products end up there, but before any fleet
   exists it multiplies infrastructure cost, deploy complexity and failure modes while the team should
   be proving camera-to-glass. Rejected as premature; the expansion path above keeps it cheap later.
2. **Fully managed media edge (Cloudflare Calls / managed WebRTC platforms)** — attractive
   operational story, but it moves the media plane — the product's core, including the honesty
   telemetry per chain stage — onto a vendor's roadmap and pricing. Rejected for control and cost
   predictability; LiveKit Cloud (ADR-001) already covers the "we need managed after all" scenario
   with less lock-in.

## Consequences

- One region = one failure domain at first: mitigated by IaC (rebuild from scratch documented and
  tested), daily tested backups (PostgreSQL PITR), and the receiver's offline fallback behavior
  (M5) which keeps customer displays presentable through a cloud outage.
- Egress cost per session becomes a tracked metric in M7 analytics (it is in the milestone text).

## Revisit triggers

Latency SLO misses attributable to path length; first non-EU fleet deployment (→ TURN node, then
measure again); egress pricing shifts that change the provider calculus; data-residency requirements
from a customer contract.
