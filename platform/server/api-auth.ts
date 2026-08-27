// /api/v1/auth — register (bootstrap), login, refresh (rotating), logout, me.
import { Router } from 'express';
import crypto from 'node:crypto';
import { one } from './db.js';
import { env } from './env.js';
import {
  audit,
  hashPassword,
  issueRefresh,
  requireUser,
  rotateRefresh,
  signClaims,
  verifyPassword,
  type AuthedRequest,
  ACCESS_TTL,
} from './auth.js';

export const authRouter = Router();

const str = (v: unknown, max = 200): string | undefined =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max ? v.trim() : undefined;

const COOKIE = 'hw_refresh';
const cookiePath = '/api/v1/auth';

function setRefreshCookie(res: import('express').Response, raw: string): void {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${raw}; HttpOnly; Path=${cookiePath}; Max-Age=${30 * 86400}; SameSite=Lax${env.prod ? '; Secure' : ''}`,
  );
}
function readRefreshCookie(req: AuthedRequest): string | undefined {
  const m = (req.headers.cookie ?? '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return m?.[1];
}

async function loginPayload(user: { id: string; email: string; display_name: string }) {
  const mem = await one<{ org_id: string; role: string; name: string }>(
    `SELECT m.org_id, m.role, o.name FROM org_memberships m JOIN organizations o ON o.id = m.org_id
     WHERE m.user_id = $1 ORDER BY m.role = 'owner' DESC LIMIT 1`,
    [user.id],
  );
  if (!mem) return undefined;
  const access = await signClaims(
    { sub: user.id, org: mem.org_id, role: mem.role, name: user.display_name, kind: 'user' },
    ACCESS_TTL,
  );
  return {
    access,
    user: { id: user.id, email: user.email, name: user.display_name },
    org: { id: mem.org_id, name: mem.name, role: mem.role },
  };
}

authRouter.post('/register', async (req, res) => {
  const orgName = str(req.body?.orgName, 120);
  const email = str(req.body?.email, 254)?.toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : undefined;
  const displayName = str(req.body?.displayName, 120);
  if (!orgName || !email || !displayName || !password || password.length < 10) {
    res.status(400).json({ error: 'orgName, email, displayName and a password of at least 10 characters are required' });
    return;
  }
  const existing = await one('SELECT 1 FROM users WHERE email = $1', [email]);
  if (existing) {
    res.status(409).json({ error: 'email already registered' });
    return;
  }
  const slug = `${orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40)}-${crypto
    .randomBytes(2)
    .toString('hex')}`;
  const org = await one<{ id: string }>('INSERT INTO organizations (name, slug) VALUES ($1,$2) RETURNING id', [
    orgName,
    slug,
  ]);
  const user = await one<{ id: string; email: string; display_name: string }>(
    'INSERT INTO users (email, password_hash, display_name) VALUES ($1,$2,$3) RETURNING id, email, display_name',
    [email, await hashPassword(password), displayName],
  );
  await one('INSERT INTO org_memberships (org_id, user_id, role) VALUES ($1,$2,$3) RETURNING org_id', [
    org!.id,
    user!.id,
    'owner',
  ]);
  await audit(org!.id, `user:${user!.id}`, 'org.created', org!.id, { email });
  const payload = await loginPayload(user!);
  setRefreshCookie(res, await issueRefresh(user!.id));
  res.status(201).json(payload);
});

authRouter.post('/login', async (req, res) => {
  const email = str(req.body?.email, 254)?.toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const user = email
    ? await one<{ id: string; email: string; display_name: string; password_hash: string }>(
        'SELECT id, email, display_name, password_hash FROM users WHERE email = $1',
        [email],
      )
    : undefined;
  const ok = user ? await verifyPassword(user.password_hash, password) : false;
  if (!user || !ok) {
    res.status(401).json({ error: 'invalid credentials' });
    return;
  }
  const payload = await loginPayload(user);
  if (!payload) {
    res.status(403).json({ error: 'no organisation membership' });
    return;
  }
  await audit(payload.org.id, `user:${user.id}`, 'auth.login');
  setRefreshCookie(res, await issueRefresh(user.id));
  res.json(payload);
});

authRouter.post('/refresh', async (req: AuthedRequest, res) => {
  const raw = readRefreshCookie(req);
  const rotated = raw ? await rotateRefresh(raw) : undefined;
  if (!rotated) {
    res.status(401).json({ error: 'invalid refresh token' });
    return;
  }
  const user = await one<{ id: string; email: string; display_name: string }>(
    'SELECT id, email, display_name FROM users WHERE id = $1',
    [rotated.userId],
  );
  const payload = user ? await loginPayload(user) : undefined;
  if (!payload) {
    res.status(401).json({ error: 'unknown user' });
    return;
  }
  setRefreshCookie(res, rotated.next);
  res.json(payload);
});

authRouter.post('/logout', async (req: AuthedRequest, res) => {
  const raw = readRefreshCookie(req);
  if (raw) await rotateRefresh(raw); // revokes; the newly minted replacement is discarded
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Path=${cookiePath}; Max-Age=0`);
  res.json({ ok: true });
});

authRouter.get('/me', requireUser('viewer'), async (req: AuthedRequest, res) => {
  res.json({ user: req.user });
});
