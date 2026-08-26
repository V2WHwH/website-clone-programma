# website-clone-programma

Repo voor het website-clone-programma. Op dit moment bevat de repo de configuratie
om de **Ditto MCP-server** (`https://api.ditto.site/mcp`) te koppelen aan
MCP-clients zoals Claude Code.

## HoloFX — Hyper Typography Motion (holobox)

[`holofx/`](holofx/) is een zelfstandig programma voor holobox-displays,
gebaseerd op het "Hyper Typography Spiral Motion"-effect. Kern:

- **7 effecten** via het menu: Cilinder, Spiraal, Blok, Rechthoek, Golf,
  Tunnel en Lint — allemaal met echt perspectief (diepte-slider) en
  **geëxtrudeerde, opgedikte randen** (randdikte-slider) in plaats van
  platte vlakken.
- **Eigen inhoud**: hoofd- en subtekst plus eigen afbeeldingen die op de
  geschikte lagen (de lichte media-laag) in de effecten meedraaien.
- **Aparte sliders voor schaduwdiepte en schaduwhardheid**, plus snelheid,
  kanteling, twist, schaal, gloed.
- **Achtergrond**: kleur én dekking instelbaar; standaard wit. Dekking 0 =
  puur zwart (op een holobox onzichtbaar).
- **Holobox-modus** (UI verbergt zichzelf, cursor weg) en spiegel-optie
  voor holo-folies. Instellingen worden onthouden.

### Gebruik

- Browser: open `holofx/app/index.html`.
- Windows: `HoloFX.exe` uit de aangeleverde `HoloFX-win64.zip` (map
  uitpakken, exe starten; volledig scherm, `Ctrl+Q` sluit af).
- Opstart-opties voor autostart op de holobox:
  `HoloFX.exe --effect=spiraal --holobox --mirror --text="MIJN TEKST"`
- Sneltoetsen: `1–7` effect, `H` menu, `F`/`F11` volledig scherm,
  spatie pauze, slepen = draaien, scroll = zoom.

### Windows-build zelf maken

Twee varianten:

```bash
cd holofx
npm install
npm run build:win     # Electron: dist/HoloFX-win32-x64/HoloFX.exe (±270 MB,
                      # geen extra vereisten op de doelmachine)

./build-lite.sh       # Neutralino "lite": build-lite/holofx/dist/HoloFX-win64/
                      # (±3 MB; vereist WebView2, standaard in Windows 10/11)
```

## Cylinder Motion Graphics

[`cylinder-motion/index.html`](cylinder-motion/index.html) is een webversie van
het After Effects "CC Cylinder"-effect uit
[deze YouTube Short](https://www.youtube.com/shorts/VLkK6DnxGAU): lange
banner-strips worden procedureel getekend, verticaal gestapeld tot een
super-banner, eindeloos gescrold (Motion Tile) en per kolom om draaiende
3D-cilinders met helix-twist gewikkeld.

Openen: het bestand direct in een browser openen volstaat — geen build,
dependencies of server nodig. Klikken pauzeert de animatie, scrollen zoomt.

## Ditto MCP-server

De server is geregistreerd in [`.mcp.json`](.mcp.json) als een remote HTTP
MCP-server:

```json
{
  "mcpServers": {
    "ditto": {
      "type": "http",
      "url": "https://api.ditto.site/mcp",
      "headers": {
        "Authorization": "Bearer ${DITTO_API_KEY}"
      }
    }
  }
}
```

### Instellen

1. Kopieer `.env.example` naar `.env` en vul je Ditto API key in:

   ```bash
   cp .env.example .env
   # zet DITTO_API_KEY=... in .env
   ```

2. Zorg dat de variabele in je shell staat voordat je de client start
   (Claude Code leest `${DITTO_API_KEY}` uit de omgeving, niet uit `.env`):

   ```bash
   export DITTO_API_KEY="$(grep '^DITTO_API_KEY=' .env | cut -d= -f2-)"
   ```

3. Start Claude Code in deze map. Bij de eerste keer vraagt hij om de
   project-MCP-servers goed te keuren. Controleer daarna met:

   ```bash
   claude mcp list
   ```

   Of binnen een sessie met `/mcp`.

### Alternatief: toevoegen via de CLI

Zonder `.mcp.json` kan het ook direct:

```bash
claude mcp add --transport http ditto https://api.ditto.site/mcp \
  --header "Authorization: Bearer $DITTO_API_KEY"
```

### Handmatig testen

De MCP-endpoint spreekt JSON-RPC 2.0 over HTTP (Streamable HTTP transport):

```bash
curl -sS https://api.ditto.site/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Authorization: Bearer $DITTO_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": { "name": "curl", "version": "1.0" }
    }
  }'
```

Daarna `tools/list` met dezelfde headers plus de `Mcp-Session-Id` die de server
in de response-header teruggeeft.

## Nog te verifiëren

De endpoint is **niet** getest vanuit deze omgeving: `api.ditto.site` wordt
geblokkeerd door de egress-policy van de sessie (`403` op de CONNECT). Daardoor
staan twee dingen nog open:

- **Auth-schema** — de config gaat uit van een bearer token. Als Ditto in plaats
  daarvan OAuth of een andere header (bijv. `X-API-Key`) gebruikt, moet
  `.mcp.json` daarop aangepast worden.
- **Beschikbare tools** — de tool-namen en schema's van de server zijn nog
  onbekend en dus nergens gedocumenteerd in deze repo.
