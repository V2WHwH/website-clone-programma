// M7 e2e — fleet operations, the gate scenario: an operator diagnoses and remotely fixes a
// simulated fault WITHOUT touching the device.
//   A. device pairs; watchdog runs it; host HEALTH (load/mem/disk/uptime) reaches the platform
//   B. fault: SFU dies mid-session -> glass sticks on fallback -> the ALERT ENGINE raises
//      stuck_fallback; the operator can see exactly what is wrong
//   C. remote fix: operator sends `reload` -> receiver reloads, comes back idle -> the alert
//      AUTO-RESOLVES with a note; the action result is on record
//   D. remote toolbox on the live device: net_test (measured rtt/down), send_logs (ring buffer),
//      restart_browser (via the watchdog -> new browser pid, same identity)
//   E. the fleet dashboard renders it all: KPIs, alerts, host health, session analytics
//      (measured egress), audit trail
//   F. device dies completely (watchdog + browser) -> offline alert raised
import assert from 'node:assert/strict';
import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright-core';

const APP_PORT = 8904;
const LK_PORT = 7895; // NOT 7881/7883 (LiveKit RTC-TCP defaults)
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

const lkLog = fs.openSync('/tmp/e2e-m7-livekit.log', 'a');
const lk = spawn(
  LK_BIN,
  ['--bind', '127.0.0.1', '--node-ip', '127.0.0.1', '--port', String(LK_PORT), '--keys', 'devkey: devsecret_devsecret_devsecret_00'],
  { stdio: ['ignore', lkLog, lkLog] },
);
procs.push(lk);

const app = spawn('node', ['node_modules/tsx/dist/cli.mjs', 'server/index.ts'], {
  env: {
    ...process.env,
    PORT: String(APP_PORT),
    DATABASE_URL: DB,
    LIVEKIT_URL: `ws://localhost:${LK_PORT}`,
    LIVEKIT_API_KEY: 'devkey',
    LIVEKIT_API_SECRET: 'devsecret_devsecret_devsecret_00',
    ALERT_SWEEP_MS: '2000',
    ALERT_FALLBACK_AFTER_S: '8',
    ALERT_OFFLINE_AFTER_S: '10',
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
    body: { orgName: 'M7 BV', email: 'm7@example.test', password: 'supersecret123', displayName: 'M7 Operator' },
  });
  const token = reg.data.access;

  // —— A. pair once, then the watchdog owns the device; host health flows in ——
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'holosee-'));
  const pctx = await chromium.launchPersistentContext(profile, { executablePath: EXE, args: FLAGS });
  const rcv = pctx.pages()[0] ?? (await pctx.newPage());
  await rcv.goto(`${BASE}/receiver.html`);
  const code = await waitFor('pairing code', async () =>
    (((await rcv.textContent('#rcvCode').catch(() => '')) ?? '').replace(/[^A-Z0-9]/g, '') || false),
  );
  const claim = await api('/devices/claim', { token, body: { code, name: 'Utrecht Box', kind: 'holobox' } });
  assert.equal(claim.status, 201);
  const deviceId = claim.data.device.id;
  await waitFor('online after claim', async () => (await api('/devices', { token })).data.devices[0]?.state === 'online');
  await pctx.close();
  await waitFor('offline after close', async () => (await api('/devices', { token })).data.devices[0]?.state === 'offline');

  const wd = spawn('node', ['agent/watchdog.mjs'], {
    env: {
      ...process.env,
      RECEIVER_URL: `${BASE}/receiver.html`,
      CHROMIUM: EXE,
      PROFILE_DIR: profile,
      NO_KIOSK: '1',
      HEALTH_EVERY_MS: '3000',
      EXTRA_FLAGS: ['--headless=new', ...FLAGS].join(' '),
    },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  procs.push(wd);
  const browserPids = [];
  wd.stdout.on('data', (d) => {
    for (const lineTxt of String(d).trim().split('\n')) {
      try {
        const j = JSON.parse(lineTxt);
        if (j.msg === 'browser started') browserPids.push(j.pid);
        console.log(`   [watchdog] ${j.msg}${j.pid ? ' pid=' + j.pid : ''}`);
      } catch {}
    }
  });
  await waitFor('online via watchdog', async () => (await api('/devices', { token })).data.devices[0]?.state === 'online');
  const health = await waitFor('host health reported', async () => (await api('/devices', { token })).data.devices[0]?.health || false, 40);
  assert.ok(Number.isFinite(health.load1) && health.cores > 0, 'load and cores must be measured');
  assert.ok(health.disk && Number.isFinite(health.disk.freePct), 'disk must be measured');
  assert.ok(Number.isFinite(health.hostUptimeS), 'uptime must be measured');
  console.log(
    `A. watchdog runs the device — host health measured: load ${health.load1.toFixed(2)}/${health.cores}c, ` +
      `disk ${health.disk.freePct}% free, temp ${health.temperatureC ?? '— (not exposed here, reported as such)'}`,
  );

  // —— B. the fault: SFU dies mid-session, glass sticks on fallback, alert raised ——
  const browser = await chromium.launch({ executablePath: EXE, args: FLAGS });
  const presenter = await browser.newPage();
  await presenter.addInitScript((s) => localStorage.setItem('hw_session', s), JSON.stringify({ access: token }));
  await presenter.goto(`${BASE}/session.html?d=${deviceId}&fake=1&auto=1&pin=720p30`);
  await waitFor('session_playing', async () => {
    const ev = (await api(`/devices/${deviceId}/events`, { token })).data.events ?? [];
    return ev.find((e) => e.type === 'session_playing') || false;
  }, 60);
  lk.kill('SIGKILL'); // the fault
  const alert = await waitFor('stuck_fallback alert raised', async () => {
    const al = (await api('/alerts', { token })).data.alerts ?? [];
    return al.find((a) => a.kind === 'stuck_fallback' && !a.resolved_at) || false;
  }, 60);
  console.log(`B. fault visible to the operator — ALERT stuck_fallback: "${alert.message}" on ${alert.device_name}`);

  // —— C. the remote fix: reload the receiver from the fleet, alert auto-resolves ——
  const act = await api(`/devices/${deviceId}/actions`, { token, body: { action: 'reload' } });
  assert.equal(act.status, 202);
  const result = await waitFor('reload action_result', async () => {
    const ev = (await api(`/devices/${deviceId}/events`, { token })).data.events ?? [];
    return ev.find((e) => e.type === 'action_result' && e.meta?.actionId === act.data.actionId) || false;
  }, 30);
  assert.equal(result.meta.ok, true);
  const resolved = await waitFor('alert auto-resolved', async () => {
    const al = (await api('/alerts?all=1', { token })).data.alerts ?? [];
    return al.find((a) => a.id === alert.id && a.resolved_at) || false;
  }, 40);
  await waitFor('device back online', async () => (await api('/devices', { token })).data.devices[0]?.state === 'online', 40);
  console.log(`C. remote reload fixed it — alert auto-resolved: "${resolved.resolve_note}" (device untouched)`);
  await presenter.evaluate(() => document.querySelector('#golive').click()); // STOP -> session record w/ stats
  await sleep(1500);

  // —— D. the remote toolbox ——
  const run = async (action) => {
    const a = await api(`/devices/${deviceId}/actions`, { token, body: { action } });
    assert.equal(a.status, 202, `${action} accepted`);
    return waitFor(`${action} result`, async () => {
      const ev = (await api(`/devices/${deviceId}/events`, { token })).data.events ?? [];
      return ev.find((e) => e.type === 'action_result' && e.meta?.actionId === a.data.actionId) || false;
    }, 30);
  };
  const net = await run('net_test');
  assert.ok(Number.isFinite(net.meta.rttMs) && Number.isFinite(net.meta.downMbps), 'net test must return measurements');
  const logs = await run('send_logs');
  assert.ok(Array.isArray(logs.meta.logs) && logs.meta.logs.length > 0, 'logs must arrive');
  const beforeRestart = browserPids.length;
  const restart = await run('restart_browser');
  assert.equal(restart.meta.forwarded, 'watchdog');
  await waitFor('watchdog restarted the browser', async () => browserPids.length > beforeRestart, 40);
  await waitFor('online after restart', async () => (await api('/devices', { token })).data.devices[0]?.state === 'online', 60);
  assert.equal((await api('/devices', { token })).data.devices.length, 1, 'same identity after restart');
  console.log(
    `D. remote toolbox — net test rtt ${net.meta.rttMs} ms / ${net.meta.downMbps} Mbps down · ` +
      `${logs.meta.logs.length} log lines · browser restarted by watchdog (pid ${browserPids.at(-1)}), same device`,
  );

  // —— E. the fleet dashboard shows it all ——
  const opPage = await browser.newPage();
  await opPage.addInitScript((s) => localStorage.setItem('hw_session', s), JSON.stringify({ access: token, user: { name: 'M7 Operator' }, org: { name: 'M7 BV', role: 'owner' } }));
  await opPage.goto(`${BASE}/fleet.html`);
  await waitFor('dashboard rendered', async () => {
    const kpis = ((await opPage.textContent('#kpis').catch(() => '')) ?? '').trim();
    const dev = ((await opPage.textContent('#devTable').catch(() => '')) ?? '').trim();
    const ses = ((await opPage.textContent('#sesTable').catch(() => '')) ?? '').trim();
    const al = ((await opPage.textContent('#alerts').catch(() => '')) ?? '').trim();
    return kpis.includes('devices online') && dev.includes('% free') && ses.includes('GB') && al.includes('stuck_fallback')
      ? true
      : false;
  }, 30, 1000);
  const sessions = (await api('/sessions', { token })).data.sessions ?? [];
  assert.ok(Number(sessions[0]?.egress_bytes) > 0, 'session analytics must carry measured egress');
  const audit = (await api('/audit', { token })).data.entries ?? [];
  assert.ok(audit.some((e) => e.action === 'device.action'), 'remote actions must be audited');
  console.log(`E. fleet dashboard: KPIs, host health, alert history, measured egress (${(Number(sessions[0].egress_bytes) / 1e6).toFixed(1)} MB), audit trail`);

  // —— F. total device death -> offline alert ——
  wd.kill('SIGTERM'); // watchdog exits and takes the browser with it
  const off = await waitFor('offline alert raised', async () => {
    const al = (await api('/alerts', { token })).data.alerts ?? [];
    return al.find((a) => a.kind === 'offline' && !a.resolved_at) || false;
  }, 60);
  console.log(`F. device death visible — ALERT offline: "${off.message}"`);

  console.log('\nM7 E2E OK — host health, alert engine, remote diagnose+fix without touching the device, toolbox, dashboard, audit.');
  await browser.close();
  stop(0);
} catch (err) {
  console.error('M7 E2E FAILED —', err);
  stop(1);
}
