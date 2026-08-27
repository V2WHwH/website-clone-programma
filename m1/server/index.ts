// M1 signaling service — the smallest thing that lets a sender and a receiver on the same LAN
// find each other. A dumb, room-scoped JSON relay over WebSocket; all WebRTC negotiation happens
// in the browsers. Replaced by the SFU (ADR-001) in M2; the hardcoded room is allowed in M1 only.
import express from 'express';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = Number(process.env.PORT ?? 8787);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

const app = express();
app.use(express.static(root));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/signal' });

interface Peer {
  ws: WebSocket;
  role: string;
  room: string;
}

const peers = new Set<Peer>();
const roomPeers = (room: string) => [...peers].filter((p) => p.room === room);
const send = (ws: WebSocket, msg: unknown) => {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
};

wss.on('connection', (ws) => {
  let me: Peer | undefined;

  ws.on('message', (data) => {
    let msg: { t?: string; room?: string; role?: string } & Record<string, unknown>;
    try {
      msg = JSON.parse(String(data));
    } catch {
      return;
    }

    if (msg.t === 'join' && typeof msg.room === 'string' && typeof msg.role === 'string') {
      me = { ws, role: msg.role, room: msg.room };
      peers.add(me);
      send(ws, { t: 'roster', peers: roomPeers(me.room).filter((p) => p !== me).map((p) => p.role) });
      for (const p of roomPeers(me.room)) {
        if (p !== me) send(p.ws, { t: 'peer-joined', role: me.role });
      }
      console.log(`[signal] ${me.role} joined room "${me.room}" (${roomPeers(me.room).length} in room)`);
      return;
    }

    // Everything else (sdp, ice) is relayed verbatim to the other peers in the room.
    if (me) {
      for (const p of roomPeers(me.room)) {
        if (p !== me) send(p.ws, { ...msg, from: me.role });
      }
    }
  });

  ws.on('close', () => {
    if (!me) return;
    peers.delete(me);
    for (const p of roomPeers(me.room)) send(p.ws, { t: 'peer-left', role: me.role });
    console.log(`[signal] ${me.role} left room "${me.room}"`);
  });
});

server.listen(PORT, () => {
  const nets = Object.values(os.networkInterfaces())
    .flat()
    .filter((n): n is os.NetworkInterfaceInfo => !!n && n.family === 'IPv4' && !n.internal)
    .map((n) => n.address);
  console.log(`M1 camera-to-glass up on port ${PORT}`);
  console.log(`  sender   : http://localhost:${PORT}/sender.html`);
  console.log(`  receiver : http://localhost:${PORT}/receiver.html`);
  for (const ip of nets) console.log(`  LAN      : http://${ip}:${PORT}/  (open this on the second machine)`);
  console.log(`  note: browsers require HTTPS or localhost for camera access; on the LAN start the`);
  console.log(`  sender's Chromium with --unsafely-treat-insecure-origin-as-secure=http://<ip>:${PORT} (dev only, M1 only)`);
});
