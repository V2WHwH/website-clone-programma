# HOLO ARMS / WALL HANDS ENGINE

Real-time spatial-illusion engine voor HEREweHOLO / Holowall / Holobox
installaties: realistische 3D-armen die uit de achterwand van een display
komen, objecten doorgeven over meerdere schermen, reageren op passanten en
commercieel inzetbaar zijn via campagnes.

**Status: Milestone 0 — architectuur + Figma-ontwerp.** Er is nog geen
Unity-runtime; de spec verplicht eerst architectuur en het Figma-ontwerp.

| Map | Inhoud |
|---|---|
| `Docs/` | Master-spec + volledig Milestone 0-architectuurpakket (`00`–`09`) |
| `FigmaHandoff/` | Design-tokens, componentnamen en schermhiërarchie uit Figma (F5) |
| `UnityProject/` | Unity 6 HDRP-project (vanaf Milestone 1) |
| `Tools/`, `ContentSamples/`, `Tests/`, `BuildScripts/` | Zie `Docs/01_ARCHITECTURE.md` §7 |

Startpunten: [`Docs/00_PRODUCT_OVERVIEW.md`](Docs/00_PRODUCT_OVERVIEW.md) en
[`Docs/08_MILESTONE_BACKLOG.md`](Docs/08_MILESTONE_BACKLOG.md).

---

## Eerdere inhoud: Ditto MCP-serverconfiguratie

De repo bevat daarnaast de configuratie om de **Ditto MCP-server**
(`https://api.ditto.site/mcp`) te koppelen aan MCP-clients zoals Claude Code.

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
