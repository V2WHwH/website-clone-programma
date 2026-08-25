// HereWeHolo 4K Holobox Platform
// Eén Node.js-proces met:
//  - 4K-player (portrait & landscape) op /player/<device-key>
//  - CMS op /admin
//  - REST-API (/api) + publieke integratie-API (/api/v1)
//  - WebSocket-hub (/ws) voor realtime devicebeheer
//  - Mediabibliotheek met HTTP range-streaming (/media/...)
'use strict';

const http = require('http');
const path = require('path');
const express = require('express');

const db = require('./lib/db');
const media = require('./lib/media');
const hub = require('./lib/hub');
const auth = require('./lib/auth');
const apiRoutes = require('./routes/api');

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';

db.load();
media.ensureRoot();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(express.json({ limit: '2mb' }));

// Mediabestanden met range-requests (nodig voor scrubben en grote 4K-files).
// CORS open: externe holoboxen moeten media rechtstreeks kunnen laden.
app.use('/media', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(media.MEDIA_ROOT, { acceptRanges: true, fallthrough: false }));

app.use('/api/v1', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.use(apiRoutes);

// Statische frontend (CMS, player, vendor-libs).
app.use(express.static(path.join(__dirname, 'public')));

// Player: /player/<device-key>
app.get('/player/:key', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player', 'index.html'));
});

// CMS: /admin (de pagina zelf checkt de sessie en toont anders het loginscherm).
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

app.get('/', (req, res) => res.redirect('/admin'));

const server = http.createServer(app);
hub.attach(server);

server.listen(PORT, HOST, () => {
  console.log(`HereWeHolo Holobox Platform draait op http://${HOST}:${PORT}`);
  console.log(`  CMS:            http://localhost:${PORT}/admin`);
  console.log(`  Player:         http://localhost:${PORT}/player/<device-key>`);
  console.log(`  Integratie-API: http://localhost:${PORT}/api/v1/manifest/<device-key>`);
  if (auth.usingDefaultPassword()) {
    console.log('  LET OP: ADMIN_PASSWORD is niet gezet — standaardwachtwoord actief. Zet ADMIN_PASSWORD in .env/omgeving.');
  }
});

// Bij afsluiten: pending writes wegschrijven.
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    db.persistNow();
    process.exit(0);
  });
}
