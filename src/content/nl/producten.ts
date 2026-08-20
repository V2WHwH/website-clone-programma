import type { Product } from "../types";

// Alle productinformatie komt van de huidige site (crawl augustus 2026),
// ontdubbeld en herschreven. Er zijn geen specificaties toegevoegd die niet
// in de bron staan; prijzen lopen bewust via de prijslijst.

export const PRODUCTEN: Product[] = [
  // ---------------------------------------------------------- projectie
  {
    slug: "interactieve-vloer",
    naam: "Interactieve vloer",
    categorie: "interactieve-projectie",
    titel: "Interactieve vloer kopen of huren | Vision2Watch",
    description:
      "Een vloerprojectie die reageert op elke stap: rimpelend water, spellen of uw huisstijl. Te koop en te huur, met eigen iFloor-software. Bekijk de mogelijkheden.",
    intro:
      "De interactieve vloer projecteert beelden die direct reageren op de bewegingen van voorbijgangers: rimpelend water onder de voeten, een logo dat meespeelt met elke stap of een compleet voetbalspel. Infraroodcamera's registreren beweging en onze eigen iFloor-software zet die om in vloeiende visuele effecten.",
    waarom:
      "Op een beurs of in een publieke ruimte heeft u enkele seconden om aandacht te vangen. Een vloer die reageert op wie eroverheen loopt, stopt bezoekers letterlijk in hun loop en maakt van passanten deelnemers. Daarmee wordt de vloer een podium voor uw boodschap in plaats van dode ruimte.",
    beeld: { src: "/media/euroveiling-bloemenvloer.webp", alt: "Interactieve bloemenvloer van Vision2Watch op het jubileum van Euroveiling" },
    video: {
      src: "/media/video/dreamhack-interactieve-vloer.mp4",
      poster: "/media/video/dreamhack-interactieve-vloer-poster.webp",
      label: "Interactieve vloer voor Werken bij Defensie op DreamHack, Ahoy Rotterdam",
    },
    voordelen: [
      { kop: "Volledig in uw huisstijl", tekst: "Kleuren, stijl, logo's en thema's: elke projectie wordt door onze studio op maat gemaakt, van subtiele merkaccenten tot een compleet spel." },
      { kop: "Eigen software", tekst: "Vision2Watch is een van de weinige partijen in Europa met zelfontwikkelde interactieve software. Aanpassingen en nieuwe content regelen we daardoor snel en in eigen huis." },
      { kop: "Vast of mobiel", tekst: "Als vaste installatie via het plafond, of als draagbaar iFloor-systeem dat in korte tijd staat, ook bij beperkte ruimte en hoogte." },
      { kop: "Herbruikbaar", tekst: "Bij aankoop zet u het systeem zonder extra kosten steeds opnieuw in, met telkens andere content." },
    ],
    toepassingen: ["Beurzen en events", "Showrooms", "Musea en dierenparken", "Onderwijs", "Winkels", "Hotels en horeca"],
    technisch: [
      { kop: "Detectie", tekst: "Infraroodcamera's registreren beweging nauwkeurig; de gevoeligheid is instelbaar op de lichtintensiteit van de omgeving." },
      { kop: "Projectie", tekst: "Projectoren worden via het plafond of vanaf de zijkant geplaatst en blijven zo buiten beeld. Projectie op gebogen oppervlakken is mogelijk." },
      { kop: "Mobiele uitvoering", tekst: "Samen met Epson ontwikkelden we een mobiele iFloor met compacte behuizing en een groot projectievlak, ideaal voor wisselende locaties." },
      { kop: "Content", tekst: "Maatwerkanimaties en spellen door ons eigen creatieve team, aan te passen per campagne of seizoen." },
    ],
    levering:
      "De interactieve vloer is te koop en te huur. Wij adviseren over de juiste opstelling, verzorgen de content, installeren op locatie en blijven beschikbaar voor service, van preventief onderhoud tot een volledige SLA.",
    galerij: [
      { src: "/media/dreamhack-vloer-breed.webp", alt: "Interactieve gamevloer op DreamHack voor het Ministerie van Defensie" },
      { src: "/media/vloer-strand.webp", alt: "Interactieve strandprojectie op de vloer" },
      { src: "/media/mm-vloer-snoep.webp", alt: "Interactieve vloerprojectie met bewegende snoepjes in een winkel" },
      { src: "/media/alpro-stand-vloer.webp", alt: "Interactieve vloerprojectie in Alpro-huisstijl" },
      { src: "/media/ouwehands-stenenvloer.webp", alt: "Interactieve waterwereldvloer bij Ouwehands Dierenpark" },
    ],
    faq: [
      {
        vraag: "Hoe werkt een interactieve vloer?",
        antwoord:
          "Een projector werpt beeld op de vloer terwijl een infraroodcamera beweging registreert. Onze software vertaalt elke stap direct naar een reactie in de projectie, bijvoorbeeld water dat rimpelt of objecten die wegschuiven.",
      },
      {
        vraag: "Kan de vloer in onze eigen huisstijl?",
        antwoord:
          "Ja. Alle content wordt door onze eigen studio gemaakt: kleuren, logo's, thema's en zelfs complete spellen worden afgestemd op uw merk of campagne.",
      },
      {
        vraag: "Werkt de vloer ook in een lichte ruimte?",
        antwoord:
          "De gevoeligheid van de infraroodcamera's is instelbaar op de lichtintensiteit van de omgeving. Bij de intake kijken we naar uw locatie en adviseren we de juiste opstelling.",
      },
      {
        vraag: "Is de interactieve vloer te huren voor één beurs of event?",
        antwoord:
          "Ja, de vloer is zowel te huur als te koop. Voor eenmalige events is er het mobiele iFloor-systeem dat snel staat; bij aankoop zet u het systeem onbeperkt opnieuw in.",
      },
    ],
    projecten: ["werken-bij-defensie", "euroveiling", "ouwehands-dierenpark", "alpro-interactieve-vloer", "rtl", "pierson-college"],
    verwant: ["interactieve-muur", "interactieve-tafel", "sketchwall"],
  },
  {
    slug: "interactieve-muur",
    naam: "Interactieve muur",
    categorie: "interactieve-projectie",
    titel: "Interactieve muur voor events en ruimtes | Vision2Watch",
    description:
      "Breng een statische muur tot leven: projectie die reageert op beweging, volledig in uw huisstijl. Te koop en te huur voor beurzen, showrooms en publieke ruimtes.",
    intro:
      "De interactieve muur maakt van een statische wand een levend oppervlak. Sensoren signaleren de bewegingen van passanten en de projectie reageert daar direct op met visuele effecten, van subtiele animaties tot complete spellen.",
    waarom:
      "Muren zijn vaak de grootste onbenutte vlakken van een ruimte. Door ze interactief te maken verandert een gang, stand of showroom in een ervaring die bezoekers vasthoudt en uw merk letterlijk groot maakt.",
    beeld: { src: "/media/muurprojectie-groen.webp", alt: "Interactieve muurprojectie die reageert op een passerende bezoeker" },
    voordelen: [
      { kop: "Entertainment én marketing", tekst: "Een krachtige combinatie: bezoekers vermaken zich terwijl uw merk en boodschap het beeld dragen." },
      { kop: "Content op maat", tekst: "Dankzij zelfontwikkelde software passen we de content volledig aan uw huisstijl aan, van logo's tot thematische werelden." },
      { kop: "Eenvoudig in beheer", tekst: "De installatie is eenvoudig, vraagt weinig onderhoud en is door de klant zelf te bedienen." },
      { kop: "Koop of huur", tekst: "Eenmalig inzetten op een event of vast onderdeel van uw ruimte: beide kan, en bij aankoop is het systeem herbruikbaar zonder extra kosten." },
    ],
    toepassingen: ["Beurzen en events", "Showrooms", "Musea", "Kinderomgevingen", "Winkels", "Horeca"],
    technisch: [
      { kop: "Detectie", tekst: "Bewegingssensoren en infraroodcamera's registreren passanten; de gevoeligheid is instelbaar op de omgeving." },
      { kop: "Schaalbaar", tekst: "Van één wand tot meerdere gekoppelde vlakken; met edge-blending sluiten meerdere projectoren naadloos op elkaar aan." },
      { kop: "Content", tekst: "Animaties, spellen en informatieve content uit onze eigen studio, eenvoudig te wisselen per campagne." },
    ],
    levering:
      "Te koop en te huur, inclusief advies over de beste wand en opstelling, contentproductie, installatie en service tot en met een SLA.",
    galerij: [
      { src: "/media/muurprojectie-bakkerij.webp", alt: "Muurprojectie met dagverse boodschap in een bakkerscafé" },
      { src: "/media/sketchwall-aquariumwand.webp", alt: "Geprojecteerde aquariumwand" },
    ],
    faq: [
      {
        vraag: "Wat is het verschil met een videowand?",
        antwoord:
          "Een videowand toont beeld; een interactieve muur reageert op de mensen ervoor. Bewegingen van passanten sturen de projectie live aan, waardoor bezoekers zelf onderdeel van het beeld worden.",
      },
      {
        vraag: "Kan de muur ook tijdelijk, bijvoorbeeld op een beurs?",
        antwoord:
          "Ja. De interactieve muur is te huur per event en wordt door ons opgebouwd en afgesteld. Voor permanente opstellingen leveren en installeren we een vaste configuratie.",
      },
      {
        vraag: "Welke content is mogelijk?",
        antwoord:
          "Vrijwel alles: merkanimaties, spellen, seizoensthema's of informatieve lagen. Onze studio ontwikkelt de content en kan die per campagne aanpassen.",
      },
    ],
    projecten: ["coffeeshop-marbella", "castello", "starline", "escher-museum"],
    verwant: ["interactieve-vloer", "sketchwall", "gebouw-projectie"],
  },
  {
    slug: "interactieve-tafel",
    naam: "Interactieve tafel & bar",
    kaartLabel: "Interactieve tafel",
    categorie: "interactieve-projectie",
    titel: "Interactieve tafel en bar | Vision2Watch",
    description:
      "Elk oppervlak wordt een dynamisch communicatiemiddel: tafels en bars die reageren op aanraking en beweging. Ideaal voor showrooms, beurzen en horeca.",
    intro:
      "De interactieve tafel of bar verandert elk oppervlak in een dynamisch communicatiemiddel. Het blad reageert op aanraking en beweging: bezoekers bladeren door content, spelen een spel of zien productinformatie verschijnen precies waar ze die verwachten.",
    waarom:
      "Aan een tafel komen mensen vanzelf samen. Door dat moment interactief te maken, presenteert u producten en verhalen op het moment dat de aandacht er al is, in een showroom, op een stand of aan de bar.",
    beeld: { src: "/media/interactieve-tafel-kaart.webp", alt: "Interactieve overzichtstafel waar bezoekers samen content bedienen" },
    voordelen: [
      { kop: "Fysiek en digitaal gecombineerd", tekst: "Echte producten op het blad en digitale content eromheen versterken elkaar, zoals bij de interactieve bar voor Clinique waar het oppakken van een flesje de projectie startte." },
      { kop: "Elk oppervlak", tekst: "Van ronde tafel tot lange bar; er kan zelfs op gebogen oppervlakken geprojecteerd worden." },
      { kop: "Content in uw stijl", tekst: "Menu's, productinfo, spellen of sfeeranimaties: onze studio maakt de content op maat en eenvoudig bedienbaar." },
    ],
    toepassingen: ["Showrooms", "Beurzen en events", "Restaurants en clubs", "Productlanceringen", "Ontvangstruimtes"],
    technisch: [
      { kop: "Detectie", tekst: "Sensoren en infraroodcamera's registreren aanraking en beweging; de gevoeligheid is aan te passen aan het omgevingslicht." },
      { kop: "Objectinteractie", tekst: "Fysieke producten op het blad kunnen de content aansturen: oppakken of neerzetten start de bijbehorende projectie." },
      { kop: "Meerdere projectoren", tekst: "Voor grote bladen combineren we projectoren met edge-blending tot één naadloos beeld." },
    ],
    levering:
      "Te koop en te huur, van eenmalige activatie tot vaste installatie. Vision2Watch verzorgt concept, content, installatie en service.",
    galerij: [
      { src: "/media/clinique-interactieve-bar.webp", alt: "Interactieve bar in Clinique-stijl met projectie rond de producten" },
      { src: "/media/interactieve-tafel-vissen.webp", alt: "Grote ronde interactieve tafel met geprojecteerde gerechten" },
      { src: "/media/interactieve-tafel-overleg.webp", alt: "Interactieve tafel tijdens een presentatie" },
    ],
    faq: [
      {
        vraag: "Reageert de tafel op aanraking of ook op objecten?",
        antwoord:
          "Beide is mogelijk. Naast aanraking en beweging kan de tafel reageren op fysieke producten: bij de interactieve bar voor Clinique verscheen productinformatie zodra iemand een flesje oppakte.",
      },
      {
        vraag: "Is een interactieve bar geschikt voor horeca?",
        antwoord:
          "Ja, juist daar. Een bar of tafel met interactieve projectie informeert en vermaakt gasten, bijvoorbeeld met een interactieve menukaart of sfeeranimaties die bij de avond passen.",
      },
      {
        vraag: "Kan ik de tafel huren voor een productlancering?",
        antwoord:
          "Ja. We bouwen de opstelling op locatie op, richten de content in op uw campagne en breken na afloop weer af. Kopen kan uiteraard ook.",
      },
    ],
    projecten: ["clinique", "sea-life"],
    verwant: ["virtual-chef", "interactieve-vloer", "touchscreens"],
  },
  {
    slug: "sketchwall",
    naam: "Sketchwall",
    categorie: "interactieve-projectie",
    titel: "Sketchwall: tekeningen komen tot leven | Vision2Watch",
    description:
      "Kinderen kleuren een tekening, scannen hem in en zien hun creatie levensgroot rondzwemmen op de muur. Een magische interactieve ervaring voor attracties en musea.",
    intro:
      "Met de Sketchwall komen zelfgemaakte tekeningen tot leven. Bezoekers kleuren een kleurplaat, scannen die in en zien hun creatie direct levensgroot op de muur verschijnen, als vis in een aquarium of auto in een stad. Via een infraroodcamera worden de figuren ook nog interactief: aanraken en ze reageren.",
    waarom:
      "Niets betrekt kinderen (en hun ouders) zo sterk als iets dat ze zelf hebben gemaakt. De Sketchwall verandert wachten en kijken in meedoen, en geeft locaties een attractie waar bezoekers over blijven praten.",
    beeld: { src: "/media/sketchwall-kinderen-aquarium.webp", alt: "Kinderen bekijken hun eigen getekende vissen op de Sketchwall bij Sea Life" },
    voordelen: [
      { kop: "Eigen creatie centraal", tekst: "Elke bezoeker ziet zijn eigen tekening tot leven komen; geen twee bezoeken zijn hetzelfde." },
      { kop: "Interactief", tekst: "Figuren reageren op aanraking: vissen schrikken, auto's toeteren. De infraroodcamera maakt de wand zelf een speelvlak." },
      { kop: "Elk thema", tekst: "Aquarium, stad, ruimte of uw eigen merkwereld: kleurplaten en decor worden op maat ontworpen." },
    ],
    toepassingen: ["Attracties en dierenparken", "Musea", "Kinderafdelingen", "Events", "Winkelcentra"],
    technisch: [
      { kop: "Scanproces", tekst: "Kleurplaten worden ingescand en verschijnen binnen enkele ogenblikken geanimeerd in de projectie." },
      { kop: "Interactie", tekst: "Een infraroodcamera registreert aanrakingen van de wand en laat de figuren reageren." },
      { kop: "Contentbeheer", tekst: "Thema's en kleurplaten zijn te wisselen per seizoen of campagne; onze studio levert de animaties." },
    ],
    levering:
      "De Sketchwall leveren we als complete opstelling: scanner, projectie, software en op maat gemaakte kleurplaten. Te koop en te huur, met installatie en service door ons team.",
    galerij: [
      { src: "/media/sketchwall-kinderen.webp", alt: "Kinderen spelen met hun getekende vissen op de interactieve wand" },
      { src: "/media/sketchwall-aquariumwand.webp", alt: "Aquariumprojectie van de Sketchwall" },
    ],
    faq: [
      {
        vraag: "Voor welke leeftijd is de Sketchwall geschikt?",
        antwoord:
          "Het kleuren en scannen is voor alle leeftijden; vooral kinderen in de basisschoolleeftijd blijven lang spelen. Volwassenen doen in de praktijk net zo enthousiast mee.",
      },
      {
        vraag: "Kunnen de kleurplaten in ons eigen thema?",
        antwoord:
          "Ja. Onze studio ontwerpt kleurplaten en decor in elk gewenst thema, van uw merkwereld tot een seizoenscampagne.",
      },
      {
        vraag: "Is de Sketchwall permanent te installeren?",
        antwoord:
          "Ja. Bij Sea Life draait de Sketchwall als vaste attractie naast een permanente interactieve vloer. Tijdelijke huur voor een event kan ook.",
      },
    ],
    projecten: ["sea-life"],
    verwant: ["interactieve-muur", "interactieve-vloer"],
  },
  {
    slug: "virtual-chef",
    naam: "Virtual Chef",
    categorie: "interactieve-projectie",
    titel: "Virtual Chef: tafelprojectie voor restaurants | Vision2Watch",
    description:
      "Een mini-chef bereidt het gerecht op tafel terwijl gasten wachten: 3D-tafelprojectie die van een diner een belevenis maakt. Bekend van concepten als Le Petit Chef.",
    intro:
      "Met de Virtual Chef verschijnt via 3D-mapping een mini-chef op tafel die op speelse wijze het gerecht bereidt. Gasten worden meegenomen in een visueel verhaal terwijl ze op hun eten wachten: verwondering en vermaak aan tafel, bekend van concepten als Le Petit Chef en Dinner in Motion.",
    waarom:
      "Uit eten gaan is beleving. De Virtual Chef maakt van de wachttijd het hoogtepunt van de avond en geeft restaurants een verhaal dat gasten delen, aan tafel en online.",
    beeld: { src: "/media/virtual-chef-tafelrond.webp", alt: "Gedekte tafel met Virtual Chef-projectie rond de borden" },
    voordelen: [
      { kop: "Wachten wordt beleving", tekst: "De mini-chef bereidt gerechten die aansluiten op het menu; het verhaal eindigt precies waar het echte bord verschijnt." },
      { kop: "Geen brillen of schermen", tekst: "De ervaring werkt met projectie op de gedekte tafel zelf, direct en realistisch, zonder AR-brillen." },
      { kop: "De hele ruimte doet mee", tekst: "Aanvullende projecties op muren en tafels stemmen de sfeer van het restaurant af op het thema van de avond." },
    ],
    toepassingen: ["Restaurants", "Hotels", "Private dining en events", "Productpresentaties food"],
    technisch: [
      { kop: "3D-mapping", tekst: "Nauwkeurige projectie sluit aan op de objecten op tafel: borden, bestek en glazen worden onderdeel van de animatie." },
      { kop: "Maatwerkanimaties", tekst: "Bestaande shows of volledig eigen verhalen, afgestemd op menu en huisstijl." },
      { kop: "Sfeerprojectie", tekst: "Optionele muur- en tafelprojecties transformeren de hele zaal per gang of thema." },
    ],
    levering:
      "Vision2Watch levert de complete opstelling met projectie, software en content, inclusief installatie en instructie voor het personeel. Te koop en te huur voor vaste concepten of speciale avonden.",
    faq: [
      {
        vraag: "Werkt de Virtual Chef op onze bestaande tafels?",
        antwoord:
          "In de meeste gevallen wel. De projectie wordt gemapt op de tafelopstelling; bij de intake kijken we naar tafelmaat, kleur en lichtomstandigheden in de zaal.",
      },
      {
        vraag: "Kunnen we een eigen verhaal laten maken?",
        antwoord:
          "Ja. Naast bestaande shows ontwikkelt onze studio animaties op maat, afgestemd op uw menu, huisstijl of het thema van de avond.",
      },
      {
        vraag: "Is dit alleen voor restaurants?",
        antwoord:
          "Nee. De techniek werkt overal waar aan tafel iets te presenteren valt: private dining, hotelarrangementen of productpresentaties in de foodbranche.",
      },
    ],
    projecten: ["clinique"],
    verwant: ["interactieve-tafel", "panoramische-projectie"],
  },

  // ---------------------------------------------------------- holografie
  {
    slug: "hologram-projectie",
    naam: "Hologram-projectie",
    categorie: "holografie",
    titel: "Hologram-projectie op ware grootte | Vision2Watch",
    description:
      "Personen en producten levensgroot als zwevend hologram, gebaseerd op het Pepper's Ghost-principe. Te koop en te huur voor retail, beurzen en podia.",
    intro:
      "Bij hologram-projectie worden personen, producten of objecten op ware grootte geprojecteerd op een speciaal transparant scherm. Door de gebruikte techniek lijkt het beeld vrij in de ruimte te zweven: een opvallend hologram-effect voor retail, architectuur, beurzen en podia.",
    waarom:
      "Een spreker die verschijnt zonder aanwezig te zijn, een product dat zwevend in de ruimte draait: een hologram trekt aandacht op een manier die een gewoon scherm niet kan. In onze showroom staat een holografisch scherm van 9 meter, het langste van Nederland, om het effect zelf te ervaren.",
    beeld: { src: "/media/hologram-groep-podium.webp", alt: "Levensgrote hologram-projectie van personen op een podium" },
    video: {
      src: "/media/video/hologram-displays.mp4",
      poster: "/media/video/hologram-displays-poster.webp",
      label: "Holografische productdisplays in bedrijf",
    },
    voordelen: [
      { kop: "Levensgroot en levensecht", tekst: "Personen en producten verschijnen op ware grootte, met hoge resolutie en een overtuigend zwevend effect." },
      { kop: "Beproefde techniek", tekst: "Gebaseerd op het Pepper's Ghost-principe dat al meer dan 150 jaar in theater en attracties wordt gebruikt, uitgevoerd met stabiele moderne software en hardware." },
      { kop: "Ook interactief", tekst: "Leverbaar met touchbediening, bijvoorbeeld voor 360-gradenpresentaties van producten." },
      { kop: "Koop of huur", tekst: "Voor een eenmalige show of als vaste blikvanger; bij aankoop herbruikbaar zonder extra kosten." },
    ],
    toepassingen: ["Beurzen en congressen", "Retail en etalages", "Podia en theater", "Productlanceringen", "Showrooms"],
    technisch: [
      { kop: "Pepper's Ghost", tekst: "Een transparante folie en verborgen projectoren (vaak onder de vloer) creëren de illusie dat er werkelijk iemand of iets staat." },
      { kop: "Formaten", tekst: "Beschikbaar in diverse afmetingen, van productdisplay tot podiumbreed; met standaard- of maatwerksoftware." },
      { kop: "Installatie", tekst: "Eenvoudig te installeren en onderhoudsarm; wij verzorgen de volledige afstelling op locatie." },
    ],
    levering:
      "Vision2Watch levert hologram-projectie als totaaloplossing: scherm, projectie, software en de holografische content uit eigen studio. Te koop en te huur; de prijs hangt af van formaat en project.",
    galerij: [
      { src: "/media/epson-printer-hologram.webp", alt: "Producthologram van een printer" },
      { src: "/media/hologram-podium-roze.webp", alt: "Hologrampresentatie tijdens een tv-productie" },
    ],
    faq: [
      {
        vraag: "Wat is Pepper's Ghost?",
        antwoord:
          "Een illusietechniek die al meer dan 150 jaar bestaat: via een transparante folie en verborgen projectoren lijkt een persoon of object echt in de ruimte te staan. Dezelfde techniek bracht artiesten als Tupac en Elvis holografisch terug op het podium.",
      },
      {
        vraag: "Kan een spreker live als hologram verschijnen?",
        antwoord:
          "Ja, zowel opgenomen als live weergave van personen op ware grootte is mogelijk. Zo verschijnt een spreker of artiest op locaties waar die fysiek niet aanwezig is.",
      },
      {
        vraag: "Kan ik het effect eerst zien?",
        antwoord:
          "Graag zelfs. In onze showroom staat een 9 meter lang holografisch scherm, het langste van Nederland. Maak een afspraak en ervaar het effect in het echt.",
      },
    ],
    projecten: ["escher-museum"],
    verwant: ["hereweholo", "holografische-molen", "virtual-host"],
  },
  {
    slug: "holografische-molen",
    naam: "Holografische molen",
    categorie: "holografie",
    titel: "Holografische molen: 3D-beelden in de lucht | Vision2Watch",
    description:
      "LED-molens die haarscherpe 3D-beelden in de ruimte laten zweven, zelfs bij daglicht. Koppelbaar tot een holomuur. Te koop en te huur.",
    intro:
      "De holografische molen projecteert haarscherpe 2D- en 3D-beelden die letterlijk in de lucht lijken te hangen, zonder scherm. Dankzij krachtige LED-technologie blijven de beelden helder zichtbaar, zelfs bij daglicht.",
    waarom:
      "Op plekken waar elke vierkante meter telt, zoals een etalage, beurs of winkelvloer, zet een zwevend beeld uw product of logo in de ruimte zonder iets te bouwen. Meerdere molens gekoppeld vormen een holomuur voor grote projecties met maximale impact.",
    beeld: { src: "/media/holografische-molen-schoen.webp", alt: "Holografische molen projecteert een zwevende sportschoen" },
    voordelen: [
      { kop: "Geen scherm nodig", tekst: "Het beeld zweeft vrij in de ruimte en trekt daardoor automatisch de blik." },
      { kop: "Daglichtbestendig", tekst: "Scherpe, heldere projecties door krachtige LED's, ook in een lichte winkel of etalage." },
      { kop: "Uitbreidbaar tot holomuur", tekst: "Meerdere molens worden gekoppeld tot één groot beeld, met minimale zichtbaarheid van de kaders voor een sterker holografisch effect." },
      { kop: "Maten en kleuren", tekst: "Verkrijgbaar in verschillende formaten en uitvoeringen, voor verkoop en verhuur." },
    ],
    toepassingen: ["Etalages", "Beurzen", "Winkels", "Showrooms", "Presentaties"],
    technisch: [
      { kop: "Weergave", tekst: "2D- en 3D-hologrammen met vloeiende, heldere beelden door LED-technologie." },
      { kop: "Content", tekst: "Maatwerkanimaties van uw product of logo door ons eigen creatieve team." },
      { kop: "Koppeling", tekst: "Meerdere molens synchroon geschakeld vormen een holomuur voor grotere projecties." },
    ],
    levering:
      "Te koop en te huur, inclusief content op maat, montage en instructie. Voor campagnes leveren we complete sets met beheer op afstand van de content.",
    faq: [
      {
        vraag: "Is een holografische molen ook overdag goed zichtbaar?",
        antwoord:
          "Ja. De molens gebruiken krachtige LED's waardoor de beelden ook bij sterk daglicht scherp en helder blijven, bijvoorbeeld in een etalage.",
      },
      {
        vraag: "Wat is een holomuur?",
        antwoord:
          "Meerdere gekoppelde holografische molens die samen één groot zwevend beeld vormen. Door de minimale zichtbaarheid van de kaders ontstaat een sterk holografisch effect op groot formaat.",
      },
      {
        vraag: "Kan mijn eigen product als hologram getoond worden?",
        antwoord:
          "Ja. Onze studio maakt een 3D-animatie van uw product of logo, precies afgestemd op de molen en uw campagne.",
      },
    ],
    galerij: [
      { src: "/media/holografische-molen.webp", alt: "Holografische molen met zwevend beeld in een donkere ruimte" },
      { src: "/media/holografische-molen-schoen.webp", alt: "Zwevende productanimatie van een sportschoen boven de molen" },
    ],
    projecten: [],
    verwant: ["hologram-projectie", "hereweholo", "led-displays"],
  },
  {
    slug: "hereweholo",
    naam: "Holobox (HEREweHOLO)",
    kaartLabel: "Holobox",
    categorie: "holografie",
    titel: "Holobox kopen of huren: HEREweHOLO | Vision2Watch",
    description:
      "De holobox van zusterbedrijf HEREweHOLO toont personen en producten als levensgroot hologram in een plug-and-play display. Ook als compacte Holomini.",
    intro:
      "De holobox is een plug-and-play holografisch display waarin personen en producten levensecht lijken te zweven. Het is het paradepaardje van HEREweHOLO, het zusterbedrijf van Vision2Watch dat volledig in holografische oplossingen is gespecialiseerd.",
    waarom:
      "Een holobox combineert de impact van een hologram met het gemak van een kant-en-klaar product: neerzetten, aansluiten en uw presentator, product of boodschap staat er, 24 uur per dag. De compacte Holomini doet hetzelfde op balie- en etalageformaat.",
    beeld: { src: "/media/holobox-buiten.webp", alt: "HEREweHOLO holobox met levensgroot hologram in het veld" },
    voordelen: [
      { kop: "Plug-and-play", tekst: "Complete unit met display, verlichting en geluid; geen bouwwerk op locatie nodig." },
      { kop: "Brandbaar", tekst: "De box wordt uitgevoerd in uw logo en kleuren, zodat het display zelf al uw merk draagt." },
      { kop: "Levensgroot of mini", tekst: "Van levensgrote presentator tot Holomini voor producten op de balie of in de etalage." },
      { kop: "Specialistisch team", tekst: "HEREweHOLO ontwikkelt content, koppelingen en zelfs hologramwanden van meerdere boxen." },
    ],
    toepassingen: ["Beurzen", "Retail", "Ontvangstruimtes", "Events en congressen", "Horeca"],
    technisch: [
      { kop: "Weergave", tekst: "Transparant display met verlichte binnenruimte; fysieke producten kunnen worden gecombineerd met een holografische wereld eromheen." },
      { kop: "Content", tekst: "Opgenomen presentaties, productanimaties of live weergave; contentproductie in eigen huis." },
      { kop: "Koppelbaar", tekst: "Meerdere boxen vormen samen een hologramwand voor grotere opstellingen." },
    ],
    levering:
      "Holoboxen zijn te koop en te huur via Vision2Watch en HEREweHOLO, inclusief content, bezorging en installatie. Kijk voor het volledige holografische assortiment op hereweholo.nl.",
    galerij: [{ src: "/media/holobox-restaurant.webp", alt: "Holobox met virtuele presentator in een restaurant" }],
    faq: [
      {
        vraag: "Wat is het verschil tussen de holobox en hologram-projectie?",
        antwoord:
          "De holobox is een kant-en-klaar, verplaatsbaar display; hologram-projectie is een maatwerkinstallatie met transparant scherm die we op locatie bouwen, tot podiumformaat aan toe.",
      },
      {
        vraag: "Wat is HEREweHOLO?",
        antwoord:
          "HEREweHOLO is het zusterbedrijf van Vision2Watch, volledig gespecialiseerd in holografische oplossingen zoals de holobox, de Holomini en hologramwanden. Beide teams werken nauw samen.",
      },
      {
        vraag: "Kan er een echt product in de holobox?",
        antwoord:
          "Ja. Een fysiek product in de box wordt uitgelicht en aangevuld met een holografische wereld eromheen, bijvoorbeeld zwevende specificaties of animaties.",
      },
    ],
    projecten: [],
    verwant: ["hologram-projectie", "holografische-molen", "virtual-host"],
  },
  {
    slug: "virtual-host",
    naam: "Virtual Host",
    categorie: "holografie",
    titel: "Virtual Host: virtuele gastvrouw of gastheer | Vision2Watch",
    description:
      "Een levensechte geprojecteerde host die passanten automatisch aanspreekt zodra ze naderen. Volledig op maat, 24 uur per dag inzetbaar. Te koop en te huur.",
    intro:
      "De Virtual Host(ess) is een levensechte projectie van een persoon die voorbijgangers direct aanspreekt en informeert zodra ze in de buurt komen. Slimme bewegingssensoren activeren de presentatie automatisch, waardoor uw stand of entree letterlijk tot leven komt.",
    waarom:
      "Een goede host is er altijd, kent het verhaal perfect en wordt nooit moe. De Virtual Host communiceert 24 uur per dag zonder pauze en geeft elke bezoeker dezelfde sterke eerste indruk, op een beurs, in een winkel of bij de receptie.",
    beeld: { src: "/media/virtual-host-lounge.webp", alt: "Virtual host verwelkomt bezoekers in een ontvangstruimte" },
    voordelen: [
      { kop: "Spreekt vanzelf aan", tekst: "Bewegingssensoren starten de presentatie zodra iemand nadert; niemand loopt ongemerkt voorbij." },
      { kop: "Volledig op maat", tekst: "Model, kleding, tekst, toon en animatie worden afgestemd op uw merk en boodschap." },
      { kop: "Elk formaat", tekst: "Levensgroot bij de entree of als miniatuur op de balie, met of zonder touchscreen." },
      { kop: "Altijd inzetbaar", tekst: "24 uur per dag actief; bij aankoop steeds opnieuw te gebruiken met nieuwe content." },
    ],
    toepassingen: ["Beurzen", "Winkels", "Ontvangstruimtes en recepties", "Events", "Publieksinformatie"],
    technisch: [
      { kop: "Detectie", tekst: "Bewegings- en spraaksensoren zorgen dat de host reageert op wie er voor staat." },
      { kop: "Productie", tekst: "Video-opname van een echte presentator gecombineerd met animaties, logo's en unieke visuals." },
      { kop: "AI-integratie", tekst: "Optioneel met dynamische reacties en intelligente interacties voor een gesprek in plaats van een monoloog." },
      { kop: "Varianten", tekst: "Ook leverbaar als Virtual Product Presenter die producten toelicht, zoals ontwikkeld voor Epson." },
    ],
    levering:
      "Van scriptontwikkeling en opname tot installatie op locatie: Vision2Watch levert de complete virtuele host, te koop en te huur.",
    galerij: [
      { src: "/media/virtual-host-buitenunit.webp", alt: "Virtual host in een buitenopstelling met informatiescherm" },
      { src: "/media/virtual-host-silhouet.webp", alt: "Virtual host spreekt passanten aan" },
    ],
    faq: [
      {
        vraag: "Hoe wordt de Virtual Host gemaakt?",
        antwoord:
          "We nemen een echte presentator op video op en combineren die met animaties en uw huisstijl. Het resultaat wordt levensecht geprojecteerd en start automatisch bij detectie van een passant.",
      },
      {
        vraag: "Kan de host vragen beantwoorden?",
        antwoord:
          "Naast vaste presentaties is AI-integratie mogelijk voor dynamische reacties en intelligente interacties, eventueel gecombineerd met een touchscreen voor zelfbediening.",
      },
      {
        vraag: "Welke formaten zijn er?",
        antwoord:
          "Van levensgrote projectie tot compacte miniatuur op de balie of in een holobox; met of zonder touchfunctionaliteit, te koop en te huur.",
      },
    ],
    projecten: [],
    verwant: ["hereweholo", "hologram-projectie", "touchscreens"],
  },

  // ---------------------------------------------------------- schermen
  {
    slug: "touchscreens",
    naam: "Touchscreens",
    categorie: "schermen-en-displays",
    titel: "Touchscreens en touchtafels | Vision2Watch",
    description:
      "Multi-touch schermen, tafels en zuilen in alle formaten, geleverd als totaaloplossing met content en installatie. Voor showrooms, beurzen en publieksruimtes.",
    intro:
      "Vision2Watch levert een breed aanbod interactieve touchscreens: van multi-touch schermen en touchtafels tot informatiezuilen. Altijd als totaaloplossing, met de juiste hardware, op maat gemaakte content en een gebruikerservaring die klopt.",
    waarom:
      "Een touchscreen is pas waardevol met de juiste inhoud. Daarom leveren we niet alleen het scherm, maar ook de interactieve presentaties, catalogi en bediening die bezoekers echt gebruiken, afgestemd op uw merk en doel.",
    beeld: { src: "/media/touchscreen-zuil-beurs.webp", alt: "Touchscreen-informatiezuil op een beurs" },
    voordelen: [
      { kop: "Totaaloplossing", tekst: "Scherm, computer, montage en content uit één hand; direct klaar voor gebruik." },
      { kop: "Alle formaten", tekst: "Van compacte schermen tot grote touchtafels met LCD en geluid, staand, liggend of als zuil." },
      { kop: "Multi-touch", tekst: "Schrijven, tekenen, bladeren en presenteren met vingers of stylus, ook met meerdere gebruikers tegelijk." },
    ],
    toepassingen: ["Showrooms", "Beurzen", "Ontvangstruimtes", "Retail", "Presentaties en educatie"],
    technisch: [
      { kop: "Hardware", tekst: "Touchscreens in diverse afmetingen met geïntegreerde computersystemen, als losse schermen, tafels of zuilen." },
      { kop: "Content", tekst: "Interactieve presentaties van campagnes, brochures en media in gangbare formaten, gebouwd door onze eigen studio." },
      { kop: "Beheer", tekst: "Content is eenvoudig te wisselen; wij ondersteunen bij beheer en updates." },
    ],
    levering:
      "Touchscreens leveren we als koopoplossing, inclusief advies, installatie en content. Voor tijdelijke inzet denken we mee over de best passende oplossing per event.",
    galerij: [
      { src: "/media/touchscreen-kassa-retail.webp", alt: "Touchscreen naast de kassa in een winkel" },
      { src: "/media/beursstand-hostess.webp", alt: "Touchopstelling op een beursstand" },
    ],
    faq: [
      {
        vraag: "Levert Vision2Watch ook de content voor het scherm?",
        antwoord:
          "Ja, juist dat. Onze studio bouwt de interactieve presentaties, productcatalogi en spellen die het scherm de moeite waard maken, volledig in uw huisstijl.",
      },
      {
        vraag: "Welke formaten en uitvoeringen zijn er?",
        antwoord:
          "Van compacte schermen tot grote multi-touch tafels en informatiezuilen, met bediening per vinger of stylus en waar gewenst geluid.",
      },
      {
        vraag: "Zijn touchscreens ook te huren?",
        antwoord:
          "Touchscreens leveren we primair als koopoplossing. Voor eenmalige events adviseren we per situatie de best passende opstelling; neem daarvoor contact op.",
      },
    ],
    projecten: ["starline"],
    verwant: ["interactieve-tafel", "interactieve-etalage", "transparant-scherm"],
  },
  {
    slug: "interactieve-etalage",
    naam: "Interactieve etalage",
    categorie: "schermen-en-displays",
    titel: "Interactieve etalage met touch foil | Vision2Watch",
    description:
      "Maak van uw etalageruit een interactief medium dat 24/7 met passanten communiceert: touch door het glas, bewegingsdetectie en content op maat.",
    intro:
      "De interactieve etalage maakt van een winkelruit een medium dat 24 uur per dag met passanten communiceert. Een vrijwel onzichtbare touch foil aan de binnenzijde van het glas maakt de ruit bedienbaar met de hand: voorbijgangers bladeren door de collectie, zoeken informatie op of spelen met uw merk, ook buiten openingstijden.",
    waarom:
      "Uw etalage is uw best gelegen reclamevlak, maar staat het grootste deel van de dag stil. Door de ruit interactief te maken werkt hij door als de winkel dicht is, en geeft hij passanten een reden om te blijven staan.",
    beeld: { src: "/media/miele-interactief-raam.webp", alt: "Bezoeker bedient een interactief raam met touch door het glas" },
    voordelen: [
      { kop: "24/7 verkoopkanaal", tekst: "De etalage communiceert dag en nacht: collectie, acties en informatie blijven bereikbaar als de deur dicht is." },
      { kop: "Onzichtbare techniek", tekst: "De touch foil is transparant en wordt binnen gemonteerd; buiten zijn geen onderdelen nodig en het glas blijft gewoon glas." },
      { kop: "Trekt passanten", tekst: "Optionele bewegingsdetectie start content zodra iemand langsloopt, van welkomstvideo tot productanimatie." },
    ],
    toepassingen: ["Winkels en flagshipstores", "Makelaars en showrooms", "Leegstaande panden", "Banken en dienstverleners", "Musea"],
    technisch: [
      { kop: "Touch foil", tekst: "Transparante folie met een vrijwel onzichtbaar raster van draden werkt op projected capacitance: aanraking van het glas wordt door de folie gedetecteerd." },
      { kop: "Weergave", tekst: "Achter het glas werkt een projectiescherm, LCD of LED; de juiste keuze hangt af van licht, formaat en gewenst beeld." },
      { kop: "Extra's", tekst: "Uit te breiden met through-glass speakers en bewegingsdetectie die content start zodra iemand passeert." },
    ],
    levering:
      "Vision2Watch levert de interactieve etalage compleet: folie, weergave, content en installatie, afgestemd op uw ruit en locatie. Te koop, met service en contentbeheer als optie.",
    galerij: [
      { src: "/media/timing-etalage-nacht.webp", alt: "Digitale etalage van Timing bij avond" },
      { src: "/media/outlet-etalage-beren.webp", alt: "Interactieve etalages met animaties in Outlet Roermond" },
      { src: "/media/shell-etalage-led.webp", alt: "Informatiescherm achter glas bij Shell Technology Centre" },
      { src: "/media/shell-etalage-dag.webp", alt: "Dezelfde etalage van Shell Technology Centre overdag, met het scherm helder zichtbaar" },
    ],
    faq: [
      {
        vraag: "Werkt touch echt door het glas heen?",
        antwoord:
          "Ja. De transparante touch foil aan de binnenzijde detecteert via projected capacitance de aanraking van de ruit aan de buitenkant, ook met dikker etalageglas.",
      },
      {
        vraag: "Wat gebeurt er als de winkel dicht is?",
        antwoord:
          "Dan werkt de etalage gewoon door: passanten bladeren door de collectie of bekijken informatie, 24 uur per dag. Juist buiten openingstijden bewijst de interactieve etalage zijn waarde.",
      },
      {
        vraag: "Is dit ook interessant voor leegstaande panden?",
        antwoord:
          "Ja. Een interactieve of digitale etalage geeft een leeg pand uitstraling en maakt de ruit verhuurbaar als communicatie- of advertentievlak.",
      },
    ],
    projecten: ["outlet-store-roermond"],
    verwant: ["touchscreens", "transparant-scherm", "led-displays"],
  },
  {
    slug: "transparant-scherm",
    naam: "Transparant scherm",
    categorie: "schermen-en-displays",
    titel: "Transparant scherm voor productpresentatie | Vision2Watch",
    description:
      "Fysiek product en digitale content in één vitrine: transparante LCD-schermen van 10 tot 70 inch, standalone of netwerkgeschakeld, optioneel met touch.",
    intro:
      "Een transparant scherm combineert vier elementen: een behuizing, een transparant LCD-display met de juiste verlichting, uw fysieke product en digitale content. Het product staat uitgelicht ín de vitrine terwijl het scherm er beelden omheen en overheen toont: een unieke interactie tussen echt en digitaal.",
    waarom:
      "Klanten willen het echte product zien, maar het verhaal eromheen heeft beweging nodig. Het transparante scherm vertelt dat verhaal letterlijk om het product heen, zonder dat het product uit beeld verdwijnt.",
    beeld: { src: "/media/transparant-scherm-fles.webp", alt: "Transparant scherm met fysiek product en digitale animatie" },
    voordelen: [
      { kop: "Product blijft de ster", tekst: "Het echte product staat verlicht in de vitrine; transparante en dekkende beelden wisselen elkaar af rond het object." },
      { kop: "Compact tot groot", tekst: "Beschikbaar van 10 tot 70 inch, lichtgewicht en duurzaam uitgevoerd." },
      { kop: "Slim te schakelen", tekst: "Standalone of netwerkgeschakeld, zodat content per locatie of campagne centraal te beheren is." },
      { kop: "Optioneel touch", tekst: "Met touchfunctionaliteit bedienen bezoekers de presentatie zelf." },
    ],
    toepassingen: ["Retail en etalages", "Productlanceringen", "Musea en vitrines", "Showrooms", "Luchthavens en publieksruimtes"],
    technisch: [
      { kop: "Opbouw", tekst: "Behuizing met interne LED-verlichting, transparant LCD-paneel en ruimte voor het fysieke product." },
      { kop: "Formaten", tekst: "Van 10 tot 70 inch; lichtgewicht en duurzaam ontwerp." },
      { kop: "Aansturing", tekst: "Standalone met lokale content of netwerkgeschakeld voor centraal beheer; optioneel met touch." },
    ],
    levering:
      "Leverbaar per stuk of als serie voor meerdere locaties, inclusief contentproductie, installatie en beheer. Te koop en te huur voor campagnes.",
    galerij: [
      { src: "/media/transparant-scherm-nieuws.webp", alt: "Transparant scherm met live informatievoorziening" },
      { src: "/media/transparant-toonbank.webp", alt: "Transparante displaytoonbank met productpresentatie" },
    ],
    faq: [
      {
        vraag: "Hoe werkt een transparant scherm?",
        antwoord:
          "Een transparant LCD-paneel toont content terwijl het fysieke product erachter verlicht in de behuizing staat. Transparante en dekkende beelden wisselen elkaar af, waardoor digitale animatie en echt product samensmelten.",
      },
      {
        vraag: "Kan de content op afstand beheerd worden?",
        antwoord:
          "Ja. Netwerkgeschakelde schermen zijn centraal aan te sturen, handig bij campagnes op meerdere locaties. Standalone gebruik kan uiteraard ook.",
      },
      {
        vraag: "Voor welke producten is dit geschikt?",
        antwoord:
          "Vrijwel elk product dat in een vitrine past, van cosmetica en elektronica tot food. De verlichting en content stemmen we af op het object.",
      },
    ],
    projecten: [],
    verwant: ["interactieve-etalage", "touchscreens", "hereweholo"],
  },
  {
    slug: "led-displays",
    naam: "LED-displays",
    categorie: "schermen-en-displays",
    titel: "LED-displays en videowalls | Vision2Watch",
    description:
      "Van informatiescherm tot enorme videowall: LED-oplossingen voor binnen en buiten, inclusief flexibele en transparante glas-LED voor bijzondere ontwerpen.",
    intro:
      "LED-displays van Vision2Watch brengen beeld naar plekken waar gewone schermen ophouden: van kleine informatieschermen tot enorme videowalls op pleinen en gevels. Met hoogwaardige LED's en stabiele signage-software tonen ze advertenties, live beelden of realtime informatie, dag en nacht.",
    waarom:
      "Buiten en op afstand telt maar één ding: zichtbaarheid. LED levert helderheid en formaat die met projectie of LCD niet haalbaar zijn, en opent met flexibele en transparante varianten ontwerpmogelijkheden die een standaardscherm niet biedt.",
    beeld: { src: "/media/led-wand-kas.webp", alt: "Grote LED-videowall in een bedrijfsruimte" },
    voordelen: [
      { kop: "Elk formaat", tekst: "Van compact informatiescherm tot videowall op gebouwformaat, binnen en buiten." },
      { kop: "Flexibele LED", tekst: "Lichtgewicht panelen voor gebogen ontwerpen die naadloos aansluiten, voor creatieve toepassingen." },
      { kop: "Glas-LED", tekst: "Meer dan 80% transparantie, ideaal voor glazen puien: het beeld is perfect zichtbaar, zelfs in fel zonlicht, terwijl de pui open blijft ogen." },
      { kop: "Slimme aansturing", tekst: "Signage-software voor advertenties, live beelden en realtime informatie, centraal te beheren." },
    ],
    toepassingen: ["Gevels en buitenreclame", "Winkelpuien", "Showrooms", "Events en podia", "Pleinen en publieksruimtes"],
    technisch: [
      { kop: "Uitvoeringen", tekst: "Standaard LED-panelen, flexibele LED voor gebogen vormen en transparante glas-LED voor puien." },
      { kop: "Helderheid", tekst: "Hoogwaardige LED's blijven zichtbaar in fel zonlicht, geschikt voor buitentoepassing." },
      { kop: "Content", tekst: "Aansturing met stabiele digital signage-software voor uiteenlopende content, van campagnes tot realtime informatie." },
    ],
    levering:
      "Wij adviseren over de juiste LED-oplossing per locatie, verzorgen levering en montage en richten de contentaansturing in. Te koop, met serviceafspraken tot en met een SLA.",
    galerij: [{ src: "/media/led-gevel.webp", alt: "LED-scherm aan een gevel" }],
    faq: [
      {
        vraag: "Wat is het verschil tussen LED en een gewoon scherm?",
        antwoord:
          "Een LED-display is opgebouwd uit lichtgevende panelen zonder maatbeperking: elk formaat is mogelijk en de helderheid is geschikt voor direct zonlicht. Daarmee is LED de keuze voor gevels, etalages en grote ruimtes.",
      },
      {
        vraag: "Wat is glas-LED?",
        antwoord:
          "Transparante LED-strips die in of achter glas worden gemonteerd, met meer dan 80% transparantie. De pui blijft open ogen terwijl er beeld op verschijnt, zelfs bij fel zonlicht goed zichtbaar.",
      },
      {
        vraag: "Kan de content op afstand worden bijgewerkt?",
        antwoord:
          "Ja. De signage-software stuurt schermen centraal aan, van één gevel tot meerdere locaties, met planning per dagdeel of campagne.",
      },
    ],
    projecten: ["starline"],
    verwant: ["transparant-scherm", "interactieve-etalage", "mixed-reality"],
  },
  {
    slug: "mixed-reality",
    naam: "Mixed reality & AR",
    kaartLabel: "Mixed reality",
    categorie: "schermen-en-displays",
    titel: "Augmented reality op grote schermen | Vision2Watch",
    description:
      "AR zonder telefoon: onze eigen Augmented engine mengt passanten live met digitale werelden op LED-schermen en videowalls. Van ontwikkeling tot complete installatie.",
    intro:
      "Augmented reality combineert de echte wereld met digitale beelden, video en geluid. Vision2Watch richt zich op AR via grote displays: met onze zelfontwikkelde Augmented engine zien passanten zichzelf live in een andere wereld op een LED-scherm of videowall, zonder telefoon of bril.",
    waarom:
      "De sterkste AR-ervaring is de ervaring waar je toevallig inloopt. Een passant die zichzelf op een groot scherm in een campagnewereld ziet staan, stopt, lacht en deelt dat moment, precies wat een campagne nodig heeft.",
    beeld: { src: "/media/timing-etalage-nacht.webp", alt: "AR-campagneschermen in de etalage van Timing" },
    voordelen: [
      { kop: "Geen app nodig", tekst: "De ervaring speelt zich af op het scherm in de ruimte; iedereen doet direct mee, zonder download." },
      { kop: "Eigen Augmented engine", tekst: "Zelfontwikkelde software, dus snel aan te passen aan campagne, locatie en interactie." },
      { kop: "Van idee tot installatie", tekst: "Alleen de AR-ontwikkeling of de complete oplossing met schermen, installatie en begeleiding: beide kan." },
    ],
    toepassingen: ["Retailcampagnes", "Etalages", "Events", "Kantoren", "Publieksruimtes"],
    technisch: [
      { kop: "Werking", tekst: "Camera's mengen livebeeld met digitale elementen; passanten zien zichzelf in een aangepaste omgeving, bijvoorbeeld op een magazinecover of tussen effecten die op hen reageren." },
      { kop: "Displays", tekst: "Gericht op grote LCD-schermen en LED-videowalls voor maximale impact in de openbare ruimte." },
      { kop: "VR op maat", tekst: "Voor volledig ondergedompelde ervaringen maken we ook op maat gemaakte VR-content met audio en beeld." },
    ],
    levering:
      "Van enkel de AR-ontwikkeling tot en met levering van schermen, installatie en begeleiding op locatie: u bepaalt de scope, wij leveren het geheel werkend op.",
    faq: [
      {
        vraag: "Hebben bezoekers een app of bril nodig?",
        antwoord:
          "Nee. De AR-ervaring draait op schermen in de ruimte; passanten zien zichzelf direct in de campagnewereld. Dat verlaagt de drempel tot nul.",
      },
      {
        vraag: "Wat kan de Augmented engine?",
        antwoord:
          "Onze eigen engine mengt livebeeld met animaties en effecten: gekleurde rook die verdwijnt waar iemand staat, een passant op een magazinecover of een compleet daklicht met live beeld. Maatwerk per campagne.",
      },
      {
        vraag: "Maakt Vision2Watch ook VR?",
        antwoord:
          "Ja, voor toepassingen waar volledige onderdompeling past maken we VR-content op maat, inclusief de benodigde hardware en begeleiding.",
      },
    ],
    projecten: ["outlet-store-roermond"],
    verwant: ["led-displays", "interactieve-etalage", "interactieve-vloer"],
  },

  // ---------------------------------------------------------- mapping
  {
    slug: "gebouw-projectie",
    naam: "Gebouwprojectie",
    categorie: "projectie-en-mapping",
    titel: "Gebouwprojectie en projection mapping | Vision2Watch",
    description:
      "3D-animaties exact gemapt op de architectuur van een gevel: ramen die openbreken, muren die bewegen. Voor events, festivals en publiekstrekkers.",
    intro:
      "Gebouwprojectie (projection mapping) projecteert 3D-animaties op de buitenkant van een gebouw, exact afgestemd op de architectuur. Ramen, pilaren en lijsten worden onderdeel van de animatie, waardoor het gebouw zelf lijkt te bewegen.",
    waarom:
      "Geen billboard haalt het bij een gevel die tot leven komt. Voor festivals, openingen en publieksevents is gebouwprojectie de manier om een locatie zelf tot attractie te maken, zichtbaar van straat tot skyline.",
    beeld: { src: "/media/gebouwprojectie-festival.webp", alt: "Grootschalige gebouwprojectie bij avond" },
    voordelen: [
      { kop: "Architectuur doet mee", tekst: "Door nauwkeurige mapping sluiten animaties perfect aan op ramen en pilaren; objecten lijken uit het gebouw te vliegen." },
      { kop: "Elke schaal", tekst: "Van dierenverblijf tot compleet kantoorpand: de techniek schaalt mee met de locatie." },
      { kop: "Compleet verzorgd", tekst: "Site survey, mapping, content en projectie op locatie: één team voor het hele traject." },
    ],
    toepassingen: ["Festivals en events", "Openingen en jubilea", "Attracties en dierenparken", "Citymarketing", "Productlanceringen"],
    technisch: [
      { kop: "Site survey", tekst: "We beginnen met opmeten en fotograferen van de gevel en bouwen daarvan een exacte digitale 'map' waarop de animatie wordt ontworpen." },
      { kop: "3D-videomapping", tekst: "Animaties spelen met de diepte en vormen van het gebouw; bewegende beelden lijken met de architectuur te interacteren." },
      { kop: "Projectie", tekst: "Krachtige projectoren, waar nodig gecombineerd met edge-blending voor één naadloos beeld over de hele gevel." },
    ],
    levering:
      "Gebouwprojectie is een maatwerkproductie per locatie: van survey en storyboard tot de projectie zelf, geleverd en bediend door ons team.",
    galerij: [
      { src: "/media/dierenpark-gebouwprojectie.webp", alt: "Gebouwprojectie op een dierenverblijf in DierenPark Amersfoort" },
      { src: "/media/buitenprojectie-avond.webp", alt: "Buitenprojectie op groot scherm bij avond" },
    ],
    faq: [
      {
        vraag: "Werkt gebouwprojectie op elk gebouw?",
        antwoord:
          "Vrijwel elk gebouw is geschikt; vorm en kleur van de gevel bepalen de aanpak. We meten de locatie vooraf op en maken de content exact passend op de architectuur.",
      },
      {
        vraag: "Hoe lang duurt de voorbereiding?",
        antwoord:
          "Dat hangt af van formaat en gewenste animatie. Het traject bestaat uit site survey, contentproductie en opbouw; in de intake geven we een concrete planning voor uw locatie.",
      },
      {
        vraag: "Kan het ook binnen?",
        antwoord:
          "Ja. Dezelfde mappingtechniek werkt op binnenwanden en objecten, zoals we bij DierenPark Amersfoort een compleet dierenverblijf tot leven brachten.",
      },
    ],
    projecten: ["dierenpark-amersfoort"],
    verwant: ["panoramische-projectie", "logo-animatie", "interactieve-muur"],
  },
  {
    slug: "panoramische-projectie",
    naam: "Panoramische projectie",
    categorie: "projectie-en-mapping",
    titel: "Panoramische en 360°-projectie | Vision2Watch",
    description:
      "Meeslepende projectie op 2, 3 of alle wanden tegelijk: van museumzaal tot dome-tent. Hardware, software en content als totaaloplossing.",
    intro:
      "Panoramische projectie omringt toeschouwers met beeld: van projectie over twee of drie wanden tot volledige 360-gradenervaringen en dome-tenten waarvan de hele binnenkant beeldvlak wordt. Meerdere projectoren worden met warping- en edge-blendingsoftware samengesmeed tot één naadloos panorama.",
    waarom:
      "Wie volledig door beeld wordt omringd, kan er niet omheen kijken: dat maakt panoramische projectie het sterkste middel voor verhalen die indruk moeten maken, in een museumzaal, op een beurs of in een experience center.",
    beeld: { src: "/media/panorama-kikkerzaal.webp", alt: "Panoramische projectiezaal met natuurbeelden op meerdere wanden" },
    voordelen: [
      { kop: "Maximale onderdompeling", tekst: "Bezoekers staan ín het verhaal in plaats van ertegenover; ideaal voor musea, merken en attracties." },
      { kop: "Schaalbaar concept", tekst: "Ook een mapping op 2 of 3 wanden geeft al een spectaculair effect; volledig 360° of een dome kan wanneer de ruimte erom vraagt." },
      { kop: "Binnen en buiten", tekst: "Toepasbaar in zalen, tenten en tijdelijke opstellingen, voor events én permanente installaties." },
    ],
    toepassingen: ["Musea", "Experience centers", "Beurzen en events", "Recreatie", "Dome-tenten"],
    technisch: [
      { kop: "Multi-projectie", tekst: "Meerdere projectoren gekoppeld met warping en edge-blending vormen samen één naadloos beeld, tot volledige cirkels aan toe." },
      { kop: "Content", tekst: "Panoramische content wordt op maat geproduceerd of aangepast; onze studio bewaakt beeldkwaliteit over het hele projectievlak." },
      { kop: "Configuraties", tekst: "Van hoekopstelling tot 360°-zaal en dome-tenten waarbij de gehele binnenkant als projectievlak dient." },
    ],
    levering:
      "Totaaloplossing met hardware, software en contentcreatie, voor tijdelijke events en vaste installaties. Wij ontwerpen, installeren en kalibreren op locatie.",
    galerij: [
      { src: "/media/marbella-muurprojectie.webp", alt: "Kleurrijke brede muurprojectie" },
      { src: "/media/immersive-kunstzaal.webp", alt: "Immersive projectiezaal met kunstwerken" },
      { src: "/media/panorama-projectie-showroom.webp", alt: "Panoramische projectie over de volle breedte van een showroomwand" },
      { src: "/media/symphony-cirkelvloer.webp", alt: "Circulaire projectieopstelling met vloerprojectie" },
    ],
    faq: [
      {
        vraag: "Moet het altijd volledig 360 graden zijn?",
        antwoord:
          "Nee. Een mapping op twee of drie wanden geeft al een spectaculair effect en past in meer ruimtes. Volledige 360°-opstellingen en domes zetten we in waar maximale onderdompeling gevraagd is.",
      },
      {
        vraag: "Is dit geschikt voor tijdelijke events?",
        antwoord:
          "Ja. Naast vaste installaties bouwen we tijdelijke opstellingen, bijvoorbeeld in dome-tenten op een festival of beurs, inclusief op- en afbouw.",
      },
      {
        vraag: "Wie maakt de content?",
        antwoord:
          "Onze eigen studio produceert of bewerkt de panoramische content en kalibreert die op de opstelling, zodat het beeld over alle wanden naadloos klopt.",
      },
    ],
    projecten: ["escher-museum", "coffeeshop-marbella"],
    verwant: ["gebouw-projectie", "interactieve-muur", "virtual-chef"],
  },
  {
    slug: "logo-animatie",
    naam: "Logo-animatie",
    categorie: "projectie-en-mapping",
    titel: "Logo-animatie: uw merk in beweging | Vision2Watch",
    description:
      "Uw logo als dynamische projectie van licht en kleur, met 3D-effecten als vlammen of sneeuw. Voor kantoren, beursstands en gevels, 24/7 inzetbaar.",
    intro:
      "Met logo-animatie verandert uw statische logo in een bewegend beeld van licht en kleur. Geprojecteerd op een kantoormuur, congresachtergrond of beursstand, met 3D-animaties en effecten zoals vlammen of sneeuw die uw merk letterlijk laten opvallen.",
    waarom:
      "Een logo dat beweegt wordt onthouden. Voor entrees, stands en gevels is logo-animatie de eenvoudigste manier om een ruimte direct van uw merk te voorzien, zonder verbouwing.",
    beeld: { src: "/media/vloer-valentijn.webp", alt: "Merkprojectie met animatie op de vloer" },
    voordelen: [
      { kop: "Direct herkenbaar", tekst: "Uw bestaande logo, tot leven gebracht met beweging, diepte en effecten die bij uw merk passen." },
      { kop: "Overal toepasbaar", tekst: "Muur, vloer, plafond of gevel; binnen en buiten, tijdelijk of permanent." },
      { kop: "Onderhoudsarm", tekst: "Eenvoudige installatie, weinig onderhoud en 24/7 inzetbaar." },
    ],
    toepassingen: ["Kantoren en entrees", "Beursstands", "Congressen", "Retail", "Gevels"],
    technisch: [
      { kop: "3D-projectie", tekst: "Logo's worden in 3D geprojecteerd met dynamische effecten, van subtiel licht tot vlammen of sneeuw." },
      { kop: "Maatwerkcontent", tekst: "Onze studio animeert uw logo passend bij uw huisstijl en de ruimte waar het komt." },
      { kop: "Installatie", tekst: "Compacte projectieopstelling, eenvoudig te installeren en te verplaatsen." },
    ],
    levering:
      "Logo-animatie leveren we als complete opstelling met projector en content, te koop en te huur per event.",
    faq: [
      {
        vraag: "Kan elke huisstijl geanimeerd worden?",
        antwoord:
          "Ja. Onze studio werkt vanuit uw bestaande logo en huisstijl en stemt beweging en effecten daarop af, van ingetogen tot spectaculair.",
      },
      {
        vraag: "Is logo-animatie geschikt voor buiten?",
        antwoord:
          "Ja, met de juiste projector werkt logo-animatie ook op gevels en buitenvlakken, bijvoorbeeld tijdens een event of feestperiode.",
      },
    ],
    projecten: ["kanon"],
    verwant: ["gebouw-projectie", "interactieve-vloer", "led-displays"],
  },
];

export const vindProduct = (slug: string) => PRODUCTEN.find((p) => p.slug === slug);
