// Kopieert de Studio-app (single-file webapp) naar desktop/app/ zodat
// electron-builder hem kan meenemen. De bron in studio/ blijft leidend;
// desktop/app/ staat in .gitignore en wordt bij elke build opnieuw gevuld.
'use strict';

const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'studio', 'index.html');
const destDir = path.join(__dirname, 'app');

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, path.join(destDir, 'index.html'));
console.log('app/index.html gesynchroniseerd vanuit studio/');
