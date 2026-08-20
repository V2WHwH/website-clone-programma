# SEO- en GEO-strategie Vision2watch

Hoofddomein: https://www.vision2watch.nl. Alle canonicals, structured
data en interne links wijzen daarheen. Eén taal actief (nl); de
architectuur is voorbereid op en/de/fr met taaleigen slugs en hreflang.

## Positionering in zoektaal

Vision2watch wordt gepositioneerd op de commerciële categorietermen die
de markt echt gebruikt (niet op interne productnamen). De interne naam
blijft zichtbaar als merk (iFloor, Sketchwall), maar titel, H1 en URL
dragen de categorieterm.

## Pagina-mapping: zoekintentie per pagina

| Pagina | Hoofdzoekwoord | Secundair | Intentie |
| --- | --- | --- | --- |
| / | interactieve audiovisuele oplossingen | hologrammen, interactieve projectie, AV-specialist Den Haag | merk/commercieel |
| /producten | audiovisuele producten kopen huren | interactieve projectie, hologram, touchscreen | commercieel |
| /producten/interactieve-vloer | interactieve vloer | interactieve vloer huren/kopen, interactieve vloerprojectie, beweegvloer | commercieel |
| /producten/interactieve-muur | interactieve muur | interactieve wand, gamemuur, muurprojectie | commercieel |
| /producten/interactieve-tafel | interactieve tafel | interactieve bar, touchtafel projectie | commercieel |
| /producten/sketchwall | sketchwall tekenwand | interactieve tekenwand kinderen | commercieel |
| /producten/virtual-chef | virtual chef tafelprojectie | interactieve restauranttafel, dinner in motion | commercieel |
| /producten/virtual-host | virtual host virtuele gastvrouw | virtuele receptioniste, hologram gastvrouw | commercieel |
| /producten/hologram-projectie | hologram projectie | holografische projectie, Pepper's ghost, hologram huren | commercieel |
| /producten/holografische-molen | holografische molen | 3D hologram ventilator, holomuur | commercieel |
| /producten/hereweholo | holobox | hologram box, HEREweHOLO | commercieel |
| /producten/transparant-scherm | transparant scherm | transparant LCD display, productvitrine scherm | commercieel |
| /producten/touchscreens | touchscreen kopen | touchtafel, multi-touch scherm, informatiezuil | commercieel |
| /producten/led-displays | LED display | videowall, outdoor LED-scherm, glas-LED | commercieel |
| /producten/interactieve-etalage | interactieve etalage | digitale etalage, touch foil raam, iWindow | commercieel |
| /producten/gebouw-projectie | gebouwprojectie | projection mapping gevel, 3D videomapping gebouw | commercieel |
| /producten/panoramische-projectie | 360 graden projectie | panoramische projectie, immersive room, dome projectie | commercieel |
| /producten/mixed-reality | augmented reality scherm | mixed reality marketing, AR videowall | commercieel |
| /producten/logo-animatie | logo animatie projectie | 3D logo projectie | commercieel |
| /toepassingen | interactieve technologie toepassingen | (verdeelpagina) | navigatie |
| /toepassingen/beurzen-en-events | interactieve beursstand | opvallen op een beurs, standattractie, blikvanger beurs | commercieel |
| /toepassingen/retail | interactieve etalage winkel | retail technologie, winkelbeleving, digitale etalage | commercieel |
| /toepassingen/musea-en-attracties | interactieve installatie museum | museum interactief, dierentuin beleving | commercieel |
| /toepassingen/horeca-en-hotels | projectie restaurant hotel | virtual chef, hotelbeleving, interactieve vloer hotel | commercieel |
| /toepassingen/onderwijs | interactieve vloer school | beweegvloer onderwijs, interactief schoolplein | commercieel |
| /toepassingen/showrooms-en-kantoren | interactieve showroom | showroom technologie, kantoor beleving | commercieel |
| /diensten | audiovisuele totaaloplossing | AV advies installatie onderhoud SLA, content op maat | commercieel |
| /projecten | audiovisuele projecten | interactieve installaties voorbeelden | bewijs |
| /projecten/<case> | <klant> + product | (longtail) | bewijs |
| /kennisbank | (verdeelpagina) | | informatief |
| /kennisbank/wat-is-een-interactieve-vloer | wat is een interactieve vloer | hoe werkt een interactieve vloer | informatief |
| /kennisbank/interactieve-vloer-kopen-of-huren | interactieve vloer kopen of huren | interactieve vloer prijs | informatief/commercieel |
| /kennisbank/wat-is-hologram-projectie | wat is een hologram | Pepper's ghost uitleg, holografisch display | informatief |
| /kennisbank/hoe-werkt-een-interactieve-etalage | hoe werkt een interactieve etalage | touch foil, projected capacitance | informatief |
| /kennisbank/opvallen-op-een-beurs | opvallen op een beurs | beursstand ideeën interactief | informatief |
| /over-ons | Vision2watch over ons | AV-specialist Den Haag team | merk |
| /contact | Vision2watch contact | showroom Den Haag afspraak | conversie |
| /prijslijst | prijslijst aanvragen | prijzen interactieve vloer hologram | conversie |

Één sterke pagina per intentie; de kennisbankartikelen linken naar de
productpagina (commercieel) en andersom, zonder elkaar te kannibaliseren:
"wat is/hoe werkt" leeft in de kennisbank, "kopen/huren" op de
productpagina.

## Metadata-regels

Unieke title tot ~65 tekens met merknaam achteraan; unieke description
120-165 tekens met de belofte of het antwoord van de pagina;
zelfverwijzende canonical; precies één H1; volledige Open Graph +
twitter:card; /bedankt met noindex en buiten de sitemap. Machinaal
afgedwongen door scripts/qa-rapport.mjs.

## Structured data (JSON-LD)

| Paginatype | Types |
| --- | --- |
| Homepage | Organization (adres, e-mail, telefoon, logo, KvK als identifier, sameAs socials, knowsLanguage) + WebSite |
| Contact | LocalBusiness met geo, ContactPoint, openingsuren op afspraak |
| Product | Product (Brand Vision2Watch, description; geen verzonnen prijzen of reviews) |
| Toepassing/kennisbank met FAQ | FAQPage met de zichtbaar aanwezige vragen |
| Kennisbankartikel | Article met echte datePublished/dateModified |
| Project | indien video aanwezig VideoObject; anders WebPage |
| Alles | BreadcrumbList |

IJzeren regel uit de kennisbank: schema beschrijft alleen wat zichtbaar
en waar is. Elke JSON-LD moet parsen (machinaal gecontroleerd).

## Interne linkstrategie

Clusters: product > gerelateerde cases > sector > kennisbankartikel >
terug naar product. Elke sitemap-URL heeft minimaal 2 inkomende interne
links (machinaal gecontroleerd door scripts/linkcontrole.mjs).
Beschrijvende ankerteksten ("interactieve vloer voor beurzen"), nooit
"klik hier" of "meer info" als enige anker.

## GEO / AI-zoekmachines

- Volledige inhoud staat server-side in de HTML (prerendering); geen
  content achter client-side rendering.
- /llms.txt met compact aanbod, bedrijfsgegevens en kernpagina's.
- robots.txt staat AI-crawlers expliciet toe (GPTBot, OAI-SearchBot,
  ClaudeBot, PerplexityBot, Google-Extended, CCBot) en verwijst naar
  llms.txt en sitemap. Dit is een beleidskeuze van de eigenaar; nu
  ingesteld op toestaan, eenvoudig aan te passen.
- Kennisbankartikelen openen met het directe antwoord in 2-3 zinnen
  (citeerbaar blok), daarna verdieping; definities en FAQ's als
  zelfstandige, complete passages.
- Consistente entiteiten: overal dezelfde bedrijfsnaam, adres,
  KvK, productnamen en categorietermen.

## Verificatie en vervolg (na livegang)

Google Search Console-metatag en BingSiteAuth.xml kunnen pas geplaatst
worden met de echte verificatiecodes van de eigenaar; plek is in de site
voorbereid (zie docs/deployment.md). Sitemap aanmelden, indexdekking
volgen, 301's steekproefsgewijs testen.
