# F2 — Voice Bridge: live translation

**Status:** Proposed (phase 2+) · **UX:** mockups §07 / Figma *07 Concepts* · **Informs:** `STREAMING.md` §6, ADR-004

## Why

An international telepresence product has a language barrier built in: New York presents in English,
the Amsterdam reception listens in Dutch. Removing that barrier live — in the speaker's own moment —
is a demo that sells itself, and the audio pipeline insertion point **already exists**: the voice-
effects slot (after AEC, before encode) that the voice changer uses.

## What the user sees

A **Translate** control next to Effects, three modes, each with an info dot:

- **Off** — default.
- **Subtitles** ⓘ — *Live captions on the Holobox in the destination's language. Fast (~1 s), your
  own voice stays untouched.* Receiver renders captions in a lower-third; sender sees a mirror of
  what the receiver reads.
- **Translated voice** ⓘ — *Amsterdam hears a translated voice instead of yours. Adds ~2 s delay —
  great for presentations, less for quick conversation.* The sender UI shows the active pair
  (`EN → NL`) and the measured added latency, honestly, in the status strip area.

Language pair defaults: source from the sender's browser locale, target from the destination
device's location — both overridable.

## Technical approach

- Pipeline: mic → AEC → **STT (streaming) → MT → TTS** → encode. Runs as a cloud audio service next
  to the SFU (media never in JS on the client path; the service is Go/Rust per project rules).
- **Subtitles mode** skips TTS: STT+MT only, captions travel as data messages to HoloSee, rendered
  locally — low latency, no audio surgery.
- **Voice mode** replaces the outgoing audio track with the TTS track; the original voice is still
  recorded in session stats as "translated: true, added_latency_ms: measured".
- Echo cancellation is untouched: translation sits *after* AEC, so the return-audio loop never sees
  synthetic audio it can't cancel.
- Voice preservation (TTS in the speaker's own timbre) is explicitly a later step — start with one
  clear neutral voice per language.

## Impact on the platform

- First feature that runs media through a cloud service → validates the GStreamer/service
  abstraction path from ADR-003 before recording/transcode need it.
- Captions channel = the SFU's data channel (LiveKit provides it) — no new transport.
- Privacy: audio leaves the session for STT/MT → must be in the DPA; per-org switch to disable the
  feature entirely (`SECURITY.md` audit: translation on/off is logged per session).

## Open questions

STT/MT/TTS vendor vs. self-hosted (quality vs. data residency — EU-hosted models preferred) ·
which languages at launch (NL/EN/DE/FR covers the current fleet) · caption typography on 2160 × 3840
portrait (legibility from 3 m).
