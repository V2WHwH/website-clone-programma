// Linkcontrole: geen kapotte interne links; elke sitemap-URL bestaat als
// pagina en heeft minimaal 2 inkomende interne links; niets in de sitemap
// dat niet bestaat en geen indexeerbare pagina buiten de sitemap.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
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
    else if (naam === "index.html") paginas.push(p);
  }
})(dist);

const fouten = [];
const inkomend = new Map();
const bestaat = (route) =>
  existsSync(join(dist, route === "/" ? "index.html" : route.slice(1) + "/index.html")) ||
  existsSync(join(dist, route.slice(1)));

for (const bestand of paginas) {
  const route = "/" + relative(dist, bestand).replace(/index\.html$/, "").replace(/\/$/, "");
  const html = readFileSync(bestand, "utf8");
  for (const m of html.matchAll(/<a[^>]+href="([^"#]+)"/g)) {
    let doel = m[1];
    if (doel.startsWith(HOOFD)) doel = doel.slice(HOOFD.length) || "/";
    if (/^(https?:|mailto:|tel:)/.test(doel)) continue;
    doel = doel.replace(/\/$/, "") || "/";
    if (!bestaat(doel)) fouten.push(`${route || "/"}: kapotte link naar ${doel}`);
    else if (doel !== (route || "/")) inkomend.set(doel, (inkomend.get(doel) || 0) + 1);
  }
}

const sitemapPad = join(dist, "sitemap.xml");
if (!existsSync(sitemapPad)) {
  fouten.push("sitemap.xml ontbreekt in dist/");
} else {
  const sm = readFileSync(sitemapPad, "utf8");
  const smUrls = [...sm.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].replace(HOOFD, "").replace(/\/$/, "") || "/");
  for (const u of smUrls) {
    if (!bestaat(u)) fouten.push(`sitemap noemt niet-bestaande pagina ${u}`);
    else if (u !== "/" && (inkomend.get(u) || 0) < 2) fouten.push(`${u}: slechts ${inkomend.get(u) || 0} inkomende link(s), minimaal 2`);
  }
  // andersom: elke indexeerbare pagina hoort in de sitemap
  for (const bestand of paginas) {
    const route = ("/" + relative(dist, bestand).replace(/index\.html$/, "").replace(/\/$/, "")) || "/";
    const html = readFileSync(bestand, "utf8");
    const noindex = /name="robots"[^>]+noindex/.test(html);
    if (!noindex && !smUrls.includes(route)) fouten.push(`${route}: indexeerbaar maar niet in sitemap`);
  }
}

if (fouten.length) {
  console.error(`Linkcontrole: ${fouten.length} fout(en):`);
  for (const f of fouten) console.error("  " + f);
  process.exit(1);
}
console.log(`Linkcontrole: ${paginas.length} pagina's, alle links en sitemap-dekking in orde.`);
