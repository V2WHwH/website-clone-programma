# REFERENTIEMATERIAAL — OMSCHRIJVING

> Bijlage bij *HEREweHOLO BEAM — PRODUCTION BUILD*.
> Voeg dit toe aan de projectcontext zodat Claude Code weet **welke UX het referentiemateriaal
> daadwerkelijk toont** — en, minstens zo belangrijk, welke delen van de opdracht géén referentie
> hebben en dus volledig zelf ontworpen moeten worden.

---

## 0. Herkomst en juridische status

Het referentiemateriaal is een **productdemovideo van Proto Inc.** (Amerikaanse fabrikant van
holografische displays) voor hun mobiele app **Proto Beam**. Duur ca. 1:40. Het toont een
end-to-end telepresence-flow: iPhone op statief → live full-body beeld in een Proto-box.

**Gebruik dit uitsluitend als functionele en UX-referentie.** Neem geen namen, iconografie,
kleurgebruik, schermindeling, teksten of merkelementen over. De term "Beam" komt uit dit product;
overweeg voor HEREweHOLO een eigen productnaam voordat er commercieel materiaal uitgaat — dit is
een merkrisico, geen technisch risico, maar wel een reëel risico.

Wat je wél mag overnemen: de *volgorde van handelingen*, het feit dat bepaalde statusinformatie
bestaat, en het inzicht dat deze flow met vier taps werkbaar is.

---

## 1. Wat de video in één zin laat zien

Een gebruiker opent een app op zijn telefoon, kiest uit een lijst van holografische displays,
richt de camera op zichzelf, drukt op één knop, en staat binnen enkele seconden levensgroot en
live in dat display — met terugkijkbeeld van de ontvangende zijde op zijn telefoon.

---

## 2. Schermen, één voor één

Alle schermen zijn **portrait-only**, donkerblauw/marine, met een lichte camerapreview die het
grootste deel van het scherm vult.

### 2.1 App-start
App-icoon op het homescreen, tap, splash. Geen zichtbaar loginscherm in de video — de gebruiker
is al ingelogd. (Voor HEREweHOLO: auth is er wél, de video slaat het over.)

### 2.2 Select Devices
Het eerste scherm ná start. Niet een dashboard, niet een menu — meteen apparaatselectie.

- Header: hamburgermenu links, logo gecentreerd
- Titel **"Select Devices"** met rechts een prominente knop **CONNECT DEVICE** (pill, accentkleur)
- Instructieregel: *"Select the device, or devices you would like to beam to."*
- **Refresh**-actie met circulair pijl-icoon
- Grid van devicecards, 2 per rij. Elke card bevat:
  - een radio/checkbox linksboven (dus **multi-select**, meerdere bestemmingen tegelijk)
  - een productafbeelding van de holobox
  - een **statusstip** op de afbeelding: groen = online, magenta/rood = offline
  - de devicenaam eronder (in de demo: *Los Angeles*, *Van Nuys* — locatienamen, geen serienummers)
  - offline cards zijn zichtbaar gedimd en niet selecteerbaar
- Vaste onderbalk: teller **"1 Device selected"** links, knop **CONTINUE** rechts

Kernprincipe: bestemming kiezen gebeurt vóórdat de camera opent. De gebruiker weet altijd waar
hij heen gaat voordat hij zichzelf ziet.

### 2.3 Preview / pre-live
Fullscreen camerapreview, portrait, achterste camera standaard (de gebruiker staat vóór de
telefoon, niet erachter).

- Rechtsboven: **camera-flip**-knop (rond, halftransparant)
- Rechtsonder in de preview: **Snap AR**-toggle met belletje-icoon
- Een dunne **gele rechthoek** volgt het onderwerp — focus/belichtingskader, geen framing-assistent
- Direct boven de knoppenbalk een **statusstrook** in klein monospace-achtig type:
  `00:00:00 | Offline | 0×0` / `FPS: 0.00 | Zoom: 1x | 0.00 Mbps`
  met links een rond **info (i)**-icoon
- Onderbalk met geïconiseerde knoppen + labels:
  **Start Beam** (groen zenders-icoon) · **Return Feed** · **Beam Settings** (tandwiel) · **Exit** (rood kruis)

Er is géén aftelling, géén bevestigingsdialoog, géén netwerktest. Eén tap op *Start Beam* en de
verbinding wordt opgezet.

### 2.4 Beam Settings (modal, alleen vóór livegang bereikbaar)
Titel **"Beam Settings"**, sluitkruis rechtsboven. Twee secties:

**Location**
| Rij | Waarde in de demo |
|---|---|
| Location Services | On › |
| My Location | Los Angeles, CA |
| Device Location | Los Angeles, CA |
| Beam Route | N. California |

Dit is de zichtbare **edge-routing**: de app toont expliciet welke regio de mediaserver bedient,
afgeleid uit de locatie van zender én ontvanger. Precies het model uit §30 van de opdracht.

**Quality**
| Rij | Waarde |
|---|---|
| Beam Quality | Full HD › |

### 2.5 Quality (subscherm)
Simpele radiolijst met twee opties en daaronder de bijbehorende parameters:

| Optie | Bitrate | Resolutie | Framerate |
|---|---|---|---|
| Full HD | 6.000 kbps | 1080 × 1920 | 60 fps |
| 4K | 18.000 kbps | 2160 × 3840 | 30 fps |

Let op de **portrait-resolutieschrijfwijze** (hoogte × breedte omgedraaid t.o.v. landscape) en op
de wisseling van framerate: 4K kost fps. Geen "auto"-optie zichtbaar — de gebruiker kiest zelf.

### 2.6 Live
Na *Start Beam*:

- Linksboven verschijnt een **LIVE**-badge met groene stip
- Statusstrook wordt actief en telt op:
  `00:00:35 | Connected | 1080×1920` / `FPS: 59.96 | Zoom: 1x | 8.11 Mbps`
  — "Connected" in groen, waarden updaten per seconde, bitrate fluctueert (8,06 → 8,11 → 7,88 Mbps)
- Onderbalk verandert: **Start Beam** wordt **Stop Beam** (rood)
- **Beam Settings wordt gedimd/disabled** tijdens live — instellingen zijn niet meer wijzigbaar
- *Return Feed* en *Exit* blijven actief

### 2.7 Return Feed
Tap op *Return Feed* opent een **inset-venster** onderin de preview (ongeveer een derde van het
scherm, niet fullscreen), met eigen sluitkruis rechtsboven en een klein icoon linksboven. Daarin
staat het camerabeeld van de mensen bij de holobox. De hoofdpreview blijft zichtbaar erboven.

Dus: geen aparte weergave, geen schermwissel — het is een dockbare picture-in-picture die de
presentator kan openen en sluiten zonder de stream te onderbreken.

### 2.8 Snap AR
Tap op de *Snap AR*-toggle laat een **horizontale carrousel van ronde lensminiaturen** onderin de
preview verschijnen, met een lege cirkel links (= geen lens). Selectie past de lens realtime toe
op het beeld dat live naar de holobox gaat: in de demo wordt de presentator kaal, daarna krijgt hij
een cartoon-gezichtslens. Het effect is zichtbaar in de holobox, niet alleen lokaal.

Dit is een **Snapchat Camera-Kit-integratie**, geen eigen AR-engine.

### 2.9 De ontvangende zijde
De holobox toont de persoon full-body, uitgesneden tegen een lichte achtergrond, staand op de
bodem van de kast. De uitsnede komt in deze demo **niet uit software** — de presentator staat in
een studio voor een witte cyclorama. Wat je ziet is een schone camera-opname, geen AI-matting.

Bij niet-actieve verbinding toont de box een **idle-scherm**: logo, gecentreerd, met de tekst
**"Ready to play"** en daaronder een kleine subregel. Rustig, merkgedreven, geen foutmelding,
geen Windows. Precies het gedrag uit §33 van de opdracht.

---

## 3. Waargenomen technische parameters

Alles hieronder is letterlijk van het scherm afgelezen, niet afgeleid:

| Parameter | Waarde |
|---|---|
| Werkelijk gebruikte resolutie tijdens live | 1080 × 1920 (portrait) |
| Werkelijke framerate | 59,96 – 60,00 fps |
| Werkelijke bitrate | 7,88 – 9,19 Mbps |
| Verbindingsstatus | `Offline` (rood) → `Connected` (groen) |
| Sessieduur | oplopende timer `HH:MM:SS` |
| Zoom | `1x`, blijft ongewijzigd |
| Aangeboden 4K-profiel | 2160 × 3840 @ 30 fps, 18.000 kbps |
| Tijd tussen *Start Beam* en beeld in de box | enkele seconden, geen zichtbare laadstatus |

**Belangrijk:** de demo draait op **Full HD, niet op 4K**. Het 4K-profiel wordt getoond in het
instellingenscherm maar niet gebruikt. Dit is exact het scenario waarvoor §67 van de opdracht
waarschuwt. Neem hieruit mee dat een geloofwaardige 4K-claim in de HEREweHOLO-implementatie
gemeten en aantoonbaar moet zijn, niet alleen selecteerbaar.

---

## 4. De volledige flow als toestandsdiagram

```text
[app start]
    ↓
SELECT DEVICES ──── CONNECT DEVICE (pairing, niet getoond in de video)
    │  multi-select, online/offline-status per device
    ↓ CONTINUE
PREVIEW / IDLE ←──── BEAM SETTINGS (location · route · quality)
    │  camera-flip · Snap AR · statusstrook (0×0, Offline)
    ↓ START BEAM
CONNECTING  (enkele seconden, geen expliciete UI-state zichtbaar)
    ↓
LIVE
    │  LIVE-badge · actieve statusstrook · settings disabled
    │  ├── RETURN FEED  → inset-venster aan/uit, stream loopt door
    │  └── SNAP AR      → lenscarrousel, lens direct in de uitgaande stream
    ↓ STOP BEAM
PREVIEW / IDLE          holobox → "Ready to play"
    ↓ EXIT
SELECT DEVICES
```

---

## 5. Wat de referentie NIET toont

Dit is het belangrijkste deel van dit document. De opdracht vraagt aanzienlijk meer dan de
referentie laat zien. Voor onderstaande onderdelen bestaat **geen referentie-UX** — die moeten
volledig zelf ontworpen worden, en het is een fout om ze uit de video te willen afleiden:

- **Authenticatie, organisaties, rollen, multi-tenancy** — de video begint bij een ingelogde gebruiker
- **Device pairing / QR-koppeling** — de knop *CONNECT DEVICE* wordt zichtbaar maar nooit ingedrukt
- **Netwerk-pre-flight-test** — bestaat niet in de referentie; de gebruiker gaat direct live
- **Adaptive quality** — de gebruiker kiest handmatig Full HD of 4K; geen automatische afschaling zichtbaar
- **Framing-assistent** — de gele rechthoek is een focus/belichtingskader, géén full-body-detectie
  met instructies als "Move 30 cm backwards". Die functionaliteit uit §8 is nieuw.
- **Background removal / achtergrondmodi** — de nette uitsnede komt van een fysieke witte cyclorama
- **Cloud-dashboard, fleet management, analytics, health monitoring** — geen enkel beeld
- **Content library, playlists, scheduling, live override, transitions** — geen enkel beeld
- **Recording** — geen enkel beeld
- **Windows-receiver, kioskmodus, installer, updates** — geen enkel beeld
- **Uitnodigingslinks / browsergast-flow** — geen enkel beeld
- **Voice effects** — in de video zie ik **AR-gezichtslenzen (Snap Camera Kit)**, geen stemvervorming.
  Als §22 van de opdracht op de referentie gebaseerd is, berust dat op een misverstand: corrigeer
  §22 naar "AR-lenzen/gezichtseffecten", of laat het als bewuste eigen toevoeging staan.

Kortom: de referentie dekt ongeveer **de MVP-punten 4 t/m 15** uit §64, en verder niets. Alles in
Fase 2 en Fase 3 is origineel HEREweHOLO-werk.

---

## 6. UX-principes die het waard zijn over te nemen

Niet de vormgeving, wel de ontwerpbeslissingen:

1. **Bestemming vóór camera.** De gebruiker weet altijd waarheen hij streamt voordat hij zichzelf ziet.
2. **Vier taps tot live.** Open → selecteer → continue → start. Elke extra stap is een ontwerpfout.
3. **Eén statusstrook, altijd zichtbaar, altijd eerlijk.** Duur, verbindingsstatus, resolutie, fps,
   zoom, bitrate. Zes waarden, één regel, klein type, geen grafieken in de gebruikersmodus.
4. **Instellingen bevriezen tijdens live.** Wat je live niet veilig kunt wijzigen, dim je.
5. **Return feed als inset, niet als schermwissel.** De presentator verliest zijn eigen kader nooit.
6. **De ontvangende zijde toont nooit een fout.** Geen verbinding = merkscherm, niet een melding.
7. **De gebruiker kiest kwaliteit expliciet, met de consequenties erbij.** Bitrate, resolutie en
   framerate staan onder de keuze — dat is eerlijker dan een label als "Hoog / Gemiddeld / Laag".
   Voor HEREweHOLO is dit een goed startpunt om een AUTO-modus naast te zetten in plaats van
   in plaats van.

---

## 7. Aanbevolen aanpassing aan de opdracht

Op basis van wat de referentie werkelijk toont, drie punten om in de build-prompt te corrigeren
voordat Claude Code begint:

1. **§22 Voice effects** → herformuleren naar AR-gezichtseffecten, of expliciet markeren als eigen
   toevoeging zonder referentie.
2. **§7 Sender destination-blok** → de referentie toont bestemming als apart voorafgaand scherm met
   multi-select, niet als statusblok in de senderinterface. Overweeg dat model; het schaalt beter
   naar de multi-destination-eis uit §29.
3. **Voeg de portrait-resolutienotatie toe aan §52.** De referentie gebruikt consequent
   `1080 × 1920` en `2160 × 3840`. Consistente notatie voorkomt precies de verwarring waar §67
   voor waarschuwt — een verwisseling van breedte en hoogte is de makkelijkste manier om per
   ongeluk een 1080p-pipeline "4K" te noemen.
