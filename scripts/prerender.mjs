// Prerender-stap: schrijft elke route als echt HTML-bestand (route/index.html).
// De bezoeker en de zoekmachine krijgen kant-en-klare HTML; React hydrateert
// daarna alleen voor interactie. Zie kennisbank 01-architectuur.md.
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const wortel = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(wortel, "dist");
const ssr = join(wortel, "dist-ssr");

const sjabloon = readFileSync(join(dist, "index.html"), "utf8");
const { render, routes } = await import(pathToFileURL(join(ssr, "entry-server.js")).href);

let fouten = 0;
for (const pad of routes()) {
  try {
    const { html, head } = render(pad);
    let pagina = sjabloon.replace("<!--app-head-->", head).replace("<!--app-html-->", html);
    // taal van de route in het lang-attribuut
    const lang = pad.match(/^\/(en|de|fr)(\/|$)/)?.[1] || "nl";
    pagina = pagina.replace('<html lang="nl">', `<html lang="${lang}">`);
    const doelmap = pad === "/" ? dist : join(dist, pad.slice(1));
    mkdirSync(doelmap, { recursive: true });
    writeFileSync(join(doelmap, "index.html"), pagina);
  } catch (e) {
    fouten++;
    console.error(`PRERENDER FOUT ${pad}: ${e.message}`);
  }
}

// 404-pagina: de /404-route onder zijn eigen naam wegschrijven
if (existsSync(join(dist, "404", "index.html"))) {
  cpSync(join(dist, "404", "index.html"), join(dist, "404.html"));
  rmSync(join(dist, "404"), { recursive: true });
}

if (fouten) {
  console.error(`${fouten} route(s) faalden; build afgebroken.`);
  process.exit(1);
}
console.log(`Prerender klaar: ${routes().length} routes.`);
