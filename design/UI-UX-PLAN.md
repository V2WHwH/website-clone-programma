# UI/UX/VFX-plan — HoloMe & HoloSee (HEREweHOLO)

> **Naamgeving (besloten door Desmond, 2026-08-27):** **HoloMe** = de zendende kant (sender-app),
> **HoloSee** = de ontvangende kant (receiver op de Holobox). Het cloudplatform heet werktitel
> **HEREweHOLO Cloud**. "Beam"/"HoloCast" vervallen.
> **Status:** v0.2 · 2026-08-27 · naamgeving, dual theme en voice-effects verwerkt.
> **Bronnen:** `beam-kickoff/` (CLAUDE.md, MILESTONES.md, ACCEPTANCE.md, docs/00-REFERENCE.md) en de
> Proto Beam-referentievideo (1:41, frame-voor-frame geanalyseerd).
> **Visueel:** `design/mockups/index.html` (11 uitgewerkte schermen) · `design/tokens.json` (design tokens).

---

## 1. Wat we ontwerpen

Drie productoppervlakken, één ontwerptaal:

| Oppervlak | Naam | Vorm | Kern |
|---|---|---|---|
| **Sender** | **HoloMe** | Browser (MVP), later native mobiel | Presentator gaat in vier taps live in een Holobox |
| **Receiver** | **HoloSee** | Windows-kiosk op de Holobox-PC | Toont stream, merk-idle of pairing — nooit iets anders |
| **Cloud** | HEREweHOLO Cloud *(werknaam)* | Next.js webplatform | Fleet, sessies, gebruikers, analytics voor operators |

De referentievideo dekt alleen de sender-happy-flow. Auth, pairing, netwerkcheck, adaptieve kwaliteit,
framing-assistent, dashboard en receiver-UX hebben **geen referentie** en zijn hieronder volledig zelf
ontworpen (zie `docs/00-REFERENCE.md` §5).

## 2. Ontwerpprincipes

De zeven principes die we uit de referentie overnemen (functioneel, niet visueel), plus twee eigen:

1. **Bestemming vóór camera.** De gebruiker weet altijd waarheen hij streamt voordat hij zichzelf ziet.
2. **Vier taps tot live.** Open → selecteer → continue → GO LIVE. Elke extra stap moet zijn plek verdienen.
   De netwerkcheck is de enige toevoeging — hij verdient die plek met een eerlijk kwaliteitsoordeel vooraf.
3. **Eén statusstrook, altijd zichtbaar, altijd eerlijk.** Duur · status · resolutie · fps · bitrate.
   Monospace. Wat in mono staat, is gemeten — nooit verzonnen. `0 × 0` en `STANDBY` zijn legitieme waarden.
4. **Instellingen bevriezen tijdens live.** Wat live niet veilig kan wijzigen, wordt gedimd met slot-icoon
   en één verklarende zin.
5. **Return feed als inset, niet als schermwissel.** De presentator verliest zijn eigen kader nooit.
6. **De ontvangende zijde toont nooit een fout.** Geen verbinding = merkscherm. Nooit Windows, nooit een dialoog.
7. **Kwaliteit kiezen mét consequenties.** Bitrate, resolutie en framerate staan onder elke keuze.
   Wij zetten er een **Auto-modus naast** (niet in plaats van) als aanbevolen default.
8. **Eerlijkheid is een UI-feature** *(eigen)*. "4K" verschijnt pas als de hele keten
   (capture → encode → transport → decode → render) het bevestigt — regel 2 uit CLAUDE.md, zichtbaar gemaakt.
   Portrait-resolutie altijd voluit: `2160 × 3840`.
9. **Kalm, enterprise, geen gaming** *(eigen)*. Eén gereserveerd accent-gradient voor de primaire actie;
   verder gedempt. Geen decoratieve animatie.

## 3. Design language

Vastgelegd als tokens in `design/tokens.json` (bron voor Figma-variables én Tailwind-config).

- **Twee thema's, één taal (besloten):** **donker** is de default (`#0A0E13` grond, `#10161E` surface,
  `#18202B` elevated — AV-software in gedimde ruimtes), **licht** is een volwaardige modus voor HoloMe en
  Cloud (`#F2F4F7` grond, `#FFFFFF` surface, `#E9EDF2` elevated). Accent- en statuskleuren verdiepen in het
  lichte thema voor contrast (cyan `#0797C2`, ok `#0B915F`, warn `#B45309`, error `#D6246E`); het
  beam-gradient en de donkere glass-overlays op de camera zijn thema-onafhankelijk.
  **HoloSee heeft bewust géén licht thema** — het hologram vraagt een zwarte achtergrond, dus de receiver
  rendert altijd donker. Thema-wissel is instant, zonder crossfade (geen decoratieve animatie).
- **Accenten:** cyan `#35E0FF` · teal `#2DD4BF` · violet `#8F7BFF`. Het **beam-gradient**
  (cyan→teal→violet, 135°) is gereserveerd voor de primaire actie (GO LIVE, Continue) en merkmomenten.
- **Status:** groen `#3EE58F` = online/verified · amber `#FFB454` = degraded/stepping down ·
  magenta `#FF4D8D` = offline/error/stop. Status krijgt altijd kleur **én** vorm **én** tekstlabel
  (kleurenblind-veilig).
- **Typografie:** **Archivo** (600–800) voor wordmark, titels en GO LIVE · **IBM Plex Sans** voor lopende
  UI · **IBM Plex Mono** voor alle telemetrie, resoluties en codes (tabular numerals).
- **Spacing/radius:** 4-punts spacing-schaal (4→64), radius 8/12/16/pill.
- **Cameragebied:** licht (`#E8E6E1`, witte-cyclorama-referentie) — het enige lichte vlak in het product,
  waardoor de preview vanzelf het podium is.

## 4. Motion & VFX

Regel uit CLAUDE.md: *geen decoratieve animatie; transities verklaren statuswissels*. VFX is hier dus
functioneel merkgevoel, geen spektakel:

| Effect | Waar | Spec | Waarom |
|---|---|---|---|
| **Connecting-ringen** | Sender, tussen GO LIVE en CONNECTED | 3 concentrische beam-ringen, 1200 ms loop, stopt hard op CONNECTED | Maakt de onzichtbare verbindingsopbouw zichtbaar |
| **Live-pulse** | LIVE-badge | 1 stip, 2 s cyclus; enige permanente animatie tijdens sessie | "Je bent zichtbaar" — nooit te missen |
| **Kwaliteitsstap** | Statusstrook | Waarde wisselt met 180 ms crossfade + 2 s amber accent bij step-down | Verklaart de wissel i.p.v. stil te muteren |
| **Receiver ambient** | Idle/fallback-scherm | Traag driftende holo-gloed (6 s alternate), GPU-composited | Merkbeeld dat maandenlang kan draaien zonder inbranden/CPU-last |
| **Sheet/modal** | Settings, netwerkcheck | 260 ms omhoog, standaard-easing `cubic-bezier(.2,0,0,1)` | Ruimtelijke logica: instellingen "liggen onder" de preview |
| **Return-feed dock** | PiP inset | 180 ms schaal vanaf de knop | Laat zien wáár het venster vandaan komt |

**Reduced motion:** alle loops bevriezen op hun sterkste statische frame. **Performancebudget:** alleen
`transform`/`opacity`-animaties, geen layout-thrash; op de receiver max. één composited layer voor ambient.

## 5. Schermen (uitgewerkt in `design/mockups/index.html`)

**HoloMe (sender)** — S1 Select destination (multi-select devicegrid, status per device incl. nieuw "IN SESSION",
pair-actie) · S2 Preview & pre-flight (framing-assistent met één concrete instructie, netwerkverdict-kaart,
eerlijke nul-strip) · S3 Network check (vier gemeten waarden + verdict in klare taal) · S4 Live (groene
strip, bevroren settings, STOP) · S5 Return feed (dockbare PiP met audio-indicator) · S6 Session-settings
(destination, edge-route, media, verplichte echo-cancellation) · S7 Quality (Auto aanbevolen naast
Full HD/4K met consequenties en honesty-voetnoot) · S8 Effects — segmented control **FACE** (AR-lenzen,
Snap Camera Kit) en **VOICE** (voice changer met presets None · Deep · Robot · High · Anon; besloten eigen
toevoeging). Face- én voice-effecten renderen in de uitgaande stream: de ontvangende kant hoort het effect,
nooit de rauwe stem. Het voice-effect zit in het audiopad vóór encode, ná echo-cancellation; beide
effecttypes zijn fase 2, geen MVP. · S9 Invite a guest (tijdslimiet, single-use/herbruikbaar,
wachtwoord, kopieerbare link, intrekbaar).

**Gastflow (browser)** — G1 Landing (bestemming + uitnodiger zichtbaar vóór elke permissie, geldigheid
expliciet, geen installatie) · G2 Camera/mic-toestemming (één keer, met context en stepper; daarna de
normale preview-flow van S2).

**HoloSee (receiver)** — R1 Idle/fallback ("Ready when you are" + ambient gloed; identiek bij
verbindingsverlies) · R2 Pairing (QR + leesbare code, drie stappen, verloopteller, device-ID).
Altijd donker thema.

**Cloud** — C1 Fleet-dashboard (KPI-rij vóór detail, statuspills, live-sessie met echte telemetrie en
bitrate-sparkline, alerts met auto-ticket).

Nog te ontwerpen in een volgende iteratie: auth/org-switch, sessie-detail + analytics, remote-actions op
device-detail, diagnostic view (resolutieketen — M6), installer/update-flow (M8).

## 6. Figma-plan

**Bestand:** [*HoloMe & HoloSee — HEREweHOLO Design*](https://www.figma.com/design/FR6BHXM6Xii5m5nGWRnD3e)
*(draagt in Figma nog de oude werktitel "HoloCast"; hernoemen bij de eerstvolgende sessie)*
(team "Desmond Frencken's team"), gegenereerd via de Figma MCP. Status en resterende stappen: zie
`design/README.md`. Let op: het Starter-plan beperkt Figma tot 3 pagina's per bestand en 20 MCP-calls
per maand — de paginastructuur hieronder is daarom samengevoegd tot 3 pagina's; het ideaalbeeld blijft
gedocumenteerd voor een eventueel Pro-plan.

**Paginastructuur**

```
📋 Cover            — status, versie, beslislog
🎨 01 Foundations   — kleurstijlen + variables (uit tokens.json), typeramp, spacing, status-chips
🧩 02 Components    — StatusStrip, DeviceCard, LiveBadge, Toolbar, PillButton, RadioTier,
                      SheetRow, StatusPill, KPI-tile (auto-layout, met varianten per status)
📱 03 Sender        — S1–S8 als frames van 390 × 844, geprototyped tot klikbare flow
🖥 04 Receiver      — R1–R2 op 1080 × 1920-frames (portrait!)
☁️ 05 Cloud         — C1 op 1440-frame
🔬 99 Playground    — experimenten, nooit bron van waarheid
```

**Werkwijze**

1. **Tokens eerst.** `tokens.json` → Figma variables (collecties: `color`, `space`, `radius`, `type`).
   Elke component bindt aan variables, nooit aan losse hexwaarden. Kleur-variables krijgen twee modes
   (dark/light); het Starter-plan staat maar één mode per collectie toe, dus tot een Pro-upgrade worden
   het twee collecties (`color-dark`, `color-light`).
2. **Componenten met status-varianten.** Elke component die status toont krijgt varianten
   `online / degraded / offline / live` — één bron voor kleur+vorm+label.
3. **Schermen uit componenten.** Frames gebruiken uitsluitend instances; afwijkingen gaan terug de
   component in.
4. **Prototype = acceptance-flow.** De klikbare flow volgt letterlijk `ACCEPTANCE.md`: pairing → invite →
   preview → check → live → stress → stop. Wat niet te prototypen valt (fallback bij kabel eruit) staat
   als annotatie op het frame.
5. **Handoff.** Dev Mode + Code Connect zodra de React-componenten bestaan (M4); tokens synchroniseren
   via `tokens.json` als single source of truth — wijzigingen eerst daar, dan Figma, dan code.
6. **Versiebeheer.** Elke milestone-gate krijgt een named version in Figma ("M4 gate — approved").

## 7. Toegankelijkheid

- Contrast: alle tekst ≥ 4.5:1 in beide thema's — donker: cyan `#35E0FF` op `#0A0E13` ≈ 10:1; licht: de
  verdiepte accenten (`#0797C2`, `#0B915F`, …) zijn juist hiervoor gekozen. `text-low` alleen voor
  niet-essentiële metadata.
- Status nooit alleen kleur: altijd vorm (stip/pill) + label (ONLINE/OFFLINE/…).
- Tapdoelen ≥ 44 px op de sender; GO LIVE/STOP zijn de grootste doelen op het scherm.
- Focus zichtbaar (cyan ring) voor de browser-sender; volledige toetsenbordbediening in Cloud.
- `prefers-reduced-motion` gerespecteerd in alle loops (zie §4).
- UI-copy in het Engels (productconventie), kort en letterlijk: knoppen zeggen wat er gebeurt.

## 8. Koppeling met de milestones

| Milestone | Design-deliverable |
|---|---|
| **M0** (nu) | Dit plan + tokens + mockups + Figma-file — ter goedkeuring. Technische M0-stukken staan in [`docs/`](../docs/): ARCHITECTURE, STREAMING, SECURITY, DATA-MODEL + 5 [ADR-voorstellen](../docs/adr/) |
| M1–M2 | Alleen diagnostische UI (resolutieketen-printout); geen polish |
| M3 | Pairing-flow (R2) + minimale device-lijst in Cloud |
| **M4** | S1–S8 volledig — dit is de UI-milestone; guest-invite-flow erbij |
| M5 | R1 fallback/idle definitief + kiosk-gedrag |
| M6 | Diagnostic view (resolutieketen in product) + honesty-regels in kwaliteits-UI |
| M7 | C1 dashboard volledig: health, alerts, remote actions, analytics |
| M8 | Installer/updater-UI |

**Besloten (Desmond, 2026-08-27):**
1. **Naamgeving:** HoloMe (zender) · HoloSee (ontvanger).
2. **Thema's:** donker én licht, beide volwaardig — behalve HoloSee, die altijd donker rendert
   (hologram-optiek).
3. **Voice changer:** toegevoegd als volwaardig onderdeel van Effects (naast AR-lenzen), als bewuste
   eigen toevoeging — de referentievideo labelt zijn carrousel "Voice Changer" maar toont visueel
   AR-lenzen; wij bieden beide, elk expliciet.

**Nog open:** definitieve naam van het cloudplatform (nu werknaam "HEREweHOLO Cloud").
