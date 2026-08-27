# Prompt 01 — M1: camera to glass

Use only after the M0 ADRs are approved.

---

Start milestone **M1** from `MILESTONES.md`. Re-read `CLAUDE.md` first, and the ADRs you wrote
in M0 — implement what they decided, and if you find yourself wanting to deviate, say so and
update the ADR rather than quietly doing something else.

## The target

A live camera image from a browser, fullscreen on a second machine's display, on the same LAN.
That is the entire scope.

## Deliberately out of scope

Authentication. Database. Cloud. Device pairing. Multiple destinations. Adaptive quality. Return
feed. Styling beyond legibility. A hardcoded room identifier is acceptable in this slice and only
in this slice — mark it with a comment naming M3 as the milestone that removes it.

## Build

1. A minimal signaling service.
2. A browser sender page: camera permission, live preview, connect action, and a visible
   connection state.
3. A receiver that renders the incoming stream fullscreen, with no window chrome and no visible
   desktop. Use the runtime decided in the ADR.
4. A diagnostic output — console is fine for now — reporting the resolution at **every** stage:
   capture, encoder input, encoded output, transport, decode, render, physical output. Seven
   numbers. Print them all, every time, whether or not they agree.

## Measure

Before you call this done, measure and record in `docs/benchmarks/m1.md`:

- Glass-to-glass latency. Use a millisecond timer on screen filmed by the camera, or an equivalent
  method — state which you used, because the method affects the number.
- Actual negotiated resolution and framerate
- Bitrate over a two-minute run
- Dropped frames
- The hardware and network the run happened on

Do not write numbers you did not measure. If something cannot be measured yet, write that instead.

## Failure cases to handle now

Cheap here, expensive later:

- Camera permission denied
- No camera present
- Signaling unreachable
- Peer connection fails to establish
- Peer disconnects mid-stream

Each needs a clear state in the UI. Not a silent failure, not a stack trace.

## Done means

The `MILESTONES.md` M1 gate: a live face fullscreen on a second machine, with the diagnostic chain
reporting the same resolution at all seven stages, and latency recorded.

Commit, then summarise: what works, what the measured numbers are, what surprised you, and what
you now think is the biggest risk in M2. Then stop.
