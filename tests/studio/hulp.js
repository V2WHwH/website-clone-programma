// Gedeeld door alle studio-tests: waar de app staat, welke browser, en waar
// de testmedia liggen (gemaakt door maak-media.js).
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const APP = pathToFileURL(path.resolve(__dirname, '../../studio/index.html')).href;
const MEDIA = path.join(__dirname, 'media');
// Op de ontwikkelmachine staat Chromium al klaar; in CI gebruikt Playwright
// zijn eigen download (npx playwright install chromium).
const CHROMIUM = process.env.CHROMIUM ||
  (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const VERSIE = require('../../desktop/package.json').version;

module.exports = { APP, MEDIA, CHROMIUM, VERSIE };
