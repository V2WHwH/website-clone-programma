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
  try {
    state = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
    state.settings = { ...DEFAULTS.settings, ...state.settings };
  } catch {
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
