// Gedeelde contenttypes. Eén type voor alle talen: zodra een tweede taal
// wordt toegevoegd, dwingt de compiler volledigheid af (zie kennisbank).

export type CategorieSlug = "interactieve-projectie" | "holografie" | "schermen-en-displays" | "projectie-en-mapping";

export type Blok = { kop: string; tekst: string };
export type Faq = { vraag: string; antwoord: string };
export type Beeld = { src: string; alt: string };

export type Product = {
  slug: string;
  naam: string;
  kaartLabel?: string;
  categorie: CategorieSlug;
  titel: string;
  description: string;
  /** in één oogopslag: wat is het en wat doet het */
  intro: string;
  /** welk probleem lost het op / waarom zet je het in */
  waarom: string;
  beeld: Beeld;
  video?: { src: string; poster: string; label: string };
  /** opname op locatie in de verhouding waarin hij is gemaakt (vaak staand) */
  demo?: { src: string; poster: string; label: string; kop: string; tekst: string };
  voordelen: Blok[];
  toepassingen: string[];
  technisch: Blok[];
  /** koop/huur/integratie en wat Vision2watch levert */
  levering: string;
  galerij?: Beeld[];
  faq: Faq[];
  projecten: string[];
  verwant: string[];
};

export type SectorSlug =
  | "beurzen-en-events"
  | "retail"
  | "musea-en-attracties"
  | "horeca-en-hotels"
  | "onderwijs"
  | "showrooms-en-kantoren";

export type Sector = {
  slug: SectorSlug;
  naam: string;
  titel: string;
  description: string;
  intro: string;
  beeld: Beeld;
  /** concrete situaties/behoeften in deze sector, met de passende oplossing */
  situaties: Blok[];
  producten: string[];
  projecten: string[];
  faq: Faq[];
};

export type Project = {
  slug: string;
  klant: string;
  titel: string;
  description: string;
  locatie?: string;
  sector: SectorSlug;
  /** de vraag of aanleiding, alleen als die uit de bron bekend is */
  uitdaging?: string;
  oplossing: string;
  producten: string[];
  beeld: Beeld;
  /** true als het beeld de techniek toont maar niet dit project zelf */
  beeldIllustratief?: boolean;
  galerij?: Beeld[];
  video?: { src: string; poster: string; label: string };
};

export type Artikel = {
  slug: string;
  titel: string;
  kop: string;
  description: string;
  gepubliceerd: string; // ISO-datum
  gewijzigd: string;
  /** het directe antwoord in 2-3 zinnen; dit is wat AI-zoekmachines citeren */
  antwoord: string;
  secties: { kop: string; alineas: string[] }[];
  faq?: Faq[];
  verwantProduct: string[];
};

export type Categorie = {
  slug: CategorieSlug;
  naam: string;
  omschrijving: string;
};
