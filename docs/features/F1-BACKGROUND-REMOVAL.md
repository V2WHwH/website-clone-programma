# F1 — Studio Matte: AI background removal

**Status:** Proposed (phase 2+, first in line) · **UX:** mockups §07 / Figma *07 Concepts* · **Informs:** `STREAMING.md` §3–4, ADR-003

## Why this is the one

The reference product's clean full-body cutout came from a **physical white cyclorama in a studio**.
No customer has one. In practice a presenter beams from an office or hotel room — cluttered
background, illusion gone. Software matting turns any room into a studio, and moves the product from
"we schedule a studio slot" to "click the link". That is the difference between demo usage and daily
usage.

## What the user sees

One control in the preview (and live): **Background — Real · Clean cut · Studio**, with an info dot:

> *Clean cut removes your background. The Holobox shows you against pure black — exactly what a
> hologram needs. Works best with even light on your face and body.*

- **Real** — camera as-is (default; honest baseline).
- **Clean cut** — subject composited over pure black *on the sender, before encode*. Black is what
  the Holobox optics want; nothing special is needed on the receiver.
- **Studio** — subject over a subtle branded backdrop (per-organisation asset from Cloud), for
  displays that are not holographic (Holowall).
- A live **matting-quality chip** ("Matting: good · even lighting") driven by mask confidence —
  honest feedback instead of a silently bad cutout.

## Technical approach

- **Sender-side segmentation** in the browser: WebGPU person-segmentation model
  (MediaPipe/RVM-class), mask computed at 512–720p and upscaled with edge feathering; composite in a
  WebGL/WebGPU canvas that feeds `captureStream()` → the normal WebRTC pipeline. The effect travels
  in the outgoing stream — the same principle as face/voice effects.
- **No alpha over the wire.** WebRTC video carries no alpha channel; compositing over black
  sender-side sidesteps this entirely and matches the Holobox's dark cabinet.
- **Honesty budget:** matting costs GPU. The capability probe (M6) measures it; on devices that
  cannot hold 2160 × 3840 @ 30 with matting, the ladder caps at 1080 × 1920 @ 60 and the status strip
  shows the real number. The UI never claims 4K it cannot deliver — rule 2 applies to features too.
- Fallback: if the model fails to load or confidence collapses, revert to **Real** with a status
  chip — never a frozen or corrupted frame.

## Impact on the platform

- Encoder input becomes a canvas stream → capture stage of the resolution chain reports the canvas
  resolution (chain instrumentation already designed for this).
- Per-org backdrop assets → small addition to the Cloud content model (phase 2 content library).
- Benchmark harness (M6) gains a "matting on" column: CPU/GPU/fps per device class.

## Open questions

Model licensing (MediaPipe is Apache-2.0; RVM MIT) · minimum device floor for guests on old phones
(→ subtitles-style graceful "not available on this device") · Holomini/Holowall backdrop defaults.
