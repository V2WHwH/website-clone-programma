// Identity primitives (SECURITY.md §2/§4): Argon2id password hashing, short-lived access JWTs,
// rotating refresh tokens, and device JWTs bound to a paired keypair.
import crypto from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { Request, Response, NextFunction } from 'express';
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import { env } from './env.js';
import { one, q } from './db.js';

const secret = new TextEncoder().encode(env.jwtSecret);
export const ACCESS_TTL = '15m';
const REFRESH_DAYS = 30;

// Argon2id parameters per OWASP baseline: m=19456 KiB, t=2, p=1.
const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export const hashPassword = (pw: string): Promise<string> => argonHash(pw, ARGON);
export const verifyPassword = (h: string, pw: string): Promise<boolean> =>
  argonVerify(h, pw).catch(() => false);

export const sha256 = (s: string): string => crypto.createHash('sha256').update(s).digest('hex');
export const randomToken = (bytes = 32): string => crypto.randomBytes(bytes).toString('base64url');

export interface UserClaims {
  sub: string;
  org: string;
  role: string;
  name: string;
  kind: 'user';
}
export interface GuestClaims {
  org: string;
  invite: string;
  devices: string[];
  name: string;
  kind: 'guest';
}
export interface DeviceClaims {
  device: string;
  org: string;
  kind: 'device';
}
type Claims = UserClaims | GuestClaims | DeviceClaims;

export async function signClaims(claims: Claims, ttl: string): Promise<string> {
  return new SignJWT(claims as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(secret);
}

export async function verifyToken<T extends Claims>(token: string, kind: T['kind']): Promise<T | undefined> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.kind !== kind) return undefined;
    return payload as unknown as T;
  } catch {
    return undefined;
  }
}

export async function issueRefresh(userId: string): Promise<string> {
  const raw = randomToken();
  await q('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() + $3::interval)', [
    userId,
    sha256(raw),
    `${REFRESH_DAYS} days`,
  ]);
  return raw;
}

/** Rotation: the presented token is revoked and a new one issued (SECURITY.md §4). */
export async function rotateRefresh(raw: string): Promise<{ userId: string; next: string } | undefined> {
  const row = await one<{ id: string; user_id: string }>(
    `UPDATE refresh_tokens SET revoked_at = now()
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()
     RETURNING id, user_id`,
    [sha256(raw)],
  );
  if (!row) return undefined;
  return { userId: row.user_id, next: await issueRefresh(row.user_id) };
}

// ——— Express helpers ———
export interface AuthedRequest extends Request {
  user?: UserClaims;
  guest?: GuestClaims;
}

const bearer = (req: Request): string | undefined => {
  const h = req.headers.authorization;
  return h?.startsWith('Bearer ') ? h.slice(7) : undefined;
};

const ROLE_RANK: Record<string, number> = { viewer: 0, presenter: 1, operator: 2, admin: 3, owner: 4 };

export function requireUser(minRole: keyof typeof ROLE_RANK) {
  return async (req: AuthedRequest, res: Response, next: NextFunction): Promise<void> => {
    const t = bearer(req);
    const claims = t ? await verifyToken<UserClaims>(t, 'user') : undefined;
    if (!claims) {
      res.status(401).json({ error: 'unauthenticated' });
      return;
    }
    if ((ROLE_RANK[claims.role] ?? -1) < (ROLE_RANK[minRole] ?? 99)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    req.user = claims;
    next();
  };
}

/** Accepts a signed-in user (minRole) OR a guest grant; used by the session endpoints. */
export function requireUserOrGuest(minRole: keyof typeof ROLE_RANK) {
  return async (req: AuthedRequest, res: Response, next: NextFunction): Promise<void> => {
    const t = bearer(req);
    if (!t) {
      res.status(401).json({ error: 'unauthenticated' });
      return;
    }
    const u = await verifyToken<UserClaims>(t, 'user');
    if (u) {
      if ((ROLE_RANK[u.role] ?? -1) < (ROLE_RANK[minRole] ?? 99)) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }
      req.user = u;
      next();
      return;
    }
    const g = await verifyToken<GuestClaims>(t, 'guest');
    if (g) {
      req.guest = g;
      next();
      return;
    }
    res.status(401).json({ error: 'unauthenticated' });
  };
}

export interface DeviceRequest extends Request {
  deviceClaims?: DeviceClaims;
}

/** Device-token auth for receiver REST calls (event logging). */
export function requireDevice() {
  return async (req: DeviceRequest, res: Response, next: NextFunction): Promise<void> => {
    const t = bearer(req);
    const claims = t ? await verifyToken<DeviceClaims>(t, 'device') : undefined;
    if (!claims) {
      res.status(401).json({ error: 'unauthenticated' });
      return;
    }
    req.deviceClaims = claims;
    next();
  };
}

export async function audit(
  orgId: string | null,
  actor: string,
  action: string,
  target?: string,
  meta: Record<string, unknown> = {},
): Promise<void> {
  await q('INSERT INTO audit_entries (org_id, actor, action, target, meta) VALUES ($1,$2,$3,$4,$5)', [
    orgId,
    actor,
    action,
    target ?? null,
    JSON.stringify(meta),
  ]);
}
