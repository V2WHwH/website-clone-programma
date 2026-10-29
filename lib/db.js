// Eenvoudige JSON-file database met atomische writes.
// Bewust geen externe database: het platform moet standalone op een holobox
// of mini-pc kunnen draaien zonder extra services.
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULTS = {
  settings: {
    platformName: 'HereWeHolo Holobox Platform',
    // Hoe vaak de player zijn manifest her-checkt (seconden), naast WebSocket-push.
    pollIntervalSec: 30,
    // Standaard overgangstijd tussen playlist-items (ms).
    transitionMs: 600,
    defaultOrientation: 'portrait'
  },
  devices: [],
  playlists: [],
  liveSources: [],
  // Media-metadata (labels per bestand); de bestanden zelf staan in media/.
  mediaMeta: {}
};

let state = null;
let writeTimer = null;

function load() {
  if (state) return state;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  let raw = null;
  try { raw = fs.readFileSync(DB_FILE, 'utf8'); } catch { /* eerste start */ }
  try {
    if (raw === null) throw new Error('geen db.json');
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('geen object');
    state = { ...structuredClone(DEFAULTS), ...data };
    state.settings = { ...DEFAULTS.settings, ...state.settings };
    for (const k of ['devices', 'playlists', 'liveSources']) if (!Array.isArray(state[k])) state[k] = [];
  } catch (e) {
    // Een kapotte db.json nooit stil weggooien: eerst een kopie bewaren,
    // zodat de beheerder zijn holoboxen en playlists kan terughalen.
    if (raw !== null) {
      const kopie = `${DB_FILE}.kapot-${new Date().toISOString().replace(/[:.]/g, '-')}`;
      try { fs.copyFileSync(DB_FILE, kopie); } catch { /* niet erg */ }
      console.error(`LET OP: data/db.json was onleesbaar (${e.message}). Kopie bewaard als ${path.basename(kopie)}; er is een lege database gestart.`);
    }
    state = structuredClone(DEFAULTS);
    persistNow();
  }
  return state;
}

function persistNow() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

// Debounced save zodat bursts van API-calls niet elk een disk-write doen.
function save() {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(persistNow, 150);
  writeTimer.unref?.();
}

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

// Device-keys zijn langer: ze fungeren als toegangssleutel voor de player-URL.
function deviceKey() {
  return crypto.randomBytes(12).toString('hex');
}

module.exports = { load, save, persistNow, id, deviceKey, DATA_DIR };
