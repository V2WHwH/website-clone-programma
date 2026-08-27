// /api/v1 devices & pairing (SECURITY.md §3): receiver generates a keypair, requests a code
// bound to its public key; an admin claims the code, creating the device; the device then
// authenticates by signing a nonce with the paired key. No copyable secrets in any config file.
import { Router } from 'express';
import crypto from 'node:crypto';
import { one, q } from './db.js';
import { audit, requireUser, signClaims, type AuthedRequest, type DeviceClaims, sha256 } from './auth.js';
import { isOnline } from './presence.js';

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
    `SELECT d.id, d.name, d.kind, d.state, d.last_seen_at, l.name AS location
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
