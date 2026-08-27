// M1 e2e smoke test — sender (fake camera) and receiver in one headless Chromium against the
// real signaling server. Proves media flows end to end and the diagnostic chain agrees.
// This does NOT replace the M1 gate (two real machines, real face, measured latency).
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright-core';

const PORT = 8791;
const EXE = process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium';

const server = spawn('node', ['node_modules/tsx/dist/cli.mjs', 'server/index.ts'], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'inherit',
});
const stop = (code) => {
  server.kill();
  process.exit(code);
};

try {
  await sleep(1500);
  const browser = await chromium.launch({
    executablePath: EXE,
    args: [
      '--use-fake-device-for-media-capture',
      '--use-fake-ui-for-media-capture',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });
  const receiver = await browser.newPage();
  await receiver.goto(`http://localhost:${PORT}/receiver.html?nofs=1`);
  const sender = await browser.newPage();
  // fake=1: synthetic canvas capture — this sandbox exposes no (fake) camera devices; the
  // encode -> signaling -> transport -> decode -> render chain is still fully real.
  await sender.goto(`http://localhost:${PORT}/sender.html?auto=1&fake=1`);

  // Wait until the receiver decodes real frames and the chain has a verdict.
  let diag;
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    diag = await receiver.evaluate(() => window.__diag);
    const dims = await receiver.evaluate(() => {
      const v = document.getElementById('out');
      return { w: v.videoWidth, h: v.videoHeight };
    });
    if (diag && dims.w > 0 && diag.verdict?.ok) {
      console.log('\n=== receiver resolution chain ===');
      for (const r of diag.rows) {
        const dim = r.w && r.h ? `${r.w} × ${r.h}` : '';
        const fps = r.fps ? ` @ ${Math.round(r.fps)}` : '';
        console.log(`  ${r.stage.padEnd(18)} ${dim}${fps}  ${r.note ?? ''}`);
      }
      console.log(`  verdict: ${diag.verdict.text}`);
      const sd = await sender.evaluate(() => window.__diag);
      console.log('=== sender resolution chain ===');
      for (const r of sd?.rows ?? []) {
        const dim = r.w && r.h ? `${r.w} × ${r.h}` : '';
        const fps = r.fps ? ` @ ${Math.round(r.fps)}` : '';
        console.log(`  ${r.stage.padEnd(18)} ${dim}${fps}  ${r.note ?? ''}`);
      }
      console.log('\nE2E OK — media flows camera → signaling → peer → decode → render.');
      await browser.close();
      stop(0);
    }
  }
  console.error('E2E FAILED — no agreeing chain within 30 s. Last diag:', JSON.stringify(diag));
  await browser.close();
  stop(1);
} catch (err) {
  console.error('E2E FAILED —', err);
  stop(1);
}
