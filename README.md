# website-clone-programma

Repo voor het website-clone-programma. De repo bevat:

- **[`scripts/`](scripts/)** — tooling om een bestaande website volledig te
  downloaden naar een offline bruikbare kopie.
- **[`.mcp.json`](.mcp.json)** — de configuratie om de **Ditto MCP-server**
  (`https://api.ditto.site/mcp`) te koppelen aan MCP-clients zoals Claude Code.

## Website downloaden

`scripts/download-site.sh` maakt een complete, offline bruikbare kopie van een
site: alle HTML-pagina's plus de CSS, JavaScript, afbeeldingen en fonts die
erbij horen.

```bash
# Standaard: https://hereweholo.webflow.io/ -> ./site
./scripts/download-site.sh

# Of expliciet, met een eigen doelmap:
./scripts/download-site.sh https://voorbeeld.webflow.io/ ./mijn-kopie
```

Daarna lokaal bekijken:

```bash
./scripts/serve-site.sh site
# -> http://localhost:8000/hereweholo.webflow.io/index.html
```

### Wat het script doet

1. **Preflight** — controleert of de host bereikbaar is en meldt het expliciet
   als een proxy of egress-policy de verbinding tegenhoudt.
2. **Sitemap** — leest `sitemap.xml` uit als seed-lijst. Puur recursief crawlen
   mist pagina's waar niets naartoe linkt; de sitemap vult die gaten.
3. **Mirror** — haalt met `wget` de pagina's én hun assets op, en herschrijft de
   links zodat alles offline werkt.
4. **Rapport** — telt pagina's en bestanden en geeft de totale omvang. Nul
   pagina's is een harde fout, losse 404's op assets niet.

### Webflow-specifieke details

- Assets staan niet op de site-host maar op CDN-domeinen
  (`cdn.prod.website-files.com`, `assets.website-files.com`,
  `uploads-ssl.webflow.com`, en de jQuery-CDN van Webflow). Die staan in de
  domein-allowlist van het script; zonder die hosts krijg je wel de HTML maar
  geen styling of beeld.
- Host-mappen blijven staan (`site/<host>/...`). Bij `--span-hosts` zouden
  CDN-paden anders botsen met paden van de site zelf.
- `*.webflow.io` serveert een `robots.txt` die alles dichtzet — staging-domeinen
  horen niet geïndexeerd te worden. Het script zet daarom `robots=off`. Gebruik
  het alleen op sites die van jou zijn.

### Status: nog niet uitgevoerd

De download is **niet** gelukt vanuit deze omgeving. `hereweholo.webflow.io`
wordt geblokkeerd door de egress-policy van de sessie (`403` op de CONNECT), net
als `api.ditto.site` hieronder. Alleen een korte allowlist (o.a. `github.com`,
npm, PyPI) komt er doorheen — `example.com` en `webflow.com` worden net zo goed
geweigerd, dus het ligt niet aan de site.

Om de kopie daadwerkelijk op te halen:

- **Lokaal draaien** — `git clone` deze repo op je eigen machine en voer
  `./scripts/download-site.sh` uit. Nodig: `wget`, `curl`, `python3`.
- **Of het netwerkbeleid verruimen** — geef de omgeving een policy die
  `hereweholo.webflow.io` en de Webflow-CDN's toestaat, en draai het script
  opnieuw in een nieuwe sessie. Zie de
  [documentatie over Claude Code op het web](https://code.claude.com/docs/en/claude-code-on-the-web).

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
