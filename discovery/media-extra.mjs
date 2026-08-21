// Haalt extra bewegend beeld op voor de rebuild.
//
// 1. De vier video's van de huidige site. Wix bewaart per video meerdere
//    kwaliteiten; bij de eerste ronde zijn er twee mislukt en werden de
//    andere twee op de laagst genoemde kwaliteit gepakt. Hier proberen we
//    per video van hoog naar laag tot er één binnenkomt.
// 2. Het openbare Instagram-profiel, om te zien welke projectvideo's daar
//    staan. Instagram blokkeert dit vaak; het resultaat wordt opgeslagen
//    zodat we weten wat er wel of niet uitkwam.
import { mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";

const UIT = "discovery/media-bron/video";
mkdirSync(UIT, { recursive: true });

const VIDEOS = {
  "87e7bf_33eccef94b504f27b46a76942fc68da6": "dreamhack",
  "87e7bf_03d95df2803a4e0784bc5411d3b6610b": "hologram-displays",
  "87e7bf_3b3db017b4de44abb370a152e2a25e9e": "hologram-artikel",
  "87e7bf_d78e27e0fb60462d822a78912d5098e9": "starline-ebben",
};
const KWALITEITEN = ["1080p", "720p", "480p", "360p"];
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const isVideo = (buf) => buf.length > 100000 && buf.subarray(4, 8).toString("latin1") === "ftyp";

for (const [id, naam] of Object.entries(VIDEOS)) {
  let gelukt = false;
  for (const kw of KWALITEITEN) {
    const url = `https://video.wixstatic.com/video/${id}/${kw}/mp4/file.mp4`;
    try {
      const r = await fetch(url, { headers: { "user-agent": UA, referer: "https://www.vision2watch.nl/" } });
      if (!r.ok) { console.log(`  ${naam} ${kw}: status ${r.status}`); continue; }
      const buf = Buffer.from(await r.arrayBuffer());
      if (!isVideo(buf)) { console.log(`  ${naam} ${kw}: geen video (${buf.length} bytes)`); continue; }
      writeFileSync(`${UIT}/${naam}-${kw}.mp4`, buf);
      console.log(`OK ${naam}: ${kw}, ${(buf.length / 1024 / 1024).toFixed(1)} MB`);
      gelukt = true;
      break;
    } catch (e) {
      console.log(`  ${naam} ${kw}: ${e.message}`);
    }
  }
  if (!gelukt) console.log(`MISLUKT: ${naam}`);
}

// Instagram: alleen kijken wat er openbaar bereikbaar is.
const rapport = [];
for (const [naam, url] of [
  ["profielpagina", "https://www.instagram.com/vision2watch/"],
  ["profiel-json", "https://www.instagram.com/api/v1/users/web_profile_info/?username=vision2watch"],
]) {
  try {
    const r = await fetch(url, { headers: { "user-agent": UA, "x-ig-app-id": "936619743392459" } });
    const tekst = await r.text();
    rapport.push(`${naam}: status ${r.status}, ${tekst.length} tekens`);
    if (r.ok && tekst.length > 1000) {
      writeFileSync(`discovery/instagram-${naam}.txt`, tekst.slice(0, 400000));
      const videos = [...tekst.matchAll(/"video_url":"([^"]+)"/g)].map((m) => m[1].replace(/\\u0026/g, "&"));
      rapport.push(`  video-URLs gevonden: ${videos.length}`);
      if (videos.length) writeFileSync("discovery/instagram-videos.txt", videos.join("\n"));
    }
  } catch (e) {
    rapport.push(`${naam}: fout ${e.message}`);
  }
}
writeFileSync("discovery/instagram-rapport.txt", rapport.join("\n"));
console.log("\nInstagram:\n" + rapport.join("\n"));
