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

## 4. Openstaande taken (stand v2.3.0)

Geverifieerd tegen de code. Legenda: ✗ open · ◐ deels aanwezig.

### Verwerkt in v2.3.0
- **Blok 1 (editor, deels)**: snap-to-grid met rasteroverlay, slimme
  uitlijnhulplijnen, veilige zones, knop dupliceren, undo/redo (Ctrl+Z / Ctrl+Y,
  50 stappen).
- **Blok 2 (afspelen)**: begin/eind bijsnijden, volume per video, audio in- en
  uitfaden, herhalen, stoppen op laatste frame, playlist per knop met
  automatische opvolging.
- **Blok 3 (thema's)**: lettertypekiezer (6 families), tekstgewicht,
  klantlogo met positie en grootte, 6 complete themapresets die kleuren,
  frame, motion en typografie in één keer zetten.
- **Blok 5**: naadloze tegel-naar-videovlak-overgang (spec 212/223) — de
  gekozen tegel groeit door tot fullscreen en de echte video neemt het met een
  crossfade over, zonder zwart frame.
- **Blok 6 (analytics)**: knop-heatmap, actieve sessieduur, interacties per uur,
  voltooiingspercentage.
- **Blok 7**: transparante hotspot-knop (onzichtbaar tikvlak).
- **Blok 8**: 10 extra entrance-effecten (perspectief, flips, elastisch,
  verticale mask, center expand, radiale mask, diagonaal, focus pull,
  spotlight) — nu 26 van de 34.

### Nog open
| Blok | Wat rest |
|---|---|
| 1 · Editor | Multi-select, groeperen, uitlijnknoppen/verdelen, lagenpaneel, z-volgorde, layout-templates, Figma-componentsysteem en de IDE-layout (sidebar/topbar/inspector) |
| 2 · Afspelen | Willekeurige en geplande playlists, gelaagde video-overlay, echt gapless wisselen |
| 3 · Uiterlijk | Achtergrond-transparantie per knop, instelbare gloed-intensiteit, outline-variant |
| 4 · Meertaligheid | Taalkeuze en automatische taaldetectie (spec 84–85) |
| 6 · Device/afstand | Remote screenshot, remote volume, remote publiceren, scheduling, meerdere boxen/groepen; koppeling Studio ↔ Node-platform |
| 7 · Interactie | Breadcrumb-navigatie, swipe-navigatie, HTML5/web-content-module |
| 8 · Motion | 8 resterende entrances, 7 resterende groepssequenties, 18 resterende exit-effecten |
| 9 · Productie | Code-signing-certificaat, kiosk-vergrendeling op OS-niveau, soaktest 8–24 u op doelhardware, visuele QA tegen Figma, verborgen admin-gebaar |

## 5. Roadmap na v2.0.0

1. **Editor-IDE** (Figma-first): sidebar/topbar/canvas/inspector, lagen, multi-select, uitlijnen, grid-snap, undo/redo.
2. **Thumbnail→videovlak-transitie** (spec 212/223) en playlists (20–22).
3. **Thema's**: klantaccent, logo-upload, font-selector, themapresets (66–68).
4. **Meertaligheid** (84–85) via taalscènes.
5. **Koppeling met het Node-beheerplatform** (108–115): publish, remote beheer, meerdere boxen.
6. **Volume/trim/fade per media-item** (23–25) en HTML5-module (30).
