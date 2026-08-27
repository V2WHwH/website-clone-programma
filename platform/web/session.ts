// S2 → S4/S5: preview, GO LIVE via the platform + LiveKit, honest status strip, return feed
// inset, STOP. Works for signed-in presenters and guests (grant in sessionStorage).
import {
  Room,
  RoomEvent,
  Track,
  type RemoteTrack,
  type RemoteTrackPublication,
  type RemoteParticipant,
} from 'livekit-client';
import { $, api, loadSession } from './client.js';

const params = new URLSearchParams(location.search);
const guestRaw = sessionStorage.getItem('hw_guest');
const guest = guestRaw ? (JSON.parse(guestRaw) as { access: string; deviceIds: string[] }) : undefined;
const token = guest?.access ?? loadSession()?.access;
if (!token) location.href = '/login.html';

const deviceIds = (params.get('d') ?? guest?.deviceIds.join(',') ?? '').split(',').filter(Boolean);
const fake = params.get('fake') === '1';

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
const summary = { maxWidth: 0, maxHeight: 0, maxMbps: 0 };

$('dest').textContent = `→ ${deviceIds.length} destination${deviceIds.length === 1 ? '' : 's'}`;
$('pip').addEventListener('click', () => document.body.classList.toggle('pip-open'));
$('exit').addEventListener('click', async () => {
  await stop();
  location.href = guest ? '/join.html?done=1' : '/app.html';
});

function fakeStream(): MediaStream {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;
  let t = 0;
  setInterval(() => {
    t += 1;
    ctx.fillStyle = `hsl(${t % 360} 55% 12%)`;
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = '#35e0ff';
    ctx.beginPath();
    ctx.arc(640 + Math.sin(t / 20) * 380, 360 + Math.cos(t / 17) * 190, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eaf0f6';
    ctx.font = '46px monospace';
    ctx.fillText(`frame ${t}`, 40, 80);
  }, 1000 / 30);
  return canvas.captureStream(30);
}

async function initMedia(): Promise<void> {
  if (fake) {
    stream = fakeStream();
  } else {
    // Echo cancellation is mandatory (M4): request it explicitly; report honestly if no mic.
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 60 } },
      audio: { echoCancellation: true, noiseSuppression: true },
    }).catch(async () => {
      const v = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 60 } },
      });
      return v;
    });
  }
  audioOk = (stream.getAudioTracks().length ?? 0) > 0;
  selfVideo.srcObject = stream;
  await selfVideo.play().catch(() => undefined);
  conn.textContent = audioOk ? 'ready' : 'ready — no microphone';
  conn.className = 'pill glass ' + (audioOk ? 'ok' : 'warn');
  goliveBtn.disabled = false;
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
    const r = await api<{ sessionId: string; room: string; livekitUrl: string; token: string }>('/sessions', {
      body: { deviceIds },
      token,
    });
    sessionId = r.sessionId;
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
    await room.localParticipant.publishTrack(vTrack, { name: 'camera', simulcast: true });
    const aTrack = stream!.getAudioTracks()[0];
    if (aTrack) await room.localParticipant.publishTrack(aTrack, { name: 'mic' });
    startedAt = Date.now();
    document.body.classList.add('live');
    conn.textContent = 'CONNECTED';
    conn.className = 'pill glass ok';
    goliveBtn.textContent = 'STOP';
    goliveBtn.disabled = false;
    await api(`/sessions/${sessionId}/state`, { body: { state: 'live' }, token });
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

// Honest status strip: measured values only (STREAMING.md §7 discipline at M4 scope).
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
    w = s.width ?? 0;
    h = s.height ?? 0;
    fps = s.frameRate ?? 0;
  }
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
          const rr = r as { frameWidth?: number; frameHeight?: number; framesPerSecond?: number; bytesSent?: number; timestamp: number };
          if (rr.frameWidth) {
            w = rr.frameWidth;
            h = rr.frameHeight ?? 0;
          }
          if (rr.framesPerSecond) fps = rr.framesPerSecond;
          if (rr.bytesSent !== undefined) {
            if (lastTs) mbps = ((rr.bytesSent - lastBytes) * 8) / ((rr.timestamp - lastTs) / 1000) / 1e6;
            lastBytes = rr.bytesSent;
            lastTs = rr.timestamp;
          }
        }
      });
    } catch {
      /* stats unavailable — show what we can measure */
    }
    summary.maxWidth = Math.max(summary.maxWidth, w);
    summary.maxHeight = Math.max(summary.maxHeight, h);
    summary.maxMbps = Math.max(summary.maxMbps, mbps);
  }
  const dur = sessionId ? Math.round((Date.now() - startedAt) / 1000) : 0;
  const hh = String(Math.floor(dur / 3600)).padStart(2, '0');
  const mm = String(Math.floor((dur % 3600) / 60)).padStart(2, '0');
  const ss = String(dur % 60).padStart(2, '0');
  strip.innerHTML = `${hh}:${mm}:${ss} · <span class="${cls}">${state}</span> · ${w} × ${h} · ${fps.toFixed(0)} fps · ${Math.max(mbps, 0).toFixed(1)} Mbps`;
}
setInterval(() => void tick(), 1000);

void initMedia().then(() => {
  if (params.get('auto') === '1') void goLive();
});
