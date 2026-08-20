// Bouwt de volledige <head>-inhoud per route: titel, description, canonical,
// Open Graph, twitter:card en JSON-LD. Wordt door de prerender-stap
// aangeroepen; de client werkt bij navigatie alleen document.title bij.
import { SITE } from "../data/site";
import { STATISCHE_META } from "./meta";
import { PRODUCTEN } from "../content/nl/producten";
import { PROJECTEN } from "../content/nl/projecten";
import { SECTOREN } from "../content/nl/sectoren";
import { ARTIKELEN } from "../content/nl/kennisbank";
import {
  artikelSchema,
  faqSchema,
  kruimelSchema,
  lokaalBedrijfSchema,
  organisatieSchema,
  productSchema,
  websiteSchema,
} from "./schema";

const STANDAARD_OG = "/media/euroveiling-bloemenvloer.webp";
const abs = (pad: string) => `${SITE.domein}${pad}`;

type HeadData = {
  titel: string;
  description: string;
  og: string;
  noindex?: boolean;
  schemas: object[];
};

export function headData(pad: string): HeadData {
  const kruimelBasis = [{ naam: "Home", pad: "/" }];

  let m = STATISCHE_META[pad];
  if (m) {
    const schemas: object[] = [];
    if (pad === "/") schemas.push(organisatieSchema(), websiteSchema());
    else schemas.push(kruimelSchema([...kruimelBasis, { naam: m.titel.split("|")[0].split(":")[0].trim(), pad }]));
    if (pad === "/contact") schemas.push(lokaalBedrijfSchema());
    return { titel: m.titel, description: m.description, og: STANDAARD_OG, noindex: m.noindex, schemas };
  }

  const productSlug = pad.match(/^\/producten\/([\w-]+)$/)?.[1];
  if (productSlug) {
    const p = PRODUCTEN.find((x) => x.slug === productSlug);
    if (p)
      return {
        titel: p.titel,
        description: p.description,
        og: p.beeld.src,
        schemas: [
          productSchema(p),
          faqSchema(p.faq),
          kruimelSchema([...kruimelBasis, { naam: "Producten", pad: "/producten" }, { naam: p.naam, pad }]),
        ],
      };
  }

  const projectSlug = pad.match(/^\/projecten\/([\w-]+)$/)?.[1];
  if (projectSlug) {
    const p = PROJECTEN.find((x) => x.slug === projectSlug);
    if (p)
      return {
        titel: `${p.klant}: ${p.titel} | Vision2Watch`,
        description: p.description,
        og: p.beeld.src,
        schemas: [kruimelSchema([...kruimelBasis, { naam: "Projecten", pad: "/projecten" }, { naam: p.klant, pad }])],
      };
  }

  const sectorSlug = pad.match(/^\/toepassingen\/([\w-]+)$/)?.[1];
  if (sectorSlug) {
    const s = SECTOREN.find((x) => x.slug === sectorSlug);
    if (s)
      return {
        titel: s.titel,
        description: s.description,
        og: s.beeld.src,
        schemas: [
          faqSchema(s.faq),
          kruimelSchema([...kruimelBasis, { naam: "Toepassingen", pad: "/toepassingen" }, { naam: s.naam, pad }]),
        ],
      };
  }

  const artikelSlug = pad.match(/^\/kennisbank\/([\w-]+)$/)?.[1];
  if (artikelSlug) {
    const a = ARTIKELEN.find((x) => x.slug === artikelSlug);
    if (a)
      return {
        titel: a.titel,
        description: a.description,
        og: STANDAARD_OG,
        schemas: [
          artikelSchema(a),
          ...(a.faq?.length ? [faqSchema(a.faq)] : []),
          kruimelSchema([...kruimelBasis, { naam: "Kennisbank", pad: "/kennisbank" }, { naam: a.kop, pad }]),
        ],
      };
  }

  // onbekend pad: 404-metadata
  const nf = STATISCHE_META["/404"];
  return { titel: nf.titel, description: nf.description, og: STANDAARD_OG, noindex: true, schemas: [] };
}

const ontsnap = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function bouwHead(pad: string): string {
  const d = headData(pad);
  const canoniek = pad === "/404" ? null : abs(pad === "/" ? "/" : pad);
  const regels = [
    `<title>${ontsnap(d.titel)}</title>`,
    `<meta name="description" content="${ontsnap(d.description)}" />`,
    d.noindex ? `<meta name="robots" content="noindex" />` : "",
    canoniek && !d.noindex ? `<link rel="canonical" href="${canoniek}" />` : "",
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE.naam}" />`,
    `<meta property="og:locale" content="nl_NL" />`,
    `<meta property="og:title" content="${ontsnap(d.titel)}" />`,
    `<meta property="og:description" content="${ontsnap(d.description)}" />`,
    `<meta property="og:url" content="${canoniek || SITE.domein}" />`,
    `<meta property="og:image" content="${abs(d.og)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`,
    `<link rel="preload" as="font" type="font/woff2" href="/fonts/space-grotesk.woff2" crossorigin />`,
    `<link rel="preload" as="font" type="font/woff2" href="/fonts/inter.woff2" crossorigin />`,
    `<meta name="theme-color" content="#0b0b0e" />`,
    ...d.schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`),
  ];
  return regels.filter(Boolean).join("\n    ");
}

// titel voor client-side navigatie
export const titelVoorPad = (pad: string) => headData(pad).titel;
