# Redirect-mapping oude site naar rebuild

Alle 301-omleidingen die bij livegang actief moeten zijn. De technische
implementatie staat in public/_redirects (Netlify/Cloudflare) en wordt
voor Apache gegenereerd; beide bestanden komen uit deze tabel. Regels:
geen ketens (elke oude URL wijst direct naar het einddoel), verdwenen
content wijst naar de dichtstbijzijnde relevante pagina (nooit blind
naar de homepage), en www/non-www + http/https worden op hostniveau
afgevangen.

## Kernpagina's

| Oude URL | Nieuwe URL | Reden |
| --- | --- | --- |
| /prijsformulier | /prijslijst | duidelijker naam, zelfde functie |
| /blog | /projecten | blog was een tweede projectenoverzicht |
| /blog/categories/nederlands | /projecten | dunne indexpagina |
| /blog/categories/english | /projecten | dunne indexpagina |
| /blog/hashtags/vision2watch | /projecten | dunne indexpagina |
| /blog/hashtags/touchscreen | /producten/touchscreens | dichtstbijzijnde inhoud |
| /blog/hashtags/beurs | /toepassingen/beurzen-en-events | dichtstbijzijnde inhoud |
| /blog/hashtags/beursstand | /toepassingen/beurzen-en-events | dichtstbijzijnde inhoud |
| /blog/hashtags/interactievevloer | /producten/interactieve-vloer | dichtstbijzijnde inhoud |
| /blog/hashtags/tradeshow | /toepassingen/beurzen-en-events | dichtstbijzijnde inhoud |

## Producten

| Oude URL | Nieuwe URL | Reden |
| --- | --- | --- |
| /product/interactieve-vloer | /producten/interactieve-vloer | nieuwe productstructuur |
| /interactieve-vloer | /producten/interactieve-vloer | oud duplicaatpad |
| /product/interactieve-muur | /producten/interactieve-muur | nieuwe productstructuur |
| /product/interactieve-wand | /producten/interactieve-muur | duplicaat samengevoegd |
| /product/interactieve-tafel | /producten/interactieve-tafel | nieuwe productstructuur |
| /product/virtual-chef | /producten/virtual-chef | nieuwe productstructuur |
| /product/virtual-host | /producten/virtual-host | nieuwe productstructuur |
| /virtual-host | /producten/virtual-host | oud pad (was al 404) |
| /product/sketchwall | /producten/sketchwall | nieuwe productstructuur |
| /product/hologram-projectie | /producten/hologram-projectie | nieuwe productstructuur |
| /holografische-projectie | /producten/hologram-projectie | oud duplicaatpad |
| /holobox | /producten/hereweholo | oud pad (was al 403) |
| /product/holografische-molen | /producten/holografische-molen | nieuwe productstructuur |
| /product/hereweholo | /producten/hereweholo | nieuwe productstructuur |
| /product/hereweholo-mini | /producten/hereweholo | lege pagina samengevoegd |
| /product/transparant-scherm | /producten/transparant-scherm | nieuwe productstructuur |
| /product/touchscreen | /producten/touchscreens | categorieterm als slug |
| /product/led-displays | /producten/led-displays | nieuwe productstructuur |
| /product/gebouw-projectie | /producten/gebouw-projectie | nieuwe productstructuur |
| /product/panoramische-projectie | /producten/panoramische-projectie | nieuwe productstructuur |
| /product/mixed-reality | /producten/mixed-reality | nieuwe productstructuur |
| /mixed-reality | /producten/mixed-reality | oud pad (was al 404) |
| /product/logo-animatie | /producten/logo-animatie | nieuwe productstructuur |
| /interactieve-bar | /producten/interactieve-tafel | oud pad (was al 404) |
| /3d-projectie | /producten/panoramische-projectie | oud pad (was al 404) |
| /3d-website-configurator | /producten | oud pad (was al 404); product niet meer in assortiment |

## Projecten

Alle /project/<slug> gaan één-op-één naar /projecten/<slug>:

| Oude URL | Nieuwe URL | Reden |
| --- | --- | --- |
| /project/adidas | /projecten/adidas | nieuwe structuur |
| /project/alpro-interactieve-vloer | /projecten/alpro-interactieve-vloer | nieuwe structuur |
| /project/bloemenbureau-holland | /projecten/bloemenbureau-holland | nieuwe structuur |
| /project/castello | /projecten/castello | nieuwe structuur |
| /project/clinique | /projecten/clinique | nieuwe structuur |
| /project/coffeeshop-marbella | /projecten/coffeeshop-marbella | nieuwe structuur |
| /project/dierenpark-amersfoort | /projecten/dierenpark-amersfoort | nieuwe structuur |
| /project/escher-museum | /projecten/escher-museum | nieuwe structuur |
| /project/euroveiling | /projecten/euroveiling | nieuwe structuur |
| /project/kanon | /projecten/kanon | nieuwe structuur |
| /project/mcdonalds | /projecten/mcdonalds | nieuwe structuur |
| /project/nespresso | /projecten/nespresso | nieuwe structuur |
| /project/nike | /projecten/nike | nieuwe structuur |
| /project/outlet-store-roermond | /projecten/outlet-store-roermond | nieuwe structuur |
| /project/ouwehands-dierenpark | /projecten/ouwehands-dierenpark | nieuwe structuur |
| /project/philips | /projecten/philips | nieuwe structuur |
| /project/pierson-college- | /projecten/pierson-college | slug opgeschoond |
| /project/rtl | /projecten/rtl | nieuwe structuur |
| /project/sea-life | /projecten/sea-life | nieuwe structuur |
| /project/starline | /projecten/starline | nieuwe structuur |
| /project/the-vic-leiden | /projecten/the-vic-leiden | nieuwe structuur |
| /project/tieleman-keukens | /projecten/tieleman-keukens | nieuwe structuur |
| /project/werken-bij-defensie | /projecten/werken-bij-defensie | nieuwe structuur |

## Blogposts

| Oude URL | Nieuwe URL | Reden |
| --- | --- | --- |
| /post/holografische-displays | /kennisbank/wat-is-hologram-projectie | uitlegcontent naar kennisbank |
| /post/interactieve-vloer-voor-defensie-op-dreamhack | /projecten/werken-bij-defensie | zelfde project |
| /post/nieuwe-mobiele-ifloor | /producten/interactieve-vloer | productnieuws naar productpagina |
| /post/virtual-host-ess | /producten/virtual-host | productnieuws naar productpagina |
| /post/interactieve-vloer-ouwehands-dierentuin | /projecten/ouwehands-dierenpark | zelfde project |
| /post/starline-interactieve-vloer-bij-ebben-inspyrium | /projecten/starline | zelfde project |
| /post/dierenpark-amersfoort-de-ooievaart | /projecten/dierenpark-amersfoort | zelfde klant |
| /post/nl-een-nieuw-product-in-samenwerking-met-hereweholo | /producten/hereweholo | productnieuws |
| /post/m-m-interactieve-vloer | /projecten | project zonder eigen pagina |
| /post/johnson-johnson-eurospine-2019-in-helsinki | /toepassingen/beurzen-en-events | beursreferentie |
| /post/augmented-reality | /producten/mixed-reality | productuitleg |
| /post/nieuw-de-virtual-product-presenter | /producten/virtual-host | productvariant |
| /post/we-want-more-zet-hereweholo-boxen-in | /producten/hereweholo | productnieuws |

## Engelse pagina's (/en/...)

De rebuild is bewust eerst Nederlandstalig. Tot de Engelse taalversie
live is, wijzen alle /en/-URL's tijdelijk (301) naar hun Nederlandse
equivalent volgens dezelfde tabellen hierboven (bijv.
/en/product/interactieve-vloer naar /producten/interactieve-vloer,
/en/blog naar /projecten, /en over-ons/contact/privacy e.d. naar de
NL-tegenhanger, en /en zelf naar /). Zodra de EN-versie gebouwd is,
worden deze regels vervangen door de definitieve EN-structuur
(/en/products/interactive-floor enz.) met hreflang.

## Hostniveau

| Bron | Doel |
| --- | --- |
| http://* | https://www.vision2watch.nl/* |
| https://vision2watch.nl/* | https://www.vision2watch.nl/* |
| en.vision2watch.nl/* | https://www.vision2watch.nl/* (tijdelijk, tot EN-versie; daarna naar /en/*) |
