# Briefing voor Claude Design — video-tutorial van 60 seconden
### HereWeHolo Experience Manager (HEM)

Dit document is de **volledige opdracht**. Wie dit leest heeft geen andere
bronnen nodig: de layout, de tekst, de tijdlijn, de kleuren, de bewegingswetten
en het geluid staan hier allemaal in.

| | |
|---|---|
| **Product** | HereWeHolo Experience Manager — touch-software voor een holobox |
| **Doel van de video** | in 60 seconden laten zien hoe iemand zonder programmeren een holobox-presentatie bouwt |
| **Publiek** | een klant die de box net binnen heeft, of een verkoper die hem demonstreert |
| **Toon** | rustig, zeker, duur. Geen uitroeptekens, geen "wow", geen stockmuziek-energie |
| **Taal** | Nederlands (VO + ondertitels). Engelse versie staat in §7 |
| **Eindformaat** | 1920×1080, 60 fps, H.264. Varianten in §9 |

---

## 0. De kortste samenvatting

De software bestaat uit **vier begrippen**. De video legt ze in deze volgorde
uit en niets anders:

1. **Tegel** — wat de bezoeker aanraakt
2. **Scène** — één scherm vol tegels; tegels kunnen naar andere scènes wijzen
3. **Beweging** — hoe alles landt (dit is het verkoopargument)
4. **Publiceren** — en dan draait de box zelfstandig

Alles wat niet in die vier past, gaat **niet** in deze video. Er is een lange
versie (2:36) die dat wel doet: `motion/tutorial.html`.

---

## 1. Canvas, veilige zones, grid

```
Canvas         1920 × 1080 px  (16:9)
Frame rate     60 fps          — verplicht, zie §5
Kleurruimte    sRGB
Achtergrond    #080B10  (nooit puur zwart, nooit een verloop over het hele beeld)
```

```
┌──────────────────────────────────────────────────────────┐ 0,0
│  ← 96 →                                          ← 96 →  │
│   ┌────────────────────────────────────────────────┐     │  ↑ 54
│   │                                                │     │
│   │              TITLE-SAFE  1728 × 972            │     │
│   │                                                │     │
│   │   ┌────────────────────────────────────────┐   │     │
│   │   │        CONTENT  1536 × 864             │   │     │
│   │   │        (hier staat alles)              │   │     │
│   │   └────────────────────────────────────────┘   │     │
│   └────────────────────────────────────────────────┘     │
│                                                    ← 96 → │  ↓ 54
└──────────────────────────────────────────────────────────┘ 1920,1080
```

* **Kolomgrid:** 12 kolommen, 96 px marge, 32 px goot → kolom = 117,33 px
* **Baseline:** 8 px. Elke y-positie is deelbaar door 8
* **Ondertitelband:** onderkant op y = 972, gecentreerd, max. 1200 px breed
* **Logo/watermerk:** alleen in shot 1 en shot 7. Nooit permanent in beeld

---

## 2. Design tokens (identiek aan de software)

Deze waarden zitten letterlijk in `studio/index.html` (`:root`) en in de Figma
variable-collection **"HEM Tokens"**, mode **Dark**. Neem ze over, verzin niets.

### Kleur
| Token | Hex | Gebruik |
|---|---|---|
| `bg` | `#080B10` | achtergrond van het hele beeld |
| `surface-1` | `#0D1218` | panelen, topbalk |
| `surface-2` | `#111820` | kaarten, invoervelden, tegels |
| `surface-3` | `#16202A` | hover, geselecteerd |
| `border` | `rgba(255,255,255,.08)` | alle randen, 1 px |
| `border-active` | `rgba(21,242,224,.55)` | geselecteerd element |
| `text-primary` | `#F5F7FA` | koppen, VO-tekst |
| `text-secondary` | `#AAB4C0` | uitleg, labels |
| `text-muted` | `#677482` | metadata, tijdcodes |
| `accent-teal` | `#15F2E0` | **de** accentkleur, spaarzaam |
| `accent-blue` | `#29B6F6` | tweede accent |
| `accent-purple` | `#9D4BFF` | verlopen, tegel-faces |
| `accent-magenta` | `#E34EFF` | verlopen, eindpunt |

**Verloop dat overal terugkomt:**
`linear-gradient(135deg, #15F2E0 0%, #9D4BFF 100%)`
Alleen op logo-mark, actieve tegelrand en de voortgangsbalk. Nooit als
achtergrond van een heel vlak.

### Radius & ruimte
```
radius   xs 4 · sm 6 · md 10 · lg 14 · xl 18
space     1 4 · 2 8 · 3 12 · 4 16 · 5 24 · 6 32
```

### Typografie
**Inter** (UI, alles) · **Manrope** alleen voor de openings- en slottitel.

| Rol | Grootte | Gewicht | Tracking | Regelhoogte |
|---|---|---|---|---|
| Titel (shot 1/7) | 96 px | 700 | −0,02 em | 1,05 |
| Shotkop | 56 px | 650 | −0,015 em | 1,15 |
| Subkop | 30 px | 500 | 0 | 1,35 |
| Ondertitel | 34 px | 500 | 0 | 1,3 |
| Label / callout | 20 px | 600 | 0,04 em | 1,2 |
| Micro / tijdcode | 13 px | 600 | 0,18 em, UPPERCASE | 1,2 |

Ondertitels: `#F5F7FA` op een pil `rgba(8,11,16,.72)`, radius 10, padding 12/24,
`backdrop-filter: blur(8px)`. Nooit pure witte balk, nooit gele tekst.

---

## 3. Wat je in Figma bouwt

**Bestaand bestand — hierin werken, niet een nieuw bestand maken:**
`Holobox Experience Manager — Design System`
`https://www.figma.com/design/ftS2lXGEGqXDhj0n6W0cJ5`
Daarin staat al: de tokens-collectie **HEM Tokens** en de editor-shell als frame
node **`1:30`** (topbar `1:31`, sidebar `1:33`, canvas `1:35`, motion `1:36`,
inspector `1:37`, statusbar `1:38`). Hergebruik die shell voor shot 5 — teken
hem niet opnieuw.

### Nieuwe pagina: `▶ 60s Tutorial`

**A. Zeven shot-frames**, elk 1920×1080, horizontaal naast elkaar, 200 px tussen:

```
S1 Opening      S2 De tegel     S3 Scènes      S4 Beweging
S5 De editor    S6 Publiceren   S7 Slot
```

Naamgeving verplicht: `S1 · 0.00–0.06 · Opening` enzovoort — de tijdcode in de
framenaam, zodat de editor/renderer ze op volgorde kan inlezen.

**B. Per shot-frame drie lagen-groepen, in deze volgorde van onder naar boven:**

```
┌ SHOT FRAME ────────────────────────┐
│  03 · overlay   (ondertitel, voortgangsbalk, tijdcode)
│  02 · subject   (tegels, panelen, cursor, callouts)
│  01 · ground    (achtergrond, vignet, glow)
└────────────────────────────────────┘
```

**C. Componenten om aan te maken** (elk als component-set met varianten):

| Component | Varianten | Maten |
|---|---|---|
| `Tile` | `state=idle / hover / selected / placing`, `shape=rect / round / oval / hex`, `type=video / 3d / web / scene` | 320×180 (basis), auto-layout |
| `LowerThird` | `lines=1 / 2` | bar 6×H, tekst rechts |
| `Callout` | `dir=up / down / left / right` | ring 64 px + label |
| `Cursor` | `state=idle / press` | 28 px, wit met 2 px donkere rand |
| `SubtitlePill` | `lines=1 / 2` | auto-width, max 1200 |
| `ProgressBar` | — | 1920×3, verloop teal→purple, links verankerd |
| `ChapterCard` | — | 13 px micro-label + 56 px kop |
| `EditorShell` | instantie van node `1:30` | 1536×864, geschaald in frame |

**D. Één prototype-flow** S1→S7 met `Smart animate`, delay = de shotduur uit §4.
Dat is de **animatic** waarop de VO wordt getimed. Het is niet de eindrender.

**E. Eén frame `Motion Notes`** (1920×1080) waarin per shot in tekst staat welke
`HWHMotion`-aanroep hoort bij welke laag. De renderer leest dat frame.

---

## 4. De layout — shot voor shot

Totaal **60,0 s**. Tijden zijn hard: de VO is erop geschreven.

---

### S1 · 0.00 – 0.06 · Opening (6,0 s)

**Beeld**
Zwart vlak `#080B10`. In het midden, op **y = 34 %**, de titel in twee regels:

```
HereWeHolo
Experience Manager
```

96 px Manrope 700, `text-primary`. Onder de titel op y = 48 % een dunne
teal-lijn van 0 → 240 px breed. Onderin, op y = 62 %, drie tegels naast elkaar
(320×180, 32 px goot) die van onder komen aanzeilen — nog leeg, alleen
`surface-2` met een 1 px `border`.

**Beweging**
- Titel: `textOn(el, 'display')` — per woord, 60 ms stagger, 32 % stijging, met masker
- Lijn: schaal-x 0→1, `enter`, 520 ms, start op 0,9 s
- Tegels: `choreograph(tiles, { sequence:'bottomUp', stagger:'base', from:{ y:240, rotZ:-7, scale:.92, blur:6 } })`

**Geluid**
`land('medium')` per tegel → drie pentatonische tonen op 80 ms afstand = een akkoord.

**Ondertitel** — `Dit is de HereWeHolo Experience Manager.`

---

### S2 · 0.06 – 0.18 · De tegel (12,0 s)

**Beeld — drie fases in één shot, geen harde cut ertussen**

| Fase | Van | Wat |
|---|---|---|
| 2a | 6,0 s | één lege tegel groot in beeld (640×360, gecentreerd), label `TEGEL` boven |
| 2b | 9,5 s | er valt een videoframe in de tegel (`type=video`), naam verschijnt eronder |
| 2c | 13,5 s | de tegel verviervoudigt naar vier tegels met de vier types: video, 3D, web, scène — 2×2 raster |

Bij 2c krijgt elke tegel een `Callout` met het type-woord: **video · 3D-object ·
website · volgende scène**.

**Beweging**
- 2a: `land(tile, { from:{ y:240, scale:.92, blur:6 } })` — `large` overshoot (1,2 %)
- 2b: het videoframe komt binnen als morph-klasse **container** — de tegel groeit door
      naar het videovlak, inhoud kruisvervaagt in de laatste 40 %. `morphContainer()`, 520 ms
- 2c: één rechthoek wordt vier — dit is **geen** morph maar een uitgaande `leave()`
      plus `choreograph(four, { sequence:'centerOut', stagger:'tight' })`, 520 ms
- Callouts: `HWHMotion.callout(el)` — ring van scale 1,6 → 1,0 in 420 ms,
      daarna ademen ±4 % om 2600 ms

**Geluid**
`HWHAudio.land('large')` op de grote tegel · `HWHAudio.morph({ duration:520 })` bij het
doorgroeien naar video · `HWHAudio.sequence(4, { size:'small', stagger:40 })` op de
vier types → hoger akkoord dan S1.

**Ondertitel** (twee regels, wisselt op 9,5 s en 13,5 s)
1. `Alles begint bij een tegel.`
2. `Kies een video, geef hem een naam, zet hem waar je hem hebben wilt.`
3. `Elke tegel doet iets: video, 3D-object, website, of een volgende scène.`

---

### S3 · 0.18 – 0.29 · Scènes en lagen (11,0 s)

**Beeld**
Camera zoomt uit van de vier tegels naar een **volledig holobox-scherm** (3×3
raster van tegels binnen een 9:16-achtige boxvorm, gecentreerd, 486×864).
Op 22,0 s: één tegel licht op (`border-active`), en het hele scherm **schuift
naar links weg** terwijl een tweede scherm van rechts binnenkomt — de laag
dieper. Op 26,5 s: veegt terug naar rechts, terug naar niveau 1.

Links in beeld, klein, een lagen-indicator:
`● Hoofdmenu → ○ Producten` — de bol schuift mee.

**Beweging**
- Uitzoomen: scale 1 → 0,46, `move`, 820 ms
- Schermwissel: **push**-transitie, beide schermen `move`, 520 ms,
  het inkomende scherm heeft `fullscreen` overshoot (0,6 %) — bijna niets
- Tegels binnen elk scherm: `choreograph(tiles, { sequence:'wave', stagger:'tight', seed:7 })`
  — 9 tegels is meer dan 5 stagger-groepen, dus golf met vaste seed, nooit los stapelen
- Terugveeg: dezelfde transitie gespiegeld, 20 % korter (terug voelt sneller)

**Geluid**
`HWHAudio.morph({ duration:520 })` bij elke schermwissel — dat is de ruis-veeg ·
`HWHAudio.sequence(9, { size:'small', stagger:40 })` per raster, zacht, zodat het een
textuur wordt en geen melodie · bij de terugveeg `HWHAudio.back()` — dezelfde tonen,
omgekeerd. Terug is altijd de omkering van heen.

**Ondertitel**
1. `Een scène is één scherm vol tegels.`
2. `Wijst een tegel naar een andere scène, dan bouw je een menu met lagen.`
3. `Tikken, dieper gaan, terugvegen.`

---

### S4 · 0.29 – 0.41 · Beweging (12,0 s) — **het hart van de video**

**Beeld — links de tegel, rechts de grafiek**

```
┌──────────────────────┬─────────────────────────┐
│                      │  positie                │
│      [ TEGEL ]       │      ╭──╮___            │
│     landt hier       │     ╱     ‾‾‾───        │
│                      │    ╱                    │
│                      │   ╱   0  22  55  78 100 │
└──────────────────────┴─────────────────────────┘
```

Links (kolom 1–6): één tegel die keer op keer landt, op **0,25× snelheid**.
Rechts (kolom 7–12): de positie-curve wordt live meegetekend, met vier
gemarkeerde momenten op de x-as. Onder de grafiek vier kaartjes die één voor
één oplichten wanneer de tegel dat moment passeert:

| % | Kaartje |
|---|---|
| 0 | `start — buiten beeld, transparant, gekanteld` |
| 22 | `zichtbaar — je ziet hem reizen` |
| 55 | `voorbij het doel — één doorschot` |
| 78 | `25 % terug, andere kant op` |
| 100 | `op zijn plek` |

Op 37,0 s: de tegel landt nog één keer op **volle snelheid**, met de tekst
`Eén keer. Nooit twee.` groot ernaast.

**Beweging**
- De tegel: `timeline()` met `seek()` → de vertraging is een echte seek, geen
  `playbackRate`. Zo blijven de tussenposities exact
- De curve: `stroke-dashoffset` van 1 → 0, gekoppeld aan dezelfde tijdlijn
- De kaartjes: `land(card, { from:{ y:24 }, size:'small' })` op het moment zelf
- Slotzin: `textOn(el, 'display')`

**Geluid**
Bij de vertraagde landing: de transient op 55 % wordt **uitgerekt** meegespeeld
(playbackRate 0,25 op de body-ruis, toon blijft op toonhoogte). Bij de volle
landing: één schone `land('medium')`. Daarna 400 ms stilte vóór S5 — de enige
stilte in de video.

**Ondertitel**
1. `Alles heeft massa. Niets verschijnt — alles arriveert.`
2. `Een tegel schiet één keer voorbij zijn plek en komt tot rust.`
3. `Eén keer. Nooit twee. Dat maakt het duur.`

---

### S5 · 0.41 – 0.50 · De editor (9,0 s)

**Beeld**
De volledige editor-shell (Figma node `1:30`), 1536×864 gecentreerd, komt in
beeld. Drie zones lichten om beurten op met een `Callout`:

| t | Zone | Label |
|---|---|---|
| 42,0 s | sidebar `1:33` | `je onderdelen` |
| 44,0 s | canvas `1:35` | `live weergave` |
| 46,0 s | inspector `1:37` | `eigenschappen` |

Op 47,0 s: de cursor beweegt naar een kleurveld in de inspector, drukt, en de
geselecteerde tegel in het canvas **verandert direct van kleur** — de hele
demonstratie van "wat je verandert, zie je meteen".

**Beweging**
- Shell: `land(shell, { from:{ y:60, scale:.985 }, size:'fullscreen' })` — 0,6 % overshoot
- Zone-highlight: de zone gaat naar `surface-3` + `border-active`, 200 ms `precise`,
  de rest van de shell zakt naar 55 % opacity
- Cursor: `HWHMotion.cursorTo(cursor, target)` — 620 ms reis (`move`), 200 ms pauze
  vóór de druk, 120 ms indruk. Die pauze maakt leesbaar wáárop geklikt wordt
- Kleurwissel in canvas: kruisvervaging, 200 ms `precise` — geen morph, de vorm blijft

**Geluid**
`HWHAudio.land('small', { degree:6 })` bij elke zone-highlight (klein, hoog) ·
`HWHAudio.press()` bij de klik · `HWHAudio.land('small')` bij de kleurwissel.

**Ondertitel**
1. `Je werkt in één scherm.`
2. `Links je onderdelen, midden een live weergave, rechts de eigenschappen.`
3. `Wat je verandert, zie je meteen.`

---

### S6 · 0.50 – 0.57 · Publiceren (7,0 s)

**Beeld**
De editor krimpt weg naar een knop **`Publiceren`** midden in beeld. Bij de klik
verschijnen drie vinkjes onder elkaar, elk 500 ms na de vorige:

```
✓  media       12 bestanden
✓  scènes      4
✓  opslag      2,1 GB vrij
```

Daarna: de vinkjes vouwen samen tot één **holobox-silhouet** dat oplicht, met
onder in beeld `draait zelfstandig · ook zonder internet`.

**Beweging**
- Krimp: scale 1 → 0,08 naar het knop-midden, `move`, 520 ms
- Vinkjes: `choreograph(checks, { sequence:'topDown', stagger:'loose', size:'small' })`
- Samenvouwen: `morphSilhouette(box, { width:'220px', height:'392px' })` — drie rijen
  worden één silhouet, 520 ms. Een morph is een solo-gebeurtenis, dus hier geen stagger
- Oplichten van de box: glow-opacity 0 → 1 over 820 ms, blijft staan

**Geluid**
`HWHAudio.sequence(3, { size:'small', stagger:120 })` — drie stijgende tonen · bij het
samenvouwen één `HWHAudio.land('fullscreen')`: de zwaarste klank in de video.

**Ondertitel**
1. `Publiceren. De software controleert media, scènes en opslag.`
2. `Daarna draait de box zelfstandig. Ook zonder internet.`

---

### S7 · 0.57 – 1.00 · Slot (3,0 s)

**Beeld**
Vier woorden verschijnen op één regel, gecentreerd, 56 px:

```
Tegels · Scènes · Beweging · Publiceren
```

Daaronder, 30 px: `HereWeHolo Experience Manager`. Logo-mark links ervan.
Fade naar `bg` in de laatste 400 ms.

**Beweging**
`textOn(el, 'display')` op de vier woorden — 60 ms stagger. Niets anders.

**Geluid**
`HWHAudio.text('display', { count:4 })` volgt de vier woorden, dan uitsterven met
`HWHAudio.ambient(false)`. Geen slotakkoord — de video eindigt zoals hij begon: rustig.

**Ondertitel** — `Tegels, scènes, beweging, publiceren. Dat is alles.`

---

## 5. De bewegingswetten — deze mag je niet breken

Volledige spec: `docs/MOTION.md`. De motor: `motion/hwh-motion.js`.
Dezelfde waarden als CSS-variabelen: `motion/hwh-motion.css`.

### Curves — er zijn er zes, en niet meer
```
enter    cubic-bezier(0.16, 1, 0.30, 1)     arriveren — het werkpaard
settle   cubic-bezier(0.33, 1, 0.68, 1)     de laatste 22 % van een landing
exit     cubic-bezier(0.55, 0, 1, 0.45)     vertrekken
move     cubic-bezier(0.65, 0, 0.35, 1)     A → B in beeld
precise  cubic-bezier(0.40, 0, 0.20, 1)     chrome, panelen, schakelaars
lux      cubic-bezier(0.22, 0.80, 0.20, 1)  trage, dure onthulling
```
**Geen veer, geen bounce, geen `elastic`.** Overshoot maak je met keyframes,
niet met een curve — een doorschietende bezier schiet op álle eigenschappen
tegelijk door en is niet per elementgrootte te doseren.

### Duurladder — een duur die er niet op staat, bestaat niet
```
feedback 120 · micro 200 · element 320 · surface 520 · scene 820 · hero 1750  (ms)
```
**Afstandswet:** `duur = basis × (1 + reis / 1200px)`, afgetopt op 1400 px.

### De landing — 0 → 22 → 55 → 78 → 100
| % | Wat |
|---|---|
| 0 | buiten doel, transparant, licht gekanteld |
| 22 | **opacity klaar** — je moet het ding zien reizen |
| 55 | **de doorschot** — voorbij het doel. Filters (blur) hier klaar |
| 78 | 25 % van de doorschot terug, andere kant op |
| 100 | exact op doel |

**Eén doorschot, nooit twee.** Dit is het enige verschil tussen een interface
die duur voelt en een die goedkoop voelt.

### Doorschot schaalt omgekeerd met massa
| Grootte | Schaal | Verplaatsing | Rotatie |
|---|---|---|---|
| klein (< 200 px) | 3,0 % | 8 px | 2,0° |
| middel (200–600 px) | 2,0 % | 6 px | 1,5° |
| groot (> 600 px) | 1,2 % | 4 px | 1,0° |
| schermvullend | 0,6 % | 0 | 0 |

### Tekst — tekst schiet nooit door
| Rol | Eenheid | Stagger | Stijging | Duur |
|---|---|---|---|---|
| display | woord | 60 ms | 32 % | 460 ms |
| heading | regel | 45 ms | 28 % | 420 ms |
| body | regel | 40 ms | 20 % | 380 ms |
| label | blok | — | 14 % | 260 ms |
| number | teken | 28 ms | 30 % | 380 ms |

- Tekst stijgt van onder achter een masker en komt tot stilstand.
- **Geen doorschot op letters. Nooit.** Doorschietende letters zijn onleesbaar
  en ondermijnen het gezag dat een titel moet hebben.
- **Tekst arriveert ná zijn drager**, op 60 % van diens landing. Een ondertitel
  die tegelijk met zijn kaart binnenkomt, leest als één rommelig ding.
- **Tekst stijgt, valt nooit.** Vallende tekst leest als een fout.
- Het masker loopt 20 % dóór onder de regel (`inset(0 0 -20% 0)`), anders knipt
  het de staarten van de p, g en j af.

### Vorm — drie klassen, meer bestaan er niet
| Klasse | Wat | Duur | Aanroep |
|---|---|---|---|
| **container** | tegel groeit door naar videovlak; inhoud kruisvervaagt in de laatste 40 % | 520 ms | `morphContainer(fromRect, toRect, { node })` |
| **silhouet** | rond ↔ pil ↔ rechthoek; maat en straal op verschillende curves, 60 ms verschil | 520 ms | `morphSilhouette(el, to)` |
| **symbool** | SVG-pad naar SVG-pad, gelijk aantal punten | 260 ms | `morphPath(pathEl, d2)` |

Minimaal 420 ms — het oog volgt de vorm. **Een morph is een solo-gebeurtenis,
nooit onderdeel van een stagger.** De eindtoestand moet statisch bereikbaar zijn.

### Choreografie
`tight 40 · base 80 · loose 120 · dramatic 180` (ms)

- **Eén held per shot.** Die krijgt de volle landing; volgers 70 % doorschot en
  85 % duur. In S2 is dat de grote tegel, in S3 het inkomende scherm, in S5 de shell
- **Maximaal 5 stagger-groepen.** Daarboven leest volgorde als ruis — gebruik
  `sequence:'wave'` of `'random'` met een **vaste seed** (S3: 9 tegels, seed 7)
- **Richting draagt betekenis:** menu van onderen · detail uit de aangeraakte
  tegel · **terug is de omkering van heen**, en 20 % korter

### Tutoriallaag — regels die alleen voor video gelden
- **Nooit een harde cut in een UI-tutorial.** Een dip of veeg van 320 ms.
  De zeven shots hangen dus aan elkaar, ze knippen niet
- **De cursor vertraagt het doel in en pauzeert 200 ms vóór de druk.** Zonder
  die pauze zie je dát er geklikt is, niet wáárop
- **Zoom op UI: maximaal 1,4× over 1200 ms.** Sneller wordt misselijkmakend,
  omdat een schermopname geen bewegingsonscherpte heeft
- **Ondertiteling staat altijd aan**, ook met stem

### Intensiteit
`subtle ×0,78 · immersive ×1,0 · showcase ×1,28` — deze video staat op
**immersive**, behalve S4 dat op **showcase** staat.

### Frame-exact renderen
Alle animaties draaien als WAAPI met `paused`. De renderer zet
`animation.currentTime` per frame via `timeline().seek(t)` en maakt dan pas de
opname. **Nooit met wandkloktijd of `playbackRate` renderen** — dan verschuiven
de fases en klopt S4 niet meer. Bij 60 fps: `t = frame × 16,667 ms`.

---

## 6. Geluid — drie wetten

Motor: `motion/hwh-audio.js`. Alles is **gesynthetiseerd** (Web Audio), er zijn
geen samplebestanden en die moeten er ook niet komen.

1. **De klap valt op 55 %** — precies waar het beeld doorschiet. Nooit op 0 %,
   nooit op 100 %. `bind(HWHMotion)` koppelt beeld en geluid zodat ze niet
   kunnen ontsporen.
2. **Toonhoogte schaalt omgekeerd met massa** — een klein element klinkt hoog en
   kort, een schermvullend paneel laag en lang.
3. **Alles staat in één toonladder** (A-mineur pentatonisch:
   220 · 261,63 · 293,66 · 329,63 · 392 · 440 · 523,25 · 587,33 · 659,25 · 783,99 Hz).
   Daardoor wordt een stagger automatisch een akkoord in plaats van geratel.

**Muziek:** één aangehouden pad in A-mineur, −26 LUFS, geen drums, geen
opbouw naar een drop. De landingen *zijn* het ritme.
**VO-niveau:** −16 LUFS geïntegreerd, piek −3 dBTP. Effecten −24 LUFS.
**Ducking:** 3 dB onder de VO, 120 ms attack, 300 ms release.

---

## 7. De tekst — voice-over en ondertitels

Nederlands, 138 woorden, ±2,3 woorden per seconde. Rustig voorlezen, niet
opjagen. Punten zijn echte pauzes.

| Shot | In | Uit | Tekst |
|---|---|---|---|
| S1 | 0.00 | 0.06 | Dit is de HereWeHolo Experience Manager. |
| S2 | 0.06 | 0.09 | Alles begint bij een tegel. |
| S2 | 0.09 | 0.13 | Kies een video, geef hem een naam, zet hem waar je hem hebben wilt. |
| S2 | 0.13 | 0.18 | Elke tegel doet iets: video, 3D-object, website, of een volgende scène. |
| S3 | 0.18 | 0.21 | Een scène is één scherm vol tegels. |
| S3 | 0.21 | 0.26 | Wijst een tegel naar een andere scène, dan bouw je een menu met lagen. |
| S3 | 0.26 | 0.29 | Tikken, dieper gaan, terugvegen. |
| S4 | 0.29 | 0.33 | Alles heeft massa. Niets verschijnt — alles arriveert. |
| S4 | 0.33 | 0.37 | Een tegel schiet één keer voorbij zijn plek en komt tot rust. |
| S4 | 0.37 | 0.41 | Eén keer. Nooit twee. Dat maakt het duur. |
| S5 | 0.41 | 0.43 | Je werkt in één scherm. |
| S5 | 0.43 | 0.47 | Links je onderdelen, midden een live weergave, rechts de eigenschappen. |
| S5 | 0.47 | 0.50 | Wat je verandert, zie je meteen. |
| S6 | 0.50 | 0.54 | Publiceren. De software controleert media, scènes en opslag. |
| S6 | 0.54 | 0.57 | Daarna draait de box zelfstandig. Ook zonder internet. |
| S7 | 0.57 | 1.00 | Tegels, scènes, beweging, publiceren. Dat is alles. |

### Engelse versie (zelfde tijdcodes)
| Shot | Tekst |
|---|---|
| S1 | This is the HereWeHolo Experience Manager. |
| S2 | It all starts with a tile. |
| S2 | Pick a video, give it a name, put it where you want it. |
| S2 | Every tile does something: video, 3D object, website, or the next scene. |
| S3 | A scene is one screen full of tiles. |
| S3 | Point a tile at another scene and you've built a layered menu. |
| S3 | Tap, go deeper, swipe back. |
| S4 | Everything has mass. Nothing appears — everything arrives. |
| S4 | A tile passes its mark once, then settles. |
| S4 | Once. Never twice. That's what makes it feel expensive. |
| S5 | You work in a single screen. |
| S5 | Your parts on the left, a live view in the middle, properties on the right. |
| S5 | What you change, you see happen. |
| S6 | Publish. The software checks your media, scenes and storage. |
| S6 | From then on the box runs by itself. Even without internet. |
| S7 | Tiles, scenes, motion, publish. That's all there is. |

### Stem
Nederlandse mannenstem, rustig, laag, geen radiostem. In de lange tutorial is
`nPczCjzI2devNBz1zQrb` (Brian, `eleven_multilingual_v2`) gebruikt — houd
dezelfde stem aan zodat kort en lang bij elkaar horen. Zeven mp3-bestanden voor
de lange versie horen in `motion/voice/ch1.mp3` … `ch7.mp3`; voor deze video
volstaan zeven bestanden `s1.mp3` … `s7.mp3` in dezelfde map. Ontbreken ze, dan
valt de speler terug op `speechSynthesis`.

---

## 8. Wat je vooral níet doet

- **Geen** feature-opsomming. Vier begrippen, meer niet
- **Geen** muisaanwijzer die door menu's dwaalt, behalve die ene klik in S5
- **Geen** tekst die tegelijk met VO iets ánders zegt — ondertitel = VO, letterlijk
- **Geen** tweede stuiter, nergens, op niets
- **Geen** zoom-in op een schermafdruk om "detail" te tonen — bouw het na
- **Geen** stockmuziek met opbouw. Geen whoosh bij elke cut
- **Geen** kleuren buiten §2. Geen groen, geen rood, geen oranje
- **Geen** afgeronde hoeken buiten de radius-ladder
- **Geen** "AI-gegenereerd" gevoel: geen zwevende deeltjes, geen lens flares,
  geen hexagon-netwerk op de achtergrond

---

## 9. Opleveren

### Hoofdversie
```
1920×1080 · 60 fps · H.264 High · ~20 Mbit/s · AAC 320 kbit/s stereo · MP4
bestandsnaam: hwh-tutorial-60s-nl-1080p60.mp4
```

### Varianten (dezelfde tijdlijn, andere kadrering)
| Naam | Formaat | Aanpassing |
|---|---|---|
| Vertical | 1080×1920 | S3 en S5 opnieuw opmaken — editor-shell wordt gestapeld, niet geschaald |
| Square | 1080×1080 | ondertitelband naar y = 880, titel 72 px |
| Silent | 1920×1080 | ondertitels **altijd** in beeld, geen audiospoor. Voor de beursstand |
| EN | 1920×1080 | §7 Engelse tabel |

### Losse leveringen
- `hwh-tutorial-60s.srt` en `.vtt` (uit de tabel in §7, exact)
- Poster-frame: shot 4 op t = 34,0 s (de tegel op zijn doorschot) — dat frame
  verkoopt de video
- De zeven Figma shot-frames als PNG @2×, voor deck en handleiding

### Renderen vanuit de code (aanbevolen boven screen-capture)
De bewegingen zijn al code. Renderen doe je zo:
1. `motion/tutorial.html` gebruikt `HWHMotion.timeline()`; bouw een
   `tutorial-60s.html` met dezelfde structuur maar de shotlijst uit §4
2. Zet de timeline op `paused`, loop `frame = 0 … 3599`
3. Per frame: `tl.seek(frame * 16.667)` → wacht op `requestAnimationFrame` →
   `page.screenshot()` (Playwright)
4. Voeg de VO en het geluid daarna toe; het geluid is bekend per fase, dus het
   is exact te plaatsen op `shotStart + duur × 0,55`

Dit levert een perfect stabiele render zonder gedropte frames, en het is
reproduceerbaar: dezelfde seed → hetzelfde beeld.

---

## 10. Bronnen in deze repo

| Pad | Wat |
|---|---|
| `docs/MOTION.md` | de volledige bewegings- en geluidsspec |
| `motion/hwh-motion.js` | de motor — `land`, `textOn`, `morph`, `choreograph`, `timeline` |
| `motion/hwh-motion.css` | dezelfde waarden als CSS-variabelen |
| `motion/hwh-audio.js` | het geluid, gesynthetiseerd |
| `motion/motion-system.html` | levende referentie — curves, landing met scrubber, gemeten grafiek |
| `motion/tutorial.html` | de lange tutorial (2:36, 7 hoofdstukken) — de bron waaruit deze 60 s is gecondenseerd |
| `studio/index.html` | de software zelf; `:root` bevat de tokens uit §2 |
| Figma `ftS2lXGEGqXDhj0n6W0cJ5` | HEM Tokens + editor-shell node `1:30` |

Open `motion/motion-system.html` in een browser voordat je begint. Daar zie je
de landing op ware snelheid, vertraagd, en 18× uitvergroot. Als de video die
beweging niet heeft, klopt hij niet.

---

## 11. Openingsprompt voor Claude Design

Plak dit als eerste bericht. De rest staat in dit document.

> Bouw in Figma-bestand `ftS2lXGEGqXDhj0n6W0cJ5` ("Holobox Experience Manager —
> Design System") een nieuwe pagina **`▶ 60s Tutorial`** met zeven shot-frames
> van 1920×1080 volgens `docs/CLAUDE-DESIGN-BRIEF.md`, §3 en §4.
>
> Gebruik uitsluitend de variabelen uit de collectie **HEM Tokens**, mode
> **Dark** — geen losse hexwaarden. Hergebruik de bestaande editor-shell
> (node `1:30`) als instantie in shot 5; teken hem niet opnieuw.
>
> Maak eerst de componenten uit §3-C, dan de zeven frames, dan de
> prototype-flow S1→S7 met de shotduren uit §4 als delay.
>
> De bewegings- en geluidsaanwijzingen per shot zijn geen suggesties: ze
> verwijzen naar bestaande functies in `motion/hwh-motion.js` en
> `motion/hwh-audio.js`. Zet ze letterlijk in het frame **`Motion Notes`**,
> zodat de renderer ze kan uitvoeren.
>
> Lees vóór je begint §8 ("wat je vooral níet doet"). Als je twijfelt tussen
> mooi en rustig: kies rustig.

---

## 12. Aflevercontrole

Loop dit af voordat je iets doorstuurt. Eén nee is een blocker.

**Layout**
- [ ] Alle tekst binnen title-safe (96 / 54)
- [ ] Elke y-positie deelbaar door 8
- [ ] Geen kleur buiten §2; geen radius buiten de ladder
- [ ] Ondertitelpil onder aan y = 972, nooit twee regels langer dan 1200 px

**Beweging**
- [ ] Geen enkel element stuitert twee keer
- [ ] Overshoot klopt met de grootte (schermvullend = 0,6 %, niet meer)
- [ ] Geen letter schiet door
- [ ] Elke duur staat op de ladder, of volgt uit de afstandswet
- [ ] Geen harde cut tussen shots — overal een dip of veeg van 320 ms
- [ ] S4 laat de vier momenten 0 / 22 / 55 / 78 / 100 daadwerkelijk zien

**Geluid**
- [ ] Elke klap valt op 55 % van de bijbehorende beweging, niet op 0 of 100
- [ ] Geen toon buiten de A-mineur pentatonische ladder
- [ ] VO −16 LUFS, effecten −24 LUFS, muziek −26 LUFS
- [ ] De 400 ms stilte vóór S5 staat erin

**Tekst**
- [ ] Ondertitel is woordelijk gelijk aan de VO
- [ ] Alle 16 ondertitelregels uit §7 staan op de tijdcodes uit §7
- [ ] `.srt` en `.vtt` geëxporteerd en gecontroleerd
- [ ] De video duurt 60,0 s, niet 59 en niet 62

**Inhoud**
- [ ] De vier begrippen komen in deze volgorde: tegel → scène → beweging → publiceren
- [ ] Er zit geen vijfde onderwerp in
- [ ] Iemand die de software niet kent, kan na één keer kijken navertellen wat een tegel is
