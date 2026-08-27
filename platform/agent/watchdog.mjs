// M5 watchdog — keeps the HoloSee kiosk browser alive, forever, without human action.
// Crash → restart with backoff (reset after a healthy minute). The browser profile is
// persistent, so the device identity (IndexedDB keypair) survives every restart and the
// receiver reconnects by itself: autostart + auto-connect.
//
//   RECEIVER_URL   required, e.g. https://app.example.com/receiver.html
//   CHROMIUM       path to chrome/chromium (default: chromium on PATH)
//   PROFILE_DIR    persistent user-data-dir (default: ./holosee-profile)
//   EXTRA_FLAGS    extra chromium flags, space-separated (tests use headless here)
//   NO_KIOSK=1     omit --kiosk (tests)
import { spawn } from 'node:child_process';
import path from 'node:path';

const url = process.env.RECEIVER_URL;
if (!url) {
  console.error('RECEIVER_URL is required');
  process.exit(1);
}
const chromium = process.env.CHROMIUM ?? 'chromium';
const profile = path.resolve(process.env.PROFILE_DIR ?? './holosee-profile');
const extra = (process.env.EXTRA_FLAGS ?? '').split(' ').filter(Boolean);

const baseFlags = [
  ...(process.env.NO_KIOSK ? [] : ['--kiosk']),
  '--noerrdialogs',
  '--disable-session-crashed-bubble',
  '--disable-infobars',
  '--no-first-run',
  '--autoplay-policy=no-user-gesture-required',
  `--user-data-dir=${profile}`,
  ...extra,
  url,
];

let backoffMs = 1000;
let child;
let stopping = false;

const log = (msg, meta = {}) => console.log(JSON.stringify({ src: 'watchdog', msg, at: new Date().toISOString(), ...meta }));

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
