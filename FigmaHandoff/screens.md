# Screen hierarchy & interaction notes — HOLO ARMS Operator UI

Figma file: https://www.figma.com/design/4F1MYTtxdladmJ8NnVNdYA
All screens are 1600×900 (16:9 desktop), dark control-room theme, built from
the components in `components.md`. Node IDs refer to the screen root frames.

| Page | Screen root | Content |
|---|---|---|
| 00 Cover | 6:2 | Title card |
| 01 IA / Sitemap | 6:7 | 13-section sitemap + Basic/Advanced mode definition |
| 02 Foundations | 5:2 | Color swatches (26 semantic tokens), type ramp, spacing bars |
| 03 Components | — | Component sheet (all sets + singles) |
| 10 Dashboard | 8:2 | Warning banner · 6 KPI tiles · plain-language system status with node chips · active campaign card |
| 11 Scene Editor | 9:2 | Global-wall canvas in metres (6 dashed node viewports, arm anchors, object marker) · arm inspector |
| 12 Arms | 10:2 | Arm table (ID/side/node/anchor/appearance/emotion/status) · Add-arm panel with reach preview |
| 13 Objects | 11:2 | Type filter tabs · asset grid (GLB/PNG cards with status) · grip editor with GripPoints |
| 14 Cameras | 12:2 | Camera list · live view with privacy mask, engagement zone, tracked person bbox · 5-step calibration wizard |
| 15 Campaigns | 13:2 | Campaign list (Active/Scheduled/Draft) · editor: template+schedule dropdowns, caps sliders, commercial toggles, approval chip, Preview/Save |
| 16 Timeline | 14:2 | 6-track sequencer with clips + time ruler · conditional IF/THEN rule list with per-rule toggles |
| 17 Look & Depth | 15:2 | Basic sliders + presets + Auto Optimize Depth · live preview (contact/projected shadow) · Advanced slider panel (visible because Advanced toggle = On) |
| 18 Displays | 16:2 | 3 topology-mode cards (Independent active) · physical layout editor in metres · node table + Add node |
| 19 Quality | 17:2 | Preset pills (Auto active) · upscaler/FPS/dynamic-res dropdowns + render-scale sliders · detected-capabilities list · Auto Quality Controller with change log |
| 20 Analytics | 18:2 | 6 KPI tiles · engagements-per-hour bars · engagement funnel · CSV/JSON export + webhook status · privacy note |
| 21 System | 19:2 | Health heartbeat (plain language) · structured logs · operations toggles (watchdog/kiosk/safe mode) + diagnostics export · Privacy Mode retention list |
| 30 Prototype Flows | 19:701 | Flow strips A–D (step chips) |

## Interaction notes

- **Advanced toggle (TopBar)** reveals the per-page Advanced panel
  (demonstrated ON in Look & Depth and System; OFF elsewhere). Advanced
  content is always a separate panel, never mixed into Basic controls.
- **Flow wiring (F4)**: connect the flow strips on page 30 to the numbered
  screens: A = Displays → Quality → Look & Depth; B = Campaigns → Objects →
  Campaigns; C = Cameras; D = Campaigns (Photo Moment). Interactive
  prototype reactions still need to be wired in the Figma UI (or a follow-up
  scripting pass) — the strips document the exact step order.
- **Status colors** always mean the same thing: green = healthy/ready,
  amber = warning/syncing-behind, red = error, blue = info/syncing,
  gray = offline/disabled.
- **Numbers** in telemetry/positions always use Mono/Telemetry.
- **Empty/error states**: use `Banner` (Info/Warning/Error) at the top of
  the content column; blocking failures use the Error banner plus a red
  StatusChip on the affected entity.
