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
          "Een hologram moet je zien om het te geloven. In de showroom van Vision2Watch staat een holografisch scherm van 9 meter, het langste van Nederland, waarop we het effect demonstreren, inclusief speciaal geproduceerde content zoals de video voor het Escher Museum.",
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
];

export const vindArtikel = (slug: string) => ARTIKELEN.find((a) => a.slug === slug);
