// M3 API tests — run against a real PostgreSQL (holo_test), schema recreated per run.
// Includes the M3 gate test: two organisations exist and neither can see the other's devices.
import assert from 'node:assert/strict';
import { spawn, execSync } from 'node:child_process';
import crypto from 'node:crypto';
import test, { before, after } from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 8899;
const BASE = `http://localhost:${PORT}/api/v1`;
const DB = 'postgres://holo:holo_dev@127.0.0.1:5432/holo_test';

let server;

before(async () => {
  execSync(`psql "${DB}" -q -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'`);
  server = spawn('node', ['node_modules/tsx/dist/cli.mjs', 'server/index.ts'], {
    env: { ...process.env, PORT: String(PORT), DATABASE_URL: DB },
    stdio: 'inherit',
  });
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    const ok = await fetch(`${BASE}/health`).then((r) => r.ok).catch(() => false);
    if (ok) return;
  }
  throw new Error('server did not start');
});

after(() => server?.kill());

async function api(path, { body, token, method } = {}) {
  const r = await fetch(`${BASE}${path}`, {
    method: method ?? (body !== undefined ? 'POST' : 'GET'),
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data, headers: r.headers };
}

// WebCrypto device identity, same as the receiver page.
async function makeDeviceKeys() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
  return { priv: pair.privateKey, pubJwk: await crypto.subtle.exportKey('jwk', pair.publicKey) };
}
const b64url = (buf) => Buffer.from(buf).toString('base64url');

const orgs = {}; // {a: {token,...}, b: {...}}

test('register two organisations', async () => {
  for (const [key, name] of [['a', 'Org Alpha'], ['b', 'Org Beta']]) {
    const r = await api('/auth/register', {
      body: { orgName: name, email: `${key}@example.test`, password: 'supersecret123', displayName: `Owner ${key}` },
    });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    assert.ok(r.data.access);
    assert.equal(r.data.org.role, 'owner');
    orgs[key] = { token: r.data.access, orgId: r.data.org.id };
  }
});

test('login works and wrong password is rejected', async () => {
  const ok = await api('/auth/login', { body: { email: 'a@example.test', password: 'supersecret123' } });
  assert.equal(ok.status, 200);
  const bad = await api('/auth/login', { body: { email: 'a@example.test', password: 'wrong-password' } });
  assert.equal(bad.status, 401);
});

test('weak or duplicate registrations are rejected', async () => {
  const weak = await api('/auth/register', {
    body: { orgName: 'X', email: 'weak@example.test', password: 'short', displayName: 'X' },
  });
  assert.equal(weak.status, 400);
  const dup = await api('/auth/register', {
    body: { orgName: 'X', email: 'a@example.test', password: 'supersecret123', displayName: 'X' },
  });
  assert.equal(dup.status, 409);
});

test('device pairing: keypair -> code -> claim -> nonce auth', async () => {
  const keys = await makeDeviceKeys();
  const start = await api('/pairing/start', { body: { publicKeyJwk: keys.pubJwk } });
  assert.equal(start.status, 201);
  const code = start.data.code;
  assert.match(code, /^[A-HJ-KM-NP-Z2-9]{6}$/);

  // unclaimed poll
  let poll = await api('/pairing/poll', { body: { code } });
  assert.equal(poll.data.claimed, false);

  const claim = await api('/devices/claim', {
    token: orgs.a.token,
    body: { code, name: 'Amsterdam HQ', kind: 'holobox', locationName: 'Reception' },
  });
  assert.equal(claim.status, 201, JSON.stringify(claim.data));
  const deviceId = claim.data.device.id;

  // reuse of the same code must fail
  const again = await api('/devices/claim', { token: orgs.a.token, body: { code, name: 'X', kind: 'holobox' } });
  assert.equal(again.status, 404);

  poll = await api('/pairing/poll', { body: { code } });
  assert.equal(poll.data.claimed, true);
  assert.equal(poll.data.deviceId, deviceId);

  // nonce auth with the paired key
  const n = await api(`/devices/${deviceId}/auth/nonce`, { body: {} });
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.priv, Buffer.from(n.data.nonce));
  const auth = await api(`/devices/${deviceId}/auth`, { body: { nonce: n.data.nonce, signature: b64url(sig) } });
  assert.equal(auth.status, 200, JSON.stringify(auth.data));
  assert.ok(auth.data.token);
  orgs.a.deviceId = deviceId;
  orgs.a.deviceToken = auth.data.token;
  orgs.a.deviceKeys = keys;

  // a signature from a DIFFERENT key must be rejected
  const evil = await makeDeviceKeys();
  const n2 = await api(`/devices/${deviceId}/auth/nonce`, { body: {} });
  const badSig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, evil.priv, Buffer.from(n2.data.nonce));
  const bad = await api(`/devices/${deviceId}/auth`, { body: { nonce: n2.data.nonce, signature: b64url(badSig) } });
  assert.equal(bad.status, 401);
});

test('M3 GATE: tenant isolation — org B cannot see or use org A devices', async () => {
  const a = await api('/devices', { token: orgs.a.token });
  assert.equal(a.data.devices.length, 1);

  const b = await api('/devices', { token: orgs.b.token });
  assert.equal(b.data.devices.length, 0, 'org B must not see org A devices');

  // B cannot target A's device in an invite…
  const inv = await api('/invites', { token: orgs.b.token, body: { deviceIds: [orgs.a.deviceId] } });
  assert.equal(inv.status, 404);
  // …nor start a session to it
  const sess = await api('/sessions', { token: orgs.b.token, body: { deviceIds: [orgs.a.deviceId] } });
  assert.equal(sess.status, 404);
});

test('presence: device WS makes the device ONLINE, close makes it OFFLINE', async () => {
  const ws = new WebSocket(`ws://localhost:${PORT}/ws/device?token=${orgs.a.deviceToken}`);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  await sleep(300);
  let list = await api('/devices', { token: orgs.a.token });
  assert.equal(list.data.devices[0].state, 'online');
  ws.close();
  await sleep(300);
  list = await api('/devices', { token: orgs.a.token });
  assert.equal(list.data.devices[0].state, 'offline');
});

test('invites: create, preview, join (password + single use), revoke', async () => {
  const inv = await api('/invites', {
    token: orgs.a.token,
    body: { deviceIds: [orgs.a.deviceId], ttlHours: 24, maxUses: 1, password: 'letmein-123' },
  });
  assert.equal(inv.status, 201);
  const raw = inv.data.token;

  const prev = await api('/join/preview', { body: { token: raw } });
  assert.equal(prev.status, 200);
  assert.equal(prev.data.passwordRequired, true);
  assert.equal(prev.data.destinations[0].name, 'Amsterdam HQ');

  const noPw = await api('/join', { body: { token: raw, name: 'Sarah' } });
  assert.equal(noPw.status, 401);

  const join = await api('/join', { body: { token: raw, name: 'Sarah', password: 'letmein-123' } });
  assert.equal(join.status, 200, JSON.stringify(join.data));
  orgs.a.guestToken = join.data.access;

  // single use: a second join is refused
  const second = await api('/join', { body: { token: raw, name: 'Mallory', password: 'letmein-123' } });
  assert.equal(second.status, 404);

  // revoked invites stop working
  const inv2 = await api('/invites', { token: orgs.a.token, body: { deviceIds: [orgs.a.deviceId], maxUses: null } });
  await api(`/invites/${inv2.data.id}/revoke`, { token: orgs.a.token, body: {} });
  const deadPrev = await api('/join/preview', { body: { token: inv2.data.token } });
  assert.equal(deadPrev.status, 404);
});

test('sessions: presenter start mints scoped tokens, guest start honours grant, stop ends', async () => {
  const s = await api('/sessions', { token: orgs.a.token, body: { deviceIds: [orgs.a.deviceId] } });
  assert.equal(s.status, 201, JSON.stringify(s.data));
  assert.ok(s.data.token);
  assert.equal(s.data.room, `session-${s.data.sessionId}`);

  const stop = await api(`/sessions/${s.data.sessionId}/stop`, {
    token: orgs.a.token,
    body: { stats: { durationSeconds: 12, maxResolution: '1280 × 720' } },
  });
  assert.equal(stop.status, 200);

  // guest can start only to granted devices
  const gs = await api('/sessions', { token: orgs.a.guestToken, body: { deviceIds: [orgs.a.deviceId] } });
  assert.equal(gs.status, 201);
  await api(`/sessions/${gs.data.sessionId}/stop`, { token: orgs.a.guestToken, body: {} });

  const list = await api('/sessions', { token: orgs.a.token });
  assert.equal(list.data.sessions.length, 2);
  assert.ok(list.data.sessions.every((x) => x.state === 'ended'));

  // org B sees none of them
  const listB = await api('/sessions', { token: orgs.b.token });
  assert.equal(listB.data.sessions.length, 0);
});

test('refresh token rotation: old cookie is dead after refresh', async () => {
  const login = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'a@example.test', password: 'supersecret123' }),
  });
  const cookie = login.headers.get('set-cookie').split(';')[0];
  const r1 = await fetch(`${BASE}/auth/refresh`, { method: 'POST', headers: { cookie } });
  assert.equal(r1.status, 200);
  const r2 = await fetch(`${BASE}/auth/refresh`, { method: 'POST', headers: { cookie } });
  assert.equal(r2.status, 401, 'rotated refresh token must be single-use');
});

test('audit trail exists for the actions above', async () => {
  const out = execSync(
    `psql "${DB}" -tA -c "SELECT action, count(*) FROM audit_entries GROUP BY action ORDER BY action"`,
  ).toString();
  for (const action of ['device.paired', 'invite.created', 'invite.used', 'session.started', 'session.stopped']) {
    assert.ok(out.includes(action), `missing audit action ${action}: ${out}`);
  }
});
