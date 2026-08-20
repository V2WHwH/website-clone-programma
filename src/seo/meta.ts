// Metadata per statische route. Detailpagina's (producten, projecten,
// sectoren, artikelen) halen hun metadata uit de contentlaag; dit bestand
// dekt de vaste pagina's.Ouderwetse regel: titel ~65 tekens met merknaam
// achteraan, description 120-165 tekens met de belofte van de pagina.

export type Meta = { titel: string; description: string; noindex?: boolean };

export const STATISCHE_META: Record<string, Meta> = {
  "/": {
    titel: "Vision2Watch | Interactieve AV-oplossingen en hologrammen",
    description:
      "Vision2Watch maakt ruimtes interactief: hologrammen, interactieve vloeren, projectie en digitale etalages, van concept en content tot installatie en service.",
  },
  "/producten": {
    titel: "Producten: interactieve projectie en displays | Vision2Watch",
    description:
      "Alle interactieve AV-oplossingen van Vision2Watch: vloeren, muren, tafels, hologrammen, touchscreens, LED en projectie. Te koop en te huur, met content op maat.",
  },
  "/toepassingen": {
    titel: "Toepassingen per sector | Vision2Watch",
    description:
      "Van beursstand tot museum en van winkel tot showroom: bekijk per sector welke interactieve technologie werkt, met echte projecten als bewijs.",
  },
  "/diensten": {
    titel: "Diensten: van concept tot service | Vision2Watch",
    description:
      "Eén partner voor advies, concept, content, installatie en onderhoud. Vision2Watch levert interactieve AV-oplossingen als totaaloplossing, te koop en te huur.",
  },
  "/projecten": {
    titel: "Projecten en cases | Vision2Watch",
    description:
      "Interactieve vloeren, hologrammen en projecties in de praktijk: bekijk projecten voor onder meer Defensie, Escher Museum, Sea Life, RTL en Clinique.",
  },
  "/kennisbank": {
    titel: "Kennisbank: uitleg over interactieve technologie | Vision2Watch",
    description:
      "Heldere antwoorden op echte vragen: hoe werkt een interactieve vloer, wat is hologram-projectie, kopen of huren? De kennisbank van Vision2Watch legt het uit.",
  },
  "/over-ons": {
    titel: "Over Vision2Watch: AV-specialist uit Den Haag",
    description:
      "Vision2Watch maakt ruimtes interactief met eigen software, een eigen studio en een team dat adviseert, bouwt, installeert en onderhoudt.",
  },
  "/contact": {
    titel: "Contact en showroom | Vision2Watch",
    description:
      "Bespreek uw project met Vision2Watch: bel +31 (0)85 007 02 23, mail info@vision2watch.nl of bezoek de showroom in Den Haag met het holografische scherm van 9 meter.",
  },
  "/prijslijst": {
    titel: "Prijslijst aanvragen | Vision2Watch",
    description:
      "Ontvang de actuele prijslijst van Vision2Watch voor interactieve vloeren, hologrammen, touchscreens en meer, voor zowel koop als huur.",
  },
  "/bedankt": {
    titel: "Bedankt voor uw aanvraag | Vision2Watch",
    description: "We hebben uw aanvraag ontvangen en nemen snel contact met u op.",
    noindex: true,
  },
  "/privacy": {
    titel: "Privacyverklaring | Vision2Watch",
    description:
      "Hoe Vision2Watch omgaat met persoonsgegevens op deze website: welke gegevens we verwerken, waarom, en welke rechten u heeft.",
  },
  "/algemene-voorwaarden": {
    titel: "Algemene voorwaarden | Vision2Watch",
    description:
      "De algemene leverings- en betalingsvoorwaarden van Vision 2 Watch B.V. voor levering, verhuur en diensten.",
  },
  "/404": {
    titel: "Pagina niet gevonden | Vision2Watch",
    description: "Deze pagina bestaat niet (meer). Bekijk producten, projecten of neem contact op.",
    noindex: true,
  },
};
