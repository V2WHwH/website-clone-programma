// Mediabibliotheek op basis van mappen op schijf (media/).
// Mappen zijn de organisatie-eenheid in het CMS: per klant, per campagne,
// of per oriëntatie (bijv. "portrait" / "landscape") — vrij in te richten.
'use strict';

const fs = require('fs');
const path = require('path');

const MEDIA_ROOT = path.join(__dirname, '..', 'media');

const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.m4v', '.mkv']);
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);

function ensureRoot() {
  fs.mkdirSync(MEDIA_ROOT, { recursive: true });
}

// Beveiligde pad-resolutie: alles moet binnen media/ blijven.
function resolveSafe(relPath) {
  const clean = path.normalize(relPath || '').replace(/^([/\\.])+/, '');
  const abs = path.resolve(MEDIA_ROOT, clean);
  if (abs !== MEDIA_ROOT && !abs.startsWith(MEDIA_ROOT + path.sep)) {
    throw Object.assign(new Error('Pad buiten mediabibliotheek'), { status: 400 });
  }
  return abs;
}

function kindOf(name) {
  const ext = path.extname(name).toLowerCase();
  if (VIDEO_EXT.has(ext)) return 'video';
  if (IMAGE_EXT.has(ext)) return 'image';
  return 'other';
}

function listFolders() {
  ensureRoot();
  const out = [];
  const walk = (dir, rel) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const childRel = rel ? `${rel}/${entry.name}` : entry.name;
        out.push(childRel);
        walk(path.join(dir, entry.name), childRel);
      }
    }
  };
  walk(MEDIA_ROOT, '');
  return out.sort();
}

function listFiles(folder) {
  const abs = resolveSafe(folder);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs, { withFileTypes: true })
    .filter((e) => e.isFile() && kindOf(e.name) !== 'other')
    .map((e) => {
      const st = fs.statSync(path.join(abs, e.name));
      const rel = folder ? `${folder}/${e.name}` : e.name;
      return {
        name: e.name,
        path: rel,
        url: '/media/' + rel.split('/').map(encodeURIComponent).join('/'),
        kind: kindOf(e.name),
        size: st.size,
        modified: st.mtimeMs
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function createFolder(relPath) {
  const abs = resolveSafe(relPath);
  fs.mkdirSync(abs, { recursive: true });
}

function removeEntry(relPath) {
  const abs = resolveSafe(relPath);
  if (abs === MEDIA_ROOT) throw Object.assign(new Error('Root kan niet verwijderd worden'), { status: 400 });
  fs.rmSync(abs, { recursive: true, force: true });
}

function renameEntry(relPath, newRelPath) {
  const from = resolveSafe(relPath);
  const to = resolveSafe(newRelPath);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(from, to);
}

function fileExists(relPath) {
  try {
    return fs.statSync(resolveSafe(relPath)).isFile();
  } catch {
    return false;
  }
}

module.exports = { MEDIA_ROOT, ensureRoot, resolveSafe, listFolders, listFiles, createFolder, removeEntry, renameEntry, fileExists, kindOf };
