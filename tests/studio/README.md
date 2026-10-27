# Studio-tests

Automatische tests van de Studio (`studio/index.html`) in een echte browser
(Chromium via Playwright). Ze klikken, tikken en typen zoals iemand op de
holobox dat doet, en kijken wat er gebeurt.

| Test | Wat hij controleert |
|---|---|
| `rooktest` | Geen menuknoppen op het scherm, menu met 5× tikken, alle tabbladen zonder fouten |
| `kliktest` | Reeks met klikker: volgorde op nummer, wachtlus, `>` via de wachtvideo, `<` 1× opnieuw en 2× vorige, naadloos naar beeld 0 |
| `playlisttest` | Screensaver: video's aantikken, geen dubbele, verder met de volgende, kapotte en vastgelopen video overslaan |
| `muziektest` | Muziek bij de screensaver uit een bestand: doorlopend, één keer, met pauze, stil tijdens een knopvideo |
| `streamtest` | Muziek van internet: adressen herkennen, directe stream, YouTube en SoundCloud (met nagebootste spelers) |
| `toetsenbordtest` | Toetsenbord op het scherm, invoervenster, PIN, niets daarvan met een muis |
| `layouttest` | Alle sjablonen zonder overlappende knoppen, menu zonder uitsteeksels, op vier schermformaten |

## Draaien

```
cd tests/studio
npm install
npx playwright install chromium
npm run media     # testvideo's en -muziek maken (heeft ffmpeg nodig)
npm test          # alles; of: node alles.js kliktest playlisttest
```

Een test die faalt krijgt één tweede kans, omdat een paar controles tijd meten
in honderden milliseconden. Faalt hij twee keer, dan is er echt iets mis.

De echte YouTube- en SoundCloud-spelers en de Windows-installer worden getest
in de Windows-build (`.github/workflows/desktop-build.yml`).
