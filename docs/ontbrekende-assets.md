# Ontbrekende en onbruikbare assets

Alle beelden en video's op deze site komen uit de mediabibliotheek van de
huidige vision2watch.nl (opgehaald via `discovery/media-ophalen.mjs`,
herkomst per bestand in `scripts/media-herkomst.json`). Tijdens de visuele
controle bleek een deel van dat materiaal niet bruikbaar. Er is niets
vervangen door verzonnen of gekochte beelden: wat niet klopte is
weggelaten en staat hieronder, zodat de opdrachtgever gericht kan
aanleveren.

## 1. Klantlogo's die ontbreken

De referentiebalk op de homepage toont nu zes logo's: RTL, McDonald's,
Sea Life, Escher in het Paleis, Bloemenbureau Holland en Jada Events.

Voor deze klanten stond op de huidige site geen bruikbaar logo. Wat er
stond was een interface-icoontje of een leeg bestand, dus is het
verwijderd; een generiek icoontje tonen onder de naam van een klant zou
de bezoeker misleiden.

| Klant | Wat er in de bron stond | Nodig |
| --- | --- | --- |
| Alpro | pictogram van een beeldscherm | logo in png/svg, liefst op transparant |
| Ministerie van Defensie | pictogram van een hand | officieel beeldmerk (let op gebruiksvoorwaarden) |
| Vic Hotel Leiden | leeg zwart vlak | logo in png/svg |
| 24-7 Events | pictogram van een kubus | logo in png/svg |

Deze klanten worden nu wél in tekst genoemd bij hun project. Zodra de
logo's er zijn: bestand in `public/media/logo/`, regel toevoegen in
`KLANTLOGOS` in `src/data/site.ts` en in `scripts/media-cureren.mjs`.

## 2. Projecten zonder eigen projectfoto

Twee projecten hebben geen eigen beeldmateriaal in de bron. Ze tonen nu
een foto van dezelfde techniek met daaronder de zichtbare vermelding
"Illustratiebeeld: dit toont de gebruikte techniek, niet dit project
zelf" (veld `beeldIllustratief` in `src/content/nl/projecten.ts`).

| Project | Situatie |
| --- | --- |
| Philips, productdemonstratie op een interactieve vloer | geen projectfoto gevonden |
| Kanon Loading Equipment, interactief looppad op StocExpo | geen projectfoto gevonden |

Zodra er foto's zijn: beeld toevoegen en `beeldIllustratief` weghalen.

## 3. Beelden uit de bron die zijn afgevallen

Bij de eerste curatie zijn beelden op bestandsnaam-id gekoppeld. Bij de
visuele controle bleek een aantal iets heel anders te tonen dan de naam
suggereerde. Die zijn uit de curatielijst gehaald in plaats van met een
bijgeschreven omschrijving alsnog te gebruiken:

- een portretfoto van een medewerker (stond onder een vloerprojectienaam)
- het Vision2Watch-logo (stond onder een tentoonstellingsnaam)
- twee interface-pictogrammen (VR-bril, oog)
- een foto van een flightcase met apparatuur
- een pagina uit een standontwerp (pdf-afdruk)
- enkele beelden waarvan de inhoud niet overeenkwam met de klant of het
  product waar ze aan gekoppeld waren

Portretfoto's van teamleden zijn bewust niet overgenomen: de koppeling
tussen foto en naam is niet te verifiëren.

## 3b. Twee video's konden niet worden opgehaald

De huidige site bevat vier video's; twee daarvan kwamen niet binnen (de
download leverde een foutpagina van 4 kB in plaats van een bestand, zie
`discovery/media-bron/video`). Het gaat om:

| Video | Waar hij nu staat |
| --- | --- |
| bij het artikel over 3D-hologramprojectie (480p) | `/post/holografie-wat-is-een-3d-hologram-projectie` |
| bij de case Starline / Ebben Inspyrium (360p) | `/post/starline-interactieve-vloer-bij-ebben-inspyrium` |

Beide bronbestanden zijn bovendien laag van resolutie (360p en 480p). Als
het originele materiaal er nog is, zijn dat twee sterke toevoegingen: één
bij het hologramproduct en één bij de Starline-case. Aanleveren in de
hoogste beschikbare resolutie; het curatiescript maakt er zelf een
webversie en een mobiele variant van.

## 4. Gegevens die niet in de bron staan

Bij de contentcontrole is elke feitelijke bewering nagelopen tegen de crawl
van de huidige site (`/tmp`-onafhankelijk vastgelegd in `discovery/crawl`).
Deze stonden nergens in de bron en zijn daarom van de site gehaald. Ze
kunnen er meteen weer bij zodra de opdrachtgever ze bevestigt.

| Gegeven | Status | Waar het weer terugkomt |
| --- | --- | --- |
| Btw-nummer | niet gevonden; stond eerder als NL009550458B01 op de site, herkomst onbekend | `SITE.btw` in `src/data/site.ts`, daarna footer, contactpagina en `vatID` in de structured data |
| Oprichtingsjaar | niet gevonden; "sinds 2008" was niet te staven | `SITE.oprichtingsjaar`, daarna footer, homepage, over-onspagina en `foundingDate` in de structured data |
| Medewerker "Patricia, administratie" | komt niet voor op de huidige over-onspagina | `TEAM` in `src/data/site.ts` |

Twee beweringen staan wél in de bron maar verdienen een bevestiging vóór
livegang:

1. **"Het langste holografische scherm van Nederland."** De huidige site
   zegt dit met de toevoeging "aldus 2015". Of het in 2026 nog klopt is
   niet te controleren, dus staat er nu alleen nog "een holografisch
   scherm van 9 meter breed". Klopt de superlatief nog, dan kan hij terug
   mét jaartal en bron op de pagina zelf.
2. **De showroom.** Het adres Tiber 10 in Den Haag staat op de huidige
   contactpagina, maar de blogpost over het 9 meter lange scherm noemt een
   showroom in Rijswijk (uit 2015). De site gaat er nu van uit dat de
   showroom op het huidige adres in Den Haag staat. Graag bevestigen.

## 5. Wat de site inhoudelijk sterker zou maken

Geen blokkade voor livegang, wel de grootste inhoudelijke winst:

1. **Projectfoto's per case.** Nu heeft een deel van de 23 projecten een
   passend maar niet projectspecifiek beeld. Eigen foto's per project
   maken de cases aantoonbaar echt.
2. **Resultaten per project.** De cases beschrijven vraag, oplossing en
   techniek. Meetbare resultaten (bezoekersaantallen, verblijfsduur,
   respons) staan er bewust niet in, omdat ze niet zijn aangeleverd.
3. **Bewegend beeld per productgroep.** Er zijn twee bruikbare video's.
   Korte video's bij de interactieve etalage, de Sketchwall en de
   virtual host zouden die pagina's veel overtuigender maken.
4. **Teampagina.** Namen, functies en foto's ontbreken in bruikbare vorm.
5. **Certificeringen en partnerlogo's** (bijvoorbeeld Epson) als daar
   gebruiksrecht voor is.
