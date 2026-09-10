# HWH Motion — het bewegings- en geluidssysteem

> **Alles heeft massa.** Niets verschijnt — alles arriveert.
> Niets verdwijnt — alles vertrekt.

Eén systeem voor de touch-app én de tutorialvideo, zodat product en uitleg
dezelfde hand hebben. Drie bestanden:

| Bestand | Wat het is |
|---|---|
| `motion/hwh-motion.js` | de motor: landen, tekst, vorm, choreografie, tijdlijn |
| `motion/hwh-motion.css` | dezelfde waarden als CSS-variabelen |
| `motion/hwh-audio.js` | geluid, gesynthetiseerd, gekoppeld aan de beweging |

Bekijk het systeem in werking: **`motion/motion-system.html`**
De tutorialvideo: **`motion/tutorial.html`**

---

## 1. Curves

| Naam | Waarde | Waarvoor |
|---|---|---|
| `enter` | `cubic-bezier(0.16, 1, 0.30, 1)` | arriveren — het werkpaard |
| `settle` | `cubic-bezier(0.33, 1, 0.68, 1)` | de laatste 22% van een landing |
| `exit` | `cubic-bezier(0.55, 0, 1, 0.45)` | vertrekken, versnelt weg |
| `move` | `cubic-bezier(0.65, 0, 0.35, 1)` | A → B in beeld |
| `precise` | `cubic-bezier(0.40, 0, 0.20, 1)` | chrome, panelen, schakelaars |
| `lux` | `cubic-bezier(0.22, 0.80, 0.20, 1)` | trage, dure onthulling |

**Geen veer- of bounce-curve in de set.** Overshoot maken we met keyframes.
*Waarom:* een doorschietende bezier schiet op álle eigenschappen tegelijk door
— schaal, positie én rotatie — en is niet per elementgrootte te doseren.

## 2. Duurladder

`feedback 120` · `micro 200` · `element 320` · `surface 520` · `scene 820` · `hero 1750` ms

Een duur die niet op de ladder staat, bestaat niet.

**Afstandswet:** `duur = basis × (1 + reis / 1200px)`.
*Waarom:* zonder deze wet voelen lange slides gehaast en korte slides sloom.

## 3. De kernbeweging — landen, doorschieten, tot rust komen

| Moment | Wat er gebeurt |
|---|---|
| **0%** | startpose: buiten doel, transparant, licht gekanteld |
| **55%** | voorbij het doel — de doorschot. Filters zijn hier klaar |
| **78%** | terug tot 25% van de doorschot, andere kant op |
| **100%** | exact op doel |

**Eén doorschot, nooit twee.** Eén keer voorbij het doel leest als massa;
een tweede stuiter leest als speelgoed. Dit is het enige verschil tussen een
interface die duur voelt en een die goedkoop voelt.

**De doorschot schaalt omgekeerd met de grootte:**

| Grootte | Schaal | Verplaatsing | Rotatie |
|---|---|---|---|
| klein (< 200px) | 3,0% | 8px | 2,0° |
| middel (200–600px) | 2,0% | 6px | 1,5° |
| groot (> 600px) | 1,2% | 4px | 1,0° |
| schermvullend | 0,6% | 0 | 0 |

*Waarom:* zware dingen schieten nauwelijks door. Een schermvullend paneel dat
evenveel doorschiet als een knopje ziet er gewichtloos uit.

**Zichtbaarheid klaar op 22% · filters op 55% · geometrie op 100%.**
*Waarom:* je wilt het ding zíen reizen. Opacity die pas op het eind klaar is,
gooit de hele landing weg.

```js
HWHMotion.land(el, { from: { y: 240, rotZ: -7, scale: .92, blur: 6 } });
```

## 4. Tekst

| Rol | Eenheid | Stagger | Stijging |
|---|---|---|---|
| display | woord | 60 ms | 0,32 em |
| heading | regel | 45 ms | 0,28 em |
| body | regel | 40 ms | 0,20 em |
| label | blok | — | 0,14 em |
| number | teken | 28 ms | 0,30 em |

- **Tekst arriveert ná zijn drager**, op 60% van diens landing.
- **Tekst stijgt in beeld, valt nooit.** Vallende tekst leest als een fout.
- **Tekst heeft geen overshoot. Nooit.** Doorschietende letters zijn onleesbaar
  en ondermijnen het gezag dat een titel moet hebben.
- Het masker loopt 20% dóór onder de regel (`inset(0 0 -20% 0)`), anders knipt
  het de staarten van de p, g en j af.

```js
HWHMotion.textOn(el, { role: 'display' });
```

## 5. Vorm

| Klasse | Wat | Duur |
|---|---|---|
| **container** | tegel groeit door naar videovlak; inhoud kruisvervaagt in de laatste 40% | 520 ms |
| **silhouet** | rond ↔ pil ↔ rechthoek; maat en straal op verschillende curves, 60 ms verschil | 520 ms |
| **symbool** | SVG-pad naar SVG-pad, gelijk aantal punten | 260 ms |

Minimaal 420 ms — het oog volgt de vorm. Een morph is een solo-gebeurtenis,
nooit onderdeel van een stagger. De eindtoestand moet statisch bereikbaar zijn:
op een touchscreen onderbreekt iemand altijd.

## 6. Choreografie

- **Eén held.** Die krijgt de volle landing; volgers 70% doorschot en 85% duur.
- **Maximaal 5 stagger-groepen.** Daarboven leest volgorde als ruis — gebruik
  golf of ruis-met-vaste-seed.
- **Richting draagt betekenis:** menu van onderen · detail uit de aangeraakte
  tegel · terug is de omkering van heen.

```js
HWHMotion.choreograph(tiles, { sequence: 'bottomUp', stagger: 'base', hero: tiles[0] });
```

## 7. Geluid

Geluid is niet toegevoegd aan beweging — het is de hoorbare kant ervan.

1. **De klap valt op 55%**, precies op de visuele doorschot. Dáár raakt het ding
   aan. Dit maakt beeld en geluid één gebeurtenis in plaats van twee.
2. **Toonhoogte schaalt omgekeerd met massa**, net als de doorschot. Je hóórt
   hoe zwaar iets is voordat je het ziet landen.
3. **Alles in één toonladder** (A-mineur pentatonisch). Daardoor klinkt elke
   combinatie samen goed en wordt een stagger van vier tegels vanzelf een
   akkoord in plaats van vier losse tikken.

Alles wordt gesynthetiseerd met Web Audio — geen geluidsbestanden, dus de app
blijft één bestand en blijft offline werken.

```js
HWHAudio.init();        // pas na een gebruikersgebaar
HWHAudio.bind(HWHMotion); // beeld en geluid onlosmakelijk koppelen
```

Na `bind()` geven `land()`, `choreograph()` en `textOn()` automatisch hun
geluid. Zo kan het nooit uit sync raken.

## 8. Tutoriallaag (video)

- **Nooit een harde cut in een UI-tutorial** — een dip of veeg van 320 ms.
- **De cursor vertraagt het doel in en pauzeert 200 ms vóór de druk.** Die pauze
  maakt de handeling leesbaar; zonder pauze zie je dát er geklikt is, niet wáárop.
- **Zoom op UI: maximaal 1,4× over 1200 ms.** Sneller wordt misselijkmakend,
  omdat een schermopname geen bewegingsonscherpte heeft.

## 9. Video renderen

De tijdlijn is frame-exact seekbaar, zodat elke opname identiek is:

```js
const tl = HWHMotion.timeline();
tl.add(0, () => HWHMotion.land(el, { from: { y: 240 } }));
tl.seek(550);   // exact frame op 550 ms — altijd hetzelfde beeld
```

Alle willekeur loopt via een seed (`HWHMotion.rng(seed)`), dus dezelfde scène
ziet er bij elke opname hetzelfde uit. Zonder dat is monteren onmogelijk.

## 10. Toegankelijkheid

`prefers-reduced-motion` en de eigen schakelaar zetten de doorschot op nul en
korten de duren in. **Niet géén beweging** — onverklaarde sprongen zijn erger
dan zachte beweging. De tutorial heeft altijd ondertiteling, ook met stem aan.
