# Open Questions

> Milestone 0 deliverable 11 — only decisions that cannot be made safely
> from the specification alone. Everything else proceeds on the spec's
> stated defaults. **None of these block Milestone 0 (Figma + architecture)
> or Milestone 1 (single-arm visual proof).**

## Blocking before the affected milestone (defaults chosen; please confirm or override)

1. **Reference GPU profile (M1 acceptance).** "Stable 60 FPS on target
   reference GPU" needs a named card. *Working default: NVIDIA RTX 4070-class
   desktop GPU per node.* Blocks M1 sign-off only.

2. **Repository/project location.** This work currently lives in
   `website-clone-programma`, whose name and README describe an unrelated
   MCP-config repo. *Working default: continue here on the designated
   branch and restructure per spec §31.* Confirm whether a dedicated
   repository is intended before the Unity project (M1) lands.

3. **Reference images.** The spec references
   `references/01–03_*.png` as visual inspiration, but they were not
   included in the upload. Not blocking (they are inspiration only), but
   supplying them before final Figma visual polish and M1 art direction
   would improve alignment.

4. **Tracking provider licensing (M5).** `ITrackingProvider` is pluggable
   by design, but the first shipped backend needs a choice with a
   commercial-use license compatible with public advertising installs.
   *Working default: evaluate ONNX-runtime person-detection models with
   permissive licenses; decision memo due at M5 start.*

5. **Photo retention & consent wording (M7).** TTL default and the exact
   opt-in mechanism are deployment/legal decisions (GDPR).
   *Working defaults: TTL = 15 minutes, consent = explicit touch/QR
   confirm, no cloud upload.* Needs sign-off from whoever owns venue
   compliance before first public photo deployment.

## Explicitly NOT asked (spec already decides)

- Engine/pipeline (Unity 6 + HDRP + DX12), display spanning (never),
- AI director (optional, later), NDI (optional, non-critical path),
- privacy defaults (§29), milestone order (§26), Figma-first (§25).
