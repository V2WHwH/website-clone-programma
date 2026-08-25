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
  res.json(state.devices.map((d) => ({ ...d, online: hub.isOnline(d.id) })));
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
