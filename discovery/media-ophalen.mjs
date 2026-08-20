// Haalt alle unieke media uit discovery/media-register.json op via de runner
// (de bouwomgeving heeft geen vrij internet). Beelden op max 1600 breed,
// video's als mp4 (1280 breed, crf 25) met posterframe. Botmuur-detectie op
// de eerste bytes: alleen echte beelden/video's worden geaccepteerd.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const register = JSON.parse(readFileSync("discovery/media-register.json", "utf8"));
const uit = "discovery/media-bron";
mkdirSync(`${uit}/beeld`, { recursive: true });
mkdirSync(`${uit}/video`, { recursive: true });

const isEchtBeeld = (buf) => {
  const b = new Uint8Array(buf.slice(0, 12));
  if (b[0] === 0xff && b[1] === 0xd8) return true; // jpg
  if (b[0] === 0x89 && b[1] === 0x50) return true; // png
  if (b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57) return true; // webp
  if (b[0] === 0x47 && b[1] === 0x49) return true; // gif
  return false;
};

let ok = 0, fout = 0;
for (const [id, info] of Object.entries(register)) {
  try {
    if (id.startsWith("VIDEO:")) {
      const vid = id.slice(6);
      const doel = `${uit}/video/${vid}.mp4`;
      if (existsSync(doel)) continue;
      const bron = `https://video.wixstatic.com/video/${vid}/1080p/mp4/file.mp4`;
      const ruw = `${uit}/video/${vid}-ruw.mp4`;
      try {
        execSync(`curl -sSL --max-time 240 --retry 2 -o ${ruw} "${bron}"`);
      } catch {
        execSync(`curl -sSL --max-time 240 --retry 2 -o ${ruw} "https://video.wixstatic.com/video/${vid}/720p/mp4/file.mp4"`);
      }
      execSync(`ffmpeg -y -loglevel error -i ${ruw} -vf "scale=1280:-2" -c:v libx264 -crf 25 -preset slow -an -movflags +faststart ${doel}`);
      execSync(`ffmpeg -y -loglevel error -i ${doel} -vframes 1 -q:v 3 ${uit}/video/${vid}-poster.jpg`);
      execSync(`rm -f ${ruw}`);
      ok++;
      continue;
    }
    const doel = `${uit}/beeld/${id.replace(/[^\w.]/g, "_")}`;
    if (existsSync(doel + ".jpg") || existsSync(doel + ".png")) continue;
    const url = `https://static.wixstatic.com/media/${id}/v1/fit/w_1600,h_1600,q_85/beeld.jpg`;
    const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (V2WRebuild media)" } });
    if (!r.ok) throw new Error(`status ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    if (!isEchtBeeld(buf)) throw new Error("geen beeldbestand (botmuur?)");
    writeFileSync(doel + ".jpg", buf);
    ok++;
  } catch (e) {
    fout++;
    console.log(`FOUT ${id}: ${e.message}`);
  }
}
console.log(`media-ophalen: ${ok} gelukt, ${fout} mislukt`);
