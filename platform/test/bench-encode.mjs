// M6 benchmark harness — measured encode capability of THIS machine, via WebCodecs.
// For each codec × resolution it reports: whether the config is supported with hardware
// acceleration or software only, achieved encode fps, mean/p95 per-frame encode latency,
// and produced bitrate. Run it on the actual deployment hardware; results are per-machine
// and are NOT committed. What the browser cannot expose (CPU%, GPU%, VRAM) is listed as
// not-measurable-here rather than invented — pair this with OS-level telemetry on the target.
//
//   npm run bench:encode            # table + JSON on stdout
import http from 'node:http';
import { chromium } from 'playwright-core';

const EXE = process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium';
const FRAMES = 90;

// WebCodecs needs a secure context; about:blank is not one. localhost is.
const srv = http.createServer((_q, r) => {
  r.setHeader('content-type', 'text/html');
  r.end('<!doctype html><title>bench</title>');
});
await new Promise((res) => srv.listen(0, '127.0.0.1', res));

const MATRIX = [
  { label: 'H.264 4K60', codec: 'avc1.640034', w: 3840, h: 2160, fps: 60, kbps: 24000 },
  { label: 'H.264 4K30', codec: 'avc1.640033', w: 3840, h: 2160, fps: 30, kbps: 16000 },
  { label: 'H.264 1080p60', codec: 'avc1.64002a', w: 1920, h: 1080, fps: 60, kbps: 6000 },
  { label: 'VP9   4K60', codec: 'vp09.00.60.08', w: 3840, h: 2160, fps: 60, kbps: 18000 },
  { label: 'VP9   4K30', codec: 'vp09.00.51.08', w: 3840, h: 2160, fps: 30, kbps: 12000 },
  { label: 'VP9   1080p60', codec: 'vp09.00.41.08', w: 1920, h: 1080, fps: 60, kbps: 5000 },
  { label: 'AV1   4K30', codec: 'av01.0.12M.08', w: 3840, h: 2160, fps: 30, kbps: 10000 },
  { label: 'AV1   1080p60', codec: 'av01.0.09M.08', w: 1920, h: 1080, fps: 60, kbps: 4000 },
];

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${srv.address().port}/`);

const results = await page.evaluate(
  async ({ matrix, frames }) => {
    const out = [];
    for (const m of matrix) {
      const base = {
        codec: m.codec,
        width: m.w,
        height: m.h,
        framerate: m.fps,
        bitrate: m.kbps * 1000,
        latencyMode: 'realtime',
      };
      let accel = null;
      for (const pref of ['prefer-hardware', 'prefer-software']) {
        try {
          const s = await VideoEncoder.isConfigSupported({ ...base, hardwareAcceleration: pref });
          if (s.supported) {
            accel = pref;
            break;
          }
        } catch {
          /* config not parseable by this browser build */
        }
      }
      if (!accel) {
        out.push({ label: m.label, supported: false });
        continue;
      }
      const canvas = new OffscreenCanvas(m.w, m.h);
      const ctx = canvas.getContext('2d');
      const submitted = new Map();
      const latencies = [];
      let bytes = 0;
      let done;
      const finished = new Promise((r) => (done = r));
      let got = 0;
      const enc = new VideoEncoder({
        output: (chunk) => {
          bytes += chunk.byteLength;
          const t = submitted.get(chunk.timestamp);
          if (t !== undefined) latencies.push(performance.now() - t);
          got += 1;
          if (got >= frames) done();
        },
        error: () => done(),
      });
      enc.configure({ ...base, hardwareAcceleration: accel });
      const t0 = performance.now();
      for (let i = 0; i < frames; i++) {
        ctx.fillStyle = `hsl(${(i * 7) % 360} 60% 40%)`;
        ctx.fillRect(0, 0, m.w, m.h);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc((i * 97) % m.w, (i * 61) % m.h, m.w / 16, 0, Math.PI * 2);
        ctx.fill();
        const ts = Math.round((i * 1e6) / m.fps);
        const frame = new VideoFrame(canvas, { timestamp: ts });
        submitted.set(ts, performance.now());
        enc.encode(frame, { keyFrame: i % 30 === 0 });
        frame.close();
        // realtime pacing is not simulated: we measure the encoder flat out
        if (enc.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 5));
      }
      await enc.flush().catch(() => undefined);
      const wallMs = performance.now() - t0;
      enc.close();
      latencies.sort((a, b) => a - b);
      out.push({
        label: m.label,
        supported: true,
        acceleration: accel === 'prefer-hardware' ? 'hardware' : 'software',
        achievedFps: Number(((got * 1000) / wallMs).toFixed(1)),
        targetFps: m.fps,
        meanLatencyMs: Number((latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1)).toFixed(1)),
        p95LatencyMs: Number((latencies[Math.floor(latencies.length * 0.95)] ?? 0).toFixed(1)),
        producedKbps: Math.round((bytes * 8) / (got / m.fps) / 1000),
        framesEncoded: got,
      });
    }
    return out;
  },
  { matrix: MATRIX, frames: FRAMES },
);

await browser.close();
srv.close();

console.log('\nENCODE BENCHMARK — measured on this machine, this browser build\n');
console.log('config           accel     achieved     latency mean/p95     produced');
for (const r of results) {
  if (!r.supported) {
    console.log(`${r.label.padEnd(16)} not supported by this browser build`);
    continue;
  }
  const verdict = r.achievedFps >= r.targetFps ? 'ok' : `BELOW TARGET (${r.targetFps} fps)`;
  console.log(
    `${r.label.padEnd(16)} ${r.acceleration.padEnd(9)} ${String(r.achievedFps).padStart(6)} fps   ` +
      `${String(r.meanLatencyMs).padStart(6)} / ${String(r.p95LatencyMs).padEnd(8)} ms   ${String(r.producedKbps).padStart(6)} kbps  ${verdict}`,
  );
}
console.log('\nNot measurable from the browser: CPU%, GPU%, VRAM, decode latency on the receiver.');
console.log('Pair this with OS-level telemetry on the deployment hardware (M6 gate).\n');
console.log(JSON.stringify({ bench: 'encode', at: new Date().toISOString(), results }, null, 2));
