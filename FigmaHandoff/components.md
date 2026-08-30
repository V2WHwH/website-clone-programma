# Component inventory — HOLO ARMS Operator UI

Figma file: https://www.figma.com/design/4F1MYTtxdladmJ8NnVNdYA
(page `03 Components`). All visual properties are bound to the variables in
`tokens.json`. The Unity `HoloArms.UI` implementation (UI Toolkit) maps 1:1
onto these names and states — do not invent divergent components during
implementation.

| Component | Variants / states | Notes |
|---|---|---|
| `Button` | Style = Primary · Secondary · Ghost · Danger × State = Default · Disabled | Disabled = 45% opacity. Primary = accent bg + on-accent text; Secondary = card bg + border; Ghost = transparent + accent text; Danger = status/error bg |
| `Toggle` | State = On · Off | 40×22 track, radius/full; On = accent track + white knob |
| `StatusChip` | Status = Ready · Syncing · Missing Assets · Error · Offline | Dot + Caption label in status color on status-bg pill; also reused with node/camera names as label |
| `Tab` | State = Active · Inactive | 2px accent underline when active |
| `NavItem` | State = Active · Inactive | 208 wide rail item; Active = accent-subtle bg + accent text; icon slot 16×16 |
| `Slider` | single | Label (Body/Small, secondary) + value (Mono, primary) + 4px track with accent fill and white knob |
| `Dropdown` | single | 240 wide; value + chevron; card bg + border/default |
| `Input` | single | Placeholder in text/muted; filled value uses text/primary |
| `Card` | single | bg/card, border/subtle, radius/lg, Elevation/Card |
| `KPITile` | single | Caption label / H2 value / Body-Small status line (status line color = semantic status token) |
| `Banner` | Type = Info · Warning · Error | Dot + message on status-bg, stroked in status color |

## Composition patterns (not components, rebuilt per screen)

- **AppShell**: 1600×900 · left `NavRail` 240 (bg/surface, logo + 13 NavItems)
  · `Content` column (padding 32/24, gap 20) · `TopBar` (H1 title + "Advanced"
  caption + Toggle).
- **Table rows**: 20px H padding, Caption header row in text/muted,
  first column Body/Strong.
- **Preset pills**: radius/full chips, active = accent-subtle bg + accent
  stroke + accent text (see Quality screen).
- **Wizard steps**: 22px circle (healthy = done, accent = active,
  raised = todo) + label.
- **Timeline clips**: 28px rounded rects on 32px raised lanes, 120px label
  gutter, clip label in Caption on dark text.
