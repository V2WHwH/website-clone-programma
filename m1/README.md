# M1 — camera to glass

The smallest thing that proves the product exists: browser camera → minimal signaling → receiver on
the same LAN → fullscreen output, with a **diagnostic printout of the full resolution chain**
(capture → encode → transport → decode → render → physical output).

Scope guardrails from `MILESTONES.md` M1: no auth, no database, no cloud, no UI polish. The room id
`m1` is hardcoded — allowed *here and only here*. The SFU (ADR-001) arrives in M2; M1 uses direct
LAN WebRTC behind a dumb WebSocket relay precisely because that is the smallest honest slice.

## Run it

```bash
cd m1
npm install
npm start          # builds and serves on :8787
```

- **Sender** (machine with the camera): `http://localhost:8787/sender.html` — allow the camera,
  press **Connect**.
- **Receiver** (machine driving the display): `http://<sender-LAN-ip>:8787/receiver.html` — click
  once for fullscreen. Kiosk: `chromium --kiosk --autoplay-policy=no-user-gesture-required
  "http://<ip>:8787/receiver.html?nofs=1"`.
- Camera on a non-localhost origin needs HTTPS; for the M1 LAN test start the *sender's* browser
  with `--unsafely-treat-insecure-origin-as-secure=http://<ip>:8787` (dev-only). Proper TLS comes
  with the M2 deployment.

Order does not matter; the sender starts an offer whenever a receiver is present, and the receiver
silently rejoins if the page or network hiccups.

## The diagnostic chain (the deliverable)

Both pages render a live chain table (receiver: bottom-left, `d` toggles) and expose it as
`window.__diag`. Every value is measured (`getStats()`, `getSettings()`,
`requestVideoFrameCallback`); estimates are labelled as estimates.

Expected honest behavior you will see: right after connecting, the encoder starts low
(`encoded output` 640 × 360, `limit: bandwidth`) and ramps toward the capture resolution as the
bandwidth estimator gains confidence. The verdict line reports **MISMATCH** until every measured
stage agrees — that is the point of the instrumentation, not a bug. `physical output` is what the OS
reports and is excluded from the verdict (the video is scaled onto it); verify the real panel mode
on the Holobox PC.

## Glass-to-glass latency (gate measurement)

App-level stats cannot see the camera exposure or the display scan-out, so the gate number is
measured optically:

1. Open `http://<ip>:8787/clock.html` fullscreen on a third screen (or the sender machine).
2. Point the sender camera at that clock; go live.
3. Photograph the clock screen and the receiver screen **in one frame** (phone photo is fine).
4. Glass-to-glass = clock value on the clock screen − clock value visible inside the receiver's
   video. Repeat 5×, record min/median/max in the table below.

The receiver's diag also prints `jitterbuf ~N ms` and RTT — useful for trend-watching, explicitly
labelled as *not* glass-to-glass.

## Automated smoke test

```bash
npm run test:e2e   # needs Chromium; set PW_CHROMIUM=/path/to/chrome if not /opt/pw-browsers/chromium
```

Spawns the signaling server plus a headless sender and receiver and asserts that frames decode and
all measured receiver stages agree. The sandboxed CI container exposes no capture devices (even
Chromium's `--use-fake-device-for-media-capture` enumerates zero), so the test drives the sender
with `?fake=1` — a synthetic 1280 × 720 @ 30 canvas stream. Everything after capture (encode,
signaling, transport, decode, render) is the real pipeline.

Recorded sandbox run (2026-08-27, headless Chromium 141, loopback):

```
receiver: transport RTT 1 ms · decode 640 × 360 @ 30 (jitterbuf ~5 ms) · render 640 × 360
sender:   capture 1280 × 720 @ 30 · encoded 640 × 360 @ 30 (limit: bandwidth, ramping)
verdict:  ALL MEASURED RECEIVER STAGES AGREE — E2E OK
```

## Gate checklist (Desmond signs off — `MILESTONES.md` M1)

- [ ] A live face appears fullscreen on a **second machine** on the LAN
- [ ] The diagnostic chain reports the **same resolution at every stage** (after ramp-up)
- [ ] Glass-to-glass latency measured optically and recorded here:

| Run | Glass-to-glass | Setup (hardware, resolution) |
|---|---|---|
| 1 | _…_ ms | _…_ |

## Explicitly not in this slice

Auth · TLS · STUN/TURN/internet traversal (M2) · SFU (M2) · pairing (M3) · audio & return feed (M4)
· kiosk hardening/watchdog/fallback (M5) · 4K claims (M6 — the chain shown here is how we will
verify them).
