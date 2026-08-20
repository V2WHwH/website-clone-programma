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
