// M8 — build the Windows receiver-agent executable FROM ANY PLATFORM.
//
//   node agent/windows/build-exe.mjs            # → dist/HoloSeeAgent.exe
//
// How: the agent (watchdog + updater) is bundled to a single CommonJS file, packed into a
// Node.js "single executable application" blob (no code cache / no snapshot, so the blob is
// platform-neutral), and injected into the OFFICIAL Windows node.exe downloaded from
// nodejs.org — checksum-verified against SHASUMS256.txt for that release.
//
// HONESTY: this produces a real, runnable Windows binary, but building it here does not
// execute it — first run and the soak test happen on real Windows (the M8 gate), and the
// binary is UNSIGNED until it goes through the company's Authenticode signing step
// (SmartScreen will warn on unsigned builds).
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const platformDir = path.resolve(here, '..', '..');
const dist = path.join(platformDir, 'dist');
fs.mkdirSync(dist, { recursive: true });

const NODE_VERSION = process.env.NODE_WIN_VERSION ?? 'v22.11.0'; // any v22 LTS works
const zipName = `node-${NODE_VERSION}-win-x64.zip`;
const base = `https://nodejs.org/dist/${NODE_VERSION}`;

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: 'inherit', cwd: platformDir, ...opts });

// 1 · bundle the agent to one CommonJS file
console.log('1/5 bundling agent…');
run('npx', ['esbuild', 'agent/watchdog.mjs', '--bundle', '--platform=node', '--format=cjs',
  `--outfile=${path.join(dist, 'agent-bundle.cjs')}`]);

// 2 · single-executable blob (platform-neutral: no code cache, no snapshot)
console.log('2/5 building SEA blob…');
const seaConfig = path.join(dist, 'sea-config.json');
fs.writeFileSync(seaConfig, JSON.stringify({
  main: path.join(dist, 'agent-bundle.cjs'),
  output: path.join(dist, 'sea-prep.blob'),
  disableExperimentalSEAWarning: true,
  useCodeCache: false,
}));
run(process.execPath, ['--experimental-sea-config', seaConfig]);

// 3 · fetch the official Windows node.exe and verify it against SHASUMS256.txt
console.log(`3/5 fetching ${zipName} from nodejs.org…`);
const zipPath = path.join(dist, zipName);
if (!fs.existsSync(zipPath)) {
  const buf = Buffer.from(await (await fetch(`${base}/${zipName}`)).arrayBuffer());
  fs.writeFileSync(zipPath, buf);
}
const shasums = await (await fetch(`${base}/SHASUMS256.txt`)).text();
const expected = shasums.split('\n').find((l) => l.endsWith(zipName))?.split(/\s+/)[0];
const actual = crypto.createHash('sha256').update(fs.readFileSync(zipPath)).digest('hex');
if (!expected || expected !== actual) throw new Error(`node zip sha256 mismatch (${actual} != ${expected})`);
console.log('   sha256 verified against nodejs.org SHASUMS256.txt');
run('unzip', ['-o', '-q', zipPath, `node-${NODE_VERSION}-win-x64/node.exe`, '-d', dist]);

// 4 · inject the blob into the exe
console.log('4/5 injecting blob…');
const exe = path.join(dist, 'HoloSeeAgent.exe');
fs.copyFileSync(path.join(dist, `node-${NODE_VERSION}-win-x64`, 'node.exe'), exe);
run('npx', ['postject', exe, 'NODE_SEA_BLOB', path.join(dist, 'sea-prep.blob'),
  '--sentinel-fuse', 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2']);

// 5 · sanity: PE header + embedded blob present
console.log('5/5 verifying…');
const bytes = fs.readFileSync(exe);
if (bytes[0] !== 0x4d || bytes[1] !== 0x5a) throw new Error('output is not a PE executable (missing MZ)');
if (!bytes.includes(Buffer.from('NODE_SEA_BLOB'))) throw new Error('SEA blob not found in executable');
console.log(`\nOK → ${exe} (${(bytes.length / 1e6).toFixed(1)} MB, node ${NODE_VERSION} win-x64, UNSIGNED)`);
console.log('Next: build the installer with `makensis agent/windows/setup.nsi`,');
console.log('then sign both binaries with the company certificate on the build machine.');
