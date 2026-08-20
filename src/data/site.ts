// Eén bron van waarheid voor bedrijfsgegevens, kanalen en hoofdnavigatie.
// Alle waarden hieronder zijn teruggevonden op de huidige site (crawl
// augustus 2026, zie discovery/crawl); niets is verzonnen.
//
// Bewust NIET opgenomen omdat het nergens in de bron staat: een
// oprichtingsjaar. Zodra de opdrachtgever dat aanlevert kan het hier bij,
// en dan ook in de structured data. Zie docs/ontbrekende-assets.md.
//
// Het btw-nummer staat op de huidige site als "VAT 0095.50.458.B01";
// hieronder in de standaardnotatie (NL + 9 cijfers + B + 2 cijfers).

export const SITE = {
  naam: "Vision2Watch",
  juridischeNaam: "Vision 2 Watch B.V.",
  domein: "https://www.vision2watch.nl",
  kvk: "27130482",
  btw: "NL009550458B01",
  adres: {
    straat: "Tiber 10",
    postcode: "2491 DH",
    plaats: "Den Haag",
    land: "Nederland",
  },
  telefoon: {
    algemeen: { label: "+31 (0)85 007 02 23", tel: "+31850070223" },
    desmond: { label: "+31 (0)6 50 40 95 53", tel: "+31650409553", naam: "Desmond" },
    ronald: { label: "+31 (0)6 53 48 62 82", tel: "+31653486282", naam: "Ronald" },
  },
  email: "info@vision2watch.nl",
  socials: [
    { naam: "Instagram", url: "https://www.instagram.com/vision2watch/" },
    { naam: "TikTok", url: "https://www.tiktok.com/@vision2watch" },
    { naam: "YouTube", url: "https://www.youtube.com/c/vision2watch" },
    { naam: "LinkedIn", url: "https://www.linkedin.com/company/vision2watch" },
  ],
} as const;

// Teamleden zoals vermeld op de huidige over-ons-pagina. Bewust zonder
// portretfoto's: de koppeling foto-naam is uit de bron niet verifieerbaar.
// Namen en functies letterlijk zoals ze op de huidige over-onspagina staan.
// Hier niets aan toevoegen zonder bevestiging van de opdrachtgever: het gaat
// om echte mensen.
export const TEAM = [
  { naam: "Desmond", rol: "Founder & CEO" },
  { naam: "Doris", rol: "Marketing- en projectmanager" },
  { naam: "Ronald", rol: "Accountmanager" },
  { naam: "Aline", rol: "Projectmanager" },
  { naam: "Luuk", rol: "AV-specialist" },
  { naam: "Joël", rol: "Programmeur" },
  { naam: "Mark", rol: "Animator" },
  { naam: "Wim", rol: "Allrounder" },
  { naam: "Flo", rol: "Hostess" },
] as const;

// Klantlogo's voor de referentiebalk (allemaal klanten met een project op
// deze site). Bronbestanden hebben een zwarte achtergrond; de weergave
// gebruikt blend-mode zodat alleen het logo zichtbaar is.
//
// Alleen logo's die als échte huisstijl van de klant herkenbaar zijn staan
// hier. Voor Alpro, Ministerie van Defensie, Vic Hotel Leiden en 24-7 Events
// leverde de oude site geen bruikbaar logo (het waren interface-icoontjes
// of een leeg bestand); die klanten worden nu in tekst genoemd bij hun
// project en komen pas in deze balk zodra de opdrachtgever de logo's
// aanlevert. Zie docs/ontbrekende-assets.md.
export const KLANTLOGOS = [
  { src: "/media/logo/rtl.webp", alt: "RTL" },
  { src: "/media/logo/mcdonalds.webp", alt: "McDonald's" },
  { src: "/media/logo/sea-life.webp", alt: "Sea Life" },
  { src: "/media/logo/escher-museum.webp", alt: "Escher in het Paleis" },
  { src: "/media/logo/bloemenbureau-holland.webp", alt: "Bloemenbureau Holland" },
  { src: "/media/logo/jada-events.webp", alt: "Jada Events" },
] as const;

export type NavItem = { label: string; pad: string; kinderen?: { label: string; pad: string }[] };

export const HOOFDNAV: NavItem[] = [
  { label: "Producten", pad: "/producten" },
  { label: "Toepassingen", pad: "/toepassingen" },
  { label: "Projecten", pad: "/projecten" },
  { label: "Diensten", pad: "/diensten" },
  { label: "Kennisbank", pad: "/kennisbank" },
  { label: "Over ons", pad: "/over-ons" },
];
