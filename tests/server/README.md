# Servertest

Automatische test van het beheerplatform (`server.js`, `lib/`, `routes/`,
`public/admin`, `public/player`) en van de koppeling met de Studio
(`studio/index.html`).

`servertest.js` start alles zelf:

- kopieert `server.js`, `lib/`, `routes/` en `public/` naar een tijdelijke map
  (de server schrijft altijd naar `data/` en `media/` naast `server.js`; zo
  blijft de echte `data/` van de ontwikkelaar onaangeroerd);
- start die kopie op een vrije poort, met een eigen `ADMIN_PASSWORD`;
- start een nagebootste LemonSlice-aanbieder (geen internet nodig) en een
  tweede en derde serverinstantie (standaardwachtwoord, huissleutel,
  `PUBLIC_BASE_URL`, kapotte `db.json`);
- stopt alles en ruimt de tijdelijke map op.

| Onderdeel | Wat er getest wordt |
|---|---|
| Auth | login/logout, fout wachtwoord, cookie-vlaggen, alle CMS-endpoints zonder of met verzonnen sessie, bypass-pogingen (`/API`, `//`, `../`, `/v1/`-trucs) |
| Holoboxen | CRUD, device-key, avatarsleutel (nooit teruglezen), validatie, verwijderen |
| Integratie-API v1 | manifest, heartbeat, CORS/preflight, onbekende keys |
| Live-bronnen, playlists | CRUD, validatie, onbekende ids |
| Media | upload (multer) in submappen, lijst, download, Range (206/416), HEAD, bestandstypen, veldnaam/aantal, path traversal op `/media/*` en op de map-/hernoem-/wis-API |
| Manifest | itemtypen, overslaan van ontbrekende bestanden/bronnen, absolute URL's, oriëntatie, instellingen, `PUBLIC_BASE_URL` |
| Foutafhandeling | lege body, kapotte JSON, te grote body, onbekende ids/routes (statuscodes, geen stacktraces) |
| WebSocket-hub | rollen, onbekende key, push bij wijzigingen, commando's, status, meerdere verbindingen |
| Studio-koppeling | heartbeat + commandowachtrij, ontwerp publiceren/ophalen, schermafdruk, avatar-sessie (alle antwoordvormen van de aanbieder, time-out) |
| Pagina's (Chromium) | CMS-login, alle tabbladen, toevoegen, instellingen; player: afspelen, WS-push, identify/zwart/rotatie, niet-loopende playlist, HLS-opruimen, externe endpoint; XSS via schermafdruk; de echte Studio tegen de server |
| Persistentie | SIGTERM, herstart, sessies, kapotte `db.json` |

## Draaien

```
npm install                                   # in de hoofdmap van de repo
NODE_PATH=/opt/node-tools/node_modules node tests/server/servertest.js
```

- Playwright wordt gezocht via `NODE_PATH`, `/opt/node-tools/node_modules` of
  `tests/studio/node_modules`; Chromium via `CHROMIUM` of
  `/opt/pw-browsers/chromium`. Zonder Playwright worden alleen de
  paginatests overgeslagen.
- `BEWAAR=1` laat de tijdelijke map (met `data/db.json`, `media/` en de
  serverkopieën) staan om na te kijken.
- Duur: ongeveer een minuut (de schermafdruk-popup van het CMS wacht zelf 15 s).

De laatste regel is `OK  : n/m` of `FOUT: n/m`; bij fouten is de exitcode 1
en staat erboven een lijst van alle mislukte controles.
