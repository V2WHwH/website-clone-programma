# design/ — HoloMe & HoloSee UI/UX/VFX

Ontwerpdeliverables voor het HEREweHOLO telepresence-platform: **HoloMe** (zender) en **HoloSee**
(ontvanger), plus het cloud-dashboard (werknaam HEREweHOLO Cloud). Donker én licht thema; HoloSee
rendert altijd donker (hologram-optiek).

| Bestand | Wat |
|---|---|
| [`UI-UX-PLAN.md`](UI-UX-PLAN.md) | Het volledige plan: principes, design language, motion/VFX, schermen, Figma-werkwijze, a11y, milestone-koppeling |
| [`tokens.json`](tokens.json) | Design tokens — single source of truth voor Figma variables én Tailwind |
| [`mockups/index.html`](mockups/index.html) | 14 uitgewerkte schermen (HoloMe S1–S9, gast G1–G2, HoloSee R1–R2, cloud C1) in licht én donker — open lokaal in een browser |

**Figma:** [HoloMe & HoloSee — HEREweHOLO Design](https://www.figma.com/design/FR6BHXM6Xii5m5nGWRnD3e)
(team *Desmond Frencken's team*, Pro). Inhoud:

| Pagina | Bevat |
|---|---|
| 📋 Cover | Wordmark, versie, status M0 |
| 🎨 01 Foundations | Palet, typeramp, status-systeem, 16 paint styles + variable-collectie `color` met modes **Dark/Light** |
| 📱 02 HoloMe — Sender | S1 t/m S8 (incl. Effects met Face/Voice) |
| 👤 03 Guest flow | S9 Invite · G1 Landing · G2 Permission |
| 🖥 04 HoloSee — Receiver | R1 Idle · R2 Pairing, op ware resolutie 1080 × 1920 |
| ☁️ 05 Cloud | C1 Fleet-dashboard (1440) |

> Nog handmatig: de *bestandsnaam* toont nog "HoloCast — HEREweHOLO Design" — de Figma-API staat
> hernoemen niet toe; één klik op de titel in Figma lost dit op. Volgende Figma-iteratie: componenten
> publiceren (StatusStrip, DeviceCard, LiveBadge, …) en het klikbare acceptance-prototype (§6 van het plan).

Context: [`../beam-kickoff/`](../beam-kickoff/) bevat de projectgrondwet (CLAUDE.md), milestones,
acceptance-scenario en de analyse van het referentiemateriaal.
