# Prompt 00 — Bootstrap (M0: research and design)

Paste this as your first message to Claude Code, in an empty repository containing `CLAUDE.md`,
`MILESTONES.md`, and the `docs/` folder.

---

Read `CLAUDE.md`, `MILESTONES.md`, `docs/00-REFERENCE.md`, `docs/01-BUILD-SPEC.md` and
`docs/ACCEPTANCE.md` before doing anything else.

You are starting milestone **M0**. Write **no application code** in this milestone. If you find
yourself scaffolding a project, stop — that is M1.

Work through the following, in order.

## 1. Establish the constraints

Ask me about anything you need that is not in the documents and that would change an architectural
decision. Likely gaps: target hardware in the Holoboxes (GPU model, OS version), expected
concurrent sessions in year one, hosting preferences or restrictions, whether data must stay in
the EU, existing HEREweHOLO infrastructure you should integrate with rather than replace, and
budget ceilings for managed media infrastructure.

Ask these together, as one list. Do not start research on assumptions you could have resolved
with a question.

## 2. Research, with current sources

For each open decision in `CLAUDE.md` § Stack, research what production-grade options exist
**today** — not what you remember. Media infrastructure moves fast and your training data is old.
Check release notes, current documentation, and known production deployments.

Cover at minimum:

- WebRTC SFU options — self-hosted and managed, with realistic operational cost at our scale
- SRT and RTMP ingest, and whether they belong in the MVP at all
- Receiver runtime: what actually gives us zero-copy GPU decode to fullscreen on Windows, and
  what each option costs us in development speed
- Hardware encoder abstraction: NVENC, Quick Sync, AMF, VideoToolbox — and whether a library
  covers all four adequately or we wrap them ourselves
- AV1 hardware encode and decode support in practice, on the hardware we will actually deploy
- TURN infrastructure, self-hosted versus managed
- Edge topology options for Europe, North America, Middle East, Asia Pacific

## 3. Write the ADRs

One Architecture Decision Record per decision, in `docs/adr/NNNN-<slug>.md`. Each contains:

- **Context** — what forces this decision, what constraints apply
- **Options** — at least three, with the honest case for each
- **Decision** — which one, and precisely why
- **Rejected because** — for each option not chosen, the specific reason
- **Consequences** — what this makes easy, what it makes hard, what it locks us into
- **Revisit when** — the condition under which this should be reconsidered

Where you are genuinely uncertain, say so in the ADR rather than manufacturing confidence. An ADR
that says "we chose X provisionally, and here is the experiment that would settle it" is more
useful than one that pretends the question was easy.

## 4. Write the design documents

`ARCHITECTURE.md`, `STREAMING.md`, `SECURITY.md`, `DATA-MODEL.md` per `MILESTONES.md` § M0.

`ARCHITECTURE.md` must include the full media path as a diagram, with the process and machine
boundary marked at every hop, and the point where each format conversion happens. If there is a
CPU round-trip anywhere in that path, mark it and explain why it is unavoidable.

## 5. Refine the plan

Update `MILESTONES.md` with what you learned: realistic scope per slice, dependencies you found,
and anything in the sequence that research showed to be in the wrong order.

## 6. Stop

Present a summary: the decisions you propose, the questions still open, and the three things most
likely to go wrong in M1. Then wait. Do not begin M1 until I have approved the ADRs.
