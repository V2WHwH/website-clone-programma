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
    verwijzingen.add(`/${m[1]}/${m[2]}`);
  }
}

const ontbreekt = [...verwijzingen].filter((v) => !existsSync(join(publiek, v)));
if (ontbreekt.length) {
  console.error("ONTBREKENDE MEDIA (wel in code, niet in public/):");
  for (const o of ontbreekt.sort()) console.error("  " + o);
  process.exit(1);
}
console.log(`Mediacheck: ${verwijzingen.size} verwijzingen, alles aanwezig.`);
