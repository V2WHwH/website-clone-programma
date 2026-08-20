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
    let { html, head } = render(pad);
    // React 19 hoist <link rel="preload"> voor prioriteitsbeelden naar het
    // begin van de stream (binnen #root). Verplaats ze naar de head, anders
    // ontstaat een hydration-mismatch.
    const preloads = [];
    html = html.replace(/<link rel="preload"[^>]*>/g, (m) => {
      preloads.push(m);
      return "";
    });
    if (preloads.length) head += "\n    " + preloads.join("\n    ");
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

// sitemap.xml uit dezelfde routelijst: alleen echte, indexeerbare pagina's
const HOOFD = "https://www.vision2watch.nl";
const NIET_IN_SITEMAP = new Set(["/bedankt", "/404"]);
const vandaag = new Date().toISOString().slice(0, 10);
const smUrls = routes().filter((r) => !NIET_IN_SITEMAP.has(r));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${smUrls
  .map((r) => `  <url><loc>${HOOFD}${r === "/" ? "/" : r}</loc><lastmod>${vandaag}</lastmod></url>`)
  .join("\n")}\n</urlset>\n`;
writeFileSync(join(dist, "sitemap.xml"), sitemap);

console.log(`Prerender klaar: ${routes().length} routes, sitemap met ${smUrls.length} URL's.`);
