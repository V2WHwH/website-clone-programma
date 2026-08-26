# Holobox Experience Manager — Audit & Feature-matrix

Fase 1–2 van het masterspec: audit van de bestaande codebase en de status
van de aanbevolen initiële scope. Peildatum: v1.5.0 → basis voor v2.0.0.

## 1. Technische audit (20 punten)

| # | Onderwerp | Bevinding |
|---|---|---|
| 1 | Taal | JavaScript (ES2022), HTML, CSS — geen build-stap |
| 2 | Framework | Geen framework; vanilla single-file app (`studio/index.html`) — bewuste keuze voor offline/USB-portabiliteit |
| 3 | Rendering | DOM + CSS-composited transforms; eigen WebGL-viewer voor OBJ |
| 4 | Videoplayer | `<video>`-elementen; dubbele laag (preview-rendities 1280×800/800×1280 + fullscreen origineel); geen herinitialisatie per video |
| 5 | GPU | Chromium hardware-decode (D3D11/NVDEC/QSV/VCN); animaties uitsluitend transform/opacity; Electron-flags: ignore-gpu-blocklist, gpu-rasterization, zero-copy, HEVC |
| 6 | State management | Verspreide booleans (`editing`, `saverActive`, overlay-klassen) → **REQUIRES REFACTOR** naar centrale state machine |
| 7 | Project/settings-model | Eén JSON-config in localStorage (versie 2) — vlak, geen scènes → REFACTOR naar Project→Scenes→Elements |
| 8 | Media-opslag | IndexedDB-blobs incl. preview-rendities; object-URL's runtime |
| 9 | Touch-input | Pointer events; capture-listeners voor wake/hand-verbergen; alpha-hittest op PNG-knoppen |
| 10 | Layout/positionering | Percentage-anchors (x/y), grootte in vmin → schaalbaar over resoluties (spec-conform) |
| 11 | Animatie | CSS-keyframes (aandacht), WAAPI additief (selectie), rAF-engine (zweven/drift) → gecentraliseerd in Motion Engine (v2) |
| 12 | Kioskmodus | Electron fullscreen-kiosk (F11), cleanMode voor bedieningsknoppen; PIN ontbrak → toegevoegd in v2 |
| 13 | Build/packaging | electron-builder op GitHub Actions (windows-latest): NSIS + portable zip + checksums + release |
| 14 | Crash-herstel | Electron: render-process-gone → reload; web: geen → deels ondervangen door persistentie |
| 15 | Logging | Electron: JSONL met rotatie; web: console + toast |
| 16 | Offline | Volledig offline na eerste load (IndexedDB + localStorage); file:// ondersteund |
| 17 | Netwerkafhankelijkheden | Geen (Google Fonts niet gebruikt; hls.js alleen in het aparte platform) |
| 18 | Persistentie | localStorage (config) + IndexedDB (media); atomic export/import via JSON |
| 19 | Deviceconfiguratie | Electron settings.json (kiosk, HW-versnelling, zoom) + diagnosticsvenster |
| 20 | Settings-architectuur | 8 tabbladen, schakelaars, per-knop kaarten (v1.5-herontwerp) |

## 2. Feature-matrix — aanbevolen scope

Legenda: ✅ EXISTING · ◐ PARTIAL · ✗ MISSING · ⟳ REQUIRES REFACTOR

| Bereik | Status | Toelichting |
|---|---|---|
| 1–6 knoptypes | ✅/◐ | Video-, thumbnail- (preview), PNG-, tekstknop ✅; icon-knop ◐ (via PNG); transparante hotspot ✗ (action-engine v2 maakt dit triviaal) |
| 7–12 navigatie | ⟳→✅ | **v2: scènemodel + OpenScene/Back/Home**; breadcrumb/swipe ✗ |
| 13–20 video | ◐ | Preload ✅ (bij selectie), gapless ◐, loop ✅, return ✅, playlist ✗ |
| 23–28 | ◐ | Volume/trim/fade per item ✗; achtergrondvideo ✅; overlay ✗ |
| 31–48 editor | ◐ | Vrij positioneren/percentages/lock ✅; grootte ✅; grid-snap, multi-select, uitlijnen, lagen, groeperen ✗ (fase editor-IDE) |
| 49–68 uiterlijk | ◐ | Vormen, kleuren, rand, gloed, PNG-thema ✅; font-selector, logo-upload, themapresets ✗ |
| 69–80 attract | ✅ | Puls/gloed/lichtrand/flits ✅, handje+pad+snelheid(grootte) ✅, taptik ✅, idle-video (screensaver) ✅, wake-on-touch ✅ + aanwezigheidscamera (99) ✅ |
| 84 meertaligheid | ✗ | Gepland (scènes per taal via action-engine mogelijk) |
| 102–107 analytics | ✗→◐ | **v2: lokale interactie-analytics** (knopkliks, starts, completions, sessies) |
| 108–114 device | ◐ | Uptime/diagnostiek in desktop-app; remote beheer zit in het aparte Node-platform (server.js) — koppeling is een latere fase |
| 120 PIN | ✗→✅ | **v2: admin-PIN op het menu (SHA-256-hash)** |
| 127–160 enter-effecten | ✗→◐ | **v2: Motion Engine met 12 entrance-effecten** (fade, fade+scale, blur, slide×4, depth×2, scale-pop, mask, glow-materialize, light-sweep, holo-scan) |
| 161–174 groepssequenties | ✗→◐ | **v2: stagger, center-out, top-down, bottom-up, left-right, wave, random** |
| 175–188 press | ✅ | Micro-press, ripple-op-raakpunt, selected hold (spec-default 175+179+181) |
| 189–210 exit | ◐ | 4 gechoreografeerde exits (fade/depth/aside/burst) via selectie-effect |
| 211–223 selected-transities | ◐ | Groei-naar-kijker + vervaag-overdracht; thumbnail→videovlak (212/223) is de volgende stap |
| 224–232 return | ✗→✅ | **v2: contextual return — gekozen knop eerst, rest met stagger, attract tijdelijk uit** |
| 233–242 presets | ✗→✅ | **v2: 10 motionpresets + 3 intensiteiten (Subtle/Immersive/Showcase)** |

## 3. Architectuurbesluiten v2

- **Feature-flags**: `ACTIVE_FEATURES` (Set) + `hasFeature(n)`; uitbreidbaar per optie-nummer.
- **State machine**: centrale `AppState` (BOOT→ATTRACT→IDLE→USER_INTERACTION→CONTENT_TRANSITION→CONTENT_PLAYBACK→RETURN_TRANSITION) — gelogd en afvraagbaar; bestaande guards stapsgewijs gemigreerd.
- **Action engine**: knoppen zijn niet langer hard aan een video gekoppeld: `action = {type, ...}` met PlayMedia, OpenScene, Back, Home (OpenURL e.a. voorbereid).
- **Scènemodel**: Project → `scenes[]` (id, naam, titel, achtergrond, knoppen) met `homeSceneId`, navigatiestack en scène-overgangen via de Motion Engine. Bestaande configs migreren automatisch naar één "Home"-scène.
- **Motion Engine**: één `runEntrance(elementen, cfg)`/presetlaag (WAAPI, alleen transform/opacity/filter), gebruikt bij laden, scènewissel, terugkeer na content en na de screensaver.
- **Figma-workflow**: gereserveerd voor de volgende fase — het editor-IDE-herontwerp (sidebar 240 px, topbar 56 px, canvas, inspector 320 px) wordt eerst als Figma-componentsysteem ontworpen en daarna geïmplementeerd, conform spec-fasen C–H.

## 4. Openstaande taken (stand v2.2.1)

Geverifieerd tegen de code op 26-08. Legenda: ✗ open · ◐ deels aanwezig.

### Blok 1 — Editor-IDE (spec 33–44, 48 + fasen C–H)
✗ Snap-to-grid · ✗ slimme uitlijnhulplijnen · ✗ uitlijnen links/rechts/boven/onder ·
✗ gelijk verdelen · ✗ multi-select · ✗ groeperen · ✗ dupliceren · ✗ lagenpaneel ·
✗ naar voren/achteren · ✗ veilige zones · ✗ layout-templates · ✗ undo/redo.
Hieronder valt ook het Figma-componentsysteem en de editor-layout
(sidebar 240 px, topbar 56 px, canvas, inspector 320 px) uit spec §3–5.

### Blok 2 — Afspelen & playlists (spec 15–20, 23–25, 28)
✗ Playlist per knop · ✗ willekeurige/geplande playlist · ✗ automatisch volgende
video · ✗ stoppen op laatste frame · ✗ begin/eind bijsnijden per video ·
✗ volume per video · ✗ audio in-/uitfaden · ✗ gelaagde video-overlay ·
◐ gapless wisselen (preload aanwezig, geen naadloze switch).

### Blok 3 — Thema's & typografie (spec 60, 62–64, 66–68)
✗ Lettertypekiezer · ✗ tekstgewicht · ✗ achtergrond-transparantie per knop ·
✗ instelbare gloed-intensiteit · ✗ klantlogo uploaden · ✗ complete
klant-themapresets · ◐ globale accentkleur (nu via Video Frame Style).

### Blok 4 — Meertaligheid (spec 84–85)
✗ Taalkeuze · ✗ automatische taalselectie.

### Blok 5 — Selected-transities (spec 211–223)
✗ Thumbnail wordt naadloos het videovlak (212/223) — de "geen zwart frame"-
overgang uit het spec. Nu: groeien + vervagen, video start daarna.

### Blok 6 — Device- en afstandsbeheer (spec 103, 106–115)
✗ Knop-heatmap · ✗ sessieduur · ✗ analyse per tijdvak · ✗ remote screenshot ·
✗ remote volume · ✗ remote publiceren · ✗ scheduling · ✗ meerdere boxen/groepen ·
◐ uptime en diagnostiek (desktop-app) · ◐ remote herstart/commando's (los
Node-platform, nog niet gekoppeld aan Studio).

### Blok 7 — Overige interactie (spec 6, 10, 11, 30)
✗ Transparante hotspot · ✗ breadcrumb-navigatie · ✗ swipe-navigatie ·
✗ HTML5/web-content-module.

### Blok 8 — Extra motion-effecten
◐ 16 van 34 entrance-effecten (127–160) · ◐ 7 van 14 groepssequenties (161–174) ·
◐ 4 van 22 exit-effecten (189–210). De architectuur staat; uitbreiden is per
effect een kleine toevoeging aan de Motion Engine.

### Blok 9 — Productie-afronding (spec §25, 31–32, 119–120)
✗ Code-signing-certificaat (Defender/SmartScreen) · ✗ kiosk-vergrendeling op
OS-niveau (Windows-shell, taakbalk, sneltoetsen) · ✗ langdurige soaktest 8–24 u
op doelhardware · ✗ visuele QA tegen Figma · ◐ PIN aanwezig, verborgen
admin-gebaar ontbreekt.

### Afgerond t/m v2.2.1
Scènemodel + action engine · Motion Engine met 10 presets, 3 intensiteiten,
Galaxy Tiles en Extreme Galaxy · contextual return · Video Frame Style
(globaal + per-knop override) · attract-modus compleet (69–80) ·
aanwezigheidscamera (99) · lokale analytics (102, 104, 105) · admin-PIN (120) ·
press-feedback (175/179/181) · exe-loze offline distributie.

## 5. Roadmap na v2.0.0

1. **Editor-IDE** (Figma-first): sidebar/topbar/canvas/inspector, lagen, multi-select, uitlijnen, grid-snap, undo/redo.
2. **Thumbnail→videovlak-transitie** (spec 212/223) en playlists (20–22).
3. **Thema's**: klantaccent, logo-upload, font-selector, themapresets (66–68).
4. **Meertaligheid** (84–85) via taalscènes.
5. **Koppeling met het Node-beheerplatform** (108–115): publish, remote beheer, meerdere boxen.
6. **Volume/trim/fade per media-item** (23–25) en HTML5-module (30).
