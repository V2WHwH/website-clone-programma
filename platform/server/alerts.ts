// M7 alert engine — server-raised, auto-resolving facts about devices. An alert is a
// condition the platform MEASURED (offline too long, disk low, glass stuck on fallback);
// it resolves itself the moment the condition is measured healthy again, with a note.
// Operators can also resolve manually (api-fleet).
import { one, q } from './db.js';

const SWEEP_MS = Number(process.env.ALERT_SWEEP_MS ?? 10_000);
const OFFLINE_AFTER_S = Number(process.env.ALERT_OFFLINE_AFTER_S ?? 45);
const FALLBACK_AFTER_S = Number(process.env.ALERT_FALLBACK_AFTER_S ?? 60);
const DISK_LOW_PCT = Number(process.env.ALERT_DISK_LOW_PCT ?? 10);

async function raise(orgId: string, deviceId: string, kind: string, message: string): Promise<void> {
  const open = await one<{ id: string }>(
    'SELECT id FROM alerts WHERE device_id = $1 AND kind = $2 AND resolved_at IS NULL',
    [deviceId, kind],
  );
  if (open) return;
  await q('INSERT INTO alerts (org_id, device_id, kind, message) VALUES ($1,$2,$3,$4)', [orgId, deviceId, kind, message]);
  console.log(JSON.stringify({ src: 'alert', kind, deviceId, message }));
}

async function autoResolve(deviceId: string, kind: string, note: string): Promise<void> {
  const r = await q(
    'UPDATE alerts SET resolved_at = now(), resolve_note = $3 WHERE device_id = $1 AND kind = $2 AND resolved_at IS NULL',
    [deviceId, kind, note],
  );
  if (r.rowCount) console.log(JSON.stringify({ src: 'alert', kind, deviceId, resolved: note }));
}

async function sweep(): Promise<void> {
  // 1. offline too long — the fleet view must never quietly show a dead device as fine.
  const offline = await q<{ id: string; org_id: string; name: string }>(
    `SELECT id, org_id, name FROM devices
     WHERE state = 'offline' AND last_seen_at < now() - ($1 || ' seconds')::interval`,
    [String(OFFLINE_AFTER_S)],
  );
  for (const d of offline.rows) {
    await raise(d.org_id, d.id, 'offline', `${d.name} has been offline for over ${OFFLINE_AFTER_S}s`);
  }
  const online = await q<{ id: string }>(`SELECT id FROM devices WHERE state = 'online'`);
  for (const d of online.rows) await autoResolve(d.id, 'offline', 'device is back online');

  // 2. disk low — measured by the watchdog agent on the host.
  const disks = await q<{ id: string; org_id: string; name: string; pct: string | null }>(
    `SELECT id, org_id, name, health->'disk'->>'freePct' AS pct FROM devices WHERE health IS NOT NULL`,
  );
  for (const d of disks.rows) {
    const pct = Number(d.pct);
    if (!Number.isFinite(pct)) continue;
    if (pct < DISK_LOW_PCT) await raise(d.org_id, d.id, 'disk_low', `${d.name} has ${pct}% disk free`);
    else if (pct >= DISK_LOW_PCT + 5) await autoResolve(d.id, 'disk_low', `disk back at ${pct}% free`);
  }

  // 3. stuck on fallback — the glass shows the brand screen but playback never recovered.
  const last = await q<{ device_id: string; org_id: string; type: string; age_s: string }>(
    `SELECT DISTINCT ON (device_id) device_id, org_id, type,
            EXTRACT(EPOCH FROM (now() - at)) AS age_s
     FROM device_events
     WHERE type IN ('fallback_shown', 'recovered', 'boot', 'session_playing')
     ORDER BY device_id, at DESC`,
  );
  for (const r of last.rows) {
    if (r.type === 'fallback_shown' && Number(r.age_s) > FALLBACK_AFTER_S) {
      await raise(r.org_id, r.device_id, 'stuck_fallback', `glass stuck on fallback for over ${FALLBACK_AFTER_S}s`);
    } else if (r.type !== 'fallback_shown') {
      await autoResolve(r.device_id, 'stuck_fallback', `playback recovered (${r.type})`);
    }
  }
}

let running: NodeJS.Timeout | undefined;

export function startAlertEngine(): void {
  if (running) return;
  running = setInterval(() => void sweep().catch((e) => console.error('alert sweep failed:', e)), SWEEP_MS);
  running.unref();
}
