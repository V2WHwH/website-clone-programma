// /api/v1 invites, guest join and sessions (M4). Invite links are time-limited, revocable,
// single-use or reusable, optionally password-protected (SECURITY.md §6). Sessions mint
// room-scoped LiveKit tokens; the control plane is the only minter.
import { Router } from 'express';
import { one, q } from './db.js';
import { env } from './env.js';
import {
  audit,
  hashPassword,
  randomToken,
  requireUser,
  requireUserOrGuest,
  sha256,
  signClaims,
  verifyPassword,
  type AuthedRequest,
  type GuestClaims,
} from './auth.js';
import { mintRoomToken, roomForSession } from './livekit.js';
import { isOnline, pushToDevice } from './presence.js';

export const sessionsRouter = Router();

interface InviteRow {
  id: string;
  org_id: string;
  device_ids: string[];
  expires_at: string;
  max_uses: number | null;
  uses: number;
  password_hash: string | null;
  revoked_at: string | null;
}

async function activeInvite(rawToken: string): Promise<InviteRow | undefined> {
  const inv = await one<InviteRow>('SELECT * FROM invite_links WHERE token_hash = $1', [sha256(rawToken)]);
  if (!inv) return undefined;
  if (inv.revoked_at || new Date(inv.expires_at) < new Date()) return undefined;
  if (inv.max_uses !== null && inv.uses >= inv.max_uses) return undefined;
  return inv;
}

sessionsRouter.post('/invites', requireUser('presenter'), async (req: AuthedRequest, res) => {
  const deviceIds: string[] = Array.isArray(req.body?.deviceIds) ? req.body.deviceIds : [];
  const ttlHours = Math.min(Math.max(Number(req.body?.ttlHours ?? 24), 1), 168);
  const maxUses = req.body?.maxUses === null || req.body?.maxUses === undefined ? 1 : Number(req.body.maxUses);
  const password = typeof req.body?.password === 'string' && req.body.password.length > 0 ? req.body.password : undefined;
  if (deviceIds.length === 0) {
    res.status(400).json({ error: 'deviceIds required' });
    return;
  }
  const owned = await q('SELECT id FROM devices WHERE org_id = $1 AND id = ANY($2::uuid[])', [req.user!.org, deviceIds]);
  if (owned.rowCount !== deviceIds.length) {
    res.status(404).json({ error: 'one or more devices not found in your organisation' });
    return;
  }
  const raw = randomToken(16);
  const inv = await one<{ id: string; expires_at: string }>(
    `INSERT INTO invite_links (org_id, token_hash, created_by, device_ids, expires_at, max_uses, password_hash)
     VALUES ($1,$2,$3,$4, now() + ($5 || ' hours')::interval, $6, $7) RETURNING id, expires_at`,
    [
      req.user!.org,
      sha256(raw),
      req.user!.sub,
      deviceIds,
      String(ttlHours),
      Number.isFinite(maxUses) && maxUses > 0 ? maxUses : null,
      password ? await hashPassword(password) : null,
    ],
  );
  await audit(req.user!.org, `user:${req.user!.sub}`, 'invite.created', inv!.id, { deviceIds, ttlHours });
  res.status(201).json({
    id: inv!.id,
    token: raw, // returned exactly once; only the hash is stored
    path: `/join.html?t=${raw}`,
    expiresAt: inv!.expires_at,
    maxUses: Number.isFinite(maxUses) && maxUses > 0 ? maxUses : null,
  });
});

sessionsRouter.get('/invites', requireUser('presenter'), async (req: AuthedRequest, res) => {
  const r = await q<InviteRow & { created_at: string }>(
    'SELECT * FROM invite_links WHERE org_id = $1 ORDER BY created_at DESC LIMIT 100',
    [req.user!.org],
  );
  res.json({
    invites: r.rows.map((i) => ({
      id: i.id,
      deviceIds: i.device_ids,
      expiresAt: i.expires_at,
      maxUses: i.max_uses,
      uses: i.uses,
      passwordProtected: !!i.password_hash,
      status: i.revoked_at
        ? 'revoked'
        : new Date(i.expires_at) < new Date()
          ? 'expired'
          : i.max_uses !== null && i.uses >= i.max_uses
            ? 'exhausted'
            : 'active',
    })),
  });
});

sessionsRouter.post('/invites/:id/revoke', requireUser('presenter'), async (req: AuthedRequest, res) => {
  const r = await one<{ id: string }>(
    'UPDATE invite_links SET revoked_at = now() WHERE id = $1 AND org_id = $2 AND revoked_at IS NULL RETURNING id',
    [req.params.id, req.user!.org],
  );
  if (!r) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  await audit(req.user!.org, `user:${req.user!.sub}`, 'invite.revoked', r.id);
  res.json({ ok: true });
});

// Guest landing data — destination visible BEFORE any camera permission (design principle 1).
sessionsRouter.post('/join/preview', async (req, res) => {
  const inv = typeof req.body?.token === 'string' ? await activeInvite(req.body.token) : undefined;
  if (!inv) {
    res.status(404).json({ error: 'invite is invalid, expired or revoked' });
    return;
  }
  const org = await one<{ name: string }>('SELECT name FROM organizations WHERE id = $1', [inv.org_id]);
  const devs = await q<{ id: string; name: string; kind: string; state: string }>(
    'SELECT id, name, kind, state FROM devices WHERE id = ANY($1::uuid[])',
    [inv.device_ids],
  );
  res.json({
    orgName: org?.name ?? '',
    passwordRequired: !!inv.password_hash,
    expiresAt: inv.expires_at,
    destinations: devs.rows.map((d) => ({ ...d, state: isOnline(d.id) ? 'online' : 'offline' })),
  });
});

sessionsRouter.post('/join', async (req, res) => {
  const name = typeof req.body?.name === 'string' && req.body.name.trim() ? req.body.name.trim().slice(0, 80) : undefined;
  const inv = typeof req.body?.token === 'string' ? await activeInvite(req.body.token) : undefined;
  if (!inv || !name) {
    res.status(inv ? 400 : 404).json({ error: inv ? 'name required' : 'invite is invalid, expired or revoked' });
    return;
  }
  if (inv.password_hash) {
    const ok = typeof req.body?.password === 'string' && (await verifyPassword(inv.password_hash, req.body.password));
    if (!ok) {
      res.status(401).json({ error: 'password required or incorrect' });
      return;
    }
  }
  await q('UPDATE invite_links SET uses = uses + 1 WHERE id = $1', [inv.id]);
  const access = await signClaims(
    { org: inv.org_id, invite: inv.id, devices: inv.device_ids, name, kind: 'guest' } satisfies GuestClaims,
    '2h',
  );
  await audit(inv.org_id, `guest:${name}`, 'invite.used', inv.id);
  res.json({ access, deviceIds: inv.device_ids });
});

// ——— Sessions ———
sessionsRouter.post('/sessions', requireUserOrGuest('presenter'), async (req: AuthedRequest, res) => {
  const deviceIds: string[] = Array.isArray(req.body?.deviceIds) ? req.body.deviceIds : [];
  if (deviceIds.length === 0) {
    res.status(400).json({ error: 'deviceIds required' });
    return;
  }
  const orgId = req.user?.org ?? req.guest!.org;
  if (req.guest && !deviceIds.every((d) => req.guest!.devices.includes(d))) {
    res.status(403).json({ error: 'device not covered by this invite' });
    return;
  }
  const owned = await q<{ id: string; name: string }>(
    'SELECT id, name FROM devices WHERE org_id = $1 AND id = ANY($2::uuid[])',
    [orgId, deviceIds],
  );
  if (owned.rowCount !== deviceIds.length) {
    res.status(404).json({ error: 'one or more devices not found' });
    return;
  }
  const presenterName = req.user?.name ?? req.guest!.name;
  const s = await one<{ id: string }>(
    `INSERT INTO sessions (org_id, presenter_kind, presenter_user_id, presenter_name, invite_id)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [orgId, req.user ? 'user' : 'guest', req.user?.sub ?? null, presenterName, req.guest?.invite ?? null],
  );
  for (const d of deviceIds) {
    await q('INSERT INTO session_destinations (session_id, device_id) VALUES ($1,$2)', [s!.id, d]);
  }
  const room = roomForSession(s!.id);
  const publisherToken = await mintRoomToken({
    room,
    identity: `presenter-${s!.id}`,
    name: presenterName,
    canPublish: true,
    canSubscribe: true, // return feed comes back through the same room
  });
  let devicesNotified = 0;
  for (const d of deviceIds) {
    const deviceToken = await mintRoomToken({
      room,
      identity: `device-${d}`,
      name: owned.rows.find((r) => r.id === d)?.name ?? 'device',
      canPublish: true, // return feed
      canSubscribe: true,
    });
    if (pushToDevice(d, { t: 'session-start', sessionId: s!.id, room, token: deviceToken, url: env.livekit.url })) {
      devicesNotified += 1;
    }
  }
  await audit(orgId, req.user ? `user:${req.user.sub}` : `guest:${presenterName}`, 'session.started', s!.id, {
    deviceIds,
    devicesNotified,
  });
  res.status(201).json({ sessionId: s!.id, room, livekitUrl: env.livekit.url, token: publisherToken, devicesNotified });
});

async function ownsSession(req: AuthedRequest, sessionId: string) {
  return one<{ id: string; org_id: string; state: string }>(
    req.user
      ? `SELECT id, org_id, state FROM sessions WHERE id = $1 AND org_id = $2`
      : `SELECT id, org_id, state FROM sessions WHERE id = $1 AND invite_id = $2`,
    [sessionId, req.user ? req.user.org : req.guest!.invite],
  );
}

sessionsRouter.post('/sessions/:id/state', requireUserOrGuest('presenter'), async (req: AuthedRequest, res) => {
  const s = await ownsSession(req, req.params.id ?? '');
  if (!s) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  if (req.body?.state === 'live' && s.state === 'connecting') {
    await q(`UPDATE sessions SET state = 'live' WHERE id = $1`, [s.id]);
  }
  res.json({ ok: true });
});

sessionsRouter.post('/sessions/:id/stop', requireUserOrGuest('presenter'), async (req: AuthedRequest, res) => {
  const s = await ownsSession(req, req.params.id ?? '');
  if (!s) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  const stats = typeof req.body?.stats === 'object' && req.body.stats ? req.body.stats : {};
  await q(`UPDATE sessions SET state = 'ended', ended_at = now(), stats = $2 WHERE id = $1`, [
    s.id,
    JSON.stringify(stats),
  ]);
  const dest = await q<{ device_id: string }>('SELECT device_id FROM session_destinations WHERE session_id = $1', [s.id]);
  for (const d of dest.rows) pushToDevice(d.device_id, { t: 'session-stop', sessionId: s.id });
  await audit(s.org_id, req.user ? `user:${req.user.sub}` : `guest:${req.guest!.name}`, 'session.stopped', s.id, stats);
  res.json({ ok: true });
});

sessionsRouter.get('/sessions', requireUser('viewer'), async (req: AuthedRequest, res) => {
  const r = await q(
    `SELECT s.id, s.presenter_kind, s.presenter_name, s.state, s.started_at, s.ended_at, s.stats,
            array_agg(d.name) AS destinations
     FROM sessions s
     LEFT JOIN session_destinations sd ON sd.session_id = s.id
     LEFT JOIN devices d ON d.id = sd.device_id
     WHERE s.org_id = $1
     GROUP BY s.id ORDER BY s.started_at DESC LIMIT 50`,
    [req.user!.org],
  );
  res.json({ sessions: r.rows });
});
