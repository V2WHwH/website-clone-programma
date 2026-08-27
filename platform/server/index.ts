// Platform entrypoint: REST API (/api/v1), static web app, device presence WebSocket.
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { env } from './env.js';
import { migrate } from './migrate.js';
import { authRouter } from './api-auth.js';
import { devicesRouter } from './api-devices.js';
import { sessionsRouter } from './api-sessions.js';
import { verifyToken, type DeviceClaims } from './auth.js';
import { deviceConnected, deviceDisconnected, deviceHeartbeat } from './presence.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

const app = express();
app.use(express.json({ limit: '256kb' }));
app.use(express.static(root));

app.get('/api/v1/health', (_req, res) => res.json({ ok: true }));
app.get('/api/v1/config', (_req, res) => res.json({ livekitUrl: env.livekit.url }));
app.use('/api/v1/auth', authRouter);
app.use('/api/v1', devicesRouter);
app.use('/api/v1', sessionsRouter);

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', async (req, socket, head) => {
  const url = new URL(req.url ?? '/', 'http://x');
  if (url.pathname !== '/ws/device') {
    socket.destroy();
    return;
  }
  const claims = await verifyToken<DeviceClaims>(url.searchParams.get('token') ?? '', 'device');
  if (!claims) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    void deviceConnected(claims.device, claims.org, ws);
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(String(data));
        if (msg.t === 'hb') void deviceHeartbeat(claims.device, msg.agentVersion);
      } catch {
        /* ignore malformed frames */
      }
    });
    ws.on('close', () => void deviceDisconnected(claims.device, ws));
  });
});

async function main(): Promise<void> {
  const applied = await migrate();
  if (applied.length) console.log(`migrations applied: ${applied.join(', ')}`);
  server.listen(env.port, () => {
    console.log(`HoloMe/HoloSee platform on :${env.port}`);
    console.log(`  app      : http://localhost:${env.port}/login.html`);
    console.log(`  receiver : http://localhost:${env.port}/receiver.html`);
    console.log(`  livekit  : ${env.livekit.url}`);
  });
}

void main();
