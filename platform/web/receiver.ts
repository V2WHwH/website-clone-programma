// HoloSee receiver (M3 pairing + M4 playback + M5 unattended operation).
// States: pairing → idle → live ⇄ fallback → idle. The glass NEVER shows an error: any failure
// falls back to the brand screen and recovery is silent. Every transition is logged to the
// control plane as a structured device event, traceable by session id.
import { Room, RoomEvent, Track, type RemoteTrack, type RemoteParticipant } from 'livekit-client';
import { $, api } from './client.js';
import { probeDecode } from './caps.js';

const title = $('rcvTitle');
const codeEl = $('rcvCode');
const line = $('rcvLine');
const foot = $('rcvFoot');
const video = $('rcvVideo') as unknown as HTMLVideoElement;

const AGENT_VERSION = '0.2.0-web';
const STALL_MS = 4000; // no decoded frame for this long while live → fallback
const REJOIN_EVERY_MS = 3000;

// ——— device identity: non-extractable ECDSA P-256 keypair in IndexedDB (SECURITY.md §2) ———
interface KeyRecord {
  id: 'device';
  priv: CryptoKey;
  pubJwk: JsonWebKey;
  deviceId?: string;
}

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('holosee', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('keys', { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function loadKeys(): Promise<KeyRecord | undefined> {
  const db = await idb();
  return new Promise((resolve) => {
    const r = db.transaction('keys').objectStore('keys').get('device');
    r.onsuccess = () => resolve(r.result as KeyRecord | undefined);
    r.onerror = () => resolve(undefined);
  });
}
async function saveKeys(rec: KeyRecord): Promise<void> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('keys', 'readwrite');
    tx.objectStore('keys').put(rec);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function ensureKeys(): Promise<KeyRecord> {
  const existing = await loadKeys();
  if (existing) return existing;
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const pubJwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const rec: KeyRecord = { id: 'device', priv: pair.privateKey, pubJwk };
  await saveKeys(rec);
  return rec;
}

const b64url = (buf: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

let keys: KeyRecord;
let restToken = '';

// M7: the watchdog (host agent) cannot hold the keypair — the receiver hands it the
// short-lived device token over the localhost helper the watchdog put in our launch URL.
const wdParams = new URLSearchParams(location.search);
const wdPort = wdParams.get('wd');
const wdSecret = wdParams.get('wds');

async function tellWatchdog(pathname: string, body: Record<string, unknown>): Promise<void> {
  if (!wdPort) return;
  await fetch(`http://127.0.0.1:${wdPort}${pathname}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ secret: wdSecret, ...body }),
  }).catch(() => undefined);
}

async function deviceToken(): Promise<string> {
  const { nonce } = await api<{ nonce: string }>(`/devices/${keys.deviceId}/auth/nonce`, { body: {}, token: '' });
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.priv, new TextEncoder().encode(nonce));
  const r = await api<{ token: string }>(`/devices/${keys.deviceId}/auth`, {
    body: { nonce, signature: b64url(sig) },
    token: '',
  });
  restToken = r.token;
  void tellWatchdog('/token', { token: r.token });
  return r.token;
}

// M7: last 200 log lines stay on the device for the send_logs remote action.
const recentLogs: string[] = [];
function remember(line: string): void {
  recentLogs.push(`${new Date().toISOString()} ${line}`.slice(0, 300));
  if (recentLogs.length > 200) recentLogs.shift();
}

function postEvent(type: string, sessionId?: string, meta: Record<string, unknown> = {}): void {
  remember(`${type}${sessionId ? ` session=${sessionId.slice(0, 8)}` : ''} ${JSON.stringify(meta).slice(0, 160)}`);
  if (!restToken) return;
  void api('/devices/events', { body: { type, sessionId, meta }, token: restToken }).catch(() => undefined);
}

// ——— M7 remote actions: pushed by an operator over the presence socket ———
async function onAction(msg: { action: string; actionId: string }): Promise<void> {
  const done = (meta: Record<string, unknown> = {}): void =>
    postEvent('action_result', current?.sessionId, { actionId: msg.actionId, action: msg.action, ...meta });
  if (msg.action === 'reload') {
    done({ ok: true });
    setTimeout(() => location.reload(), 500);
  } else if (msg.action === 'clear_cache') {
    localStorage.clear();
    sessionStorage.clear(); // the device keypair lives in IndexedDB and is untouched
    done({ ok: true });
    setTimeout(() => location.reload(), 500);
  } else if (msg.action === 'send_logs') {
    done({ ok: true, logs: recentLogs.slice(-50) });
  } else if (msg.action === 'net_test') {
    try {
      const t: number[] = [];
      for (let i = 0; i < 5; i++) {
        const s = performance.now();
        await fetch('/api/v1/health', { cache: 'no-store' });
        t.push(performance.now() - s);
      }
      const rttMs = t.sort((a, b) => a - b)[Math.floor(t.length / 2)] ?? 0;
      const bytes = 4_194_304;
      const s2 = performance.now();
      const r = await fetch(`/api/v1/netprobe/download?bytes=${bytes}`, {
        headers: { authorization: `Bearer ${restToken}` },
        cache: 'no-store',
      });
      await r.arrayBuffer();
      done({
        ok: r.ok,
        rttMs: Math.round(rttMs * 10) / 10,
        downMbps: Math.round((bytes * 8) / ((performance.now() - s2) / 1000) / 1e6),
      });
    } catch (e) {
      done({ ok: false, error: String(e).slice(0, 200) });
    }
  } else if (msg.action === 'restart_browser' || msg.action === 'reboot_host') {
    done({ ok: true, forwarded: 'watchdog' });
    void tellWatchdog('/do', { action: msg.action, actionId: msg.actionId });
  } else {
    done({ ok: false, error: 'unknown action' });
  }
}

// ——— UI states (brand only — errors are never rendered on the glass) ———
function showPairing(code: string): void {
  title.textContent = 'Pair this display';
  codeEl.style.display = '';
  codeEl.textContent = code.replace(/(.{2})(.{2})(.{2})/, '$1·$2·$3');
  line.textContent = 'Open HoloMe Cloud as an admin and enter this code';
  foot.textContent = 'CODE EXPIRES IN 10 MIN · KEYPAIR GENERATED ON THIS DEVICE';
}
function showIdle(): void {
  document.body.classList.remove('playing');
  title.textContent = 'Ready when you are';
  codeEl.style.display = 'none';
  line.textContent = '';
  foot.textContent = 'HOLOSEE · ONLINE · PAIRED TO HEREWEHOLO CLOUD';
}

// ——— pairing flow ———
async function pair(): Promise<void> {
  const { code } = await api<{ code: string }>('/pairing/start', { body: { publicKeyJwk: keys.pubJwk }, token: '' });
  showPairing(code);
  for (;;) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const p = await api<{ claimed: boolean; deviceId: string | null }>('/pairing/poll', { body: { code }, token: '' });
      if (p.claimed && p.deviceId) {
        keys.deviceId = p.deviceId;
        await saveKeys(keys);
        return;
      }
    } catch {
      return pair(); // code expired → fresh code, silently
    }
  }
}

// ——— live session with fallback + silent recovery (M5) ———
type State = 'idle' | 'live' | 'fallback';
let state: State = 'idle';
let room: Room | undefined;
let current: { sessionId: string; room: string; token: string; url: string } | undefined;
let lastFrameTs = 0;
let sawFrameThisSession = false;
let fallbackSince = 0;
let rejoinTimer: ReturnType<typeof setTimeout> | undefined;

// M6: measured render rate — presented frames counted at the compositor, not assumed.
let framesThisSecond = 0;
let measuredFps = 0;
setInterval(() => {
  measuredFps = framesThisSecond;
  framesThisSecond = 0;
}, 1000);

video.requestVideoFrameCallback?.(function onFrame() {
  lastFrameTs = Date.now();
  framesThisSecond += 1;
  if (current && !sawFrameThisSession) {
    sawFrameThisSession = true;
    document.body.classList.add('playing');
    if (state === 'fallback') {
      state = 'live';
      postEvent('recovered', current.sessionId, { afterMs: Date.now() - fallbackSince });
    } else {
      state = 'live';
    }
    postEvent('session_playing', current.sessionId, { w: video.videoWidth, h: video.videoHeight });
  } else if (current && state === 'fallback') {
    state = 'live';
    document.body.classList.add('playing');
    postEvent('recovered', current.sessionId, { afterMs: Date.now() - fallbackSince });
  }
  video.requestVideoFrameCallback(onFrame);
});

function enterFallback(reason: string): void {
  if (!current || state === 'fallback') return;
  state = 'fallback';
  fallbackSince = Date.now();
  showIdle(); // the fallback IS the brand screen — never an error, never a desktop
  postEvent('fallback_shown', current.sessionId, { reason });
  scheduleRejoin();
}

function scheduleRejoin(): void {
  if (rejoinTimer || !current) return;
  rejoinTimer = setTimeout(() => {
    rejoinTimer = undefined;
    if (current && state === 'fallback') void joinRoom(true);
  }, REJOIN_EVERY_MS);
}

async function joinRoom(isRejoin: boolean): Promise<void> {
  if (!current) return;
  try {
    room?.disconnect();
    room = new Room({ adaptiveStream: true });
    room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _p, participant: RemoteParticipant) => {
      if (!participant.identity.startsWith('presenter-')) return;
      if (track.kind === Track.Kind.Video) {
        track.attach(video);
        liveVideoTrack = track;
      } else if (track.kind === Track.Kind.Audio) {
        track.attach();
      }
    });
    room.on(RoomEvent.Disconnected, () => {
      if (current) {
        enterFallback('sfu_disconnected');
      } else {
        showIdle();
      }
    });
    await room.connect(current.url, current.token);
    lastFrameTs = Date.now(); // grace period until first frame
    // Return feed: publish this side's camera/mic when the hardware has them.
    if (!isRejoin) {
      try {
        const rf = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 } },
          audio: { echoCancellation: true },
        });
        for (const t of rf.getTracks()) await room.localParticipant.publishTrack(t, { name: `return-${t.kind}` });
      } catch {
        foot.textContent = 'HOLOSEE · LIVE · RETURN FEED UNAVAILABLE (NO CAMERA ON THIS DEVICE)';
      }
    }
  } catch {
    scheduleRejoin(); // SFU not reachable yet — keep trying silently
  }
}

function onSessionStart(msg: { sessionId: string; room: string; token: string; url: string }): void {
  current = msg;
  sawFrameThisSession = false;
  state = 'live';
  lastFrameTs = Date.now();
  void joinRoom(false);
}

// ——— M6: the receiver half of the resolution chain, measured, never assumed ———
let liveVideoTrack: RemoteTrack | undefined;
let decoderImpl = '';
let decoderHw: boolean | undefined;

// inbound-rtp carries the browser's own decoder identity + hardware signal.
setInterval(() => {
  const rtpReceiver = (liveVideoTrack as unknown as { receiver?: RTCRtpReceiver } | undefined)?.receiver;
  if (!rtpReceiver || state !== 'live') return;
  void rtpReceiver
    .getStats()
    .then((report) => {
      report.forEach((r) => {
        const rr = r as { type: string; decoderImplementation?: string; powerEfficientDecoder?: boolean };
        if (rr.type === 'inbound-rtp' && rr.decoderImplementation) {
          decoderImpl = rr.decoderImplementation;
          decoderHw = rr.powerEfficientDecoder;
        }
      });
    })
    .catch(() => undefined);
}, 5000);

function renderStats(): Record<string, unknown> {
  const vq = video.getVideoPlaybackQuality?.();
  return {
    sessionId: current?.sessionId,
    state,
    w: video.videoWidth,
    h: video.videoHeight,
    fps: measuredFps,
    dropped: vq?.droppedVideoFrames ?? null,
    decoder: decoderImpl || null,
    decoderHw: decoderHw ?? null,
    screen: { w: screen.width, h: screen.height, dpr: devicePixelRatio },
  };
}

async function postCaps(): Promise<void> {
  try {
    const decode = await probeDecode();
    await api('/devices/caps', {
      body: { caps: { decode, screen: { w: screen.width, h: screen.height, dpr: devicePixelRatio } } },
      token: restToken,
    });
  } catch {
    /* capability report is best-effort; absence is an honest "not measured" */
  }
}

// Operator diagnostics (press D, or ?diag=1) — the audience never sees this by default.
const diagEl = document.createElement('div');
diagEl.style.cssText =
  'position:fixed;left:16px;bottom:52px;z-index:50;display:none;padding:14px 16px;border-radius:10px;' +
  'background:rgba(6,10,15,.88);border:1px solid rgba(53,224,255,.25);color:#9fb2c5;' +
  'font:12px/1.7 "IBM Plex Mono",monospace;white-space:pre;';
document.body.appendChild(diagEl);
let diagOn = new URLSearchParams(location.search).get('diag') === '1';
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'd') diagOn = !diagOn;
});
setInterval(() => {
  diagEl.style.display = diagOn ? '' : 'none';
  if (!diagOn) return;
  const s = renderStats();
  const sc = s.screen as { w: number; h: number; dpr: number };
  diagEl.textContent =
    `HOLOSEE DIAGNOSTICS            measured values only\n` +
    `STATE     ${state}${current ? ` · session ${current.sessionId.slice(0, 8)}` : ''}\n` +
    `DECODE    ${s.decoder ?? '—'}${s.decoderHw === true ? ' · hardware' : s.decoderHw === false ? ' · software' : ''}\n` +
    `RENDER    ${s.w} × ${s.h} @ ${s.fps} fps · dropped ${s.dropped ?? '—'}\n` +
    `PHYSICAL  ${sc.w} × ${sc.h} @ ${sc.dpr}x\n` +
    `AGENT     ${AGENT_VERSION} · device ${keys?.deviceId?.slice(0, 8) ?? '—'}`;
}, 1000);

function onSessionStop(): void {
  current = undefined;
  state = 'idle';
  liveVideoTrack = undefined;
  decoderImpl = '';
  decoderHw = undefined;
  if (rejoinTimer) clearTimeout(rejoinTimer);
  rejoinTimer = undefined;
  room?.disconnect();
  room = undefined;
  showIdle();
}

// Media stall watchdog: frozen or absent frames while live → fallback within STALL_MS.
setInterval(() => {
  if (state === 'live' && current && sawFrameThisSession && Date.now() - lastFrameTs > STALL_MS) {
    document.body.classList.remove('playing');
    enterFallback('media_stalled');
  } else if (state === 'live' && current && !sawFrameThisSession && Date.now() - lastFrameTs > STALL_MS * 2) {
    enterFallback('no_first_frame');
  }
}, 1000);

// ——— presence WS with silent reconnect ———
async function connectPresence(): Promise<void> {
  try {
    const token = await deviceToken();
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws/device?token=${token}`);
    ws.onopen = () => {
      if (state === 'idle') showIdle();
      const hb = setInterval(() => {
        if (ws.readyState === ws.OPEN)
          ws.send(
            JSON.stringify({
              t: 'hb',
              agentVersion: AGENT_VERSION,
              // M6: while playing, the heartbeat carries the measured decode/render chain
              ...(current ? { stats: renderStats() } : {}),
            }),
          );
        else clearInterval(hb);
      }, 10_000);
      // Faster stats channel while playing (in-memory on the server, no DB writes).
      const st = setInterval(() => {
        if (ws.readyState !== ws.OPEN) clearInterval(st);
        else if (current) ws.send(JSON.stringify({ t: 'stats', stats: renderStats() }));
      }, 2000);
    };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data as string);
      if (msg.t === 'session-start') onSessionStart(msg);
      if (msg.t === 'session-stop') onSessionStop();
      if (msg.t === 'action') void onAction(msg);
    };
    ws.onclose = () => setTimeout(() => void connectPresence(), 2000);
  } catch {
    setTimeout(() => void connectPresence(), 3000);
  }
}

// Refresh the short-lived REST token in the background so event logging keeps working.
setInterval(() => {
  if (keys?.deviceId) void deviceToken().catch(() => undefined);
}, 10 * 60_000);

// Nothing may ever surface as an error on the glass — log it instead.
window.addEventListener('error', (e) => postEvent('log', current?.sessionId, { error: String(e.message).slice(0, 300) }));
window.addEventListener('unhandledrejection', (e) =>
  postEvent('log', current?.sessionId, { error: String(e.reason).slice(0, 300) }),
);

async function main(): Promise<void> {
  keys = await ensureKeys();
  if (!keys.deviceId) await pair();
  await connectPresence();
  postEvent('boot', undefined, { agentVersion: AGENT_VERSION });
  void postCaps();
  (window as unknown as { __holosee: unknown }).__holosee = { deviceId: keys.deviceId };
}

void main();
