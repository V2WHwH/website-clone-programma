#!/usr/bin/env node
// Servertest van het HereWeHolo-beheerplatform (server.js, lib/, routes/, public/).
//
// Start zelf een kopie van de server in een tijdelijke map (data/ en media/
// staan vast naast server.js, dus de echte data/ van de ontwikkelaar blijft
// onaangeroerd), met een nagebootste LemonSlice-aanbieder, en loopt alle
// endpoints, de WebSocket-hub, de Studio-koppeling en de pagina's langs.
//
//   node tests/server/servertest.js          (na `npm install` in de hoofdmap)
//   BEWAAR=1 node tests/server/servertest.js (tijdelijke map niet opruimen)
//
// De paginatests gebruiken Playwright + Chromium als die te vinden zijn
// (NODE_PATH, /opt/node-tools of tests/studio/node_modules); anders worden
// ze overgeslagen.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const net = require('net');
const zlib = require('zlib');
const crypto = require('crypto');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');

let WebSocket;
try {
  WebSocket = require(require.resolve('ws', { paths: [ROOT] }));
} catch {
  console.error('Module "ws" niet gevonden: draai eerst `npm install` in ' + ROOT);
  process.exit(2);
}

function laadPlaywright() {
  const kandidaten = [
    'playwright',
    '/opt/node-tools/node_modules/playwright',
    path.join(ROOT, 'tests', 'studio', 'node_modules', 'playwright')
  ];
  for (const k of kandidaten) {
    try { return require(k); } catch { /* volgende */ }
  }
  return null;
}
const CHROMIUM = process.env.CHROMIUM ||
  (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

/* ---------------- Kleine hulpjes ---------------- */

let ok = 0, fout = 0;
const mislukt = [];
let sectie = '';
const check = (naam, cond, info) => {
  if (cond) ok++; else { fout++; mislukt.push(`[${sectie}] ${naam}`); }
  let extra = '';
  if (info !== undefined) {
    extra = JSON.stringify(info);
    if (extra && extra.length > 400) extra = extra.slice(0, 400) + '…';
  }
  console.log(`   ${cond ? '✓' : '✗'} ${naam} ${extra || ''}`);
};
const meld = (tekst) => console.log(`   i ${tekst}`);
const kop = (t) => { sectie = t; console.log(`\n== ${t}`); };
const wacht = (ms) => new Promise((r) => setTimeout(r, ms));
async function wachtOp(fn, ms = 3000, stap = 50) {
  const eind = Date.now() + ms;
  while (Date.now() < eind) {
    const v = await fn();
    if (v) return v;
    await wacht(stap);
  }
  return null;
}

// Echte PNG's maken (zonder externe tools), zodat de player ze kan tonen.
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function maakPng(w, h, [r, g, b]) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  const rij = Buffer.alloc(1 + w * 3);
  for (let x = 0; x < w; x++) { rij[1 + x * 3] = r; rij[2 + x * 3] = g; rij[3 + x * 3] = b; }
  const raw = Buffer.concat(Array.from({ length: h }, () => rij));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr), pngChunk('IDAT', zlib.deflateSync(raw)), pngChunk('IEND', Buffer.alloc(0))
  ]);
}

const WACHTWOORD = 'test-wachtwoord-' + crypto.randomBytes(4).toString('hex');
const ROOD = maakPng(64, 64, [220, 30, 30]);
const BLAUW = maakPng(64, 64, [30, 60, 220]);
const FILM = crypto.randomBytes(300 * 1024); // nep-"video" voor download- en range-tests

/* ---------------- Serverkopie starten/stoppen ---------------- */

const tijdelijk = fs.mkdtempSync(path.join(os.tmpdir(), 'hwh-servertest-'));
const processen = new Set();

function maakKopie(naam) {
  const dir = path.join(tijdelijk, naam);
  fs.mkdirSync(dir, { recursive: true });
  for (const f of ['server.js', 'package.json']) fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
  for (const d of ['lib', 'routes', 'public']) fs.cpSync(path.join(ROOT, d), path.join(dir, d), { recursive: true });
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  return dir;
}

function vrijePoort() {
  return new Promise((res, rej) => {
    const s = net.createServer();
    s.on('error', rej);
    s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); });
  });
}

const ENV_SLEUTELS = ['ADMIN_PASSWORD', 'LEMONSLICE_API_KEY', 'LEMONSLICE_SESSION_URL', 'PUBLIC_BASE_URL',
  'LEMONSLICE_URL_FIELD', 'LEMONSLICE_TOKEN_FIELD', 'NODE_ENV', 'PORT', 'HOST'];

async function startServer(dir, extraEnv = {}) {
  const port = await vrijePoort();
  const env = { ...process.env };
  for (const k of ENV_SLEUTELS) delete env[k];
  Object.assign(env, extraEnv, { PORT: String(port), HOST: '127.0.0.1' });
  const proc = spawn(process.execPath, ['server.js'], { cwd: dir, env, stdio: ['ignore', 'pipe', 'pipe'] });
  const inst = { proc, port, base: `http://127.0.0.1:${port}`, dir, env: extraEnv, log: '' };
  proc.stdout.on('data', (d) => { inst.log += d; });
  proc.stderr.on('data', (d) => { inst.log += d; });
  inst.exit = new Promise((r) => proc.on('exit', (code, signal) => { processen.delete(proc); r({ code, signal }); }));
  processen.add(proc);
  const eind = Date.now() + 15000;
  while (Date.now() < eind) {
    if (proc.exitCode !== null) throw new Error('Server stopte direct:\n' + inst.log);
    try {
      const r = await fetch(inst.base + '/api/v1/health');
      if (r.ok) return inst;
    } catch { /* nog niet klaar */ }
    await wacht(100);
  }
  throw new Error('Server antwoordt niet binnen 15 s:\n' + inst.log);
}

async function stopServer(inst) {
  if (inst.proc.exitCode === null && inst.proc.signalCode === null) inst.proc.kill('SIGTERM');
  return inst.exit;
}

/* ---------------- HTTP- en WebSocket-clients ---------------- */

function maakClient(base, { bewaarCookie = true } = {}) {
  let cookie = '';
  async function req(method, p, { json, body, headers = {}, zonderCookie = false, signal } = {}) {
    const h = { ...headers };
    if (cookie && !zonderCookie && !h.cookie) h.cookie = cookie;
    let b = body;
    if (json !== undefined) { h['content-type'] = 'application/json'; b = JSON.stringify(json); }
    const r = await fetch(base + p, { method, headers: h, body: b, redirect: 'manual', signal });
    const sc = r.headers.get('set-cookie');
    if (sc && !zonderCookie && bewaarCookie) {
      const m = sc.match(/hwh_session=([^;]*)/);
      if (m) cookie = m[1] ? 'hwh_session=' + m[1] : '';
    }
    const buf = Buffer.from(await r.arrayBuffer());
    const text = buf.toString('utf8');
    let data;
    try { data = JSON.parse(text); } catch { /* geen JSON */ }
    return { status: r.status, headers: r.headers, text, json: data, buf };
  }
  return {
    req,
    get cookie() { return cookie; },
    set cookie(v) { cookie = v; }
  };
}

// Rauw HTTP-verzoek: het pad gaat ongewijzigd over de lijn (geen normalisatie
// van ../ zoals fetch dat doet) — nodig voor path-traversal-pogingen.
function rauw(port, method, p, headers = {}) {
  return new Promise((res, rej) => {
    const r = http.request({ host: '127.0.0.1', port, method, path: p, headers }, (resp) => {
      const delen = [];
      resp.on('data', (c) => delen.push(c));
      resp.on('end', () => res({ status: resp.statusCode, headers: resp.headers, text: Buffer.concat(delen).toString('utf8') }));
    });
    r.on('error', rej);
    r.end();
  });
}

function wsOpen(url, opts = {}) {
  return new Promise((resolve) => {
    const ws = new WebSocket(url, opts);
    const c = { ws, msgs: [], open: false, closeCode: null };
    c.closed = new Promise((r) => ws.on('close', (code) => { c.closeCode = code; r(code); }));
    ws.on('message', (d) => { try { c.msgs.push(JSON.parse(d)); } catch { c.msgs.push(String(d)); } });
    ws.on('open', () => { c.open = true; resolve(c); });
    ws.on('error', () => resolve(c));
    ws.on('close', () => resolve(c));
  });
}
const heeftMsg = (c, type, extra = () => true) => c.msgs.find((m) => m && m.type === type && extra(m));

/* ---------------- Nagebootste LemonSlice-aanbieder ---------------- */

function startMock() {
  const calls = [];
  const feeds = {};
  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url.startsWith('/feed')) {
      const naam = req.url.slice(1);
      const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
      if (feeds[naam]) { res.writeHead(200, cors); return res.end(JSON.stringify(feeds[naam])); }
      res.writeHead(500, cors);
      return res.end('{"error":"feed kapot"}');
    }
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      const key = req.headers['x-api-key'];
      let parsed = null;
      try { parsed = JSON.parse(body); } catch { /* leeg */ }
      calls.push({ key, path: req.url, method: req.method, body: parsed });
      const json = (status, obj) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
      switch (key) {
        case 'mock-daily':
          return json(200, { session_id: 'sess_1', room_url: 'https://hwh.daily.co/kamer1', control_url: 'https://lemonslice.example/ctl/1' });
        case 'mock-livekit':
          return json(200, { session_id: 'sess_2', livekit_url: 'wss://lk.example/x', livekit_token: 'tok123' });
        case 'mock-livekit-notoken':
          return json(200, { livekit_url: 'wss://lk.example/x' });
        case 'mock-nested':
          return json(200, { data: { room_url: 'https://x.daily.co/genest', session_id: 'n1' } });
        case 'mock-weird':
          return json(200, { foo: 1, bar: 2 });
        case 'mock-500':
          res.writeHead(500, { 'content-type': 'text/plain' });
          return res.end('provider kapot');
        case 'mock-close':
          return req.socket.destroy();
        case 'mock-hang':
          return; // nooit antwoorden
        case 'house-key':
          return json(200, { session_id: 'huis', room_url: 'https://huis.daily.co/r' });
        default:
          return json(401, { error: 'onbekende sleutel' });
      }
    });
  });
  return new Promise((res) => server.listen(0, '127.0.0.1', () => {
    const origin = `http://127.0.0.1:${server.address().port}`;
    res({ server, calls, feeds, origin, url: `${origin}/api/liveai/sessions` });
  }));
}

/* ======================================================================== */

async function main() {
  const repoDataBestond = fs.existsSync(path.join(ROOT, 'data'));
  const repoMediaBestond = fs.existsSync(path.join(ROOT, 'media'));
  const repoDbVoor = repoDataBestond && fs.existsSync(path.join(ROOT, 'data', 'db.json'))
    ? fs.readFileSync(path.join(ROOT, 'data', 'db.json')) : null;

  const mock = await startMock();
  const dirA = maakKopie('hoofd');
  const envA = { ADMIN_PASSWORD: WACHTWOORD, LEMONSLICE_SESSION_URL: mock.url, LEMONSLICE_TIMEOUT_MS: '3000' };
  let A = await startServer(dirA, envA);
  console.log(`Server draait op ${A.base} (map ${dirA})`);
  let api = maakClient(A.base);
  let anon = maakClient(A.base, { bewaarCookie: false });
  let r;

  /* ---------------- Basis & statische pagina's ---------------- */
  kop('Basis & statische bestanden');
  r = await anon.req('GET', '/api/v1/health');
  check('GET /api/v1/health → 200 ok', r.status === 200 && r.json?.ok === true, r.json);
  r = await anon.req('GET', '/');
  check('GET / stuurt door naar /admin', [301, 302, 303, 307, 308].includes(r.status) && /\/admin$/.test(r.headers.get('location') || ''), { status: r.status, location: r.headers.get('location') });
  r = await anon.req('GET', '/admin');
  const adminRedirect = r.headers.get('location');
  r = adminRedirect ? await anon.req('GET', adminRedirect) : r;
  check('GET /admin(/) → CMS-HTML', r.status === 200 && r.text.includes('HereWeHolo CMS'), { redirect: adminRedirect, status: r.status });
  for (const p of ['/admin/admin.js', '/admin/admin.css', '/player/player.js', '/vendor/hls.min.js']) {
    r = await anon.req('GET', p);
    check(`GET ${p} → 200`, r.status === 200 && r.buf.length > 100, { status: r.status, type: r.headers.get('content-type') });
  }
  r = await anon.req('GET', '/player/willekeurig123');
  check('GET /player/<key> → player-HTML', r.status === 200 && r.text.includes('/player/player.js'), r.status);
  check('geen X-Powered-By-header', !r.headers.get('x-powered-by'));

  /* ---------------- Authenticatie ---------------- */
  kop('Authenticatie');
  r = await anon.req('GET', '/api/session');
  check('sessie zonder cookie: authed=false', r.status === 200 && r.json?.authed === false, r.json);
  r = await anon.req('POST', '/api/login', { json: { password: 'fout' } });
  check('login met fout wachtwoord → 401', r.status === 401, r.status);
  r = await anon.req('POST', '/api/login', { json: { password: WACHTWOORD + 'x' } });
  check('login met wachtwoord + extra teken → 401', r.status === 401, r.status);
  r = await anon.req('POST', '/api/login', { json: {} });
  check('login zonder wachtwoord → 401', r.status === 401, r.status);
  r = await anon.req('POST', '/api/login');
  check('login zonder body → 401 (geen 500)', r.status === 401, r.status);
  r = await anon.req('POST', '/api/login', { json: { password: ['fout'] } });
  check('login met (fout) wachtwoord als array → 401', r.status === 401, r.status);
  r = await anon.req('POST', '/api/login', { json: { password: 'hereweholo' } });
  check('standaardwachtwoord werkt niet als ADMIN_PASSWORD gezet is', r.status === 401, r.status);

  r = await api.req('POST', '/api/login', { json: { password: WACHTWOORD } });
  const setCookie = r.headers.get('set-cookie') || '';
  check('login met juist wachtwoord → 200 ok', r.status === 200 && r.json?.ok === true && r.json?.defaultPassword === false, r.json);
  check('sessiecookie is HttpOnly, SameSite=Lax, Path=/', /HttpOnly/i.test(setCookie) && /SameSite=Lax/i.test(setCookie) && /Path=\//i.test(setCookie), setCookie.replace(/hwh_session=[^;]+/, 'hwh_session=…'));
  r = await api.req('GET', '/api/session');
  check('sessie met cookie: authed=true', r.json?.authed === true, r.json);

  const beschermd = [
    ['GET', '/api/devices'], ['POST', '/api/devices'], ['PUT', '/api/devices/x'], ['DELETE', '/api/devices/x'],
    ['POST', '/api/devices/x/command'], ['GET', '/api/devices/x/studio'], ['POST', '/api/devices/x/studio/command'],
    ['PUT', '/api/devices/x/studio/config'], ['GET', '/api/playlists'], ['POST', '/api/playlists'],
    ['PUT', '/api/playlists/x'], ['DELETE', '/api/playlists/x'], ['GET', '/api/live-sources'],
    ['POST', '/api/live-sources'], ['PUT', '/api/live-sources/x'], ['DELETE', '/api/live-sources/x'],
    ['GET', '/api/media'], ['POST', '/api/media/upload'], ['POST', '/api/media/folder'],
    ['POST', '/api/media/rename'], ['DELETE', '/api/media?path=x'], ['GET', '/api/settings'],
    ['PUT', '/api/settings'], ['GET', '/api/system']
  ];
  let mis = [];
  for (const [m, p] of beschermd) {
    const rr = await anon.req(m, p, (m === 'POST' || m === 'PUT') ? { json: {} } : {});
    if (rr.status !== 401) mis.push(`${m} ${p} → ${rr.status}`);
  }
  check(`alle ${beschermd.length} CMS-endpoints zonder sessie → 401`, mis.length === 0, mis);
  mis = [];
  for (const [m, p] of beschermd) {
    const rr = await anon.req(m, p, { headers: { cookie: 'hwh_session=' + 'ab'.repeat(24) } });
    if (rr.status !== 401) mis.push(`${m} ${p} → ${rr.status}`);
  }
  check('alle CMS-endpoints met verzonnen sessiecookie → 401', mis.length === 0, mis);

  mis = [];
  for (const p of ['/API/devices', '/Api/Devices', '/api/devices/', '/api//devices', '/api/./devices',
    '/api/v1/../devices', '/api/v1/%2e%2e/devices', '/api/v1/..%2fdevices', '/api/v1%2f..%2fdevices',
    '/api/devices?x=/v1/', '/api/devices;/v1/', '/api/v1/../settings']) {
    const rr = await rauw(A.port, 'GET', p);
    if (rr.status === 200) mis.push(`${p} → 200 ${rr.text.slice(0, 60)}`);
  }
  check('geen auth-bypass via hoofdletters, // , ../ of /v1/-trucs', mis.length === 0, mis);

  {
    const tmp = maakClient(A.base);
    await tmp.req('POST', '/api/login', { json: { password: WACHTWOORD } });
    const oud = tmp.cookie;
    r = await tmp.req('POST', '/api/logout');
    check('logout → 200 en cookie gewist', r.status === 200 && tmp.cookie === '', r.json);
    r = await tmp.req('GET', '/api/devices', { headers: { cookie: oud } });
    check('oude sessiecookie werkt niet meer na logout', r.status === 401, r.status);
  }

  /* ---------------- Holoboxen (devices) ---------------- */
  kop('Holoboxen: CRUD');
  r = await api.req('POST', '/api/devices', { json: { name: 'Box Showroom', orientation: 'landscape', location: 'Amsterdam' } });
  const D1 = r.json || {};
  check('POST /api/devices → nieuw device', r.status === 200 && /^dev_[0-9a-f]{12}$/.test(D1.id || ''), D1);
  check('device-key is 24 hex-tekens', /^[0-9a-f]{24}$/.test(D1.key || ''), D1.key);
  check('oriëntatie landscape en locatie overgenomen', D1.orientation === 'landscape' && D1.location === 'Amsterdam');
  r = await api.req('POST', '/api/devices', { json: { name: 'Box Twee', orientation: 'iets-raars' } });
  const D2 = r.json || {};
  check('onbekende oriëntatie valt terug op portrait', D2.orientation === 'portrait', D2.orientation);
  check('twee devices krijgen verschillende keys', D1.key !== D2.key);

  r = await api.req('GET', '/api/devices');
  const lijst1 = r.json || [];
  const d1 = lijst1.find((d) => d.id === D1.id);
  check('GET /api/devices bevat beide devices', lijst1.length >= 2 && !!d1 && !!lijst1.find((d) => d.id === D2.id), lijst1.length);
  check('device in lijst: online=false, avatarKeySet=false', d1 && d1.online === false && d1.avatarKeySet === false, d1);

  r = await api.req('PUT', `/api/devices/${D1.id}`, { json: { name: 'Box Showroom A', rotation: 90, notes: 'test', id: 'dev_gekaapt', key: 'eigen-key' } });
  check('PUT device: naam/rotatie/notities aangepast', r.status === 200 && r.json?.name === 'Box Showroom A' && r.json?.rotation === 90 && r.json?.notes === 'test', r.json);
  check('PUT device kan id en key niet overschrijven', r.json?.id === D1.id && r.json?.key === D1.key, { id: r.json?.id, key: r.json?.key });
  await api.req('PUT', `/api/devices/${D1.id}`, { json: { rotation: 0 } });

  r = await api.req('PUT', `/api/devices/${D1.id}`, { json: { avatarKey: '  sk_live_GEHEIM_1234  ' } });
  check('PUT avatarKey → 200', r.status === 200, r.status);
  check('PUT-antwoord geeft de avatarsleutel NIET terug (GET verbergt hem ook)', !r.text.includes('sk_live_GEHEIM_1234'), { avatarKey: r.json?.avatarKey });
  r = await api.req('GET', '/api/devices');
  let dd = (r.json || []).find((d) => d.id === D1.id) || {};
  check('GET devices: avatarKeySet=true, hint "…1234", sleutel zelf niet zichtbaar', dd.avatarKeySet === true && dd.avatarKeyHint === '…1234' && !r.text.includes('GEHEIM'), { set: dd.avatarKeySet, hint: dd.avatarKeyHint });
  await api.req('PUT', `/api/devices/${D1.id}`, { json: { avatarKey: '' } });
  r = await api.req('GET', '/api/devices');
  dd = (r.json || []).find((d) => d.id === D1.id) || {};
  check('avatarKey "" wist de eigen sleutel', dd.avatarKeySet === false, dd.avatarKeySet);

  r = await api.req('PUT', `/api/devices/${D2.id}`, { json: { orientation: 'diagonaal', rotation: 'abc', playlistId: 'pl_bestaatniet' } });
  check('PUT device valideert oriëntatie/rotatie/playlistId (ongeldige waarden geweigerd)',
    r.status === 400 || (r.json?.orientation !== 'diagonaal' && r.json?.rotation !== 'abc' && r.json?.playlistId !== 'pl_bestaatniet'),
    { status: r.status, orientation: r.json?.orientation, rotation: r.json?.rotation, playlistId: r.json?.playlistId });
  await api.req('PUT', `/api/devices/${D2.id}`, { json: { orientation: 'portrait', rotation: 0, playlistId: null } });

  r = await api.req('POST', '/api/devices', { json: { name: 'Weg ermee' } });
  const D3 = r.json || {};
  r = await api.req('DELETE', `/api/devices/${D3.id}`);
  check('DELETE device → 200', r.status === 200, r.status);
  r = await api.req('GET', '/api/devices');
  check('verwijderd device staat niet meer in de lijst', !(r.json || []).some((d) => d.id === D3.id));
  r = await anon.req('GET', `/api/v1/manifest/${D3.key}`);
  check('key van verwijderd device geeft 404 op manifest', r.status === 404, r.status);

  /* ---------------- Integratie-API v1 (device-key) ---------------- */
  kop('Integratie-API v1 (device-key)');
  r = await anon.req('GET', `/api/v1/manifest/${D1.key}`);
  check('manifest met geldige key → 200 zonder sessie', r.status === 200 && r.json?.device?.id === D1.id, r.status);
  check('manifest: Cache-Control no-store en CORS *', r.headers.get('cache-control') === 'no-store' && r.headers.get('access-control-allow-origin') === '*',
    { cc: r.headers.get('cache-control'), acao: r.headers.get('access-control-allow-origin') });
  check('manifest lekt geen device-key of avatarsleutel', !r.text.includes(D1.key) && !/avatarKey/.test(r.text));
  r = await anon.req('GET', '/api/v1/manifest/000000000000000000000000');
  check('manifest met onbekende key → 404', r.status === 404, r.status);
  r = await anon.req('GET', '/api/v1/manifest/');
  check('manifest zonder key → 404', r.status === 404, r.status);
  r = await anon.req('POST', `/api/v1/heartbeat/${D1.key}`, { json: { nowPlaying: { id: 'x', name: 'via-heartbeat', type: 'image' } } });
  check('heartbeat met geldige key → 200 + pollIntervalSec', r.status === 200 && r.json?.ok === true && typeof r.json?.pollIntervalSec === 'number', r.json);
  r = await api.req('GET', '/api/devices');
  dd = (r.json || []).find((d) => d.id === D1.id) || {};
  check('heartbeat zet lastSeen, lastIp en nowPlaying', !!dd.lastSeen && dd.lastIp === '127.0.0.1' && dd.nowPlaying?.name === 'via-heartbeat', { lastIp: dd.lastIp, nowPlaying: dd.nowPlaying });
  r = await anon.req('POST', '/api/v1/heartbeat/fout', { json: {} });
  check('heartbeat met onbekende key → 404', r.status === 404, r.status);
  r = await anon.req('POST', `/api/v1/heartbeat/${D1.key}`);
  check('heartbeat zonder body → 200 (geen 500)', r.status === 200, r.status);
  r = await anon.req('OPTIONS', `/api/v1/heartbeat/${D1.key}`, { headers: { origin: 'null', 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type' } });
  check('CORS-preflight op /api/v1 → 204 met Allow-Origin * en Content-Type toegestaan',
    r.status === 204 && r.headers.get('access-control-allow-origin') === '*' && /content-type/i.test(r.headers.get('access-control-allow-headers') || ''),
    { status: r.status, h: r.headers.get('access-control-allow-headers') });
  r = await anon.req('GET', '/api/devices', { headers: { 'x-device-key': D1.key } });
  check('device-key geeft geen toegang tot de CMS-API', r.status === 401, r.status);
  r = await anon.req('POST', `/api/v1/heartbeat/${D1.key}`, { json: {}, headers: { 'x-forwarded-for': '203.0.113.66' } });
  r = await api.req('GET', '/api/devices');
  dd = (r.json || []).find((d) => d.id === D1.id) || {};
  meld(`trust proxy staat aan: X-Forwarded-For van de client wordt als IP van de box getoond (lastIp=${dd.lastIp})`);

  /* ---------------- Live-bronnen ---------------- */
  kop('Live-bronnen');
  r = await api.req('POST', '/api/live-sources', { json: { name: 'Studio HLS' } });
  check('live-bron zonder protocol/url → 400', r.status === 400, r.status);
  r = await api.req('POST', '/api/live-sources', { json: { name: 'Studio HLS', protocol: 'hls', url: '/live/stream.m3u8', notes: 'OBS' } });
  const L1 = r.json || {};
  check('live-bron aanmaken → 200 met id en lowLatency=true', r.status === 200 && /^live_/.test(L1.id || '') && L1.lowLatency === true, L1);
  r = await api.req('POST', '/api/live-sources', { json: { name: 'Raar', protocol: 'ftp', url: 'javascript:alert(1)' } });
  const Lraar = r.json || {};
  check('live-bron met onbekend protocol (ftp) / javascript:-URL wordt geweigerd', r.status === 400, { status: r.status, protocol: Lraar.protocol, url: Lraar.url });
  if (Lraar.id) await api.req('DELETE', `/api/live-sources/${Lraar.id}`);
  r = await api.req('POST', '/api/live-sources', { json: { name: 'Tijdelijk', protocol: 'whep', url: 'http://mtx:8889/live/whep', lowLatency: false } });
  const L2 = r.json || {};
  check('lowLatency=false wordt bewaard', L2.lowLatency === false, L2.lowLatency);
  r = await api.req('PUT', `/api/live-sources/${L2.id}`, { json: { name: 'Hernoemd', id: 'live_gekaapt' } });
  check('PUT live-bron → naam aangepast, id niet', r.status === 200 && r.json?.name === 'Hernoemd' && r.json?.id === L2.id, r.json);
  r = await api.req('PUT', '/api/live-sources/live_bestaatniet', { json: { name: 'x' } });
  check('PUT onbekende live-bron → 404', r.status === 404, r.status);
  r = await api.req('GET', '/api/live-sources');
  check('GET live-bronnen bevat beide', (r.json || []).some((s) => s.id === L1.id) && (r.json || []).some((s) => s.id === L2.id));
  r = await api.req('DELETE', `/api/live-sources/${L2.id}`);
  check('DELETE live-bron → 200', r.status === 200);
  r = await api.req('GET', '/api/live-sources');
  check('verwijderde live-bron is weg', !(r.json || []).some((s) => s.id === L2.id));

  /* ---------------- Media ---------------- */
  kop('Media: upload, lijst, download, range');
  let fd = new FormData();
  fd.append('files', new Blob([ROOD], { type: 'image/png' }), 'rood.png');
  fd.append('files', new Blob([BLAUW], { type: 'image/png' }), 'blauw.png');
  fd.append('files', new Blob([FILM], { type: 'video/mp4' }), 'film.mp4');
  r = await api.req('POST', '/api/media/upload?folder=' + encodeURIComponent('Klant A/portrait'), { body: fd });
  check('upload van 3 bestanden in submap → 200', r.status === 200 && r.json?.files?.length === 3, r.json);
  const mediaRoot = path.join(dirA, 'media');
  check('bestanden staan op schijf in media/Klant A/portrait', fs.existsSync(path.join(mediaRoot, 'Klant A', 'portrait', 'film.mp4')));
  r = await api.req('GET', '/api/media?folder=' + encodeURIComponent('Klant A/portrait'));
  const files = r.json?.files || [];
  const film = files.find((f) => f.name === 'film.mp4');
  check('lijst toont 3 bestanden met soort en grootte', files.length === 3 && film?.kind === 'video' && film?.size === FILM.length && files.find((f) => f.name === 'rood.png')?.kind === 'image', files.map((f) => `${f.name}:${f.kind}`));
  check('URL is netjes ge-encodeerd', film?.url === '/media/Klant%20A/portrait/film.mp4', film?.url);
  check('mappenlijst bevat "Klant A" en "Klant A/portrait"', (r.json?.folders || []).includes('Klant A') && (r.json?.folders || []).includes('Klant A/portrait'), r.json?.folders);

  const filmUrl = '/media/Klant%20A/portrait/film.mp4';
  r = await anon.req('GET', filmUrl);
  check('download zonder sessie → 200 met exact dezelfde bytes', r.status === 200 && r.buf.equals(FILM), r.status);
  check('download: Content-Type video/mp4, Accept-Ranges bytes, CORS *',
    r.headers.get('content-type') === 'video/mp4' && r.headers.get('accept-ranges') === 'bytes' && r.headers.get('access-control-allow-origin') === '*',
    { type: r.headers.get('content-type'), ar: r.headers.get('accept-ranges') });
  r = await anon.req('GET', filmUrl, { headers: { range: 'bytes=0-99' } });
  check('Range bytes=0-99 → 206 met juiste Content-Range en bytes', r.status === 206 && r.headers.get('content-range') === `bytes 0-99/${FILM.length}` && r.buf.equals(FILM.subarray(0, 100)), { status: r.status, cr: r.headers.get('content-range') });
  r = await anon.req('GET', filmUrl, { headers: { range: 'bytes=1000-' } });
  check('Range bytes=1000- → 206 tot het einde', r.status === 206 && r.buf.equals(FILM.subarray(1000)), r.status);
  r = await anon.req('GET', filmUrl, { headers: { range: 'bytes=-10' } });
  check('Range bytes=-10 → 206 laatste 10 bytes', r.status === 206 && r.buf.equals(FILM.subarray(FILM.length - 10)), r.status);
  r = await anon.req('GET', filmUrl, { headers: { range: `bytes=${FILM.length + 5}-` } });
  check('Range voorbij het einde → 416', r.status === 416, r.status);
  r = await anon.req('HEAD', filmUrl);
  check('HEAD → 200 met Content-Length', r.status === 200 && Number(r.headers.get('content-length')) === FILM.length, r.status);
  r = await anon.req('GET', '/media/');
  check('geen directory-listing op /media/', r.status === 404 || r.status === 403, r.status);
  r = await anon.req('GET', '/media/bestaat-niet.mp4');
  check('onbekend mediabestand → 404', r.status === 404, r.status);
  check('404 op /media lekt geen serverpad of stacktrace', !r.text.includes(dirA) && !/ENOENT|at \w+ \(/.test(r.text), r.text.replace(/<[^>]+>/g, '').trim().slice(0, 160));

  kop('Media: validatie en path traversal');
  fd = new FormData();
  fd.append('files', new Blob(['<script>document.title="xss"</script>'], { type: 'text/html' }), 'aanval.html');
  r = await api.req('POST', '/api/media/upload', { body: fd });
  const geserveerd = await anon.req('GET', '/media/aanval.html');
  check('upload weigert niet-media (.html) — anders stored XSS op het CMS-domein',
    r.status >= 400 || geserveerd.status !== 200,
    { upload: r.status, opgeslagen: r.json?.files, geserveerdAls: geserveerd.headers.get('content-type') });
  check('…en de geweigerde .html staat niet op schijf', !fs.existsSync(path.join(dirA, 'media', 'aanval.html')));
  fd = new FormData();
  fd.append('files', new Blob([ROOD], { type: 'image/png' }), 'café één.png');
  r = await api.req('POST', '/api/media/upload?folder=accent', { body: fd });
  check('bestandsnaam met accenten blijft heel (café één.png)', r.status === 200 && r.json?.files?.[0] === 'café één.png' && fs.existsSync(path.join(dirA, 'media', 'accent', 'café één.png')), r.json);
  r = await api.req('POST', '/api/media/rename', { json: { from: 'accent/café één.png', to: 'accent/pagina.html' } });
  check('hernoemen naar .html → 400 (omzeilt anders de uploadcontrole)', r.status === 400, { status: r.status, body: r.json });
  r = await api.req('DELETE', '/api/media?path=accent');
  check('map met inhoud wissen → 200', r.status === 200 && !fs.existsSync(path.join(dirA, 'media', 'accent')), r.status);
  r = await api.req('DELETE', '/api/media?path=accent');
  check('onbekende map wissen → 404', r.status === 404, r.status);

  fd = new FormData();
  fd.append('bestand', new Blob([ROOD], { type: 'image/png' }), 'x.png');
  r = await api.req('POST', '/api/media/upload', { body: fd });
  check('upload met verkeerde veldnaam → 400 (geen 500)', r.status === 400, { status: r.status, body: r.json });
  fd = new FormData();
  for (let i = 0; i < 21; i++) fd.append('files', new Blob([ROOD], { type: 'image/png' }), `veel${i}.png`);
  r = await api.req('POST', '/api/media/upload?folder=veel', { body: fd });
  check('upload met 21 bestanden (max 20) → 400/413 (geen 500)', r.status === 400 || r.status === 413, { status: r.status, body: r.json });
  fd = new FormData();
  fd.append('files', new Blob([ROOD], { type: 'image/png' }), 'x;y&z <a>.png');
  r = await api.req('POST', '/api/media/upload?folder=namen', { body: fd });
  check('onveilige tekens in bestandsnaam worden vervangen', r.status === 200 && /^[\w.\- ()[\]]+$/.test(r.json?.files?.[0] || ''), r.json?.files);
  fd = new FormData();
  fd.append('files', new Blob([ROOD], { type: 'image/png' }), 'Oriëntatie één.png');
  r = await api.req('POST', '/api/media/upload?folder=namen', { body: fd });
  meld(`bestandsnaam met accenten "Oriëntatie één.png" wordt opgeslagen als "${r.json?.files?.[0]}"`);

  fd = new FormData();
  fd.append('files', new Blob([ROOD], { type: 'image/png' }), 'ontsnapt.png');
  r = await api.req('POST', '/api/media/upload?folder=' + encodeURIComponent('../../buiten'), { body: fd });
  check('upload met folder=../../buiten blijft binnen media/', !fs.existsSync(path.join(tijdelijk, 'buiten')) && !fs.existsSync(path.join(dirA, 'buiten')), { status: r.status });
  const absDoel = path.join(tijdelijk, 'absoluut-doel');
  fd = new FormData();
  fd.append('files', new Blob([ROOD], { type: 'image/png' }), 'ontsnapt.png');
  r = await api.req('POST', '/api/media/upload?folder=' + encodeURIComponent(absDoel), { body: fd });
  check('upload met absoluut pad als folder blijft binnen media/', !fs.existsSync(absDoel), { status: r.status });
  r = await api.req('GET', '/api/media?folder=a&folder=b');
  check('dubbele folder-parameter → geen 500', r.status < 500, { status: r.status, body: r.json });

  const serverJs = fs.readFileSync(path.join(dirA, 'server.js'), 'utf8');
  mis = [];
  for (const p of ['/media/../server.js', '/media/..%2fserver.js', '/media/%2e%2e/server.js', '/media/%2e%2e%2fserver.js',
    '/media/..%5cserver.js', '/media/....//server.js', '/media/..;/server.js', '/media/%252e%252e/server.js',
    '/media/../data/db.json', '/media/%2e%2e/data/db.json', '/media/Klant%20A/../../server.js',
    '/media/%2e%2e%2f%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd', '/media//etc/passwd', '/media/.%2e/server.js']) {
    const rr = await rauw(A.port, 'GET', p);
    if (rr.status === 200 || rr.text.includes('hub.attach(server)') || rr.text.includes('"devices"') || rr.text.includes('root:x:0')) {
      mis.push(`${p} → ${rr.status}`);
    }
  }
  check('path traversal op /media/* geeft niets buiten media/ prijs', mis.length === 0, mis);
  r = await api.req('GET', '/api/media?folder=' + encodeURIComponent('../..'));
  check('GET /api/media?folder=../.. toont geen bestanden buiten media/', r.status < 500 && !(r.json?.files || []).some((f) => /server\.js|package\.json/.test(f.name)), { status: r.status, files: (r.json?.files || []).map((f) => f.name) });

  r = await api.req('POST', '/api/media/folder', { json: { path: 'Klant B/landscape' } });
  check('map aanmaken (genest) → 200 en bestaat', r.status === 200 && fs.existsSync(path.join(mediaRoot, 'Klant B', 'landscape')), r.status);
  r = await api.req('POST', '/api/media/folder', { json: { path: '../../ontsnapt' } });
  check('map met ../../ blijft binnen media/', !fs.existsSync(path.join(tijdelijk, 'ontsnapt')) && !fs.existsSync(path.join(dirA, 'ontsnapt')), r.status);
  r = await api.req('POST', '/api/media/folder', { json: {} });
  check('map aanmaken zonder path → 400', r.status === 400, { status: r.status, body: r.json });

  r = await api.req('POST', '/api/media/rename', { json: { from: 'Klant A/portrait/blauw.png', to: 'Klant B/landscape/blauw2.png' } });
  check('hernoemen/verplaatsen → 200 en bestand staat op nieuwe plek', r.status === 200 && fs.existsSync(path.join(mediaRoot, 'Klant B', 'landscape', 'blauw2.png')), r.status);
  r = await api.req('POST', '/api/media/rename', { json: { from: 'Klant B/landscape/blauw2.png', to: '../../gestolen.png' } });
  check('hernoemen naar ../../ → blijft binnen media/', !fs.existsSync(path.join(tijdelijk, 'gestolen.png')) && !fs.existsSync(path.join(dirA, 'gestolen.png')), { status: r.status, body: r.json });
  if (!fs.existsSync(path.join(mediaRoot, 'Klant B', 'landscape', 'blauw2.png'))) {
    // het bestand is (binnen media/) als gestolen.png terechtgekomen; terugzetten voor de rest van de test
    await api.req('POST', '/api/media/rename', { json: { from: 'gestolen.png', to: 'Klant B/landscape/blauw2.png' } });
  }
  r = await api.req('POST', '/api/media/rename', { json: { from: '../server.js', to: 'gestolen-server.js' } });
  check('hernoemen van ../server.js lukt niet (server.js blijft staan)', fs.existsSync(path.join(dirA, 'server.js')) && !fs.existsSync(path.join(mediaRoot, 'gestolen-server.js')), { status: r.status });
  r = await api.req('POST', '/api/media/rename', { json: { from: 'bestaat/niet.png', to: 'x.png' } });
  check('hernoemen van onbekend bestand → 404 (geen 500)', r.status === 404, { status: r.status, body: r.json });
  fd = new FormData();
  fd.append('files', new Blob([ROOD], { type: 'image/png' }), 'een.png');
  fd.append('files', new Blob([BLAUW], { type: 'image/png' }), 'twee.png');
  await api.req('POST', '/api/media/upload?folder=over', { body: fd });
  r = await api.req('POST', '/api/media/rename', { json: { from: 'over/een.png', to: 'over/twee.png' } });
  const tweeNu = fs.existsSync(path.join(mediaRoot, 'over', 'twee.png')) ? fs.readFileSync(path.join(mediaRoot, 'over', 'twee.png')) : Buffer.alloc(0);
  check('hernoemen overschrijft geen bestaand bestand (409)', r.status === 409 || tweeNu.equals(BLAUW), { status: r.status, tweeIsNuRood: tweeNu.equals(ROOD) });
  fd = new FormData();
  fd.append('files', new Blob([BLAUW], { type: 'image/png' }), 'een.png');
  await api.req('POST', '/api/media/upload?folder=over', { body: fd });
  fd = new FormData();
  fd.append('files', new Blob([ROOD], { type: 'image/png' }), 'een.png');
  r = await api.req('POST', '/api/media/upload?folder=over', { body: fd });
  meld(`upload met bestaande naam overschrijft stil het oude bestand (status ${r.status}, nu rood: ${fs.readFileSync(path.join(mediaRoot, 'over', 'een.png')).equals(ROOD)})`);

  for (const p of ['', '.', '..', './', 'over/..', '../..']) {
    r = await api.req('DELETE', '/api/media?path=' + encodeURIComponent(p));
    if (r.status !== 400 || !fs.existsSync(mediaRoot)) { check(`DELETE media?path="${p}" mag de hoofdmap niet wissen`, false, r.status); break; }
  }
  check('DELETE van de hoofdmap ("", ., .., ../..) → 400, media/ blijft', fs.existsSync(mediaRoot) && fs.existsSync(path.join(mediaRoot, 'Klant A')));
  r = await api.req('DELETE', '/api/media?path=' + encodeURIComponent('../server.js'));
  check('DELETE ../server.js wist niets buiten media/', fs.existsSync(path.join(dirA, 'server.js')), r.status);
  r = await api.req('DELETE', '/api/media?path=' + encodeURIComponent('../data'));
  check('DELETE ../data wist de database niet', fs.existsSync(path.join(dirA, 'data', 'db.json')), r.status);
  r = await api.req('DELETE', '/api/media?path=' + encodeURIComponent('over/twee.png'));
  check('DELETE bestand → 200 en weg', r.status === 200 && !fs.existsSync(path.join(mediaRoot, 'over', 'twee.png')), r.status);
  r = await api.req('DELETE', '/api/media?path=' + encodeURIComponent('veel'));
  check('DELETE map (met inhoud) → 200 en weg', r.status === 200 && !fs.existsSync(path.join(mediaRoot, 'veel')), r.status);
  check('serverbestanden na alle pogingen intact', fs.readFileSync(path.join(dirA, 'server.js'), 'utf8') === serverJs);

  /* ---------------- Playlists ---------------- */
  kop('Playlists');
  r = await api.req('POST', '/api/playlists', { json: { name: 'Presentatie 1' } });
  const PL1 = r.json || {};
  check('playlist aanmaken → 200, loop=true, items=[]', r.status === 200 && /^pl_/.test(PL1.id || '') && PL1.loop === true && Array.isArray(PL1.items), PL1);
  r = await api.req('POST', '/api/playlists', { json: {} });
  check('playlist zonder naam krijgt standaardnaam', r.json?.name === 'Nieuwe playlist', r.json?.name);
  const PLleeg = r.json || {};
  const items = [
    { type: 'image', name: 'Rood', mediaPath: 'Klant A/portrait/rood.png', durationSec: 5, fit: 'contain', onzin: 'weg' },
    { type: 'video', mediaPath: 'Klant A/portrait/film.mp4' },
    { type: 'video', mediaPath: 'bestaat/niet.mp4' },
    { type: 'live', liveSourceId: L1.id },
    { type: 'live', liveSourceId: L2.id },
    { type: 'url', url: 'https://klant.example/presentatie', durationSec: 60, interactive: true },
    { type: 'flash', url: 'x.swf' },
    { type: 'image', mediaPath: '../hoofd/server.js' }
  ];
  r = await api.req('PUT', `/api/playlists/${PL1.id}`, { json: { name: 'Presentatie 1b', loop: true, items } });
  check('PUT playlist met 8 items → 200, elk item krijgt een id', r.status === 200 && r.json?.items?.length === 8 && r.json.items.every((i) => /^it_/.test(i.id)), r.json?.items?.length);
  check('onbekende item-velden worden niet opgeslagen', r.json?.items?.[0] && !('onzin' in r.json.items[0]));
  check('naam aangepast', r.json?.name === 'Presentatie 1b');
  const itemId0 = r.json?.items?.[0]?.id;
  r = await api.req('PUT', `/api/playlists/${PL1.id}`, { json: { items: r.json.items } });
  check('bestaande item-ids blijven behouden bij opnieuw opslaan', r.json?.items?.[0]?.id === itemId0);
  r = await api.req('PUT', `/api/playlists/${PL1.id}`, { json: { loop: 'nee' } });
  check('loop met niet-boolean wordt genegeerd', r.json?.loop === true, r.json?.loop);
  r = await api.req('PUT', `/api/playlists/${PLleeg.id}`, { json: { items: [null, 5] } });
  check('PUT playlist met items [null, 5] → 400 (geen 500)', r.status === 400, { status: r.status, body: r.json });
  r = await api.req('PUT', '/api/playlists/pl_bestaatniet', { json: { name: 'x' } });
  check('PUT onbekende playlist → 404', r.status === 404, r.status);
  r = await api.req('GET', '/api/playlists');
  check('GET playlists bevat de playlist', (r.json || []).some((p) => p.id === PL1.id));

  /* ---------------- Manifest ---------------- */
  kop('Manifest per device');
  await api.req('PUT', `/api/devices/${D1.id}`, { json: { playlistId: PL1.id } });
  r = await anon.req('GET', `/api/v1/manifest/${D1.key}`);
  const mf = r.json || {};
  const mi = mf.items || [];
  check('manifest bevat alleen de 4 geldige items (ontbrekend bestand, verwijderde bron, onbekend type en ../-pad overgeslagen)',
    mi.length === 4 && mi.map((i) => i.type).join(',') === 'image,video,live,url', mi.map((i) => `${i.type}:${i.name}`));
  check('image: absolute URL, durationSec 5, fit contain, muted', mi[0]?.url === `${A.base}/media/Klant%20A/portrait/rood.png` && mi[0]?.durationSec === 5 && mi[0]?.fit === 'contain' && mi[0]?.muted === true, mi[0]);
  check('video zonder duur: durationSec null, naam = bestandsnaam', mi[1]?.durationSec === null && mi[1]?.name === 'film.mp4', mi[1]);
  check('live: protocol hls, relatieve URL absoluut gemaakt, naam van bron', mi[2]?.protocol === 'hls' && mi[2]?.url === `${A.base}/live/stream.m3u8` && mi[2]?.name === 'Studio HLS' && mi[2]?.lowLatency === true, mi[2]);
  check('url-item: interactive en duur behouden', mi[3]?.url === 'https://klant.example/presentatie' && mi[3]?.interactive === true && mi[3]?.durationSec === 60, mi[3]);
  check('device-blok: landscape → 3840x2160, rotatie 0', mf.device?.orientation === 'landscape' && mf.device?.resolution === '3840x2160' && mf.device?.rotation === 0, mf.device);
  check('playlist-blok en standaardinstellingen', mf.playlist?.id === PL1.id && mf.playlist?.loop === true && mf.pollIntervalSec === 30 && mf.transitionMs === 600 && mf.externalEndpoint === null && mf.version === 1,
    { playlist: mf.playlist, poll: mf.pollIntervalSec, tr: mf.transitionMs });
  r = await anon.req('GET', `/api/v1/manifest/${D2.key}`);
  check('device zonder playlist: playlist null, items []', r.json?.playlist === null && Array.isArray(r.json?.items) && r.json.items.length === 0 && r.json?.device?.resolution === '2160x3840', r.json?.device);
  await api.req('PUT', `/api/devices/${D2.id}`, { json: { externalEndpoint: 'https://klant.example/feed.json' } });
  r = await anon.req('GET', `/api/v1/manifest/${D2.key}`);
  check('externalEndpoint komt in het manifest', r.json?.externalEndpoint === 'https://klant.example/feed.json', r.json?.externalEndpoint);
  await api.req('PUT', `/api/devices/${D2.id}`, { json: { externalEndpoint: null } });
  r = await anon.req('GET', `/api/v1/manifest/${D1.key}`, { headers: { host: 'evil.example' } });
  meld(`manifest-URL's volgen de Host-header van het verzoek als PUBLIC_BASE_URL leeg is: ${r.json?.items?.[0]?.url}`);

  /* ---------------- Instellingen & systeem ---------------- */
  kop('Instellingen & systeeminfo');
  r = await api.req('GET', '/api/settings');
  check('GET settings → standaardwaarden', r.json?.pollIntervalSec === 30 && r.json?.transitionMs === 600 && r.json?.defaultOrientation === 'portrait', r.json);
  r = await api.req('PUT', '/api/settings', { json: { platformName: 'Test Platform', pollIntervalSec: 12, transitionMs: 300, onzin: 1 } });
  check('PUT settings → aangepast, onbekende sleutel genegeerd', r.json?.platformName === 'Test Platform' && r.json?.pollIntervalSec === 12 && !('onzin' in (r.json || {})), r.json);
  r = await anon.req('GET', `/api/v1/manifest/${D1.key}`);
  check('manifest volgt nieuwe instellingen', r.json?.pollIntervalSec === 12 && r.json?.transitionMs === 300 && r.json?.platform === 'Test Platform');
  r = await api.req('PUT', '/api/settings', { json: { pollIntervalSec: -5, transitionMs: 'snel', defaultOrientation: 'schuin' } });
  check('PUT settings valideert waarden (negatief interval, tekst, onbekende oriëntatie geweigerd)',
    r.status === 400 || (r.json?.pollIntervalSec === 12 && r.json?.transitionMs === 300 && r.json?.defaultOrientation === 'portrait'),
    { status: r.status, opgeslagen: r.json });
  await api.req('PUT', '/api/settings', { json: { pollIntervalSec: 12, transitionMs: 300, defaultOrientation: 'portrait' } });
  r = await api.req('GET', '/api/system');
  check('GET /api/system → hostname, poort, baseUrl', typeof r.json?.hostname === 'string' && r.json?.port === A.port && r.json?.baseUrl === A.base && Array.isArray(r.json?.interfaces), r.json);

  /* ---------------- Foutafhandeling ---------------- */
  kop('Foutafhandeling');
  const zonderBody = [
    ['POST', '/api/devices'], ['POST', '/api/playlists'], ['POST', '/api/live-sources'],
    ['POST', '/api/media/folder'], ['POST', '/api/media/rename'], ['PUT', `/api/devices/${D2.id}`],
    ['PUT', `/api/playlists/${PLleeg.id}`], ['PUT', `/api/live-sources/${L1.id}`],
    ['POST', `/api/devices/${D2.id}/command`], ['POST', `/api/devices/${D2.id}/studio/command`],
    ['PUT', `/api/devices/${D2.id}/studio/config`], ['PUT', '/api/settings']
  ];
  for (const [m, p] of zonderBody) {
    r = await api.req(m, p);
    check(`${m} ${p.replace(/(dev|pl|live)_[0-9a-f]+/, ':id')} zonder JSON-body → geen 500`, r.status < 500, { status: r.status, body: r.json });
  }
  r = await api.req('POST', '/api/devices', { body: '{kapot', headers: { 'content-type': 'application/json' } });
  check('ongeldige JSON → 400', r.status === 400, r.status);
  check('ongeldige JSON → JSON-fout zonder stacktrace/serverpaden', /json/.test(r.headers.get('content-type') || '') && !r.text.includes('node_modules') && !r.text.includes('JSON.parse'),
    { type: r.headers.get('content-type'), body: r.text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200) });
  r = await anon.req('POST', '/api/login', { body: '{kapot', headers: { 'content-type': 'application/json' } });
  check('ongeldige JSON op /api/login (zonder login) lekt geen stacktrace', !r.text.includes('node_modules'), { status: r.status, lekt: r.text.includes('node_modules') });
  r = await api.req('POST', '/api/devices', { json: { name: 'x'.repeat(7 * 1024 * 1024) } });
  check('body > 6 MB → 413', r.status === 413, r.status);
  r = await api.req('GET', '/api/bestaat-niet');
  check('onbekende API-route → 404', r.status === 404, r.status);
  for (const [m, p] of [['PUT', '/api/devices/dev_nope'], ['POST', '/api/devices/dev_nope/command'], ['GET', '/api/devices/dev_nope/studio'],
    ['POST', '/api/devices/dev_nope/studio/command'], ['PUT', '/api/devices/dev_nope/studio/config']]) {
    r = await api.req(m, p, m === 'GET' ? {} : { json: { name: 'x', command: 'identify', type: 'identify', config: {} } });
    check(`${m} ${p} (onbekend id) → 404`, r.status === 404, r.status);
  }
  for (const p of ['/api/devices/dev_nope', '/api/playlists/pl_nope', '/api/live-sources/live_nope']) {
    r = await api.req('DELETE', p);
    check(`DELETE ${p} (onbekend id) → 404`, r.status === 404, { status: r.status, body: r.json });
  }
  r = await api.req('POST', `/api/devices/${D1.id}/command`, { json: { command: 'format-c' } });
  check('onbekend commando → 400', r.status === 400, r.status);

  /* ---------------- WebSocket-hub ---------------- */
  kop('WebSocket-hub');
  const wsBase = A.base.replace('http://', 'ws://') + '/ws';
  let c = await wsOpen(wsBase);
  await Promise.race([c.closed, wacht(2000)]);
  check('WS zonder role → gesloten met 4000', c.closeCode === 4000, c.closeCode);
  c = await wsOpen(wsBase + '?role=player&key=fout');
  await Promise.race([c.closed, wacht(2000)]);
  check('player-WS met onbekende key → gesloten met 4001', c.closeCode === 4001, c.closeCode);
  c = await wsOpen(wsBase.replace('/ws', '/andere-ws'));
  check('WS op ander pad dan /ws wordt niet geaccepteerd', !c.open, c.open);

  const adminAnon = await wsOpen(wsBase + '?role=admin');
  const adminWs = await wsOpen(wsBase + '?role=admin', { headers: { cookie: api.cookie } });
  check('beheer-WS met sessie verbindt', adminWs.open);
  const p1 = await wsOpen(`${wsBase}?role=player&key=${D1.key}`);
  check('player-WS met geldige key blijft open', p1.open && p1.closeCode === null);
  check('beheer-WS krijgt device-online', !!(await wachtOp(() => heeftMsg(adminWs, 'device-online', (m) => m.deviceId === D1.id))), adminWs.msgs);
  await wacht(100);
  check('beheer-WS zónder sessie krijgt géén device-informatie (IP/status)',
    !heeftMsg(adminAnon, 'device-online'),
    { open: adminAnon.open, ontvangen: adminAnon.msgs.slice(0, 2) });
  r = await api.req('GET', '/api/devices');
  dd = (r.json || []).find((d) => d.id === D1.id) || {};
  check('device staat online in GET /api/devices met IP', dd.online === true && dd.lastIp === '127.0.0.1', { online: dd.online, ip: dd.lastIp });

  p1.msgs.length = 0;
  await api.req('PUT', `/api/playlists/${PL1.id}`, { json: { name: 'Presentatie 1c' } });
  check('playlistwijziging → player krijgt {type:"refresh"}', !!(await wachtOp(() => heeftMsg(p1, 'refresh'), 2000)), p1.msgs);
  p1.msgs.length = 0;
  r = await api.req('POST', `/api/devices/${D1.id}/command`, { json: { command: 'identify' } });
  check('commando identify → delivered=1', r.json?.delivered === 1, r.json);
  check('player krijgt {type:"identify"}', !!(await wachtOp(() => heeftMsg(p1, 'identify'), 2000)), p1.msgs);
  p1.msgs.length = 0;
  await api.req('PUT', `/api/devices/${D1.id}`, { json: { location: 'Rotterdam' } });
  check('device-wijziging → player krijgt refresh', !!(await wachtOp(() => heeftMsg(p1, 'refresh'), 2000)), p1.msgs);
  r = await api.req('POST', `/api/devices/${D2.id}/command`, { json: { command: 'reload' } });
  check('commando naar offline box → delivered=0', r.status === 200 && r.json?.delivered === 0, r.json);

  adminWs.msgs.length = 0;
  p1.ws.send(JSON.stringify({ type: 'status', nowPlaying: { id: 'it_x', name: 'rood.png', type: 'image' }, info: { ua: 'servertest' } }));
  check('status van player → beheer-WS krijgt device-status', !!(await wachtOp(() => heeftMsg(adminWs, 'device-status', (m) => m.nowPlaying?.name === 'rood.png'), 2000)), adminWs.msgs);
  r = await api.req('GET', '/api/devices');
  dd = (r.json || []).find((d) => d.id === D1.id) || {};
  check('status van player → nowPlaying en playerInfo opgeslagen', dd.nowPlaying?.name === 'rood.png' && dd.playerInfo?.ua === 'servertest', { nowPlaying: dd.nowPlaying, info: dd.playerInfo });
  p1.ws.send('geen json {{{');
  p1.ws.send(JSON.stringify({ type: 'onbekend' }));
  await wacht(200);
  r = await anon.req('GET', '/api/v1/health');
  check('rommel op de WS laat de server niet vallen', r.status === 200 && p1.closeCode === null);

  p1.msgs.length = 0;
  await api.req('PUT', `/api/live-sources/${L1.id}`, { json: { url: '/live/nieuw.m3u8' } });
  check('wijziging live-bron in de playlist → player krijgt refresh (README: "binnen een seconde op de box")', !!(await wachtOp(() => heeftMsg(p1, 'refresh'), 1500)), p1.msgs);
  p1.msgs.length = 0;
  await api.req('PUT', '/api/settings', { json: { transitionMs: 400 } });
  check('wijziging instellingen (transitie/poll) → player krijgt refresh', !!(await wachtOp(() => heeftMsg(p1, 'refresh'), 1500)), p1.msgs);

  const p1b = await wsOpen(`${wsBase}?role=player&key=${D1.key}`);
  await wacht(150);
  adminWs.msgs.length = 0;
  p1b.ws.close();
  await p1b.closed;
  await wacht(300);
  r = await api.req('GET', '/api/devices');
  dd = (r.json || []).find((d) => d.id === D1.id) || {};
  check('tweede verbinding van hetzelfde device dicht → device blijft online', dd.online === true, dd.online);
  check('…en beheer krijgt dan géén "device-offline" (box is nog verbonden)', !heeftMsg(adminWs, 'device-offline', (m) => m.deviceId === D1.id), adminWs.msgs);

  r = await api.req('POST', '/api/playlists', { json: { name: 'Wordt verwijderd' } });
  const PL2 = r.json || {};
  await api.req('PUT', `/api/devices/${D2.id}`, { json: { playlistId: PL2.id } });
  const p2 = await wsOpen(`${wsBase}?role=player&key=${D2.key}`);
  await wacht(150);
  p2.msgs.length = 0;
  r = await api.req('DELETE', `/api/playlists/${PL2.id}`);
  check('DELETE playlist → 200', r.status === 200);
  r = await api.req('GET', '/api/devices');
  dd = (r.json || []).find((d) => d.id === D2.id) || {};
  check('DELETE playlist ontkoppelt hem van het device', dd.playlistId === null, dd.playlistId);
  check('DELETE playlist → player van dat device krijgt refresh', !!(await wachtOp(() => heeftMsg(p2, 'refresh'), 1500)), p2.msgs);

  r = await api.req('POST', '/api/devices', { json: { name: 'Tijdelijke box' } });
  const D4 = r.json || {};
  const p4 = await wsOpen(`${wsBase}?role=player&key=${D4.key}`);
  await wacht(150);
  await api.req('DELETE', `/api/devices/${D4.id}`);
  await Promise.race([p4.closed, wacht(1500)]);
  check('DELETE device → open player-WS van die box wordt gesloten', p4.closeCode !== null, { closeCode: p4.closeCode });
  p4.ws.terminate();
  p2.ws.close();
  adminAnon.ws.close();

  /* ---------------- Studio-koppeling ---------------- */
  kop('Studio-koppeling (/api/v1/studio + beheer)');
  const SK = D1.key;
  r = await anon.req('POST', '/api/v1/studio/fout/heartbeat', { json: { status: {} } });
  check('studio-heartbeat met onbekende key → 404', r.status === 404, r.status);
  const status = { app: 'studio', version: '9.9.9', scene: 'Home', scenes: 2, buttons: 3, playing: false, volume: 80 };
  r = await anon.req('POST', `/api/v1/studio/${SK}/heartbeat`, { json: { status }, headers: { origin: 'null' } });
  check('studio-heartbeat → 200, commands [], configRev 0, pollIntervalSec', r.status === 200 && Array.isArray(r.json?.commands) && r.json.commands.length === 0 && r.json?.configRev === 0 && r.json?.pollIntervalSec === 12, r.json);
  check('studio-heartbeat-antwoord heeft CORS * (Studio draait vanaf file://)', r.headers.get('access-control-allow-origin') === '*');
  r = await anon.req('OPTIONS', `/api/v1/studio/${SK}/heartbeat`, { headers: { origin: 'null', 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type' } });
  check('CORS-preflight studio-heartbeat → 204', r.status === 204 && r.headers.get('access-control-allow-origin') === '*', r.status);
  r = await api.req('GET', `/api/devices/${D1.id}/studio`);
  check('beheer ziet lastStatus van de Studio', r.json?.lastStatus?.version === '9.9.9' && !!r.json?.lastStatusAt && r.json?.pendingCommands === 0 && !('screenshot' in (r.json || {})), r.json);
  r = await api.req('POST', `/api/devices/${D1.id}/studio/command`, { json: { type: 'formatteer' } });
  check('studio-commando met onbekend type → 400', r.status === 400, r.status);
  r = await api.req('POST', `/api/devices/${D1.id}/studio/command`, { json: { type: 'setVolume', value: 55 } });
  check('setVolume in de wachtrij → pending 1', r.json?.pending === 1, r.json);
  r = await api.req('POST', `/api/devices/${D1.id}/studio/command`, { json: { type: 'setVolume', value: 70 } });
  check('nogmaals setVolume → nieuwste wint, pending blijft 1', r.json?.pending === 1, r.json);
  r = await api.req('POST', `/api/devices/${D1.id}/studio/command`, { json: { type: 'identify' } });
  check('identify erbij → pending 2', r.json?.pending === 2, r.json);
  r = await anon.req('POST', `/api/v1/studio/${SK}/heartbeat`, { json: { status } });
  const cmds = r.json?.commands || [];
  check('heartbeat levert de 2 commando\'s (setVolume=70, identify)', cmds.length === 2 && cmds.find((x) => x.type === 'setVolume')?.value === 70 && cmds.some((x) => x.type === 'identify'), cmds);
  r = await anon.req('POST', `/api/v1/studio/${SK}/heartbeat`, { json: { status } });
  check('volgende heartbeat: wachtrij leeg', (r.json?.commands || []).length === 0, r.json?.commands);
  r = await api.req('PUT', `/api/devices/${D1.id}/studio/config`, { json: {} });
  check('ontwerp publiceren zonder config → 400', r.status === 400, r.status);
  r = await api.req('PUT', `/api/devices/${D1.id}/studio/config`, { json: { config: 'tekst' } });
  check('ontwerp publiceren met config als tekst → 400', r.status === 400, r.status);
  const ontwerp = { version: 8, scenes: [{ id: 's1', name: 'Home', buttons: [{ id: 'b1', label: 'Film' }] }], homeSceneId: 's1' };
  r = await api.req('PUT', `/api/devices/${D1.id}/studio/config`, { json: { config: ontwerp } });
  check('ontwerp publiceren → configRev 1', r.status === 200 && r.json?.configRev === 1, r.json);
  r = await anon.req('POST', `/api/v1/studio/${SK}/heartbeat`, { json: { status } });
  check('heartbeat meldt configRev 1 en publishConfig-commando', r.json?.configRev === 1 && (r.json?.commands || []).some((x) => x.type === 'publishConfig'), r.json);
  r = await anon.req('GET', `/api/v1/studio/${SK}/config`);
  check('GET studio-config → rev 1 met hetzelfde ontwerp, no-store, CORS *', r.json?.rev === 1 && JSON.stringify(r.json?.config) === JSON.stringify(ontwerp) && r.headers.get('cache-control') === 'no-store' && r.headers.get('access-control-allow-origin') === '*', { rev: r.json?.rev });
  r = await anon.req('GET', '/api/v1/studio/fout/config');
  check('GET studio-config met onbekende key → 404', r.status === 404, r.status);
  r = await anon.req('POST', `/api/v1/studio/${SK}/screenshot`, { json: { image: 'geen-dataurl' } });
  check('schermafdruk zonder dataURL → 400', r.status === 400, r.status);
  r = await anon.req('POST', `/api/v1/studio/${SK}/screenshot`, { json: { image: 'data:image/jpeg;base64,' + 'A'.repeat(3.2 * 1024 * 1024) } });
  check('schermafdruk > 3 MB → 413', r.status === 413, r.status);
  const shot = 'data:image/png;base64,' + ROOD.toString('base64');
  r = await anon.req('POST', `/api/v1/studio/${SK}/screenshot`, { json: { image: shot } });
  check('geldige schermafdruk → 200', r.status === 200 && r.json?.ok === true, r.json);
  r = await anon.req('POST', '/api/v1/studio/fout/screenshot', { json: { image: shot } });
  check('schermafdruk met onbekende key → 404', r.status === 404, r.status);
  r = await api.req('GET', `/api/devices/${D1.id}/studio?screenshot=1`);
  check('beheer haalt schermafdruk op met ?screenshot=1', r.json?.screenshot === shot && !!r.json?.screenshotAt);
  r = await api.req('GET', '/api/devices');
  dd = (r.json || []).find((d) => d.id === D1.id) || {};
  check('devicelijst bevat studio-samenvatting zonder ontwerp/schermafdruk', dd.studio?.configRev === 1 && !!dd.studio?.screenshotAt && !r.text.includes(ROOD.toString('base64').slice(0, 40)) && !r.text.includes('"buttons":[{'), dd.studio);
  r = await anon.req('POST', `/api/v1/studio/${SK}/heartbeat`);
  check('studio-heartbeat zonder body → 200', r.status === 200, r.status);

  /* ---------------- Avatar-sessie (LemonSlice, nagebootst) ---------------- */
  kop('Avatar-sessie /api/v1/avatar/session');
  const avatar = { id: 'a1', name: 'Anna', providerAvatarId: 'av_123', greeting: 'Hallo!', persona: 'Je bent Anna.' };
  const sessie = (body, extra = {}) => anon.req('POST', '/api/v1/avatar/session', { json: body, ...extra });
  r = await sessie({ key: 'fout' });
  check('onbekende device-key → 404', r.status === 404, r.status);
  r = await anon.req('POST', '/api/v1/avatar/session');
  check('zonder body → 404 (geen 500)', r.status === 404, r.status);
  r = await sessie({ key: D1.key, avatar });
  check('geen eigen sleutel en geen LEMONSLICE_API_KEY → 503 met uitleg', r.status === 503 && /LemonSlice/.test(r.json?.error || ''), r.status);
  const zetSleutel = (k) => api.req('PUT', `/api/devices/${D1.id}`, { json: { avatarKey: k } });
  await zetSleutel('mock-daily');
  let n0 = mock.calls.length;
  r = await sessie({ key: D1.key, provider: 'lemonslice', probe: false, avatar });
  check('Daily-kamer: 200 met url, transport daily, sessionId, controlUrl, keySource device',
    r.status === 200 && r.json?.url === 'https://hwh.daily.co/kamer1' && r.json?.transport === 'daily' && r.json?.token === null && r.json?.sessionId === 'sess_1' && r.json?.controlUrl === 'https://lemonslice.example/ctl/1' && r.json?.keySource === 'device', r.json);
  const call = mock.calls[n0] || {};
  check('server stuurt eigen sleutel als x-api-key naar de aanbieder', call.key === 'mock-daily' && call.method === 'POST' && call.path === '/api/liveai/sessions', { key: call.key, path: call.path });
  check('server geeft avatar_id, greeting, system_prompt en metadata door',
    call.body?.avatar_id === 'av_123' && call.body?.greeting === 'Hallo!' && call.body?.system_prompt === 'Je bent Anna.' && call.body?.metadata?.device === D1.id && call.body?.metadata?.avatar === 'Anna', call.body);
  check('sleutel van de aanbieder komt niet in het antwoord', !r.text.includes('mock-daily'));
  await zetSleutel('mock-livekit');
  r = await sessie({ key: D1.key, avatar });
  check('LiveKit: transport livekit met token', r.status === 200 && r.json?.transport === 'livekit' && r.json?.token === 'tok123' && r.json?.url === 'wss://lk.example/x', r.json);
  await zetSleutel('mock-livekit-notoken');
  r = await sessie({ key: D1.key, avatar });
  check('LiveKit zonder token → 502 met hint LEMONSLICE_TOKEN_FIELD', r.status === 502 && /LEMONSLICE_TOKEN_FIELD/.test(r.json?.error || ''), r.json);
  await zetSleutel('mock-nested');
  r = await sessie({ key: D1.key, avatar: null });
  check('genest antwoord (data.room_url) wordt herkend; avatar null mag', r.status === 200 && r.json?.url === 'https://x.daily.co/genest' && r.json?.sessionId === 'n1', r.json);
  await zetSleutel('mock-weird');
  r = await sessie({ key: D1.key, avatar });
  check('onherkenbaar antwoord → 502 met lijst ontvangen velden', r.status === 502 && JSON.stringify(r.json?.received) === '["foo","bar"]', r.json);
  await zetSleutel('mock-500');
  r = await sessie({ key: D1.key, avatar });
  check('aanbieder 500 → 502 met detail en keySource', r.status === 502 && r.json?.detail === 'provider kapot' && r.json?.keySource === 'device', r.json);
  await zetSleutel('mock-close');
  r = await sessie({ key: D1.key, avatar });
  check('aanbieder verbreekt verbinding → 502 "niet bereikbaar"', r.status === 502 && /niet bereikbaar/.test(r.json?.error || ''), r.json);
  await zetSleutel('mock-daily');
  n0 = mock.calls.length;
  r = await sessie({ key: D1.key, avatar, probe: true });
  meld(`probe:true (knop "Test" in de Studio) start tóch een echte sessie bij de aanbieder: aanroepen=${mock.calls.length - n0}, antwoord probe=${r.json?.probe}`);
  r = await anon.req('OPTIONS', '/api/v1/avatar/session', { headers: { origin: 'null', 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type' } });
  check('CORS-preflight avatar-sessie → 204', r.status === 204 && r.headers.get('access-control-allow-origin') === '*', r.status);
  await zetSleutel('mock-hang');
  {
    const t0 = Date.now();
    let status = 'geen antwoord';
    try {
      r = await sessie({ key: D1.key, avatar }, { signal: AbortSignal.timeout(6000) });
      status = r.status;
    } catch { /* afgebroken */ }
    check('hangende aanbieder → server antwoordt binnen 6 s met een fout (time-out)', status !== 'geen antwoord', { status, ms: Date.now() - t0 });
  }
  await zetSleutel('');

  /* ---------------- Pagina's in de browser ---------------- */
  kop('Pagina\'s in Chromium (Playwright)');
  const pw = laadPlaywright();
  if (!pw) {
    // Op GitHub moet alles echt draaien; lokaal mag het overslaan.
    if (process.env.CI) check('Playwright gevonden (paginatests)', false);
    meld('Playwright niet gevonden — paginatests OVERGESLAGEN (zet NODE_PATH=/opt/node-tools/node_modules)');
  } else {
    await paginaTests(pw, { A, api, anon, D1, PL1, mock });
  }

  /* ---------------- Tweede instantie: standaardwachtwoord, huissleutel, PUBLIC_BASE_URL ---------------- */
  kop('Tweede instantie: standaardwachtwoord, LEMONSLICE_API_KEY, PUBLIC_BASE_URL');
  const dirB = maakKopie('tweede');
  const B = await startServer(dirB, { LEMONSLICE_API_KEY: 'house-key', LEMONSLICE_SESSION_URL: mock.url, PUBLIC_BASE_URL: 'https://cms.voorbeeld.nl/' });
  check('waarschuwing in log bij standaardwachtwoord', /ADMIN_PASSWORD is niet gezet/.test(B.log), B.log.slice(-200));
  const apiB = maakClient(B.base);
  r = await apiB.req('POST', '/api/login', { json: { password: 'hereweholo' } });
  check('standaardwachtwoord "hereweholo" werkt zonder ADMIN_PASSWORD, defaultPassword=true', r.status === 200 && r.json?.defaultPassword === true, r.json);
  r = await apiB.req('GET', '/api/session');
  check('sessie meldt defaultPassword=true (CMS toont waarschuwing)', r.json?.defaultPassword === true, r.json);
  r = await apiB.req('POST', '/api/devices', { json: { name: 'B-box' } });
  const DB1 = r.json || {};
  fd = new FormData();
  fd.append('files', new Blob([ROOD], { type: 'image/png' }), 'rood.png');
  await apiB.req('POST', '/api/media/upload', { body: fd });
  r = await apiB.req('POST', '/api/playlists', { json: { name: 'B' } });
  await apiB.req('PUT', `/api/playlists/${r.json.id}`, { json: { items: [{ type: 'image', mediaPath: 'rood.png' }] } });
  await apiB.req('PUT', `/api/devices/${DB1.id}`, { json: { playlistId: r.json.id } });
  r = await apiB.req('GET', `/api/v1/manifest/${DB1.key}`);
  check('PUBLIC_BASE_URL (met / aan het eind) bepaalt de media-URL\'s', r.json?.items?.[0]?.url === 'https://cms.voorbeeld.nl/media/rood.png', r.json?.items?.[0]?.url);
  r = await apiB.req('GET', '/api/system');
  check('/api/system toont PUBLIC_BASE_URL als baseUrl', r.json?.baseUrl === 'https://cms.voorbeeld.nl', r.json?.baseUrl);
  n0 = mock.calls.length;
  r = await apiB.req('POST', '/api/v1/avatar/session', { json: { key: DB1.key, avatar } });
  check('zonder eigen sleutel: sleutel van het huis, keySource server', r.status === 200 && r.json?.keySource === 'server' && mock.calls[n0]?.key === 'house-key', { status: r.status, keySource: r.json?.keySource, key: mock.calls[n0]?.key });
  await apiB.req('PUT', `/api/devices/${DB1.id}`, { json: { avatarKey: 'mock-daily' } });
  n0 = mock.calls.length;
  r = await apiB.req('POST', '/api/v1/avatar/session', { json: { key: DB1.key, avatar } });
  check('eigen sleutel van de box gaat vóór de huissleutel', r.json?.keySource === 'device' && mock.calls[n0]?.key === 'mock-daily', { keySource: r.json?.keySource, key: mock.calls[n0]?.key });
  {
    const anonB = maakClient(B.base);
    const st = [];
    for (let i = 0; i < 12; i++) st.push((await anonB.req('POST', '/api/login', { json: { password: 'raden' + i } })).status);
    check('inlogrem: 10 foute wachtwoorden → 401, daarna 429', st.slice(0, 10).every((x) => x === 401) && st.slice(10).every((x) => x === 429), st);
    const rr = await anonB.req('POST', '/api/login', { json: { password: 'hereweholo' } });
    check('…dan wacht ook het juiste wachtwoord (429 met Retry-After)', rr.status === 429 && Number(rr.headers.get('retry-after')) > 0, { status: rr.status, ra: rr.headers.get('retry-after') });
  }
  await stopServer(B);

  /* ---------------- Persistentie & herstart ---------------- */
  kop('Persistentie & herstart');
  await wacht(300);
  const oudeCookie = api.cookie;
  const resA = await stopServer(A);
  check('SIGTERM → server stopt netjes (exit 0)', resA.code === 0, resA);
  const dbFile = path.join(dirA, 'data', 'db.json');
  let db = {};
  try { db = JSON.parse(fs.readFileSync(dbFile, 'utf8')); } catch { /* leeg */ }
  check('db.json in de tijdelijke map bevat devices, playlists en live-bronnen', db.devices?.some((d) => d.id === D1.id) && db.playlists?.some((p) => p.id === PL1.id) && db.liveSources?.some((s) => s.id === L1.id));
  A = await startServer(dirA, envA);
  api = maakClient(A.base);
  anon = maakClient(A.base, { bewaarCookie: false });
  r = await api.req('GET', '/api/devices', { headers: { cookie: oudeCookie } });
  check('na herstart is een oude sessie ongeldig (sessies staan in het geheugen)', r.status === 401, r.status);
  await api.req('POST', '/api/login', { json: { password: WACHTWOORD } });
  r = await api.req('GET', '/api/devices');
  check('na herstart zijn de devices er nog', (r.json || []).some((d) => d.id === D1.id && d.key === D1.key));
  r = await fetch(`${A.base}/api/v1/manifest/${D1.key}`).then((x) => x.json());
  check('na herstart werkt het manifest van D1 nog (zelfde playlist)', r.playlist?.id === PL1.id && r.items?.length === 4, r.playlist);
  await stopServer(A);

  kop('Kapotte database');
  const dirC = maakKopie('corrupt');
  fs.mkdirSync(path.join(dirC, 'data'));
  const kapot = '{"devices": [{"id": "dev_1", "key": "abc", "name": "Belangrijke box"}], "playlists": [ ,, }';
  fs.writeFileSync(path.join(dirC, 'data', 'db.json'), kapot);
  let C = null;
  try { C = await startServer(dirC, { ADMIN_PASSWORD: WACHTWOORD }); } catch { /* weigeren te starten is ook prima */ }
  const nu = fs.readFileSync(path.join(dirC, 'data', 'db.json'), 'utf8');
  const bestanden = fs.readdirSync(path.join(dirC, 'data'));
  const backupBestaat = bestanden.some((f) => f !== 'db.json' && fs.readFileSync(path.join(dirC, 'data', f), 'utf8') === kapot);
  check('kapotte db.json wordt niet stil vervangen door een lege database (geen backup = dataverlies)', nu === kapot || backupBestaat,
    { gestart: !!C, bestanden, dbNu: nu.slice(0, 80) });
  if (C) await stopServer(C);

  kop('Opruimen');
  check('de data/-map van de repo is niet aangemaakt of gewijzigd',
    repoDataBestond ? (repoDbVoor === null || fs.readFileSync(path.join(ROOT, 'data', 'db.json')).equals(repoDbVoor)) : !fs.existsSync(path.join(ROOT, 'data')));
  check('de media/-map van de repo is niet aangemaakt', repoMediaBestond || !fs.existsSync(path.join(ROOT, 'media')));
  mock.server.closeAllConnections?.();
  mock.server.close();
}

/* ---------------- Paginatests (Playwright) ---------------- */

async function paginaTests(pw, { A, api, anon, D1, mock }) {
  const browser = await pw.chromium.launch({
    executablePath: CHROMIUM,
    args: ['--autoplay-policy=no-user-gesture-required']
  });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const volg = (page, lijst) => {
      page.on('pageerror', (e) => lijst.push('pageerror: ' + e.message));
      page.on('console', (m) => {
        if (m.type() === 'error' && !/favicon/i.test(m.text()) && !/Failed to load resource: the server responded with a status of 40[14]/.test(m.text())) lijst.push('console: ' + m.text());
      });
    };

    // ---- CMS ----
    const page = await ctx.newPage();
    const cmsFouten = [];
    volg(page, cmsFouten);
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    await page.goto(A.base + '/admin');
    await page.waitForSelector('#loginView:not(.hidden)', { timeout: 5000 }).catch(() => {});
    check('CMS: /admin toont het loginscherm', await page.isVisible('#loginView') && !(await page.isVisible('#appView')));
    await page.fill('#loginPassword', 'fout-wachtwoord');
    await page.click('#loginForm button[type=submit]');
    await page.waitForFunction(() => document.querySelector('#loginError').textContent.length > 0, null, { timeout: 3000 }).catch(() => {});
    const loginFout = await page.textContent('#loginError');
    check('CMS: fout wachtwoord toont "Onjuist wachtwoord"', loginFout === 'Onjuist wachtwoord', loginFout);
    await page.fill('#loginPassword', WACHTWOORD);
    await page.click('#loginForm button[type=submit]');
    await page.waitForSelector('#appView:not(.hidden)', { timeout: 5000 }).catch(() => {});
    check('CMS: inloggen toont het dashboard', await page.isVisible('#appView'));
    check('CMS: geen wachtwoord-waarschuwing bij eigen ADMIN_PASSWORD', !(await page.isVisible('#passwordWarning')));
    await page.waitForFunction((naam) => document.querySelector('#deviceList')?.textContent.includes(naam), 'Box Showroom A', { timeout: 5000 }).catch(() => {});
    check('CMS: devicelijst toont de holoboxen', (await page.textContent('#deviceList')).includes('Box Showroom A'));
    check('CMS: beheer-WebSocket verbonden (groen bolletje)', !!(await page.waitForSelector('#connState.online', { timeout: 4000 }).catch(() => null)));

    for (const tab of ['media', 'playlists', 'live', 'integratie', 'instellingen', 'dashboard']) {
      await page.click(`.sidebar nav button[data-tab="${tab}"]`);
      await page.waitForTimeout(250);
      check(`CMS: tabblad "${tab}" zichtbaar`, await page.isVisible(`#tab-${tab}`));
    }
    await page.click('.sidebar nav button[data-tab="media"]');
    await page.click('#folderList .folder-item span:has-text("Klant A")');
    await page.click('#folderList .folder-item span:has-text("portrait")');
    await page.waitForFunction(() => document.querySelector('#fileTable tbody')?.textContent.includes('rood.png'), null, { timeout: 4000 }).catch(() => {});
    check('CMS: mediatabel toont rood.png en film.mp4 in Klant A/portrait', (await page.textContent('#fileTable tbody')).includes('film.mp4'));
    await page.click('.sidebar nav button[data-tab="playlists"]');
    check('CMS: playlistlijst toont de playlist', (await page.textContent('#playlistList')).includes('Presentatie 1c'));
    await page.click('#playlistList .folder-item:has-text("Presentatie 1c")');
    await page.waitForSelector('#playlistEditor .pl-item', { timeout: 4000 }).catch(() => {});
    check('CMS: playlist-editor toont 8 items', (await page.$$('#playlistEditor .pl-item')).length === 8);
    await page.click('.sidebar nav button[data-tab="live"]');
    check('CMS: live-bronnen tonen "Studio HLS"', (await page.textContent('#liveList')).includes('Studio HLS'));
    await page.click('.sidebar nav button[data-tab="integratie"]');
    await page.waitForFunction((k) => document.querySelector('#integrationInfo')?.textContent.includes(k), D1.key, { timeout: 4000 }).catch(() => {});
    check('CMS: integratiepagina toont manifest-URL met device-key', (await page.textContent('#integrationInfo')).includes(`/api/v1/manifest/${D1.key}`));
    await page.click('.sidebar nav button[data-tab="instellingen"]');
    check('CMS: instellingenformulier gevuld', (await page.inputValue('#settingsForm [name=platformName]')) === 'Test Platform');
    await page.fill('#settingsForm [name=platformName]', 'Via het CMS');
    await page.click('#settingsForm button');
    await page.waitForTimeout(400);
    let r = await api.req('GET', '/api/settings');
    check('CMS: instellingen opslaan werkt', r.json?.platformName === 'Via het CMS', r.json?.platformName);

    await page.click('.sidebar nav button[data-tab="dashboard"]');
    page.removeAllListeners('dialog');
    page.once('dialog', (d) => d.accept('UI-holobox'));
    await page.click('#addDeviceBtn');
    await page.waitForFunction(() => document.querySelector('#deviceList')?.textContent.includes('UI-holobox'), null, { timeout: 4000 }).catch(() => {});
    r = await api.req('GET', '/api/devices');
    check('CMS: holobox toevoegen via de knop werkt', (r.json || []).some((d) => d.name === 'UI-holobox') && (await page.textContent('#deviceList')).includes('UI-holobox'));
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    check('CMS: geen JS-fouten', cmsFouten.length === 0, cmsFouten);

    // ---- Player ----
    r = await api.req('POST', '/api/devices', { json: { name: 'Player-box' } });
    const P = r.json;
    r = await api.req('POST', '/api/playlists', { json: { name: 'Player-lijst' } });
    const PLP = r.json;
    await api.req('PUT', `/api/playlists/${PLP.id}`, { json: { items: [{ type: 'image', mediaPath: 'Klant A/portrait/rood.png', durationSec: 3 }] } });
    await api.req('PUT', `/api/devices/${P.id}`, { json: { playlistId: PLP.id } });

    const pp = await ctx.newPage();
    const playerFouten = [];
    volg(pp, playerFouten);
    await pp.goto(`${A.base}/player/${P.key}`);
    const zichtbaar = (naam, ms = 6000) => pp.waitForSelector(`.layer.visible img[src*="${naam}"]`, { timeout: ms }).then(() => true).catch(() => false);
    check('player: toont de afbeelding uit de playlist', await zichtbaar('rood.png', 8000));
    r = await api.req('GET', '/api/devices');
    check('player: box staat online in het CMS', (r.json || []).find((d) => d.id === P.id)?.online === true);
    await api.req('PUT', `/api/playlists/${PLP.id}`, { json: { items: [{ type: 'image', mediaPath: 'Klant B/landscape/blauw2.png', durationSec: 3 }] } });
    check('player: nieuwe content binnen 4 s na playlistwijziging (WS-push)', await zichtbaar('blauw2.png', 4000));
    await api.req('POST', `/api/devices/${P.id}/command`, { json: { command: 'identify' } });
    check('player: identify toont naam van de box', !!(await pp.waitForSelector('#identify.show', { timeout: 3000 }).catch(() => null)) && (await pp.textContent('#identify')).includes('Player-box'));
    await api.req('POST', `/api/devices/${P.id}/command`, { json: { command: 'black' } });
    check('player: commando black → zwart scherm', !!(await pp.waitForSelector('#black.show', { timeout: 3000 }).catch(() => null)));
    await api.req('POST', `/api/devices/${P.id}/command`, { json: { command: 'wake' } });
    check('player: commando wake → zwart weg', !!(await pp.waitForFunction(() => !document.getElementById('black').classList.contains('show'), null, { timeout: 3000 }).catch(() => null)));
    await api.req('PUT', `/api/devices/${P.id}`, { json: { rotation: 90 } });
    check('player: rotatie 90 → podium gedraaid', !!(await pp.waitForFunction(() => document.getElementById('stage').style.transform === 'rotate(90deg)', null, { timeout: 3000 }).catch(() => null)));
    r = await api.req('GET', '/api/devices');
    check('player: "speelt nu" komt in het CMS', /blauw2\.png/.test((r.json || []).find((d) => d.id === P.id)?.nowPlaying?.name || ''), (r.json || []).find((d) => d.id === P.id)?.nowPlaying);
    check('player: geen JS-fouten', playerFouten.length === 0, playerFouten);

    // Niet-loopende playlist: na één keer afspelen moet nieuwe content toch verschijnen.
    r = await api.req('POST', '/api/devices', { json: { name: 'Eenmalig-box' } });
    const Q = r.json;
    r = await api.req('POST', '/api/playlists', { json: { name: 'Eenmalig' } });
    const PLQ = r.json;
    await api.req('PUT', `/api/playlists/${PLQ.id}`, { json: { loop: false, items: [{ type: 'image', mediaPath: 'Klant A/portrait/rood.png', durationSec: 1 }] } });
    await api.req('PUT', `/api/devices/${Q.id}`, { json: { playlistId: PLQ.id } });
    const pq = await ctx.newPage();
    await pq.goto(`${A.base}/player/${Q.key}`);
    const zichtbaarQ = (naam, ms) => pq.waitForSelector(`.layer.visible img[src*="${naam}"]`, { timeout: ms }).then(() => true).catch(() => false);
    check('player (loop uit): eerste afbeelding verschijnt', await zichtbaarQ('rood.png', 8000));
    await pq.waitForTimeout(2500); // één keer helemaal afgespeeld
    await api.req('PUT', `/api/playlists/${PLQ.id}`, { json: { items: [{ type: 'image', mediaPath: 'Klant B/landscape/blauw2.png', durationSec: 1 }] } });
    check('player (loop uit): na één doorloop verschijnt nieuwe content na wijziging', await zichtbaarQ('blauw2.png', 5000));

    // HLS-bron die faalt: na overschakelen naar het volgende item mag de player
    // die stream niet blijven opvragen (hls.js-instantie hoort opgeruimd te worden).
    r = await api.req('POST', '/api/live-sources', { json: { name: 'Kapotte HLS', protocol: 'hls', url: '/live/bestaat-niet.m3u8' } });
    const LK = r.json;
    r = await api.req('POST', '/api/devices', { json: { name: 'HLS-box' } });
    const H = r.json;
    r = await api.req('POST', '/api/playlists', { json: { name: 'HLS-lijst' } });
    await api.req('PUT', `/api/playlists/${r.json.id}`, { json: { items: [
      { type: 'live', liveSourceId: LK.id, durationSec: 2 },
      { type: 'image', mediaPath: 'Klant A/portrait/rood.png', durationSec: 60 }
    ] } });
    await api.req('PUT', `/api/devices/${H.id}`, { json: { playlistId: r.json.id } });
    const ph = await ctx.newPage();
    let m3u8 = 0;
    ph.on('request', (rq) => { if (rq.url().includes('bestaat-niet.m3u8')) m3u8++; });
    await ph.goto(`${A.base}/player/${H.key}`);
    const naarBeeld = await ph.waitForSelector('.layer.visible img[src*="rood.png"]', { timeout: 10000 }).then(() => true).catch(() => false);
    const hlsGeladen = await ph.evaluate(() => !!(window.Hls && window.Hls.isSupported()));
    const voor = m3u8;
    await ph.waitForTimeout(8000);
    check('player: na HLS-item → volgende item verschijnt', naarBeeld, { hlsGeladen, m3u8VerzoekenTijdensLiveItem: voor });
    check('player: kapotte HLS-stream wordt na overschakelen niet meer opgevraagd (hls.js opgeruimd)', naarBeeld && m3u8 - voor === 0,
      { extraM3u8VerzoekenIn8sTerwijlAfbeeldingSpeelt: m3u8 - voor });
    await ph.close();

    // Externe endpoint (Portl-stijl): feed gaat voor; bij een kapotte feed terugvallen op de eigen playlist.
    mock.feeds['feed-ok'] = { items: [{ type: 'image', url: `${A.base}/media/Klant%20B/landscape/blauw2.png`, durationSec: 30 }] };
    r = await api.req('POST', '/api/playlists', { json: { name: 'Lokaal' } });
    const PLL = r.json;
    await api.req('PUT', `/api/playlists/${PLL.id}`, { json: { items: [{ type: 'image', mediaPath: 'Klant A/portrait/rood.png', durationSec: 30 }] } });
    for (const [naam, feed, verwacht] of [['Feed-box', 'feed-ok', 'blauw2.png'], ['Fallback-box', 'feed-kapot', 'rood.png']]) {
      r = await api.req('POST', '/api/devices', { json: { name: naam } });
      await api.req('PUT', `/api/devices/${r.json.id}`, { json: { playlistId: PLL.id, externalEndpoint: `${mock.origin}/${feed}` } });
      const pe = await ctx.newPage();
      await pe.goto(`${A.base}/player/${r.json.key}`);
      const gezien = await pe.waitForSelector(`.layer.visible img[src*="${verwacht}"]`, { timeout: 8000 }).then(() => true).catch(() => false);
      check(feed === 'feed-ok' ? 'player: externe endpoint gaat voor op de eigen playlist' : 'player: kapotte externe endpoint → terugval op eigen playlist', gezien);
      await pe.close();
    }

    // Ongeldige key
    const px = await ctx.newPage();
    const pxFouten = [];
    volg(px, pxFouten);
    await px.goto(`${A.base}/player/000000000000000000000000`);
    check('player met onbekende key: melding "Geen verbinding"', !!(await px.waitForFunction(() => /Geen verbinding/.test(document.getElementById('messageText').textContent), null, { timeout: 4000 }).catch(() => null)));
    await px.goto(`${A.base}/player/`);
    check('player zonder key: melding "Geen device-key"', !!(await px.waitForFunction(() => /Geen device-key/.test(document.getElementById('messageText').textContent), null, { timeout: 4000 }).catch(() => null)));
    await px.close(); await pq.close(); await pp.close();

    // ---- XSS via schermafdruk van een (gestolen) device-key ----
    // De naam van de box bevat HTML: de popup moet hem als tekst tonen.
    r = await api.req('POST', '/api/devices', { json: { name: 'XSS-box <img src=x onerror="fetch(\'/api/devices\').then(r=>r.json()).then(d=>{document.title=\'XSS:\'+d.length})">' } });
    const X = r.json;
    const payload = 'data:image/png;base64,AAAA" onerror="fetch(\'/api/devices\').then(r=>r.json()).then(d=>{document.title=\'XSS:\'+d.length})';
    r = await anon.req('POST', `/api/v1/studio/${X.key}/screenshot`, { json: { image: payload } });
    check('server weigert een schermafdruk met HTML erin (alleen een echte base64-dataURL)', r.status === 400, r.status);
    r = await anon.req('POST', `/api/v1/studio/${X.key}/screenshot`, { json: { image: 'data:image/png;base64,' + ROOD.toString('base64') } });
    check('…en neemt een echte PNG-dataURL wel aan', r.status === 200, r.status);
    await page.click('.sidebar nav button[data-tab="instellingen"]');
    await page.click('.sidebar nav button[data-tab="dashboard"]');
    await page.waitForFunction(() => document.querySelector('#deviceList')?.textContent.includes('XSS-box'), null, { timeout: 4000 }).catch(() => {});
    const kaart = page.locator('#deviceList .card', { hasText: 'XSS-box' });
    const popupBelofte = page.waitForEvent('popup', { timeout: 25000 }).catch(() => null);
    await kaart.locator('button', { hasText: 'Schermafdruk' }).click();
    console.log('   … wacht 15 s op de schermafdruk-popup van het CMS');
    const popup = await popupBelofte;
    let titel = '(geen popup)';
    if (popup) {
      await wachtOp(async () => /^XSS:/.test(await popup.title().catch(() => '')), 4000, 100);
      titel = await popup.title().catch(() => '?');
    }
    check('CMS: schermafdruk van een box kan geen script uitvoeren met de beheersessie (stored XSS)', !/^XSS:/.test(titel), { popupTitel: titel });
    if (popup) await popup.close().catch(() => {});
    await ctx.close();

    await studioTests(browser, { A, api, mock });
  } finally {
    await browser.close();
  }
}

/* ---------------- De echte Studio (studio/index.html) tegen deze server ---------------- */

async function studioTests(browser, { A, api }) {
  kop('Studio-pagina (studio/index.html) ↔ server, end-to-end');
  const studioPad = path.join(ROOT, 'studio', 'index.html');
  if (!fs.existsSync(studioPad)) { meld('studio/index.html niet gevonden — overgeslagen'); return; }
  let r = await api.req('POST', '/api/devices', { json: { name: 'Studio-box' } });
  const S = r.json;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const sp = await ctx.newPage();
  const fouten = [];
  sp.on('pageerror', (e) => fouten.push(e.message));
  await sp.goto(require('url').pathToFileURL(studioPad).href);
  const klaar = await sp.waitForFunction(() => typeof applyRemoteSettings === 'function' && typeof requestAvatarSession === 'function' && typeof config === 'object', null, { timeout: 15000 }).then(() => true).catch(() => false);
  check('Studio geladen (applyRemoteSettings/requestAvatarSession aanwezig)', klaar);
  if (!klaar) { await ctx.close(); return; }
  await sp.evaluate(({ url, key }) => {
    Object.assign(config.remote, { enabled: true, url, key, intervalSec: 5, allowConfig: true });
    save(); applyRemoteSettings();
  }, { url: A.base, key: S.key });
  const status = await wachtOp(async () => {
    const x = await api.req('GET', `/api/devices/${S.id}/studio`);
    return x.json?.lastStatus?.app === 'studio' ? x.json.lastStatus : null;
  }, 8000, 250);
  check('Studio → POST /api/v1/studio/:key/heartbeat komt aan met status', !!status, status);
  r = await api.req('GET', '/api/devices');
  check('Studio-box staat met lastSeen in de devicelijst', !!(r.json || []).find((d) => d.id === S.id)?.lastSeen);

  await api.req('POST', `/api/devices/${S.id}/studio/command`, { json: { type: 'setVolume', value: 33 } });
  await api.req('POST', `/api/devices/${S.id}/studio/command`, { json: { type: 'screenshot' } });
  const vol = await wachtOp(() => sp.evaluate(() => config.masterVolume === 33), 12000, 250);
  check('setVolume uit de wachtrij wordt door de Studio uitgevoerd (volume 33)', !!vol, await sp.evaluate(() => config.masterVolume));
  const shot = await wachtOp(async () => {
    const x = await api.req('GET', `/api/devices/${S.id}/studio?screenshot=1`);
    return x.json?.screenshot || null;
  }, 12000, 250);
  check('screenshot-commando → Studio levert een JPEG-dataURL aan', typeof shot === 'string' && shot.startsWith('data:image/jpeg'), (shot || '').slice(0, 30));
  // Publiceren pas ná het volume: een gepubliceerd ontwerp vervangt de hele config
  // (inclusief masterVolume), dus in dezelfde hartslag wint de publicatie.
  const cfg = await sp.evaluate(() => JSON.parse(JSON.stringify(config)));
  const nieuweNaam = 'Scène van de server';
  if (cfg.scenes && cfg.scenes[0]) cfg.scenes[0].name = nieuweNaam;
  cfg.remote = { enabled: false, url: 'http://verkeerd.example', key: 'verkeerd' };
  await api.req('PUT', `/api/devices/${S.id}/studio/config`, { json: { config: cfg } });
  const naam = await wachtOp(() => sp.evaluate((n) => config.scenes?.[0]?.name === n, nieuweNaam), 12000, 250);
  check('gepubliceerd ontwerp komt in de Studio aan (GET /api/v1/studio/:key/config)', !!naam, await sp.evaluate(() => config.scenes?.[0]?.name));
  const remote = await sp.evaluate(() => ({ url: config.remote.url, key: config.remote.key, enabled: config.remote.enabled }));
  check('publicatie breekt de koppeling niet (remote-instellingen blijven)', remote.url === A.base && remote.key === S.key && remote.enabled === true, remote);

  await api.req('PUT', `/api/devices/${S.id}`, { json: { avatarKey: 'mock-daily' } });
  let av = await sp.evaluate(() => requestAvatarSession({ id: 'a1', name: 'Anna', providerAvatarId: 'av_1', greeting: 'Hoi', persona: 'x' }, { probe: true }));
  check('Studio requestAvatarSession → ok met Daily-kamer en keySource device', av.ok === true && av.url === 'https://hwh.daily.co/kamer1' && av.transport === 'daily' && av.keySource === 'device', av);
  await api.req('PUT', `/api/devices/${S.id}`, { json: { avatarKey: '' } });
  av = await sp.evaluate(() => requestAvatarSession(null, {}));
  check('Studio zonder sleutel: nette foutmelding van de server (503)', av.ok === false && /LemonSlice/.test(av.error || ''), av);
  await sp.evaluate(() => { config.remote.key = 'onbekend'; });
  av = await sp.evaluate(() => requestAvatarSession(null, {}));
  check('Studio met onbekende key: foutmelding "Onbekende device-key"', av.ok === false && /Onbekende device-key/.test(av.error || ''), av);
  await sp.evaluate(() => { config.remote.enabled = false; applyRemoteSettings(); });
  check('Studio: geen JS-fouten tijdens de koppeling', fouten.length === 0, fouten.slice(0, 3));
  await ctx.close();
}

/* ---------------- Start ---------------- */

function opruimen() {
  for (const p of processen) { try { p.kill('SIGKILL'); } catch { /* al weg */ } }
  if (!process.env.BEWAAR) {
    try { fs.rmSync(tijdelijk, { recursive: true, force: true }); } catch { /* laat staan */ }
  } else {
    console.log(`Tijdelijke map bewaard: ${tijdelijk}`);
  }
}

main()
  .catch((e) => {
    fout++;
    mislukt.push('[afgebroken] ' + (e.stack || e));
    console.error('\nTEST AFGEBROKEN:', e.stack || e);
  })
  .finally(() => {
    opruimen();
    if (mislukt.length) {
      console.log('\nMislukte controles:');
      for (const m of mislukt) console.log('   - ' + m);
    }
    console.log(`\n${fout ? 'FOUT' : 'OK  '}: ${ok}/${ok + fout}`);
    process.exit(fout ? 1 : 0);
  });
