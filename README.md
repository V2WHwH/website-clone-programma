# HereWeHolo — 4K Holobox Platform

Softwareplatform voor de HereWeHolo-holobox: een **4K-player** (portrait én
landscape), een **CMS** voor het beheren van media, mappen, playlists,
live streams en holoboxen, en een **integratie-API** waarmee klanten hun eigen
holobox-presentatie kunnen koppelen (vergelijkbaar met Portl's *Cloud Persona
custom endpoint* en Proto's Cloud CMS/fleet-aanpak).

## Mogelijkheden

- **4K-weergave** — portrait (2160×3840) en landscape (3840×2160), inclusief
  ondersteuning voor fysiek gedraaide panelen (rotatie 90/180/270°).
- **Fixed video & afbeeldingen** — mp4/webm/mov, gapless overgangen met fade,
  HTTP range-streaming voor grote 4K-bestanden (tot 8 GB per upload).
- **Live video** — HLS (universeel), WHEP/WebRTC (sub-seconde latency, o.a.
  MediaMTX/Cloudflare/Millicast), MJPEG en externe WebRTC-pagina's.
- **Eigen presentaties** — web-URL's fullscreen in de playlist, of een externe
  content-endpoint per box met automatische fallback.
- **CMS** (`/admin`, Nederlands) — mappenbeheer, uploads met voortgang,
  playlists, live-bronnen, device-dashboard met online-status, IP-adres,
  "speelt nu", en realtime commando's (identificeer, ververs, herstart,
  scherm zwart).
- **Integratie-API** (`/api/v1`) — JSON-manifest per device-key, heartbeat,
  health-check; CORS open zodat ook boxen van derden kunnen koppelen.
- **Realtime** — WebSocket-hub: wijzigingen in het CMS staan binnen een
  seconde op de box.

## Snel starten

```bash
npm install
cp .env.example .env        # zet minimaal ADMIN_PASSWORD
npm start                   # draait op http://localhost:8080
```

1. Open `http://localhost:8080/admin` en log in.
2. Maak een **holobox** aan → kopieer de player-URL.
3. Upload media in **Media & mappen**, maak een **playlist** en koppel die
   aan de box.
4. Open de player-URL fullscreen op de holobox (Chromium-kiosk):

```bash
chromium --kiosk --autoplay-policy=no-user-gesture-required \
  "http://<server>:8080/player/<device-key>"
```

## Structuur

```
server.js            Express + WebSocket entrypoint
lib/                 db (JSON-file), auth, media, manifest-builder, ws-hub
routes/api.js        CMS-API (/api) + publieke integratie-API (/api/v1)
public/admin/        CMS-frontend
public/player/       4K-player voor op de box
media/               mediabibliotheek (mappen; niet in git)
data/db.json         configuratie-database (niet in git)
docs/INTEGRATIE.md   protocollen, poorten, endpoint-contracten, live-setup
```

Alle integratie-details (poorten, firewall, manifest-schema, custom endpoint,
4K/live-richtlijnen) staan in [`docs/INTEGRATIE.md`](docs/INTEGRATIE.md).

---

## Ditto MCP-server (bestaande koppeling)

De repo bevat daarnaast de configuratie om de **Ditto MCP-server**
(`https://api.ditto.site/mcp`) te koppelen aan MCP-clients zoals Claude Code;
zie [`.mcp.json`](.mcp.json). Zet `DITTO_API_KEY` in `.env`. De endpoint
spreekt JSON-RPC 2.0 over HTTP (Streamable HTTP transport) met een
bearer-token. Auth-schema en beschikbare tools zijn nog niet vanuit deze
omgeving geverifieerd (egress geblokkeerd).
