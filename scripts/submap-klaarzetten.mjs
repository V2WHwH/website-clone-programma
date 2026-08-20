// Zet de gebouwde site klaar voor een host die hem NIET in de webroot
// serveert maar in een submap, zoals GitHub Pages
// (https://gebruiker.github.io/repository/).
//
// De site zelf gaat uit van de webroot: links en media beginnen met "/".
// Dit script zet er eenmalig het submappad voor, in de HTML én in de CSS,
// en geeft de app dat pad mee zodat ook het klikken door de site klopt.
//
// Gebruik: node scripts/submap-klaarzetten.mjs /repository-naam
//
// Dit is uitsluitend bedoeld voor demo- en previewadressen. Op het echte
// domein staat de site in de webroot en hoort dit script niet te draaien.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const basis = (process.argv[2] || "").replace(/\/+$/, "");
if (basis === "") {
  // De site staat in de webroot: er valt niets om te zetten.
  console.log("Geen submap opgegeven: de site blijft op de webroot staan.");
  process.exit(0);
}
if (!basis.startsWith("/")) {
  console.error('Geef het submappad mee, bijvoorbeeld: node scripts/submap-klaarzetten.mjs "/website-clone-programma"');
  process.exit(1);
}

const wortel = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(wortel, "dist");

const bestanden = [];
(function loop(map) {
  for (const naam of readdirSync(map)) {
    const p = join(map, naam);
    if (statSync(p).isDirectory()) loop(p);
    else if (/\.(html|css|js)$/.test(naam)) bestanden.push(p);
  }
})(dist);

// Alleen paden die bij de site zelf horen krijgen het voorvoegsel. Een
// "//" (protocol-relatief), een volledige URL of een anker blijft ongemoeid.
const MAPPEN = "assets|media|fonts|producten|toepassingen|projecten|kennisbank|diensten|over-ons|contact|prijslijst|privacy|algemene-voorwaarden|bedankt|favicon\\.svg|robots\\.txt|llms\\.txt|sitemap\\.xml|404\\.html";

let aantal = 0;
for (const bestand of bestanden) {
  const oud = readFileSync(bestand, "utf8");
  let nieuw = oud;

  if (bestand.endsWith(".html")) {
    // href="/pad", src="/pad", en srcset met meerdere paden. Hoofdletter-
    // ongevoelig: React schrijft het attribuut als srcSet weg.
    nieuw = nieuw.replace(new RegExp(`(href|src)="/(${MAPPEN})`, "gi"), `$1="${basis}/$2`);
    nieuw = nieuw.replace(/(srcset|imagesrcset)="([^"]+)"/gi, (heel, attr, waarde) => {
      const om = waarde
        .split(",")
        .map((deel) => deel.trim().replace(new RegExp(`^/(${MAPPEN})`), `${basis}/$1`))
        .join(", ");
      return `${attr}="${om}"`;
    });
    // links naar de homepage zelf
    nieuw = nieuw.replace(/href="\/"/g, `href="${basis}/"`);
    // het pad waaronder de app draait, zodat klikken binnen de site klopt
    if (!nieuw.includes("data-basispad")) {
      nieuw = nieuw.replace("<html ", `<html data-basispad="${basis}" `);
    }
    // een demo hoort niet in de zoekresultaten naast de echte site
    if (!/name="robots"/.test(nieuw)) {
      nieuw = nieuw.replace("</head>", '  <meta name="robots" content="noindex, nofollow" />\n  </head>');
    }
  } else if (bestand.endsWith(".css")) {
    // CSS: url(/fonts/...) en url(/media/...)
    nieuw = nieuw.replace(new RegExp(`url\\((["']?)/(${MAPPEN})`, "g"), `url($1${basis}/$2`);
  } else {
    // De JavaScript-bundel bevat de mediapaden uit de contentlaag. Zonder
    // deze stap staan de beelden er bij het eerste laden wél (die komen uit
    // de HTML), maar verdwijnen ze zodra React de pagina overneemt.
    // Routepaden worden hier bewust niet aangeraakt: die regelt de router
    // zelf via het basispad.
    nieuw = nieuw.replace(new RegExp(`(["'\`])/(media|fonts)/`, "g"), `$1${basis}/$2/`);
  }

  if (nieuw !== oud) {
    writeFileSync(bestand, nieuw);
    aantal++;
  }
}

console.log(`Submap ${basis}: ${aantal} van ${bestanden.length} bestanden aangepast.`);
