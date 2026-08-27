# Architecture Decision Records

One ADR per open core-technology choice from `CLAUDE.md` § Stack. Each proposes a decision with at
least two rejected alternatives and the reason for rejecting them.

**Gate:** per `MILESTONES.md` M0, no application code is written before Desmond approves these.
Approval = status changes from *Proposed* to *Accepted* (with date); a rejection gets a note and a
revised proposal.

| ADR | Decision | Status |
|---|---|---|
| [ADR-001](ADR-001-media-server.md) | Media server / SFU | Proposed |
| [ADR-002](ADR-002-receiver-runtime.md) | HoloSee receiver runtime | Proposed |
| [ADR-003](ADR-003-encoder-abstraction.md) | Encoder abstraction | Proposed |
| [ADR-004](ADR-004-signaling-control.md) | Signaling & device control transport | Proposed |
| [ADR-005](ADR-005-hosting-edge.md) | Hosting & edge topology | Proposed |

Format: Context → Proposed decision → Rejected alternatives → Consequences → Revisit triggers.
