// WebSocket-hub: houdt verbonden players (holoboxen) bij en laat het CMS
// realtime commando's sturen (reload, identify, playlist-wissel).
'use strict';

const { WebSocketServer } = require('ws');
const db = require('./db');

const players = new Map(); // deviceId -> Set<ws>
const admins = new Set();

function attach(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const role = url.searchParams.get('role');

    if (role === 'player') {
      const key = url.searchParams.get('key');
      const state = db.load();
      const device = state.devices.find((d) => d.key === key);
      if (!device) return ws.close(4001, 'Onbekende device-key');

      ws.deviceId = device.id;
      if (!players.has(device.id)) players.set(device.id, new Set());
      players.get(device.id).add(ws);

      device.lastSeen = Date.now();
      device.lastIp = req.socket.remoteAddress?.replace('::ffff:', '') || null;
      db.save();
      broadcastAdmins({ type: 'device-online', deviceId: device.id, ip: device.lastIp });

      ws.on('message', (raw) => {
        let msg;
        try { msg = JSON.parse(raw); } catch { return; }
        if (msg.type === 'status') {
          const dev = db.load().devices.find((d) => d.id === ws.deviceId);
          if (dev) {
            dev.lastSeen = Date.now();
            dev.nowPlaying = msg.nowPlaying || null;
            dev.playerInfo = msg.info || dev.playerInfo || null;
            db.save();
          }
          broadcastAdmins({ type: 'device-status', deviceId: ws.deviceId, nowPlaying: msg.nowPlaying });
        }
      });

      ws.on('close', () => {
        players.get(device.id)?.delete(ws);
        if (players.get(device.id)?.size === 0) players.delete(device.id);
        broadcastAdmins({ type: 'device-offline', deviceId: device.id });
      });
    } else if (role === 'admin') {
      // Alleen voor status-updates in het CMS; commando's lopen via de REST-API
      // (die wél sessie-authenticatie heeft).
      admins.add(ws);
      ws.on('close', () => admins.delete(ws));
    } else {
      ws.close(4000, 'role vereist (player|admin)');
    }
  });

  return wss;
}

function broadcastAdmins(msg) {
  const raw = JSON.stringify(msg);
  for (const ws of admins) if (ws.readyState === 1) ws.send(raw);
}

// Stuur een commando naar (alle verbindingen van) één device.
function sendToDevice(deviceId, msg) {
  const set = players.get(deviceId);
  if (!set) return 0;
  const raw = JSON.stringify(msg);
  let n = 0;
  for (const ws of set) if (ws.readyState === 1) { ws.send(raw); n++; }
  return n;
}

function isOnline(deviceId) {
  return (players.get(deviceId)?.size || 0) > 0;
}

module.exports = { attach, sendToDevice, isOnline, broadcastAdmins };
