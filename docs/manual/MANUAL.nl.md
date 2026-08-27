# HEREweHOLO Beam — Handleiding (NL)

De complete gids voor het telepresence-platform: **HoloMe** (de zendende kant) en
**HoloSee** (de ontvangende kant op Holobox-, Holomini- en Holowall-schermen).

> English version: [MANUAL.en.md](MANUAL.en.md) · Snelstart: [QUICKSTART.nl.md](QUICKSTART.nl.md)

---

## 1 · Wat dit is, en wat het belooft

Beam zet een levend mens op holografisch glas: camera erin aan de ene kant, aanwezigheid
eruit aan de andere, met een retourbeeld zodat de presentator de ruimte ziet waarin die
staat.

Eén principe loopt door elk scherm en elke regel code: **het product claimt nooit wat het
niet gemeten heeft.** De statusbalk toont gemeten resolutie, fps en bitrate of niets;
"4K" verschijnt alleen als er aantoonbaar 4K-frames zijn afgeleverd; een ontbrekende
microfoon wordt gemeld, niet verdoezeld; en het ontvangende glas toont het publiek nooit,
onder geen enkele omstandigheid, een foutmelding — het valt terug op het merkscherm en
herstelt in stilte.

## 2 · De onderdelen

| Onderdeel | Wat het is |
|---|---|
| **Platform** (`platform/server`) | Control plane: accounts, organisaties, apparaten, sessies, invites, alerts, audit. REST onder `/api/v1`, één WebSocket per apparaat. |
| **LiveKit SFU** | Media plane. Alle audio/video loopt erdoorheen; alleen het platform maakt room-tokens aan. |
| **HoloMe** (`/app.html`, `/session.html`) | De presentator-ervaring: eerst de bestemming, pre-flight, GO LIVE, eerlijke statusbalk, retourbeeld, diagnostiek. |
| **HoloSee** (`/receiver.html`) | De scherm-ervaring: koppelen, afspelen, fallback-toestandsmachine, event-rapportage, diag-overlay. |
| **Watchdog** (`agent/watchdog.mjs`) | Host-agent op de scherm-pc: houdt de kioskbrowser in leven, meet host-gezondheid, voert host-acties uit, controleert op gesigneerde updates. |
| **Fleet** (`/fleet.html`) | De operationele console: KPI's, gezondheid, alerts, remote acties, analytics, audit. |

## 3 · Installatie

### Ontwikkeling

```bash
cd platform && npm install
./scripts/get-livekit.sh
sudo service postgresql start        # database 'holo', gebruiker 'holo'
.livekit/livekit-server --bind 127.0.0.1 --node-ip 127.0.0.1 --port 7880 \
  --keys "devkey: devsecret_devsecret_devsecret_00" &
npm start                            # http://localhost:8800
```

Migraties draaien automatisch bij het opstarten (`server/migrations/*.sql`, op volgorde,
vastgelegd in `schema_migrations`).

### Productie (`platform/deploy/`)

`docker-compose.yml` start: de app, PostgreSQL 16, LiveKit (host-networking,
`use_external_ip`), **coturn** (TURN over TLS op 5349 — doorkomst op strenge
bedrijfsnetwerken) en **Caddy** (automatische TLS, reverse proxy). Stappen:

1. Kopieer `deploy/env.example` → `.env`; zet `JWT_SECRET`, databasewachtwoord,
   LiveKit-API-key/-secret, domeinen. **Er staan nooit secrets in de repository.**
2. Richt DNS op de machine; Caddy haalt zelf certificaten op.
3. `docker compose up -d`.

Omgevingsvariabelen (`server/env.ts`): `PORT`, `DATABASE_URL`, `JWT_SECRET`,
`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`. Er bestaan
ontwikkel-standaarden, maar die worden in productie **geweigerd**.

## 4 · Organisaties, accounts, rollen

Het platform is multi-tenant: alles (apparaten, sessies, invites, alerts, audit) is aan
een organisatie gebonden, afgedwongen in elke query en gedekt door tests.

Rollen, elk inclusief de vorige: **viewer** → **presenter** → **operator** → **admin** →
**owner**. Wachtwoorden zijn met Argon2id gehasht (OWASP-parameters); access-tokens leven
15 minuten; refresh-tokens roteren bij elk gebruik — een gestolen oude cookie is dood.

## 5 · Schermen (HoloSee)

### Koppelen

De receiver genereert een **niet-exporteerbaar P-256-sleutelpaar** in de IndexedDB van de
browser en vraagt een 6-tekencode aan die aan zijn publieke sleutel is gebonden
(ondubbelzinnig alfabet, 10 minuten geldig). Een admin claimt de code met naam/type/
locatie. Daarna authenticeert het apparaat zich door een server-nonce te ondertekenen —
er bestaat geen secret dat iemand uit een configuratiebestand kan kopiëren. Verkeerde
sleutel → 401 (getest).

### Onbeheerd draaien

Het scherm is een toestandsmachine **idle → live ⇄ fallback**. Een media-stilstand
(> 4 s zonder gedecodeerd frame) of SFU-verlies schakelt het glas naar het merkscherm en
start een stille rejoin-lus van 3 seconden; herstel wordt gelogd met de storingsduur.
Paginafouten worden als `log`-events vastgelegd; *niets verschijnt ooit als foutmelding
op het glas.*

De **watchdog** houdt de kioskbrowser in leven met exponentiële backoff (reset na een
gezonde minuut). Het profiel is persistent, dus de identiteit overleeft crashes en
herstarts: autostart + auto-connect zonder menselijke handeling. Op Windows registreert
`agent/windows/install.ps1` hem als Scheduled Task en schakelt slaapstand en meldingen
uit.

Elke overgang is een gestructureerd **device-event** (`boot`, `online`/`offline` —
inclusief server-side zombie-sweeps, `session_playing` met gemeten breedte×hoogte,
`fallback_shown` met reden, `recovered` met storingsduur, `action_result`, `log`), elke
rij met sessie-id, zodat elke sessie van begin tot eind te reconstrueren is.

### Diagnostiek op het glas

Druk op **D** op een aangesloten toetsenbord (of open met `?diag=1`): een monospace-
overlay toont STATE, DECODE (implementatie, hardware/software), RENDER (gemeten
resolutie/fps/gedropte frames), PHYSICAL (het echte scherm) en AGENT — uitsluitend
gemeten waarden. Het publiek ziet dit nooit, tenzij een technicus erom vraagt.

## 6 · Presenteren (HoloMe)

1. **Eerst de bestemming.** Je kiest het glas voordat er een camera opengaat
   (`/app.html`).
2. **Pre-flight.** Vóór GO LIVE meet de pagina: encode-capaciteit over de hele
   kwaliteitsladder (via MediaCapabilities van de browser — `powerEfficient` is diens
   hardware-signaal), uplink/downlink met onsamendrukbare willekeurige bytes tegen het
   platform zelf, RTT, en de *gerapporteerde decodeercapaciteit* van de bestemming. Het
   oordeel is één eerlijke zin; de starttrede is de hoogste die (a) soepel encodeert,
   (b) met ×1,4 marge op de uplink past, (c) elke bestemming kan decoderen.
3. **GO LIVE.** Simulcast-publicatie via de SFU; het scherm stapt in via een push over
   zijn presence-socket. De **statusbalk** toont tijd, gemeten resolutie, gemeten fps,
   gemeten Mbps en de huidige trede. `0 × 0 · STANDBY` is een eerlijke toestand, geen
   bug.
4. **Retourbeeld.** Het scherm publiceert zijn eigen camera terug (als het er een heeft)
   in een inzetvenster; echo-onderdrukking wordt expliciet aangevraagd op de
   presentator-microfoon. Een ontbrekende microfoon wordt *gemeld*, nooit gemaskeerd.
5. **STOP.** Gemeten sessiestatistieken (duur, piekresolutie, piek-Mbps, audio,
   egress-bytes, laddergeschiedenis) landen in het sessierecord.

### De kwaliteitsladder

`4K60 → 4K30 → 1440p30 → 1080p60 → 1080p30 → 720p30` — **snel omlaag, langzaam omhoog**:

- **Omlaag:** 3 aaneengesloten seconden gemeten nood — de browser die `cpu`/`bandwidth`-
  limitatie op een simulcast-laag rapporteert, *of* een behaalde encoder-fps onder 60%
  van het trededoel — stapt één trede omlaag en logt waarom.
- **Omhoog:** 30 schone seconden stappen één trede omhoog, nooit boven het
  onderhandelde plafond. Mislukt een herstel, dan verdubbelt de wachttijd (tot 4
  minuten) — geen oscillatie.
- `?pin=1080p30` pint starttrede en plafond vast (operator-override). Pinnen verandert
  wat we *proberen*, nooit wat de balk *beweert*.

### De diagnostieklade

De knop **Diagnostics** opent de volledige resolutieketen, trede voor trede gemeten:
CAPTURE → ENCODE (implementatie, hardware/software, huidige limitatie) → TRANSPORT
(gemeten Mbps, RTT) → per bestemming DECODE / RENDER (door het apparaat gerapporteerde
fps, drops) → PHYSICAL (diens echte scherm), plus de recente laddergeschiedenis. Een
streepje betekent "deze build stelt die waarde niet beschikbaar" — nooit een gok.

## 7 · Gasten

Maak een invite in `/app.html`: bestemming(en), geldigheid (1–168 u), eenmalig of
herbruikbaar, optioneel wachtwoord. Het linktoken wordt **één keer** teruggegeven;
alleen de hash wordt opgeslagen. De gastflow: link openen → de bestemming en organisatie
zien **vóór enige permissievraag** → naam (+ wachtwoord indien ingesteld) →
camerapreview → GO LIVE. Gasten krijgen een grant van 2 uur die alleen de uitgenodigde
schermen dekt; het intrekken van de invite maakt hem dood.

## 8 · Vlootbeheer (`/fleet.html`, operator+)

- **KPI's:** apparaten online/totaal, open alerts, live sessies, 24-uurs sessies /
  mediaminuten / gemeten egress.
- **Host-gezondheid** per scherm, gemeten door de watchdog: load per cores,
  geheugengebruik, vrije schijfruimte %, temperatuur (— waar de host geen sensor
  beschikbaar stelt), host-uptime. De receiver geeft zijn kortlevende token via een
  localhost-kanaal aan de watchdog; de browser zelf kán deze dingen niet meten, dus doet
  de agent het.
- **Alerts** zijn gemeten condities die zichzelf aanmaken *én oplossen* met een notitie:
  `offline` (te lang niet gezien), `disk_low` (agent-gemeten), `stuck_fallback`
  (merkscherm zonder herstel). Handmatig oplossen is één klik; alles wordt geauditeerd.
- **Remote acties** (alle resultaten komen terug als `action_result`-events): *Reload*,
  *Clear cache* (het sleutelpaar in IndexedDB blijft onaangeroerd), *Logs* (ringbuffer op
  het apparaat), *Net test* (gemeten RTT + downlink vanaf het apparaat), *Restart
  browser* (via de watchdog — zelfde identiteit erna), *Reboot* (watchdog; vereist
  `ALLOW_REBOOT=1` op de host).
- **Sessie-analytics:** duur, piekkwaliteit, **gemeten egress** (werkelijk verzonden
  bytes over alle simulcast-lagen) en de laddergeschiedenis per sessie. Kostenramingen
  vermenigvuldigen *jouw* tarieven met deze gemeten hoeveelheden — het platform verzint
  nooit een getal.
- **Audittrail:** elke handeling met gevolgen (koppelen, invites, sessiestart/-stop,
  ladderstappen, remote acties, alert-oplossingen) met actor en doelwit.

## 9 · Updates & uitleveren (M8)

- **Kanalen:** STABLE / BETA / INTERNAL. Een kanaalmanifest noemt de versie, de sha256
  van de bundel en een **Ed25519-handtekening** over beide; de agent weigert alles
  waarvan de hash *of* de handtekening niet klopt tegen de vastgepinde publieke sleutel
  (getest, inclusief gemanipuleerde bundels en handtekeningen van een verkeerde sleutel).
- **Toepassen & rollback:** de nieuwe bundel landt naast de oude; één atomaire
  pointer-flip activeert hem; de vorige versie blijft op schijf en `rollback()` herstelt
  die als de nieuwe versie zijn health-check na herstart niet haalt.
- **Installer:** `agent/windows/installer.iss` (Inno Setup) bouwt
  *HEREweHOLO Beam Receiver Setup.exe* — installeren/repareren/updaten/verwijderen,
  Scheduled Task, energie-instellingen, firewall. Bouwen, signeren en valideren van de
  exe gebeurt op echte Windows-hardware (zie §11).
- **Soak-test:** `npm run soak` draait continu afspelen, herhaalde sessies en
  verbrekingscycli terwijl de RSS van elke procesboom wordt bemonsterd; het rapport
  faalt bij >25% mediane groei. `SOAK_MINUTES=1440` is de 24-uurs gate-run.

## 10 · Testen

| Commando | Wat het bewijst |
|---|---|
| `npm test` | 12 API-integratietests (echte PostgreSQL) + 8 tests van het updatemechanisme |
| `npm run test:e2e` | Koppelen → ONLINE → presentator *én* gast GO LIVE door de echte SFU → frames op het glas → STOP |
| `npm run test:e2e:m5` | De kabel eruit: watchdog-boot, SFU midden in de stream gedood, fallback < 15 s, stil herstel, crash-herstart, volledig event-trail |
| `npm run test:e2e:m6` | Gemeten caps, pre-flight-oordeel, echte CPU-throttle → ladder omlaag zonder sessieverlies, langzaam herstel, diagnostiekketen |
| `npm run test:e2e:m7` | De fleet-gate: gezondheid vastgelegd, storing → alert → remote herstel zonder het apparaat aan te raken, toolbox, dashboard, audit |
| `npm run bench:encode` | Encode-benchmarkmatrix (hardware/software, behaalde fps, latency, bitrate) voor *deze* machine |
| `npm run soak` | Langdraai-stabiliteit + geheugengroeirapport |

## 11 · Wat nog echte hardware nodig heeft (deploy-gates)

Eerlijkheidsparagraaf — dit wordt **niet** als afgerond geclaimd: de M2-netwerkgate
(drie echte netwerktypen + 10 minuten geforceerde TURN-relay), het M4-acceptatiescenario
met een echte gast en een echte Holobox, M5-kioskharding op echt Windows, de
M6-echte-4K-sessie (deze sandbox meet software-encodering op ~15 fps voor 4K — de UI
claimt hier dus nooit 4K) en diens bandbreedte-throttle-laddertest, het bouwen/signeren
van de M8-installer, en de 24-uurs soak op doelhardware met GPU/VRAM/thermische
telemetrie.

## 12 · Probleemoplossing

| Symptoom | Diagnose | Oplossing |
|---|---|---|
| Scherm toont weer een koppelcode | Claim nooit afgerond, of IndexedDB gewist | Opnieuw claimen via `/app.html`; zoek uit wie sitedata wiste |
| Scherm OFFLINE, pc staat aan | Kioskbrowser of watchdog plat | Fleet → *Restart browser*; controleer de watchdog-service; het `offline`-alert geeft het tijdstip |
| Merkscherm tijdens een sessie | Media > 4 s gestokt (netwerk of SFU) | Hij herstelt zichzelf; `fallback_shown`/`recovered`-events dragen reden en duur; `stuck_fallback`-alert vuurt als herstel uitblijft |
| Balk blijft op lage resolutie hangen | Ladder houdt vast na echte nood | Diagnostieklade toont de limitatie (cpu/bandwidth/low_fps) en de laddergeschiedenis |
| GO LIVE geeft een fouttekst | Sessie-opruiming is al gedaan; de knop is opnieuw bruikbaar | Lees het pre-flight-oordeel; controleer of de bestemming ONLINE is |
| Gastlink "invalid or expired" | Geldigheid verlopen, gebruik op, of ingetrokken | Maak een nieuwe invite |
| Remote actie geeft 409 | Apparaat offline — acties vereisen een live socket | Breng het apparaat eerst online (watchdog) |
| `no space left` op de scherm-pc | Zie het `disk_low`-alert | Maak ruimte vrij; het alert lost zichzelf op bij +5% marge |

## 13 · Design & verdere documenten

Designsysteem en schermen: `design/` (tokens, mockups) en het Figma-bestand.
Architectuur en besluiten: `docs/ARCHITECTURE.md`, `docs/STREAMING.md`,
`docs/SECURITY.md`, `docs/DATA-MODEL.md`, `docs/adr/`. Feature-specs: `docs/features/`.
Milestones en acceptatie: `beam-kickoff/`.
