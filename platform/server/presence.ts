// Device presence over one persistent WebSocket per online device (ADR-004).
// Online/offline is WS liveness; the server can push session-start/stop commands.
import type { WebSocket } from 'ws';
import { q } from './db.js';

interface Entry {
  ws: WebSocket;
  orgId: string;
}

const online = new Map<string, Entry>(); // deviceId -> entry

export async function deviceConnected(deviceId: string, orgId: string, ws: WebSocket): Promise<void> {
  online.get(deviceId)?.ws.close(4000, 'replaced'); // one live connection per device
  online.set(deviceId, { ws, orgId });
  await q(`UPDATE devices SET state = 'online', last_seen_at = now() WHERE id = $1`, [deviceId]);
}

export async function deviceHeartbeat(deviceId: string, agentVersion?: string): Promise<void> {
  await q(`UPDATE devices SET last_seen_at = now(), agent_version = COALESCE($2, agent_version) WHERE id = $1`, [
    deviceId,
    agentVersion ?? null,
  ]);
}

export async function deviceDisconnected(deviceId: string, ws: WebSocket): Promise<void> {
  if (online.get(deviceId)?.ws !== ws) return; // superseded by a newer connection
  online.delete(deviceId);
  await q(`UPDATE devices SET state = 'offline', last_seen_at = now() WHERE id = $1`, [deviceId]);
}

export function pushToDevice(deviceId: string, msg: unknown): boolean {
  const e = online.get(deviceId);
  if (!e || e.ws.readyState !== e.ws.OPEN) return false;
  e.ws.send(JSON.stringify(msg));
  return true;
}

export const isOnline = (deviceId: string): boolean => online.has(deviceId);
