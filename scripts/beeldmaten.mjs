// Schrijft src/data/beeldmaten.ts: de afmetingen van elk beeld in
// public/media. De site gebruikt die om width en height mee te geven (geen
// verspringende pagina tijdens het laden) en om te weten welke varianten
// er zijn voor de srcset.
//
// Staat los van scripts/media-cureren.mjs, want media komt uit twee bronnen:
// de curatie van de oude site en de Dropbox-pijplijn. Beide eindigen in
// public/media, dus dit script kijkt gewoon naar wat er ligt.
import { readdirSync, writeFileSync, existsSync } from "node:fs";
import sharp from "sharp";

const UIT = "public/media";
const maten = {};
for (const map of ["", "logo/", "video/"]) {
  if (!existsSync(`${UIT}/${map}`)) continue;
  for (const naam of readdirSync(`${UIT}/${map}`).sort()) {
    if (!naam.endsWith(".webp")) continue;
    const m = await sharp(`${UIT}/${map}${naam}`).metadata();
    maten[`/media/${map}${naam}`] = [m.width, m.height];
  }
}
writeFileSync(
  "src/data/beeldmaten.ts",
  `// Gegenereerd door scripts/beeldmaten.mjs: afmetingen per beeld;\n// -640/-1024-varianten dienen de srcset.\nexport const BEELDMATEN: Record<string, [number, number]> = ${JSON.stringify(maten)};\n`,
);
console.log(`beeldmaten: ${Object.keys(maten).length} bestanden`);
