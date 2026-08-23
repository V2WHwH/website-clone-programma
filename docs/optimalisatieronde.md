# Laatste optimalisatieronde — Vision2Watch

Bewerkte versie van de HEREweHOLO-opdracht, aangepast op wat voor dit project
werkelijk geldt. Wat niet klopte voor Vision2Watch is niet overgenomen maar
vervangen; die punten staan onderaan bij **Wat is er veranderd en waarom**.

---

## 0. Uitgangspunten die boven alles gaan

Deze vier regels gelden voor elke stap hieronder en wegen zwaarder dan elk
optimalisatiedoel.

1. **Niets wordt gepubliceerd zonder uitdrukkelijke toestemming.** De live
   vision2watch.nl wordt niet aangeraakt. Werk uitsluitend op de tak
   `claude/vision2watch-rebuild-uf0biw`. Niet naar `main`, niet naar het
   productiedomein.
2. **Geen feiten verzinnen.** Geen klantnamen, projectresultaten, aantallen,
   percentages, specificaties of citaten die niet uit bestaand, bevestigd
   materiaal komen. Ontbreekt een feit, dan blijft het weg en wordt het
   gemeld — het wordt niet ingevuld met iets plausibels.
3. **Ontbreekt de onderbouwing, dan gaat de wijziging niet door.** "Dit is
   gebruikelijk" of "een checklist adviseert dit" is geen onderbouwing.
4. **Andere repositories en projecten blijven onaangeraakt.**

---

## 1. Baseline — al vastgelegd

Gemeten op de huidige productiebuild van deze tak. Dit is het vergelijkings-
punt; elke claim over verbetering wordt hiertegen afgezet.

| | Waarde |
|---|---|
| Geprerenderde routes | 65 |
| Adressen in sitemap.xml | 63 |
| QA-rapport | 65 pagina's, geen bevindingen |
| Linkcontrole | 64 pagina's, alle links en sitemapdekking in orde |
| Redirectcontrole | 146 oude adressen opgevangen, 0 ketens, 0 dode doelen |
| JavaScript (hoofdbundle) | 451 kB onverpakt |
| CSS | 42 kB |
| Media in `dist/` | 70 MB — 251 webp, 40 mp4 |
| Zwaarste video | 3,7 MB (`panorama-onderwaterzaal.mp4`) |
| Taal | uitsluitend Nederlands (`lang="nl"`, content in `src/content/nl/`) |
| Productgroepen | 18 |

**De site staat nog niet live.** `scripts/preview-klaarzetten.mjs` zet een
noindex-kop op elke pagina zolang de build niet op het echte domein draait.
Dat betekent: dit is een ronde vóór lancering, niet een polish achteraf. Er
is dus geen productieversie om prestaties tegen af te zetten — meten gebeurt
lokaal op de build, met dezelfde methode voor en na.

Het gereedschap staat er al. Gebruik het in plaats van iets nieuws te
bouwen:

```
npm run build          bouwen + prerenderen + sitemap
npm run qa             qa-rapport, linkcontrole, redirectcontrole
npm run typecheck      TypeScript
npm run audit:statisch audit-uitgebreid.mjs
npm run audit:runtime  runtime-audit.mjs
npm run audit:a11y     a11y-audit.mjs
node scripts/routes-audit.mjs
node scripts/mediacheck.mjs
node scripts/beeldmaten.mjs
node scripts/schermafdrukken.mjs
```

---

## 2. Werkwijze: eerst rapporteren, dan pas wijzigen

De oorspronkelijke opdracht liet audit en uitvoering door elkaar lopen. Dat
werkt hier niet, omdat er niets live mag zonder toestemming en omdat een
deel van de bevindingen inhoudelijke keuzes zijn die niet van mij zijn.

Daarom in twee gangen:

**Gang 1 — auditeren en rapporteren.** Alle controles hieronder draaien,
bevindingen vastleggen met bewijs (bestand, regel, meting). Nog niets
wijzigen behalve aantoonbare technische fouten uit categorie A.

**Gang 2 — uitvoeren na akkoord.** Pas na goedkeuring per categorie. Elke
wijziging apart commit, met in de boodschap: wat, waarom, welke meting het
onderbouwt.

### Wanneer is een wijziging gerechtvaardigd?

| Categorie | Drempel | Toestemming vooraf? |
|---|---|---|
| **A. Kapot** | Werkt aantoonbaar niet: dode link, 404, ontbrekend bestand, verkeerde canonical, foute structured data | Nee — direct repareren |
| **B. Meetbaar** | Verbetering is te meten: bytes, LCP, CLS, bundelgrootte. Minimaal 10 % op de gemeten waarde, of ≥ 50 kB | Nee, mits gemeten en gerapporteerd |
| **C. Beoordeling** | Metadata, teksten, interne links, anchors | Ja — voorleggen met voor/na |
| **D. Inhoudelijk** | Nieuwe pagina's, samenvoegen, feiten toevoegen | Ja — altijd, met bron |

Haalt een bevinding geen enkele drempel, dan komt hij in het rapport onder
"niet gewijzigd" en verder niets.

---

## 3. Wat er gecontroleerd wordt

### 3.1 Techniek en crawlbaarheid
- Elke route uit `ROUTES` levert een echt HTML-bestand op (geen SPA-catch-all).
- Canonical per pagina: zelfverwijzend, https, geen redirect, geen 404.
- `robots.txt`: sitemapverwijzing klopt, geen onbedoelde blokkade van
  zoekmachine- of AI-crawlers.
- `llms.txt`: bestaat en klopt met de werkelijke structuur. Niet cosmetisch
  herschrijven.
- `_headers` en `_redirects` komen mee in `dist/`.
- **Lanceerpunt:** de noindex-kop uit `preview-klaarzetten.mjs` moet eraf op
  het moment dat de site op het echte domein gaat. Dit is de belangrijkste
  eenmalige handeling van de hele lancering; zet hem apart in het rapport.

### 3.2 Redirects — het grootste lanceerrisico
146 oude adressen worden nu opgevangen. Dat is het waardevolste bezit van
deze verhuizing: die adressen hebben jaren aan geschiedenis.

- Geen ketens, geen loops, geen doel dat zelf een redirect is.
- Geen doel dat 404 geeft.
- Oud adres wijst naar de pagina die inhoudelijk het dichtst bij het
  origineel zit, niet naar een overzichtspagina "omdat dat ongeveer past".
- Historische redirects worden niet verwijderd zonder reden.
- `redirects.md` en `public/_redirects` blijven gelijk aan elkaar.

### 3.3 Beelden en CLS
251 webp-bestanden. Controleer per beeld:
- `width` en `height` of een gereserveerde beeldverhouding, zodat er geen
  layout shift optreedt;
- responsieve maten, `srcset` en `sizes` waar een beeld op meerdere breedtes
  wordt getoond;
- `loading="lazy"` overal behalve waar het beeld in de eerste viewport staat;
- `fetchpriority="high"` uitsluitend op het LCP-element van een template, en
  op niet meer dan één element per pagina.

**Niet doen:** bestaande uitsnedes, composities of beeldverhoudingen
veranderen. `scripts/beeldmaten.mjs` bestaat hiervoor al — gebruik die.

### 3.4 Video
Vision2Watch verkoopt bewegend beeld. Video's worden niet weggehaald of
afgezwakt voor een auditscore.

- 40 video's, zwaarste 3,7 MB — dat is op zichzelf redelijk.
- Een video onder de vouw mag niets downloaden voordat hij in beeld komt:
  `preload="none"` plus laden bij zichtbaarheid.
- Een hero-video laadt juist meteen, met poster, zodat er geen zwart vlak
  of wachttijd is.
- `muted`, `playsinline` en `loop` staan waar automatisch afspelen bedoeld is
  — zonder `muted` blokkeert elke browser dat toch.
- Een video met geluid en een lange looptijd hoort geen autoplay-loop te
  zijn; die krijgt een poster en start op handeling van de bezoeker.
- Controleer de totale mediabelasting per template, niet per bestand: 70 MB
  in `dist/` is niet het probleem, één pagina die er 20 MB van ophaalt wel.

### 3.5 JavaScript
451 kB hoofdbundle voor een grotendeels statische site is de eerste plek om
te kijken, maar alleen als er echt iets te halen valt.

- Welke afhankelijkheden zitten erin en worden ze gebruikt?
- Dubbele bibliotheken?
- Zware componenten die op elke route meeliften terwijl ze op één pagina
  nodig zijn → dynamische import.
- Third-party scripts: wat laadt er vóór de eerste render dat niet hoeft?

**Breek niet:** navigatie, menu, animaties, formulieren, video, de
prerender-hydratie, structured data.

### 3.6 Structured data
Controleer op correctheid en overeenkomst met de zichtbare pagina, niet op
hoeveelheid. Voeg niets toe om meer schema te hebben.

- Organization en LocalBusiness: één eenduidige definitie van Vision2Watch,
  overal dezelfde naam, URL en gegevens.
- Product: naam, merk en beeld kloppen met de productpagina.
- Article, BreadcrumbList, FAQPage: alleen waar de pagina dat werkelijk is.
- VideoObject: alleen met een echte thumbnail en een echte uploaddatum. Geen
  verzonnen datum.
- Geen tegenstrijdige entiteiten tussen pagina's.

### 3.7 Interne links
- Kennisbank → product; project → product; sector → product; product →
  sector/project.
- De commercieel belangrijke pagina's krijgen genoeg contextuele links:
  de 18 productgroepen, prijslijst, contact.
- Ankerteksten beschrijven de bestemming ("interactieve vloer voor beurzen")
  in plaats van "lees meer" — maar zonder exacte-match-herhaling.
- Elke pagina in de sitemap heeft minstens twee inkomende interne links.

### 3.8 Titles en meta descriptions
Alleen wijzigen bij een aanwijsbaar probleem:
- het onderwerp is niet direct duidelijk;
- twee pagina's hebben vrijwel dezelfde title;
- de title dekt de zoekintentie niet;
- de omschrijving zegt niet wat de pagina biedt.

**Geen harde tekenlimiet.** Een duidelijke title van 68 tekens wordt niet
ingekort omdat een richtlijn 60 noemt. Volgorde: intentie → duidelijkheid →
relevantie → CTR → lengte.

Productnamen blijven exact zoals ze in `src/content/nl/producten.ts` staan.

### 3.9 Vindbaarheid voor AI (GEO/AEO)
Controleer of de kernfeiten in gewone, semantische HTML staan en niet
uitsluitend in video, animatie, canvas of afbeelding. Een taalmodel leest
alleen de tekst.

Moet uit de HTML te halen zijn: wat Vision2Watch is en doet, wat elke
productgroep is en waarvoor hij dient, huur versus koop waar dat speelt, in
welke sectoren het wordt ingezet, waar het bedrijf zit, en hoe je contact
legt.

**Let op — hier wijkt deze opdracht af van het origineel.** Er is voor
Vision2Watch géén Promptwatch-project; dat bestaat alleen voor HEREweHOLO.
Er zijn dus geen tracked prompts, citations, content gaps of
concurrentiecijfers voor dit domein. Gebruik daarom:

- `seo-strategy.md` en de `discovery/`-map als bron voor zoekintentie;
- `content-inventory.md` voor de dekking van de oude site.

En claim geen gat dat je niet kunt aantonen. Wie AI-zichtbaarheid voor dit
domein werkelijk wil sturen, moet eerst een Promptwatch-project met tracked
prompts inrichten — dat is een aparte beslissing, geen onderdeel van deze
ronde.

### 3.10 Toegankelijkheid
`npm run audit:a11y` draait al. Dit is een regressiecontrole: alt-teksten,
formulierlabels, toetsenbordnavigatie, zichtbare focus, koppenhiërarchie,
landmarks, contrast, mobiele navigatie. Zorg dat performance- of
animatiewijzigingen hier niets slopen.

### 3.11 Mobiel
`scripts/schermafdrukken.mjs` maakt de opnamen. Let op horizontale overflow,
tekst buiten containers, te kleine tikdoelen, onverwachte layout shift en te
zware mobiele assets — op hero, navigatie, video, formulieren, productkaarten
en de footer.

### 3.12 Conversie
Op elke commerciële pagina moet binnen één scherm duidelijk zijn wat het
product is, waarvoor het dient en wat de volgende stap is (offerte, demo,
contact). CTA's duidelijk, niet opdringerig, niet herhaald tot ze ruis
worden. **De visuele identiteit blijft ongewijzigd.**

### 3.13 Meertaligheid — nu niet, straks wel
De site is eentalig Nederlands. Er is geen hreflang-matrix om te auditeren
en er worden er geen aangemaakt.

Wat wél wordt gecontroleerd: dat de architectuur een tweede taal later niet
blokkeert. Staan teksten gescheiden van componenten (`src/content/nl/`)?
Zitten er geen hardgecodeerde Nederlandse strings in de componenten? Kan de
routelijst een taalprefix aan? Bevindingen hierover zijn een rapportpunt,
geen wijziging in deze ronde.

---

## 4. Wat níét gedaan wordt

- Geen redesign, geen nieuwe architectuur, niets herbouwen omdat een andere
  aanpak mooier zou zijn.
- Geen verzonnen FAQ's, geen gegenereerde long-tailpagina's.
- Geen teksten volstoppen met zoekwoorden.
- Geen titles inkorten om het tekenaantal.
- Geen descriptions herschrijven die al goed zijn.
- Geen pagina's samenvoegen op woordoverlap alleen.
- Geen schema toevoegen om meer schema te hebben.
- Geen canonical als noodgreep tegen vermeende kannibalisatie.
- Geen nieuwe pagina's zonder aantoonbaar gat. Een kennisartikel
  ("Wat is een interactieve vloer?") naast een commerciële pagina
  ("Interactieve vloer huren") is geen kannibalisatie — dat zijn twee
  intenties.

---

## 5. Regressietest voor afronding

```
npm run typecheck
npm run build
npm run qa
npm run audit:statisch
npm run audit:runtime
npm run audit:a11y
node scripts/routes-audit.mjs
node scripts/mediacheck.mjs
```

Alles moet schoon zijn. Daarnaast handmatig: navigatie, formulieren,
videoweergave, en de opnamen uit `schermafdrukken.mjs` op mobiel en desktop.

---

## 6. Rapportage

**Gewijzigd** — per wijziging: wat, waarom, welke meting het onderbouwt,
welke pagina's of templates.

**Niet gewijzigd** — de auditpunten die bewust zijn blijven staan, met de
reden: al correct, verwaarloosbare impact, geen onderbouwing, of meer risico
dan winst.

**Prestaties** — voor en na, met dezelfde meetmethode, op minimaal:
homepage, productoverzicht, productdetail, sectorpagina, projectdetail,
kennisartikel, prijslijst, contact. Rapporteer LCP, CLS, bundelgrootte,
overgedragen bytes, beeld- en videobelasting. Een wijziging die de prestaties
aantoonbaar verslechtert zonder functionele reden gaat terug.

**Techniek** — canonicals, sitemap, interne links, structured data, dode
links, redirects, indexeerbaarheid.

**Openstaand** — wat niet kon worden opgelost en waarom, inclusief wat er van
de opdrachtgever nodig is.

### Eindoordeel
Geef per onderdeel een cijfer met daarbij het bewijs waarop het rust — een
cijfer zonder meting eronder is niets waard:

techniek · vindbaarheid · AI-vindbaarheid · prestaties · toegankelijkheid ·
gereedheid voor lancering.

Bij "gereedheid voor lancering" hoort expliciet de lijst met handelingen die
op het moment van livegang moeten gebeuren, te beginnen met het weghalen van
de noindex-kop.

---

## Wat is er veranderd en waarom

De oorspronkelijke opdracht is voor HEREweHOLO geschreven. Deze punten zijn
niet overgenomen maar vervangen:

| Origineel | Hier | Reden |
|---|---|---|
| Controleer zes talen; volledige hreflang-audit | Eentalig NL; in plaats daarvan een controle of de architectuur een tweede taal later toelaat | Deze site heeft één taal en geen hreflang-matrix |
| Promptwatch als primaire bron voor AI Search | `seo-strategy.md`, `discovery/`, `content-inventory.md`; en de expliciete regel dat een gat dat je niet kunt aantonen niet bestaat | Er is geen Promptwatch-project voor dit domein — alleen voor HEREweHOLO |
| Holobox, HoloWall, HoloMini | De 18 productgroepen uit `producten.ts` | Ander productportfolio |
| "Push niet blind naar productie wanneer dat niet noodzakelijk is" | Niets live zonder uitdrukkelijke toestemming; werken op de vaste tak | De vaste projectregel is strenger dan "niet blind" |
| Polish op een live site; voor/na tegen productie | Ronde vóór lancering; meten lokaal op de build met dezelfde methode | De site draait nog niet op het echte domein |
| Audit en uitvoering in één gang | Twee gangen: eerst rapporteren, dan uitvoeren na akkoord | Voorkomt wijzigingen die niet van mij zijn om te maken |
| "Wijzig alleen wat aantoonbaar verbetert" | Vier categorieën met een concrete drempel (§2) | Zonder drempel is "aantoonbaar" een mening |
| Eindcijfers /10 | Cijfers mét het bewijs eronder | Een cijfer zonder meting nodigt uit tot mooipraterij |
| — | Toegevoegd: geen feiten verzinnen (§0.2) | Vaste projectregel, ontbrak in het origineel |
| — | Toegevoegd: de noindex-kop bij livegang (§3.1) | Vergeten hiervan betekent een onvindbare site |
| — | Toegevoegd: de 146 oude adressen als grootste lanceerrisico (§3.2) | Het waardevolste dat bij een verhuizing te verliezen valt |
