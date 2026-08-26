# HereWeHolo Holobox Platform — Integratiehandleiding

Dit document beschrijft alle protocollen, poorten, URL's en dataformaten die
nodig zijn om een holobox (van HereWeHolo of van een derde partij) op het
platform aan te sluiten, of om een eigen presentatie/content-bron aan het
platform te koppelen.

## 1. Architectuur in het kort

```
┌────────────────────────┐        HTTP/WS (poort 8080)        ┌─────────────────┐
│  HereWeHolo Platform    │◄──────────────────────────────────►│  Holobox player  │
│  (Node.js, deze repo)   │   manifest + media + commando's    │  (browser-kiosk) │
│                         │                                     └─────────────────┘
│  • CMS  /admin          │        HTTPS (pull, optioneel)     ┌─────────────────┐
│  • API  /api/v1         │◄──────────────────────────────────►│ Externe endpoint │
│  • Media /media         │      klant-eigen content-API       │  (klant/partner) │
└────────────────────────┘                                     └─────────────────┘
```

- **Eén proces, één poort**: HTTP (CMS, API, media-streaming) en WebSocket
  (realtime devicebeheer) delen hetzelfde poortnummer.
- **Pull-gebaseerd**: de box haalt zelf zijn manifest op. Daardoor werkt het
  platform ook achter NAT/firewalls zonder inkomende poorten op de box.
- **Push via WebSocket**: zolang de box verbonden is, komen wijzigingen
  (playlist-update, identify, herstart) direct binnen — zonder te wachten op
  de volgende poll.

## 2. Poorten & netwerk

| Dienst                        | Protocol | Poort (standaard) | Richting            |
|-------------------------------|----------|-------------------|---------------------|
| CMS + API + media + player    | HTTP     | 8080/tcp          | box → platform      |
| Realtime kanaal `/ws`         | WebSocket| 8080/tcp          | box → platform      |
| HLS live (bij MediaMTX)       | HTTP     | 8888/tcp          | box → streamserver  |
| WHEP/WebRTC live (MediaMTX)   | HTTP+UDP | 8889/tcp + UDP-range | box → streamserver |
| RTMP-ingest (OBS/vMix/camera) | RTMP     | 1935/tcp          | studio → streamserver |
| SRT-ingest                    | SRT      | 8890/udp          | studio → streamserver |

Firewall-regels voor de holobox: **uitgaand** TCP 8080 (of 443 achter een
reverse proxy) naar het platform en uitgaand verkeer naar de streamserver.
Inkomende poorten op de box zijn niet nodig.

- Poort wijzigen: `PORT` in `.env`.
- Publieke URL (voor absolute media-links in manifests): `PUBLIC_BASE_URL`
  in `.env`, bijv. `https://cms.hereweholo.nl`.
- Voor gebruik over internet: zet een reverse proxy met TLS (Caddy/nginx)
  vóór poort 8080. WebSocket-upgrade moet doorgelaten worden op `/ws`.

## 3. Device-onboarding (holobox aansluiten)

1. Maak in het CMS (`/admin` → Holoboxen) een device aan. Het platform
   genereert een **device-key** (hex, 24 tekens) die als toegangssleutel dient.
2. Open op de box in een fullscreen browser/kiosk:
   `http://<platform>:8080/player/<device-key>`
3. De box verschijnt direct als *online* in het CMS, met IP-adres en
   "speelt nu"-status.

### Kiosk-instellingen per boxtype

- **Windows/Linux mini-pc**: Chromium met
  `chromium --kiosk --autoplay-policy=no-user-gesture-required --noerrdialogs --disable-session-crashed-bubble "http://<platform>:8080/player/<key>"`
- **Android-paneel**: Fully Kiosk Browser of vergelijkbaar, URL als startpagina,
  autoplay toestaan.
- **4K-weergave**: zet de schermresolutie op 3840×2160 (landscape) of
  2160×3840 (portrait). Bij een fysiek gedraaid paneel dat zich als landscape
  meldt: zet in het CMS de *paneelrotatie* op 90° of 270° — de player roteert
  dan zelf.

## 4. Integratie-API (v1)

Alle v1-endpoints zijn CORS-open (`Access-Control-Allow-Origin: *`) en
gebruiken de device-key als autorisatie.

### 4.1 `GET /api/v1/manifest/<device-key>`

Het afspeelmanifest van een box. Response:

```json
{
  "version": 1,
  "generatedAt": "2026-08-25T12:00:00.000Z",
  "platform": "HereWeHolo Holobox Platform",
  "device": {
    "id": "dev_ab12cd34ef56",
    "name": "Holobox showroom",
    "orientation": "portrait",
    "rotation": 0,
    "resolution": "2160x3840"
  },
  "playlist": { "id": "pl_1234", "name": "Presentatie", "loop": true },
  "pollIntervalSec": 30,
  "transitionMs": 600,
  "externalEndpoint": null,
  "items": [
    {
      "id": "it_1",
      "type": "video",
      "name": "intro.mp4",
      "url": "http://192.168.1.50:8080/media/klantA/intro.mp4",
      "durationSec": null,
      "fit": "cover",
      "muted": true
    },
    {
      "id": "it_2",
      "type": "live",
      "name": "Studio livestream",
      "protocol": "whep",
      "url": "http://stream.hereweholo.nl:8889/studio/whep",
      "durationSec": null,
      "fit": "cover",
      "muted": false,
      "lowLatency": true
    },
    {
      "id": "it_3",
      "type": "url",
      "name": "Eigen presentatie",
      "url": "https://klant.example.com/holobox",
      "durationSec": 120,
      "interactive": false
    }
  ]
}
```

Item-types:

| type    | Velden                                   | Betekenis                            |
|---------|------------------------------------------|--------------------------------------|
| `video` | `url`, `durationSec?`, `fit`, `muted`    | Mp4/WebM-bestand; zonder `durationSec` speelt hij tot het einde |
| `image` | `url`, `durationSec` (default 10)        | Stilstaand beeld                     |
| `live`  | `protocol` (`hls`\|`whep`\|`mjpeg`\|`webrtc-page`), `url` | Live stream; zonder `durationSec` blijft de box op de stream staan |
| `url`   | `url`, `durationSec?`, `interactive`     | Webpagina fullscreen in een iframe   |

`fit`: `cover` (vullend, kan croppen) of `contain` (volledig beeld, evt.
zwarte randen).

### 4.2 `POST /api/v1/heartbeat/<device-key>`

Voor players zonder WebSocket. Body (optioneel):
`{ "nowPlaying": { "id": "...", "name": "...", "type": "video" } }`.
Response bevat `pollIntervalSec`, zodat de poll-frequentie centraal te
sturen is.

### 4.3 `GET /api/v1/health`

Statuscheck voor monitoring: `{ "ok": true, ... }`.

### 4.4 WebSocket `/ws?role=player&key=<device-key>`

JSON-berichten van platform → box:

| type       | Actie                                          |
|------------|------------------------------------------------|
| `refresh`  | Manifest opnieuw ophalen en toepassen           |
| `reload`   | Volledige pagina-herstart van de player         |
| `identify` | Naam + key 8s groot in beeld (voor installatie) |
| `black`    | Scherm zwart aan/uit (bijv. buiten openingstijden) |
| `wake`     | Zwart scherm opheffen                           |

Box → platform: `{ "type": "status", "nowPlaying": {...}, "info": {...} }`
(elke ±20s).

### 4.4 Studio-koppeling (remote beheer van de Studio-app)

De offline **Studio-app** (studio/index.html of de Windows Player) kan zich
met een device-key aan dit platform koppelen: menu → **Opslaan → Beheer op
afstand** (serveradres + device-key uit het beheerpaneel). De Studio meldt
zich dan elke 5–120 s en voert commando's uit de wachtrij uit.

Studio-box → platform (publiek, per device-key, CORS open):

| Endpoint | Doel |
|---|---|
| `POST /api/v1/studio/:key/heartbeat` | Status melden (`{status:{…}}`); antwoord bevat `commands[]`, `configRev` en `pollIntervalSec` |
| `GET  /api/v1/studio/:key/config` | Gepubliceerd ontwerp ophalen (`{rev, config}`) |
| `POST /api/v1/studio/:key/screenshot` | Schermafdruk aanleveren (`{image:"data:image/jpeg;…"}`, max 3 MB) |

Beheerder → platform (sessie vereist):

| Endpoint | Doel |
|---|---|
| `GET  /api/devices/:id/studio` | Laatste status; met `?screenshot=1` ook de laatste schermafdruk |
| `POST /api/devices/:id/studio/command` | Commando in de wachtrij: `setVolume` (value 0–100), `screenshot`, `reload`, `identify`, `publishConfig` |
| `PUT  /api/devices/:id/studio/config` | Ontwerp publiceren (`{config:<Studio-export>}`); verhoogt `configRev`, box past het bij de volgende hartslag toe |

In het beheerpaneel (Holoboxen) zit dit achter de knoppen **Schermafdruk**,
**Volume**, **Ontwerp publiceren**, **Identificeer** en **Herstart** op elke
device-kaart. Commando's worden bij de eerstvolgende hartslag opgehaald;
de wachtrij bewaart per type alleen het nieuwste commando.

## 5. Eigen presentatie koppelen ("custom endpoint")

Vergelijkbaar met Portl's *Cloud Persona custom endpoint*: per holobox kan in
het CMS een **externe endpoint-URL** worden ingesteld. De player haalt dan de
playlist bij de klant op in plaats van uit dit CMS.

Contract voor de externe endpoint:

- `GET`-request, response `application/json`, CORS toegestaan voor de
  player-origin (of `*`).
- Minimaal: `{ "items": [ ...items zoals in §4.1... ] }`. Extra velden zoals
  `transitionMs` of `pollIntervalSec` mogen meegegeven worden en overschrijven
  dan de platform-instellingen.
- Media-URL's moeten absoluut en voor de box bereikbaar zijn (HTTPS aanbevolen).
- **Fallback**: is de endpoint onbereikbaar of ongeldig, dan speelt de box
  automatisch de lokale CMS-playlist. Een box blijft dus nooit zwart door een
  storing bij de klant.
- Aanbevolen responstijd < 2s; de player pollt elke `pollIntervalSec` seconden.

Andersom kan ook: een externe box (andere leverancier) die zelf content
pollt, gebruikt gewoon `GET /api/v1/manifest/<device-key>` (§4.1).

## 6. Live video

| Methode      | Latency  | Wanneer                                        |
|--------------|----------|------------------------------------------------|
| WHEP/WebRTC  | < 1 s    | Live persoon in de box, Q&A, telepresence      |
| HLS          | 5–20 s   | Events, keynotes, waar latency niet kritisch is |
| MJPEG        | ~1 s     | Eenvoudige IP-camera's                          |
| WebRTC-pagina| < 1 s    | Bestaande meet/stream-pagina fullscreen tonen   |

Aanbevolen keten voor lage latency (zelf te hosten, gratis):

```
OBS/vMix/camera ──RTMP:1935 of SRT:8890──► MediaMTX ──WHEP:8889──► holobox
                                             └──HLS:8888──► fallback/extern
```

Maak in het CMS een *live-bron* aan met protocol `whep` en URL
`http://<streamserver>:8889/<pad>/whep`, en zet die bron in een playlist.

### 4K-richtlijnen

- Fixed content: H.264 High@L5.1 of H.265, 3840×2160 of 2160×3840,
  20–40 Mbps, mp4-container (`-movflags +faststart` voor snelle start).
- Live 4K: minimaal 15 Mbps upload vanaf de studio; WHEP met H.264.
- Portrait-content bij voorkeur écht 2160×3840 aanleveren (niet gedraaide
  landscape), dan is geen rotatie of crop nodig.

## 7. Beveiliging

- CMS-toegang: wachtwoord via `ADMIN_PASSWORD` (verplicht aanpassen),
  sessie-cookie httpOnly, 12 uur geldig.
- Device-keys zijn 96-bit random; wie de key niet heeft, kan manifest noch
  media raden. Keys zijn per box in te trekken door het device te verwijderen
  en opnieuw aan te maken.
- Zet publiek verkeer altijd achter TLS (reverse proxy) en configureer
  `PUBLIC_BASE_URL` met `https://`.
