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
| Hotel VIC | leeg zwart vlak | logo in png/svg |
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

## 4. Wat de site inhoudelijk sterker zou maken

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
