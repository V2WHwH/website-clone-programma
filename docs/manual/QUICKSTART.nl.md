# HEREweHOLO Beam — Snelstart (NL)

*HoloMe is de zendende kant (presentator). HoloSee is de ontvangende kant (het
hologramscherm). In vijf minuten van niets naar een gezicht op het glas.*

> English version: [QUICKSTART.en.md](QUICKSTART.en.md) · Uitgebreide handleiding: [MANUAL.nl.md](MANUAL.nl.md)

## 1 · Start het platform

```bash
cd platform
npm install
./scripts/get-livekit.sh                 # mediaserver-binary → .livekit/
sudo service postgresql start            # elke PostgreSQL 16 met een 'holo'-database
.livekit/livekit-server --bind 127.0.0.1 --node-ip 127.0.0.1 --port 7880 \
  --keys "devkey: devsecret_devsecret_devsecret_00" &
npm start                                # migreert de database + draait op :8800
```

Productie: `platform/deploy/` bevat een docker-compose met de app, PostgreSQL, LiveKit,
coturn (TURN) en Caddy (TLS). Kopieer `env.example`, zet echte secrets, deploy.

## 2 · Maak je organisatie aan

Open **`/login.html`** → *Create organisation*. Het eerste account is de **owner**.

## 3 · Koppel een scherm (HoloSee)

1. Open op de scherm-pc **`/receiver.html`** — er verschijnt een code van 6 tekens.
2. Voer in je console (**`/app.html`**) de code, een naam en het type in (Holobox /
   Holomini / Holowall) → **Pair device**.
3. Het scherm meldt zich binnen enkele seconden zelf aan en toont **ONLINE**.

De identiteit is een sleutelpaar dat *op het apparaat zelf* wordt gegenereerd — er valt
niets te kopiëren of te lekken. Voor onbeheerd draaien start je de watchdog op de
scherm-pc:

```bash
RECEIVER_URL=https://jouw-platform/receiver.html node agent/watchdog.mjs
```

Die start de kioskbrowser automatisch, herstart hem bij elke crash en rapporteert
host-gezondheid.

## 4 · Ga live (HoloMe)

1. Klik in **`/app.html`** de bestemming(en) aan → **Continue**.
2. De pre-flight draait vanzelf en zegt eerlijk wat jouw verbinding aankan
   ("uplink 42 Mbps · encode 1080p60: smooth · hardware: yes → starting at 1080p60").
3. Druk op **GO LIVE**. De statusbalk toont uitsluitend *gemeten* waarden — tijd,
   resolutie, fps, Mbps, huidige kwaliteitstrede.
4. Druk op **STOP** als je klaar bent. Het scherm keert terug naar het merkscherm —
   nooit een foutmelding.

## 5 · Nodig een gast uit

In `/app.html`: selecteer bestemmingen → stel geldigheid, aantal keren en optioneel een
wachtwoord in → **Create link**. De gast opent de link, ziet *waar* die verschijnt
**vóór** enige camerapermissie, typt een naam en presenteert vanuit de browser. Niets te
installeren.

## 6 · Beheer de vloot

Open **`/fleet.html`** (rol operator of hoger): live-KPI's, host-gezondheid per scherm,
alerts die zichzelf op gemeten condities aanmaken *én oplossen*, remote acties (reload,
nettest, logs, browser herstarten, reboot), sessie-analytics met gemeten egress en het
audittrail.

## Gaat er iets mis?

| Symptoom | Eerste stap |
|---|---|
| Scherm toont weer een koppelcode | De claim is nooit afgerond — voer de code in via `/app.html` |
| Scherm OFFLINE | Check of de watchdog draait; `/fleet.html` → *Net test* / *Restart browser* |
| Merkscherm midden in een sessie | Dat is de eerlijke fallback; hij herstelt zichzelf. Zie het alert in `/fleet.html` |
| GO LIVE mislukt | Het pre-flight-oordeel zegt waarom; de knop komt altijd terug in een herbruikbare stand |

Alle details, deployment, kwaliteitsladder, updates en probleemoplossing:
**[MANUAL.nl.md](MANUAL.nl.md)**.
