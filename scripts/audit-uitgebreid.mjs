// Uitgebreide statische audit over dist/: metadata, headings, media-attributen,
// structured data, hreflang, OG en gewichten. Uitvoer als P0/P1/P2/P3-lijst.
// Gebaseerd op het kennisbank-sjabloon, aangepast voor vision2watch.nl.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HOOFD = "https://www.vision2watch.nl";
const wortel = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(wortel, "dist");

const paginas = [];
(function loop(map) {
  for (const naam of readdirSync(map)) {
    const p = join(map, naam);
    const st = statSync(p);
    if (st.isDirectory()) loop(p);
    else if (naam === "index.html" || naam === "404.html") paginas.push(p);
  }
})(DIST);

const problemen = { P0: [], P1: [], P2: [], P3: [] };
const meld = (prio, route, tekst) => problemen[prio].push(`${route}: ${tekst}`);

const titels = new Map(), descs = new Map();
let totBeelden = 0, zonderAlt = 0, zonderMaat = 0, lazyMissend = 0, videosZonderPoster = 0;
const schemaTypes = new Map();

for (const bestand of paginas) {
  const route = "/" + relative(DIST, bestand).replace(/index\.html$/, "").replace(/\/$/, "") || "/";
  const html = readFileSync(bestand, "utf8");
  const is404 = bestand.endsWith("404.html");

  const titel = (html.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1] || "";
  if (!titel) meld("P1", route, "titel ontbreekt");
  else {
    if (titel.length > 70) meld("P3", route, `titel lang (${titel.length})`);
    titels.set(titel, (titels.get(titel) || []).concat(route));
  }
  const d = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  if (!d && !is404) meld("P1", route, "description ontbreekt");
  else if (d) {
    if (d.length < 60) meld("P3", route, `description kort (${d.length})`);
    if (d.length > 170) meld("P3", route, `description lang (${d.length})`);
    descs.set(d, (descs.get(d) || []).concat(route));
  }
  const heeftNoindex = /name="robots"[^>]+noindex/.test(html);
  const can = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || "";
  if (!can && !is404 && !heeftNoindex) meld("P1", route, "canonical ontbreekt");
  else if (can && !can.startsWith(HOOFD)) meld("P1", route, `canonical fout: ${can}`);

  const lang = (html.match(/<html[^>]*\blang="([^"]*)"/) || [])[1] || "";
  if (!lang) meld("P1", route, "lang-attribuut ontbreekt");
  if (!html.includes('name="viewport"')) meld("P0", route, "viewport ontbreekt");

  const h1s = html.match(/<h1[\s>]/g) || [];
  if (h1s.length === 0 && !is404) meld("P1", route, "geen H1");
  if (h1s.length > 1) meld("P1", route, `${h1s.length} H1's`);

  if (!is404) {
    for (const t of ["og:title", "og:description", "og:url", "og:image", "og:type"])
      if (!html.includes(`property="${t}"`)) { meld("P2", route, `Open Graph mist ${t}`); break; }
    if (!html.includes('name="twitter:card"')) meld("P3", route, "twitter:card ontbreekt");
  }

  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    totBeelden++;
    const tag = m[0];
    if (!/\balt="/.test(tag)) zonderAlt++;
    if (!/\bwidth="/.test(tag) || !/\bheight="/.test(tag)) zonderMaat++;
    if (!/\bloading="lazy"/.test(tag) && !/\bfetchpriority="high"/.test(tag) && !/\bloading="eager"/.test(tag)) lazyMissend++;
  }
  // Een video hoort een stilstaand beeld te tonen voordat hij speelt. Dat mag
  // via het poster-attribuut, of via een beeld dat er in dezelfde container
  // direct aan voorafgaat (dat kan wél een srcset hebben, zie HeroVideo).
  for (const m of html.matchAll(/<video\b[^>]*>/g)) {
    if (/\bposter="/.test(m[0])) continue;
    const ervoor = html.slice(Math.max(0, m.index - 700), m.index);
    if (/<img\b[^>]*>\s*$/.test(ervoor)) continue;
    videosZonderPoster++;
  }

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const j = JSON.parse(m[1]);
      for (const item of [].concat(j["@graph"] || j)) {
        const t = item["@type"];
        if (t) schemaTypes.set(String(t), (schemaTypes.get(String(t)) || 0) + 1);
      }
    } catch {
      meld("P0", route, "JSON-LD parset niet");
    }
  }
}

for (const [t, r] of titels) if (r.length > 1) meld("P1", r.join(","), `dubbele titel "${t.slice(0, 50)}"`);
for (const [, r] of descs) if (r.length > 1) meld("P2", r.join(","), "dubbele description");
if (zonderAlt) meld("P1", "site", `${zonderAlt}/${totBeelden} beelden zonder alt`);
if (zonderMaat) meld("P2", "site", `${zonderMaat}/${totBeelden} beelden zonder width/height`);
if (lazyMissend) meld("P2", "site", `${lazyMissend}/${totBeelden} beelden zonder loading-strategie`);
if (videosZonderPoster) meld("P1", "site", `${videosZonderPoster} video's zonder poster`);

console.log(`Audit over ${paginas.length} pagina's`);
console.log("Schema-types:", [...schemaTypes.entries()].map(([t, n]) => `${t}×${n}`).join(", ") || "geen");
let totaal = 0;
for (const p of ["P0", "P1", "P2", "P3"]) {
  if (problemen[p].length) {
    console.log(`\n${p} (${problemen[p].length}):`);
    for (const r of problemen[p]) console.log("  " + r);
  }
  if (p !== "P3") totaal += problemen[p].length;
}
if (!totaal) console.log("\nGeen P0/P1/P2-bevindingen.");
process.exit(problemen.P0.length ? 1 : 0);
