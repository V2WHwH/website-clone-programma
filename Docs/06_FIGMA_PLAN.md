# Figma Execution Plan & Page/Component Structure

> Milestone 0 deliverables 7 & 8. The Figma output is the **UI source of
> truth** for the operator application — implementation follows it, never
> diverges from it (spec §25, Phase F5).

## 1. Execution plan (using the Figma connector)

| Phase | Output | Connector actions |
|---|---|---|
| F1 — UX information architecture | Sitemap + Basic/Advanced mode definition | FigJam/diagram page in the design file |
| F2 — Design system | Dark control-room theme: tokens, type scale, spacing, core components | Design-system page with component sheet |
| F3 — Key screens | 12 high-fidelity 16:9 desktop screens (list below) | One page per screen group, generated from the F2 system |
| F4 — Prototype flows | Flows A–D wired as interactive prototypes | Prototype connections across F3 screens |
| F5 — Handoff | Tokens, component names/states, spacing, type, icons, screen hierarchy, interaction notes | Extracted into `/FigmaHandoff` in this repo |

## 2. Figma file page structure

```text
HOLO ARMS — Operator UI
├─ 00 Cover & Status
├─ 01 IA / Sitemap                 (F1)
├─ 02 Design System / Foundations  (F2: color, type, spacing, elevation)
├─ 03 Design System / Components   (F2: component sheet, all states)
├─ 10 Dashboard
├─ 11 Scene Editor
├─ 12 Arms
├─ 13 Objects / Asset Library
├─ 14 Cameras & Calibration
├─ 15 Campaigns
├─ 16 Timeline & Triggers
├─ 17 Look & Depth
├─ 18 Displays / Topology
├─ 19 Quality & Performance
├─ 20 Analytics
├─ 21 System / Diagnostics
└─ 30 Prototype Flows A–D          (F4)
```

## 3. Information architecture (F1)

Primary navigation (left rail, persistent):

```text
Dashboard · Scene · Arms · Objects · Interactions · Cameras · Campaigns ·
Timeline · Look & Depth · Displays · Quality · Analytics · System
```

**Basic vs Advanced mode** is a global toggle in the top bar:

- Basic: human-readable presets and sliders (Depth Strength 0–100, Room
  Light: Indoor, Arm Realism: Ultra…). No shader terminology.
- Advanced: adds per-page expert sections (FOV, projection offsets, shadow
  biases, calibration matrices, network topology, clock sync, logs). Never
  mixed into the Basic layout — revealed as clearly-separated panels.

## 4. Design system foundations (F2)

- **Theme**: dark professional control-room; near-black surfaces, one
  accent for interactive elements, reserved semantic colors
  (green = healthy, amber = warning, red = error, blue = syncing/info).
- **Type scale**: Inter (or equivalent); ~12/13/14/16/20/24/32 with
  tabular numerals for telemetry.
- **Spacing**: 4-px base grid; 8/12/16/24/32 rhythm; 12-col layout at 1920×1080.
- **Core components**: buttons (primary/secondary/ghost/danger), toggles,
  sliders (with numeric readout), dropdowns, cards, **node status chips**
  (Ready/Missing Assets/Syncing/Error/Offline), tabs, timeline clips,
  canvas panels (wall preview), tooltips, warning/error banners, empty
  states, modal + non-blocking toast, data table, KPI stat tile.
- Every component sheet shows states: default/hover/active/disabled/
  error/loading.

## 5. Key screens (F3)

1. **Dashboard / system health** — plain-language status block, node chips, FPS/GPU tiles, active campaign, alerts.
2. **Scene editor** — live wall preview canvas (global metres), arm/object placement, layers.
3. **Add/Edit Arm** — side, wall anchor, appearance profile, reach preview.
4. **Objects / Asset Library** — import GLB/glTF/PNG/JPG/WEBP, grip editor, object types grid.
5. **Camera Tracking & Calibration** — device list, live view w/ privacy masks and zones, calibration wizard steps.
6. **Campaign Manager** — campaign list + editor (schedule, templates, caps, approval status).
7. **Timeline / Conditional Trigger Editor** — multi-track timeline, clip inspector, IF/THEN rule blocks.
8. **Look & Depth calibration** — Basic sliders + Auto Optimize Depth; Advanced panel.
9. **Display Topology setup** — mode selector (3 modes), node layout editor in metres, bezel compensation.
10. **Quality & Performance** — preset selector, upscaler picker (capability-detected), Auto Quality log.
11. **Analytics** — campaign KPIs, engagement funnel, exports.
12. **System / Node diagnostics** — logs, heartbeat, diagnostics bundle export, watchdog/kiosk settings.

## 6. Prototype flows (F4)

- **Flow A — new installation**: New Project → Display Topology → Physical Dimensions → Add Nodes → Quality → Depth Calibration → Save.
- **Flow B — product campaign**: Campaign → Add GLB/PNG → configure grip → assign arms → Product Relay template → preview → schedule.
- **Flow C — camera engagement**: Camera → calibrate → engagement zone → Point/Offer behaviour → test tracking.
- **Flow D — photo experience**: Campaign → Photo Moment → dwell trigger → consent step → camera prop → capture → photo card → handoff → display → TTL.

## 7. Handoff contract (F5 → implementation)

`/FigmaHandoff` will contain: `tokens.json` (colors, type, spacing,
radii), `components.md` (names + states), `screens.md` (hierarchy +
interaction descriptions), and the Figma file link. The Unity `HoloArms.UI`
implementation (UI Toolkit) maps 1:1 onto these names. Divergence from the
Figma system during coding is a defect.
