// M5 watchdog — keeps the HoloSee kiosk browser alive, forever, without human action.
// Crash → restart with backoff (reset after a healthy minute). The browser profile is
// persistent, so the device identity (IndexedDB keypair) survives every restart and the
// receiver reconnects by itself: autostart + auto-connect.
//
// M7 — the watchdog is also the device's host agent. The browser cannot measure CPU load,
// memory, disk or temperature; this process can, honestly. The receiver page hands its
// short-lived device token to the watchdog over a localhost-only listener (same machine,
// same trust domain, secret in the launch URL); the watchdog then reports host health to
// the platform and executes host-level remote actions (restart browser, reboot).
//
//   RECEIVER_URL     required, e.g. https://app.example.com/receiver.html
//   CHROMIUM         path to chrome/chromium (default: chromium on PATH)
//   PROFILE_DIR      persistent user-data-dir (default: ./holosee-profile)
//   EXTRA_FLAGS      extra chromium flags, space-separated (tests use headless here)
//   NO_KIOSK=1       omit --kiosk (tests)
//   HEALTH_EVERY_MS  host-health report interval (default 30000)
//   ALLOW_REBOOT=1   allow the reboot_host action to actually run `shutdown -r now`
import { execFile, spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const url = process.env.RECEIVER_URL;
if (!url) {
  console.error('RECEIVER_URL is required');
  process.exit(1);
}
const chromium = process.env.CHROMIUM ?? 'chromium';
const profile = path.resolve(process.env.PROFILE_DIR ?? './holosee-profile');
const extra = (process.env.EXTRA_FLAGS ?? '').split(' ').filter(Boolean);
const healthEveryMs = Number(process.env.HEALTH_EVERY_MS ?? 30_000);
const platformOrigin = new URL(url).origin;

const log = (msg, meta = {}) => console.log(JSON.stringify({ src: 'watchdog', msg, at: new Date().toISOString(), ...meta }));

// ——— localhost helper listener: token drop-off + host-level actions ———
const secret = crypto.randomBytes(16).toString('base64url');
let deviceToken = '';

const helper = http.createServer((req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'content-type');
  if (req.method === 'OPTIONS') {
    res.end();
    return;
  }
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    let msg = {};
    try {
      msg = JSON.parse(body || '{}');
    } catch {}
    if (msg.secret !== secret) {
      res.statusCode = 403;
      res.end('{}');
      return;
    }
    if (req.url === '/token' && typeof msg.token === 'string') {
      const hadToken = !!deviceToken;
      deviceToken = msg.token;
      if (!hadToken) void reportHealth(); // first token → first health report immediately
      res.end('{"ok":true}');
      return;
    }
    if (req.url === '/do' && typeof msg.action === 'string') {
      res.end('{"ok":true}');
      runHostAction(msg.action, msg.actionId);
      return;
    }
    res.statusCode = 404;
    res.end('{}');
  });
});
await new Promise((r) => helper.listen(0, '127.0.0.1', r));
const helperPort = helper.address().port;
log('helper listening', { port: helperPort });

// ——— host health: only what this host actually exposes; missing values stay null ———
function readTemperatureC() {
  try {
    const raw = fs.readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf8').trim();
    const v = Number(raw);
    return Number.isFinite(v) ? Math.round(v / 100) / 10 : null;
  } catch {
    return null;
  }
}

function measureHealth() {
  let disk = null;
  try {
    const s = fs.statfsSync(profile);
    const total = s.blocks * s.bsize;
    const free = s.bavail * s.bsize;
    disk = { totalBytes: total, freeBytes: free, freePct: Math.round((free / total) * 1000) / 10 };
  } catch {}
  return {
    load1: os.loadavg()[0],
    cores: os.availableParallelism(),
    memTotalBytes: os.totalmem(),
    memFreeBytes: os.freemem(),
    disk,
    temperatureC: readTemperatureC(), // null where the host exposes no thermal zone
    hostUptimeS: Math.round(os.uptime()),
    agentUptimeS: Math.round(process.uptime()),
    platform: `${os.platform()} ${os.release()}`,
  };
}

async function reportHealth() {
  if (!deviceToken) return;
  try {
    await fetch(`${platformOrigin}/api/v1/devices/health`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${deviceToken}` },
      body: JSON.stringify({ health: measureHealth() }),
    });
  } catch (e) {
    log('health report failed', { error: String(e).slice(0, 120) });
  }
}
setInterval(() => void reportHealth(), healthEveryMs);

// ——— host-level remote actions, forwarded by the receiver page ———
function runHostAction(action, actionId) {
  log('host action', { action, actionId });
  if (action === 'restart_browser') {
    child?.kill('SIGKILL'); // the restart loop brings it back
    return;
  }
  if (action === 'reboot_host') {
    if (process.env.ALLOW_REBOOT === '1') {
      execFile('shutdown', ['-r', 'now'], (err) => err && log('reboot failed', { error: String(err).slice(0, 120) }));
    } else {
      log('reboot_host ignored (set ALLOW_REBOOT=1 on real hardware)');
    }
  }
}

// ——— the kiosk browser itself ———
const launchUrl = `${url}${url.includes('?') ? '&' : '?'}wd=${helperPort}&wds=${secret}`;
const baseFlags = [
  ...(process.env.NO_KIOSK ? [] : ['--kiosk']),
  '--noerrdialogs',
  '--disable-session-crashed-bubble',
  '--disable-infobars',
  '--no-first-run',
  '--autoplay-policy=no-user-gesture-required',
  `--user-data-dir=${profile}`,
  ...extra,
  launchUrl,
];

let backoffMs = 1000;
let child;
let stopping = false;

function start() {
  const startedAt = Date.now();
  child = spawn(chromium, baseFlags, { stdio: 'ignore' });
  log('browser started', { pid: child.pid, profile });
  child.on('exit', (code, signal) => {
    if (stopping) return;
    const uptimeMs = Date.now() - startedAt;
    if (uptimeMs > 60_000) backoffMs = 1000; // healthy run → reset backoff
    log('browser exited — restarting', { code, signal, uptimeMs, backoffMs });
    setTimeout(start, backoffMs);
    backoffMs = Math.min(backoffMs * 2, 15_000);
  });
}

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    stopping = true;
    child?.kill();
    process.exit(0);
  });
}

start();
