// S2 → S4/S5: preview, network pre-flight with an honest verdict, GO LIVE via the platform +
// LiveKit, adaptive quality ladder (down fast, up slow), honest status strip, return feed inset,
// a diagnostic view exposing the full resolution chain, STOP. Works for signed-in presenters and
// guests (grant in sessionStorage).
import {
  Room,
  RoomEvent,
  Track,
  type RemoteTrack,
  type RemoteTrackPublication,
  type RemoteParticipant,
} from 'livekit-client';
import { $, api, loadSession } from './client.js';
import { RUNGS, probeEncode, topOkRung, type Rung, type RungCap } from './caps.js';

const params = new URLSearchParams(location.search);
const guestRaw = sessionStorage.getItem('hw_guest');
const guest = guestRaw ? (JSON.parse(guestRaw) as { access: string; deviceIds: string[] }) : undefined;
const token = guest?.access ?? loadSession()?.access;
if (!token) location.href = '/login.html';

const deviceIds = (params.get('d') ?? guest?.deviceIds.join(',') ?? '').split(',').filter(Boolean);
const fake = params.get('fake') === '1';
// Operator pin (?pin=1080p30): fixes the starting rung and ceiling, overriding negotiation.
// The strip and the diagnostic view still show only measured values — pinning changes what
// we ATTEMPT, never what we claim. The ladder can still step down under real pressure.
const pinnedRung = RUNGS.findIndex((r) => r.label === params.get('pin'));

const selfVideo = $('self') as unknown as HTMLVideoElement;
const returnVideo = $('return') as unknown as HTMLVideoElement;
const strip = $('strip');
const conn = $('conn');
const goliveBtn = $('golive') as HTMLButtonElement;

let stream: MediaStream | undefined;
let room: Room | undefined;
let sessionId: string | undefined;
let startedAt = 0;
let audioOk = false;
let lastBytes = 0;
let lastTs = 0;
const summary = { maxWidth: 0, maxHeight: 0, maxMbps: 0, egressBytes: 0 };

$('dest').textContent = `→ ${deviceIds.length} destination${deviceIds.length === 1 ? '' : 's'}`;
$('pip').addEventListener('click', () => document.body.classList.toggle('pip-open'));
$('exit').addEventListener('click', async () => {
  await stop();
  location.href = guest ? '/join.html?done=1' : '/app.html';
});

// ——— capture at a given ladder rung ———
let fakeCanvas: HTMLCanvasElement | undefined;

function fakeStream(r: Rung): MediaStream {
  const canvas = document.createElement('canvas');
  fakeCanvas = canvas;
  canvas.width = r.w;
  canvas.height = r.h;
  const ctx = canvas.getContext('2d')!;
  let t = 0;
  setInterval(() => {
    t += 1;
    const { width: w, height: h } = canvas;
    ctx.fillStyle = `hsl(${t % 360} 55% 12%)`;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#35e0ff';
    ctx.beginPath();
    ctx.arc(w / 2 + Math.sin(t / 20) * w * 0.3, h / 2 + Math.cos(t / 17) * h * 0.26, w / 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eaf0f6';
    ctx.font = `${Math.round(h / 16)}px monospace`;
    ctx.fillText(`frame ${t} · ${w}×${h}`, w / 32, h / 9);
  }, 1000 / 30);
  return canvas.captureStream(30);
}

async function setCaptureRung(r: Rung): Promise<void> {
  if (fake && fakeCanvas) {
    // Resizing the canvas resizes the captured track — a real capture change.
    fakeCanvas.width = r.w;
    fakeCanvas.height = r.h;
    return;
  }
  const t = stream?.getVideoTracks()[0];
  if (t)
    await t
      .applyConstraints({ width: { ideal: r.w }, height: { ideal: r.h }, frameRate: { ideal: r.fps } })
      .catch(() => undefined);
}

// ——— the adaptive ladder: down fast, up slow (STREAMING.md) ———
// Indices into RUNGS; a LOWER index is a HIGHER rung. ceilIdx is the negotiated ceiling.
let ceilIdx = RUNGS.length - 1;
let rungIdx = RUNGS.length - 1;
let badTicks = 0;
let goodTicks = 0;
let upHoldTicks = 30; // seconds of clean encoding required before a step up
let lastUpAt = 0;
const ladderHistory: { at: number; from: string; to: string; reason: string }[] = [];

async function stepTo(idx: number, reason: string): Promise<void> {
  const from = RUNGS[rungIdx]!.label;
  const to = RUNGS[idx]!.label;
  const goingDown = idx > rungIdx;
  rungIdx = idx;
  badTicks = 0;
  goodTicks = 0;
  if (goingDown && Date.now() - lastUpAt < 60_000) {
    upHoldTicks = Math.min(upHoldTicks * 2, 240); // the rung above just failed — back off retrying it
  }
  if (!goingDown) lastUpAt = Date.now();
  await setCaptureRung(RUNGS[idx]!);
  ladderHistory.push({ at: Date.now(), from, to, reason });
  if (sessionId) void api(`/sessions/${sessionId}/log`, { body: { kind: 'ladder_step', meta: { from, to, reason } }, token }).catch(() => undefined);
}

function ladderTick(limitation: string, encFps: number): void {
  if (!sessionId || Date.now() - startedAt < 8000) return; // encoder ramp-up is not distress
  // Two starvation signals, both measured: the browser's own attribution (cpu/bandwidth),
  // and the encoder's achieved fps falling far below the rung's target — some builds starve
  // without attributing, and the fps number never lies.
  const starved =
    limitation === 'cpu' || limitation === 'bandwidth' || (encFps > 0 && encFps < RUNGS[rungIdx]!.fps * 0.6);
  if (starved) {
    badTicks += 1;
    goodTicks = 0;
    if (badTicks >= 3 && rungIdx < RUNGS.length - 1) void stepTo(rungIdx + 1, limitation !== 'none' ? limitation : 'low_fps');
  } else {
    goodTicks += 1;
    badTicks = 0;
    if (goodTicks >= upHoldTicks && rungIdx > ceilIdx) void stepTo(rungIdx - 1, 'recovered');
  }
}

// ——— pre-flight: measure, then say honestly what this connection can carry ———
let encodeCaps: RungCap[] = [];
const net = { upMbps: 0, downMbps: 0, rttMs: 0 };
let preflightIdx = RUNGS.length - 1;
let preflightDone = false;

async function measureNetwork(): Promise<void> {
  const t0 = [];
  for (let i = 0; i < 5; i++) {
    const s = performance.now();
    await fetch('/api/v1/health', { cache: 'no-store' });
    t0.push(performance.now() - s);
  }
  net.rttMs = t0.sort((a, b) => a - b)[Math.floor(t0.length / 2)] ?? 0;
  const auth = { authorization: `Bearer ${token}` };
  const dlBytes = 6_291_456;
  let s = performance.now();
  const dl = await fetch(`/api/v1/netprobe/download?bytes=${dlBytes}`, { headers: auth, cache: 'no-store' });
  await dl.arrayBuffer();
  net.downMbps = (dlBytes * 8) / ((performance.now() - s) / 1000) / 1e6;
  const upBytes = 4_194_304;
  const blob = new Uint8Array(upBytes);
  crypto.getRandomValues(blob.subarray(0, 65536)); // head of noise; body size is what matters
  s = performance.now();
  await fetch('/api/v1/netprobe/upload', { method: 'POST', headers: { ...auth, 'content-type': 'application/octet-stream' }, body: blob });
  net.upMbps = (upBytes * 8) / ((performance.now() - s) / 1000) / 1e6;
}

function deviceDecodeCeil(devices: { caps: { decode?: RungCap[] } | null }[]): number {
  // The slowest destination sets the ceiling. Unmeasured caps constrain nothing (yet).
  let ceil = 0;
  for (const d of devices) {
    if (!d.caps?.decode) continue;
    const top = topOkRung(d.caps.decode);
    if (top === -1) continue;
    ceil = Math.max(ceil, top);
  }
  return ceil;
}

async function preflight(): Promise<void> {
  const el = $('preflight');
  const lines = $('pfLines');
  el.style.display = '';
  lines.textContent = 'measuring encode capability and network…';
  try {
    const [caps] = await Promise.all([probeEncode(), measureNetwork()]);
    encodeCaps = caps;
    let idx = topOkRung(encodeCaps);
    if (idx === -1) idx = RUNGS.length - 1; // nothing reported smooth — start at the floor, honestly
    // Bandwidth: a rung needs headroom (×1.4) over its target bitrate on the measured uplink.
    while (idx < RUNGS.length - 1 && RUNGS[idx]!.kbps * 1.4 > net.upMbps * 1000) idx += 1;
    // Destinations we can see up front (signed-in flow) cap the ladder too.
    if (!guest && deviceIds.length) {
      try {
        const d = await api<{ devices: { id: string; caps: { decode?: RungCap[] } | null }[] }>('/devices', { token });
        idx = Math.max(idx, deviceDecodeCeil(d.devices.filter((x) => deviceIds.includes(x.id))));
      } catch {
        /* device caps stay unknown here; the session response clamps again */
      }
    }
    if (pinnedRung >= 0) idx = pinnedRung;
    preflightIdx = idx;
    const chosen = RUNGS[idx]!;
    const chosenCap = encodeCaps.find((c) => c.rung === chosen.label);
    lines.textContent =
      `uplink ${net.upMbps.toFixed(0)} Mbps · downlink ${net.downMbps.toFixed(0)} Mbps · rtt ${net.rttMs.toFixed(0)} ms\n` +
      `encode ${chosen.label}: ${chosenCap?.ok ? 'smooth' : 'unverified'} · hardware ${chosenCap?.hw ? 'yes' : 'no — software'}\n` +
      `starting at ${chosen.label} (${(chosen.kbps / 1000).toFixed(1)} Mbps target)` +
      (pinnedRung >= 0 ? ' — pinned by operator' : idx > 0 ? ' — higher rungs withheld by measurement' : '');
    preflightDone = true;
  } catch (e) {
    // The pre-flight failing is itself a measurement: start at the floor and say so.
    preflightIdx = RUNGS.length - 1;
    lines.textContent = `pre-flight incomplete (${(e as Error).message}) — starting conservative at ${RUNGS[preflightIdx]!.label}`;
    preflightDone = true;
  }
  conn.textContent = audioOk ? 'ready' : 'ready — no microphone';
  conn.className = 'pill glass ' + (audioOk ? 'ok' : 'warn');
  goliveBtn.disabled = false;
}

async function initMedia(): Promise<void> {
  const startRung = RUNGS[pinnedRung >= 0 ? pinnedRung : 3]!; // capture starts at 1080p60 until negotiated
  if (fake) {
    stream = fakeStream(startRung);
  } else {
    // Echo cancellation is mandatory (M4): request it explicitly; report honestly if no mic.
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: startRung.w }, height: { ideal: startRung.h }, frameRate: { ideal: startRung.fps } },
      audio: { echoCancellation: true, noiseSuppression: true },
    }).catch(async () => {
      const v = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: startRung.w }, height: { ideal: startRung.h }, frameRate: { ideal: startRung.fps } },
      });
      return v;
    });
  }
  audioOk = (stream.getAudioTracks().length ?? 0) > 0;
  selfVideo.srcObject = stream;
  await selfVideo.play().catch(() => undefined);
  conn.textContent = 'pre-flight…';
  conn.className = 'pill glass warn';
}

async function goLive(): Promise<void> {
  goliveBtn.disabled = true;
  conn.textContent = 'connecting…';
  conn.className = 'pill glass warn';
  try {
    // A dead track (unplugged camera, or stopped by an earlier room) publishes nothing —
    // the receiver would sit on a black frame. Re-acquire before going live.
    if (!stream || stream.getVideoTracks()[0]?.readyState === 'ended') {
      await initMedia();
      goliveBtn.disabled = true;
      conn.textContent = 'connecting…';
      conn.className = 'pill glass warn';
    }
    const r = await api<{
      sessionId: string;
      room: string;
      livekitUrl: string;
      token: string;
      devices: { id: string; name: string; caps: { decode?: RungCap[] } | null }[];
    }>('/sessions', { body: { deviceIds }, token });
    sessionId = r.sessionId;
    // Final negotiation: pre-flight verdict ∩ what every destination reports it can decode.
    // An operator pin overrides negotiation (attempt, not claim — instrumentation stays honest).
    ceilIdx = pinnedRung >= 0 ? pinnedRung : Math.max(preflightIdx, deviceDecodeCeil(r.devices ?? []));
    rungIdx = ceilIdx;
    badTicks = 0;
    goodTicks = 0;
    lastBytes = 0;
    lastTs = 0;
    summary.egressBytes = 0;
    await setCaptureRung(RUNGS[rungIdx]!);
    // A discarded room (previous session or failed attempt) must never touch the UI again.
    room?.removeAllListeners();
    room?.disconnect();
    // stopLocalTrackOnUnpublish defaults to true and would kill the self-preview (and any
    // later session) on disconnect — this page owns the capture lifecycle, not the room.
    const thisRoom = new Room({ adaptiveStream: true, dynacast: true, stopLocalTrackOnUnpublish: false });
    room = thisRoom;
    thisRoom.on(RoomEvent.TrackSubscribed, onTrack);
    thisRoom.on(RoomEvent.Disconnected, () => {
      if (room !== thisRoom) return;
      conn.textContent = 'disconnected';
      conn.className = 'pill glass err';
    });
    await thisRoom.connect(r.livekitUrl, r.token);
    const vTrack = stream!.getVideoTracks()[0]!;
    await room.localParticipant.publishTrack(vTrack, {
      name: 'camera',
      simulcast: true,
      videoEncoding: { maxBitrate: RUNGS[ceilIdx]!.kbps * 1000, maxFramerate: RUNGS[ceilIdx]!.fps },
    });
    const aTrack = stream!.getAudioTracks()[0];
    if (aTrack) await room.localParticipant.publishTrack(aTrack, { name: 'mic' });
    startedAt = Date.now();
    document.body.classList.add('live');
    conn.textContent = 'CONNECTED';
    conn.className = 'pill glass ok';
    goliveBtn.textContent = 'STOP';
    goliveBtn.disabled = false;
    await api(`/sessions/${sessionId}/state`, { body: { state: 'live' }, token });
    void api(`/sessions/${sessionId}/log`, {
      body: { kind: 'preflight', meta: { ...net, start: RUNGS[rungIdx]!.label, ceiling: RUNGS[ceilIdx]!.label } },
      token,
    }).catch(() => undefined);
  } catch (e) {
    console.error('goLive failed:', e);
    // A failed attempt must leave the page in the "not live" state, or the GO LIVE
    // button would dispatch to stop() on the next click instead of retrying.
    const failedId = sessionId;
    sessionId = undefined;
    room?.removeAllListeners();
    room?.disconnect();
    room = undefined;
    if (failedId) await api(`/sessions/${failedId}/stop`, { body: { stats: {} }, token }).catch(() => undefined);
    conn.textContent = (e as Error).message;
    conn.className = 'pill glass err';
    goliveBtn.textContent = 'GO LIVE';
    goliveBtn.disabled = false;
  }
}

function onTrack(track: RemoteTrack, _pub: RemoteTrackPublication, participant: RemoteParticipant): void {
  if (!participant.identity.startsWith('device-')) return;
  if (track.kind === Track.Kind.Video) {
    track.attach(returnVideo);
    $('pipTag').textContent = `${participant.name ?? 'device'} · return feed`;
    document.body.classList.add('pip-open');
  } else if (track.kind === Track.Kind.Audio) {
    track.attach(); // return audio — AEC on our mic keeps the loop clean
  }
}

async function stop(): Promise<void> {
  if (!sessionId) return;
  const stats = {
    durationSeconds: Math.round((Date.now() - startedAt) / 1000),
    maxResolution: `${summary.maxWidth} × ${summary.maxHeight}`,
    maxMbps: Number(summary.maxMbps.toFixed(2)),
    audio: audioOk,
    egressBytes: summary.egressBytes, // measured video egress, all layers
    ladder: ladderHistory.map((l) => `${l.from}→${l.to}(${l.reason})`),
  };
  await api(`/sessions/${sessionId}/stop`, { body: { stats }, token }).catch(() => undefined);
  room?.removeAllListeners();
  room?.disconnect();
  room = undefined;
  sessionId = undefined;
  document.body.classList.remove('live', 'pip-open');
  goliveBtn.textContent = 'GO LIVE';
  conn.textContent = 'ready';
  conn.className = 'pill glass ok';
}

goliveBtn.addEventListener('click', () => (sessionId ? void stop() : void goLive()));

// ——— honest status strip + diagnostics: measured values only (STREAMING.md §7) ———
const diag = {
  captureW: 0,
  captureH: 0,
  captureFps: 0,
  encoder: '',
  encoderHw: undefined as boolean | undefined,
  limitation: 'none',
  rttMs: 0,
};
let receivers: { deviceId: string; name: string; online: boolean; ageMs: number | null; stats: Record<string, unknown> | null }[] = [];

setInterval(() => {
  if (!sessionId) return;
  void api<{ receivers: typeof receivers }>(`/sessions/${sessionId}/receiver-stats`, { token })
    .then((r) => (receivers = r.receivers))
    .catch(() => undefined);
}, 2000);

async function tick(): Promise<void> {
  let state = 'STANDBY';
  let cls = 'warn';
  let w = 0;
  let h = 0;
  let fps = 0;
  let mbps = 0;
  const vTrack = stream?.getVideoTracks()[0];
  if (vTrack) {
    const s = vTrack.getSettings();
    diag.captureW = s.width ?? 0;
    diag.captureH = s.height ?? 0;
    diag.captureFps = s.frameRate ?? 0;
    w = diag.captureW;
    h = diag.captureH;
    fps = diag.captureFps;
  }
  let limitation = 'none';
  let encFps = 0;
  let sumBytes = 0;
  let tsNow = 0;
  if (room && sessionId) {
    state = 'CONNECTED';
    cls = 'ok';
    try {
      const pubs = [...room.localParticipant.videoTrackPublications.values()];
      const t = pubs[0]?.track;
      const report: RTCStatsReport | undefined = await (
        t as unknown as { getRTCStatsReport?: () => Promise<RTCStatsReport> }
      )?.getRTCStatsReport?.();
      report?.forEach((r) => {
        if (r.type === 'outbound-rtp' && (r as { kind?: string }).kind === 'video') {
          const rr = r as {
            frameWidth?: number;
            frameHeight?: number;
            framesPerSecond?: number;
            bytesSent?: number;
            timestamp: number;
            qualityLimitationReason?: string;
            encoderImplementation?: string;
            powerEfficientEncoder?: boolean;
          };
          // Simulcast publishes several layers — the strip reports the best one delivered.
          if (rr.frameWidth && rr.frameWidth >= w) {
            w = rr.frameWidth;
            h = rr.frameHeight ?? 0;
          }
          if (rr.framesPerSecond) encFps = Math.max(encFps, rr.framesPerSecond);
          // Simulcast: one entry per layer — any layer reporting a limitation IS the limitation.
          if (rr.qualityLimitationReason && rr.qualityLimitationReason !== 'none') limitation = rr.qualityLimitationReason;
          if (rr.encoderImplementation) diag.encoder = rr.encoderImplementation;
          if (rr.powerEfficientEncoder !== undefined) diag.encoderHw = rr.powerEfficientEncoder;
          if (rr.bytesSent !== undefined) {
            sumBytes += rr.bytesSent; // all simulcast layers together = real egress
            tsNow = Math.max(tsNow, rr.timestamp);
          }
        }
        if (r.type === 'candidate-pair' && (r as { state?: string }).state === 'succeeded') {
          const rtt = (r as { currentRoundTripTime?: number }).currentRoundTripTime;
          if (rtt !== undefined) diag.rttMs = rtt * 1000;
        }
      });
    } catch {
      /* stats unavailable — show what we can measure */
    }
    if (sumBytes && tsNow) {
      if (lastTs) mbps = ((sumBytes - lastBytes) * 8) / ((tsNow - lastTs) / 1000) / 1e6;
      lastBytes = sumBytes;
      lastTs = tsNow;
      summary.egressBytes = sumBytes;
    }
    if (encFps) fps = encFps;
    diag.limitation = limitation;
    ladderTick(limitation, encFps);
    summary.maxWidth = Math.max(summary.maxWidth, w);
    summary.maxHeight = Math.max(summary.maxHeight, h);
    summary.maxMbps = Math.max(summary.maxMbps, mbps);
  }
  const dur = sessionId ? Math.round((Date.now() - startedAt) / 1000) : 0;
  const hh = String(Math.floor(dur / 3600)).padStart(2, '0');
  const mm = String(Math.floor((dur % 3600) / 60)).padStart(2, '0');
  const ss = String(dur % 60).padStart(2, '0');
  strip.innerHTML = `${hh}:${mm}:${ss} · <span class="${cls}">${state}</span> · ${w} × ${h} · ${fps.toFixed(0)} fps · ${Math.max(mbps, 0).toFixed(1)} Mbps · ${RUNGS[rungIdx]!.label}`;
  renderDiag(mbps);
}
setInterval(() => void tick(), 1000);

// ——— the diagnostic view: capture → encode → transport → decode → render → physical ———
let diagOpen = false;
$('diagBtn').addEventListener('click', () => {
  diagOpen = !diagOpen;
  $('diag').style.display = diagOpen ? '' : 'none';
});

function renderDiag(mbps: number): void {
  if (!diagOpen) return;
  const enc = diag.encoder
    ? `${diag.encoder}${diag.encoderHw === true ? ' · hardware' : diag.encoderHw === false ? ' · software' : ''}`
    : '—';
  let text =
    `RESOLUTION CHAIN            measured values only\n` +
    `CAPTURE    ${diag.captureW} × ${diag.captureH} @ ${diag.captureFps.toFixed(0)} fps\n` +
    `ENCODE     ${enc} · rung ${RUNGS[rungIdx]!.label} · limitation: ${diag.limitation}\n` +
    `TRANSPORT  ${Math.max(mbps, 0).toFixed(1)} Mbps · rtt ${diag.rttMs.toFixed(0)} ms\n`;
  for (const r of receivers) {
    const s = r.stats as { w?: number; h?: number; fps?: number; dropped?: number; decoder?: string | null; decoderHw?: boolean | null; screen?: { w: number; h: number; dpr: number } } | null;
    if (!r.online || !s) {
      text += `── ${r.name}: ${r.online ? 'no playback stats yet' : 'OFFLINE'}\n`;
      continue;
    }
    const age = r.ageMs !== null ? ` (${(r.ageMs / 1000).toFixed(0)}s ago)` : '';
    text +=
      `── ${r.name}${age}\n` +
      `DECODE     ${s.decoder ?? '—'}${s.decoderHw === true ? ' · hardware' : s.decoderHw === false ? ' · software' : ''}\n` +
      `RENDER     ${s.w ?? 0} × ${s.h ?? 0} @ ${s.fps ?? 0} fps · dropped ${s.dropped ?? '—'}\n` +
      `PHYSICAL   ${s.screen ? `${s.screen.w} × ${s.screen.h} @ ${s.screen.dpr}x` : '—'}\n`;
  }
  if (ladderHistory.length) {
    text += `LADDER     ${ladderHistory.slice(-4).map((l) => `${l.from}→${l.to} (${l.reason})`).join(' · ')}\n`;
  }
  $('diag').textContent = text;
}

// Introspection for tests and support: current ladder state, measured, read-only.
(window as unknown as { __hw: unknown }).__hw = {
  state: () => ({
    rung: RUNGS[rungIdx]!.label,
    ceiling: RUNGS[ceilIdx]!.label,
    limitation: diag.limitation,
    badTicks,
    goodTicks,
    encoder: diag.encoder,
  }),
};

void initMedia().then(async () => {
  await preflight();
  if (params.get('auto') === '1') void goLive();
});
