// M6 e2e — quality that is real:
//   A. receiver pairs; its measured decode capabilities land on the platform (negotiation input)
//   B. presenter runs the network pre-flight (honest verdict), goes live at a pinned rung,
//      frames reach the glass at that rung (receiver-reported render height)
//   C. the sender's CPU is genuinely throttled (CDP) -> the encoder reports cpu limitation ->
//      the ladder steps DOWN, fast, and the session never drops (no fallback on the glass)
//   D. the throttle is released -> after a stable window the ladder steps back UP (slow)
//   E. the diagnostic view shows the full measured resolution chain
//   F. stop; the session record carries the ladder history
import assert from 'node:assert/strict';
import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright-core';

const APP_PORT = 8903;
const LK_PORT = 7894; // NOT 7881/7883 (LiveKit RTC-TCP defaults)
const BASE = `http://localhost:${APP_PORT}`;
const DB = 'postgres://holo:holo_dev@127.0.0.1:5432/holo_test';
const LK_BIN = process.env.LIVEKIT_BIN ?? new URL('../.livekit/livekit-server', import.meta.url).pathname;
const EXE = process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium';
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

const lkLog = fs.openSync('/tmp/e2e-m6-livekit.log', 'a');
const lk = spawn(
  LK_BIN,
  ['--bind', '127.0.0.1', '--node-ip', '127.0.0.1', '--port', String(LK_PORT), '--keys', 'devkey: devsecret_devsecret_devsecret_00'],
  { stdio: ['ignore', lkLog, lkLog] },
);
lk.on('exit', (code, sig) => console.log(`   [livekit] exited code=${code} sig=${sig}`));
procs.push(lk);

const app = spawn('node', ['node_modules/tsx/dist/cli.mjs', 'server/index.ts'], {
  env: {
    ...process.env,
    PORT: String(APP_PORT),
    DATABASE_URL: DB,
    LIVEKIT_URL: `ws://localhost:${LK_PORT}`,
    LIVEKIT_API_KEY: 'devkey',
    LIVEKIT_API_SECRET: 'devsecret_devsecret_devsecret_00',
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

// Click GO LIVE only when the page is truly idle, atomically inside the page (a queued
// Playwright click would fire the moment goLive flips the button to STOP and kill the session).
const clickGoLiveWhenIdle = (page) =>
  page.evaluate(() => {
    const b = document.querySelector('#golive');
    if (b && !b.disabled && b.textContent.trim() === 'GO LIVE') b.click();
  });

try {
  await waitFor('app up', () => fetch(`${BASE}/api/v1/health`).then((r) => r.ok).catch(() => false), 40);

  const reg = await api('/auth/register', {
    body: { orgName: 'M6 BV', email: 'm6@example.test', password: 'supersecret123', displayName: 'M6 Owner' },
  });
  const token = reg.data.access;

  // —— A. pair; the receiver reports its measured decode caps + screen ——
  const rcvBrowser = await chromium.launch({ executablePath: EXE, args: [...FLAGS, '--window-size=1920,1080'] });
  const rcv = await rcvBrowser.newPage({ viewport: { width: 1920, height: 1080 } });
  await rcv.goto(`${BASE}/receiver.html?diag=1`);
  const code = await waitFor('pairing code', async () =>
    (((await rcv.textContent('#rcvCode').catch(() => '')) ?? '').replace(/[^A-Z0-9]/g, '') || false),
  );
  const claim = await api('/devices/claim', { token, body: { code, name: 'Rotterdam Wall', kind: 'holowall' } });
  assert.equal(claim.status, 201);
  const deviceId = claim.data.device.id;
  await waitFor('device online', async () => (await api('/devices', { token })).data.devices[0]?.state === 'online');
  const caps = await waitFor('decode caps reported', async () => (await api('/devices', { token })).data.devices[0]?.caps || false, 40);
  assert.ok(Array.isArray(caps.decode) && caps.decode.length === 6, 'caps must cover the whole ladder');
  assert.ok(caps.screen?.w > 0, 'physical screen must be reported');
  const okRungs = caps.decode.filter((c) => c.ok).map((c) => c.rung);
  console.log(`A. paired; measured decode caps on record — smooth rungs here: ${okRungs.join(', ') || 'none'} (honest)`);

  // —— B. pre-flight verdict, then live at the pinned rung ——
  const browser = await chromium.launch({ executablePath: EXE, args: FLAGS });
  const presenter = await browser.newPage();
  presenter.on('console', (m) => {
    if (m.type() === 'error') console.log('   [presenter console.error]', m.text().slice(0, 160));
  });
  await presenter.addInitScript((s) => localStorage.setItem('hw_session', s), JSON.stringify({ access: token }));
  await presenter.goto(`${BASE}/session.html?d=${deviceId}&fake=1&pin=1080p30`);
  const verdict = await waitFor('pre-flight verdict', async () => {
    const t = ((await presenter.textContent('#pfLines').catch(() => '')) ?? '').trim();
    return t.includes('starting at') ? t : false;
  }, 40);
  assert.ok(verdict.includes('uplink') && verdict.includes('Mbps'), 'verdict must show measured network numbers');
  assert.ok(verdict.includes('starting at 1080p30'), `pin must set the start rung, got: ${verdict}`);
  console.log(`B. pre-flight (measured): ${verdict.split('\n')[0]}`);

  await waitFor('presenter CONNECTED', async () => {
    const conn = ((await presenter.textContent('#conn')) ?? '').trim();
    if (conn.includes('CONNECTED')) return true;
    await clickGoLiveWhenIdle(presenter);
    return false;
  }, 30, 1000);
  const playing = await waitFor('session_playing event', async () => {
    const ev = (await api(`/devices/${deviceId}/events`, { token })).data.events ?? [];
    return ev.find((e) => e.type === 'session_playing') || false;
  });
  const sessionId = playing.session_id;
  const rcvH = () =>
    api(`/sessions/${sessionId}/receiver-stats`, { token }).then((r) => r.data.receivers?.[0]?.stats?.h ?? 0);
  await waitFor('glass renders 1080 lines', async () => (await rcvH()) >= 1000, 60);
  console.log(`B. live at 1080p30 — glass confirms ${await rcvH()} lines (receiver-reported, session ${sessionId})`);

  // —— C. genuinely starve the encoder: CPU-throttle the sender's renderer ——
  const cdp = await presenter.context().newCDPSession(presenter);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 20 });
  console.log('C. sender CPU throttled 20× (CDP) — waiting for the ladder to react…');
  let cTicks = 0;
  await waitFor('ladder steps down to 720p30', async () => {
    const strip = ((await presenter.textContent('#strip')) ?? '').trim();
    if ((cTicks += 1) % 5 === 0) {
      const s = await presenter.evaluate(() => window.__hw?.state?.()).catch(() => undefined);
      console.log(`   [C] ${JSON.stringify(s)}`);
    }
    return strip.includes('720p30');
  }, 60, 1000);
  await waitFor('glass follows down (≤720 lines)', async () => {
    const h = await rcvH();
    return h > 0 && h <= 720;
  }, 40, 1000);
  const connDuring = ((await presenter.textContent('#conn')) ?? '').trim();
  assert.ok(connDuring.includes('CONNECTED'), `session must survive the step-down, conn=${connDuring}`);
  console.log(`C. ladder stepped DOWN under real cpu limitation — session stayed CONNECTED, glass at ${await rcvH()} lines`);

  // —— D. release; recovery is slow and deliberate ——
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  console.log('D. throttle released — recovery window (up is slow by design)…');
  await waitFor('ladder steps back up to 1080p30', async () => {
    const strip = ((await presenter.textContent('#strip')) ?? '').trim();
    return strip.includes('1080p30');
  }, 120, 1000);
  await waitFor('glass back at 1080 lines', async () => (await rcvH()) >= 1000, 60, 1000);
  const events = (await api(`/devices/${deviceId}/events`, { token })).data.events ?? [];
  assert.ok(
    !events.some((e) => e.type === 'fallback_shown' && e.session_id === sessionId),
    'the glass must never have fallen back during the ladder cycle',
  );
  console.log('D. ladder recovered UP to 1080p30 — no fallback ever shown on the glass');

  // —— E. the diagnostic view: the whole chain, measured ——
  await presenter.click('#diagBtn');
  const diagText = await waitFor('diagnostic chain', async () => {
    const t = ((await presenter.textContent('#diag').catch(() => '')) ?? '').trim();
    return t.includes('CAPTURE') && t.includes('ENCODE') && t.includes('RENDER') && t.includes('LADDER') ? t : false;
  }, 20, 1000);
  assert.ok(/limitation: (none|cpu|bandwidth)/.test(diagText), 'encode limitation must be shown');
  assert.ok(diagText.includes('PHYSICAL'), 'physical output must be part of the chain');
  console.log('E. diagnostic view shows capture → encode → transport → decode → render → physical, measured');

  // —— F. stop; the ladder history is part of the session record ——
  await presenter.evaluate(() => document.querySelector('#golive').click()); // STOP
  await sleep(1500);
  const sessions = (await api('/sessions', { token })).data.sessions ?? [];
  const rec = sessions.find((s) => s.id === sessionId);
  assert.equal(rec?.state, 'ended');
  const ladder = rec?.stats?.ladder ?? [];
  assert.ok(ladder.some((l) => l.includes('1080p30→720p30')), `ladder history must record the step down: ${ladder}`);
  assert.ok(ladder.some((l) => l.includes('720p30→1080p30(recovered)')), `and the recovery: ${ladder}`);
  console.log(`F. session record carries the ladder history: ${ladder.join(' · ')}`);

  console.log('\nM6 E2E OK — measured caps, honest pre-flight, real step-down under cpu limitation, slow recovery, full diagnostic chain.');
  await browser.close();
  await rcvBrowser.close();
  stop(0);
} catch (err) {
  console.error('M6 E2E FAILED —', err);
  stop(1);
}
