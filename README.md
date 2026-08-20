# Vision2watch Rebuild

Volledige rebuild van [vision2watch.nl](https://www.vision2watch.nl): een
statisch geprerenderde, Nederlandstalige marketingsite die Vision2Watch
positioneert als specialist in interactieve audiovisuele technologie.
Gebouwd volgens de meegeleverde kennisbank websitebouw (zie
`docs/discovery-rapport.md` voor de volledige analyse).

## Stack

- **Vite 8 + React 19 + TypeScript + Tailwind CSS 4**
- **Eigen prerender-stap**: elke route wordt als echt HTML-bestand
  weggeschreven (`route/index.html`). Bezoekers en crawlers krijgen
  kant-en-klare HTML; React hydrateert daarna alleen voor interactie.
- **Geen CMS, geen database**: alle content staat in TypeScript-bestanden;
  elke wijziging is een commit.
- Zelf-gehoste variabele fonts (Space Grotesk + Inter), alle media op de
  eigen server, geen externe runtime-afhankelijkheden.

## Ontwikkelen

```bash
npm install
npm run dev        # ontwikkelserver
npm run typecheck  # TypeScript-controle
npm run build      # prebuild-mediacheck + client- en SSR-build + prerender + sitemap
npm run qa         # metadata- en feitencontrole + interne links + omleidingen
npm run preview    # dist/ lokaal serveren (poort via --port)
```

`npm run qa` bestaat uit drie stappen die elk met exitcode 1 falen:
`qa-rapport.mjs` (unieke titels en descriptions, canonicals, één H1,
parsende JSON-LD, plus een controle dat geschrapte beweringen niet
terugkeren), `linkcontrole.mjs` (geen kapotte interne links, elke pagina
minimaal twee inkomende links) en `redirectcontrole.mjs` (elk adres uit de
crawl van de oude site wordt opgevangen, het doel bestaat, geen ketens).

Audits draaien tegen een lokale server. Start die eerst en geef het adres
mee met `AUDIT_BASIS` als je een andere poort gebruikt dan 4390:

```bash
npm run preview -- --port 4390
npm run audit:statisch   # metadata, OG, JSON-LD, alt-teksten, gewichten (P0-P3)
npm run audit:runtime    # Playwright: console, LCP/CLS, mobiel, formulier
npm run audit:a11y       # toegankelijkheidsheuristieken
node scripts/schermafdrukken.mjs   # schermafdrukken op 375-1920 px
```

Lighthouse heeft in deze omgeving een expliciet browserpad nodig:

```bash
CHROME_PATH=/opt/pw-browsers/chromium npx lighthouse http://localhost:4390/ \
  --chrome-flags="--headless --no-sandbox" --view
```

## Structuur

```
src/content/nl/     alle teksten: producten, projecten, sectoren, kennisbank
src/content/types.ts het gedeelde contenttype (klaar voor meertaligheid)
src/data/site.ts    bedrijfsgegevens: één bron van waarheid
src/seo/            metadata, head-builder en JSON-LD per paginatype
src/components/     ui- en sitecomponenten
src/pages/          de pagina's
public/             media, fonts, robots.txt, llms.txt, _redirects, _headers
scripts/            prerender, QA, audits, media-pipeline
discovery/          crawl van de oude site + bronmedia (naslag)
docs/               ontwerp- en opleverdocumentatie
```

Belangrijke documenten in de hoofdmap: `content-inventory.md` (oud naar
nieuw), `redirects.md` (301-plan), `seo-strategy.md` (zoekwoorden,
structured data, GEO). In `docs/`: discovery-rapport, design system,
deployment, `ontbrekende-assets.md` (wat de opdrachtgever nog moet
aanleveren en welke gegevens bewust zijn weggelaten) en `eindrapport.md`.

## Contentregels

- Bedrijfsgegevens alleen wijzigen in `src/data/site.ts`.
- Media vervangen = bestand hernoemen (cachebeleid: media staat een week
  in de browsercache). Herkomst per bestand: `scripts/media-herkomst.json`.
- Geen verzonnen feiten, prijzen of reviews; structured data beschrijft
  alleen wat zichtbaar en waar is. Elke feitelijke bewering moet terug te
  vinden zijn in de crawl van de huidige site (`discovery/crawl`) of door
  de opdrachtgever bevestigd zijn. Wat niet klopte staat met reden in
  `docs/ontbrekende-assets.md`; `npm run qa` bewaakt dat die beweringen
  niet ongemerkt terugkeren.
- Elke wijziging door de hele pijplijn (typecheck, build, qa) vóór push.

## Meertaligheid (voorbereid, nog niet actief)

De contentlaag heeft één gedeeld type; een tweede taal toevoegen betekent
`src/content/en/` vullen, taaleigen slugs registreren en hreflang activeren
in `src/seo/head.ts`. De URL-structuur (hoofdtaal zonder voorvoegsel,
andere talen onder `/en/` met eigen slugs) staat beschreven in de
kennisbank en in `redirects.md`.

## Deployment

Zie `docs/deployment.md`. Kort: `dist/` is de complete site; `_redirects`
en `_headers` bedienen Netlify/Cloudflare Pages, voor Apache wordt een
`.htaccess` gegenereerd met `node scripts/htaccess-genereren.mjs`.
De site vervangt vision2watch.nl pas na expliciete goedkeuring; zie het
eindrapport voor de livegangstappen.
