// M1 receiver — fullscreen video, no chrome, never a visible desktop behind it.
// Kiosk hardening (watchdog, autostart, fallback content) is M5; this slice proves the glass.
import { RateMeter, RenderFpsMeter, receiverChain, renderDiag, verdict } from './diag.js';

const ROOM = 'm1';

const video = document.getElementById('out') as HTMLVideoElement;
const diagEl = document.getElementById('diag') as HTMLElement;
const hint = document.getElementById('hint') as HTMLElement;

const params = new URLSearchParams(location.search);
const render = new RenderFpsMeter();
const rate = new RateMeter();
let pc: RTCPeerConnection | undefined;
let ws: WebSocket;

render.attach(video);

function join(): void {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}/signal`);
  ws.onopen = () => ws.send(JSON.stringify({ t: 'join', room: ROOM, role: 'receiver' }));
  ws.onclose = () => setTimeout(join, 1000); // silent retry — never an error on the glass
  ws.onmessage = async (e) => {
    const msg = JSON.parse(e.data as string);
    if (msg.t === 'sdp' && msg.desc?.type === 'offer') {
      pc?.close();
      pc = new RTCPeerConnection({ iceServers: [] });
      pc.onicecandidate = (ev) => ws.send(JSON.stringify({ t: 'ice', cand: ev.candidate }));
      pc.ontrack = (ev) => {
        video.srcObject = ev.streams[0] ?? new MediaStream([ev.track]);
        void video.play().catch(() => undefined);
        hint.style.display = 'none';
      };
      await pc.setRemoteDescription(msg.desc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      ws.send(JSON.stringify({ t: 'sdp', desc: pc.localDescription }));
    } else if (msg.t === 'ice' && msg.cand && pc) {
      await pc.addIceCandidate(msg.cand).catch(() => undefined);
    } else if (msg.t === 'peer-left' && msg.role === 'sender') {
      hint.style.display = '';
      hint.textContent = 'Waiting for a sender…';
    }
  };
}

// Fullscreen needs a user gesture in a normal browser; in kiosk mode Chromium is started
// with --kiosk and ?nofs=1 skips the prompt entirely.
if (params.get('nofs') !== '1') {
  document.addEventListener(
    'click',
    () => void document.documentElement.requestFullscreen().catch(() => undefined),
    { once: true },
  );
}

// Diagnostic overlay: on by default in M1 (it *is* the deliverable); 'd' toggles.
document.addEventListener('keydown', (e) => {
  if (e.key === 'd') diagEl.style.display = diagEl.style.display === 'none' ? '' : 'none';
});

async function diagLoop(): Promise<void> {
  if (pc) {
    const rows = await receiverChain(pc, video, render, rate);
    const v = verdict(rows);
    renderDiag(diagEl, rows, v);
    (window as unknown as { __diag: unknown }).__diag = { rows, verdict: v };
  }
  setTimeout(diagLoop, 1000);
}

join();
void diagLoop();
