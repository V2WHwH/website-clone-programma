// M1 sender — camera permission, preview, connect. Publishes one video track to whichever
// receiver is in the (hardcoded, M1-only) room. Diagnostic chain always visible.
import { RateMeter, renderDiag, senderChain, verdict } from './diag.js';

const ROOM = 'm1'; // hardcoded room id — allowed in M1 and only in M1 (MILESTONES.md)

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const preview = $<HTMLVideoElement>('preview');
const btn = $<HTMLButtonElement>('connect');
const statusEl = $('status');
const diagEl = $('diag');

const params = new URLSearchParams(location.search);
let ws: WebSocket | undefined;
let pc: RTCPeerConnection | undefined;
let track: MediaStreamTrack | undefined;
const rate = new RateMeter();

function setStatus(text: string, cls: 'wait' | 'ok' | 'bad' = 'wait') {
  statusEl.textContent = text;
  statusEl.className = `pill ${cls}`;
}

// ?fake=1 replaces the camera with a synthetic canvas stream. CI-only: sandboxed environments
// have no capture devices; this still exercises encode -> transport -> decode -> render for real.
function fakeStream(): MediaStream {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;
  let t = 0;
  setInterval(() => {
    t += 1;
    ctx.fillStyle = `hsl(${t % 360} 60% 12%)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#35e0ff';
    ctx.beginPath();
    ctx.arc(640 + Math.sin(t / 20) * 400, 360 + Math.cos(t / 17) * 200, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eaf0f6';
    ctx.font = '48px monospace';
    ctx.fillText(`frame ${t}`, 40, 80);
  }, 1000 / 30);
  return canvas.captureStream(30);
}

async function initCamera(): Promise<void> {
  const stream =
    params.get('fake') === '1'
      ? fakeStream()
      : await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 60 } },
          audio: false, // audio is M4 scope; M1 proves the video chain
        });
  track = stream.getVideoTracks()[0];
  if (track) track.contentHint = 'motion';
  preview.srcObject = stream;
  await preview.play().catch(() => undefined);
  const s = track?.getSettings();
  setStatus(`camera ready — ${s?.width} × ${s?.height} @ ${Math.round(s?.frameRate ?? 0)}`, 'wait');
  btn.disabled = false;
}

function teardownPc(): void {
  pc?.close();
  pc = undefined;
}

async function startPeer(): Promise<void> {
  if (!track || !ws) return;
  teardownPc();
  pc = new RTCPeerConnection({ iceServers: [] }); // same LAN: no STUN/TURN in M1 (M2 scope)
  const sender = pc.addTrack(track);
  const p = sender.getParameters();
  p.degradationPreference = 'maintain-framerate';
  // Rung-4 target from STREAMING.md §4 (1080p60 @ 6 Mbps); the encoder ramps up towards it.
  if (p.encodings?.[0]) p.encodings[0].maxBitrate = 6_000_000;
  await sender.setParameters(p).catch(() => undefined);

  pc.onicecandidate = (e) => ws?.send(JSON.stringify({ t: 'ice', cand: e.candidate }));
  pc.onconnectionstatechange = () => {
    if (!pc) return;
    if (pc.connectionState === 'connected') setStatus('CONNECTED — streaming', 'ok');
    else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected')
      setStatus(`peer ${pc.connectionState}`, 'bad');
  };
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  ws.send(JSON.stringify({ t: 'sdp', desc: pc.localDescription }));
  setStatus('offer sent — connecting…', 'wait');
}

function connect(): void {
  btn.disabled = true;
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}/signal`);
  ws.onopen = () => {
    ws?.send(JSON.stringify({ t: 'join', room: ROOM, role: 'sender' }));
    setStatus('waiting for a receiver in the room…', 'wait');
  };
  ws.onclose = () => setStatus('signaling lost — reload to retry', 'bad');
  ws.onmessage = async (e) => {
    const msg = JSON.parse(e.data as string);
    if (msg.t === 'roster' && msg.peers.includes('receiver')) await startPeer();
    else if (msg.t === 'peer-joined' && msg.role === 'receiver') await startPeer();
    else if (msg.t === 'peer-left' && msg.role === 'receiver') {
      teardownPc();
      setStatus('receiver left — waiting…', 'wait');
    } else if (msg.t === 'sdp' && msg.desc?.type === 'answer' && pc) {
      await pc.setRemoteDescription(msg.desc);
    } else if (msg.t === 'ice' && msg.cand && pc) {
      await pc.addIceCandidate(msg.cand).catch(() => undefined);
    }
  };
}

async function diagLoop(): Promise<void> {
  if (pc && track) {
    const rows = await senderChain(pc, track, rate);
    const v = verdict(rows);
    renderDiag(diagEl, rows, v);
    (window as unknown as { __diag: unknown }).__diag = { rows, verdict: v };
  }
  setTimeout(diagLoop, 1000);
}

btn.addEventListener('click', connect);
void initCamera().then(() => {
  if (params.get('auto') === '1') connect(); // used by the e2e test
});
void diagLoop();
