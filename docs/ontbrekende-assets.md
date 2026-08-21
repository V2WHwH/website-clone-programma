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

## 3c. Productgroepen: vergelijking met de huidige site

De huidige vision2watch.nl heeft achttien product-adressen, maar zeventien
productgroepen: `/product/interactieve-wand` en `/product/interactieve-muur`
tonen woord voor woord dezelfde pagina. In de rebuild is dat één groep
(`/producten/interactieve-muur`), met een redirect vanaf het dubbele adres.

Eén groep ontbrak wel: **HEREweHOLO mini**. Op de huidige site staat die
groep in het productoverzicht en heeft hij een eigen adres, maar de pagina
zelf is leeg — er staan alleen de koppen "Mogelijkheden" en "Features",
zonder tekst. Daardoor viel de groep bij de eerste opzet weg.

De mini bestaat wel degelijk: in de Dropbox staat een eigen map
`Product_Content/Holobox Mini` met opnames. De pagina in de rebuild is
daarom geschreven op basis van wat aantoonbaar klopt (compacte uitvoering
van de holobox, van HEREweHOLO) plus het beeldmateriaal uit die map. Wat
er niet is: afmetingen, gewicht, aansluitwaarden en prijzen. Zodra die er
zijn, kunnen ze in `technisch` bij `hereweholo-mini` in
`src/content/nl/producten.ts`.

## 3d. Instagram kon niet worden gelezen

Het verzoek om de opgeleverde projecten op
[instagram.com/vision2watch](https://www.instagram.com/vision2watch/) na te
lopen is niet gelukt. Instagram beantwoordt zowel de profielpagina als de
achterliggende gegevens met foutcode 429 ("te veel verzoeken") zodra het
verzoek uit een datacenter komt, en dat geldt voor elke omgeving waarin
deze site gebouwd wordt (zie `discovery/instagram-rapport.txt`).

Er is bewust geen omweg omheen gezocht: dat zou neerkomen op het omzeilen
van een blokkade die Instagram zelf opwerpt. Wat wél werkt is aanleveren
vanuit de bron zelf — de Dropbox-map die inmiddels wordt gebruikt bevat
hetzelfde en beter materiaal, in hogere kwaliteit en zonder compressie van
Instagram.

## 3e. Wat er uit de Dropbox is gekomen, en wat niet

Uit de gedeelde map "Demo Video's" zijn dertig video's beoordeeld. Dat
beoordelen ging via contactvellen: van elke video maakt de runner een
raster van twaalf beelden, dat in `discovery/contactvellen/` blijft staan.
Zo is per bestand terug te zien waarop de keuze is gebaseerd, en is er
niets aan een pagina gekoppeld op basis van alleen een bestandsnaam.

Tien fragmenten zijn gebruikt (achterwand, producthero's, projecten en de
blokken "op locatie"). Deze vielen af, met reden:

| Bestand | Waarom niet gebruikt |
| --- | --- |
| showreel 2018.mp4 | Opent op een handdruk in een kantoorgang, met het logo van een derde partij in beeld gebrand. Toont het werk niet. |
| holomolen.mp4 | Opgenomen tegen een greenscreen in de werkplaats. Laat het product goed zien, maar de omgeving oogt onaf. |
| holowall bruynzeel adj.mp4 | Engelstalige animatie met tekst in beeld ("Each module provides 4k image quality"). Past niet op een Nederlandstalige site. |
| interactieve wand/waterstijl | Opbouwbeelden: monteurs op de knieën naast de installatie. |
| DigitalMoo, ARApp Live Painting | Demomateriaal van leveranciers, geen eigen werk. |
| Nimeto - Education.mov | Bruikbaar, maar de holobox heeft al een sterker fragment (Santino). Bewaard in de Dropbox. |
| retail display mapping | Rondloopbeelden op een beurs langs displays van andere aanbieders (Skittles, Barbie, Marlboro), met Engelstalige specificatiepanelen. Geen eigen werk. |
| content/20251125_* (vier clips) | Productopnames van een sieraad op een witte achtergrond. Content vóór een scherm, niet een installatie. |
| AR/VID_20191107, AR/2019-07-18 | Beursstand met projectiewand en interactieve tafel. Prima beeld, maar beide groepen hebben al een sterker fragment. |

Tien fragmenten zijn na deze rondes gekoppeld: de vier panelen van de
achterwand, producthero's voor sketchwall, panoramische projectie,
interactieve muur, interactieve tafel, de holobox, logo-animatie,
transparant scherm en LED-displays, en projectvideo's bij Outlet Roermond,
Sea Life, Ouwehands, Coffeeshop Marbella, Adidas en Castello.

## 3f. Eén beeld op de site is niet gefilmd

Achter de afsluitende oproep onderaan elke pagina loopt een laag beweging:
lichtbundels die traag door het donker trekken, met een amberkleurige gloed
onderin. Dat beeld is **gegenereerd** (Higgsfield, Cinema Studio Video 3.0)
en dus geen opname van een installatie.

Dat is een bewuste grens. Gegenereerd beeld staat op deze site alleen waar
er niets te tonen valt: het is abstract, het bevat geen product, geen
ruimte, geen mens en geen merk, en het staat nergens waar een bezoeker het
voor een project zou kunnen aanzien. Elk beeld dat wél een oplossing van
Vision2Watch laat zien, is een echte opname uit de eigen bibliotheek of de
Dropbox.

De opdracht was om met Higgsfield animaties te maken voor de scroll-
achtergrond. Dat is bewust níet gebeurd: de achterwand draait nu op echte
opnames uit de Dropbox, en die zijn per definitie sterker bewijs dan
gegenereerd beeld. Een foto van een echte installatie laten animeren door
een generatief model is ook overwogen en afgewezen: zo'n model verzint
details bij, en dan staat er een installatie op de site die er nooit zo
heeft uitgezien. In plaats daarvan krijgen pagina's zonder video een heel
trage inzoom op de echte foto (`.beeld-adem` in `src/styles/global.css`).

Bestand: `public/media/video/sfeer-lichtbundels.mp4` (102 kB), component
`src/components/site/Sfeerlaag.tsx`.

## 4. Gegevens die niet in de bron staan

Bij de contentcontrole is elke feitelijke bewering nagelopen tegen de crawl
van de huidige site (`/tmp`-onafhankelijk vastgelegd in `discovery/crawl`).
Deze stonden nergens in de bron en zijn daarom van de site gehaald. Ze
kunnen er meteen weer bij zodra de opdrachtgever ze bevestigt. (Het
btw-nummer stond er eerst ook bij: dat blijkt wél op de huidige site te
staan, als "VAT 0095.50.458.B01", en is teruggezet in de standaardnotatie
NL009550458B01.)

| Gegeven | Status | Waar het weer terugkomt |
| --- | --- | --- |
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
