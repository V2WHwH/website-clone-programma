// M8 — the update mechanism must be paranoid: nothing installs unless the sha256 AND the
// Ed25519 signature verify; a tampered bundle or manifest is refused loudly; rollback
// restores the previous version with one pointer flip.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { checkAndApply, cmpVersions, readPointer, rollback, signedPayload, verifyManifest } from '../agent/updater.mjs';

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const pubPem = publicKey.export({ type: 'spki', format: 'pem' });

const files = new Map(); // served over a local http "update server"
const srv = http.createServer((req, res) => {
  const f = files.get(req.url);
  if (!f) {
    res.statusCode = 404;
    res.end();
    return;
  }
  res.end(f);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${srv.address().port}`;

function publish(channel, version, code, { tamperSig = false, tamperBody = false } = {}) {
  const bundle = Buffer.from(code);
  const sha256 = crypto.createHash('sha256').update(bundle).digest('hex');
  const sig = crypto.sign(null, Buffer.from(`${version}\n${sha256}`), privateKey).toString('base64');
  const manifest = {
    channel,
    version,
    file: `agent-${version}.mjs`,
    sha256,
    sig: tamperSig ? Buffer.from('bogus-signature-bogus-signature-bogus-sig').toString('base64') : sig,
  };
  files.set(`/${channel}.json`, JSON.stringify(manifest));
  files.set(`/agent-${version}.mjs`, tamperBody ? Buffer.from(code + '// evil') : bundle);
  return manifest;
}

const appDir = fs.mkdtempSync(path.join(os.tmpdir(), 'holo-upd-'));

test('version compare is numeric, not lexicographic', () => {
  assert.equal(cmpVersions('0.9.0', '0.10.0'), -1);
  assert.equal(cmpVersions('1.0.0', '1.0.0'), 0);
  assert.equal(cmpVersions('2.0.0', '1.99.99'), 1);
});

test('a properly signed newer bundle installs and keeps the previous version', async () => {
  publish('stable', '1.0.0', 'export const v = "1.0.0";');
  let r = await checkAndApply({ baseUrl: base, channel: 'stable', appDir, publicKeyPem: pubPem, currentVersion: '0.0.0' });
  assert.equal(r.updated, true);
  assert.equal(readPointer(appDir).version, '1.0.0');

  publish('stable', '1.1.0', 'export const v = "1.1.0";');
  r = await checkAndApply({ baseUrl: base, channel: 'stable', appDir, publicKeyPem: pubPem, currentVersion: '1.0.0' });
  assert.equal(r.updated, true);
  const p = readPointer(appDir);
  assert.equal(p.version, '1.1.0');
  assert.equal(p.previous.version, '1.0.0', 'previous version must stay on record');
  assert.ok(fs.existsSync(path.join(appDir, p.previous.entry)), 'previous bundle must stay on disk');
});

test('same or older version is a no-op', async () => {
  const r = await checkAndApply({ baseUrl: base, channel: 'stable', appDir, publicKeyPem: pubPem, currentVersion: '1.1.0' });
  assert.equal(r.updated, false);
});

test('a tampered signature is refused', async () => {
  publish('stable', '1.2.0', 'export const v = "evil";', { tamperSig: true });
  await assert.rejects(
    checkAndApply({ baseUrl: base, channel: 'stable', appDir, publicKeyPem: pubPem, currentVersion: '1.1.0' }),
    /signature verification FAILED/,
  );
  assert.equal(readPointer(appDir).version, '1.1.0', 'pointer must be untouched');
});

test('a tampered bundle body is refused (sha256 mismatch)', async () => {
  publish('stable', '1.3.0', 'export const v = "1.3.0";', { tamperBody: true });
  await assert.rejects(
    checkAndApply({ baseUrl: base, channel: 'stable', appDir, publicKeyPem: pubPem, currentVersion: '1.1.0' }),
    /sha256 mismatch/,
  );
  assert.equal(readPointer(appDir).version, '1.1.0');
});

test('a missing channel and a channel-field mismatch are refused', async () => {
  await assert.rejects(
    checkAndApply({ baseUrl: base, channel: 'internal', appDir, publicKeyPem: pubPem, currentVersion: '0' }),
    /manifest fetch failed/,
  );
  const m = publish('beta', '9.0.0', 'export const v = 1;');
  files.set('/beta.json', JSON.stringify({ ...m, channel: 'stable' })); // lies about its channel
  await assert.rejects(
    checkAndApply({ baseUrl: base, channel: 'beta', appDir, publicKeyPem: pubPem, currentVersion: '0' }),
    /channel mismatch/,
  );
});

test('rollback flips back to the previous version atomically', () => {
  const v = rollback(appDir);
  assert.equal(v, '1.0.0');
  const p = readPointer(appDir);
  assert.equal(p.version, '1.0.0');
  assert.equal(p.previous, null);
  assert.throws(() => rollback(appDir), /nothing to roll back/);
});

test('verifyManifest rejects a manifest signed by a different key', () => {
  const evil = crypto.generateKeyPairSync('ed25519');
  const m = { version: '9.9.9', sha256: 'ab'.repeat(32) };
  m.sig = crypto.sign(null, Buffer.from(signedPayload(m)), evil.privateKey).toString('base64');
  assert.equal(verifyManifest(m, pubPem), false);
});

test.after(() => srv.close());
