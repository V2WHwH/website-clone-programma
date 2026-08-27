# HEREweHOLO Beam — Manual (EN)

The complete guide to the telepresence platform: **HoloMe** (the sending side) and
**HoloSee** (the receiving side on Holobox, Holomini and Holowall displays).

> Nederlandse versie: [MANUAL.nl.md](MANUAL.nl.md) · Quick start: [QUICKSTART.en.md](QUICKSTART.en.md)

---

## 1 · What this is, and what it promises

Beam puts a live person on holographic glass: camera in on one side, presence out on the
other, with a return feed so the presenter sees the room they are standing in.

One principle runs through every screen and every line of code: **the product never claims
what it did not measure.** The status strip shows measured resolution, fps and bitrate or
nothing; "4K" appears only when 4K frames were verifiably delivered; a missing microphone
is reported, not papered over; and the receiving glass never, under any circumstance,
shows an error to the audience — it falls back to the brand screen and recovers silently.

## 2 · The pieces

| Piece | What it is |
|---|---|
| **Platform** (`platform/server`) | Control plane: accounts, organisations, devices, sessions, invites, alerts, audit. REST under `/api/v1`, one WebSocket per device. |
| **LiveKit SFU** | Media plane. All audio/video flows through it; the platform is the only minter of its room tokens. |
| **HoloMe** (`/app.html`, `/session.html`) | The presenter experience: destination first, pre-flight, GO LIVE, honest strip, return feed, diagnostics. |
| **HoloSee** (`/receiver.html`) | The display experience: pairing, playback, fallback state machine, event reporting, diag overlay. |
| **Watchdog** (`agent/watchdog.mjs`) | Host agent on the display PC: keeps the kiosk browser alive, measures host health, executes host-level remote actions, checks for signed updates. |
| **Fleet** (`/fleet.html`) | The operations console: KPIs, health, alerts, remote actions, analytics, audit. |

## 3 · Installation

### Development

```bash
cd platform && npm install
./scripts/get-livekit.sh
sudo service postgresql start        # database 'holo', user 'holo'
.livekit/livekit-server --bind 127.0.0.1 --node-ip 127.0.0.1 --port 7880 \
  --keys "devkey: devsecret_devsecret_devsecret_00" &
npm start                            # http://localhost:8800
```

Migrations run automatically at startup (`server/migrations/*.sql`, applied in order,
recorded in `schema_migrations`).

### Production (`platform/deploy/`)

`docker-compose.yml` starts: the app, PostgreSQL 16, LiveKit (host networking,
`use_external_ip`), **coturn** (TURN over TLS on 5349 — traversal for strict corporate
networks) and **Caddy** (automatic TLS, reverse proxy). Steps:

1. Copy `deploy/env.example` → `.env`; set `JWT_SECRET`, database password, LiveKit
   API key/secret, domains. **No secrets ever live in the repository.**
2. Point DNS at the machine; Caddy fetches certificates by itself.
3. `docker compose up -d`.

Environment variables (`server/env.ts`): `PORT`, `DATABASE_URL`, `JWT_SECRET`,
`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`. Development defaults exist but
are **refused in production** builds.

## 4 · Organisations, accounts, roles

The platform is multi-tenant: everything (devices, sessions, invites, alerts, audit) is
scoped to an organisation, enforced in every query and covered by tests.

Roles, each including the previous: **viewer** → **presenter** → **operator** →
**admin** → **owner**. Passwords are Argon2id-hashed (OWASP parameters); access tokens
live 15 minutes; refresh tokens rotate on every use — a stolen old cookie is dead.

## 5 · Displays (HoloSee)

### Pairing

The receiver generates a **non-extractable P-256 keypair** in the browser's IndexedDB and
requests a 6-character code bound to its public key (unambiguous alphabet, 10-minute
lifetime). An admin claims the code with a name/kind/location. From then on the device
authenticates by signing a server nonce — there is no secret anyone could copy out of a
config file. Wrong key → 401 (tested).

### Unattended operation

The display is a state machine **idle → live ⇄ fallback**. A media stall (> 4 s without a
decoded frame) or SFU loss switches the glass to the brand screen and starts a silent
3-second rejoin loop; recovery is logged with the outage duration. Page errors are
captured as `log` events; *nothing renders as an error on the glass.*

The **watchdog** keeps the kiosk browser alive with exponential backoff (reset after a
healthy minute). The profile is persistent, so the identity survives crashes and reboots:
autostart + auto-connect with zero human action. On Windows, `agent/windows/install.ps1`
registers it as a Scheduled Task, disables sleep and toasts.

Every transition is a structured **device event** (`boot`, `online`/`offline` — including
server-side zombie sweeps, `session_playing` with measured width×height, `fallback_shown`
with a reason, `recovered` with the outage duration, `action_result`, `log`), each row
carrying the session id, so any session can be reconstructed end to end.

### Diagnostics on the glass

Press **D** on a connected keyboard (or open with `?diag=1`): a monospace overlay shows
STATE, DECODE (implementation, hardware/software), RENDER (measured resolution/fps/
dropped), PHYSICAL (actual screen) and AGENT — measured values only. The audience never
sees this unless a technician asks for it.

## 6 · Presenting (HoloMe)

1. **Destination first.** You pick the glass before any camera opens (`/app.html`).
2. **Pre-flight.** Before GO LIVE the page measures: encode capability across the whole
   quality ladder (via the browser's MediaCapabilities — `powerEfficient` is its hardware
   signal), uplink/downlink throughput with incompressible random bytes against the
   platform itself, RTT, and the destination's *reported decode capability*. The verdict
   is one honest sentence; the starting rung is the highest one that (a) encodes smooth,
   (b) fits the uplink with ×1.4 headroom, (c) every destination can decode.
3. **GO LIVE.** Simulcast publish through the SFU; the display joins by push over its
   presence socket. The **status strip** shows time, measured resolution, measured fps,
   measured Mbps and the current rung. `0 × 0 · STANDBY` is an honest state, not a bug.
4. **Return feed.** The display publishes its own camera back (when it has one) into an
   inset; echo cancellation is explicitly requested on the presenter microphone. A missing
   microphone is *reported*, never faked.
5. **STOP.** Measured session stats (duration, peak resolution, peak Mbps, audio, egress
   bytes, ladder history) land in the session record.

### The quality ladder

`4K60 → 4K30 → 1440p30 → 1080p60 → 1080p30 → 720p30` — **down fast, up slow**:

- **Down:** 3 consecutive seconds of measured distress — the browser attributing
  `cpu`/`bandwidth` limitation on any simulcast layer, *or* achieved encoder fps below
  60% of the rung target — steps one rung down and logs why.
- **Up:** 30 clean seconds step one rung up, never above the negotiated ceiling. If a
  recovery fails, the wait doubles (up to 4 minutes) — no oscillation.
- `?pin=1080p30` pins the start rung and ceiling (operator override). Pinning changes
  what we *attempt*, never what the strip *claims*.

### The diagnostics drawer

The **Diagnostics** button opens the full resolution chain, measured stage by stage:
CAPTURE → ENCODE (implementation, hardware/software, current limitation) → TRANSPORT
(measured Mbps, RTT) → per destination DECODE / RENDER (device-reported fps, drops) →
PHYSICAL (its actual screen), plus the recent ladder history. A dash means "this build
does not expose that value" — never a guess.

## 7 · Guests

Create an invite in `/app.html`: destination(s), validity (1–168 h), single-use or
reusable, optional password. The link token is returned **once**; only its hash is
stored. The guest flow: open link → see the destination and organisation **before any
permission prompt** → name (+ password if set) → camera preview → GO LIVE. Guests get a
2-hour scoped grant that only covers the invited displays; revoking the invite kills it.

## 8 · Fleet operations (`/fleet.html`, operator+)

- **KPIs:** devices online/total, open alerts, live sessions, 24 h sessions / media
  minutes / measured egress.
- **Host health** per display, measured by the watchdog: load per cores, memory use,
  disk free %, temperature (— where the host exposes no sensor), host uptime. The
  receiver hands its short-lived token to the watchdog over a localhost-only channel; the
  browser itself cannot measure these things, so the agent does.
- **Alerts** are measured conditions that raise *and resolve themselves* with a note:
  `offline` (unseen too long), `disk_low` (agent-measured), `stuck_fallback` (brand
  screen without recovery). Manual resolve is one click; everything is audited.
- **Remote actions** (all results come back as `action_result` events): *Reload*,
  *Clear cache* (the keypair in IndexedDB is untouched), *Logs* (on-device ring buffer),
  *Net test* (measured RTT + downlink from the device), *Restart browser* (via the
  watchdog — same identity afterwards), *Reboot* (watchdog; requires `ALLOW_REBOOT=1` on
  the host).
- **Session analytics:** duration, peak quality, **measured egress** (bytes actually
  sent across all simulcast layers) and the ladder history per session. Cost estimates
  multiply *your* rates with these measured quantities — the platform never invents a
  number.
- **Audit trail:** every consequential act (pairing, invites, session start/stop, ladder
  steps, remote actions, alert resolutions) with actor and target.

## 9 · Updates & shipping (M8)

- **Channels:** STABLE / BETA / INTERNAL. A channel manifest names the version, the
  bundle's sha256 and an **Ed25519 signature** over both; the agent refuses anything
  whose hash *or* signature fails against the pinned public key (tested, including
  tampered bundles and wrong-key signatures).
- **Apply & rollback:** the new bundle lands next to the old one; one atomic pointer
  flip activates it; the previous version stays on disk and `rollback()` restores it if
  the new version fails its post-restart health check.
- **Installer:** `agent/windows/installer.iss` (Inno Setup) builds
  *HEREweHOLO Beam Receiver Setup.exe* — install/repair/update/uninstall, Scheduled
  Task, power settings, firewall. Building, signing and validating the exe is done on
  real Windows hardware (see §11).
- **Soak test:** `npm run soak` drives continuous playback, repeated sessions and
  disconnect cycles while sampling the RSS of every process tree; the report fails on
  >25% median growth. `SOAK_MINUTES=1440` is the 24-hour gate run.

## 10 · Testing

| Command | What it proves |
|---|---|
| `npm test` | 12 API integration tests (real PostgreSQL) + 8 update-mechanism tests |
| `npm run test:e2e` | Pairing → ONLINE → presenter *and* guest GO LIVE through the real SFU → frames on glass → STOP |
| `npm run test:e2e:m5` | The cable pull: watchdog boot, SFU killed mid-stream, fallback < 15 s, silent recovery, crash restart, full event trail |
| `npm run test:e2e:m6` | Measured caps, pre-flight verdict, real CPU throttle → ladder down without dropping, slow recovery, diagnostic chain |
| `npm run test:e2e:m7` | The fleet gate: health on record, fault → alert → remote fix without touching the device, toolbox, dashboard, audit |
| `npm run bench:encode` | Encode benchmark matrix (hardware/software, achieved fps, latency, bitrate) for *this* machine |
| `npm run soak` | Long-run stability + memory growth report |

## 11 · What still needs real hardware (deploy-time gates)

Honesty section — these are **not** claimed as done: the M2 network gate (three real
network types + 10 minutes forced TURN relay), the M4 acceptance scenario with a real
guest and a real Holobox, M5 kiosk hardening on real Windows, the M6 genuine-4K session
(this sandbox measures software-only encoding at ~15 fps for 4K — the UI therefore never
claims 4K here) and its bandwidth-throttle ladder test, building/signing the M8
installer, and the 24-hour soak on target hardware with GPU/VRAM/thermal telemetry.

## 12 · Troubleshooting

| Symptom | Diagnosis | Fix |
|---|---|---|
| Display shows a pairing code again | Claim never completed, or IndexedDB was wiped | Re-claim in `/app.html`; investigate who cleared site data |
| Display OFFLINE, PC is on | Kiosk browser or watchdog down | Fleet → *Restart browser*; check the watchdog service; the `offline` alert timestamps it |
| Brand screen during a session | Media stalled > 4 s (network or SFU) | It rejoins by itself; `fallback_shown`/`recovered` events carry reason and duration; `stuck_fallback` alert fires if it does not recover |
| Strip stuck at low resolution | Ladder is holding after real distress | Diagnostics drawer shows the limitation (cpu/bandwidth/low_fps) and the ladder history |
| GO LIVE returns an error text | Session cleanup already ran; the button is retryable | Read the pre-flight verdict; check the destination is ONLINE |
| Guest link "invalid or expired" | TTL passed, uses exhausted, or revoked | Create a fresh invite |
| Remote action returns 409 | Device offline — actions need a live socket | Bring the device online first (watchdog) |
| `no space left` on the display PC | See the `disk_low` alert | Clear space; the alert resolves itself at +5% headroom |

## 13 · Design & further documents

Design system and screens: `design/` (tokens, mockups) and the Figma file. Architecture
and decisions: `docs/ARCHITECTURE.md`, `docs/STREAMING.md`, `docs/SECURITY.md`,
`docs/DATA-MODEL.md`, `docs/adr/`. Feature specs: `docs/features/`. Milestones and
acceptance: `beam-kickoff/`.
