// Device presence over one persistent WebSocket per online device (ADR-004).
// Online/offline is WS liveness, backed by a stale-heartbeat sweep (M5): a half-open socket
// that stops heartbeating is forced offline — the dashboard never shows a zombie as ONLINE.
import type { WebSocket } from 'ws';
import { q } from './db.js';

interface Entry {
  ws: WebSocket;
  orgId: string;
}

const online = new Map<string, Entry>(); // deviceId -> entry

export async function logDeviceEvent(
  deviceId: string,
  orgId: string,
  type: string,
  sessionId?: string | null,
  meta: Record<string, unknown> = {},
): Promise<void> {
  await q('INSERT INTO device_events (device_id, org_id, type, session_id, meta) VALUES ($1,$2,$3,$4,$5)', [
    deviceId,
    orgId,
    type,
    sessionId ?? null,
    JSON.stringify(meta),
  ]);
  console.log(JSON.stringify({ src: 'device', deviceId, type, sessionId: sessionId ?? undefined, ...meta }));
}

export async function deviceConnected(deviceId: string, orgId: string, ws: WebSocket): Promise<void> {
  online.get(deviceId)?.ws.close(4000, 'replaced'); // one live connection per device
  online.set(deviceId, { ws, orgId });
  await q(`UPDATE devices SET state = 'online', last_seen_at = now() WHERE id = $1`, [deviceId]);
  await logDeviceEvent(deviceId, orgId, 'online');
}

export async function deviceHeartbeat(deviceId: string, agentVersion?: string): Promise<void> {
  await q(`UPDATE devices SET last_seen_at = now(), agent_version = COALESCE($2, agent_version) WHERE id = $1`, [
    deviceId,
    agentVersion ?? null,
  ]);
}

export async function deviceDisconnected(deviceId: string, ws: WebSocket): Promise<void> {
  const e = online.get(deviceId);
  if (e?.ws !== ws) return; // superseded by a newer connection
  online.delete(deviceId);
  await q(`UPDATE devices SET state = 'offline', last_seen_at = now() WHERE id = $1`, [deviceId]);
  await logDeviceEvent(deviceId, e.orgId, 'offline');
}

export function pushToDevice(deviceId: string, msg: unknown): boolean {
  const e = online.get(deviceId);
  if (!e || e.ws.readyState !== e.ws.OPEN) return false;
  e.ws.send(JSON.stringify(msg));
  return true;
}

export const isOnline = (deviceId: string): boolean => online.has(deviceId);

// ——— stale-heartbeat sweep (M5) ———
const STALE_SECONDS = 25; // two missed 10 s heartbeats + margin
let sweeping: NodeJS.Timeout | undefined;

export function startPresenceSweep(): void {
  if (sweeping) return;
  sweeping = setInterval(() => void sweep(), 5000);
  sweeping.unref();
}

async function sweep(): Promise<void> {
  const stale = await q<{ id: string; org_id: string }>(
    `UPDATE devices SET state = 'offline'
     WHERE state = 'online' AND last_seen_at < now() - ($1 || ' seconds')::interval
     RETURNING id, org_id`,
    [String(STALE_SECONDS)],
  );
  for (const row of stale.rows) {
    const e = online.get(row.id);
    online.delete(row.id);
    e?.ws.close(4001, 'stale');
    await logDeviceEvent(row.id, row.org_id, 'offline', null, { reason: 'heartbeat_timeout' });
  }
}
