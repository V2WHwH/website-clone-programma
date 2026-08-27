// HoloSee receiver (M3 pairing + M4 playback + M5 unattended operation).
// States: pairing → idle → live ⇄ fallback → idle. The glass NEVER shows an error: any failure
// falls back to the brand screen and recovery is silent. Every transition is logged to the
// control plane as a structured device event, traceable by session id.
import { Room, RoomEvent, Track, type RemoteTrack, type RemoteParticipant } from 'livekit-client';
import { $, api } from './client.js';

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

async function deviceToken(): Promise<string> {
  const { nonce } = await api<{ nonce: string }>(`/devices/${keys.deviceId}/auth/nonce`, { body: {}, token: '' });
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.priv, new TextEncoder().encode(nonce));
  const r = await api<{ token: string }>(`/devices/${keys.deviceId}/auth`, {
    body: { nonce, signature: b64url(sig) },
    token: '',
  });
  restToken = r.token;
  return r.token;
}

function postEvent(type: string, sessionId?: string, meta: Record<string, unknown> = {}): void {
  if (!restToken) return;
  void api('/devices/events', { body: { type, sessionId, meta }, token: restToken }).catch(() => undefined);
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

video.requestVideoFrameCallback?.(function onFrame() {
  lastFrameTs = Date.now();
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

function onSessionStop(): void {
  current = undefined;
  state = 'idle';
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
        if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ t: 'hb', agentVersion: AGENT_VERSION }));
        else clearInterval(hb);
      }, 10_000);
    };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data as string);
      if (msg.t === 'session-start') onSessionStart(msg);
      if (msg.t === 'session-stop') onSessionStop();
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
  (window as unknown as { __holosee: unknown }).__holosee = { deviceId: keys.deviceId };
}

void main();
