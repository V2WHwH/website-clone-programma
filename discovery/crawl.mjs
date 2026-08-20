// Discovery-crawl van de huidige vision2watch.nl.
// Draait in een GitHub Actions-runner (de bouwomgeving zelf heeft geen vrij
// internet). Output: discovery/crawl/ met urls.txt, index.json,
// media-urls.txt en pages.tar.gz (alle HTML, gzipt).
import { mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const HOOFD = "https://www.vision2watch.nl";
const MAX_PAGINAS = 500;
const UA = "Mozilla/5.0 (compatible; V2WRebuildDiscovery/1.0; +rebuild-inventarisatie)";

const uit = "discovery/crawl";
mkdirSync(`${uit}/pages`, { recursive: true });

const haal = async (url, alsText = true) => {
  try {
    const r = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow" });
    const body = alsText ? await r.text() : null;
    return { status: r.status, url: r.url, body, type: r.headers.get("content-type") || "" };
  } catch (e) {
    return { status: 0, url, body: null, fout: String(e) };
  }
};

// 1. robots + sitemap(s)
const robots = await haal(`${HOOFD}/robots.txt`);
if (robots.body) writeFileSync(`${uit}/robots.txt`, robots.body);

const sitemapUrls = new Set();
const leesSitemap = async (url, diepte = 0) => {
  if (diepte > 3) return;
  const r = await haal(url);
  if (!r.body || r.status !== 200) return;
  writeFileSync(`${uit}/sitemap-${sitemapUrls.size}-${url.split("/").pop().replace(/[^\w.-]/g, "_")}`, r.body);
  const locs = [...r.body.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());
  for (const loc of locs) {
    if (/\.xml(\?|$)/.test(loc)) await leesSitemap(loc, diepte + 1);
    else sitemapUrls.add(loc);
  }
};
await leesSitemap(`${HOOFD}/sitemap.xml`);
// robots kan extra sitemaps noemen
for (const m of (robots.body || "").matchAll(/sitemap:\s*(\S+)/gi)) await leesSitemap(m[1]);

// 2. BFS vanaf de homepage + alle sitemap-URL's
const normaliseer = (u) => {
  try {
    const url = new URL(u, HOOFD);
    if (!/(^|\.)vision2watch\.nl$/.test(url.hostname)) return null;
    url.hash = "";
    url.search = "";
    let p = url.pathname.replace(/\/+$/, "");
    return `${HOOFD}${p || "/"}`;
  } catch {
    return null;
  }
};

const wachtrij = [normaliseer("/"), ...[...sitemapUrls].map(normaliseer).filter(Boolean)];
const gezien = new Set(wachtrij);
const index = [];
const mediaUrls = new Set();

const pakLinks = (html) => {
  const links = new Set();
  for (const m of html.matchAll(/<a[^>]+href="([^"#]+)"/g)) {
    const n = normaliseer(m[1]);
    if (n && !/\.(pdf|jpe?g|png|webp|gif|svg|mp4|webm|zip|docx?)$/i.test(n)) links.add(n);
  }
  return links;
};
const pakMedia = (html, basis) => {
  const pats = [
    /<img[^>]+src="([^"]+)"/g,
    /<img[^>]+srcset="([^"]+)"/g,
    /<(?:video|source)[^>]+src="([^"]+)"/g,
    /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/g,
    /background-image:\s*url\(([^)]+)\)/g,
    /"(https:\/\/static\.wixstatic\.com\/[^"]+)"/g,
    /"(https:\/\/video\.wixstatic\.com\/[^"]+)"/g,
  ];
  for (const p of pats)
    for (const m of html.matchAll(p))
      for (const stuk of m[1].split(","))
        try {
          const u = new URL(stuk.trim().split(" ")[0].replace(/^['"]|['"]$/g, ""), basis);
          if (/\.(jpe?g|png|webp|gif|svg|avif|mp4|webm|mov|pdf)(\?|$)/i.test(u.pathname) || /wixstatic/.test(u.hostname))
            mediaUrls.add(u.href);
        } catch {}
};

let n = 0;
while (wachtrij.length && index.length < MAX_PAGINAS) {
  const url = wachtrij.shift();
  const r = await haal(url);
  n++;
  const rij = { url, status: r.status, eindUrl: r.url };
  if (r.body && r.status === 200 && /text\/html/.test(r.type)) {
    const naam = (new URL(url).pathname.replace(/^\/|\/$/g, "").replace(/[^\w-]/g, "_") || "home") + ".html";
    writeFileSync(`${uit}/pages/${naam}`, r.body);
    rij.bestand = naam;
    rij.titel = (r.body.match(/<title[^>]*>([^<]*)<\/title>/) || [])[1] || "";
    rij.description = (r.body.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/) || [])[1] || "";
    rij.canonical = (r.body.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/) || [])[1] || "";
    for (const l of pakLinks(r.body))
      if (!gezien.has(l)) {
        gezien.add(l);
        wachtrij.push(l);
      }
    pakMedia(r.body, url);
  }
  index.push(rij);
  if (n % 25 === 0) console.log(`${n} opgehaald, ${wachtrij.length} in wachtrij`);
}

writeFileSync(`${uit}/index.json`, JSON.stringify(index, null, 1));
writeFileSync(`${uit}/urls.txt`, index.map((r) => `${r.status}\t${r.url}`).join("\n"));
writeFileSync(`${uit}/media-urls.txt`, [...mediaUrls].sort().join("\n"));
writeFileSync(`${uit}/sitemap-urls.txt`, [...sitemapUrls].sort().join("\n"));

execSync(`tar -czf ${uit}/pages.tar.gz -C ${uit} pages && rm -rf ${uit}/pages`);
console.log(`Klaar: ${index.length} pagina's, ${mediaUrls.size} media-URL's, ${sitemapUrls.size} sitemap-URL's`);
