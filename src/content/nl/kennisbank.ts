import type { Artikel } from "../types";

// Kennisbankartikelen beantwoorden echte klantvragen. Elke technische uitleg
// komt uit bestaande Vision2watch-productinformatie of algemeen
// controleerbare techniek; prijzen worden bewust niet verzonnen.

export const ARTIKELEN: Artikel[] = [
  {
    slug: "wat-is-een-interactieve-vloer",
    titel: "Wat is een interactieve vloer en hoe werkt hij? | Vision2Watch",
    kop: "Wat is een interactieve vloer en hoe werkt hij?",
    description:
      "Een interactieve vloer projecteert beelden die reageren op beweging. Lees hoe de techniek werkt, wat erbij komt kijken en waar hij het best tot zijn recht komt.",
    gepubliceerd: "2026-08-20",
    gewijzigd: "2026-08-20",
    antwoord:
      "Een interactieve vloer is een projectie op de vloer die direct reageert op beweging: water dat rimpelt onder je voeten, een bal die je kunt trappen of een logo dat meespeelt met elke stap. Een projector levert het beeld, een infraroodcamera registreert beweging en software vertaalt die beweging live naar effecten in de projectie.",
    secties: [
      {
        kop: "De techniek in het kort",
        alineas: [
          "Een interactieve vloer bestaat uit drie onderdelen: een projector, een infraroodcamera en interactieve software. De projector hangt meestal aan het plafond of staat aan de zijkant en projecteert het beeld op de vloer. De infraroodcamera kijkt naar hetzelfde vlak en registreert waar mensen staan en bewegen, onafhankelijk van het geprojecteerde beeld.",
          "De software combineert beide: elke geregistreerde beweging wordt direct vertaald naar een reactie in de projectie. Vision2Watch gebruikt hiervoor zelfontwikkelde iFloor-software, waardoor de gevoeligheid instelbaar is op het omgevingslicht en content snel is aan te passen aan een huisstijl of campagne.",
        ],
      },
      {
        kop: "Vast of mobiel",
        alineas: [
          "Voor permanente opstellingen, bijvoorbeeld in een museum of dierenpark, wordt de projector vast gemonteerd en onopvallend weggewerkt. Voor beurzen en events bestaat er een mobiele variant: samen met Epson ontwikkelde Vision2Watch een draagbaar iFloor-systeem met een compacte behuizing en een groot projectievlak, dat ook bij beperkte ruimte en hoogte snel staat.",
        ],
      },
      {
        kop: "Waar wordt een interactieve vloer gebruikt?",
        alineas: [
          "De vloer komt overal tot zijn recht waar mensen langslopen en mogen blijven hangen: beursstands, showrooms, musea, dierenparken, scholen, hotels en winkelstraten. Voorbeelden uit onze eigen praktijk: een gamevloer voor Werken bij Defensie op DreamHack, een permanente waterwereld bij Ouwehands Dierenpark en een bloemenvloer voor het jubileum van Euroveiling.",
        ],
      },
      {
        kop: "Wat bepaalt de kwaliteit?",
        alineas: [
          "Drie dingen maken het verschil: de nauwkeurigheid van de bewegingsdetectie (en of die is afgesteld op het licht in de ruimte), de kwaliteit van de content en de plaatsing van de projector. Daarom hoort bij een goede interactieve vloer altijd een intake van de locatie, content op maat en een zorgvuldige afstelling op locatie.",
        ],
      },
    ],
    faq: [
      {
        vraag: "Werkt een interactieve vloer op elke ondergrond?",
        antwoord:
          "Op vrijwel elke lichte, matte ondergrond. Bij donkere of sterk spiegelende vloeren wordt een projectiedoek of lichte vloerbedekking gebruikt; dat bekijken we tijdens de intake.",
      },
      {
        vraag: "Hoeveel mensen kunnen tegelijk op de vloer spelen?",
        antwoord:
          "De detectie registreert meerdere personen tegelijk; groepjes spelers zijn juist het normale gebruik, bijvoorbeeld op een beurs of schoolplein.",
      },
    ],
    verwantProduct: ["interactieve-vloer", "interactieve-muur"],
  },
  {
    slug: "interactieve-vloer-kopen-of-huren",
    titel: "Interactieve vloer kopen of huren: hoe kiest u? | Vision2Watch",
    kop: "Interactieve vloer kopen of huren: hoe kiest u?",
    description:
      "Huren is logisch voor één event, kopen loont bij herhaald gebruik. Lees welke afweging past bij uw situatie en wat er bij beide opties is inbegrepen.",
    gepubliceerd: "2026-08-20",
    gewijzigd: "2026-08-20",
    antwoord:
      "Huur een interactieve vloer als u hem eenmalig of incidenteel inzet, bijvoorbeeld voor één beurs: u betaalt per event en opbouw, afstelling en afbouw zijn geregeld. Kopen loont zodra u de vloer vaker gebruikt: bij aankoop zet u het systeem onbeperkt opnieuw in, zonder extra kosten, met telkens nieuwe content.",
    secties: [
      {
        kop: "Wanneer is huren logisch?",
        alineas: [
          "Voor een eenmalige beursdeelname, productlancering of themaweek is huren de eenvoudigste route. Vision2Watch levert de vloer inclusief transport, opbouw, afstelling en afbouw, en maakt de content passend bij uw campagne. Na het event nemen wij alles weer mee.",
        ],
      },
      {
        kop: "Wanneer loont kopen?",
        alineas: [
          "Zet u de vloer meerdere keren per jaar in, of permanent op één locatie, dan is kopen voordeliger. Bij aankoop is het systeem onbeperkt herbruikbaar zonder extra kosten; alleen nieuwe content is een investering wanneer u die wilt. Vaste installaties combineren we met een onderhoudsafspraak, van periodieke controle tot een volledige serviceovereenkomst (SLA).",
        ],
      },
      {
        kop: "Wat kost een interactieve vloer?",
        alineas: [
          "De prijs hangt af van het formaat van het projectievlak, vast of mobiel gebruik, de gewenste content en de huurperiode of koopconfiguratie. Daarom werken we met een actuele prijslijst en een advies op maat: vraag de prijslijst aan en u weet binnen één gesprek waar u aan toe bent.",
        ],
      },
    ],
    faq: [
      {
        vraag: "Is de content bij huur inbegrepen?",
        antwoord:
          "Bij elke huuropdracht hoort content die past bij uw event; volledig maatwerk in uw huisstijl stemmen we vooraf af. Bij aankoop maakt onze studio content die u daarna onbeperkt gebruikt.",
      },
      {
        vraag: "Kan ik eerst een demonstratie krijgen?",
        antwoord:
          "Ja. In onze showroom demonstreren we vrijwel alle oplossingen; maak een afspraak en ervaar de vloer zelf voordat u kiest.",
      },
    ],
    verwantProduct: ["interactieve-vloer"],
  },
  {
    slug: "wat-is-hologram-projectie",
    titel: "Wat is hologram-projectie? Pepper's Ghost uitgelegd | Vision2Watch",
    kop: "Wat is hologram-projectie en hoe werkt Pepper's Ghost?",
    description:
      "Hologram-projectie laat personen en producten levensecht zweven met het Pepper's Ghost-principe. Lees hoe de illusie werkt en wat er in de praktijk mogelijk is.",
    gepubliceerd: "2026-08-20",
    gewijzigd: "2026-08-20",
    antwoord:
      "Hologram-projectie toont personen of objecten als zwevend beeld op ware grootte, via een speciaal transparant scherm en verborgen projectoren. De techniek is gebaseerd op het Pepper's Ghost-principe: een deel van het projectorlicht wordt door een transparante folie opgevangen, waardoor de illusie ontstaat dat er werkelijk iemand of iets staat.",
    secties: [
      {
        kop: "Een illusie van 150 jaar oud, met moderne techniek",
        alineas: [
          "Pepper's Ghost wordt al meer dan 150 jaar gebruikt in theater, films en attracties, van het Spookslot in de Efteling tot Disney's Haunted Mansion. In de muziekindustrie verschenen artiesten als Tupac en Elvis Presley er postuum mee op het podium.",
          "De moderne uitvoering werkt met een strak gespannen transparante folie en krachtige projectoren op een voor het publiek onzichtbare plek, vaak onder de vloer. Het geprojecteerde beeld weerkaatst deels in de folie en lijkt daardoor vrij in de ruimte te staan, levensgroot en met hoge resolutie.",
        ],
      },
      {
        kop: "Wat kan er in de praktijk?",
        alineas: [
          "Personen kunnen opgenomen of live als hologram verschijnen, producten kunnen zwevend draaien en presentaties kunnen interactief worden gemaakt met touchbediening, bijvoorbeeld voor een 360-gradenweergave. Naast maatwerkprojecties bestaan er kant-en-klare varianten zoals de holobox van ons zusterbedrijf HEREweHOLO en holografische molens die beelden met LED in de lucht laten zweven.",
        ],
      },
      {
        kop: "Zelf ervaren",
        alineas: [
          "Een hologram moet je zien om het te geloven. In de showroom van Vision2Watch staat een holografisch scherm van 9 meter breed, waarop we het effect demonstreren, inclusief speciaal geproduceerde content zoals de video voor het Escher Museum.",
        ],
      },
    ],
    faq: [
      {
        vraag: "Is een hologram ook bij daglicht zichtbaar?",
        antwoord:
          "Pepper's Ghost-projecties komen het best tot hun recht in een gecontroleerde lichtomgeving; voor lichte ruimtes en etalages zijn holografische molens met krachtige LED's het geschikte alternatief.",
      },
      {
        vraag: "Kan een spreker live als hologram op een congres verschijnen?",
        antwoord:
          "Ja. Naast opgenomen presentaties is live weergave op ware grootte mogelijk, zodat een spreker aanwezig lijkt zonder te reizen.",
      },
    ],
    verwantProduct: ["hologram-projectie", "hereweholo", "holografische-molen"],
  },
  {
    slug: "hoe-werkt-een-interactieve-etalage",
    titel: "Hoe werkt een interactieve etalage (touch foil)? | Vision2Watch",
    kop: "Hoe werkt een interactieve etalage met touch foil?",
    description:
      "Een transparante folie maakt uw etalageruit bedienbaar met de hand, ook door het glas. Lees hoe projected capacitance werkt en wat een interactieve etalage kan.",
    gepubliceerd: "2026-08-20",
    gewijzigd: "2026-08-20",
    antwoord:
      "Een interactieve etalage gebruikt een transparante touch foil aan de binnenzijde van de ruit. In de folie zit een vrijwel onzichtbaar raster van draden dat via projected capacitance detecteert waar iemand het glas aan de buitenkant aanraakt. Gecombineerd met een scherm of projectie achter het glas wordt de ruit zo een bedienbaar medium dat 24 uur per dag werkt.",
    secties: [
      {
        kop: "De techniek: projected capacitance",
        alineas: [
          "De touch foil is een dunne kunststoffolie met een raster van geleidende draden, aangesloten op een controller. Raakt iemand het glas aan, dan verandert het spanningsveld op die plek en registreert de controller de aanraking, door het glas heen. Dezelfde technologie zit in smartphoneschermen, hier uitgevoerd op etalageformaat.",
          "Achter het glas zorgt een projectiescherm, LCD of LED voor het beeld. De juiste keuze hangt af van lichtinval, formaat en gewenste beeldkwaliteit; opties zoals through-glass speakers en bewegingsdetectie maken de ervaring compleet.",
        ],
      },
      {
        kop: "Wat heb je eraan?",
        alineas: [
          "De etalage verandert van statisch uithangbord in een kanaal dat blijft werken als de winkel dicht is: passanten bladeren door de collectie, bekijken acties of spelen met uw merk. Bewegingsdetectie kan content starten zodra iemand langsloopt, zoals wij deden bij de interactieve etalages voor Outlet Roermond, waar passanten in astronauten veranderden.",
        ],
      },
    ],
    faq: [
      {
        vraag: "Werkt touch foil ook op dik of gelaagd glas?",
        antwoord:
          "Ja, touch foil werkt door gangbaar etalageglas heen. Bij bijzondere beglazing testen we de werking vooraf op locatie.",
      },
      {
        vraag: "Wat is er buiten aan de gevel te zien van de techniek?",
        antwoord:
          "Niets. Alle techniek zit aan de binnenzijde: de folie is transparant en het beeld komt van binnenuit. De gevel blijft onaangetast.",
      },
    ],
    verwantProduct: ["interactieve-etalage", "touchscreens", "transparant-scherm"],
  },
  {
    slug: "opvallen-op-een-beurs",
    titel: "Opvallen op een beurs met interactieve technologie | Vision2Watch",
    kop: "Opvallen op een beurs: zo zet u interactieve technologie in",
    description:
      "Bezoekers lopen in seconden voorbij. Vijf bewezen manieren uit onze eigen beurspraktijk om ze te laten stoppen, meedoen en uw verhaal te onthouden.",
    gepubliceerd: "2026-08-20",
    gewijzigd: "2026-08-20",
    antwoord:
      "Op een beurs stopt een bezoeker alleen voor iets dat beweegt, reageert of uitnodigt om mee te doen. Interactieve technologie doet precies dat: een vloer waarop je speelt, een hologram dat uw product laat zweven of een virtuele host die iedereen aanspreekt maakt van uw stand het gesprek van de beursvloer.",
    secties: [
      {
        kop: "1. Maak het gangpad onderdeel van uw stand",
        alineas: [
          "Een interactieve vloer of een interactief looppad trekt bezoekers letterlijk uw kant op: wie eroverheen loopt, doet al mee. Voor Kanon Loading Equipment bouwden we op StocExpo een interactief tussenpad; voor Werken bij Defensie een gamevloer midden op DreamHack.",
        ],
      },
      {
        kop: "2. Laat het product het werk doen",
        alineas: [
          "Producten die te groot, te klein of te kostbaar zijn voor de stand, presenteert u als hologram: levensgroot, zwevend en van alle kanten te bekijken. Een interactieve bar of tafel koppelt het echte product aan digitale uitleg, zoals bij de lancering van het Clinique glow serum, waar het oppakken van een flesje de projectie startte.",
        ],
      },
      {
        kop: "3. Spreek elke passant aan",
        alineas: [
          "Standbemanning is schaars op piekmomenten. De Virtual Host spreekt passanten automatisch aan zodra ze naderen en vertelt uw kernverhaal, 24 uur per dag hetzelfde en altijd met evenveel energie.",
        ],
      },
      {
        kop: "4. Laat bezoekers iets doen, niet alleen kijken",
        alineas: [
          "Meedoen onthoudt beter dan kijken. Spellen op vloer of wand, een tekening die tot leven komt of een AR-scherm waarin passanten zichzelf terugzien: interactie geeft bezoekers een reden om te blijven, en uw team een natuurlijk gespreksbegin.",
        ],
      },
      {
        kop: "5. Regel de logistiek weg",
        alineas: [
          "Beurstijd is kort: kies systemen die snel staan. Ons draagbare iFloor-systeem staat ook bij beperkte ruimte en hoogte, en huur is inclusief opbouw, afstelling en afbouw, zodat uw team zich met bezoekers bezighoudt in plaats van met techniek.",
        ],
      },
    ],
    faq: [
      {
        vraag: "Wat is de beste plek voor interactieve technologie op een stand?",
        antwoord:
          "Aan de rand, gericht op het gangpad: daar loopt uw publiek. De interactie trekt bezoekers de stand in, waar uw team het gesprek overneemt.",
      },
      {
        vraag: "Hoe ver van tevoren moet ik reserveren voor een beurs?",
        antwoord:
          "Hoe eerder, hoe beter, zeker als er maatwerkcontent bij hoort. Neem contact op met de beursdatum en wij plannen productie en opbouw er naartoe.",
      },
    ],
    verwantProduct: ["interactieve-vloer", "hologram-projectie", "virtual-host"],
  },
  {
    slug: "hologram-ventilator-of-holobox",
    titel: "Hologramventilator of holobox: wat is het verschil? | Vision2Watch",
    kop: "Hologramventilator of holobox: wat kies je wanneer?",
    description:
      "Een 3D-hologramventilator laat een beeld vrij in de lucht zweven; een holobox toont een levensgroot hologram in een kant-en-klaar display. Zo kiest u de juiste vorm.",
    gepubliceerd: "2026-08-27",
    gewijzigd: "2026-08-27",
    antwoord:
      "Een hologramventilator (ook wel holografische molen of hologram fan) is een compact apparaat met snel ronddraaiende LED-bladen dat een beeld vrij in de lucht laat zweven — ideaal voor een etalage, balie of beursstand. Een holobox is een kant-en-klaar holografisch display met behuizing waarin personen en producten levensgroot en levensecht verschijnen. Kort gezegd: de ventilator is de blikvanger voor een zwevend logo of product, de holobox het podium voor een presentator of levensgrote presentatie.",
    secties: [
      {
        kop: "Hoe werkt een hologramventilator?",
        alineas: [
          "Een hologramventilator bestaat uit één of meer bladen met LED's die zo snel ronddraaien dat het oog de bladen niet meer ziet, alleen het beeld dat ze in de lucht 'tekenen'. Het resultaat is een 2D- of 3D-animatie die zonder scherm in de ruimte lijkt te hangen. Bij Vision2Watch heet dit product de holografische molen; krachtige LED's houden het beeld ook bij daglicht scherp, bijvoorbeeld in een etalage.",
          "Meerdere molens zijn synchroon te koppelen tot een holomuur: één groot zwevend beeld, opgebouwd uit gekoppelde molens met minimaal zichtbare kaders. Daarmee groeit de ventilator van baliedisplay naar volwaardige wandvullende projectie.",
        ],
      },
      {
        kop: "Hoe werkt een holobox?",
        alineas: [
          "Een holobox is een plug-and-play display met behuizing waarin een persoon of product levensecht lijkt te zweven — op ware grootte. Neerzetten, aansluiten en de presentatie draait, desgewenst 24 uur per dag. De holobox komt van HEREweHOLO, het zusterbedrijf van Vision2Watch dat volledig in holografische oplossingen is gespecialiseerd; de compacte HEREweHOLO mini doet hetzelfde op balie- en etalageformaat.",
        ],
      },
      {
        kop: "Wanneer kies je wat?",
        alineas: [
          "Kies de hologramventilator als het beeld zelf de blikvanger is: een zwevend product, logo of animatie, op een plek waar elke vierkante meter telt. Kies de holobox als er een persoon of levensgroot product moet presenteren: een virtuele host, een productlancering of een verkoper die er altijd staat.",
          "Beide zijn te koop en te huur, inclusief content uit onze eigen studio. Twijfelt u? Beschrijf de locatie en het doel in een aanvraag, dan adviseren wij welke vorm het meeste oplevert — soms is de combinatie het sterkst: de ventilator trekt passanten, de holobox maakt het verhaal af.",
        ],
      },
    ],
    faq: [
      {
        vraag: "Is een hologramventilator hetzelfde als een holografische molen?",
        antwoord:
          "Ja. Hologramventilator, hologram fan, 3D-hologramventilator en holografische molen zijn namen voor hetzelfde apparaat: ronddraaiende LED-bladen die een zwevend beeld vormen.",
      },
      {
        vraag: "Welke van de twee is beter zichtbaar bij daglicht?",
        antwoord:
          "Beide zijn op daglicht berekend: de molen door krachtige LED's, de holobox door zijn afgeschermde behuizing. In een zonovergoten etalage bekijken we tijdens de intake welke opstelling het scherpste beeld geeft.",
      },
      {
        vraag: "Kan ik mijn eigen product als zwevend hologram laten tonen?",
        antwoord:
          "Ja. Onze studio maakt een 3D-animatie van uw product of logo, afgestemd op het gekozen apparaat en uw campagne.",
      },
    ],
    verwantProduct: ["holografische-molen", "hereweholo", "hereweholo-mini"],
  },
  {
    slug: "wat-kost-een-interactieve-vloer",
    titel: "Wat kost een interactieve vloer? | Vision2Watch",
    kop: "Wat kost een interactieve vloer?",
    description:
      "De prijs van een interactieve vloer hangt af van vast of mobiel gebruik, het projectievlak, de content en koop of huur. Dit bepaalt de prijs — en zo vraagt u hem scherp op.",
    gepubliceerd: "2026-08-27",
    gewijzigd: "2026-08-27",
    antwoord:
      "Er bestaat geen vaste prijs voor een interactieve vloer: de kosten hangen af van vier factoren — vaste installatie of mobiel systeem, de grootte van het projectievlak, de content (standaardspellen of maatwerk in uw huisstijl) en of u koopt of huurt. Vision2Watch levert beide en maakt op basis van locatie en doel een offerte op maat via de prijslijst-aanvraag.",
    secties: [
      {
        kop: "De vier prijsbepalende factoren",
        alineas: [
          "Vast of mobiel: een permanente installatie vraagt montage van projector en camera op locatie, netjes weggewerkt; een mobiel iFloor-systeem staat in korte tijd en verhuist mee van event naar event. Formaat: een groter projectievlak vraagt meer projectievermogen of meerdere projectoren. Content: standaardspellen zijn direct inzetbaar, maatwerk in huisstijl — van subtiele merkaccenten tot een compleet eigen spel — wordt door onze eigen studio gebouwd. Koop of huur: bij aankoop zet u het systeem daarna onbeperkt opnieuw in met telkens andere content; bij huur betaalt u per inzet.",
        ],
      },
      {
        kop: "Kopen of huren: hoe reken je dat door?",
        alineas: [
          "De vuistregel is gebruiksfrequentie. Staat de vloer één beurs per jaar? Dan is huren logisch. Wordt hij een vast onderdeel van uw showroom, school of museum, of gaat hij meerdere keren per jaar mee naar events, dan verdient koop zich terug: de content is per campagne te wisselen zonder nieuwe hardware. Vision2Watch levert bij koop desgewenst een servicecontract tot en met een volledige SLA.",
        ],
      },
      {
        kop: "Zo krijgt u een scherpe offerte",
        alineas: [
          "Hoe concreter de aanvraag, hoe scherper het voorstel. Vermeld: de locatie (binnen/buiten, lichtinval, plafondhoogte), het gewenste vloeroppervlak, de duur (eenmalig event of permanent), en of er maatwerkcontent nodig is. Met die vier gegevens kan ons team direct een passende opstelling en prijs voorstellen.",
        ],
      },
    ],
    faq: [
      {
        vraag: "Waarom staan er geen prijzen op de site?",
        antwoord:
          "Omdat geen twee opstellingen gelijk zijn: formaat, locatie, content en koop of huur maken het verschil. Een prijsopgave op maat is binnen één aanvraag geregeld via de prijslijst-pagina.",
      },
      {
        vraag: "Is huren voor één dag mogelijk?",
        antwoord:
          "Ja, de interactieve vloer is per event te huren. Het mobiele iFloor-systeem staat snel, ook bij beperkte ruimte en hoogte.",
      },
      {
        vraag: "Zit content bij de prijs inbegrepen?",
        antwoord:
          "Er is altijd content bij de levering; de vraag is hoeveel maatwerk u wilt. Van standaardspellen tot een volledig eigen spel in huisstijl: dat bepaalt mede de prijs en bespreken we in de intake.",
      },
    ],
    verwantProduct: ["interactieve-vloer", "interactieve-muur"],
  },
  {
    slug: "beweegvloer-voor-school-en-kinderopvang",
    titel: "Beweegvloer voor school en kinderopvang | Vision2Watch",
    kop: "Een beweegvloer voor school of kinderopvang: waar let je op?",
    description:
      "Een beweegvloer brengt bewegend leren in de klas: een interactieve vloerprojectie waar kinderen samen op spelen en leren. Dit is waar scholen op moeten letten.",
    gepubliceerd: "2026-08-27",
    gewijzigd: "2026-08-27",
    antwoord:
      "Een beweegvloer is een interactieve vloerprojectie waarop kinderen spelend leren: een projector werpt spellen en lesvormen op de vloer, sensoren registreren elke beweging en de projectie reageert direct. Voor scholen en kinderopvang telt vooral dat de vloer veilig is (geen losse onderdelen), dat meerdere kinderen tegelijk kunnen spelen en dat de content aansluit op de les — bij Vision2Watch wordt die content op maat gemaakt, tot en met het eigen schoollogo.",
    secties: [
      {
        kop: "Wat is bewegend leren?",
        alineas: [
          "Bewegend leren combineert leerstof met fysieke beweging: rekenen door naar het goede antwoord te springen, samenwerken in een spel dat op de vloer wordt geprojecteerd. Een beweegvloer maakt dat mogelijk zonder losse materialen: de vloer zelf wordt het speelveld en de inhoud wisselt per les of thema.",
        ],
      },
      {
        kop: "Zo werkt de techniek",
        alineas: [
          "Een projector aan het plafond werpt het speelveld op de vloer; infraroodcamera's registreren beweging en de software vertaalt elke stap of sprong direct naar een reactie in het beeld. De gevoeligheid is instelbaar op het licht in de ruimte, dus de vloer werkt in een aula net zo goed als in een verduisterd speellokaal. Er liggen geen kabels of onderdelen op de vloer: kinderen spelen op de gewone vloer, van onderbouw tot bovenbouw.",
        ],
      },
      {
        kop: "Van aula tot gymzaal",
        alineas: [
          "De vloer projecteert overal: als blikvanger in de aula, als beweegvloer in de gymzaal of als speelplek in de onderbouw. Op het Pierson College in Den Bosch leren leerlingen werken met de nieuwste technologie op een vloer die interactie en creativiteit stimuleert — met content in de eigen schoolstijl.",
        ],
      },
      {
        kop: "Kopen of huren voor een school?",
        alineas: [
          "Beide kan. Voor vast gebruik is koop met een servicecontract gebruikelijk; voor een themaweek, open dag of schoolfeest is huren per periode mogelijk. Bij aankoop wisselt de school de content zelf per seizoen of project, zonder nieuwe hardware.",
        ],
      },
    ],
    faq: [
      {
        vraag: "Is een beweegvloer hetzelfde als een interactieve vloer?",
        antwoord:
          "Ja. Beweegvloer is de term die in onderwijs en kinderopvang gebruikelijk is; technisch is het dezelfde interactieve vloerprojectie, met content die op leren en bewegen is gericht.",
      },
      {
        vraag: "Is de vloer veilig voor jonge kinderen?",
        antwoord:
          "Ja. De projectie komt van boven en er liggen geen losse onderdelen of kabels op de vloer; kinderen spelen er veilig samen op.",
      },
      {
        vraag: "Kan de content aansluiten op ons lesprogramma?",
        antwoord:
          "Ja. Logo, kleuren en eigen spelvormen zijn volledig aanpasbaar aan de school en het lesprogramma; onze studio bouwt de content op maat.",
      },
    ],
    verwantProduct: ["interactieve-vloer", "interactieve-muur", "sketchwall"],
  },
  {
    slug: "wat-is-projection-mapping",
    titel: "Wat is projection mapping (videomapping)? | Vision2Watch",
    kop: "Wat is projection mapping en wat bepaalt de kosten?",
    description:
      "Projection mapping (videomapping) projecteert 3D-animaties exact op de vorm van een gebouw of object. Hoe de techniek werkt en wat een productie bepaalt.",
    gepubliceerd: "2026-08-27",
    gewijzigd: "2026-08-27",
    antwoord:
      "Projection mapping — ook videomapping of 3D-mapping genoemd — is het projecteren van animaties die exact zijn afgestemd op de vorm van een gebouw of object. Ramen, pilaren en lijsten worden onderdeel van de animatie, waardoor de gevel zelf lijkt te bewegen. De kosten hangen vooral af van de grootte van het object, de lengte en complexiteit van de animatie en het benodigde projectievermogen.",
    secties: [
      {
        kop: "Hoe werkt het?",
        alineas: [
          "Eerst wordt het object exact ingemeten of gemodelleerd, zodat de animatie de architectuur volgt: elke raamlijst en pilaar krijgt zijn plek in het ontwerp. Vervolgens maken animatoren de content op dat model. Op locatie wordt de projectie met krachtige projectoren precies op het object uitgelijnd ('gemapt'), zodat beeld en gebouw samenvallen en er geen doek of scherm te zien is.",
          "Een voorbeeld uit onze eigen praktijk: bij Dierenpark Amersfoort loopt het winterpubliek door een kasteelpoort waarop een leeuw over het metselwerk beweegt. De projectie volgt de vorm van het gebouw — het lijkt of de steen zelf leeft.",
        ],
      },
      {
        kop: "Projection mapping, videomapping, gebouwprojectie: is dat hetzelfde?",
        alineas: [
          "Ja. Projection mapping, videomapping, 3D-mapping en gebouwprojectie zijn verschillende namen voor dezelfde techniek. 'Gebouwprojectie' benadrukt de meest voorkomende toepassing, maar mapping werkt ook op auto's, producten, decors en interieurs.",
        ],
      },
      {
        kop: "Wat bepaalt de kosten?",
        alineas: [
          "Drie factoren wegen het zwaarst: het formaat van het object (bepalend voor het aantal projectoren en het benodigde vermogen), de animatie (lengte, complexiteit en of er maatwerk-3D-modellering nodig is) en de duur van de inzet (één avond of een hele festivalperiode, inclusief op- en afbouw). Omdat elke gevel anders is, werkt Vision2Watch met een offerte op maat: beschrijf het object, de aanleiding en de gewenste periode, dan volgt een concreet voorstel.",
        ],
      },
    ],
    faq: [
      {
        vraag: "Kan projection mapping ook binnen?",
        antwoord:
          "Ja. Dezelfde techniek werkt op interieurs, decors, producten en zelfs eettafels; buiten is een donkere omgeving nodig, binnen volstaat gedimd licht.",
      },
      {
        vraag: "Werkt gebouwprojectie ook bij slecht weer?",
        antwoord:
          "Projectoren staan weerbestendig opgesteld of overdekt; bij het locatiebezoek bepalen we de opstelling die bij het seizoen en de locatie past.",
      },
      {
        vraag: "Hoe lang duurt de productie van een mapping?",
        antwoord:
          "Dat hangt af van de complexiteit van de animatie en het object. Neem contact op met de gewenste datum; wij plannen ontwerp, productie en opbouw ernaartoe.",
      },
    ],
    verwantProduct: ["gebouw-projectie", "logo-animatie", "panoramische-projectie"],
  },
];

export const vindArtikel = (slug: string) => ARTIKELEN.find((a) => a.slug === slug);
