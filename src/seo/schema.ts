// JSON-LD-bouwers. IJzeren regel: schema beschrijft alleen wat zichtbaar en
// waar is; geen verzonnen prijzen, reviews of datums.
import { SITE } from "../data/site";
import type { Artikel, Faq, Product, Sector } from "../content/types";
import { leveringLabel } from "../content/levering";
import { CATEGORIEEN } from "../content/nl/categorieen";

const abs = (pad: string) => `${SITE.domein}${pad}`;

export const organisatieSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE.domein}/#organisatie`,
  name: SITE.naam,
  legalName: SITE.juridischeNaam,
  url: SITE.domein,
  logo: abs("/media/logo-v2w.webp"),
  email: SITE.email,
  telephone: SITE.telefoon.algemeen.label,
  identifier: { "@type": "PropertyValue", propertyID: "KvK", value: SITE.kvk },
  vatID: SITE.btw,
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE.adres.straat,
    postalCode: SITE.adres.postcode,
    addressLocality: SITE.adres.plaats,
    addressCountry: "NL",
  },
  sameAs: SITE.socials.map((s) => s.url),
  knowsLanguage: ["nl", "en"],
  slogan: "De kers op de taart",
  areaServed: { "@type": "Country", name: "Nederland" },
  // Waar dit bedrijf van is. Zoekmachines én AI-zoekmachines gebruiken dit
  // om te bepalen bij welke vraag ze dit bedrijf noemen.
  knowsAbout: [
    "interactieve vloer",
    "interactieve muur",
    "interactieve tafel",
    "interactieve bar",
    "interactieve etalage",
    "hologram-projectie",
    "holobox",
    "holografische molen",
    "sketchwall",
    "virtual host",
    "virtual chef",
    "touchscreen",
    "transparant scherm",
    "LED-display",
    "gebouwprojectie",
    "panoramische projectie",
    "projection mapping",
    "augmented reality op groot scherm",
    "logo-animatie",
    "contentproductie voor interactieve installaties",
    "installatie en onderhoud van audiovisuele systemen",
  ],
});

export const websiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE.domein}/#website`,
  url: SITE.domein,
  name: SITE.naam,
  inLanguage: "nl",
  publisher: { "@id": `${SITE.domein}/#organisatie` },
});

export const lokaalBedrijfSchema = () => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE.domein}/#vestiging`,
  name: SITE.naam,
  url: abs("/contact"),
  image: abs("/media/euroveiling-bloemenvloer.webp"),
  email: SITE.email,
  telephone: SITE.telefoon.algemeen.label,
  identifier: { "@type": "PropertyValue", propertyID: "KvK", value: SITE.kvk },
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE.adres.straat,
    postalCode: SITE.adres.postcode,
    addressLocality: SITE.adres.plaats,
    addressCountry: "NL",
  },
  contactPoint: [
    { "@type": "ContactPoint", contactType: "sales", telephone: SITE.telefoon.algemeen.label, email: SITE.email, availableLanguage: ["nl", "en"] },
  ],
});

export const kruimelSchema = (kruimels: { naam: string; pad: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: kruimels.map((k, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: k.naam,
    item: abs(k.pad),
  })),
});

export const productSchema = (p: Product) => {
  const levering = leveringLabel(p.levering);
  const huur = /huur/i.test(levering ?? "");
  const koop = /koop/i.test(levering ?? "");
  // GoodRelations kent losse termen voor verkopen en verhuren. Zo staat er
  // machineleesbaar wát er mogelijk is, zonder een prijs te verzinnen: die
  // is bij ons altijd op aanvraag.
  const functies = [
    koop ? "http://purl.org/goodrelations/v1#Sell" : null,
    huur ? "http://purl.org/goodrelations/v1#LeaseOut" : null,
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.naam,
    description: p.intro,
    image: abs(p.beeld.src),
    url: abs(`/producten/${p.slug}`),
    brand: { "@type": "Brand", name: SITE.naam },
    manufacturer: { "@id": `${SITE.domein}/#organisatie` },
    category: CATEGORIEEN.find((c) => c.slug === p.categorie)?.naam,
    ...(functies.length
      ? {
          offers: {
            "@type": "Offer",
            businessFunction: functies,
            seller: { "@id": `${SITE.domein}/#organisatie` },
            url: abs("/prijslijst"),
            areaServed: { "@type": "Country", name: "Nederland" },
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
    ...(levering ? { additionalProperty: [{ "@type": "PropertyValue", name: "Levering", value: levering }] } : {}),
    isRelatedTo: p.verwant.map((slug) => ({ "@type": "Product", url: abs(`/producten/${slug}`) })),
  };
};

// Het productoverzicht als opsomming: zo kan een zoekmachine of AI-model in
// één keer zien welke groepen er zijn en in welke volgorde ze horen.
export const productenLijstSchema = (producten: Product[]) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${SITE.domein}/producten#lijst`,
  name: "Producten van Vision2Watch",
  url: abs("/producten"),
  isPartOf: { "@id": `${SITE.domein}/#website` },
  about: { "@id": `${SITE.domein}/#organisatie` },
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: producten.length,
    itemListOrder: "https://schema.org/ItemListUnordered",
    itemListElement: producten.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.naam,
      url: abs(`/producten/${p.slug}`),
    })),
  },
});

export const faqSchema = (faqs: Faq[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.vraag,
    acceptedAnswer: { "@type": "Answer", text: f.antwoord },
  })),
});

export const artikelSchema = (a: Artikel) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: a.kop,
  description: a.description,
  datePublished: a.gepubliceerd,
  dateModified: a.gewijzigd,
  inLanguage: "nl",
  mainEntityOfPage: abs(`/kennisbank/${a.slug}`),
  author: { "@id": `${SITE.domein}/#organisatie` },
  publisher: { "@id": `${SITE.domein}/#organisatie` },
});

// Bewust geen VideoObject: schema.org vereist een uploadDate en de echte
// publicatiedatum van de bronvideo's is niet verifieerbaar (vaste regel:
// geen verzonnen datums in structured data).

export const sectorFaqSchema = (s: Sector) => (s.faq.length ? faqSchema(s.faq) : null);
