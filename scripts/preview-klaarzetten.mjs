// Zet de gebouwde site (dist/) klaar als preview op een tijdelijk adres.
//
// Een preview mag niet in Google terechtkomen: hij zou concurreren met de
// echte vision2watch.nl en bezoekers naar een adres sturen dat straks
// verdwijnt. Daarom voegt dit script een noindex-kop toe voor álle paden.
//
// Bewust géén "Disallow: /" in robots.txt: een geblokkeerde pagina kan een
// zoekmachine niet lezen, en dan kan hij de noindex-instructie ook niet
// zien: het adres belandt dan alsnog zonder inhoud in de index. Crawlen
// toestaan en noindex meegeven is de manier die wél werkt.
//
// Draai dit ná `npm run build` en vóór een preview-deploy. De volgende
// build wist het weer, zodat een echte livegang nooit per ongeluk met een
// noindex de lucht in gaat.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const wortel = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(wortel, "dist");

if (!existsSync(dist)) {
  console.error("dist/ bestaat niet. Draai eerst: npm run build");
  process.exit(1);
}

const kopBestand = join(dist, "_headers");
const bestaand = existsSync(kopBestand) ? readFileSync(kopBestand, "utf8") : "";

if (bestaand.includes("X-Robots-Tag")) {
  console.log("Preview: noindex stond er al in.");
} else {
  const previewBlok = [
    "",
    "# --- Alleen voor de preview-omgeving ---",
    "# Deze regels horen NIET op het echte domein. Ze worden bij elke",
    "# nieuwe build overschreven; zie scripts/preview-klaarzetten.mjs.",
    "/*",
    "  X-Robots-Tag: noindex, nofollow",
    "",
  ].join("\n");
  writeFileSync(kopBestand, bestaand.trimEnd() + "\n" + previewBlok);
  console.log("Preview: noindex-kop toegevoegd voor alle paden.");
}

// Een zichtbare markering in de bron, zodat niemand een preview per
// ongeluk aanziet voor de echte site.
const home = join(dist, "index.html");
const html = readFileSync(home, "utf8");
if (!html.includes("preview-omgeving")) {
  writeFileSync(home, html.replace("</head>", "  <!-- preview-omgeving: niet het echte domein -->\n  </head>"));
}

console.log("dist/ is klaar als preview.");
