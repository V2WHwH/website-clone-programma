// HoloSee receiver page (M3 pairing + M4 playback). States: pairing → idle → live → idle.
// Never an error on the glass: failures show the brand idle state and retry silently.
import { Room, RoomEvent, Track, type RemoteTrack, type RemoteParticipant } from 'livekit-client';
import { $, api } from './client.js';

const title = $('rcvTitle');
const codeEl = $('rcvCode');
const line = $('rcvLine');
const foot = $('rcvFoot');
const video = $('rcvVideo') as unknown as HTMLVideoElement;

const AGENT_VERSION = '0.1.0-web';

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

async function deviceToken(rec: KeyRecord): Promise<string> {
  const { nonce } = await api<{ nonce: string }>(`/devices/${rec.deviceId}/auth/nonce`, { body: {}, token: '' });
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    rec.priv,
    new TextEncoder().encode(nonce),
  );
  const r = await api<{ token: string }>(`/devices/${rec.deviceId}/auth`, {
    body: { nonce, signature: b64url(sig) },
    token: '',
  });
  return r.token;
}

// ——— UI states ———
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
async function pair(rec: KeyRecord): Promise<KeyRecord> {
  const { code } = await api<{ code: string }>('/pairing/start', { body: { publicKeyJwk: rec.pubJwk }, token: '' });
  showPairing(code);
  for (;;) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const p = await api<{ claimed: boolean; deviceId: string | null }>('/pairing/poll', {
        body: { code },
        token: '',
      });
      if (p.claimed && p.deviceId) {
        rec.deviceId = p.deviceId;
        await saveKeys(rec);
        return rec;
      }
    } catch {
      // code expired → start over with a fresh code
      return pair(rec);
    }
  }
}

// ——— live session ———
let room: Room | undefined;

async function onSessionStart(msg: { room: string; token: string; url: string }): Promise<void> {
  room?.disconnect();
  room = new Room({ adaptiveStream: true });
  room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _p, participant: RemoteParticipant) => {
    if (!participant.identity.startsWith('presenter-')) return;
    if (track.kind === Track.Kind.Video) {
      track.attach(video);
      document.body.classList.add('playing');
    } else if (track.kind === Track.Kind.Audio) {
      track.attach();
    }
  });
  room.on(RoomEvent.Disconnected, showIdle);
  await room.connect(msg.url, msg.token);
  // Return feed: publish this side's camera/mic when the hardware has them.
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

function onSessionStop(): void {
  room?.disconnect();
  room = undefined;
  showIdle();
}

// ——— presence WS with silent reconnect ———
async function connectPresence(rec: KeyRecord): Promise<void> {
  try {
    const token = await deviceToken(rec);
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws/device?token=${token}`);
    ws.onopen = () => {
      showIdle();
      const hb = setInterval(() => {
        if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ t: 'hb', agentVersion: AGENT_VERSION }));
        else clearInterval(hb);
      }, 10_000);
    };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data as string);
      if (msg.t === 'session-start') void onSessionStart(msg);
      if (msg.t === 'session-stop') onSessionStop();
    };
    ws.onclose = () => setTimeout(() => void connectPresence(rec), 2000);
  } catch {
    setTimeout(() => void connectPresence(rec), 3000);
  }
}

async function main(): Promise<void> {
  let rec = await ensureKeys();
  if (!rec.deviceId) rec = await pair(rec);
  await connectPresence(rec);
  (window as unknown as { __holosee: unknown }).__holosee = { deviceId: rec.deviceId };
}

void main();
