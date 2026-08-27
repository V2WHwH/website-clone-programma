// /api/v1 fleet operations (M7): alerts, the audit trail, and the dashboard summary.
// Everything is org-scoped; operators run the fleet, viewers may look at the summary.
import { Router } from 'express';
import { one, q } from './db.js';
import { audit, requireUser, type AuthedRequest } from './auth.js';
import { isOnline } from './presence.js';

export const fleetRouter = Router();

fleetRouter.get('/alerts', requireUser('operator'), async (req: AuthedRequest, res) => {
  const all = req.query.all === '1';
  const r = await q(
    `SELECT a.id, a.device_id, d.name AS device_name, a.kind, a.message,
            a.raised_at, a.resolved_at, a.resolve_note
     FROM alerts a LEFT JOIN devices d ON d.id = a.device_id
     WHERE a.org_id = $1 ${all ? '' : 'AND a.resolved_at IS NULL'}
     ORDER BY a.raised_at DESC LIMIT 100`,
    [req.user!.org],
  );
  res.json({ alerts: r.rows });
});

fleetRouter.post('/alerts/:id/resolve', requireUser('operator'), async (req: AuthedRequest, res) => {
  const note = typeof req.body?.note === 'string' ? req.body.note.slice(0, 300) : 'resolved by operator';
  const r = await one<{ id: string }>(
    `UPDATE alerts SET resolved_at = now(), resolve_note = $3
     WHERE id = $1 AND org_id = $2 AND resolved_at IS NULL RETURNING id`,
    [req.params.id, req.user!.org, note],
  );
  if (!r) {
    res.status(404).json({ error: 'not found or already resolved' });
    return;
  }
  await audit(req.user!.org, `user:${req.user!.sub}`, 'alert.resolved', r.id, { note });
  res.json({ ok: true });
});

fleetRouter.get('/audit', requireUser('operator'), async (req: AuthedRequest, res) => {
  const r = await q(
    'SELECT actor, action, target, meta, at FROM audit_entries WHERE org_id = $1 ORDER BY at DESC LIMIT 200',
    [req.user!.org],
  );
  res.json({ entries: r.rows });
});

fleetRouter.get('/fleet/summary', requireUser('viewer'), async (req: AuthedRequest, res) => {
  const org = req.user!.org;
  const devices = await q<{ id: string; state: string }>('SELECT id, state FROM devices WHERE org_id = $1', [org]);
  const openAlerts = await one<{ n: string }>('SELECT count(*) AS n FROM alerts WHERE org_id = $1 AND resolved_at IS NULL', [org]);
  const live = await one<{ n: string }>(`SELECT count(*) AS n FROM sessions WHERE org_id = $1 AND state IN ('connecting','live')`, [org]);
  const day = await one<{ n: string; secs: string | null; egress: string | null }>(
    `SELECT count(*) AS n,
            COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(ended_at, now()) - started_at))), 0) AS secs,
            COALESCE(SUM(egress_bytes), 0) AS egress
     FROM sessions WHERE org_id = $1 AND started_at > now() - interval '24 hours'`,
    [org],
  );
  res.json({
    devices: { total: devices.rowCount ?? 0, online: devices.rows.filter((d) => isOnline(d.id)).length },
    openAlerts: Number(openAlerts?.n ?? 0),
    liveSessions: Number(live?.n ?? 0),
    last24h: {
      sessions: Number(day?.n ?? 0),
      // media-server time: summed wall-clock session time — the honest cost driver
      mediaMinutes: Math.round(Number(day?.secs ?? 0) / 60),
      egressBytes: Number(day?.egress ?? 0),
    },
  });
});
