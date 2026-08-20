// Prebuild-controle: elk beeld/elke video waarnaar de code verwijst moet echt
// in public/ staan. De build faalt liever dan dat hij iets halfs oplevert.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const wortel = join(dirname(fileURLToPath(import.meta.url)), "..");
const bronmappen = [join(wortel, "src")];
const publiek = join(wortel, "public");

const bestanden = [];
(function loop(map) {
  if (!existsSync(map)) return;
  for (const naam of readdirSync(map)) {
    const p = join(map, naam);
    if (statSync(p).isDirectory()) loop(p);
    else if (/\.(tsx?|css)$/.test(naam)) bestanden.push(p);
  }
})(bronmappen[0]);

const verwijzingen = new Set();
for (const b of bestanden) {
  const inhoud = readFileSync(b, "utf8");
  for (const m of inhoud.matchAll(/["'(]\/(media|fonts)\/([^"')?#]+)/g)) {
    // Een srcset noemt meerdere bestanden in één tekenreeks, elk gevolgd
    // door een breedte-aanduiding: die hier weer uit elkaar halen.
    for (const deel of `/${m[1]}/${m[2]}`.split(",")) {
      const pad = deel.trim().split(/\s+/)[0];
      if (pad.startsWith("/")) verwijzingen.add(pad);
    }
  }
}

const ontbreekt = [...verwijzingen].filter((v) => !existsSync(join(publiek, v)));

// Elke herovideo krijgt op smalle schermen een lichtere variant. Die naam
// wordt in HeroVideo pas tijdens het bezoek afgeleid, dus de statische
// controle hierboven ziet hem niet: hier expliciet afdwingen.
for (const v of verwijzingen) {
  if (!v.endsWith(".mp4")) continue;
  const mobiel = v.replace(/\.mp4$/, "-mobiel.mp4");
  if (!existsSync(join(publiek, mobiel))) ontbreekt.push(`${mobiel} (mobiele variant van ${v})`);
}

if (ontbreekt.length) {
  console.error("ONTBREKENDE MEDIA (wel in code, niet in public/):");
  for (const o of ontbreekt.sort()) console.error("  " + o);
  process.exit(1);
}
console.log(`Mediacheck: ${verwijzingen.size} verwijzingen, alles aanwezig.`);
