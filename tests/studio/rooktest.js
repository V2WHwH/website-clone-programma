// Algemene rooktest: alle tabbladen breed, aanraakmenu staand, 5× tikken,
// en schermafbeeldingen van het muziekonderdeel voor het bedieningsboek.
const { chromium } = require('playwright');
const { APP, MEDIA, CHROMIUM, VERSIE } = require('./hulp');
const path = require('path');
const M = (f) => path.join(MEDIA, f);
let ok = 0, fout = 0;
const check = (naam, cond, info) => {
  if (cond) ok++; else fout++;
  console.log(`   ${cond ? '✓' : '✗'} ${naam} ${info !== undefined ? JSON.stringify(info) : ''}`);
};
const wacht = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const b = await chromium.launch({ executablePath: CHROMIUM,
    args: ['--autoplay-policy=no-user-gesture-required'] });

  console.log('Breed (1600×1000)');
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(APP);
  await p.waitForFunction(() => typeof Muziek !== 'undefined');
  check('geen menuknoppen op het scherm', await p.evaluate(() =>
    [...document.querySelectorAll('.fab')].every((f) => getComputedStyle(f).display === 'none')));
  for (let i = 0; i < 5; i++) { await p.mouse.click(20, 20); await wacht(60); }
  check('5× tikken linksboven opent het menu', await p.evaluate(() => panel.classList.contains('open')));
  await p.setInputFiles('#mediaInput', [M('clip.webm'), M('lang.mp3')]);
  await p.waitForFunction(() => mediaCache.size === 2);
  const tabs = await p.$$eval('#panel [data-tab]', (bs) => [...new Set(bs.map((x) => x.dataset.tab))]);
  for (const t of tabs) {
    await p.click(`#panel button[data-tab="${t}"]`).catch(() => {});
    await wacht(150);
  }
  check(`alle ${tabs.length} tabbladen geopend zonder fouten`, errs.length === 0, errs.slice(0, 2));
  await p.click('#panel button[data-tab="saver"]');
  await p.evaluate(() => {
    const id = [...mediaCache.values()].find((m) => m.kind === 'audio').id;
    Object.assign(config.screensaver.muziek, { aan: true, mediaId: id, modus: 'pauze', pauzeMin: 10 });
    config.screensaver.enabled = true; save(); renderMuziekKeuze();
  });
  const kaart = await p.$('#svMuziekAan');
  check('muziekonderdeel zichtbaar in het brede menu', await kaart.isVisible());
  const card = await p.evaluateHandle(() => $('#svMuziekAan').closest('.card'));
  await card.scrollIntoViewIfNeeded();
  await card.asElement().screenshot({ path: path.join(MEDIA, 'muziek-breed.png') });

  console.log('Staand (1080×1920, holobox)');
  const ctx2 = await b.newContext({ viewport: { width: 1080, height: 1920 } });
  const q = await ctx2.newPage();
  const errs2 = [];
  q.on('pageerror', (e) => errs2.push(e.message));
  await q.goto(APP);
  await q.waitForFunction(() => typeof Muziek !== 'undefined');
  await q.setInputFiles('#mediaInput', [M('lang.mp3')]);
  await q.waitForFunction(() => mediaCache.size === 1);
  await q.evaluate(() => {
    const id = [...mediaCache.values()][0].id;
    Object.assign(config.screensaver.muziek, { aan: true, mediaId: id });
    config.screensaver.enabled = true; save();
    openEditor();
  });
  await wacht(300);
  check('aanraakmenu actief', await q.evaluate(() => document.body.classList.contains('aanraakmenu')));
  const tegel = q.locator('#startScherm .st-tegel', { hasText: 'Screensaver' });
  check('tegel Screensaver meldt de muziek', (await tegel.textContent()).includes('muziek'), await tegel.textContent());
  await tegel.click();
  await wacht(400);
  const m2 = q.locator('#svMuziekAan');
  check('muziekonderdeel bereikbaar op de holobox', await q.evaluate(() => {
    const r = $('#svMuziekAan').closest('.card').getBoundingClientRect(); return r.height > 100;
  }));
  const card2 = await q.evaluateHandle(() => $('#svMuziekAan').closest('.card'));
  await card2.asElement().scrollIntoViewIfNeeded();
  await card2.asElement().screenshot({ path: path.join(MEDIA, 'muziek-staand.png') });
  check('geen JS-fouten (staand)', errs2.length === 0, errs2.slice(0, 2));
  check('geen JS-fouten (breed)', errs.length === 0, errs.slice(0, 2));
  console.log(`\n${fout ? 'FOUT' : 'OK  '}: ${ok}/${ok + fout}`);
  await b.close();
  process.exit(fout ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
