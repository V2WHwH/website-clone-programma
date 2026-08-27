# website-clone-programma

Repo voor het website-clone-programma. Op dit moment bevat de repo de configuratie
om de **Ditto MCP-server** (`https://api.ditto.site/mcp`) te koppelen aan
MCP-clients zoals Claude Code.

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

## HEREweHOLO — HoloMe & HoloSee

Deze repo bevat ook de kickoff van het HEREweHOLO telepresence-platform:

- [`design/`](design/) — UI/UX/VFX-plan, design tokens en de design boards (HoloMe · HoloSee · Cloud)
- [`docs/`](docs/) — M0-documenten: ARCHITECTURE, STREAMING, SECURITY, DATA-MODEL
- [`docs/adr/`](docs/adr/) — vijf ADRs (SFU, receiver-runtime, encoders, signaling, hosting) — **goedgekeurd 2026-08-27, M0-gate gepasseerd**
- [`docs/features/`](docs/features/) — fase 2+-featurevoorstellen: F1 Studio Matte, F2 Voice Bridge, F3 Walk-up
- [`m1/`](m1/) — M1 vertical slice "camera to glass": signaling, sender, fullscreen-receiver, diagnostische resolutieketen + e2e-test
- [`platform/`](platform/) — M2+M3+M4: LiveKit-SFU-mediapad, Postgres control plane (auth, pairing, multi-tenancy), sessie-flow met invites en gasten — 10 integratietests + volledige e2e groen
- [`beam-kickoff/`](beam-kickoff/) — projectgrondwet, milestones en acceptance-scenario
