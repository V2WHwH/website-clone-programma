# STREAMING — protocols, codecs, adaptive ladder

> M0 deliverable. Status: **draft for Desmond's review**. Protocol/server product choice: ADR-001;
> receiver decode path: ADR-002. Portrait resolutions are always written in full (`2160 × 3840`),
> never "4K portrait" — transposed dimensions are how 1080p pipelines get mislabelled 4K.

## 1. Requirements that drive everything

- Live, bidirectional (main stream + return feed + return audio), conversational latency.
- Portrait-first: `1080 × 1920 @ 60` and `2160 × 3840 @ 30` as user-facing tiers.
- Sender is a browser on unknown networks (incl. 4G); receiver is behind consumer NAT (M2 gate).
- Sessions must degrade under bandwidth loss and recover without flapping — never end on their own.
- Every claim in the UI must be measurable at every chain stage (project rule 2).

**Latency budget (glass-to-glass, proposal):** LAN ≤ 250 ms · same continent ≤ 400 ms P50 /
600 ms P95. Measured, not estimated: the M1 diagnostic records it and every session logs it.

## 2. Protocol choice

| Candidate | Latency | Browser send | NAT traversal | Verdict for MVP |
|---|---|---|---|---|
| **WebRTC** | 100–500 ms | native | ICE/STUN/TURN built in | **Chosen — only option that meets all three hard constraints** |
| SRT | 300–800 ms | none (native apps only) | manual | Later: pro/native ingest (explicitly out of scope until after M8) |
| RTMP | 2–5 s | none (Flash is dead) | ok | Rejected: latency, no browser capture, H.264-only |
| HLS/LL-HLS | 3–30 s / ~2 s | none for ingest | trivial | Rejected for live path; possible later for passive viewers |

WebRTC carries **both directions**: sender → SFU → receiver, and receiver camera/mic → SFU → sender
(return feed). One room per session; the SFU (ADR-001) routes, never mixes.

## 3. Codec ladder

Reality check before preference: 4K in a browser sender means the *encoder* is whatever the sender's
hardware offers WebRTC. The honest ladder:

| Codec | Browser encode support | Receiver HW decode | Position |
|---|---|---|---|
| **H.264** | universal (usually HW) | universal (DXVA) | **Baseline — every session must be able to fall back to it** |
| **VP9** | broad (often SW at 4K) | broad on modern GPUs | Preferred at 1080p when CPU headroom allows |
| **AV1** | encode: recent flagships only, costly | decode: GPUs ≥ 2022 | **Not MVP default.** Enabled per-session only when pre-flight verifies both ends; bitrate savings (~30%) matter at 4K, so revisit at M6 with benchmark data |

Codec preference is negotiated per session from measured capability (M6 "capability negotiation"),
not assumed. The benchmark harness (M6) records encode/decode latency, CPU/GPU/VRAM and dropped frames
for H.264/HEVC*/AV1 at 4K30 and 4K60 on reference hardware — numbers in docs come from those runs.
(*HEVC only if licensing is acceptable; decision deferred to M6, default is to skip it.)

## 4. Tiers and the adaptive ladder

User-facing tiers (Quality screen): **Auto (recommended)** · Full HD · 4K.

| Rung | Resolution | fps | Target bitrate |
|---|---|---|---|
| 6 | 2160 × 3840 | 30 | 18 Mbps |
| 5 | 1440 × 2560 | 30 | 10 Mbps |
| 4 | 1080 × 1920 | 60 | 6 Mbps |
| 3 | 1080 × 1920 | 30 | 4 Mbps |
| 2 | 720 × 1280 | 30 | 2.5 Mbps |
| 1 | 540 × 960 | 30 | 1.2 Mbps |

Rules (all surfaced honestly in the status strip):

- **Down fast, up slow.** Step down on the first congestion signal (RTCP loss/RTT trend, keyed to
  `degradationPreference: maintain-framerate` below 4K, `maintain-resolution` only at rung 6).
  Step up one rung only after ≥ 30 s of stable headroom ≥ 1.5× the next rung's bitrate — hysteresis
  prevents flapping (acceptance scenario tests both directions).
- **Simulcast** (H.264/VP9) from the sender at three spatial layers so the SFU can serve a degraded
  receiver without touching the sender; SVC once AV1 sessions exist.
- **The strip shows the measured rung**, not the selected tier. Selecting "4K" while the network
  delivers rung 4 shows `1080 × 1920` — rule 2 is UI law.

## 5. NAT traversal & pre-flight

- ICE with STUN first; **TURN (UDP, then TCP/TLS on 443)** as verified fallback — M2 gate forces the
  relay path deliberately and measures it from home, mobile and corporate networks.
- **Pre-flight (before GO LIVE, ~10 s):** probe through the same TURN infrastructure the session would
  use; measure uplink throughput, RTT, jitter, loss; verdict = highest rung with 1.5× headroom.
  The verdict wording in the UI states what will actually start, and what Auto will do next.

## 6. Audio

- Opus 48 kHz mono (voice) — 32–64 kbps, DTX on.
- **Echo cancellation mandatory and verified** on both legs (browser AEC constraint on; receiver-side
  AEC for the return microphone). A session with AEC off must not be startable (M4 deliverable).
- Voice effects (phase 2) insert into the sender's outgoing audio graph **after AEC, before encode**
  — the receiver hears the effect; AEC never sees it.

## 7. The resolution chain (honesty instrumentation)

Seven measured stages, one session ID:

```
capture → encoder input → encoded output → transport → decode → render → physical output
```

Each stage reports `width × height @ fps` into session telemetry. M1 ships this as a diagnostic
printout; M6 exposes it in-product. If any stage disagrees with the label shown to the user, the build
fails acceptance regardless of everything else.

## 8. Open questions (tracked, not blocking M1)

- HEVC licensing position (M6).
- Recording/egress pipeline (post-M8; SFU choice in ADR-001 keeps the door open).
- Multi-destination fan-out efficiency (SFU-side forking; explicitly post-M8).
