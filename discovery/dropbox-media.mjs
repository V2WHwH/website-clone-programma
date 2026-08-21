// Haalt geselecteerde bestanden uit Dropbox op en maakt er webklare media
// van. Draait in een GitHub-runner: de bouwomgeving mag Dropbox niet
// bereiken, en de bronbestanden zijn te groot (100+ MB) om in de
// repository te zetten.
//
// Invoer: discovery/dropbox-selectie.json
//   [{ "naam": "showreel", "soort": "video", "url": "...", "seconden": 24, "start": 5 }]
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
const UIT = "public/media/video";
const BEELD = "public/media";
mkdirSync(UIT, { recursive: true });
mkdirSync("tijdelijk", { recursive: true });

const ff = (args) => execFileSync(ffmpeg, args, { stdio: ["ignore", "ignore", "pipe"] });

let ok = 0, mislukt = 0;
for (const item of selectie) {
  const ruw = `tijdelijk/${item.naam}-ruw`;
  try {
    const r = await fetch(item.url);
    if (!r.ok) throw new Error(`status ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    writeFileSync(ruw, buf);
    console.log(`${item.naam}: ${(buf.length / 1024 / 1024).toFixed(0)} MB opgehaald`);

    if (item.soort === "beeld") {
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
          "-pix_fmt", "yuv420p", "-vf", "scale=1280:-2", "-movflags", "+faststart", `${UIT}/${item.naam}.mp4`]);
      ff(["-y", ...knip, "-i", ruw, "-an", "-c:v", "libx264", "-crf", "27", "-preset", "slow",
          "-pix_fmt", "yuv420p", "-vf", "scale=720:-2", "-movflags", "+faststart", `${UIT}/${item.naam}-mobiel.mp4`]);
      ff(["-y", "-i", `${UIT}/${item.naam}.mp4`, "-vframes", "1", "-f", "image2", `tijdelijk/${item.naam}.png`]);
      await sharp(`tijdelijk/${item.naam}.png`).webp({ quality: 75 }).toFile(`${UIT}/${item.naam}-poster.webp`);
      for (const [b, q] of [[1024, 72], [640, 70]]) {
        await sharp(`tijdelijk/${item.naam}.png`).resize({ width: b }).webp({ quality: q }).toFile(`${UIT}/${item.naam}-poster-${b}.webp`);
      }
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
