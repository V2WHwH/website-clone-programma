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
// Alleen een proxy op deze machine zelf mag het IP-adres van de bezoeker
// doorgeven; anders kan iedereen met een X-Forwarded-For-kop een ander IP
// opgeven (en zo de inlogrem omzeilen). Achter een andere proxy: TRUST_PROXY.
app.set('trust proxy', trustProxy(process.env.TRUST_PROXY));
app.use(express.json({ limit: '6mb' })); // ruim genoeg voor een schermafdruk-dataURL
// Express 5 laat req.body leeg (undefined) als er geen JSON meekomt; elke
// route rekent op een object.
app.use((req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) req.body = {};
  next();
});

// Mediabestanden met range-requests (nodig voor scrubben en grote 4K-files).
// CORS open: externe holoboxen moeten media rechtstreeks kunnen laden.
app.use('/media', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(media.MEDIA_ROOT, {
  acceptRanges: true,
  fallthrough: false,
  setHeaders(res, file) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Alles wat geen video of beeld is, nooit als pagina openen: anders draait
    // een geüpload HTML-bestand met de rechten van het CMS.
    if (media.kindOf(file) === 'other') {
      res.setHeader('Content-Disposition', 'attachment');
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    }
  }
}));

app.use('/api/v1', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.use(apiRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Onbekende API-route' }));

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

// Eén plek voor alle fouten: altijd JSON, nooit een stacktrace of serverpad.
// Alleen meldingen die de code zelf als publiek markeert gaan letterlijk mee.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  let status = Number(err.status || err.statusCode) || 500;
  let msg;
  if (err.name === 'MulterError') {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    msg = err.code === 'LIMIT_FILE_SIZE' ? 'Bestand te groot'
      : err.code === 'LIMIT_UNEXPECTED_FILE' ? 'Te veel bestanden (max 20) of een verkeerd veld (gebruik "files")'
      : 'Upload geweigerd';
  } else if (err.type === 'entity.parse.failed') msg = 'Ongeldige JSON';
  else if (err.type === 'entity.too.large' || status === 413) msg = 'Te groot';
  else if (err.publiek && status < 500) msg = err.message;
  else if (status === 404) msg = 'Niet gevonden';
  else if (status < 500) msg = 'Ongeldig verzoek';
  else msg = 'Serverfout';
  if (status >= 500) console.error(err);
  res.status(status).json({ error: msg });
});

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

function trustProxy(v) {
  if (!v) return 'loopback';
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^\d+$/.test(v)) return Number(v);
  return v;
}

// Bij afsluiten: pending writes wegschrijven.
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    db.persistNow();
    process.exit(0);
  });
}
