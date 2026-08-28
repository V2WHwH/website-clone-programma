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

## 4. Openstaande taken (stand v2.8.0)

Geverifieerd tegen de code én tegen de testsuites (14 suites, allemaal groen).

### Verwerkt in v2.4.0
Multi-select, uitlijnen/verdelen, lagen, layout-templates, transparantie en
gloed per knop, outline-frame, meertaligheid (6 talen + autodetectie),
kruimelpad, veegnavigatie, webcontent-module, motion-catalogus
(34 entrances, 14 sequenties, 20 exits), playlist-shuffle.

### Verwerkt in v2.5.0
- **Blok 1 · Editor — afgerond**: benoemde groepen (groeperen/opheffen; één
  klik selecteert de hele groep, samen verslepen als één geheel).
- **Blok 2 · Afspelen — afgerond**: geplande content (per knop een tijdvenster
  met dagen + van/tot, ook over middernacht), gelaagde video-overlay per scène
  (dekking + mengmodus), en écht gapless wisselen via een dubbele A/B-speler:
  de volgende playlistvideo buffert vooraf en neemt het beeld in hetzelfde
  frame over.
- **Blok 6 · Beheer op afstand — afgerond**: koppeling Studio ↔ Node-platform.
  De box meldt zich met een device-key (menu → Opslaan → Beheer op afstand);
  het beheerpaneel kan per box live status zien, een schermafdruk opvragen,
  het hoofdvolume zetten, herstarten, identificeren en een ontwerp publiceren
  dat de box automatisch overneemt. Zie docs/INTEGRATIE.md §4.4.
- **Blok 9 · Productie (software-kant)**: verborgen admin-gebaar (5× tikken
  linksboven), hoofdvolume-instelling, kiosk-vergrendelingsscript op OS-niveau
  (tools/windows-kiosk-setup.ps1: eigen account, autologon, shell-vervanging,
  Taakbeheer-blokkade) en een geautomatiseerde soaktest
  (scratch: soaktest.js — geheugen/DOM/animaties stabiel over lange runs).
- **Bugfixes uit de dubbelcontrole**: import accepteerde zijn eigen
  exportbestanden niet meer sinds het scènemodel (validatie keek naar het oude
  vlakke veld); een verouderde CSS-regel bedekte het Video Frame Style-kader
  volledig met het videobeeld (framedikte werkte alleen als schaduw).

### Verwerkt in v2.6.0 — Holobox Experience Manager (editor-IDE)
- **Enterprise editor-shell** conform het Figma-ontwerp (bestand
  "Holobox Experience Manager — Design System", tokens + hoofdframe):
  topbar (project/scène/device/resolutie, undo/redo, Preview, Opslaan,
  Publiceren-CTA, devicestatus), sidebar-navigatie met 9 secties,
  dock met de instellingenpanelen, **live canvas** (het echte podium,
  geschaald en geclipt in het canvasgat — Fit/zoom/100%/fullscreen,
  bewerken-schakelaar), **contextuele inspector** met accordion-secties
  (Content/Positie/Uiterlijk/Interactie/Attentie/Motion/Geavanceerd) en
  numerieke positievelden, **lagenpaneel** (selecteren, tonen/verbergen,
  vergrendelen, volgorde), **motion-presetpaneel** met 12 kaarten +
  Galaxy-informatie, statusbar met autosave-indicator en publicatiestatus.
- **Design tokens** (HEM-palet) als CSS-variabelen; Inter-typografie.
- **Publish-flow**: modal met validaties (media, scènes, motion, opslag),
  publicatietimestamp en Last-Known-Good-snapshot.
- **Galaxy Tiles v2** (spec 15–22, 30, 52–55, 61): deterministische seeded
  randomness, instelbare duur/stagger/chaos/rotatie/verticale offset/diepte/
  overshoot/easing/seed, settle-timeline 0→55→78→100%, interactie tijdens de
  entrance (Uit / Na 50% / Direct), Reduced Motion-schakelaar.
- **Druk-feedback** (spec 31): micro-press + ripple exact op het raakpunt.
- Fix uit de visuele QA: bij 100%-zoom bleef het podium buiten het canvasgat
  klikbaar; het wordt nu op het gat geclipt.
- Tests: nieuwe v26-suite (22 controles) + alle 13 bestaande suites groen;
  soaktest opnieuw stabiel.

### Verwerkt in v2.7.0
- **Screensaver v2 (eigen tab)**: geordende playlist (volgorde, omhoog/omlaag,
  verwijderen), vijf overgangseffecten tussen de video's (crossfade, via zwart,
  zoom-crossfade, schuiven, harde wissel) met instelbare overgangsduur — de
  volgende video buffert alvast in een tweede speler en neemt het beeld
  overlappend over. Nieuw: **achtergrondmodus** — dezelfde playlist draait met
  dezelfde overgangen achter de knoppen door terwijl bezoekers aanwezig zijn
  (pauzeert automatisch tijdens fullscreen afspelen en de klassieke saver).
- **Webcontent-module**: in de Windows-app laadt een beveiligde Electron-webview
  élke website volledig en bedienbaar (ook sites die iframe-embedding weigeren);
  in de browser een laadindicator, bereikbaarheidscheck met nette foutmelding en
  een discrete hulpbalk met venster-fallback. Kale adressen krijgen https://.
- **3D-objecten**: OBJ met texture (vt + mtllib/map_Kd; fallback op
  gelijknamige afbeelding), fullscreen op een witte studio-achtergrond met een
  zachte schaduw achter en onder het object, instelbaar met een slider
  (0–0,8, uit te schakelen voor de donkere look); ruimere fullscreen-camera
  zodat het object ook gedraaid en in portrait volledig in beeld blijft.
- Tests: nieuwe saver- (13) en web-suites (7), OBJ-suite herbouwd (11);
  15 suites totaal groen, soak stabiel met actieve achtergrondrotator.

### Verwerkt in v2.8.0
- **3D-formaten uitgebreid**: naast .obj nu ook **.glb/.gltf** (eigen parser:
  meshes met indices, meerdere primitives/materialen, embedded en externe
  textures, node-hiërarchie én **node-animaties** — TRS-kanalen met
  LINEAR/STEP-interpolatie en quaternion-rotaties, automatisch afgespeeld en
  herhaald) en **.fbx** (eigen parser voor het binaire formaat incl.
  zlib-gecomprimeerde arrays via DecompressionStream, plus ASCII-fallback;
  statische weergave met normalen/UV's en texture op bestandsnaam — het
  paneel adviseert .glb voor animaties).
- **Contextuele optimalisatie-instellingen per model** (alleen zichtbaar
  wanneer er werkelijk een 3D-object in de bibliotheek staat): schaal,
  verticale positie, en — uitsluitend bij modellen mét animaties — animatie
  aan/uit en animatiesnelheid; met een analyse-regel (driehoeken, onderdelen,
  texture, animaties). De viewer is omgebouwd naar meerdere primitives met
  eigen modelmatrices; normalisatie (centreren/schalen) gebeurt nu via de
  matrix zodat animaties hun eigen transforms houden.
- Tests: nieuwe modeltest-suite (10 controles, met in de test geconstrueerde
  GLB mét animatie/texture en een binaire FBX); alle 16 suites groen.

### Nog open (vergt zaken buiten de software)
| Punt | Waarom open |
|---|---|
| Code-signing-certificaat | Aanschaf bij een CA (±€200–400/jaar); pipeline is er klaar voor — secrets CSC_LINK/CSC_KEY_PASSWORD zetten en elke build wordt automatisch ondertekend |
| Soaktest 8–24 u op doelhardware | Vergt de echte holobox; de geautomatiseerde soaktest draait als generale repetitie in elke omgeving |
| Visuele QA tegen Figma / Figma-componentsysteem | Er bestaat nog geen Figma-ontwerp; het editor-IDE-herontwerp (sidebar/topbar/inspector) is bewust uitgesteld tot dat ontwerp er is |

## 5. Roadmap na v2.0.0

1. **Editor-IDE** (Figma-first): sidebar/topbar/canvas/inspector, lagen, multi-select, uitlijnen, grid-snap, undo/redo.
2. **Thumbnail→videovlak-transitie** (spec 212/223) en playlists (20–22).
3. **Thema's**: klantaccent, logo-upload, font-selector, themapresets (66–68).
4. **Meertaligheid** (84–85) via taalscènes.
5. **Koppeling met het Node-beheerplatform** (108–115): publish, remote beheer, meerdere boxen.
6. **Volume/trim/fade per media-item** (23–25) en HTML5-module (30).
