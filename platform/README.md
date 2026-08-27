# platform/ — HoloMe & HoloSee (M2 + M3 + M4)

The product platform on the accepted ADRs: PostgreSQL control plane, LiveKit SFU media plane,
device pairing with signed keypairs, invite links, and the presenter/guest session flow with an
honest status strip. M1 (`../m1/`) proved camera-to-glass; this makes it a system.

## Run locally

```bash
cd platform
npm install
./scripts/get-livekit.sh                 # fetches the LiveKit server binary into .livekit/
sudo service postgresql start            # any PostgreSQL 16 with a 'holo' database works
.livekit/livekit-server --bind 127.0.0.1 --node-ip 127.0.0.1 --port 7880 \
  --keys "devkey: devsecret_devsecret_devsecret_00" &
npm start                                # migrates + serves on :8800
```

Pages: `/login.html` (create an organisation, then sign in) · `/app.html` (destinations, pairing,
invites) · `/receiver.html` (HoloSee — open on the display machine) · `/join.html?t=…` (guest).

## What each milestone got

**M2 — across the internet**
- LiveKit SFU (ADR-001) carries all media; the platform mints room-scoped tokens
  (`server/livekit.ts`) — the control plane is the only minter, keys never reach a client.
- `deploy/`: docker-compose with app, PostgreSQL, LiveKit (`use_external_ip`), coturn
  (TURN/TLS 5349) and Caddy TLS. **Honesty note:** real NAT traversal from home/mobile/corporate
  networks and the forced-relay test are the M2 gate and can only be run from a real deployment —
  this sandbox has no NAT to traverse. Everything up to that point runs and is tested here.

**M3 — identity, organisations, devices**
- SQL-first migrations (`server/migrations/`), Argon2id (OWASP params), 15-min access JWTs,
  single-use rotating refresh tokens, roles owner→viewer.
- Pairing per SECURITY.md §3: the receiver generates a non-extractable P-256 keypair
  (IndexedDB), requests a code bound to its public key; an admin claims it; the device then signs
  a nonce to authenticate. Wrong key → 401 (tested).
- Presence: one WebSocket per device; ONLINE/OFFLINE is socket liveness (tested).
- **M3 gate test** in `test/api.test.mjs`: two organisations; org B cannot list, invite to, or
  start sessions on org A devices.

**M4 — the session**
- Destination selection before the camera opens (`app.html`), invite links (time-limited,
  revocable, single-use or reusable, optional password — all tested), guest landing that shows
  the destination *before* any permission prompt, GO LIVE / STOP, return-feed inset, and a status
  strip that shows only measured values (`0 × 0`/`STANDBY` are honest states; stats land in the
  session record on stop).
- Echo cancellation is requested explicitly; a missing microphone is reported, never faked.
- Settings lock while live (UI state); receiver returns to brand idle on stop — never an error.

**M5 — unattended operation**
- **Fallback, never an error:** the receiver is a state machine idle → live ⇄ fallback. A media
  stall (> 4 s without a decoded frame) or SFU loss switches the glass to the brand screen and
  starts a silent rejoin loop; recovery is logged with the outage duration. Page errors are
  captured and logged — nothing ever renders as an error on the glass.
- **Watchdog** (`agent/watchdog.mjs`): keeps the kiosk browser alive with exponential backoff
  (reset after a healthy minute). The browser profile is persistent, so the device identity
  survives crashes and reboots → autostart + auto-connect without human action.
  `agent/windows/install.ps1` registers it as a Scheduled Task, disables sleep and toasts
  (untested here — validate on real hardware per the M5 gate).
- **Structured events** (`device_events`): boot, online/offline (incl. heartbeat-timeout zombies
  swept server-side), session_playing, fallback_shown, recovered — every row carries the session
  id, so a session is reconstructable end to end.
- **The cable-pull e2e** (`npm run test:e2e:m5`): pair once → close → watchdog boots the receiver
  from the profile (same identity, no re-pair) → presenter live (proven by the `session_playing`
  event) → **SFU killed mid-stream** → `fallback_shown` within the window → SFU returns → a new
  session plays with the receiver untouched → kiosk browser killed → watchdog restarts it →
  same device ONLINE again → full event trail asserted.

## Tests (the test → fix → test loop)

```bash
npm run test:api   # 10 integration tests against real PostgreSQL (schema recreated per run)
npm run test:e2e   # full path: pairing on the glass → ONLINE → GO LIVE → SFU → frames → STOP
```

E2E notes for this sandbox: no capture devices exist (even Chromium's fake camera enumerates
zero), so the sender uses a synthetic canvas stream — everything after capture is the real
pipeline through the real SFU. Chromium's mDNS candidate obfuscation is disabled in the test
because the sandbox cannot resolve `.local`; real deployments use STUN and are unaffected.

## Still outside this sandbox (deploy-time gates)

M2 gate: three real network types + forced TURN relay for 10 minutes · M4 gate: the full
`ACCEPTANCE.md` scenario with a real guest and a real Holobox · M5+ (kiosk hardening, real 4K
verification, fleet ops, installer) are the next slices.
