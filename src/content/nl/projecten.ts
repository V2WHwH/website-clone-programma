import type { Project } from "../types";

// Alle projectteksten zijn gebaseerd op de bestaande projectpagina's en
// blogposts van vision2watch.nl (crawl augustus 2026). Er zijn geen
// resultaten of cijfers toegevoegd die niet in de bron staan.

export const PROJECTEN: Project[] = [
  {
    slug: "werken-bij-defensie",
    klant: "Ministerie van Defensie",
    titel: "Interactieve vloer op DreamHack",
    description: "Voor de wervingscampagne Werken bij Defensie plaatsten we een interactieve gamevloer op DreamHack in Rotterdam Ahoy.",
    locatie: "Rotterdam Ahoy",
    sector: "beurzen-en-events",
    uitdaging:
      "Op gamefestival DreamHack strijden honderden stands en schermen om de aandacht van een jong publiek. Werken bij Defensie wilde bezoekers niet alleen bereiken, maar echt laten meedoen.",
    oplossing:
      "Vision2Watch plaatste een grote interactieve vloer in campagnestijl midden op het festival. Bezoekers speelden er samen op geprojecteerde spellen die reageerden op elke stap, precies passend bij het game-publiek en de boodschap van de campagne.",
    producten: ["interactieve-vloer"],
    beeld: { src: "/media/dreamhack-vloer-breed.webp", alt: "Interactieve gamevloer voor Werken bij Defensie op DreamHack" },
    video: {
      src: "/media/video/dreamhack-interactieve-vloer.mp4",
      poster: "/media/video/dreamhack-interactieve-vloer-poster.webp",
      label: "De interactieve vloer in actie op DreamHack",
    },
  },
  {
    slug: "euroveiling",
    klant: "Euroveiling",
    titel: "Interactieve bloemenvloer voor 125 jaar Euroveiling",
    description: "Voor het 125-jarig jubileum van Euroveiling installeerden we namens Jada Events een interactieve vloer in bloemenstijl.",
    sector: "beurzen-en-events",
    uitdaging:
      "125 jaar Euroveiling vroeg om een viering die bezoekers zich zouden herinneren, passend bij het product waar alles om draait: bloemen.",
    oplossing:
      "Namens Jada Events installeerde Vision2Watch een interactieve vloer die bezoekers verwelkomde in echte Euroveiling-bloemenstijl: een gang vol bloemen met een vloer die bij elke stap tot bloei kwam.",
    producten: ["interactieve-vloer"],
    beeld: { src: "/media/euroveiling-bloemenvloer.webp", alt: "Interactieve bloemenvloer op het jubileum van Euroveiling" },
    galerij: [{ src: "/media/euroveiling-bloemengang-staand.webp", alt: "Bloemengang met interactieve vloer bij Euroveiling" }],
  },
  {
    slug: "clinique",
    klant: "Clinique",
    titel: "Interactieve bar voor de lancering van het glow serum",
    description: "In opdracht van Bolt Amsterdam bouwden we een interactieve bar die reageerde zodra iemand een flesje serum oppakte.",
    locatie: "Amsterdam",
    sector: "beurzen-en-events",
    uitdaging:
      "Voor de lancering van het nieuwe glow serum wilde Clinique (via Bolt Amsterdam) een presentatie die het product zelf liet spreken.",
    oplossing:
      "Vision2Watch creëerde een interactieve bar volledig in Clinique-stijl. Op de bar stonden vijf flesjes van het nieuwe serum; zodra iemand een flesje oppakte, verscheen op de bar een projectie met informatie over precies dat serum, net lang genoeg om nieuwsgierigheid te wekken en de boodschap over te brengen.",
    producten: ["interactieve-tafel"],
    beeld: { src: "/media/clinique-interactieve-bar.webp", alt: "Interactieve bar in Clinique-stijl met projectie rond de serumflesjes" },
  },
  {
    slug: "ouwehands-dierenpark",
    klant: "Ouwehands Dierenpark",
    titel: "Interactieve waterwereld als vaste attractie",
    description: "Bij Ouwehands Dierenpark draait een permanente interactieve vloer waarop bezoekers over het water lijken te lopen.",
    locatie: "Rhenen",
    sector: "musea-en-attracties",
    oplossing:
      "Ouwehands Dierenpark is een van de vaste partners waar onze interactieve vloeren permanent draaien. In de interactieve waterwereld lijkt het alsof bezoekers echt over het water lopen. Na een grondige update ligt de vloer er weer strak bij en kunnen de projectoren jaren vooruit; ook dat onderhoud hoort bij onze service.",
    producten: ["interactieve-vloer"],
    beeld: { src: "/media/ouwehands-stenenvloer.webp", alt: "Interactieve waterwereldvloer bij Ouwehands Dierenpark" },
  },
  {
    slug: "dierenpark-amersfoort",
    klant: "DierenPark Amersfoort",
    titel: "Gebouwprojectie op het dierenverblijf",
    description: "Een op maat gemaakte gebouwprojectie brengt een dierenverblijf in DierenPark Amersfoort tot leven.",
    locatie: "Amersfoort",
    sector: "musea-en-attracties",
    uitdaging:
      "DierenPark Amersfoort wilde een verblijf laten opvallen met een visuele show die past bij het park en zijn bewoners.",
    oplossing:
      "We begonnen met het nauwkeurig opmeten van het gebouw, zodat de animaties exact aansluiten op de vormen en details van het verblijf. Het resultaat is een opvallende projectieshow die het gebouw laat stralen. Eerder ontwikkelden we voor het park ook een augmented-reality-ervaring rond attractie De Ooievaart.",
    producten: ["gebouw-projectie", "mixed-reality"],
    beeld: { src: "/media/dierenpark-gebouwprojectie.webp", alt: "Gebouwprojectie op een verblijf in DierenPark Amersfoort" },
  },
  {
    slug: "escher-museum",
    klant: "Escher Museum",
    titel: "Interactieve vloer en muur in het museum",
    description: "Voor het Escher Museum in Den Haag realiseerden we een interactieve vloer en muur die het werk van Escher beleefbaar maken.",
    locatie: "Den Haag",
    sector: "musea-en-attracties",
    oplossing:
      "Voor het Escher Museum in Den Haag realiseerde Vision2Watch een interactieve vloer en muur. Bezoekers stappen letterlijk in de wereld van Escher: de projecties reageren op beweging en maken het grafische werk fysiek beleefbaar. Voor het museum werd daarnaast speciale holografische content geproduceerd.",
    producten: ["interactieve-vloer", "interactieve-muur", "hologram-projectie"],
    beeld: { src: "/media/immersive-kunstzaal.webp", alt: "Immersive projectiezaal met grafisch werk" },
  },
  {
    slug: "sea-life",
    klant: "Sea Life",
    titel: "Sketchwall en interactieve vloer",
    description: "Kinderen tekenen hun eigen vis en zien die levensgroot rondzwemmen: de Sketchwall bij Sea Life, naast een permanente interactieve vloer.",
    sector: "musea-en-attracties",
    oplossing:
      "Bij Sea Life installeerden we een Sketchwall waar kinderen hun eigen vis tekenen en inscannen. Daarna verschijnt hun creatie levensgroot op de interactieve muur, zwemmend door het water, en schrikt hij zelfs als je hem aanraakt. Naast de Sketchwall draait bij Sea Life ook een permanente interactieve vloer.",
    producten: ["sketchwall", "interactieve-vloer"],
    beeld: { src: "/media/sketchwall-kinderen-aquarium.webp", alt: "Kinderen bij de Sketchwall van Sea Life" },
    galerij: [{ src: "/media/sketchwall-kinderen.webp", alt: "Getekende vissen zwemmen over de interactieve wand" }],
  },
  {
    slug: "pierson-college",
    klant: "Pierson College",
    titel: "Interactieve vloer in de school",
    description: "Op het Pierson College in Den Bosch stimuleert een interactieve vloer leerlingen om te leren met de nieuwste technologie.",
    locatie: "Den Bosch",
    sector: "onderwijs",
    oplossing:
      "Op het Pierson College installeerden we een dynamische interactieve vloer waar leerlingen leren werken met de nieuwste technologie. De vloer stimuleert interactie en creativiteit en is volledig aanpasbaar aan elke huisstijl of lesinhoud.",
    producten: ["interactieve-vloer"],
    beeld: { src: "/media/pierson-college-vloer.webp", alt: "Interactieve vloer met schoollogo op het Pierson College" },
  },
  {
    slug: "the-vic-leiden",
    klant: "Vic Hotel Leiden",
    titel: "Interactieve zee bij de liften",
    description: "In het Vic Hotel in Leiden verandert een interactieve vloer met zee-animatie het wachten op de lift in een klein moment van beleving.",
    locatie: "Leiden",
    sector: "horeca-en-hotels",
    oplossing:
      "Voor het Vic Hotel in Leiden toverden we het wachten op de lift om tot een unieke ervaring: een interactieve vloer met levensechte zee-animatie geeft gasten het gevoel dat ze met hun voeten in zee staan. Een speelse manier om de wachttijd te vergeten en de gastbeleving een niveau hoger te tillen.",
    producten: ["interactieve-vloer"],
    beeld: { src: "/media/vloer-strand.webp", alt: "Interactieve strandvloer met zee-animatie" },
  },
  {
    slug: "coffeeshop-marbella",
    klant: "Coffeeshop Marbella",
    titel: "Muurprojectie met eigen visuals",
    description: "Een brede muurprojectie met kleurrijke visuals en animaties geeft de zaak van Marbella een eigen sfeer en een betere bezoekerservaring.",
    sector: "horeca-en-hotels",
    oplossing:
      "Voor coffeeshop Marbella maakte Vision2Watch een muurprojectie met kleurrijke visuals en animaties. De projectie geeft de ruimte een eigen gezicht en is eenvoudig te wisselen, een directe upgrade van de bezoekerservaring.",
    producten: ["interactieve-muur", "panoramische-projectie"],
    beeld: { src: "/media/marbella-muurprojectie.webp", alt: "Brede kleurrijke muurprojectie" },
  },
  {
    slug: "mcdonalds",
    klant: "McDonald's",
    titel: "Interactieve vloer voor de playground",
    description: "Een interactieve speelvloer voor de McDonald's playground: bewegen, spelen en verrassen tijdens het bezoek.",
    sector: "horeca-en-hotels",
    oplossing:
      "Voor de McDonald's playground leverde Vision2Watch een interactieve vloer waarop kinderen spelen met projecties die op hun bewegingen reageren, een attractie die het bezoek net wat langer en leuker maakt.",
    producten: ["interactieve-vloer"],
    beeld: { src: "/media/vloerprojectie-grot.webp", alt: "Interactieve vloerprojectie in een speelomgeving" },
  },
  {
    slug: "castello",
    klant: "Castello",
    titel: "Interactieve wand",
    description: "Voor Castello realiseerden we een interactieve wand met projecties in merkstijl.",
    sector: "retail",
    oplossing:
      "Voor Castello bouwde Vision2Watch een interactieve wand waarin schermen en lijsten in de merkomgeving zijn opgenomen; de content wisselt en reageert op de omgeving.",
    producten: ["interactieve-muur"],
    beeld: { src: "/media/castello-projectie-lijsten.webp", alt: "Interactieve wand met ingelijste schermen bij Castello" },
  },
  {
    slug: "outlet-store-roermond",
    klant: "Designer Outlet Roermond",
    titel: "Interactieve vloeren en etalages in het outletcentrum",
    description: "Terugkerende projecten met interactieve vloeren en etalages waarin passanten in astronauten veranderen.",
    locatie: "Roermond",
    sector: "retail",
    oplossing:
      "Voor Outlet Store Roermond, een partner waarvoor we regelmatig terugkerende projecten realiseren, ontwierpen we meerdere interactieve vloeren. Daarnaast creëerden we interactieve etalages waarbij voorbijgangers werden omgetoverd tot astronauten terwijl ze langsliepen, extra belevingselementen die bezoekers vermaken en vasthouden.",
    producten: ["interactieve-vloer", "interactieve-etalage", "mixed-reality"],
    beeld: { src: "/media/outlet-roermond-avondvloer.webp", alt: "Vloerprojectie in de winkelstraat van Designer Outlet Roermond bij avond" },
    galerij: [
      { src: "/media/outlet-etalage-beren.webp", alt: "Interactieve etalages met animaties in Outlet Roermond" },
      { src: "/media/outlet-etalage-bezoekers.webp", alt: "Bezoekers bij de interactieve etalage" },
    ],
  },
  {
    slug: "nike",
    klant: "Nike",
    titel: "Interactieve vloer voor Nike",
    description: "Voor Nike leverde Vision2Watch een interactieve vloer die bezoekers in beweging brengt, afgestemd op de merkbeleving van Nike.",
    sector: "retail",
    oplossing:
      "Voor Nike leverde Vision2Watch een interactieve vloer die bezoekers in beweging brengt, volledig afgestemd op de merkbeleving van Nike.",
    producten: ["interactieve-vloer"],
    beeld: { src: "/media/nike-gebouw.webp", alt: "Nike-locatie met atletiekbaan voor de entree" },
  },
  {
    slug: "adidas",
    klant: "Adidas",
    titel: "Interactieve vloer in Amsterdam",
    description: "Een interactieve vloer voor Adidas in Amsterdam, met content die reageert op elke beweging.",
    locatie: "Amsterdam",
    sector: "retail",
    oplossing:
      "Voor Adidas in Amsterdam installeerden we een interactieve vloer met sportieve content die reageert op de bewegingen van bezoekers.",
    producten: ["interactieve-vloer"],
    beeld: { src: "/media/vloer-sportteam.webp", alt: "Interactieve vloer met sportcontent" },
  },
  {
    slug: "nespresso",
    klant: "Nespresso",
    titel: "Interactieve vloer op maat",
    description: "Voor Nespresso maakte Vision2Watch een interactieve vloer volledig op maat, afgestemd op de stijl en campagne van het merk.",
    sector: "retail",
    oplossing:
      "Voor Nespresso maakte Vision2Watch een interactieve vloer volledig op maat, afgestemd op de stijl en campagne van het merk.",
    producten: ["interactieve-vloer"],
    beeld: { src: "/media/symphony-cirkelvloer.webp", alt: "Interactieve vloerprojectie in een showroomopstelling" },
  },
  {
    slug: "philips",
    klant: "Philips",
    titel: "Productdemonstratie op een interactieve vloer",
    description: "Een interactieve vloer die de functionaliteiten van een Philips-product speels en boeiend liet zien.",
    sector: "showrooms-en-kantoren",
    oplossing:
      "Voor Philips creëerden we een interactieve vloer die op een speelse en boeiende manier de functionaliteiten van het product liet zien: productdemonstratie en beleving in één.",
    producten: ["interactieve-vloer"],
    beeld: { src: "/media/beursstand-donker.webp", alt: "Interactieve vloerprojectie tijdens een presentatie" },
    beeldIllustratief: true,
  },
  {
    slug: "tieleman-keukens",
    klant: "Tieleman Keukens",
    titel: "Interactieve vloer in de keukenshowroom",
    description: "Een interactieve vloer geeft de showroom van Tieleman Keukens in Zeeland een extra dimensie.",
    locatie: "Zeeland",
    sector: "showrooms-en-kantoren",
    oplossing:
      "Voor Tieleman Keukens installeerden we een interactieve vloer in de showroom: een verrassingselement dat bezoekers vasthoudt tijdens hun oriëntatie op een nieuwe keuken.",
    producten: ["interactieve-vloer"],
    beeld: { src: "/media/tieleman-vloer.webp", alt: "Interactieve vloerprojectie in een showroomopstelling" },
  },
  {
    slug: "rtl",
    klant: "RTL",
    titel: "Draagbare iFloor als interactieve entree",
    description: "Met het draagbare iFloor-systeem kreeg een RTL-event een interactieve rode loper, ondanks beperkte ruimte en hoogte.",
    locatie: "Hilversum",
    sector: "beurzen-en-events",
    uitdaging:
      "RTL wilde een interactieve en aantrekkelijke entree voor een evenement, maar de locatie bood beperkte ruimte en minimale hoogte.",
    oplossing:
      "Met ons draagbare iFloor-systeem rolden we letterlijk de perfecte rode loper uit: snel opgebouwd, volledig aanpasbaar aan elke huisstijl en dus naadloos aansluitend bij het event.",
    producten: ["interactieve-vloer"],
    beeld: { src: "/media/vloer-valentijn.webp", alt: "Interactieve vloerprojectie als entree-loper" },
  },
  {
    slug: "starline",
    klant: "Starline",
    titel: "Interactieve vloer en wand op Ebben Inspyrium",
    description: "Voor de beursstand van zwembadfabrikant Starline realiseerden we een interactieve vloer en wand.",
    locatie: "Cuijk",
    sector: "beurzen-en-events",
    oplossing:
      "Voor de stand van Starline op beurs Ebben Inspyrium verzorgden we een interactieve vloer en wand: water dat reageert op elke stap, precies passend bij een zwembadmerk, met de merknaam als blikvanger in de projectie.",
    producten: ["interactieve-vloer", "interactieve-muur", "led-displays"],
    beeld: { src: "/media/starline-zandvloer.webp", alt: "Interactieve zandvloer met Starline-branding" },
    galerij: [{ src: "/media/starline-stand-scherm.webp", alt: "Beursstand van Starline met groot projectiescherm" }],
  },
  {
    slug: "kanon",
    klant: "Kanon Loading Equipment",
    titel: "Interactief looppad op StocExpo",
    description: "Een interactief tussenpad voor Kanon Loading Equipment op StocExpo in Rotterdam Ahoy.",
    locatie: "Rotterdam Ahoy",
    sector: "beurzen-en-events",
    oplossing:
      "Voor Kanon Loading Equipment maakte Vision2Watch een interactief tussenpad op StocExpo in Rotterdam Ahoy: het gangpad zelf werd de blikvanger die bezoekers naar de stand leidde.",
    producten: ["interactieve-vloer", "logo-animatie"],
    beeld: { src: "/media/beursstand-fotolight.webp", alt: "Interactieve presentatieopstelling op een beursstand" },
    beeldIllustratief: true,
  },
  {
    slug: "bloemenbureau-holland",
    klant: "Bloemenbureau Holland",
    titel: "Interactieve vloer op de Trade Fair",
    description: "In samenwerking met Heleen Valstar BV: een interactieve bloemenvloer die beursbezoekers trok én betrok.",
    sector: "beurzen-en-events",
    uitdaging:
      "Bloemenbureau Holland wilde op de Trade Fair een stand die niet alleen aandacht trok, maar bezoekers ook actief betrok.",
    oplossing:
      "In samenwerking met Heleen Valstar BV plaatsten we een interactieve vloerprojectie. We hingen de projectoren in de truss, stelden de vloer zorgvuldig af en testten de interactie tot alles klopte. Het resultaat: een vloer die opviel, interactie uitlokte en bleef verrassen.",
    producten: ["interactieve-vloer"],
    beeld: { src: "/media/bloemenbureau-opbouw.webp", alt: "Opbouw van de interactieve vloer voor Bloemenbureau Holland" },
  },
  {
    slug: "alpro-interactieve-vloer",
    klant: "Alpro",
    titel: "Interactieve vloer in Westfield Mall of the Netherlands",
    description: "Een interactieve vloerprojectie leidde bezoekers speels door de Alpro-stand in Westfield Mall of the Netherlands.",
    locatie: "Leidschendam",
    sector: "retail",
    uitdaging:
      "Alpro zocht een manier om bezoekers op een speelse en unieke manier door hun stand in Westfield Mall of the Netherlands te leiden.",
    oplossing:
      "Onze oplossing: een interactieve vloer in Alpro-stijl die niet alleen de aandacht trok, maar bezoekers ook betrokken hield, merkactivatie waar je doorheen loopt.",
    producten: ["interactieve-vloer"],
    beeld: { src: "/media/alpro-stand-vloer.webp", alt: "Interactieve vloer in Alpro-huisstijl in Westfield Mall of the Netherlands" },
  },
];

export const vindProject = (slug: string) => PROJECTEN.find((p) => p.slug === slug);
