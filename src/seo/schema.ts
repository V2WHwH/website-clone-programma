// JSON-LD-bouwers. IJzeren regel: schema beschrijft alleen wat zichtbaar en
// waar is; geen verzonnen prijzen, reviews of datums.
import { SITE } from "../data/site";
import type { Artikel, Faq, Product, Sector } from "../content/types";

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
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE.adres.straat,
    postalCode: SITE.adres.postcode,
    addressLocality: SITE.adres.plaats,
    addressCountry: "NL",
  },
  sameAs: SITE.socials.map((s) => s.url),
  knowsLanguage: ["nl", "en"],
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

export const productSchema = (p: Product) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: p.naam,
  description: p.intro,
  image: abs(p.beeld.src),
  url: abs(`/producten/${p.slug}`),
  brand: { "@type": "Brand", name: SITE.naam },
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
