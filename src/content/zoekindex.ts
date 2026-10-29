import { PRODUCTEN } from "./nl/producten";
import { SECTOREN } from "./nl/sectoren";
import { PROJECTEN } from "./nl/projecten";
import { ARTIKELEN } from "./nl/kennisbank";

// Eén doorzoekbare index voor de snelzoekfunctie (Cmd/Ctrl+K). Gebouwd uit
// dezelfde contentbestanden als de rest van de site, dus nooit uit de pas:
// een nieuw product of artikel is automatisch doorzoekbaar.

export type ZoekType = "product" | "toepassing" | "project" | "kennisbank";

export type ZoekResultaat = {
  type: ZoekType;
  label: string;
  sub?: string;
  pad: string;
  /** tekst waarop gematcht wordt, niet getoond */
  trefwoorden: string;
};

const TYPE_LABEL: Record<ZoekType, string> = {
  product: "Producten",
  toepassing: "Toepassingen",
  project: "Projecten",
  kennisbank: "Kennisbank",
};

// Klantzoektaal uit het marktonderzoek (docs/marktonderzoek.md): woorden
// die bezoekers typen maar niet letterlijk in de paginanaam staan. Elke
// regel is hier, dus traceerbaar terug te vinden in dat document.
const ALIASSEN: { term: string; pad: string }[] = [
  { term: "tovertafel", pad: "/producten/interactieve-tafel" },
  { term: "activeringstafel", pad: "/producten/interactieve-tafel" },
  { term: "touchtafel", pad: "/producten/interactieve-tafel" },
  { term: "informatiezuil", pad: "/producten/touchscreens" },
  { term: "infozuil", pad: "/producten/touchscreens" },
  { term: "digitale receptie", pad: "/producten/virtual-host" },
  { term: "virtuele receptie", pad: "/producten/virtual-host" },
  { term: "gobo", pad: "/producten/logo-animatie" },
  { term: "interactieve tekenwand", pad: "/producten/sketchwall" },
  { term: "tekenprojectie", pad: "/producten/sketchwall" },
  { term: "3d-tafelprojectie", pad: "/producten/virtual-chef" },
  { term: "hologramventilator", pad: "/producten/holografische-molen" },
  { term: "hologram fan", pad: "/producten/holografische-molen" },
  { term: "immersive room", pad: "/producten/panoramische-projectie" },
  { term: "videomapping", pad: "/producten/gebouw-projectie" },
  { term: "projection mapping", pad: "/producten/gebouw-projectie" },
  { term: "beweegvloer", pad: "/producten/interactieve-vloer" },
  { term: "speelvloer", pad: "/producten/interactieve-vloer" },
  { term: "videowall", pad: "/producten/led-displays" },
  { term: "digitale etalage", pad: "/producten/interactieve-etalage" },
];

function bouwIndex(): ZoekResultaat[] {
  const items: ZoekResultaat[] = [];

  for (const p of PRODUCTEN) {
    items.push({
      type: "product",
      label: p.kaartLabel ?? p.naam,
      sub: p.description,
      pad: `/producten/${p.slug}`,
      trefwoorden: [p.naam, p.kaartLabel, p.description, p.intro, ...p.toepassingen].filter(Boolean).join(" ").toLowerCase(),
    });
  }
  for (const s of SECTOREN) {
    items.push({
      type: "toepassing",
      label: s.naam,
      sub: s.description,
      pad: `/toepassingen/${s.slug}`,
      trefwoorden: [s.naam, s.description, s.intro].join(" ").toLowerCase(),
    });
  }
  for (const pr of PROJECTEN) {
    items.push({
      type: "project",
      label: pr.titel,
      sub: pr.klant,
      pad: `/projecten/${pr.slug}`,
      trefwoorden: [pr.titel, pr.klant, pr.description, pr.locatie].filter(Boolean).join(" ").toLowerCase(),
    });
  }
  for (const a of ARTIKELEN) {
    items.push({
      type: "kennisbank",
      label: a.kop,
      sub: a.description,
      pad: `/kennisbank/${a.slug}`,
      trefwoorden: [a.kop, a.titel, a.description, a.antwoord].join(" ").toLowerCase(),
    });
  }
  return items;
}

const INDEX = bouwIndex();

export type ZoekGroep = { type: ZoekType; label: string; resultaten: ZoekResultaat[] };

/** Per groep maximaal dit aantal tonen; voorkomt dat één contenttype de
 *  rest van de resultaten van het scherm duwt. */
const MAX_PER_GROEP = 5;

export function zoek(query: string): ZoekGroep[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  // Alias-matches krijgen voorrang: ze komen altijd bovenaan hun groep te
  // staan, ook als de rest van de index ze niet vindt (bijv. "tovertafel"
  // staat nergens letterlijk op de interactieve-tafel-pagina).
  const aliasPaden = new Set(ALIASSEN.filter((a) => a.term.includes(q) || q.includes(a.term)).map((a) => a.pad));

  const gevonden = INDEX.filter((item) => aliasPaden.has(item.pad) || item.trefwoorden.includes(q));

  const groepen: ZoekGroep[] = [];
  for (const type of ["product", "toepassing", "project", "kennisbank"] as ZoekType[]) {
    const resultaten = gevonden.filter((r) => r.type === type);
    if (resultaten.length === 0) continue;
    // alias-treffers eerst
    resultaten.sort((a, b) => Number(aliasPaden.has(b.pad)) - Number(aliasPaden.has(a.pad)));
    groepen.push({ type, label: TYPE_LABEL[type], resultaten: resultaten.slice(0, MAX_PER_GROEP) });
  }
  return groepen;
}

export const ZOEK_SNELKOPPELINGEN = [
  { label: "Alle producten", pad: "/producten" },
  { label: "Toepassingen per sector", pad: "/toepassingen" },
  { label: "Projecten", pad: "/projecten" },
  { label: "Kennisbank", pad: "/kennisbank" },
  { label: "Prijslijst aanvragen", pad: "/prijslijst" },
  { label: "Contact", pad: "/contact" },
];
