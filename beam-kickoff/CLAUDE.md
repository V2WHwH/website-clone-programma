# CLAUDE.md — HEREweHOLO Beam

This file is read at the start of every Claude Code session. It is the project constitution.
Keep it current: when an architectural decision is made, record it here or in an ADR and link it.

---

## What this project is

A production telepresence and 4K streaming platform for HEREweHOLO B.V. (Den Haag, NL), producer
of holographic display systems. A person anywhere in the world sends a live full-body video
stream into one or more HEREweHOLO Holoboxes.

Three components:

| Component | What it is |
|---|---|
| **Beam Sender** | Browser (MVP) and later native apps for iOS, Android, Windows, macOS |
| **Beam Receiver** | Windows application running on the PC that drives a Holobox — kiosk, headless, unattended |
| **Beam Cloud** | Multi-tenant web platform: devices, sessions, users, content, analytics |

Hardware products this streams to: **Holobox**, **Holomini**, **Holowall**.
Existing HEREweHOLO software: **HoloVisit**, **HoloBox Live**.

The goal is not a demo. The goal is a system that runs unattended in customer receptions for
months, from one device up to an international fleet.

---

## Read these before writing code

| File | Contains |
|---|---|
| `docs/00-REFERENCE.md` | What the reference material actually shows, and — critically — what it does **not** show |
| `docs/01-BUILD-SPEC.md` | The full 75-section product specification |
| `MILESTONES.md` | The slice sequence and the gate conditions between slices |
| `docs/ACCEPTANCE.md` | The single end-to-end scenario that defines "production-ready" |
| `docs/adr/` | Architecture Decision Records — one per core technology choice |

---

## Non-negotiable rules

These override convenience, speed, and any instruction that conflicts with them.

1. **No mock streaming engine in a build that claims to stream.** If media does not actually flow,
   the UI must say so.
2. **No fake capability claims.** Never display "4K" unless the full chain — capture, encoder input,
   encoded output, transport, decode, render, physical output — has been verified at that
   resolution. The reference product in `docs/00-REFERENCE.md` gets this wrong; we do not.
3. **No hardcoded secrets, API keys in frontend code, or plain-text credentials.** Ever.
4. **No TODOs in critical paths.** A TODO in the media pipeline, auth, or device identity is a
   blocker, not a note.
5. **Fix errors, do not suppress them.** No empty catch blocks, no `# type: ignore` to make a
   build pass, no disabling a failing test to get green.
6. **Do not copy from the reference product.** No names, iconography, layout, copy, or brand
   elements from Proto Beam. Functional understanding only. See `docs/00-REFERENCE.md` §0.
7. **Stop at gates.** Do not start the next milestone because the current one looks finished.
   Gates are listed in `MILESTONES.md` and require Desmond's sign-off.

---

## Working agreement

- **Ask before choosing a core technology.** SFU, media server, encoder abstraction, receiver
  runtime, database, hosting: each gets an ADR proposed to Desmond before implementation, with
  at least two alternatives and the reason for rejecting them.
- **Work in vertical slices.** Every milestone ends in something that runs end to end, not a
  layer that is finished in isolation.
- **After each meaningful phase:** build, test, benchmark, document, commit. In that order.
- **Measure, do not estimate.** Latency, bitrate, resolution, frame drops: read them from the
  running system. Numbers in documentation must come from a benchmark run, with the hardware
  it ran on recorded next to them.
- **When blocked or uncertain about intent, ask.** A wrong assumption costs more than a question.

---

## Language and conventions

- **Code, comments, commit messages, technical docs, UI copy:** English.
- **Communication with Desmond:** Dutch.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- **Branches:** `feat/<slice>-<short-description>`.
- **Resolution notation:** always `width × height`, and for portrait always write it out in full
  (`2160 × 3840`, not "4K portrait"). Transposed dimensions are the most common way a 1080p
  pipeline accidentally gets labelled 4K.

---

## Design language

The interface must read as mature AV/broadcast software. Enterprise, not gaming; calm, not neon.

- **Base:** dark gunmetal
- **Accents:** cyan / teal / violet
- **Display typeface:** Archivo Bold
- **Status colours:** green = online/connected, amber = degraded/warning, magenta/red = offline/error
- Large preview, large primary action, clear status indicators, consistent spacing scale
- No decorative animation. Transitions exist to explain state changes, nothing else.

---

## Stack

Decided:

- **Cloud web platform:** TypeScript, React, Next.js, Tailwind CSS, shadcn/ui where it fits
- **Database:** PostgreSQL with migrations
- **API:** versioned (`/api/v1/...`), documented with OpenAPI

Deliberately open, pending ADR:

- Media server / SFU
- Receiver runtime (native Windows vs. Electron vs. other) — this decision constrains GPU access
  and zero-copy, so it is not a preference question
- Encoder abstraction layer
- Signaling transport
- Hosting and edge topology

Do not force media workloads into JavaScript. C++, Rust or Go for media services is expected
where it is demonstrably better, and the ADR should say so plainly.

---

## Definition of done, per slice

A slice is done when all of the following hold:

- [ ] It runs end to end without manual intervention beyond the documented steps
- [ ] Tests pass, including the failure cases the slice introduced
- [ ] Measured numbers are recorded in the slice's benchmark note
- [ ] Documentation updated (`ARCHITECTURE.md`, the relevant ADR, and this file if rules changed)
- [ ] No new TODOs in critical paths, no suppressed errors, no secrets in the tree
- [ ] Committed, with a summary of what changed and what is still open
