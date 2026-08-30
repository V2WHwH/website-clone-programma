# ContentSamples — Higgsfield-generated placeholder assets

Generated with Higgsfield (account d.frenckenv2w, workspace plan: ultra) on
2026-08-30. These are **pre-production placeholders / visual references** —
per the master spec (§6), they must never be presented as scan-quality
production assets. The production pipeline expects licensed/scan-quality
arms; these assets unblock early engineering and art direction.

> The session's egress policy blocks the Higgsfield CDN
> (`d8j0ntlcm91z4.cloudfront.net` → 403 on CONNECT), so the binaries could
> not be committed here. Download them from the URLs below (or from the
> Higgsfield library in the web app) on any normal connection and drop them
> into the listed paths.

| Target path | Asset | Higgsfield job ID | URL |
|---|---|---|---|
| `references/01_wall_hands_reference.png` | Five arms emerging from dark wall, dramatic shadows (9:16, 1536×2752) — replaces the missing spec reference image | `4887ec7d-d620-4aa1-b479-e8d07064d3cd` | https://d8j0ntlcm91z4.cloudfront.net/user_3CLfFwPRdxvZEiLtDM59k5jT7uE/hf_20260830_103309_4887ec7d-d620-4aa1-b479-e8d07064d3cd.png |
| `references/02_single_arm_isolated.png` | Isolated realistic arm+hand, studio lighting (16:9, 2752×1536) — 3D source image | `872128fe-ff4a-4814-b67b-b2d97ebac368` | https://d8j0ntlcm91z4.cloudfront.net/user_3CLfFwPRdxvZEiLtDM59k5jT7uE/hf_20260830_103309_872128fe-ff4a-4814-b67b-b2d97ebac368.png |
| `references/03_giftbox_product.png` | Teal gift box product shot (1:1, 2048×2048) — campaign object source | `2260f24e-e042-4585-a72f-1d5955026576` | https://d8j0ntlcm91z4.cloudfront.net/user_3CLfFwPRdxvZEiLtDM59k5jT7uE/hf_20260830_103309_2260f24e-e042-4585-a72f-1d5955026576.png |
| `models/arm_placeholder.glb` | Untextured 3D arm mesh from the isolated arm image (`image_to_3d`) | `9d4f491e-9d86-49b7-bb32-d72822039642` | https://d8j0ntlcm91z4.cloudfront.net/user_3CLfFwPRdxvZEiLtDM59k5jT7uE/hf_20260830_103411_9d4f491e-9d86-49b7-bb32-d72822039642.glb |

## Still to generate (blocked on credits)

The workspace ran out of credits (12.7 left) before the **textured + rigged**
variants could be submitted. When credits are topped up, rerun:

- `image_to_3d` on job `872128fe…` with `should_texture: true,
  enable_rigging: true` → `models/arm_textured_rigged.glb`
- `image_to_3d` on job `2260f24e…` with `should_texture: true`
  → `models/giftbox_textured.glb`

All four completed generations are also visible in the Higgsfield library
gallery of the account.
