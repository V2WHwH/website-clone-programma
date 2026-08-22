# Vision2watch design system

Het bestaande merk (zwart met oranje accent, woordmerk VISION2WATCH met
oranje "2") is behouden en naar high-end niveau getild. Alle tokens staan
in `src/styles/global.css` (Tailwind 4 `@theme`); dit document beschrijft
de bedoeling erachter.

## Kleuren

| Token | Waarde | Gebruik |
| --- | --- | --- |
| `inkt` | #0b0b0e | paginagrond |
| `nacht` | #131318 | panelen, kaarten, footer |
| `nevel` | #1c1c24 | verhoogde vlakken |
| `lijn` | rgb(255 255 255 / .09) | hairlines, kaders |
| `tekst` | #f5f5f2 | primaire tekst |
| `zacht` | #a8a8b3 | secundaire tekst |
| `dof` | #6d6d78 | bijschriften, tertiair |
| `accent` | #f58220 | hét Vision2watch-oranje: CTA's, kickers, accenten |
| `accent-fel` / `accent-diep` | #ff9a3d / #c2620a | hover / active |

Oranje wordt spaarzaam ingezet (CTA, kicker, pijlen, het woordaccent in
koppen); de fotografie en video's dragen de kleurbeleving.

## Typografie

Eén familie draagt de hele site: **Archivo** (variabel, zelf gehost, 87 kB),
een industriële grotesk met zowel een gewicht- als een breedte-as. Daarnaast
staat **IBM Plex Mono** (14 kB) voor korte technische labels.

- **Koppen**: Archivo op gewicht 800 en breedte 116%, met strakke
  letterspatiëring (-0.025em). Breed en zwaar, als bewegwijzering: dat past
  bij een bedrijf dat installaties bouwt. Onder 640 px valt de breedte terug
  naar 100%, want daar kost extra breedte alleen maar regels.
- **Tekst**: dezelfde familie op normale breedte, gewicht 420. Op een donkere
  grond oogt een gewone 400 dun en grijzig.
- **Knoppen, menu en labels**: gewicht 560, zodat ze meedragen in het stevige
  karakter in plaats van er dun naast te staan.
- **Kickers**: klein, kapitaal, oranje, gewicht 700, ruime tracking.
- **Chips en technische labels**: IBM Plex Mono, klein.
- H1 `text-4xl/6xl`, H2 `text-3xl/5xl`, hiërarchie zonder niveausprongen.

Bewust níet gebruikt: Inter, Space Grotesk, Manrope, Plus Jakarta en
soortgelijke. Die zijn het standaardduo van door AI gegenereerde sites en
maken elke pagina meteen herkenbaar als zodanig — precies wat hier niet moet.

## Ritme en vormen

- Sectiepadding `py-20 md:py-28`; containers `max-w-6xl` met `px-5 md:px-8`.
- Radii bewust klein: `radius-klein` 4 px (knoppen), `radius-kaart` 8 px.
  Geen overdreven ronde hoeken.
- Kaarten: hairline-rand, `nacht`-vlak, beeld met subtiele zoom (1.04) bij
  hover, pijl die 4 px verschuift.
- Secties wisselen `inkt` en `nacht/40` af, gescheiden door hairlines.

## Beweging

- Reveal: elementen schuiven 22 px omhoog en faden in zodra ze in beeld
  komen (IntersectionObserver, alleen met `.js` op html en zonder
  `prefers-reduced-motion`). Zonder JavaScript is alles direct zichtbaar.
- Transities 200 ms (micro) / 700 ms (reveal) met `cubic-bezier(.22,1,.36,1)`.
- Video's: autoplay alleen zonder geluid, met poster, loop en zichtbare
  pauzeknop; bij reduced motion speelt niets automatisch.
- Geen scroll-hijacking, geen parallax-excessen, geen WebGL.

## Componenten

`src/components/ui`: Knop (primair/secundair), Sectie (kicker+kop+lead),
Reveal, Beeld (width/height + lazy). `src/components/site`: Header
(sticky, mobiel menu), Footer, Logo, Kaarten (product/project/sector),
FaqLijst (native details/summary), HeroVideo, LogoBalk (blend-mode zodat
logo's met zwarte achtergrond opgaan in de donkere grond), Kruimelpad,
CtaSectie, Formulier.

## Toegankelijkheid

Zichtbare focusring in accentkleur op alles, skiplink, één H1 per pagina,
labels op elk formulierveld, tikdoelen ≥ 44 px in de navigatie,
reduced-motion gerespecteerd, alt-teksten op alle beelden.
