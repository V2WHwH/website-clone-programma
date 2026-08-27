// /api/v1 devices & pairing (SECURITY.md §3): receiver generates a keypair, requests a code
// bound to its public key; an admin claims the code, creating the device; the device then
// authenticates by signing a nonce with the paired key. No copyable secrets in any config file.
import { Router } from 'express';
import crypto from 'node:crypto';
import { one, q } from './db.js';
import {
  audit,
  requireDevice,
  requireUser,
  signClaims,
  type AuthedRequest,
  type DeviceClaims,
  type DeviceRequest,
  sha256,
} from './auth.js';
import { isOnline, logDeviceEvent, pushToDevice } from './presence.js';

export const devicesRouter = Router();

// Unambiguous alphabet: no 0/O, 1/I/L (SECURITY.md §3).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const genCode = (): string =>
  Array.from(crypto.randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join('');

// Minimal per-IP rate limit for the unauthenticated pairing endpoint.
const bucket = new Map<string, { n: number; reset: number }>();
function limited(ip: string, max = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const b = bucket.get(ip);
  if (!b || b.reset < now) {
    bucket.set(ip, { n: 1, reset: now + windowMs });
    return false;
  }
  b.n += 1;
  return b.n > max;
}

const validJwk = (v: unknown): v is Record<string, string> => {
  const j = v as Record<string, unknown> | undefined;
  return !!j && j.kty === 'EC' && j.crv === 'P-256' && typeof j.x === 'string' && typeof j.y === 'string';
};

devicesRouter.post('/pairing/start', async (req, res) => {
  if (limited(req.ip ?? '?')) {
    res.status(429).json({ error: 'too many requests' });
    return;
  }
  if (!validJwk(req.body?.publicKeyJwk)) {
    res.status(400).json({ error: 'publicKeyJwk (EC P-256) required' });
    return;
  }
  const code = genCode();
  await q('INSERT INTO pairing_codes (code_hash, public_key_jwk, expires_at) VALUES ($1, $2, now() + interval \'10 minutes\')', [
    sha256(code),
    JSON.stringify(req.body.publicKeyJwk),
  ]);
  res.status(201).json({ code, expiresInSeconds: 600 });
});

devicesRouter.post('/devices/claim', requireUser('admin'), async (req: AuthedRequest, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const kind = ['holobox', 'holomini', 'holowall'].includes(req.body?.kind) ? (req.body.kind as string) : undefined;
  if (!code || !name || !kind) {
    res.status(400).json({ error: 'code, name and kind (holobox|holomini|holowall) required' });
    return;
  }
  const pairing = await one<{ id: string; public_key_jwk: unknown }>(
    `UPDATE pairing_codes SET used_at = now()
     WHERE code_hash = $1 AND used_at IS NULL AND expires_at > now()
     RETURNING id, public_key_jwk`,
    [sha256(code)],
  );
  if (!pairing) {
    res.status(404).json({ error: 'unknown, expired or already used code' });
    return;
  }
  let locationId: string | null = null;
  const locationName = typeof req.body?.locationName === 'string' ? req.body.locationName.trim() : '';
  if (locationName) {
    const loc =
      (await one<{ id: string }>('SELECT id FROM locations WHERE org_id = $1 AND name = $2', [
        req.user!.org,
        locationName,
      ])) ??
      (await one<{ id: string }>('INSERT INTO locations (org_id, name) VALUES ($1,$2) RETURNING id', [
        req.user!.org,
        locationName,
      ]));
    locationId = loc!.id;
  }
  const device = await one<{ id: string; name: string; kind: string; state: string }>(
    `INSERT INTO devices (org_id, location_id, name, kind, public_key_jwk)
     VALUES ($1,$2,$3,$4,$5) RETURNING id, name, kind, state`,
    [req.user!.org, locationId, name, kind, JSON.stringify(pairing.public_key_jwk)],
  );
  await q('UPDATE pairing_codes SET device_id = $2 WHERE id = $1', [pairing.id, device!.id]);
  await audit(req.user!.org, `user:${req.user!.sub}`, 'device.paired', device!.id, { name, kind });
  res.status(201).json({ device: device! });
});

// The waiting receiver polls with its own code to learn its device id once an admin claims it.
devicesRouter.post('/pairing/poll', async (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
  const row = code
    ? await one<{ device_id: string | null; used_at: string | null }>(
        'SELECT device_id, used_at FROM pairing_codes WHERE code_hash = $1',
        [sha256(code)],
      )
    : undefined;
  if (!row) {
    res.status(404).json({ error: 'unknown code' });
    return;
  }
  res.json({ claimed: !!row.used_at && !!row.device_id, deviceId: row.device_id });
});

devicesRouter.get('/devices', requireUser('viewer'), async (req: AuthedRequest, res) => {
  const r = await q<{ id: string; name: string; kind: string; state: string; last_seen_at: string | null }>(
    `SELECT d.id, d.name, d.kind, d.state, d.last_seen_at, d.caps, d.health, d.health_at,
            d.agent_version, l.name AS location
     FROM devices d LEFT JOIN locations l ON l.id = d.location_id
     WHERE d.org_id = $1 ORDER BY d.created_at`,
    [req.user!.org],
  );
  res.json({
    devices: r.rows.map((d) => ({ ...d, state: isOnline(d.id) ? 'online' : d.state === 'online' ? 'offline' : d.state })),
  });
});

// ——— Device authentication: nonce challenge signed with the paired key ———
const nonces = new Map<string, { deviceId: string; exp: number }>();

devicesRouter.post('/devices/:id/auth/nonce', async (req, res) => {
  const nonce = crypto.randomBytes(24).toString('base64url');
  nonces.set(nonce, { deviceId: req.params.id, exp: Date.now() + 60_000 });
  res.json({ nonce });
});

devicesRouter.post('/devices/:id/auth', async (req, res) => {
  const nonce = typeof req.body?.nonce === 'string' ? req.body.nonce : '';
  const sig = typeof req.body?.signature === 'string' ? req.body.signature : '';
  const entry = nonces.get(nonce);
  nonces.delete(nonce);
  if (!entry || entry.deviceId !== req.params.id || entry.exp < Date.now()) {
    res.status(401).json({ error: 'invalid nonce' });
    return;
  }
  const device = await one<{ id: string; org_id: string; public_key_jwk: Record<string, string> }>(
    'SELECT id, org_id, public_key_jwk FROM devices WHERE id = $1',
    [req.params.id],
  );
  if (!device) {
    res.status(404).json({ error: 'unknown device' });
    return;
  }
  let ok = false;
  try {
    const key = crypto.createPublicKey({ key: device.public_key_jwk, format: 'jwk' });
    ok = crypto.verify(
      'sha256',
      Buffer.from(nonce),
      { key, dsaEncoding: 'ieee-p1363' }, // WebCrypto ECDSA emits raw r||s
      Buffer.from(sig, 'base64url'),
    );
  } catch {
    ok = false;
  }
  if (!ok) {
    res.status(401).json({ error: 'bad signature' });
    return;
  }
  const token = await signClaims({ device: device.id, org: device.org_id, kind: 'device' } satisfies DeviceClaims, '15m');
  res.json({ token, expiresInSeconds: 900 });
});

// ——— M5: structured device events (fallback shown, recovered, playing, boot, log) ———
const EVENT_TYPES = new Set(['boot', 'session_playing', 'fallback_shown', 'recovered', 'log', 'action_result']);

devicesRouter.post('/devices/events', requireDevice(), async (req: DeviceRequest, res) => {
  const type = typeof req.body?.type === 'string' ? req.body.type : '';
  if (!EVENT_TYPES.has(type)) {
    res.status(400).json({ error: `type must be one of ${[...EVENT_TYPES].join(', ')}` });
    return;
  }
  const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId : null;
  const meta = typeof req.body?.meta === 'object' && req.body.meta ? req.body.meta : {};
  await logDeviceEvent(req.deviceClaims!.device, req.deviceClaims!.org, type, sessionId, meta);
  res.status(201).json({ ok: true });
});

// M6: the receiver reports what it can actually decode (MediaCapabilities) + its screen.
// Session starts use this to cap the sender's ladder — capability negotiation, not assumption.
// M7: host health measured by the watchdog agent (load, memory, disk, temperature where
// the host exposes one, uptime) — the browser cannot measure these; the agent can, honestly.
devicesRouter.post('/devices/health', requireDevice(), async (req: DeviceRequest, res) => {
  const health = typeof req.body?.health === 'object' && req.body.health ? req.body.health : undefined;
  if (!health) {
    res.status(400).json({ error: 'health object required' });
    return;
  }
  await q('UPDATE devices SET health = $2, health_at = now() WHERE id = $1', [
    req.deviceClaims!.device,
    JSON.stringify(health),
  ]);
  res.json({ ok: true });
});

// M7: remote actions — pushed over the device's presence socket, executed on the device
// (or its watchdog for host-level actions), result posted back as an action_result event.
const ACTIONS = new Set(['reload', 'clear_cache', 'send_logs', 'net_test', 'restart_browser', 'reboot_host']);

devicesRouter.post('/devices/:id/actions', requireUser('operator'), async (req: AuthedRequest, res) => {
  const action = typeof req.body?.action === 'string' ? req.body.action : '';
  if (!ACTIONS.has(action)) {
    res.status(400).json({ error: `action must be one of ${[...ACTIONS].join(', ')}` });
    return;
  }
  const dev = await one<{ id: string }>('SELECT id FROM devices WHERE id = $1 AND org_id = $2', [
    req.params.id,
    req.user!.org,
  ]);
  if (!dev) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  const actionId = crypto.randomUUID();
  if (!pushToDevice(dev.id, { t: 'action', action, actionId })) {
    res.status(409).json({ error: 'device is offline — actions need a live connection' });
    return;
  }
  await audit(req.user!.org, `user:${req.user!.sub}`, 'device.action', dev.id, { action, actionId });
  res.status(202).json({ actionId });
});

devicesRouter.post('/devices/caps', requireDevice(), async (req: DeviceRequest, res) => {
  const caps = typeof req.body?.caps === 'object' && req.body.caps ? req.body.caps : undefined;
  if (!caps) {
    res.status(400).json({ error: 'caps object required' });
    return;
  }
  await q('UPDATE devices SET caps = $2 WHERE id = $1', [req.deviceClaims!.device, JSON.stringify(caps)]);
  res.json({ ok: true });
});

devicesRouter.get('/devices/:id/events', requireUser('operator'), async (req: AuthedRequest, res) => {
  const r = await q(
    `SELECT type, session_id, at, meta FROM device_events
     WHERE device_id = $1 AND org_id = $2 ORDER BY at DESC LIMIT 200`,
    [req.params.id, req.user!.org],
  );
  res.json({ events: r.rows });
});
