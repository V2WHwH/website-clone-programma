// REST-API van het platform.
// - /api/*    : CMS-API (sessie-authenticatie vereist)
// - /api/v1/* : publieke integratie-API op basis van device-key
'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const os = require('os');

const db = require('../lib/db');
const auth = require('../lib/auth');
const media = require('../lib/media');
const hub = require('../lib/hub');
const { buildManifest } = require('../lib/manifest');

const router = express.Router();

// Externe basis-URL van deze server, voor absolute media-URL's in manifests.
// Configureerbaar via PUBLIC_BASE_URL; anders afgeleid uit het request.
function baseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  return `${req.protocol}://${req.get('host')}`;
}

function findDeviceByKey(key) {
  return db.load().devices.find((d) => d.key === key) || null;
}

/* ---------------- Auth ---------------- */

router.post('/api/login', (req, res) => {
  if (!auth.checkPassword(req.body?.password)) {
    return res.status(401).json({ error: 'Onjuist wachtwoord' });
  }
  const token = auth.createSession();
  res.setHeader('Set-Cookie', `hwh_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=43200`);
  res.json({ ok: true, defaultPassword: auth.usingDefaultPassword() });
});

router.post('/api/logout', (req, res) => {
  auth.destroySession(req);
  res.setHeader('Set-Cookie', 'hwh_session=; HttpOnly; Path=/; Max-Age=0');
  res.json({ ok: true });
});

router.get('/api/session', (req, res) => {
  res.json({ authed: auth.isAuthed(req), defaultPassword: auth.usingDefaultPassword() });
});

// De publieke v1-API is per device-key benaderbaar vanuit de Studio-app,
// die vanaf file:// of een kiosk-profiel draait — dus met CORS open.
router.use('/api/v1', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// Alles hieronder onder /api (behalve /api/v1) vereist een sessie.
router.use('/api', (req, res, next) => {
  if (req.path.startsWith('/v1/')) return next();
  return auth.requireAuth(req, res, next);
});

/* ---------------- Media & mappen ---------------- */

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      try {
        const dest = media.resolveSafe(req.query.folder || '');
        media.createFolder(req.query.folder || '');
        cb(null, dest);
      } catch (e) {
        cb(e);
      }
    },
    filename(req, file, cb) {
      // Originele naam behouden, maar onveilige tekens strippen.
      cb(null, file.originalname.replace(/[^\w.\- ()\[\]]/g, '_'));
    }
  }),
  limits: { fileSize: 1024 * 1024 * 1024 * 8 } // 8 GB: ruim genoeg voor lange 4K-masters
});

router.get('/api/media', (req, res) => {
  const folder = req.query.folder || '';
  res.json({ folders: media.listFolders(), folder, files: media.listFiles(folder) });
});

router.post('/api/media/upload', upload.array('files', 20), (req, res) => {
  res.json({ ok: true, files: (req.files || []).map((f) => f.filename) });
});

router.post('/api/media/folder', (req, res) => {
  media.createFolder(req.body.path);
  res.json({ ok: true });
});

router.post('/api/media/rename', (req, res) => {
  media.renameEntry(req.body.from, req.body.to);
  res.json({ ok: true });
});

router.delete('/api/media', (req, res) => {
  media.removeEntry(req.query.path);
  res.json({ ok: true });
});

/* ---------------- Live-bronnen ---------------- */

router.get('/api/live-sources', (req, res) => {
  res.json(db.load().liveSources);
});

router.post('/api/live-sources', (req, res) => {
  const state = db.load();
  const { name, protocol, url, lowLatency, notes } = req.body;
  if (!name || !protocol || !url) return res.status(400).json({ error: 'name, protocol en url zijn verplicht' });
  const src = { id: db.id('live'), name, protocol, url, lowLatency: lowLatency !== false, notes: notes || '' };
  state.liveSources.push(src);
  db.save();
  res.json(src);
});

router.put('/api/live-sources/:id', (req, res) => {
  const src = db.load().liveSources.find((s) => s.id === req.params.id);
  if (!src) return res.status(404).json({ error: 'Niet gevonden' });
  Object.assign(src, pick(req.body, ['name', 'protocol', 'url', 'lowLatency', 'notes']));
  db.save();
  res.json(src);
});

router.delete('/api/live-sources/:id', (req, res) => {
  const state = db.load();
  state.liveSources = state.liveSources.filter((s) => s.id !== req.params.id);
  db.save();
  res.json({ ok: true });
});

/* ---------------- Playlists ---------------- */

router.get('/api/playlists', (req, res) => {
  res.json(db.load().playlists);
});

router.post('/api/playlists', (req, res) => {
  const state = db.load();
  const pl = { id: db.id('pl'), name: req.body.name || 'Nieuwe playlist', loop: true, items: [] };
  state.playlists.push(pl);
  db.save();
  res.json(pl);
});

router.put('/api/playlists/:id', (req, res) => {
  const pl = db.load().playlists.find((p) => p.id === req.params.id);
  if (!pl) return res.status(404).json({ error: 'Niet gevonden' });
  if (typeof req.body.name === 'string') pl.name = req.body.name;
  if (typeof req.body.loop === 'boolean') pl.loop = req.body.loop;
  if (Array.isArray(req.body.items)) {
    pl.items = req.body.items.map((item) => ({ id: item.id || db.id('it'), ...pick(item, ['type', 'name', 'mediaPath', 'liveSourceId', 'url', 'durationSec', 'fit', 'muted', 'interactive']) }));
  }
  db.save();
  notifyPlaylistDevices(pl.id);
  res.json(pl);
});

router.delete('/api/playlists/:id', (req, res) => {
  const state = db.load();
  state.playlists = state.playlists.filter((p) => p.id !== req.params.id);
  for (const d of state.devices) if (d.playlistId === req.params.id) d.playlistId = null;
  db.save();
  res.json({ ok: true });
});

/* ---------------- Devices ---------------- */

router.get('/api/devices', (req, res) => {
  const state = db.load();
  // studio-blok niet integraal meesturen: de schermafdruk kan megabytes zijn.
  res.json(state.devices.map(({ studio, ...d }) => ({
    ...d,
    online: hub.isOnline(d.id),
    studio: studio ? {
      lastStatus: studio.lastStatus || null,
      lastStatusAt: studio.lastStatusAt || null,
      configRev: studio.configRev || 0,
      pendingCommands: (studio.commands || []).length,
      screenshotAt: studio.screenshotAt || null
    } : null
  })));
});

router.post('/api/devices', (req, res) => {
  const state = db.load();
  const dev = {
    id: db.id('dev'),
    key: db.deviceKey(),
    name: req.body.name || 'Nieuwe holobox',
    orientation: req.body.orientation === 'landscape' ? 'landscape' : 'portrait',
    rotation: 0,
    playlistId: null,
    externalEndpoint: null,
    location: req.body.location || '',
    notes: '',
    lastSeen: null,
    lastIp: null
  };
  state.devices.push(dev);
  db.save();
  res.json(dev);
});

router.put('/api/devices/:id', (req, res) => {
  const dev = db.load().devices.find((d) => d.id === req.params.id);
  if (!dev) return res.status(404).json({ error: 'Niet gevonden' });
  Object.assign(dev, pick(req.body, ['name', 'orientation', 'rotation', 'playlistId', 'externalEndpoint', 'location', 'notes']));
  db.save();
  hub.sendToDevice(dev.id, { type: 'refresh' });
  res.json(dev);
});

router.delete('/api/devices/:id', (req, res) => {
  const state = db.load();
  state.devices = state.devices.filter((d) => d.id !== req.params.id);
  db.save();
  res.json({ ok: true });
});

// Realtime commando naar een box: refresh | identify | reload | black
router.post('/api/devices/:id/command', (req, res) => {
  const dev = db.load().devices.find((d) => d.id === req.params.id);
  if (!dev) return res.status(404).json({ error: 'Niet gevonden' });
  const allowed = ['refresh', 'identify', 'reload', 'black', 'wake'];
  if (!allowed.includes(req.body.command)) return res.status(400).json({ error: `command moet één van ${allowed.join(', ')} zijn` });
  const delivered = hub.sendToDevice(dev.id, { type: req.body.command });
  res.json({ ok: true, delivered });
});

/* ---------------- Studio-koppeling (remote beheer, spec 108-115) ----------------
   Een Studio-box meldt zich met zijn device-key. De beheerder zet commando's
   in de wachtrij (volume, schermafdruk, herstart, identificeren) en publiceert
   ontwerpen; de Studio haalt ze bij de eerstvolgende hartslag op. */

function studioState(dev) {
  dev.studio = dev.studio || { commands: [], configRev: 0 };
  dev.studio.commands = dev.studio.commands || [];
  return dev.studio;
}

const STUDIO_COMMANDS = ['setVolume', 'screenshot', 'reload', 'identify', 'publishConfig'];

// Beheerder: status + laatste schermafdruk van een Studio-box inzien.
router.get('/api/devices/:id/studio', (req, res) => {
  const dev = db.load().devices.find((d) => d.id === req.params.id);
  if (!dev) return res.status(404).json({ error: 'Niet gevonden' });
  const st = studioState(dev);
  res.json({
    lastStatus: st.lastStatus || null,
    lastStatusAt: st.lastStatusAt || null,
    configRev: st.configRev || 0,
    pendingCommands: st.commands.length,
    screenshotAt: st.screenshotAt || null,
    screenshot: req.query.screenshot === '1' ? (st.screenshot || null) : undefined
  });
});

// Beheerder: commando in de wachtrij zetten voor de volgende hartslag.
router.post('/api/devices/:id/studio/command', (req, res) => {
  const dev = db.load().devices.find((d) => d.id === req.params.id);
  if (!dev) return res.status(404).json({ error: 'Niet gevonden' });
  const { type, value } = req.body || {};
  if (!STUDIO_COMMANDS.includes(type)) {
    return res.status(400).json({ error: `type moet één van ${STUDIO_COMMANDS.join(', ')} zijn` });
  }
  const st = studioState(dev);
  st.commands = st.commands.filter((c) => c.type !== type); // nieuwste wint
  st.commands.push({ type, value: value ?? null, queuedAt: Date.now() });
  db.save();
  res.json({ ok: true, pending: st.commands.length });
});

// Beheerder: een Studio-ontwerp (config-JSON) publiceren naar deze box.
router.put('/api/devices/:id/studio/config', (req, res) => {
  const dev = db.load().devices.find((d) => d.id === req.params.id);
  if (!dev) return res.status(404).json({ error: 'Niet gevonden' });
  if (!req.body || typeof req.body.config !== 'object' || req.body.config === null) {
    return res.status(400).json({ error: 'body.config (JSON-ontwerp) ontbreekt' });
  }
  const st = studioState(dev);
  st.config = req.body.config;
  st.configRev = (st.configRev || 0) + 1;
  st.commands = st.commands.filter((c) => c.type !== 'publishConfig');
  st.commands.push({ type: 'publishConfig', queuedAt: Date.now() });
  db.save();
  res.json({ ok: true, configRev: st.configRev });
});

// Studio-box: hartslag met status; antwoord bevat de commandowachtrij.
router.post('/api/v1/studio/:key/heartbeat', (req, res) => {
  const dev = findDeviceByKey(req.params.key);
  if (!dev) return res.status(404).json({ error: 'Onbekende device-key' });
  const st = studioState(dev);
  dev.lastSeen = Date.now();
  dev.lastIp = req.ip?.replace('::ffff:', '') || null;
  if (req.body && typeof req.body.status === 'object') {
    st.lastStatus = req.body.status;
    st.lastStatusAt = Date.now();
  }
  const commands = st.commands;
  st.commands = [];
  db.save();
  res.json({
    ok: true,
    commands,
    configRev: st.configRev || 0,
    pollIntervalSec: db.load().settings.pollIntervalSec
  });
});

/* Studio-box: een AI-avatarsessie aanvragen.

   De box mag de geheime sleutel van de aanbieder nooit kennen — alles wat op
   de holobox staat is leesbaar voor wie het scherm openmaakt. Daarom vraagt de
   box hier een sessie aan met zijn device-key, praat deze server met de
   aanbieder, en gaat alleen het adres en het toegangsbewijs terug.

   Zet in .env:
     LEMONSLICE_API_KEY=...            de sleutel uit je LemonSlice-account
     LEMONSLICE_SESSION_URL=https://... het endpoint uit hun documentatie
   Optioneel, als hun antwoord andere veldnamen gebruikt:
     LEMONSLICE_URL_FIELD=livekit_url
     LEMONSLICE_TOKEN_FIELD=livekit_token  */
// Het adres van de aanbieder staat vast; alleen de sleutel is per klant.
// Zo hoeft er in .env maar één regel ingevuld te worden.
const LEMONSLICE_DEFAULT_URL = 'https://lemonslice.com/api/liveai/sessions';

// Aan de vorm van het adres is te zien welke techniek de box moet gebruiken.
// Een ws:// of wss:// adres is LiveKit (dat heeft altijd een toegangsbewijs
// nodig); een https-adres op daily.co is een Daily-kamer (die opent op het
// adres alleen). Zo hoeft de box niet te raden.
function avatarTransport(url) {
  const u = String(url || '');
  if (/^wss?:\/\//i.test(u)) return 'livekit';
  if (/(^|\.)daily\.co\//i.test(u)) return 'daily';
  return 'daily';
}

router.post('/api/v1/avatar/session', async (req, res) => {
  const dev = findDeviceByKey((req.body && req.body.key) || '');
  if (!dev) return res.status(404).json({ error: 'Onbekende device-key' });

  const apiKey = process.env.LEMONSLICE_API_KEY;
  const url = process.env.LEMONSLICE_SESSION_URL || LEMONSLICE_DEFAULT_URL;
  if (!apiKey) {
    return res.status(503).json({
      error: 'De server heeft nog geen avatar-koppeling: zet LEMONSLICE_API_KEY ' +
             'in .env en herstart het platform.'
    });
  }

  const av = (req.body && req.body.avatar) || {};
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        avatar_id: av.providerAvatarId || undefined,
        greeting: av.greeting || undefined,
        system_prompt: av.persona || undefined,
        metadata: { device: dev.id, deviceName: dev.name, avatar: av.name }
      })
    });
    const text = await r.text();
    let data = {};
    try { data = JSON.parse(text); } catch { /* geen JSON */ }
    if (!r.ok) {
      return res.status(502).json({
        error: `De aanbieder gaf ${r.status}`,
        detail: text.slice(0, 400)
      });
    }
    // De veldnamen verschillen per aanbieder en per versie van hun API.
    // Vandaar instelbaar, met de gangbare namen als vangnet. LemonSlice zelf
    // antwoordt met session_id, room_url en control_url.
    const pick = (obj, names) => {
      for (const n of names) {
        if (obj && obj[n]) return obj[n];
        if (obj && obj.session && obj.session[n]) return obj.session[n];
        if (obj && obj.data && obj.data[n]) return obj.data[n];
      }
      return null;
    };
    const roomUrl = pick(data, [process.env.LEMONSLICE_URL_FIELD, 'room_url', 'roomUrl',
      'livekit_url', 'url', 'serverUrl', 'server_url', 'wsUrl', 'ws_url'].filter(Boolean));
    if (!roomUrl) {
      // Niet raden: laat zien wat er wél terugkwam, dan is het in één keer op
      // te lossen met LEMONSLICE_URL_FIELD.
      return res.status(502).json({
        error: 'De aanbieder gaf geen herkenbaar kamer-adres terug',
        received: Object.keys(data || {})
      });
    }
    // Een toegangsbewijs is optioneel: een Daily-kamer heeft er geen.
    const token = pick(data, [process.env.LEMONSLICE_TOKEN_FIELD, 'livekit_token', 'token',
      'accessToken', 'access_token', 'participant_token'].filter(Boolean));
    const transport = avatarTransport(roomUrl);
    if (transport === 'livekit' && !token) {
      return res.status(502).json({
        error: 'De aanbieder gaf een LiveKit-adres zonder toegangsbewijs; ' +
               'zet LEMONSLICE_TOKEN_FIELD op de juiste veldnaam',
        received: Object.keys(data || {})
      });
    }
    const out = {
      ok: true,
      url: roomUrl,
      token: token || null,
      transport,
      sessionId: pick(data, ['session_id', 'sessionId', 'id']) || null,
      controlUrl: pick(data, ['control_url', 'controlUrl']) || null
    };
    if (req.body && req.body.probe) out.probe = true;
    res.json(out);
  } catch (e) {
    res.status(502).json({ error: 'Aanbieder niet bereikbaar: ' + (e.message || e) });
  }
});

// Studio-box: gepubliceerd ontwerp ophalen.
router.get('/api/v1/studio/:key/config', (req, res) => {
  const dev = findDeviceByKey(req.params.key);
  if (!dev) return res.status(404).json({ error: 'Onbekende device-key' });
  const st = studioState(dev);
  res.setHeader('Cache-Control', 'no-store');
  res.json({ rev: st.configRev || 0, config: st.config || null });
});

// Studio-box: schermafdruk aanleveren (JPEG-dataURL, max ~3 MB).
router.post('/api/v1/studio/:key/screenshot', (req, res) => {
  const dev = findDeviceByKey(req.params.key);
  if (!dev) return res.status(404).json({ error: 'Onbekende device-key' });
  const img = req.body && req.body.image;
  if (typeof img !== 'string' || !img.startsWith('data:image/')) {
    return res.status(400).json({ error: 'body.image (dataURL) ontbreekt' });
  }
  if (img.length > 3 * 1024 * 1024) return res.status(413).json({ error: 'Schermafdruk te groot' });
  const st = studioState(dev);
  st.screenshot = img;
  st.screenshotAt = Date.now();
  db.save();
  res.json({ ok: true });
});

/* ---------------- Instellingen & systeeminfo ---------------- */

router.get('/api/settings', (req, res) => {
  res.json(db.load().settings);
});

router.put('/api/settings', (req, res) => {
  const state = db.load();
  Object.assign(state.settings, pick(req.body, ['platformName', 'pollIntervalSec', 'transitionMs', 'defaultOrientation']));
  db.save();
  res.json(state.settings);
});

// Netwerkinfo voor de integratiepagina: IP-adressen + poorten van deze server.
router.get('/api/system', (req, res) => {
  const nets = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family === 'IPv4' && !a.internal) nets.push({ interface: name, address: a.address });
    }
  }
  res.json({
    hostname: os.hostname(),
    interfaces: nets,
    port: Number(process.env.PORT || 8080),
    baseUrl: baseUrl(req),
    uptimeSec: Math.round(process.uptime())
  });
});

/* ---------------- Publieke integratie-API (v1) ---------------- */

// Het "custom endpoint" van dit platform: één JSON-manifest per device-key.
// Dit is wat de meegeleverde player gebruikt, en wat een externe holobox
// (bijv. een Portl-achtige Cloud Persona-integratie) kan pollen.
router.get('/api/v1/manifest/:key', (req, res) => {
  const dev = findDeviceByKey(req.params.key);
  if (!dev) return res.status(404).json({ error: 'Onbekende device-key' });
  res.setHeader('Cache-Control', 'no-store');
  res.json(buildManifest(dev, baseUrl(req)));
});

// Heartbeat voor players die geen WebSocket kunnen gebruiken.
router.post('/api/v1/heartbeat/:key', (req, res) => {
  const dev = findDeviceByKey(req.params.key);
  if (!dev) return res.status(404).json({ error: 'Onbekende device-key' });
  dev.lastSeen = Date.now();
  dev.lastIp = req.ip?.replace('::ffff:', '') || null;
  if (req.body?.nowPlaying) dev.nowPlaying = req.body.nowPlaying;
  db.save();
  res.json({ ok: true, pollIntervalSec: db.load().settings.pollIntervalSec });
});

// Gezondheidscheck voor monitoring/loadbalancers.
router.get('/api/v1/health', (req, res) => {
  res.json({ ok: true, service: 'hereweholo-platform', time: new Date().toISOString() });
});

/* ---------------- Helpers ---------------- */

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj && obj[k] !== undefined) out[k] = obj[k];
  return out;
}

function notifyPlaylistDevices(playlistId) {
  for (const d of db.load().devices) {
    if (d.playlistId === playlistId) hub.sendToDevice(d.id, { type: 'refresh' });
  }
}

// Nette JSON-fouten i.p.v. HTML-stacktraces.
router.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || 'Serverfout' });
});

module.exports = router;
