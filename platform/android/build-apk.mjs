// HoloMe for Android — build dist/HoloMe-debug.apk WITHOUT Gradle or the Google SDK.
//
//   node android/build-apk.mjs
//
// Toolchain (all from Ubuntu/Debian packages + one framework jar):
//   aapt, zipalign, apksigner, dalvik-exchange (dx), openjdk, imagemagick
//     sudo apt-get install aapt zipalign apksigner dalvik-exchange default-jdk imagemagick
//   android.jar: the API-23 framework jar from the Sable/android-platforms mirror
//     (McGill Sable research group; dl.google.com is not reachable from this build host).
//     Its sha256 is printed and pinned below — the build refuses a changed jar.
//
// HONESTY: output is a DEBUG-signed APK for sideloading on test devices. It is not a
// Play release: that needs the official SDK toolchain, the company keystore, and a
// targetSdk review. Building here does not run it — first run happens on a real phone.
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const platformDir = path.resolve(here, '..');
const dist = path.join(platformDir, 'dist');
const build = path.join(here, 'build');
fs.rmSync(build, { recursive: true, force: true });
fs.mkdirSync(build, { recursive: true });
fs.mkdirSync(dist, { recursive: true });

const ANDROID_JAR_URL = 'https://raw.githubusercontent.com/Sable/android-platforms/master/android-23/android.jar';
const ANDROID_JAR_SHA256 = '9a05177e0de0ce13d6cbdb0d32225a5a9fd575aa21651e885f7d2fa9c39f6cc4';

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: 'inherit', cwd: here, ...opts });
const out = (cmd, args) => execFileSync(cmd, args, { cwd: here }).toString();

for (const tool of ['aapt', 'zipalign', 'apksigner', 'dalvik-exchange', 'javac', 'convert']) {
  try {
    execFileSync('which', [tool]);
  } catch {
    throw new Error(`missing tool: ${tool} — sudo apt-get install aapt zipalign apksigner dalvik-exchange default-jdk imagemagick`);
  }
}

// 1 · framework jar (cached, hash-pinned)
console.log('1/6 android.jar…');
const androidJar = path.join(here, '.cache', 'android-23.jar');
fs.mkdirSync(path.dirname(androidJar), { recursive: true });
if (!fs.existsSync(androidJar)) {
  const buf = Buffer.from(await (await fetch(ANDROID_JAR_URL)).arrayBuffer());
  fs.writeFileSync(androidJar, buf);
}
const jarHash = crypto.createHash('sha256').update(fs.readFileSync(androidJar)).digest('hex');
if (jarHash !== ANDROID_JAR_SHA256) throw new Error(`android.jar sha256 changed: ${jarHash} — refusing to build`);

// 2 · launcher icons from the brand SVG
console.log('2/6 icons…');
const densities = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [d, px] of Object.entries(densities)) {
  const dir = path.join(here, 'res', `mipmap-${d}`);
  fs.mkdirSync(dir, { recursive: true });
  run('convert', ['-background', 'none', '-density', '384', path.join(here, 'icon.svg'),
    '-resize', `${px}x${px}`, path.join(dir, 'ic_launcher.png')]);
}

// 3 · resources + manifest -> APK skeleton
console.log('3/6 aapt package…');
const unsigned = path.join(build, 'unsigned.apk');
run('aapt', ['package', '-f', '-M', 'AndroidManifest.xml', '-S', 'res', '-I', androidJar, '-F', unsigned]);

// 4 · compile + dex
console.log('4/6 javac + dx…');
const classes = path.join(build, 'classes');
fs.mkdirSync(classes);
run('javac', ['--release', '8', '-classpath', androidJar, '-d', classes,
  'src/com/hereweholo/holome/MainActivity.java']);
run('dalvik-exchange', ['--dex', `--output=${path.join(build, 'classes.dex')}`, classes]);
run('aapt', ['add', 'unsigned.apk', 'classes.dex'], { cwd: build });

// 5 · align + debug-sign (keystore generated once, kept out of git)
console.log('5/6 zipalign + sign…');
const aligned = path.join(build, 'aligned.apk');
run('zipalign', ['-f', '4', unsigned, aligned]);
const keystore = path.join(here, '.cache', 'debug.keystore');
if (!fs.existsSync(keystore)) {
  run('keytool', ['-genkeypair', '-keystore', keystore, '-storepass', 'android', '-keypass', 'android',
    '-alias', 'androiddebugkey', '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000',
    '-dname', 'CN=HEREweHOLO debug']);
}
const apk = path.join(dist, 'HoloMe-debug.apk');
run('apksigner', ['sign', '--ks', keystore, '--ks-pass', 'pass:android', '--key-pass', 'pass:android',
  '--out', apk, aligned]);

// 6 · verify: signature + manifest as Android will read it
console.log('6/6 verify…');
run('apksigner', ['verify', apk]);
const badging = out('aapt', ['dump', 'badging', apk]);
if (!badging.includes("package: name='com.hereweholo.holome'")) throw new Error('badging: wrong package');
if (!badging.includes('android.permission.CAMERA')) throw new Error('badging: camera permission missing');
console.log(badging.split('\n').filter((l) => /^(package|sdkVersion|targetSdkVersion|application-label|launchable-activity|uses-permission)/.test(l)).join('\n'));
console.log(`\nOK → ${apk} (${(fs.statSync(apk).size / 1024).toFixed(0)} kB, DEBUG-signed — sideload only)`);
