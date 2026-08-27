// M5 e2e — unattended operation, the "pull the cable" test:
//   A. receiver pairs once (persistent browser profile = the device identity)
//   B. the WATCHDOG launches the browser from that profile: autostart + auto-connect, no human
//   C. presenter goes live -> structured event `session_playing` proves frames on the glass
//   D. the SFU is killed mid-stream (network cable pull on the media path)
//        -> `fallback_shown` within the window, brand screen, no error
//   E. SFU returns; a NEW session plays again WITHOUT anyone touching the receiver
//   F. the kiosk browser is killed (crash) -> watchdog restarts it -> same device, ONLINE again
import assert from 'node:assert/strict';
import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright-core';

const APP_PORT = 8902;
const LK_PORT = 7892;
const BASE = `http://localhost:${APP_PORT}`;
const DB = 'postgres://holo:holo_dev@127.0.0.1:5432/holo_test';
const LK_BIN = process.env.LIVEKIT_BIN ?? new URL('../.livekit/livekit-server', import.meta.url).pathname;
const EXE = process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium';
const LK_KEY = 'devkey';
const LK_SECRET = 'devsecret_devsecret_devsecret_00';
const FLAGS = [
  '--no-sandbox',
  '--disable-gpu',
  '--autoplay-policy=no-user-gesture-required',
  '--use-fake-ui-for-media-capture',
  '--disable-features=WebRtcHideLocalIpsWithMdns',
];

execSync(`psql "${DB}" -q -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'`);
try {
  execSync('pkill -x livekit-server');
} catch {}

const procs = [];
const stop = (code) => {
  for (const p of procs) {
    try {
      p.kill('SIGKILL');
    } catch {}
  }
  process.exit(code);
};

function startLivekit() {
  const lkLog = fs.openSync('/tmp/e2e-m5-livekit.log', 'a');
  const lk = spawn(
    LK_BIN,
    ['--bind', '127.0.0.1', '--node-ip', '127.0.0.1', '--port', String(LK_PORT), '--keys', `${LK_KEY}: ${LK_SECRET}`],
    { stdio: ['ignore', lkLog, lkLog] },
  );
  lk.on('exit', (code, sig) => console.log(`   [livekit] pid=${lk.pid} exited code=${code} sig=${sig}`));
  procs.push(lk);
  return lk;
}

let lk = startLivekit();

const app = spawn('node', ['node_modules/tsx/dist/cli.mjs', 'server/index.ts'], {
  env: {
    ...process.env,
    PORT: String(APP_PORT),
    DATABASE_URL: DB,
    LIVEKIT_URL: `ws://localhost:${LK_PORT}`,
    LIVEKIT_API_KEY: LK_KEY,
    LIVEKIT_API_SECRET: LK_SECRET,
  },
  stdio: 'inherit',
});
procs.push(app);

const api = async (p, { body, token } = {}) => {
  const r = await fetch(`${BASE}/api/v1${p}`, {
    method: body !== undefined ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, data: await r.json().catch(() => ({})) };
};

const waitFor = async (label, fn, tries = 60, delayMs = 500) => {
  for (let i = 0; i < tries; i++) {
    await sleep(delayMs);
    const v = await fn();
    if (v) return v;
  }
  throw new Error(`timeout waiting for: ${label}`);
};

try {
  await waitFor('app up', () => fetch(`${BASE}/api/v1/health`).then((r) => r.ok).catch(() => false), 40);

  const reg = await api('/auth/register', {
    body: { orgName: 'M5 BV', email: 'm5@example.test', password: 'supersecret123', displayName: 'M5 Owner' },
  });
  const token = reg.data.access;

  // —— A. pair once via a persistent profile ——
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'holosee-'));
  const pctx = await chromium.launchPersistentContext(profile, { executablePath: EXE, args: FLAGS });
  const rcv = pctx.pages()[0] ?? (await pctx.newPage());
  await rcv.goto(`${BASE}/receiver.html`);
  const code = await waitFor('pairing code', async () =>
    (((await rcv.textContent('#rcvCode').catch(() => '')) ?? '').replace(/[^A-Z0-9]/g, '') || false),
  );
  const claim = await api('/devices/claim', { token, body: { code, name: 'Amsterdam HQ', kind: 'holobox' } });
  assert.equal(claim.status, 201);
  const deviceId = claim.data.device.id;
  await waitFor('online after claim', async () => (await api('/devices', { token })).data.devices[0]?.state === 'online');
  await pctx.close();
  await waitFor('offline after close', async () => (await api('/devices', { token })).data.devices[0]?.state === 'offline');
  console.log('A. paired via persistent profile, identity stored on the device');

  // —— B. watchdog autostarts the receiver from the same profile ——
  const wd = spawn('node', ['agent/watchdog.mjs'], {
    env: {
      ...process.env,
      RECEIVER_URL: `${BASE}/receiver.html`,
      CHROMIUM: EXE,
      PROFILE_DIR: profile,
      NO_KIOSK: '1',
      EXTRA_FLAGS: ['--headless=new', ...FLAGS].join(' '),
    },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  procs.push(wd);
  let childPid = 0;
  wd.stdout.on('data', (d) => {
    for (const lineTxt of String(d).trim().split('\n')) {
      try {
        const j = JSON.parse(lineTxt);
        if (j.msg === 'browser started') childPid = j.pid;
        console.log(`   [watchdog] ${j.msg}${j.pid ? ' pid=' + j.pid : ''}`);
      } catch {}
    }
  });
  await waitFor('online via watchdog', async () => (await api('/devices', { token })).data.devices[0]?.state === 'online');
  assert.equal((await api('/devices', { token })).data.devices.length, 1, 'must reuse identity, not re-pair');
  console.log('B. watchdog boot -> auto-connect with the SAME device identity (no human action)');

  // —— C. presenter live; the structured event stream is the proof of frames on glass ——
  const browser = await chromium.launch({ executablePath: EXE, args: FLAGS });
  const presenter = await browser.newPage();
  presenter.on('console', (m) => {
    if (m.type() === 'error') console.log('   [presenter console.error]', m.text().slice(0, 200));
  });
  await presenter.addInitScript((s) => localStorage.setItem('hw_session', s), JSON.stringify({ access: token }));
  await presenter.goto(`${BASE}/session.html?d=${deviceId}&fake=1&auto=1`);
  const playing = await waitFor('session_playing event', async () => {
    const ev = (await api(`/devices/${deviceId}/events`, { token })).data.events ?? [];
    return ev.find((e) => e.type === 'session_playing') || false;
  });
  console.log(`C. live — glass reports ${playing.meta.w}×${playing.meta.h} (event session_playing, session ${playing.session_id})`);

  // —— D. pull the cable: kill the SFU mid-stream ——
  const cutAt = Date.now();
  lk.kill('SIGKILL');
  const fb = await waitFor('fallback_shown event', async () => {
    const ev = (await api(`/devices/${deviceId}/events`, { token })).data.events ?? [];
    return ev.find((e) => e.type === 'fallback_shown') || false;
  }, 40);
  const fallbackAfterMs = Date.now() - cutAt;
  console.log(`D. SFU killed -> fallback (brand screen) within ${(fallbackAfterMs / 1000).toFixed(1)}s, reason=${fb.meta.reason}`);
  assert.ok(fallbackAfterMs < 15_000, 'fallback must appear within the defined window');

  // —— E. SFU returns; a new session must reach the glass with zero receiver interaction ——
  lk = startLivekit();
  await waitFor('SFU back up', () => fetch(`http://127.0.0.1:${LK_PORT}/`).then((r) => r.ok).catch(() => false), 30);
  await presenter.click('#golive'); // STOP the broken session
  await sleep(1500);
  // GO LIVE again; if the first attempt races the SFU warm-up, retry like a real presenter would.
  await waitFor('presenter live again', async () => {
    const conn = ((await presenter.textContent('#conn')) ?? '').trim();
    const btn = ((await presenter.textContent('#golive')) ?? '').trim();
    const lkUp = await fetch(`http://127.0.0.1:${LK_PORT}/`).then((r) => r.status).catch((e) => e.cause?.code ?? 'down');
    console.log(`   [E] conn="${conn}" btn="${btn}" sfu=${lkUp}`);
    if (conn.includes('CONNECTED')) return true;
    // Click only when the page is truly idle, atomically inside the page. A queued
    // Playwright click on the disabled button would fire the instant goLive succeeds
    // and flips it to an enabled STOP — stopping the session it just started.
    await presenter.evaluate(() => {
      const b = document.querySelector('#golive');
      if (b && !b.disabled && b.textContent.trim() === 'GO LIVE') b.click();
    });
    return false;
  }, 30, 1000);
  const playing2 = await waitFor('second session_playing', async () => {
    const ev = (await api(`/devices/${deviceId}/events`, { token })).data.events ?? [];
    return ev.find((e) => e.type === 'session_playing' && e.session_id !== playing.session_id) || false;
  }, 60);
  console.log(`E. SFU back -> new session ${playing2.session_id} plays on the glass, receiver untouched`);

  // —— F. crash the kiosk browser; the watchdog must bring it back ——
  await presenter.click('#golive'); // stop cleanly first
  await sleep(1000);
  assert.ok(childPid > 0, 'watchdog must have reported its child pid');
  process.kill(childPid, 'SIGKILL');
  await waitFor('offline after crash', async () => (await api('/devices', { token })).data.devices[0]?.state === 'offline', 80);
  await waitFor('online after watchdog restart', async () => (await api('/devices', { token })).data.devices[0]?.state === 'online', 80);
  assert.equal((await api('/devices', { token })).data.devices.length, 1, 'crash recovery must not create a new device');
  console.log('F. kiosk crash -> watchdog restart -> same device ONLINE again');

  // event trail sanity: everything traceable
  const trail = (await api(`/devices/${deviceId}/events`, { token })).data.events.map((e) => e.type);
  for (const t of ['boot', 'online', 'offline', 'session_playing', 'fallback_shown']) {
    assert.ok(trail.includes(t), `event trail must contain ${t}: ${trail.join(',')}`);
  }

  console.log('\nM5 E2E OK — autostart, auto-connect, fallback on cable pull, silent recovery, crash restart, full event trail.');
  await browser.close();
  wd.kill('SIGTERM');
  stop(0);
} catch (err) {
  console.error('M5 E2E FAILED —', err);
  stop(1);
}
