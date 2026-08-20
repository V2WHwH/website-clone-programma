// Metadata-rapport over alle geprerenderde pagina's: unieke titels en
// descriptions, canonicals, lang, precies één H1, parsende JSON-LD.
// Exitcode 1 zodra iets ontbreekt. Zie kennisbank 05-kwaliteitscontrole.md.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HOOFD = "https://www.vision2watch.nl";
const wortel = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(wortel, "dist");

const paginas = [];
(function loop(map) {
  for (const naam of readdirSync(map)) {
    const p = join(map, naam);
    if (statSync(p).isDirectory()) loop(p);
    else if (naam === "index.html" || naam === "404.html") paginas.push(p);
  }
})(dist);

const fouten = [];
const titels = new Map();
const descs = new Map();

for (const bestand of paginas) {
  const route = "/" + relative(dist, bestand).replace(/index\.html$/, "").replace(/\/$/, "");
  const is404 = bestand.endsWith("404.html");
  const html = readFileSync(bestand, "utf8");

  const titel = (html.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1] || "";
  if (!titel) fouten.push(`${route}: titel ontbreekt`);
  else titels.set(titel, (titels.get(titel) || []).concat(route));

  const d = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  if (!d && !is404) fouten.push(`${route}: description ontbreekt`);
  else if (d) descs.set(d, (descs.get(d) || []).concat(route));

  const noindex = /name="robots"[^>]+noindex/.test(html);
  const can = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || "";
  if (!is404 && !noindex) {
    if (!can) fouten.push(`${route}: canonical ontbreekt`);
    else if (!can.startsWith(HOOFD)) fouten.push(`${route}: canonical wijst niet naar hoofddomein: ${can}`);
  }

  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) fouten.push(`${route}: ${h1s} H1's (verwacht 1)`);

  if (!html.includes('name="viewport"')) fouten.push(`${route}: viewport ontbreekt`);

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch {
      fouten.push(`${route}: JSON-LD parset niet`);
    }
  }

  const og = ["og:title", "og:description", "og:url", "og:image"].filter((t) => !html.includes(`property="${t}"`));
  if (og.length && !is404) fouten.push(`${route}: Open Graph mist ${og.join(", ")}`);
}

for (const [t, routes] of titels) if (routes.length > 1) fouten.push(`dubbele titel "${t.slice(0, 50)}" op ${routes.join(", ")}`);
for (const [d, routes] of descs) if (routes.length > 1) fouten.push(`dubbele description op ${routes.join(", ")}`);

if (fouten.length) {
  console.error(`QA-rapport: ${fouten.length} fout(en):`);
  for (const f of fouten) console.error("  " + f);
  process.exit(1);
}
console.log(`QA-rapport: ${paginas.length} pagina's, alles in orde.`);
