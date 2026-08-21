// Haalt geselecteerde bestanden uit Dropbox op en maakt er webklare media
// van. Draait in een GitHub-runner: de bouwomgeving mag Dropbox niet
// bereiken, en de bronbestanden zijn te groot (100+ MB) om in de
// repository te zetten.
//
// Invoer: discovery/dropbox-selectie.json
//   [{ "naam": "showreel", "soort": "video", "url": "...", "seconden": 24, "start": 5 }]
//
// Er zijn drie soorten:
//   "verkennen" - maakt alleen een contactvel: een raster van twaalf beelden
//                 uit de video, in discovery/contactvellen/. Zo is te zien wat
//                 er in een bestand zit voordat het op de site komt.
//   "video"     - knipt een fragment en maakt daar webklare bestanden van.
//   "beeld"     - schaalt een foto naar de maten die de site gebruikt.
// De links van Dropbox zijn eenmalig en kort geldig, dus dit script draait
// direct nadat ze zijn aangemaakt.
//
// Uitvoer: public/media/video/<naam>.mp4 (1280 breed) plus
// <naam>-mobiel.mp4 (720) en <naam>-poster*.webp, precies zoals de rest
// van de media op deze site.
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";
import sharp from "sharp";

const selectie = JSON.parse(readFileSync("discovery/dropbox-selectie.json", "utf8"));

// Twee manieren om aan een bestand te komen:
//   "url" - een tijdelijke, eenmalige downloadlink. Werkt altijd, maar is
//           een kwartier geldig, dus die links worden vlak voor deze run
//           aangemaakt.
//   "pad" - het pad binnen de gedeelde map hieronder. Die link verloopt niet,
//           dus daarmee kan een batch ook later nog draaien.
const GEDEELDE_MAP =
  "https://www.dropbox.com/scl/fo/dh8ff8oj0ku1gbqypkifd/ALDTYd3ggO1bYkpcqfAtF9k" +
  "?rlkey=ikse1gqer6xsdvkrjo2mgeb0c";

const adresVan = (item) =>
  item.url ?? `${GEDEELDE_MAP}&dl=1&subpath=${encodeURIComponent(item.pad)}`;

// Dropbox levert een map-download als zip af. Eén bestand uit zo'n zip halen
// kan met unzip; bij een gewoon mediabestand gebeurt er niets.
const uitpakkenIndienZip = (pad) => {
  const kop = readFileSync(pad).subarray(0, 2).toString("latin1");
  if (kop !== "PK") return;
  const inhoud = execFileSync("unzip", ["-Z1", pad], { encoding: "utf8" }).trim().split("\n");
  const eerste = inhoud.find((n) => !n.endsWith("/"));
  if (!eerste) throw new Error("zip zonder bestand");
  const uitgepakt = execFileSync("unzip", ["-p", pad, eerste], { maxBuffer: 1024 * 1024 * 1024 });
  writeFileSync(pad, uitgepakt);
  console.log(`  uit zip gehaald: ${eerste}`);
};
const UIT = "public/media/video";
const BEELD = "public/media";
const VELLEN = "discovery/contactvellen";
mkdirSync(UIT, { recursive: true });
mkdirSync(VELLEN, { recursive: true });
mkdirSync("tijdelijk", { recursive: true });

const ff = (args) => execFileSync(ffmpeg, args, { stdio: ["ignore", "ignore", "pipe"] });

// Schaalt naar de gegeven maat op de langste zijde. Een staande opname van
// een telefoon wordt zo 720 bij 1280 in plaats van 1280 bij 2276, en de
// tweede stap houdt beide maten even (h264 eist dat).
const LANGSTE = (maat) =>
  `scale=w=${maat}:h=${maat}:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`;

// ffmpeg-static levert geen ffprobe mee, dus de speelduur komt uit de
// meldingen die ffmpeg zelf afdrukt als je hem een bestand laat inlezen.
const speelduur = (pad) => {
  let uitvoer = "";
  try {
    execFileSync(ffmpeg, ["-hide_banner", "-i", pad], { stdio: ["ignore", "ignore", "pipe"] });
  } catch (e) {
    uitvoer = String(e.stderr ?? "");
  }
  const m = uitvoer.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
};

const VAKKEN = 12; // 4 breed, 3 hoog
const contactvel = async (ruw, naam) => {
  const duur = speelduur(ruw);
  if (!duur) throw new Error("speelduur onbekend");
  // De beelden staan gelijkmatig over de video verdeeld: vak 1 zit vlak na
  // het begin, vak 12 vlak voor het eind. De tussentijd staat in het logboek,
  // zodat een gekozen vak terug te rekenen is naar een starttijd.
  const stap = duur / VAKKEN;
  ff(["-y", "-ss", (stap / 2).toFixed(2), "-i", ruw, "-vf",
      `fps=1/${stap.toFixed(3)},scale=360:-2,tile=4x3`, "-frames:v", "1", "-q:v", "4",
      `${VELLEN}/${naam}.jpg`]);
  return { duur, stap };
};

let ok = 0, mislukt = 0;
for (const item of selectie) {
  const ruw = `tijdelijk/${item.naam}-ruw`;
  try {
    // Eén bestand dat blijft hangen mag de rest niet meeslepen: na twee
    // minuten breekt het af en gaat de lijst gewoon verder.
    const r = await fetch(adresVan(item), { redirect: "follow", signal: AbortSignal.timeout(120_000) });
    if (!r.ok) throw new Error(`status ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    writeFileSync(ruw, buf);
    console.log(`${item.naam}: ${(buf.length / 1024 / 1024).toFixed(1)} MB opgehaald` +
                ` (${r.headers.get("content-type") ?? "?"})`);
    uitpakkenIndienZip(ruw);

    if (item.soort === "verkennen") {
      const { duur, stap } = await contactvel(ruw, item.naam);
      console.log(`  contactvel klaar: ${item.naam}.jpg — ${duur.toFixed(0)} s lang,` +
                  ` vak n begint op ${(stap).toFixed(1)} x (n - 1) seconden`);
    } else if (item.soort === "beeld") {
      const breedte = item.breedte ?? 1600;
      await sharp(ruw).rotate().resize({ width: breedte, withoutEnlargement: true }).webp({ quality: 78 }).toFile(`${BEELD}/${item.naam}.webp`);
      for (const [b, q] of [[1024, 72], [640, 70]]) {
        await sharp(ruw).rotate().resize({ width: b, withoutEnlargement: true }).webp({ quality: q }).toFile(`${BEELD}/${item.naam}-${b}.webp`);
      }
      console.log(`  beeld klaar: ${item.naam}.webp`);
    } else {
      // knippen naar een kort fragment: een achtergrondvideo hoeft niet
      // langer te zijn dan een halve minuut, en het scheelt megabytes
      const knip = [];
      if (item.start) knip.push("-ss", String(item.start));
      if (item.seconden) knip.push("-t", String(item.seconden));
      ff(["-y", ...knip, "-i", ruw, "-an", "-c:v", "libx264", "-crf", "28", "-preset", "slow",
          "-pix_fmt", "yuv420p", "-vf", LANGSTE(1280), "-movflags", "+faststart", `${UIT}/${item.naam}.mp4`]);
      ff(["-y", ...knip, "-i", ruw, "-an", "-c:v", "libx264", "-crf", "27", "-preset", "slow",
          "-pix_fmt", "yuv420p", "-vf", LANGSTE(720), "-movflags", "+faststart", `${UIT}/${item.naam}-mobiel.mp4`]);
      ff(["-y", "-i", `${UIT}/${item.naam}.mp4`, "-vframes", "1", "-f", "image2", `tijdelijk/${item.naam}.png`]);
      await sharp(`tijdelijk/${item.naam}.png`).webp({ quality: 75 }).toFile(`${UIT}/${item.naam}-poster.webp`);
      for (const [b, q] of [[1024, 72], [640, 70]]) {
        await sharp(`tijdelijk/${item.naam}.png`).resize({ width: b }).webp({ quality: q }).toFile(`${UIT}/${item.naam}-poster-${b}.webp`);
      }
      await contactvel(`${UIT}/${item.naam}.mp4`, `${item.naam}-fragment`);
      console.log(`  video klaar: ${(statSync(`${UIT}/${item.naam}.mp4`).size / 1024 / 1024).toFixed(1)} MB` +
                  ` / mobiel ${(statSync(`${UIT}/${item.naam}-mobiel.mp4`).size / 1024 / 1024).toFixed(1)} MB`);
    }
    ok++;
  } catch (e) {
    console.log(`MISLUKT ${item.naam}: ${e.message}`);
    mislukt++;
  } finally {
    if (existsSync(ruw)) rmSync(ruw);
  }
}
rmSync("tijdelijk", { recursive: true, force: true });
console.log(`\nklaar: ${ok} gelukt, ${mislukt} mislukt`);
// Een enkele mislukking is geen reden om alles weg te gooien: wat wel gelukt
// is moet bewaard worden. Alleen als er niets is gelukt, faalt deze stap.
if (!ok) process.exitCode = 1;
