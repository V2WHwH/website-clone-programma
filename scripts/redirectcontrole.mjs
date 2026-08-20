// Controleert de omleidingen van de oude site: elk adres dat de crawl van
// vision2watch.nl opleverde moet óf nog bestaan, óf door een regel in
// public/_redirects worden opgevangen. Het doel moet echt bestaan in dist/
// en mag zelf geen bron van een volgende omleiding zijn (geen ketens).
// Faalt met exitcode 1, zodat een ontbrekende omleiding de pijplijn stopt.
import { readFileSync, existsSync, readdirSync } from "node:fs";

const oud = [...new Set(readFileSync("discovery/crawl/sitemap-urls.txt", "utf8").split("\n")
  .concat(readFileSync("discovery/crawl/urls.txt", "utf8").split("\n").map((r) => r.split("\t")[1] || ""))
  .filter(Boolean)
  .map((u) => { try { return new URL(u).pathname.replace(/\/+$/, "") || "/"; } catch { return null; } })
  .filter(Boolean))].sort();

const regels = readFileSync("public/_redirects", "utf8").split("\n")
  .map((r) => r.trim()).filter((r) => r && !r.startsWith("#"))
  .map((r) => { const [van, naar, code] = r.split(/\s+/); return { van, naar, code }; });

const dekt = (pad) => regels.find((r) =>
  r.van.endsWith("/*") ? pad === r.van.slice(0, -2) || pad.startsWith(r.van.slice(0, -1)) : r.van === pad);

const bestaat = (pad) => pad === "/" || existsSync("dist" + pad + "/index.html") || existsSync("dist" + pad);

const nieuw = new Set();
(function loop(map) {
  for (const n of readdirSync(map, { withFileTypes: true })) {
    if (n.isDirectory()) loop(map + "/" + n.name);
    else if (n.name === "index.html") nieuw.add((map.replace("dist", "") || "/"));
  }
})("dist");

const ongedekt = [], kapot = [], ketens = [];
for (const pad of oud) {
  if (nieuw.has(pad)) continue;              // adres bestaat gewoon nog
  const r = dekt(pad);
  if (!r) { ongedekt.push(pad); continue; }
  const doel = r.naar.replace(":splat", pad.slice(r.van.length - 1));
  if (!bestaat(doel.replace(/\/+$/, "")) && !nieuw.has(doel)) kapot.push(`${pad} -> ${doel}`);
  if (dekt(doel)) ketens.push(`${pad} -> ${doel} -> ...`);
}
console.log(`oude adressen: ${oud.length} | nieuw aanwezig: ${oud.filter((p) => nieuw.has(p)).length}`);
console.log(`zonder redirect (${ongedekt.length}):`); for (const p of ongedekt.slice(0, 30)) console.log("  " + p);
console.log(`redirect naar niet-bestaande pagina (${kapot.length}):`); for (const p of kapot.slice(0, 20)) console.log("  " + p);
console.log(`ketens (${ketens.length}):`); for (const p of ketens.slice(0, 10)) console.log("  " + p);

if (ongedekt.length || kapot.length || ketens.length) process.exit(1);
console.log("Redirectcontrole: alle oude adressen opgevangen, geen ketens.");
