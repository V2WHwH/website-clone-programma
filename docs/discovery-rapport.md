# Discovery-rapport Vision2watch Rebuild

Datum: 20 augustus 2026. Bronnen: volledige crawl van www.vision2watch.nl
(146 URL's, sitemaps, 140 unieke mediabestanden), webresearch naar het
bedrijf en de markt, de meegeleverde kennisbank websitebouw, en
screenshots van de huidige site en de referentiesites.

## 1. Huidige site (Wix)

- Platform: Wix, donker thema met oranje accent, logo "VISION2WATCH" met
  oranje "2".
- Structuur: home, producten (17 productpagina's), projecten (23
  projectpagina's), blog (13 NL + 12 EN posts, projectnieuws), over ons,
  contact, prijsformulier, privacy, algemene voorwaarden; volledige
  EN-spiegel onder /en/ (Engelse teksten op deels Nederlandse slugs).
- Positionering huidige homepage: "Marketing bureau en leverancier voor
  verhuur en verkoop van audiovisuele middelen."
- Belangrijkste conversie: prijslijst aanvragen (formulier) en afspraak
  boeken; verder alleen een contactformulier.
- Zwaktes (bevestigd door analyse): geen dienstenverhaal (advies,
  content, installatie, service staan alleen als procesblokje op
  over-ons), geen sector-/toepassingspagina's, projectpagina's vaak één
  regel, dubbele paden (/product/interactieve-muur én /interactieve-wand,
  /blog én /projecten), features-blokken met herhaalde teksten die soms
  niet bij het product horen ("restaurant transformeren" op de
  LED-pagina), geen structured data van betekenis, geen kennisbank.

## 2. Feitelijke basis (geverifieerd)

- Bedrijf: Vision 2 Watch B.V., KvK 27130482, BTW NL009550458B01
  (op de site: VAT 0095.50.458.B01).
  Een oprichtingsjaar staat nergens op de site; de eerdere aanname "2008"
  in dit rapport bleek bij de contentcontrole niet houdbaar en is uit de
  site gehaald (zie docs/ontbrekende-assets.md).
- Adres (actueel op de site): Tiber 10, 2491 DH Den Haag.
- Telefoon: algemeen +31 (0)85 007 02 23, Desmond +31 (0)6 50 40 95 53,
  Ronald +31 (0)6 53 48 62 82. E-mail: info@vision2watch.nl.
- Team (over-ons, 2025/2026): Desmond (founder & CEO), Doris (marketing-
  en projectmanager), Flo (hostess), Ronald (accountmanager), Aline
  (projectmanager), Luuk (AV-specialist), Joël (programmer), Mark
  (animator), Wim (allrounder).
- Werkwijze (over-ons): concept > realisatie/content (eigen studio) >
  installatie > service (preventief onderhoud t/m SLA).
- Eigen software: iFloor/active-surface-software ("een van de weinige
  partijen in Europa"), eigen Augmented engine voor AR op grote schermen.
- Partnership: Epson (mobiele iFloor, Store of the Future,
  Virtual Product Presenter). Zusterbedrijf: HEREweHOLO (holoboxen).
- Socials in de footer van de huidige site: Instagram, TikTok, YouTube,
  LinkedIn.
- Klanten met projectpagina: Clinique (via Bolt Amsterdam), Euroveiling
  (via Jada Events), Nike, Adidas, McDonald's, Philips, Nespresso, RTL,
  Escher Museum, Sea Life, Dierenpark Amersfoort, Ouwehands Dierenpark,
  Pierson College, Tieleman Keukens, Outlet Store Roermond, Vic Hotel
  Leiden, Coffeeshop Marbella, Castello, Starline, Kanon Loading
  Equipment, Werken bij Defensie (DreamHack), Bloemenbureau Holland
  (via Heleen Valstar BV); ouder: Johnson & Johnson (EuroSpine 2019
  Helsinki), Alpro & Tasty Lemon (Westfield Mall of the Netherlands),
  Timing (AR), M&M, Epson.

## 3. Kennisbank websitebouw (ZIP)

De ZIP bevat geen productinformatie maar de complete, in de praktijk
geteste bouwmethodiek van een eerder project (HEREweHOLO-site):
architectuur (Vite + React + TS + Tailwind met prerendering naar echte
HTML per route), meertaligheidsmodel, SEO/GEO-playbook, performance-
regels, QA-pijplijn, deploymodel en niet-onderhandelbare regels. Deze
rebuild volgt die methodiek; de audit-sjablonen zijn overgenomen in
scripts/.

## 4. Referentiesites (screenshots in discovery/screenshots)

- firstimpression.nl: end-to-end experience-integrator; casegedreven,
  markten + diensten per projectfase; de maatstaf voor positionering.
- fplus.ai: donker, typografiegedreven, scroll-storytelling, één accentkleur.
- bamlab.ch: near-black, veel witruimte, grote rustige typografie,
  cases met citaat per case, weinig maar raak effect.

Vertaling naar Vision2watch: het bestaande merk (zwart + oranje) wordt
aangehouden maar naar high-end niveau getild: donkere basis, één oranje
accent, grote typografie, echte projectbeelden en -video's als dragend
visueel materiaal, subtiele reveal-animaties, geen template-esthetiek.

## 5. Markt en zoekwoorden (samenvatting)

Volledige analyse: zie seo-strategy.md. Kern: de markt ordent zich op
productcategorieën (interactieve vloer, touchtafel, hologram/holobox,
narrowcasting/digital signage, projection mapping), op sectoren
(beurzen, retail, musea, zorg, onderwijs, showrooms) en op de keuze
huren/kopen. Concurrenten die winnen (First Impression, Prestop,
Holoconnects) combineren productpagina's met sectorpagina's, een
kennisbank met echte antwoorden ("wat kost..", "hoe werkt..") en een
zichtbare demo-/showroomconversie. Grootste gaten bij Vision2watch:
dienstenlaag, sectorpagina's, kennisbank, huren/kopen-structuur en
FAQ-content. De rebuild vult die allemaal met bestaande, feitelijke
Vision2watch-informatie.
