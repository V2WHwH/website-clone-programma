// M2/M4 e2e — the full product path in one run, against real services:
//   receiver page pairs (keypair -> code -> admin claim -> nonce auth -> presence ONLINE)
//   presenter GO LIVE -> platform mints LiveKit tokens -> SFU routes media -> frames on the glass
//   STOP -> receiver returns to idle, session recorded with stats.
// The sender uses a synthetic canvas stream (?fake=1): this sandbox exposes no capture devices;
// everything after capture is the real pipeline through the real SFU.
import assert from 'node:assert/strict';
import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright-core';

const APP_PORT = 8901;
const LK_PORT = 7891; // NOT 7881: LiveKit's RTC-over-TCP port defaults to 7881 and must stay free
const BASE = `http://localhost:${APP_PORT}`;
const DB = 'postgres://holo:holo_dev@127.0.0.1:5432/holo_test';
const LK_BIN = process.env.LIVEKIT_BIN ?? new URL('../.livekit/livekit-server', import.meta.url).pathname;
const EXE = process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium';
const LK_KEY = 'devkey';
const LK_SECRET = 'devsecret_devsecret_devsecret_00';

if (!fs.existsSync(LK_BIN)) {
  console.error(`livekit-server not found at ${LK_BIN} — run scripts/get-livekit.sh first.`);
  process.exit(1);
}

execSync(`psql "${DB}" -q -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'`);

const procs = [];
const stop = (code) => {
  for (const p of procs) p.kill();
  process.exit(code);
};

try {
  execSync('pkill -x livekit-server');
} catch {
  /* none running */
}
const lkLog = fs.openSync('/tmp/e2e-livekit.log', 'w');
const lk = spawn(
  LK_BIN,
  // --node-ip 127.0.0.1: the sandbox advertises a TEST-NET address in ICE candidates otherwise.
  ['--bind', '127.0.0.1', '--node-ip', '127.0.0.1', '--port', String(LK_PORT), '--keys', `${LK_KEY}: ${LK_SECRET}`],
  { stdio: ['ignore', lkLog, lkLog] },
);
lk.on('exit', (c) => {
  if (c !== null && c !== 0) console.error(`livekit-server exited ${c} — see /tmp/e2e-livekit.log`);
});
procs.push(lk);

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

const api = async (path, { body, token } = {}) => {
  const r = await fetch(`${BASE}/api/v1${path}`, {
    method: body !== undefined ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, data: await r.json().catch(() => ({})) };
};

try {
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    if (await fetch(`${BASE}/api/v1/health`).then((r) => r.ok).catch(() => false)) break;
    if (i === 39) throw new Error('app did not start');
  }

  const reg = await api('/auth/register', {
    body: { orgName: 'E2E BV', email: 'e2e@example.test', password: 'supersecret123', displayName: 'E2E Owner' },
  });
  assert.equal(reg.status, 201);
  const token = reg.data.access;

  const browser = await chromium.launch({
    executablePath: EXE,
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--use-fake-ui-for-media-capture',
      // Chromium hides host ICE candidates behind mDNS; the SFU cannot resolve .local names in
      // this sandbox, so candidates arrive without an IP and get filtered. Real deployments have
      // STUN (srflx candidates) and are unaffected.
      '--disable-features=WebRtcHideLocalIpsWithMdns',
    ],
  });
  const ctx = await browser.newContext();

  // 1) Receiver boots unpaired and shows a code
  const receiver = await ctx.newPage();
  receiver.on('pageerror', (e) => console.log('[receiver pageerror]', e.message));
  await receiver.goto(`${BASE}/receiver.html`);
  let code = '';
  for (let i = 0; i < 20 && !code; i++) {
    await sleep(500);
    code = ((await receiver.textContent('#rcvCode')) ?? '').replace(/[^A-Z0-9]/g, '');
  }
  assert.match(code, /^[A-Z0-9]{6}$/, 'receiver must display a pairing code');
  console.log(`pairing code on glass: ${code}`);

  // 2) Admin claims it; receiver must authenticate and go ONLINE by itself (< 2 min gate, here seconds)
  const claim = await api('/devices/claim', { token, body: { code, name: 'Amsterdam HQ', kind: 'holobox' } });
  assert.equal(claim.status, 201, JSON.stringify(claim.data));
  const deviceId = claim.data.device.id;

  let online = false;
  for (let i = 0; i < 30 && !online; i++) {
    await sleep(500);
    const list = await api('/devices', { token });
    online = list.data.devices[0]?.state === 'online';
  }
  assert.ok(online, 'device must come ONLINE after claim without any human action on the receiver');
  console.log('receiver paired and ONLINE');

  // 3) Presenter goes live with a synthetic camera
  const presenter = await ctx.newPage();
  presenter.on('pageerror', (e) => console.log('[presenter pageerror]', e.message));
  await presenter.addInitScript(
    (s) => localStorage.setItem('hw_session', s),
    JSON.stringify({ access: token, user: { name: 'E2E Owner' }, org: reg.data.org }),
  );
  await presenter.goto(`${BASE}/session.html?d=${deviceId}&fake=1&auto=1`);

  // 4) Frames must reach the glass
  let frames = { w: 0, playing: false };
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    frames = await receiver.evaluate(() => ({
      w: document.getElementById('rcvVideo').videoWidth,
      playing: document.body.classList.contains('playing'),
    }));
    if (frames.playing && frames.w > 0) break;
  }
  assert.ok(frames.playing && frames.w > 0, `no media on the glass: ${JSON.stringify(frames)}`);
  const strip = await presenter.textContent('#strip');
  console.log(`glass shows ${frames.w}px-wide video · presenter strip: ${strip.trim()}`);
  assert.match(strip, /CONNECTED/);

  // 5) Session is recorded as live
  const sessions = await api('/sessions', { token });
  assert.equal(sessions.data.sessions[0].state, 'live');

  // 6) STOP -> receiver returns to idle, session ended with stats
  await presenter.click('#golive');
  let idle = false;
  for (let i = 0; i < 20 && !idle; i++) {
    await sleep(500);
    idle = await receiver.evaluate(() => !document.body.classList.contains('playing'));
  }
  assert.ok(idle, 'receiver must return to idle after STOP');
  const after = await api('/sessions', { token });
  assert.equal(after.data.sessions[0].state, 'ended');
  assert.ok(after.data.sessions[0].stats.durationSeconds >= 0);
  console.log(`session ended · stats: ${JSON.stringify(after.data.sessions[0].stats)}`);

  // 7) Guest flow: invite -> landing shows destination before any permission -> join -> live -> stop
  const inv = await api('/invites', { token, body: { deviceIds: [deviceId], maxUses: 1 } });
  assert.equal(inv.status, 201);
  const guest = await ctx.newPage();
  guest.on('pageerror', (e) => console.log('[guest pageerror]', e.message));
  await guest.goto(`${BASE}/join.html?t=${inv.data.token}`);
  await sleep(800);
  const landing = await guest.textContent('#dests');
  assert.match(landing, /Amsterdam HQ/, 'guest landing must show the destination before any permission');
  await guest.fill('#name', 'Sarah Lin');
  await guest.click('#joinBtn');
  await sleep(800);
  // hand the guest the synthetic camera for the sandbox, grant survives in sessionStorage
  await guest.goto(`${BASE}/session.html?fake=1&auto=1`);
  let gFrames = { w: 0, playing: false };
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    gFrames = await receiver.evaluate(() => ({
      w: document.getElementById('rcvVideo').videoWidth,
      playing: document.body.classList.contains('playing'),
    }));
    if (gFrames.playing && gFrames.w > 0) break;
  }
  assert.ok(gFrames.playing && gFrames.w > 0, `guest media did not reach the glass: ${JSON.stringify(gFrames)}`);
  await guest.click('#golive'); // STOP
  await sleep(1500);
  const finalList = await api('/sessions', { token });
  const guestSession = finalList.data.sessions.find((s) => s.presenter_kind === 'guest');
  assert.ok(guestSession, 'guest session must be recorded');
  assert.equal(guestSession.presenter_name, 'Sarah Lin');
  assert.equal(guestSession.state, 'ended');
  console.log('guest flow OK — landing, join, live on glass, stop, recorded as guest session');

  console.log('\nE2E OK — pairing, presence, presenter + guest GO LIVE through the SFU, frames on glass, STOP, honest stats.');
  await browser.close();
  stop(0);
} catch (err) {
  console.error('E2E FAILED —', err);
  stop(1);
}
