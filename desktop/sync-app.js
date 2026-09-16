// Kopieert de Studio-app (single-file webapp) naar desktop/app/ zodat
// electron-builder hem kan meenemen. De bron in studio/ blijft leidend;
// desktop/app/ staat in .gitignore en wordt bij elke build opnieuw gevuld.
'use strict';

const fs = require('fs');
const path = require('path');

const studio = path.join(__dirname, '..', 'studio');
const destDir = path.join(__dirname, 'app');

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(path.join(studio, 'index.html'), path.join(destDir, 'index.html'));
console.log('app/index.html gesynchroniseerd vanuit studio/');

// De vendormap moet mee: zonder die bestanden kan de app geen AI-avatar
// openen, want die bibliotheken worden vanaf schijf ingeladen. Ze staan
// naast index.html, dus de map moet dezelfde naam en plek houden.
const vendorSrc = path.join(studio, 'vendor');
const vendorDest = path.join(destDir, 'vendor');
if (fs.existsSync(vendorSrc)) {
  fs.rmSync(vendorDest, { recursive: true, force: true });
  fs.cpSync(vendorSrc, vendorDest, { recursive: true });
  const n = fs.readdirSync(vendorDest).length;
  console.log(`app/vendor/ gesynchroniseerd (${n} bestanden)`);
} else {
  console.warn('LET OP: studio/vendor ontbreekt — AI-avatars werken niet in deze build');
}
