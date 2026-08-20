# Eindrapport: Vision2Watch Rebuild

Stand van zaken bij oplevering. De nieuwe site is compleet, getest en klaar
om bekeken te worden. **vision2watch.nl is niet aangeraakt en er is niets
gepubliceerd.**

## 1. Wat is gebouwd

Een volledig nieuwe, Nederlandstalige website van 63 pagina's, gebouwd als
statisch geprerenderde site: elke route bestaat als echt HTML-bestand, dus
bezoekers, zoekmachines en AI-crawlers krijgen de volledige inhoud zonder
JavaScript uit te voeren. React hydrateert daarna alleen voor interactie
(menu, formulieren, video, uitklapbare vragen).

Stack: Vite 8, React 19, TypeScript, Tailwind CSS 4, eigen prerender-stap.
Geen CMS, geen database, geen externe runtime-afhankelijkheden: alle
teksten staan als TypeScript in de repository, alle media en lettertypen op
de eigen server.

De positionering is verschoven van "leverancier van apparatuur" naar
technologie, experience, content en integratie uit één hand: elke
productpagina benoemt niet alleen de techniek maar ook het probleem, de
toepassingen, de integratie en wat Vision2Watch daarin zelf doet (advies,
eigen software, eigen studio, installatie, service).

## 2. Nieuwe sitemap

| Sectie | Pagina's | Inhoud |
| --- | --- | --- |
| Hoofd | 1 | homepage |
| `/producten` | 18 | overzicht + 17 productpagina's |
| `/toepassingen` | 7 | overzicht + 6 sectorpagina's |
| `/projecten` | 24 | overzicht + 23 cases |
| `/kennisbank` | 6 | overzicht + 5 artikelen |
| `/diensten` | 1 | advies, content, installatie, service |
| `/over-ons`, `/contact`, `/prijslijst` | 3 | bedrijf en conversie |
| `/privacy`, `/algemene-voorwaarden`, `/bedankt` | 3 | randvoorwaardelijk |

Plus `/404`. De sitemap bevat 62 indexeerbare URL's; `/bedankt` staat er
bewust buiten en heeft `noindex`.

Producten: interactieve vloer, muur, tafel, etalage, Sketchwall, Virtual
Chef, hologram-projectie, holografische molen, HEREweHOLO, Virtual Host,
touchscreens, transparant scherm, LED-displays, mixed reality,
gebouwprojectie, panoramische projectie, logo-animatie.

Sectoren: beurzen & events, retail, musea & attracties, horeca & hotels,
onderwijs, showrooms & kantoren.

## 3. Belangrijkste designkeuzes

- **Donkere basis met één accentkleur.** De site toont vrijwel uitsluitend
  lichtgevende techniek in donkere ruimtes; een donkere achtergrond laat
  dat beeldmateriaal spreken. Accent is het oranje uit het logo.
- **Twee lettertypen, zelf gehost.** Space Grotesk voor koppen (technisch,
  eigenzinnig), Inter voor tekst. Inline `@font-face` plus preload: geen
  externe verbinding voor de eerste weergave.
- **Secties ontworpen vanuit de inhoud.** De homepage wisselt bewust van
  ritme: hero met video, klantenbalk, vier categoriekaarten met beeld, een
  compacte sectorkiezer, projectkaarten, een genummerd viertrapsproces, een
  showroomblok en één afsluitende CTA. Geen herhaald kaartenraster.
- **Beweging is functioneel.** Reveal-animaties bij het inscrollen, een
  fade van poster naar video, hover-toestanden op kaarten en knoppen. Geen
  scroll-hijacking, geen intro, geen WebGL. Alles respecteert
  `prefers-reduced-motion`; de herovideo start dan niet.
- **Design tokens in één bestand** (`src/styles/global.css`): kleuren,
  typografie, spacing, radii, animatieduren. Gedocumenteerd in
  `docs/design-system.md`.

## 4. Gebruikte informatie uit de kennisbank

De meegeleverde kennisbank websitebouw is als werkwijze gevolgd:

- **Architectuur:** prerendering naar echte HTML-bestanden, content
  gescheiden van code, routes uit één bron, zelfvoorzienend zonder externe
  hosts (01-architectuur.md).
- **Meertaligheid:** de contentlaag heeft één gedeeld TypeScript-type en de
  routes staan op één plek, zodat een tweede taal met eigen slugs en
  hreflang kan worden toegevoegd zonder de site te herbouwen. Nog niet
  geactiveerd, zoals gevraagd (02-meertaligheid.md).
- **SEO en GEO:** metadata-regels, structured data per paginatype, clusters
  met minimaal twee interne links per pagina, `llms.txt`, AI-crawlers
  expliciet toegestaan in `robots.txt` (03-seo-geo-playbook.md).
- **Performance:** zelf gehoste variabele fonts, drie cacheklassen in
  `_headers`, WebP met vaste verhoudingen, video met poster en lazy gedrag
  (04-performance.md).
- **Kwaliteitscontrole:** de vaste pijplijn plus de drie auditsjablonen
  (statisch, runtime, toegankelijkheid) zijn overgenomen en aangepast aan
  dit project; exitcodes worden gecontroleerd zonder pipe
  (05-kwaliteitscontrole.md).
- **Deploy:** `_redirects`, `_headers` en een generator voor `.htaccess`,
  zodat de site op Netlify/Cloudflare Pages én op Apache werkt
  (06-deploy-en-hosting.md).
- **Media-pipeline:** herkomstregister per bestand, ophalen via een
  GitHub Actions-runner omdat de bouwomgeving geen vrij internet heeft
  (07-media-pipeline.md).
- **Vaste regels:** geen verzonnen feiten, één hoofddomein, bedankpagina op
  `noindex`, niets breken voor een score (08-vaste-regels.md).

De inhoudelijke bron voor de teksten is de huidige vision2watch.nl zelf:
139 pagina's zijn gecrawld en bewaard in `discovery/`, inclusief 135
bronbeelden en 2 video's.

## 5. Nieuwe en verbeterde pagina's

Alles is opnieuw geschreven; niets is overgenomen als plaktekst. De grootste
inhoudelijke veranderingen:

- **Productpagina's** volgen nu één vaste opbouw: hero, wat het doet, groot
  beeld of video, het probleem dat het oplost, voordelen, toepassingen,
  techniek en integratie, galerij, gerelateerde projecten, FAQ, CTA.
- **Sectorpagina's** zijn nieuw. De oude site had losse producten; nu is er
  per sector een pagina die vertrekt vanuit de situatie van de klant en
  doorlinkt naar producten en cases.
- **Kennisbank** is nieuw: vijf artikelen die de vragen beantwoorden die
  klanten stellen ("wat is een interactieve vloer", "wat kost het", "huren
  of kopen"). Elk artikel begint met het directe antwoord in twee, drie
  zinnen, wat AI-zoekmachines citeren.
- **Cases** hebben een vaste structuur (klant, uitdaging, oplossing,
  gebruikte techniek, media, gerelateerde oplossingen, CTA). Er zijn geen
  resultaten of percentages toegevoegd die niet in de bron staan.
- **Diensten** maakt expliciet wat Vision2Watch naast levering doet:
  advies, contentproductie, installatie en service tot en met SLA.

## 6. SEO-verbeteringen

- Elke pagina heeft een unieke titel en description, een zelfverwijzende
  canonical naar het hoofddomein, precies één H1 en een kopstructuur zonder
  niveausprongen. Machinaal gecontroleerd over alle 63 pagina's.
- Sprekende URL's per cluster (`/producten/interactieve-vloer`,
  `/toepassingen/retail`, `/projecten/werken-bij-defensie`).
- Kruimelpaden met `BreadcrumbList` op elke pagina.
- Interne links met beschrijvende ankerteksten; elke pagina in de sitemap
  heeft minimaal twee inkomende links (machinaal gecontroleerd).
- Beschrijvende bestandsnamen en alt-teksten op alle beelden.
- Open Graph en `twitter:card` compleet, met absolute beeld-URL.
- `sitemap.xml` met alleen echte, indexeerbare pagina's; `robots.txt`
  verwijst ernaar.
- 301-plan voor alle 146 oude adressen (zie punt 10).

Zoekwoorden, zoekintentie per pagina en de interne linkstrategie staan in
`seo-strategy.md`.

## 7. GEO- en AI-vindbaarheid

- **Alles staat in de HTML.** Geen enkele inhoud verschijnt pas na
  JavaScript. Dat is de belangrijkste voorwaarde om door AI-systemen gelezen
  te worden.
- **`llms.txt`** met een compacte samenvatting van aanbod, sectoren,
  kernpagina's en contactgegevens.
- **`robots.txt`** staat GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot,
  Google-Extended en CCBot expliciet toe. Dit is een beleidskeuze van de
  eigenaar: wilt u dit anders, dan is het één bestand aanpassen.
- **Structured data (JSON-LD)** per paginatype: Organization en WebSite op
  de homepage, LocalBusiness op contact, Product op 17 productpagina's,
  FAQPage op 28 pagina's, Article op de kennisbankartikelen,
  BreadcrumbList op 63 pagina's. Alle blokken parsen; er staat niets in dat
  niet ook zichtbaar op de pagina staat (geen verzonnen reviews, ratings of
  prijzen).
- **Citeerbare antwoorden**: elk kennisbankartikel en elke FAQ-vraag geeft
  eerst een kort, zelfstandig leesbaar antwoord.

## 8. Performance

Gemeten met Lighthouse tegen de gebouwde site, mobiel (4G-throttling) en
desktop.

| Pagina | Mobiel | Desktop | LCP mobiel | CLS |
| --- | --- | --- | --- | --- |
| Homepage | 94 | 100 | 3,0 s | 0 |
| Interactieve vloer | 95 | 100 | 2,9 s | 0 |
| Case DreamHack | 95 | 100 | 2,9 s | 0 |
| Contact | 95 | 100 | 2,9 s | 0 |
| Kennisbankartikel | 95 | 100 | 2,9 s | 0 |

Wat daar tijdens deze ronde voor is gedaan:

1. **React draaide in productie in ontwikkelmodus** en minificatie stond
   uit. Na herstel van de buildconfiguratie ging de hoofdbundel van 1225 kB
   naar 434 kB (gzip 255 naar 128 kB).
2. **De herovideo werd vóór de eerste weergave geladen** (2,5 MB) en was
   daarmee zelf het grootste element. Nu staat alleen de poster in de
   voorgebouwde HTML, als responsief beeld met srcset en `fetchpriority`,
   en zet de client de videobron pas na hydratie. Op smalle schermen komt
   er een lichtere versie; bij databesparing of een 2G-verbinding blijft de
   poster staan. Het paginagewicht van de homepage ging van 3082 KiB naar
   434 KiB.
3. **Video's opnieuw gecodeerd** (1280 px, crf 28, faststart) plus een
   mobiele variant van 720 px: 2,5 MB naar 1,7 MB, mobiel 0,8 MB.
4. **Beeldvarianten** van 640 en 1024 px worden nu door het curatiescript
   gegenereerd in plaats van met de hand, zodat srcset en de vastgelegde
   afmetingen niet uit de pas kunnen lopen.

CLS is op elke gemeten pagina 0,000: elk beeld heeft width en height en
elke mediacontainer een vaste verhouding.

## 9. Toegankelijkheid

Lighthouse-toegankelijkheid: **100** op alle gemeten pagina's. Daarnaast
handmatig en machinaal gecontroleerd:

- Kopstructuur zonder niveausprongen, precies één H1 per pagina.
- Alle links en knoppen hebben een toegankelijke naam; alle beelden een
  alt-tekst (decoratieve een lege).
- Zichtbare focusstijl, skiplink naar de inhoud, `<main>`-landmark.
- Formuliervelden hebben een gekoppeld label, verplichte velden zijn
  gemarkeerd, foutmeldingen verschijnen in een `role="alert"`.
- Kleurcontrast: alle tekstkleuren zijn narekend tegen de achtergrond;
  de lichtste tertiaire kleur haalt 5,49:1 (eis 4,5:1).
- Tikdoelen op mobiel halen de WCAG 2.2-ondergrens van 24 px; geen enkele pagina heeft
  horizontale scroll op 375, 430, 768, 1024, 1440 of 1920 px.
- `prefers-reduced-motion` wordt gerespecteerd: reveal-animaties en
  autoplay van de herovideo blijven dan uit (getest).

## 10. Redirectstrategie

Alle **146** adressen die de crawl van de huidige site opleverde zijn
afgehandeld: 7 bestaan onder dezelfde URL, de overige 139 krijgen een 301
naar de best passende nieuwe pagina. Machinaal gecontroleerd (onderdeel van
`npm run qa`) op drie punten: elk oud adres wordt opgevangen, elk doel
bestaat echt in de build, en geen enkel doel is zelf weer bron van een
volgende omleiding (geen ketens).

De regels staan in `public/_redirects` (Netlify/Cloudflare Pages) en worden
met `node scripts/htaccess-genereren.mjs` omgezet naar `.htaccess` voor
Apache. Beide bevatten ook www naar non-www en http naar https.
Toelichting per regel: `redirects.md`.

## 11. Ontbrekende content en assets

Volledig uitgewerkt in `docs/ontbrekende-assets.md`. Samengevat:

- **Vier klantlogo's ontbreken** (Alpro, Ministerie van Defensie, Vic Hotel
  Leiden, 24-7 Events). Wat op de huidige site als logo stond, bleek een
  interface-icoontje of een leeg bestand. Die klanten worden nu in tekst
  genoemd bij hun project.
- **Twee cases hebben geen eigen projectfoto** (Philips, Kanon Loading
  Equipment). Ze tonen een foto van dezelfde techniek met daaronder de
  zichtbare vermelding dat het een illustratiebeeld is.
- **Drie gegevens zijn van de site gehaald** omdat ze nergens in de bron
  staan: het btw-nummer, het oprichtingsjaar ("sinds 2008") en een tiende
  teamlid. Aanleveren en ze staan er weer op.
- **Twee beweringen vragen bevestiging**: of het holografische scherm van
  9 meter nog "het langste van Nederland" is (de bron zegt dit met de
  toevoeging "aldus 2015") en of de showroom op het huidige adres in Den
  Haag staat (een oudere blogpost noemt Rijswijk).
- **Twee van de vier video's op de huidige site konden niet worden
  opgehaald** (de download gaf een foutpagina): die bij het artikel over
  3D-hologramprojectie en die bij de Starline-case. Beide bronnen zijn
  bovendien laag van resolutie; het origineel is welkom.
- **Grootste inhoudelijke winst** zou zijn: eigen projectfoto's per case,
  meetbare resultaten per project, en korte video's bij de interactieve
  etalage, de Sketchwall en de Virtual Host.

## 12. Openstaande aandachtspunten

1. **Het formulier heeft nog geen werkend eindpunt.** Het is opgezet voor
   Netlify Forms (inclusief spamval). Draait de site straks op een andere
   host, dan moet er een `formulier.php` of een ander eindpunt komen; de
   bedankpagina bestaat al. Testen vóór livegang.
2. **Analytics staat nog uit.** De site is er technisch op voorbereid, maar
   er is bewust geen GA4 of Tag Manager geplaatst: dat vraagt een keuze over
   cookietoestemming en een bijpassende privacyverklaring.
3. **Content-Security-Policy** is nog niet ingesteld. Volgens de kennisbank
   hoort dat op de definitieve host te gebeuren, met de dan werkelijke
   externe bronnen erbij.
4. **Verificatietags** voor Google Search Console en Bing moeten nog worden
   toegevoegd zodra de accounts bekend zijn.
5. **De AI-crawlerkeuze** (alles toestaan) is een beleidsbeslissing die de
   eigenaar bewust moet bevestigen.
6. **Meertaligheid** is voorbereid maar niet geactiveerd, zoals gevraagd.
   De huidige site heeft wel een Engelse versie; die URL's staan in het
   redirectplan en gaan nu naar de Nederlandse pagina. Zodra Engels
   terugkomt, verdienen ze een eigen `/en/`-pad met taaleigen slugs.

## 13. Lokaal testen

```bash
npm install
npm run build                 # bouwt en prerendert naar dist/
npm run preview -- --port 4390
```

Open daarna http://localhost:4390. De volledige controle:

```bash
npm run typecheck
npm run build
npm run qa                    # metadata, feiten, interne links, omleidingen
npm run audit:statisch
npm run audit:runtime         # vereist de draaiende preview
npm run audit:a11y
node scripts/schermafdrukken.mjs   # 375 t/m 1920 px
```

Alles moet zonder fouten eindigen; de scripts geven exitcode 1 bij een
bevinding.

## 14. Deployment

Uitgebreid in `docs/deployment.md`. Kort:

- **Netlify of Cloudflare Pages**: publiceer de inhoud van `dist/`.
  `_redirects` en `_headers` worden automatisch opgepakt, `404.html` ook.
- **Eigen server (Apache)**: draai `node scripts/htaccess-genereren.mjs`,
  upload de inhoud van `dist/` inclusief het verborgen `.htaccess` naar de
  webroot.
- **nginx**: `try_files $uri $uri/index.html =404;` plus `error_page 404`;
  het volledige blok staat in `docs/deployment.md`.

Er zijn geen environment variables nodig om de site te tonen; er zijn geen
sleutels of tokens in de repository.

## 15. Wat er nog moet gebeuren vóór vision2watch.nl vervangen wordt

In volgorde:

1. **Inhoudelijke goedkeuring.** Loop de site door en bevestig de punten uit
   `docs/ontbrekende-assets.md`: de twee beweringen die verificatie vragen,
   het btw-nummer, het oprichtingsjaar en het tiende teamlid.
2. **Ontbrekende assets aanleveren** (vier klantlogo's, projectfoto's voor
   Philips en Kanon). Zonder die logo's blijft de referentiebalk zes klanten
   tonen in plaats van tien.
3. **Formulier-eindpunt kiezen en testen**: één echte proefinzending, en
   controleren dat de mail bij de juiste ontvanger aankomt.
4. **Meting en cookiebeleid bepalen** en de privacyverklaring daarop
   aanpassen.
5. **Previewomgeving publiceren** op een tijdelijk adres, met `noindex`
   zolang het een preview is, zodat de site in het echt te beoordelen is.
6. **Verificatietags plaatsen** voor Search Console en Bing.
7. **Livegang** volgens `10-checklist-livegang.md` uit de kennisbank: DNS
   omzetten, direct daarna een oud adres testen (moet 301 geven), een
   verzonnen adres testen (moet een echte 404 geven), het formulier testen
   en de cache-headers steekproeven.
8. **Na livegang**: sitemap aanmelden in Search Console en Bing, de eerste
   week de indexatiedekking volgen, en de CSP instellen met de console
   ernaast.

Zolang stap 7 niet is gezet, blijft de huidige vision2watch.nl gewoon
draaien. Er is in dit traject niets aan de live site gewijzigd.
