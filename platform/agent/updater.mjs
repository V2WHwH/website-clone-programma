// M8 — signed automatic updates for the receiver agent, with rollback.
// Channels: STABLE / BETA / INTERNAL. A channel manifest names a version, the bundle's
// sha256 and an Ed25519 signature over "version\nsha256" — nothing installs unless BOTH
// the hash and the signature verify against the pinned public key. The previous version
// is kept on disk; rollback() flips back to it in one atomic pointer write.
//
// The pointer file (current.json) is the single source of truth for what runs:
//   { version, entry, previous: { version, entry } | null }
// Applying = write the new bundle beside the old one, then atomically replace the pointer.
// A failed health check after restart → rollback() → the previous pointer is restored.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/** semver-lite: compare dotted numeric versions; returns -1 / 0 / 1. */
export function cmpVersions(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

export const signedPayload = (m) => `${m.version}\n${m.sha256}`;

/** Verify the manifest's Ed25519 signature against the pinned public key (PEM). */
export function verifyManifest(manifest, publicKeyPem) {
  try {
    return crypto.verify(null, Buffer.from(signedPayload(manifest)), publicKeyPem, Buffer.from(manifest.sig, 'base64'));
  } catch {
    return false;
  }
}

export async function fetchManifest(baseUrl, channel) {
  const r = await fetch(`${baseUrl}/${channel}.json`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`manifest fetch failed: HTTP ${r.status}`);
  return r.json();
}

export function readPointer(appDir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(appDir, 'current.json'), 'utf8'));
  } catch {
    return null;
  }
}

function writePointer(appDir, pointer) {
  const tmp = path.join(appDir, `.current.${process.pid}.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(pointer, null, 2));
  fs.renameSync(tmp, path.join(appDir, 'current.json')); // atomic on POSIX and NTFS
}

/**
 * Check the channel and, when a newer signed bundle exists, download + verify + stage it
 * and flip the pointer. Returns { updated, version, rolledBackAvailable } — the caller
 * (service manager / watchdog) restarts the agent; if the new version fails its health
 * check, call rollback(appDir).
 */
export async function checkAndApply({ baseUrl, channel, appDir, publicKeyPem, currentVersion }) {
  const manifest = await fetchManifest(baseUrl, channel);
  if (manifest.channel !== channel) throw new Error('manifest channel mismatch');
  if (cmpVersions(manifest.version, currentVersion) <= 0) return { updated: false, version: currentVersion };
  if (!verifyManifest(manifest, publicKeyPem)) throw new Error('signature verification FAILED — refusing update');

  const r = await fetch(`${baseUrl}/${manifest.file}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`bundle fetch failed: HTTP ${r.status}`);
  const bundle = Buffer.from(await r.arrayBuffer());
  const digest = crypto.createHash('sha256').update(bundle).digest('hex');
  if (digest !== manifest.sha256) throw new Error('bundle sha256 mismatch — refusing update');

  fs.mkdirSync(appDir, { recursive: true });
  const entry = `agent-${manifest.version}.mjs`;
  fs.writeFileSync(path.join(appDir, entry), bundle);
  const prev = readPointer(appDir);
  writePointer(appDir, {
    version: manifest.version,
    entry,
    previous: prev ? { version: prev.version, entry: prev.entry } : null,
  });
  return { updated: true, version: manifest.version, previous: prev?.version ?? null };
}

/** Roll back to the previous version (kept on disk). Returns the version now current. */
export function rollback(appDir) {
  const cur = readPointer(appDir);
  if (!cur?.previous) throw new Error('nothing to roll back to');
  writePointer(appDir, { ...cur.previous, previous: null });
  return cur.previous.version;
}
