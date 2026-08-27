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
// M8 — this file is also what ships inside the Windows agent .exe (see windows/build-exe.mjs):
// configuration then comes from a config.env next to the executable, and the code stays free
// of top-level await so it bundles to CommonJS for Node's single-executable format.
//
//   RECEIVER_URL     required, e.g. https://app.example.com/receiver.html
//   CHROMIUM         path to chrome/chromium/msedge (default: chromium on PATH)
//   PROFILE_DIR      persistent user-data-dir (default: ./holosee-profile)
//   EXTRA_FLAGS      extra chromium flags, space-separated (tests use headless here)
//   NO_KIOSK=1       omit --kiosk (tests)
//   HEALTH_EVERY_MS  host-health report interval (default 30000)
//   ALLOW_REBOOT=1   allow the reboot_host action to actually reboot the host
//   UPDATE_URL/UPDATE_CHANNEL/UPDATE_PUBKEY/UPDATE_DIR/AGENT_VERSION  signed updates (M8)
import { execFile, spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { checkAndApply } from './updater.mjs';

// ——— config.env next to the executable (the installed .exe) or via AGENT_CONFIG ———
// Sets only keys the environment does not already define; the environment always wins.
function loadConfigFile() {
  const candidates = [
    process.env.AGENT_CONFIG,
    path.join(path.dirname(process.execPath), 'config.env'),
  ].filter(Boolean);
  for (const file of candidates) {
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const line of text.split('\n')) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    }
    return file;
  }
  return undefined;
}
const configFile = loadConfigFile();

const url = process.env.RECEIVER_URL;
if (!url) {
  console.error('RECEIVER_URL is required (environment or config.env next to the executable)');
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
let helperPort = 0;

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

// ——— host-level remote actions, forwarded by the receiver page ———
function runHostAction(action, actionId) {
  log('host action', { action, actionId });
  if (action === 'restart_browser') {
    child?.kill('SIGKILL'); // the restart loop brings it back
    return;
  }
  if (action === 'reboot_host') {
    if (process.env.ALLOW_REBOOT === '1') {
      const [cmd, args] =
        process.platform === 'win32' ? ['shutdown', ['/r', '/t', '5']] : ['shutdown', ['-r', 'now']];
      execFile(cmd, args, (err) => err && log('reboot failed', { error: String(err).slice(0, 120) }));
    } else {
      log('reboot_host ignored (set ALLOW_REBOOT=1 on real hardware)');
    }
  }
}

// ——— M8: signed automatic updates (STABLE/BETA/INTERNAL) ———
// The check stages a verified bundle and flips the version pointer; applying it is a
// restart, which the service manager (Scheduled Task / systemd) owns. A version that
// fails its health check after restart is rolled back by the service wrapper via
// updater.rollback(). Both the sha256 and the Ed25519 signature must verify — see
// agent/updater.mjs and its tests.
function startUpdateChecks() {
  if (!process.env.UPDATE_URL || !process.env.UPDATE_PUBKEY) return;
  const updDir = process.env.UPDATE_DIR ?? path.join(profile, '..', 'holosee-agent');
  const check = async () => {
    try {
      const r = await checkAndApply({
        baseUrl: process.env.UPDATE_URL,
        channel: process.env.UPDATE_CHANNEL ?? 'stable',
        appDir: updDir,
        publicKeyPem: process.env.UPDATE_PUBKEY,
        currentVersion: process.env.AGENT_VERSION ?? '0.0.0',
      });
      if (r.updated) log('update staged — next agent restart applies it', { version: r.version, previous: r.previous });
    } catch (e) {
      log('update check refused/failed', { error: String(e).slice(0, 160) });
    }
  };
  setInterval(() => void check(), Number(process.env.UPDATE_EVERY_MS ?? 6 * 3_600_000));
  void check();
}

// ——— the kiosk browser itself ———
let backoffMs = 1000;
let child;
let stopping = false;

function start() {
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
  const startedAt = Date.now();
  child = spawn(chromium, baseFlags, { stdio: 'ignore' });
  log('browser started', { pid: child.pid, profile });
  // A wrong CHROMIUM path (spawn ENOENT) must never kill the agent — log and keep retrying.
  child.on('error', (err) => {
    if (stopping) return;
    log('browser failed to start — retrying', { error: String(err).slice(0, 120), chromium, backoffMs });
    setTimeout(start, backoffMs);
    backoffMs = Math.min(backoffMs * 2, 15_000);
  });
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

async function main() {
  if (configFile) log('config loaded', { file: configFile });
  await new Promise((r) => helper.listen(0, '127.0.0.1', r));
  helperPort = helper.address().port;
  log('helper listening', { port: helperPort });
  setInterval(() => void reportHealth(), healthEveryMs);
  startUpdateChecks();
  start();
}

void main();
