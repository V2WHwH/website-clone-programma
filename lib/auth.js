// Sessie-authenticatie voor het CMS.
// Wachtwoord komt uit ADMIN_PASSWORD (zie .env.example); sessies zijn
// in-memory tokens in een httpOnly-cookie.
'use strict';

const crypto = require('crypto');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'hereweholo';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 uur

const sessions = new Map(); // token -> expiry timestamp

function createSession() {
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function checkPassword(password) {
  const given = Buffer.from(String(password || ''));
  const wanted = Buffer.from(ADMIN_PASSWORD);
  return given.length === wanted.length && crypto.timingSafeEqual(given, wanted);
}

function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function isAuthed(req) {
  const token = parseCookies(req).hwh_session;
  if (!token) return false;
  const expiry = sessions.get(token);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function destroySession(req) {
  const token = parseCookies(req).hwh_session;
  if (token) sessions.delete(token);
}

// Express-middleware voor CMS API-routes.
function requireAuth(req, res, next) {
  if (isAuthed(req)) return next();
  res.status(401).json({ error: 'Niet ingelogd' });
}

// Inlogrem: na 10 foute wachtwoorden vanaf één adres binnen een kwartier
// wacht dat adres een kwartier. Zo is raden (zeker van het standaard-
// wachtwoord) niet in een paar minuten te doen.
const MAX_FOUT = 10;
const REM_MS = 15 * 60 * 1000;
const fouten = new Map(); // ip -> { n, sinds, totIn }

function loginGeblokkeerd(ip) {
  const f = fouten.get(ip);
  if (!f || !f.totIn) return 0;
  const rest = f.totIn - Date.now();
  if (rest <= 0) { fouten.delete(ip); return 0; }
  return Math.ceil(rest / 1000);
}

function loginMislukt(ip) {
  const nu = Date.now();
  let f = fouten.get(ip);
  if (!f || nu - f.sinds > REM_MS) f = { n: 0, sinds: nu, totIn: 0 };
  f.n++;
  if (f.n >= MAX_FOUT) f.totIn = nu + REM_MS;
  fouten.set(ip, f);
  if (fouten.size > 10000) fouten.clear(); // geheugen begrenzen
}

function loginGelukt(ip) {
  fouten.delete(ip);
}

function usingDefaultPassword() {
  return !process.env.ADMIN_PASSWORD;
}

module.exports = { createSession, checkPassword, isAuthed, destroySession, requireAuth, usingDefaultPassword, loginGeblokkeerd, loginMislukt, loginGelukt };
