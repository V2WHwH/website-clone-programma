// Maakt de testmedia in ./media (staat in .gitignore). Heeft ffmpeg nodig.
const { execFileSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { MEDIA } = require('./hulp');

fs.mkdirSync(MEDIA, { recursive: true });
const ff = (...args) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
const uit = (f) => path.join(MEDIA, f);

// Video met beeld en geluid, 6 s
ff('-f', 'lavfi', '-i', 'testsrc=size=640x360:rate=25:duration=6', '-f', 'lavfi', '-i', 'sine=frequency=220:duration=6',
  '-c:v', 'libvpx', '-b:v', '400k', '-c:a', 'libvorbis', '-shortest', uit('clip.webm'));
// Genummerde korte video's (2 s) en een wachtvideo voor de reeks
for (const [naam, kleur] of [['1 intro', 'red'], ['2 uitleg', 'green'], ['3 slot', 'blue'], ['wacht', 'gray']]) {
  ff('-f', 'lavfi', '-i', `color=c=${kleur}:s=320x180:r=25:d=2`, '-c:v', 'libvpx', '-b:v', '200k', uit(`${naam}.webm`));
}
// Muziek: kort (3 s) en lang (20 s)
ff('-f', 'lavfi', '-i', 'sine=frequency=440:duration=3', '-c:a', 'libmp3lame', '-b:a', '96k', uit('kort.mp3'));
ff('-f', 'lavfi', '-i', 'sine=frequency=330:duration=20', '-c:a', 'libmp3lame', '-b:a', '96k', uit('lang.mp3'));
// Een kapotte video: willekeurige bytes
fs.writeFileSync(uit('3b kapot.webm'), crypto.randomBytes(60000));
console.log('Testmedia klaar in', MEDIA);
