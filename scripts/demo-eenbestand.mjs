// Maakt van de gebouwde site één zelfstandig HTML-bestand: alle stijlen,
// lettertypen, beelden, video's en de app zitten erin. Handig om de site te
// laten zien zonder server, host of internetverbinding.
//
// Werking: de homepage is de startpagina; daarna neemt de app het over en
// gaat het klikken door de site gewoon door, want alle teksten van alle
// pagina's zitten al in de bundel. Media wordt niet meer opgehaald maar uit
// een ingebouwde tabel gelezen.
//
// Dit is een demobestand, geen oplevering: de echte site wordt als losse
// pagina's op een host gezet (zie docs/deployment.md).
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const wortel = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(wortel, "dist");
const uit = process.argv[2] || join(wortel, "vision2watch-demo.html");

const MIME = { ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".mp4": "video/mp4" };
const alsData = (pad) => {
  const vol = join(dist, pad.replace(/^\//, ""));
  if (!existsSync(vol)) return null;
  return `data:${MIME[extname(vol)] || "application/octet-stream"};base64,${readFileSync(vol).toString("base64")}`;
};

let html = readFileSync(join(dist, "index.html"), "utf8");

// 1. stijlen erin, met de lettertypen als data-URI
const cssPad = html.match(/href="(\/assets\/[^"]+\.css)"/)?.[1];
let css = readFileSync(join(dist, cssPad.replace(/^\//, "")), "utf8");
css = css.replace(/url\((["']?)(\/fonts\/[^)"']+)\1\)/g, (heel, q, pad) => {
  const data = alsData(pad);
  return data ? `url(${data})` : heel;
});
// Let op: de vervangtekst gaat via een functie. Doe je dat niet, dan leest
// String.replace tekens als $' en $& in de CSS of de bundel als patroon en
// plakt hij stukken van de pagina in zichzelf.
html = html.replace(new RegExp(`<link[^>]+href="${cssPad}"[^>]*>`), () => `<style>${css}</style>`);

// 2. de app erin
const jsPad = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1];
const js = readFileSync(join(dist, jsPad.replace(/^\//, "")), "utf8");
html = html.replace(new RegExp(`<script[^>]+src="${jsPad}"[^>]*></script>`), () => "");

// 3. alle media die de site gebruikt in een tabel zetten. Voor video's
// gebruiken we bewust de lichtere mobiele versie: één bestand van enkele
// megabytes blijft zo hanteerbaar om te delen.
const paden = new Set();
for (const bron of [js, html]) {
  for (const m of bron.matchAll(/\/media\/[\w./-]+?\.(webp|mp4)/g)) paden.add(m[0]);
}
// Elk beeld gaat er één keer in, in de 640px-versie: ruim genoeg om het
// ontwerp te beoordelen en het scheelt het verschil tussen een bestand van
// twintig megabyte en eentje van vier. Alle varianten van hetzelfde beeld
// (basis, -640, -1024) wijzen naar diezelfde ene kopie.
const kiesBestand = (pad) => {
  if (pad.endsWith(".mp4")) {
    const mobiel = pad.replace(/(-mobiel)?\.mp4$/, "-mobiel.mp4");
    return existsSync(join(dist, mobiel.replace(/^\//, ""))) ? mobiel : pad;
  }
  const klein = pad.replace(/(-\d+)?\.webp$/, "-640.webp");
  return existsSync(join(dist, klein.replace(/^\//, ""))) ? klein : pad;
};

const uniek = new Map(); // bestandspad -> volgnummer in de datalijst
const tabel = {};        // gevraagd pad -> volgnummer
let bytes = 0;
for (const pad of paden) {
  const bestandsPad = kiesBestand(pad);
  if (!existsSync(join(dist, bestandsPad.replace(/^\//, "")))) continue;
  if (!uniek.has(bestandsPad)) {
    uniek.set(bestandsPad, uniek.size);
    bytes += statSync(join(dist, bestandsPad.replace(/^\//, ""))).size;
  }
  tabel[pad] = uniek.get(bestandsPad);
}
const datalijst = [...uniek.keys()].map((p) => alsData(p));
const favicon = alsData("/favicon.svg");

// 4. de omzetting die de site aan die tabel koppelt
const koppelscript = `
(function () {
  var DATA = ${JSON.stringify(datalijst)};
  var INDEX = ${JSON.stringify(tabel)};
  var MEDIA = {};
  for (var pad in INDEX) MEDIA[pad] = DATA[INDEX[pad]];
  // Dit bestand staat op zichzelf: de app moet adressen achter een hekje
  // gebruiken, anders zoekt de browser bij het doorklikken naar bestanden
  // die hier niet bestaan.
  document.documentElement.dataset.demo = "1";

  function omzetten(el) {
    if (el.tagName === "IMG" || el.tagName === "SOURCE" || el.tagName === "VIDEO") {
      var s = el.getAttribute("src");
      if (s && MEDIA[s]) el.setAttribute("src", MEDIA[s]);
      var p = el.getAttribute("poster");
      if (p && MEDIA[p]) el.setAttribute("poster", p in MEDIA ? MEDIA[p] : p);
      // een srcset heeft hier geen zin meer: alles zit al in het bestand
      if (el.getAttribute("srcset")) el.removeAttribute("srcset");
      if (el.tagName === "SOURCE" && el.parentElement && el.parentElement.tagName === "VIDEO") {
        el.parentElement.load();
      }
    }
  }
  function alles(wortel) {
    omzetten(wortel);
    if (wortel.querySelectorAll) wortel.querySelectorAll("img,source,video").forEach(omzetten);
  }
  alles(document.documentElement);
  new MutationObserver(function (lijst) {
    lijst.forEach(function (m) {
      m.addedNodes.forEach(function (n) { if (n.nodeType === 1) alles(n); });
      if (m.type === "attributes" && m.target.nodeType === 1) omzetten(m.target);
    });
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "srcset", "poster"] });
})();
`;

// preload-regels wijzen naar bestanden die hier niet los bestaan
html = html.replace(/<link rel="preload"[^>]*>/g, "");
if (favicon) html = html.replace(/<link rel="icon"[^>]*>/, () => `<link rel="icon" href="${favicon}" />`);
// een demo hoort nergens geïndexeerd te worden
if (!/name="robots"/.test(html)) html = html.replace("</head>", '  <meta name="robots" content="noindex, nofollow" />\n</head>');

html = html.replace("</body>", () => `<script>${koppelscript}</script>\n<script type="module">${js}</script>\n</body>`);

writeFileSync(uit, html);
console.log(`Demo geschreven: ${uit}`);
console.log(`  ${uniek.size} mediabestanden ingesloten voor ${Object.keys(tabel).length} verwijzingen (${(bytes / 1024 / 1024).toFixed(1)} MB bron)`);
console.log(`  eindbestand: ${(statSync(uit).size / 1024 / 1024).toFixed(1)} MB`);
