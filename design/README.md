# design/ — HoloMe & HoloSee UI/UX/VFX

Ontwerpdeliverables voor het HEREweHOLO telepresence-platform: **HoloMe** (zender) en **HoloSee**
(ontvanger), plus het cloud-dashboard (werknaam HEREweHOLO Cloud). Donker én licht thema; HoloSee
rendert altijd donker (hologram-optiek).

| Bestand | Wat |
|---|---|
| [`UI-UX-PLAN.md`](UI-UX-PLAN.md) | Het volledige plan: principes, design language, motion/VFX, schermen, Figma-werkwijze, a11y, milestone-koppeling |
| [`tokens.json`](tokens.json) | Design tokens — single source of truth voor Figma variables én Tailwind |
| [`mockups/index.html`](mockups/index.html) | 11 uitgewerkte schermen (sender S1–S8, receiver R1–R2, cloud C1) — open lokaal in een browser |

**Figma:** [HoloMe & HoloSee — HEREweHOLO Design](https://www.figma.com/design/FR6BHXM6Xii5m5nGWRnD3e)
*(het bestand draagt in Figma nog de oude werktitel "HoloCast" — hernoemen bij de eerstvolgende
Figma-sessie, samen met de wordmarks in S1/S2)*
(team *Desmond Frencken's team*). Bevat nu: 🎨 Foundations (palet, typeramp, status + 16 paint styles),
📱 Sender met **S1 Select destination** en **S2 Preview & pre-flight**.

> ⚠️ Het Figma Starter-plan staat 20 MCP-tool-calls per maand toe; die limiet is tijdens het genereren
> bereikt. Nog te doen in Figma (specificatie staat volledig in de mockups):
> 1. S2: vijf kleine containers hebben nog een standaard witte fill (toolbar-labels "Effects/Session/Exit",
>    tekstkolom in de netwerkkaart, GO LIVE-kolom) — selecteer ze en verwijder de fill;
> 2. S3–S8, R1–R2 en C1 overzetten van `mockups/index.html`;
> 3. componenten publiceren (StatusStrip, DeviceCard, LiveBadge, …) volgens §6 van het plan.
> Een Pro-seat (of de volgende maand) heft de limiet op; de mockup-pagina is tot die tijd de bron van waarheid.

Context: [`../beam-kickoff/`](../beam-kickoff/) bevat de projectgrondwet (CLAUDE.md), milestones,
acceptance-scenario en de analyse van het referentiemateriaal.
