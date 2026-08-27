# HEREweHOLO Beam — Quick Start (EN)

*HoloMe is the sending side (presenter). HoloSee is the receiving side (the hologram display).
Five minutes from zero to a face on the glass.*

> Nederlandse versie: [QUICKSTART.nl.md](QUICKSTART.nl.md) · Full manual: [MANUAL.en.md](MANUAL.en.md)

## 1 · Start the platform

```bash
cd platform
npm install
./scripts/get-livekit.sh                 # media server binary → .livekit/
sudo service postgresql start            # any PostgreSQL 16 with a 'holo' database
.livekit/livekit-server --bind 127.0.0.1 --node-ip 127.0.0.1 --port 7880 \
  --keys "devkey: devsecret_devsecret_devsecret_00" &
npm start                                # migrates the database + serves on :8800
```

Production: `platform/deploy/` has a docker-compose with the app, PostgreSQL, LiveKit,
coturn (TURN) and Caddy (TLS). Copy `env.example`, set real secrets, deploy.

## 2 · Create your organisation

Open **`/login.html`** → *Create organisation*. The first account is the **owner**.

## 3 · Pair a display (HoloSee)

1. On the display PC, open **`/receiver.html`** — it shows a 6-character code.
2. In your console (**`/app.html`**) enter the code, a name and the kind (Holobox / Holomini
   / Holowall) → **Pair device**.
3. The display authenticates itself within seconds and shows **ONLINE**.

The identity is a keypair generated *on the device* — there is nothing to copy or leak.
For unattended operation run the watchdog on the display PC:

```bash
RECEIVER_URL=https://your-platform/receiver.html node agent/watchdog.mjs
```

It autostarts the kiosk browser, restarts it on any crash, and reports host health.

## 4 · Go live (HoloMe)

1. In **`/app.html`**, click the destination display(s) → **Continue**.
2. The pre-flight runs automatically and tells you honestly what your connection can carry
   ("uplink 42 Mbps · encode 1080p60: smooth · hardware: yes → starting at 1080p60").
3. Press **GO LIVE**. The status strip shows *measured* values only — time, resolution,
   fps, Mbps, current quality rung.
4. Press **STOP** when done. The display returns to the brand screen — never an error.

## 5 · Invite a guest

In `/app.html`: select destinations → set validity, uses, optional password → **Create
link**. The guest opens the link, sees *where* they will appear **before** any camera
permission, types their name, and presents from the browser. Nothing to install.

## 6 · Run the fleet

Open **`/fleet.html`** (operator role or higher): live KPIs, host health per display,
alerts that raise *and resolve themselves* on measured conditions, remote actions
(reload, net test, logs, restart browser, reboot), session analytics with measured
egress, and the audit trail.

## Something wrong?

| Symptom | First move |
|---|---|
| Display shows pairing code again | Its claim was never completed — enter the code in `/app.html` |
| Display OFFLINE | Check the watchdog is running; `/fleet.html` → *Net test* / *Restart browser* |
| Glass shows brand screen mid-session | That is the honest fallback; it rejoins by itself. Check the alert in `/fleet.html` |
| GO LIVE fails | The pre-flight verdict tells you why; the button always returns to a retryable state |

Full detail, deployment, quality ladder, updates and troubleshooting: **[MANUAL.en.md](MANUAL.en.md)**.
