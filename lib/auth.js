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

function usingDefaultPassword() {
  return !process.env.ADMIN_PASSWORD;
}

module.exports = { createSession, checkPassword, isAuthed, destroySession, requireAuth, usingDefaultPassword };
