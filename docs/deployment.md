# Deployment

De site is volledig statisch: `dist/` bevat na `npm run build` de complete
site (HTML per route, assets, media, redirects en headers). Er is geen
server-runtime nodig.

## Bouwen

```bash
npm install
npm run build      # dist/ is het opleverbare resultaat
npm run qa         # hoort groen te zijn vóór elke oplevering
node scripts/htaccess-genereren.mjs   # alleen nodig voor Apache-hosting
```

## Netlify / Cloudflare Pages (aanbevolen voor preview)

- Publiceer de map `dist/` (build command `npm run build`).
- `public/_redirects` en `public/_headers` worden automatisch toegepast;
  `404.html` wordt automatisch de 404-pagina.
- **Formulieren**: de contact- en prijslijstformulieren zijn opgezet voor
  Netlify Forms (`data-netlify`). Op Netlify werken ze direct; stel in het
  Netlify-dashboard e-mailnotificaties naar info@vision2watch.nl in.

## Apache (klassieke hosting)

- Upload de **inhoud** van `dist/` naar de webroot, inclusief het
  verborgen bestand `.htaccess` (genereren met
  `node scripts/htaccess-genereren.mjs`).
- De `.htaccess` regelt: https + www, alle 301's, echte 404, cache en
  veiligheidskoppen.
- **Formulieren**: op Apache is een endpoint nodig (bijv. een klein
  `formulier.php` dat mailt naar info@vision2watch.nl en doorstuurt naar
  `/bedankt`). Pas dan het `action`-attribuut in
  `src/components/site/Formulier.tsx` aan. Dit is een bewuste open
  keuze; zie het eindrapport.

## nginx

```
root /var/www/vision2watch;
index index.html;
location / { try_files $uri $uri/index.html =404; }
error_page 404 /404.html;
```

Redirects uit `redirects.md` overnemen als `return 301`-regels.

## Domein en DNS (pas na goedkeuring)

1. Preview volledig controleren (zie docs/eindrapport en checklists).
2. Hoofddomein www.vision2watch.nl naar de nieuwe host wijzen;
   vision2watch.nl (zonder www) en en.vision2watch.nl 301 naar www.
3. Direct na livegang: homepage, één productpagina, één project, één
   kennisbankartikel, één oude URL (301-test), een verzonnen URL (404) en
   het formulier testen.
4. Google Search Console en Bing Webmaster Tools: verifiëren en
   sitemap.xml aanmelden. De verificatie-metatag kan in
   `src/seo/head.ts` worden toegevoegd zodra de eigenaar de code heeft.

## Environment variables / secrets

De site gebruikt er geen. Er staan geen API-keys of tokens in de
repository; analytics is bewust nog niet geplaatst (zie eindrapport).

## Preview-omgeving (tijdelijk adres, vóór livegang)

Er staat een Netlify-site klaar voor de preview:

- Naam: `vision2watch-rebuild-preview`
- Adres: https://vision2watch-rebuild-preview.netlify.app
- Site-id: `52c62018-ab1b-4c45-826a-412cbbc5753b`
- Beheer: https://app.netlify.com/projects/vision2watch-rebuild-preview

De ontwikkelomgeving waarin deze site is gebouwd mag zelf geen verbinding
met Netlify maken (het netwerkbeleid van die omgeving blokkeert
`api.netlify.com` en `netlify-mcp.netlify.app`). Publiceren gebeurt daarom
van buitenaf, op een van deze twee manieren.

### A. Netlify laten bouwen vanuit GitHub (aanbevolen)

Geen token nodig en elke push publiceert vanzelf:

1. Open https://app.netlify.com/projects/vision2watch-rebuild-preview
2. **Project configuration > Build & deploy > Link repository**
3. Kies de repository en als branch `claude/vision2watch-rebuild-uf0biw`
4. Build command en publish directory komen uit `netlify.toml`
   (`npm run build && node scripts/preview-klaarzetten.mjs`, map `dist`)

### B. Publiceren vanuit GitHub Actions

De workflow `.github/workflows/netlify-preview.yml` staat klaar. Eenmalig:

1. Maak in Netlify een persoonlijk toegangstoken
   (User settings > Applications > Personal access tokens)
2. Zet dat in GitHub onder Settings > Secrets and variables > Actions als
   secret `NETLIFY_AUTH_TOKEN`
3. Start de workflow via Actions > netlify-preview > Run workflow

Daarna publiceert elke push naar de werkbranch de preview opnieuw.

### De preview staat bewust op noindex

`scripts/preview-klaarzetten.mjs` zet na de build een
`X-Robots-Tag: noindex, nofollow` op alle paden zolang het adres niet
vision2watch.nl is. Zo verschijnt de preview niet naast de echte site in
Google. Op het echte domein doet dat script niets, dus de livegang kan
nooit per ongeluk met een noindex gebeuren.

Let op: het formulier werkt op de preview pas als Netlify Forms voor deze
site is ingeschakeld (Project configuration > Forms). Netlify herkent het
formulier automatisch bij de eerste deploy die het bevat.
