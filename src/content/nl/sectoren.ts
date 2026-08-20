import type { Sector } from "../types";

export const SECTOREN: Sector[] = [
  {
    slug: "beurzen-en-events",
    naam: "Beurzen & events",
    titel: "Interactieve beursstand en eventtechnologie | Vision2Watch",
    description:
      "Val op tussen honderden stands: interactieve vloeren, hologrammen en virtual hosts die bezoekers naar uw stand trekken en vasthouden. Huur per event, inclusief opbouw.",
    intro:
      "Op een beurs heeft u seconden om een passant te laten stoppen. Vision2Watch bouwt de blikvangers die dat doen: vloeren waarop bezoekers spelen, hologrammen die uw product laten zweven en virtuele hosts die iedereen persoonlijk aanspreken. Te huur per event, opgebouwd en afgesteld door ons eigen team.",
    beeld: { src: "/media/dreamhack-vloer-breed.webp", alt: "Interactieve gamevloer op DreamHack in Rotterdam Ahoy" },
    situaties: [
      {
        kop: "Bezoekers laten stoppen",
        tekst: "Een interactieve vloer of muur verandert het gangpad in een spel. Wie eroverheen loopt, is al met uw merk in gesprek, zoals het interactieve looppad dat wij voor Kanon Loading Equipment op StocExpo bouwden.",
      },
      {
        kop: "Uw product als eyecatcher",
        tekst: "Hologram-projectie of een holobox laat uw product levensgroot zweven, ook als het fysiek te groot, te klein of te kostbaar is voor de stand.",
      },
      {
        kop: "Altijd iemand die het verhaal vertelt",
        tekst: "De Virtual Host spreekt elke passant automatisch aan en vertelt uw verhaal, ook op de momenten dat uw standbemanning in gesprek is.",
      },
      {
        kop: "Snel op en af",
        tekst: "Met het draagbare iFloor-systeem staat een interactieve entree ook bij beperkte ruimte en hoogte, zoals bij RTL. Huur is inclusief opbouw, afstelling en afbouw.",
      },
    ],
    producten: ["interactieve-vloer", "interactieve-muur", "hologram-projectie", "virtual-host", "hereweholo", "logo-animatie"],
    projecten: ["werken-bij-defensie", "euroveiling", "starline", "kanon", "bloemenbureau-holland", "rtl", "clinique"],
    faq: [
      {
        vraag: "Kan ik interactieve technologie voor één beurs huren?",
        antwoord:
          "Ja. Vrijwel al onze oplossingen zijn per event te huren, inclusief transport, opbouw, afstelling en afbouw door ons team. Bij aankoop zet u het systeem daarna onbeperkt opnieuw in.",
      },
      {
        vraag: "Hoe snel staat een interactieve vloer op een beurs?",
        antwoord:
          "Het draagbare iFloor-systeem is ontworpen voor snelle opbouw, ook bij beperkte ruimte en hoogte. De exacte planning stemmen we af op de op- en afbouwtijden van de beurs.",
      },
      {
        vraag: "Kan de content per beurs worden aangepast?",
        antwoord:
          "Ja. Onze studio maakt de content per event op maat: uw huisstijl, campagne of zelfs een spel rond uw product.",
      },
    ],
  },
  {
    slug: "retail",
    naam: "Retail",
    titel: "Retailtechnologie: etalages en winkelbeleving | Vision2Watch",
    description:
      "Interactieve etalages, vloerprojecties en transparante schermen die passanten laten stoppen en de winkelervaring versterken, 24 uur per dag.",
    intro:
      "In retail is de etalage uw best gelegen reclamevlak en de winkelvloer uw podium. Vision2Watch maakt beide actief: ruiten die reageren op touch, vloeren die tot leven komen en schermen waarin echt product en digitale content samensmelten.",
    beeld: { src: "/media/outlet-roermond-avondvloer.webp", alt: "Vloerprojectie in de winkelstraat van Designer Outlet Roermond" },
    situaties: [
      {
        kop: "De etalage werkt door na sluitingstijd",
        tekst: "Een interactieve etalage met touch foil laat passanten 24/7 door de collectie bladeren, zoals de digitale etalages die wij voor Timing en Outlet Roermond realiseerden.",
      },
      {
        kop: "Beleving in de winkelstraat",
        tekst: "Vloerprojecties en AR-schermen verrassen passanten, van astronauten in de etalage tot een campagnevloer voor de deur.",
      },
      {
        kop: "Product en verhaal in één vitrine",
        tekst: "Het transparante scherm toont animaties óm uw echte product heen; de holografische molen laat het product zwevend in de ruimte zien.",
      },
      {
        kop: "Merkactivaties die blijven hangen",
        tekst: "Voor lanceringen bouwen we interactieve opstellingen op maat, zoals de bar voor Clinique die reageerde zodra iemand een flesje oppakte.",
      },
    ],
    producten: ["interactieve-etalage", "transparant-scherm", "led-displays", "interactieve-vloer", "holografische-molen", "mixed-reality"],
    projecten: ["outlet-store-roermond", "nike", "adidas", "nespresso", "alpro-interactieve-vloer", "castello"],
    faq: [
      {
        vraag: "Wat levert een interactieve etalage op?",
        antwoord:
          "Uw ruit communiceert ook buiten openingstijden: passanten bekijken de collectie, zoeken informatie op en onthouden de winkel. De etalage wordt van statisch uithangbord een actief kanaal.",
      },
      {
        vraag: "Werkt dit ook in een klein winkelpand?",
        antwoord:
          "Ja. Van een enkele holografische molen of een transparant scherm in de vitrine tot een complete interactieve pui: we stemmen de oplossing af op de maat van het pand.",
      },
    ],
  },
  {
    slug: "musea-en-attracties",
    naam: "Musea & attracties",
    titel: "Interactieve installaties voor musea en attracties | Vision2Watch",
    description:
      "Van interactieve vloeren tot gebouwprojectie: installaties die bezoekers van musea, dierenparken en attracties laten meedoen in plaats van alleen kijken.",
    intro:
      "Musea, dierenparken en attracties draaien om beleving. Vision2Watch bouwt installaties waarmee bezoekers zelf het verhaal in stappen: vloeren en muren die reageren, tekeningen die tot leven komen en gevels die veranderen in een projectieshow.",
    beeld: { src: "/media/sketchwall-kinderen-aquarium.webp", alt: "Kinderen bij de Sketchwall van Sea Life" },
    situaties: [
      {
        kop: "Van kijken naar meedoen",
        tekst: "In het Escher Museum stappen bezoekers via een interactieve vloer en muur letterlijk in het werk; bij Sea Life zwemt je eigen getekende vis door het aquarium.",
      },
      {
        kop: "Attracties zonder wachtrijverveling",
        tekst: "Interactieve projecties maken van wachten spelen, en van een doorloopruimte een attractie op zich, zoals de permanente waterwereld bij Ouwehands Dierenpark.",
      },
      {
        kop: "Het gebouw als verhaal",
        tekst: "Met gebouwprojectie wordt een verblijf of gevel zelf de show, zoals in DierenPark Amersfoort.",
      },
      {
        kop: "Panorama's die omringen",
        tekst: "Panoramische en 360°-projecties dompelen bezoekers volledig onder in een collectie of thema, van museumzaal tot dome-tent.",
      },
    ],
    producten: ["interactieve-vloer", "sketchwall", "gebouw-projectie", "panoramische-projectie", "interactieve-muur", "hologram-projectie"],
    projecten: ["escher-museum", "sea-life", "dierenpark-amersfoort", "ouwehands-dierenpark"],
    faq: [
      {
        vraag: "Zijn de installaties bestand tegen dagelijks publieksgebruik?",
        antwoord:
          "Ja. Onze vloeren en wanden draaien permanent op drukbezochte locaties zoals Ouwehands Dierenpark en Sea Life; met periodiek onderhoud gaan projectoren en systemen jaren mee.",
      },
      {
        vraag: "Kan de content aansluiten op onze collectie of thema?",
        antwoord:
          "Dat is precies ons werk: onze eigen studio ontwikkelt content per collectie, tentoonstelling of seizoen, en kan die later blijven vernieuwen.",
      },
    ],
  },
  {
    slug: "horeca-en-hotels",
    naam: "Horeca & hotels",
    titel: "Beleving voor horeca en hotels | Vision2Watch",
    description:
      "Virtual Chef-tafelprojectie, interactieve vloeren en sfeerprojecties die van een bezoek een verhaal maken, van restaurant tot hotellobby.",
    intro:
      "Gasten onthouden geen vierkante meters maar momenten. Vision2Watch bouwt die momenten met projectie: een mini-chef die het gerecht op tafel bereidt, een lobby waar je met je voeten in zee staat en zalen die per avond van sfeer wisselen.",
    beeld: { src: "/media/virtual-chef-tafelrond.webp", alt: "Virtual Chef-projectie op een gedekte ronde tafel" },
    situaties: [
      {
        kop: "Dineren als voorstelling",
        tekst: "Met de Virtual Chef verschijnt een mini-chef op tafel die het gerecht speels bereidt, het concept achter successen als Le Petit Chef.",
      },
      {
        kop: "De lobby als eerste indruk",
        tekst: "In Hotel VIC in Leiden staat wachten op de lift gelijk aan pootjebaden: een interactieve zee-animatie bij de liften maakt van een verloren moment een glimlach.",
      },
      {
        kop: "Sfeer die meebeweegt",
        tekst: "Muur- en tafelprojecties transformeren de hele zaal per thema of avond, zoals de kleurrijke muurprojectie voor coffeeshop Marbella.",
      },
      {
        kop: "Spelen terwijl het eten komt",
        tekst: "Een interactieve speelvloer, zoals bij de McDonald's playground, houdt jonge gasten vrolijk bezig.",
      },
    ],
    producten: ["virtual-chef", "interactieve-vloer", "interactieve-tafel", "interactieve-muur", "panoramische-projectie"],
    projecten: ["the-vic-leiden", "coffeeshop-marbella", "mcdonalds"],
    faq: [
      {
        vraag: "Is tafelprojectie geschikt voor ons restaurant?",
        antwoord:
          "In de meeste zalen wel; tafelmaat, kleur en omgevingslicht bepalen de aanpak. We komen graag langs of demonstreren het concept in onze showroom.",
      },
      {
        vraag: "Kunnen we de content zelf wisselen per avond of seizoen?",
        antwoord:
          "Ja. De content is eenvoudig te wisselen en onze studio levert nieuwe thema's wanneer u die nodig heeft, van kerstdiner tot zomerterras.",
      },
    ],
  },
  {
    slug: "onderwijs",
    naam: "Onderwijs",
    titel: "Interactieve vloer voor school en onderwijs | Vision2Watch",
    description:
      "Interactieve vloeren die leerlingen letterlijk in beweging brengen: spelen, samenwerken en leren met de nieuwste projectietechnologie.",
    intro:
      "Bewegend leren werkt. Met een interactieve vloer halen scholen technologie in huis waar leerlingen samen op spelen, ontdekken en leren, van spelvormen tot content die aansluit op de les.",
    beeld: { src: "/media/pierson-college-vloer.webp", alt: "Interactieve vloer met schoollogo op het Pierson College" },
    situaties: [
      {
        kop: "Leren door te doen",
        tekst: "Op het Pierson College in Den Bosch leren leerlingen werken met de nieuwste technologie op een vloer die interactie en creativiteit stimuleert.",
      },
      {
        kop: "Van aula tot gymzaal",
        tekst: "De vloer projecteert overal: als blikvanger in de aula, als beweegvloer in de gymzaal of als speelplek in de onderbouw.",
      },
      {
        kop: "Content in schoolstijl",
        tekst: "Logo, kleuren en eigen spelvormen: de content is volledig aanpasbaar aan de school en het lesprogramma.",
      },
    ],
    producten: ["interactieve-vloer", "interactieve-muur", "touchscreens", "sketchwall"],
    projecten: ["pierson-college"],
    faq: [
      {
        vraag: "Is een interactieve vloer geschikt voor jonge kinderen?",
        antwoord:
          "Ja. De vloer reageert op elke beweging en kent geen losse onderdelen; kinderen spelen er veilig samen op, van onderbouw tot bovenbouw.",
      },
      {
        vraag: "Koop of huur voor een school?",
        antwoord:
          "Beide kan. Voor vast gebruik is koop met een servicecontract gebruikelijk; voor een themaweek of open dag is huren per periode mogelijk.",
      },
    ],
  },
  {
    slug: "showrooms-en-kantoren",
    naam: "Showrooms & kantoren",
    titel: "Interactieve showroom- en kantoorbeleving | Vision2Watch",
    description:
      "Maak van uw showroom of kantoor een omgeving die uw verhaal vertelt: interactieve vloeren, tafels, LED en projectie, geïntegreerd en beheerd door één partij.",
    intro:
      "Een showroom moet verkopen als de verkoper even weg is, en een kantoor moet vertellen wie u bent. Vision2Watch integreert projectie, touch en LED tot omgevingen die dat doen: van productdemonstratie op de vloer tot een interactieve overzichtstafel in de ontvangstruimte.",
    beeld: { src: "/media/interactieve-tafel-kaart.webp", alt: "Interactieve overzichtstafel met bezoekers in een showroom" },
    situaties: [
      {
        kop: "Producten die zichzelf uitleggen",
        tekst: "Voor Philips liet een interactieve vloer de functionaliteiten van het product speels zien; een transparant scherm of hologram doet hetzelfde in de vitrine.",
      },
      {
        kop: "De showroom als ervaring",
        tekst: "Bij Tieleman Keukens houdt een interactieve vloer bezoekers vast tijdens de oriëntatie; panoramische projectie zet complete belevingsruimtes neer.",
      },
      {
        kop: "Ontvangst met verhaal",
        tekst: "Een interactieve tafel of virtual host in de entree vertelt bezoekers direct waar uw organisatie voor staat, zoals de AR-installatie waarmee we het kantoor van Timing tot leven brachten.",
      },
    ],
    producten: ["interactieve-vloer", "interactieve-tafel", "touchscreens", "transparant-scherm", "led-displays", "panoramische-projectie"],
    projecten: ["tieleman-keukens", "philips"],
    faq: [
      {
        vraag: "Kan Vision2Watch ook de content blijven beheren?",
        antwoord:
          "Ja. Naast levering en installatie verzorgen we contentupdates en onderhoud, van losse opdrachten tot een doorlopende serviceovereenkomst (SLA).",
      },
      {
        vraag: "Werkt dit ook in een bestaande showroom?",
        antwoord:
          "In vrijwel elke ruimte. Projectoren hangen we onopvallend aan het plafond of zetten we in bestaande interieurdelen; bij de intake bekijken we licht, maten en zichtlijnen.",
      },
    ],
  },
];

export const vindSector = (slug: string) => SECTOREN.find((s) => s.slug === slug);
