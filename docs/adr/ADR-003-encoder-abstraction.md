# ADR-003 — Encoder abstraction: browser-managed for MVP, GStreamer server-side when needed

**Status:** Proposed (awaiting Desmond) · **Date:** 2026-08-27 · **Informs:** `STREAMING.md` §3, M6

## Context

`CLAUDE.md` lists an encoder abstraction layer as an open choice. But in the MVP the only encoder is
the **sender's browser** (WebRTC owns capture→encode), and the receiver only decodes. A hand-rolled
abstraction now would abstract nothing. The question becomes real in two later places: native senders
(post-M8) and any server-side media work (recording, transcode, fan-out).

## Proposed decision

- **MVP: no custom abstraction.** We steer the browser encoder through its public knobs only:
  codec preference order, simulcast layers, `degradationPreference`, bitrate caps per
  `STREAMING.md` §4. Hardware encoder detection on the *sender* is capability probing (M6), not an
  abstraction layer.
- **Server-side (when recording/transcode lands, post-M8): GStreamer** as the one abstraction over
  NVENC / Quick Sync / AMF / software, in a service written in Go or Rust (media never in JS, per
  project rule). Its plugin model is the industry-standard way to get all four vendor paths with one
  pipeline description, and it matches the possible native receiver path in ADR-002.
- Native mobile senders (post-M8) use platform encoders (VideoToolbox / MediaCodec) via the native
  WebRTC stack — that is the abstraction, we do not wrap it again.

## Rejected alternatives

1. **Custom FFmpeg/libav wrapper service now** — maximum control, but we would write and maintain
   vendor-specific glue (NVENC/QSV/AMF session management, zero-copy surfaces) that GStreamer already
   ships, for a capability (server transcode) the MVP does not use. Rejected: premature, high
   maintenance, zero MVP value.
2. **Direct per-vendor SDK integration (NVIDIA Video Codec SDK, oneVPL, AMF)** — the performance
   ceiling, and the cost ceiling: three SDKs, three failure modes, per-driver testing. Justified only
   if measurements later show GStreamer's overhead breaks a real requirement. Rejected for now on
   maintenance surface.

## Consequences

- M6's "hardware encoder detection with graceful fallback" is implemented as sender-side capability
  probing + codec negotiation, and documented as such.
- The benchmark harness (M6) still measures encode paths per codec/hardware — data that will decide
  whether the post-M8 server-side work is needed at all.

## Revisit triggers

Recording/transcode moves forward in scope; a native desktop sender arrives earlier than planned;
browser encoder quality at `2160 × 3840` proves insufficient on target phones (→ native sender sooner).
