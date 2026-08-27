// M8 soak harness — continuous playback, repeated sessions, disconnect cycles, and memory
// growth detection across every process tree (app, SFU, receiver browser, sender browser).
//
//   SOAK_MINUTES=1440 node test/soak.mjs     # the 24 h gate run (real hardware)
//   SOAK_MINUTES=4    node test/soak.mjs     # smoke run (CI / sandbox)
//
// Verdict: a process tree fails if the median RSS of the last third of samples exceeds the
// median of the first third by more than SOAK_MAX_GROWTH_PCT (default 25%). GPU/VRAM and
// thermals are NOT measurable from here — the gate pairs this with vendor tooling on the
// target machine; this harness reports what it measured and nothing else.
import assert from 'node:assert/strict';
import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright-core';

const APP_PORT = 8905;
const LK_PORT = 7896; // NOT 7881/7883 (LiveKit RTC-TCP defaults)
const BASE = `http://localhost:${APP_PORT}`;
const DB = 'postgres://holo:holo_dev@127.0.0.1:5432/holo_test';
const LK_BIN = process.env.LIVEKIT_BIN ?? new URL('../.livekit/livekit-server', import.meta.url).pathname;
const EXE = process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium';
const MINUTES = Number(process.env.SOAK_MINUTES ?? 1440);
const MAX_GROWTH_PCT = Number(process.env.SOAK_MAX_GROWTH_PCT ?? 25);
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

const lkLog = fs.openSync('/tmp/soak-livekit.log', 'a');
function startLivekit() {
  const lk = spawn(
    LK_BIN,
    ['--bind', '127.0.0.1', '--node-ip', '127.0.0.1', '--port', String(LK_PORT), '--keys', 'devkey: devsecret_devsecret_devsecret_00'],
    { stdio: ['ignore', lkLog, lkLog] },
  );
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
    LIVEKIT_API_KEY: 'devkey',
    LIVEKIT_API_SECRET: 'devsecret_devsecret_devsecret_00',
  },
  stdio: ['ignore', 'ignore', 'inherit'],
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

// ——— RSS of a whole process tree, from /proc (kB) ———
function rssTree(rootPid) {
  const procList = [];
  for (const d of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(d)) continue;
    try {
      const st = fs.readFileSync(`/proc/${d}/status`, 'utf8');
      procList.push({
        pid: Number(d),
        ppid: Number(st.match(/^PPid:\s+(\d+)/m)?.[1] ?? 0),
        rss: Number(st.match(/^VmRSS:\s+(\d+)/m)?.[1] ?? 0),
      });
    } catch {}
  }
  const kids = new Map();
  for (const p of procList) {
    if (!kids.has(p.ppid)) kids.set(p.ppid, []);
    kids.get(p.ppid).push(p);
  }
  let total = 0;
  const walk = (pid) => {
    total += procList.find((p) => p.pid === pid)?.rss ?? 0;
    for (const c of kids.get(pid) ?? []) walk(c.pid);
  };
  walk(rootPid);
  return total;
}

/** Root chromium pid for a browser we tagged with a marker flag. */
function taggedBrowserPid(tag) {
  for (const d of fs.readdirSync('/proc')) {
    if (!/^\d+$/.test(d)) continue;
    try {
      const cmd = fs.readFileSync(`/proc/${d}/cmdline`, 'utf8');
      if (cmd.includes(tag) && !cmd.includes('--type=')) return Number(d);
    } catch {}
  }
  return 0;
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

try {
  await waitFor('app up', () => fetch(`${BASE}/api/v1/health`).then((r) => r.ok).catch(() => false), 40);
  const reg = await api('/auth/register', {
    body: { orgName: 'Soak BV', email: 'soak@example.test', password: 'supersecret123', displayName: 'Soak' },
  });
  const token = reg.data.access;

  const rcvBrowser = await chromium.launch({ executablePath: EXE, args: [...FLAGS, '--holo-soak=rcv'] });
  const rcv = await rcvBrowser.newPage();
  await rcv.goto(`${BASE}/receiver.html`);
  const code = await waitFor('pairing code', async () =>
    (((await rcv.textContent('#rcvCode').catch(() => '')) ?? '').replace(/[^A-Z0-9]/g, '') || false),
  );
  const claim = await api('/devices/claim', { token, body: { code, name: 'Soak Box', kind: 'holobox' } });
  const deviceId = claim.data.device.id;
  await waitFor('online', async () => (await api('/devices', { token })).data.devices[0]?.state === 'online');

  const sndBrowser = await chromium.launch({ executablePath: EXE, args: [...FLAGS, '--holo-soak=snd'] });
  const presenter = await sndBrowser.newPage();
  await presenter.addInitScript((s) => localStorage.setItem('hw_session', s), JSON.stringify({ access: token }));
  await presenter.goto(`${BASE}/session.html?d=${deviceId}&fake=1&pin=720p30`);
  await waitFor('pre-flight done', async () =>
    (((await presenter.textContent('#pfLines').catch(() => '')) ?? '').includes('starting at')),
  );

  const roots = {
    app: app.pid,
    sfu: () => lk.pid,
    receiver: taggedBrowserPid('--holo-soak=rcv'),
    sender: taggedBrowserPid('--holo-soak=snd'),
  };
  const samples = { app: [], sfu: [], receiver: [], sender: [] };
  const sampler = setInterval(() => {
    samples.app.push(rssTree(roots.app));
    samples.sfu.push(rssTree(typeof roots.sfu === 'function' ? roots.sfu() : roots.sfu));
    samples.receiver.push(rssTree(roots.receiver));
    samples.sender.push(rssTree(roots.sender));
  }, 10_000);

  const clickGoLive = () =>
    presenter.evaluate(() => {
      const b = document.querySelector('#golive');
      if (b && !b.disabled && b.textContent.trim() === 'GO LIVE') b.click();
    });
  const clickStop = () =>
    presenter.evaluate(() => {
      const b = document.querySelector('#golive');
      if (b && !b.disabled && b.textContent.trim() === 'STOP') b.click();
    });
  const playingCount = async () =>
    ((await api(`/devices/${deviceId}/events`, { token })).data.events ?? []).filter((e) => e.type === 'session_playing').length;

  const deadline = Date.now() + MINUTES * 60_000;
  let cycles = 0;
  let disconnectCycles = 0;
  let failures = 0;
  console.log(`SOAK — target ${MINUTES} min, growth ceiling ${MAX_GROWTH_PCT}% per process tree\n`);

  while (Date.now() < deadline) {
    const before = await playingCount();
    try {
      await waitFor('live', async () => {
        const conn = ((await presenter.textContent('#conn')) ?? '').trim();
        if (conn.includes('CONNECTED')) return true;
        await clickGoLive();
        return false;
      }, 40, 1000);
      await waitFor('frames on glass', async () => (await playingCount()) > before, 40);
      await sleep(15_000); // continuous playback window

      if (cycles % 3 === 2) {
        // disconnect cycle: pull the media path mid-stream, then bring it back
        lk.kill('SIGKILL');
        await waitFor('fallback after cut', async () => {
          const ev = (await api(`/devices/${deviceId}/events`, { token })).data.events ?? [];
          return ev[0]?.type === 'fallback_shown' || ev.slice(0, 5).some((e) => e.type === 'fallback_shown');
        }, 40);
        lk = startLivekit();
        await waitFor('SFU back', () => fetch(`http://127.0.0.1:${LK_PORT}/`).then((r) => r.ok).catch(() => false), 30);
        disconnectCycles += 1;
      }
      await clickStop();
      await waitFor('stopped', async () => (((await presenter.textContent('#golive')) ?? '').trim() === 'GO LIVE'), 20);
      cycles += 1;
      if (cycles % 5 === 0) {
        const last = (k) => samples[k].at(-1) ?? 0;
        console.log(
          `  cycle ${cycles} (${disconnectCycles} cuts) — RSS MB: app ${(last('app') / 1024).toFixed(0)}, ` +
            `sfu ${(last('sfu') / 1024).toFixed(0)}, rcv ${(last('receiver') / 1024).toFixed(0)}, snd ${(last('sender') / 1024).toFixed(0)}`,
        );
      }
      await sleep(2000);
    } catch (e) {
      failures += 1;
      console.log(`  cycle ${cycles} FAILED: ${String(e).slice(0, 160)}`);
      if (failures > 3) throw new Error('too many failed cycles');
      await clickStop().catch(() => undefined);
      await sleep(3000);
    }
  }
  clearInterval(sampler);

  console.log(`\nSOAK REPORT — ${cycles} session cycles, ${disconnectCycles} disconnect cycles, ${failures} failures`);
  let pass = failures === 0 && cycles >= 3;
  for (const k of Object.keys(samples)) {
    const xs = samples[k];
    const third = Math.max(1, Math.floor(xs.length / 3));
    const early = median(xs.slice(0, third));
    const late = median(xs.slice(-third));
    const growth = early ? ((late - early) / early) * 100 : 0;
    const ok = growth <= MAX_GROWTH_PCT;
    if (!ok) pass = false;
    console.log(
      `  ${k.padEnd(9)} ${(early / 1024).toFixed(0).padStart(5)} MB → ${(late / 1024).toFixed(0).padStart(5)} MB ` +
        `(${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%)  ${ok ? 'ok' : `LEAK? exceeds ${MAX_GROWTH_PCT}%`}`,
    );
  }
  console.log('  (GPU/VRAM/thermals: not measurable here — pair with vendor tooling on the target, per the M8 gate)');
  console.log(pass ? '\nSOAK OK' : '\nSOAK FAILED');
  await sndBrowser.close();
  await rcvBrowser.close();
  stop(pass ? 0 : 1);
} catch (err) {
  console.error('SOAK FAILED —', err);
  stop(1);
}
