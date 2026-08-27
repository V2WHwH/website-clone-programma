# design/ — HoloMe & HoloSee UI/UX/VFX

Ontwerpdeliverables voor het HEREweHOLO telepresence-platform: **HoloMe** (zender) en **HoloSee**
(ontvanger), plus het cloud-dashboard (werknaam HEREweHOLO Cloud). Donker én licht thema; HoloSee
rendert altijd donker (hologram-optiek).

| Bestand | Wat |
|---|---|
| [`UI-UX-PLAN.md`](UI-UX-PLAN.md) | Het volledige plan: principes, design language, motion/VFX, schermen, Figma-werkwijze, a11y, milestone-koppeling |
| [`tokens.json`](tokens.json) | Design tokens — single source of truth voor Figma variables én Tailwind |
| [`mockups/index.html`](mockups/index.html) | 21 uitgewerkte schermen (HoloMe S0–S9, gast G1–G2, HoloSee R1–R2, cloud C1–C3, features F1–F3) in licht én donker — open lokaal in een browser |

**Figma:** [HoloMe & HoloSee — HEREweHOLO Design](https://www.figma.com/design/FR6BHXM6Xii5m5nGWRnD3e)
(team *Desmond Frencken's team*, Pro). Inhoud:

| Pagina | Bevat |
|---|---|
| 📋 Cover | Wordmark, versie, status M0 |
| 🎨 01 Foundations | Palet, typeramp, status-systeem, 16 paint styles + variable-collectie `color` met modes **Dark/Light** |
| 📱 02 HoloMe — Sender | S0 Sign in · S1 t/m S8 (incl. Effects met Face/Voice) |
| 👤 03 Guest flow | S9 Invite · G1 Landing · G2 Permission · G3 Preview |
| 🖥 04 HoloSee — Receiver | R1 Idle · R2 Pairing, op ware resolutie 1080 × 1920 |
| ☁️ 05 Cloud | C1 Fleet-dashboard · C2 Device-detail (remote acties) · C3 Sessie-detail (resolutieketen) |
| 🧩 06 Components | StatusPill (4 varianten) · DeviceCard (4) · ToolButton (3) · StatusStrip (2) · LiveBadge · PillButton (2) · KpiTile · InfoDot — met beschrijvingen |
| 🔮 07 Concepts | Fase 2+-features: F1 Studio Matte · F2 Voice Bridge · F3a/F3b Walk-up — specs in [`../docs/features/`](../docs/features/) |

**Klikbaar prototype** (presentatie-modus in Figma):
- flow **"HoloMe — presenter flow"**: S0 sign in → S1 → S2 → (netwerkcheck S3) → S4 live ⇄ S5 return feed
  ⇄ S8 effects, settings S6 → S7, STOP → terug naar preview;
- flow **"Guest — invite & join"**: S9 → G1 → G2 → G3 (preview als gast).

> Nog handmatig: (1) de *bestandsnaam* toont nog "HoloCast — HEREweHOLO Design" — de Figma-API staat
> hernoemen niet toe; één klik op de titel in Figma lost dit op. (2) De componentenbibliotheek
> *publiceren* naar het team (Assets → Publish library) is ook een handmatige klik.

Context: [`../beam-kickoff/`](../beam-kickoff/) bevat de projectgrondwet (CLAUDE.md), milestones,
acceptance-scenario en de analyse van het referentiemateriaal.
