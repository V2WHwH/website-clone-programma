// Eén bron van waarheid voor bedrijfsgegevens, kanalen en hoofdnavigatie.
// Alle waarden komen van de huidige site (footer/contactpagina, crawl
// augustus 2026) of uit publieke registers; niets is verzonnen.

export const SITE = {
  naam: "Vision2Watch",
  juridischeNaam: "Vision 2 Watch B.V.",
  domein: "https://www.vision2watch.nl",
  oprichtingsjaar: 2008,
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
  { naam: "Patricia", rol: "Administratie" },
] as const;

// Klantlogo's voor de referentiebalk (allemaal klanten met een project op
// deze site). Bronbestanden hebben een zwarte achtergrond; de weergave
// gebruikt blend-mode zodat alleen het logo zichtbaar is.
export const KLANTLOGOS = [
  { src: "/media/logo/rtl.webp", alt: "RTL" },
  { src: "/media/logo/mcdonalds.webp", alt: "McDonald's" },
  { src: "/media/logo/alpro.webp", alt: "Alpro" },
  { src: "/media/logo/sea-life.webp", alt: "Sea Life" },
  { src: "/media/logo/escher-museum.webp", alt: "Escher Museum" },
  { src: "/media/logo/defensie.webp", alt: "Ministerie van Defensie" },
  { src: "/media/logo/hotel-vic.webp", alt: "Hotel VIC Leiden" },
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
