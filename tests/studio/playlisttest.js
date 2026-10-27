// Screensaver-playlist: aantikken, geen dubbele, verder met de volgende,
// kapotte video overslaan, vastgelopen video overslaan.
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
async function tot(p, fn, ms = 6000, arg) {
  const eind = Date.now() + ms;
  while (Date.now() < eind) { if (await p.evaluate(fn, arg)) return true; await wacht(100); }
  return false;
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROMIUM, args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(APP);
  await p.waitForFunction(() => typeof Toetsenbord !== 'undefined');
  await p.setInputFiles('#mediaInput', [M('1 intro.webm'), M('2 uitleg.webm'), M('3 slot.webm'), M('3b kapot.webm')]);
  await p.waitForFunction(() => mediaCache.size === 4);
  const id = await p.evaluate(() => Object.fromEntries([...mediaCache.values()].map((m) => [m.name, m.id])));
  const namen = () => p.evaluate(() => config.screensaver.mediaIds.map((i) => mediaCache.get(i)?.name));

  console.log('1. Aantikken op de holobox');
  await p.evaluate(() => { config.screensaver.enabled = true; save(); openEditor(); });
  await wacht(300);
  await p.locator('#startScherm .st-tegel', { hasText: 'Screensaver' }).tap();
  await wacht(300);
  check('geen keuzelijst meer, maar een lijst om aan te tikken', await p.locator('#svPlaylist select').count() === 0 &&
    await p.locator('.sv-kies-rij').count() === 4);
  const rij = (n) => p.locator(`.sv-kies-rij[data-id="${id[n]}"]`);
  await rij('2 uitleg.webm').tap(); await wacht(150);
  await rij('1 intro.webm').tap(); await wacht(150);
  check('aangetikt = in de playlist, in die volgorde', JSON.stringify(await namen()) === JSON.stringify(['2 uitleg.webm', '1 intro.webm']), await namen());
  check('aangetikte rij toont vinkje en nummer', (await rij('2 uitleg.webm').textContent()).includes('✓') &&
    (await rij('2 uitleg.webm').getAttribute('aria-pressed')) === 'true');
  await rij('2 uitleg.webm').tap(); await wacht(150);
  check('nog een keer tikken haalt hem eruit (niet dubbel)', JSON.stringify(await namen()) === JSON.stringify(['1 intro.webm']), await namen());
  await p.locator('.sv-kies-kop button', { hasText: 'Alle' }).tap(); await wacht(150);
  check('Alle: elke video één keer', (await namen()).length === 4 && new Set(await namen()).size === 4, await namen());
  await p.locator('.sv-kies-kop button', { hasText: 'Geen' }).tap(); await wacht(150);
  check('Geen: playlist leeg', (await namen()).length === 0);
  // Een oud project met dubbele video's in de playlist
  await p.evaluate((ids) => { config.screensaver.mediaIds = ids; save(); renderSaver(); },
    [id['1 intro.webm'], id['1 intro.webm'], id['2 uitleg.webm'], id['1 intro.webm']]);
  check('dubbele uit een oud project verdwijnen', JSON.stringify(await namen()) === JSON.stringify(['1 intro.webm', '2 uitleg.webm']), await namen());
  await p.evaluate(() => closeEditor());

  console.log('2. Afspelen: alle video\'s komen aan bod, de kapotte wordt overgeslagen');
  await p.evaluate((ids) => { config.screensaver.mediaIds = ids; config.screensaver.transitionSec = 0.4; save(); },
    [id['1 intro.webm'], id['2 uitleg.webm'], id['3b kapot.webm'], id['3 slot.webm']]);
  await p.evaluate(() => enterSaver());
  const gezien = [];
  const eind = Date.now() + 14000;
  while (Date.now() < eind) {
    const n = await p.evaluate(() => { const a = saverRotator.activeEl; return !a.paused && a.currentTime > 0.2 ? [...mediaCache.values()].find((m) => m.url === a.src)?.name : null; });
    if (n && gezien[gezien.length - 1] !== n) gezien.push(n);
    await wacht(150);
  }
  check('1 → 2 → 3 (kapotte overgeslagen) → weer 1', gezien.slice(0, 4).join(' | ') === '1 intro.webm | 2 uitleg.webm | 3 slot.webm | 1 intro.webm', gezien);
  check('kapotte nooit in beeld', !gezien.includes('3b kapot.webm'));
  check('status: nu in beeld', /Nu in beeld: \d van 4/.test(await p.evaluate(() => { renderSvNu(); return $('#svNu').textContent; })),
    await p.evaluate(() => $('#svNu').textContent));

  console.log('3. Volgende keer verder met de volgende');
  await tot(p, () => saverRotator.huidige?.name === '1 intro.webm', 8000);
  await p.evaluate(() => exitSaver());
  await wacht(1200);
  await p.evaluate(() => enterSaver());
  await wacht(400);
  check('na 1 begint de volgende keer 2', await p.evaluate(() => saverRotator.huidige?.name) === '2 uitleg.webm', await p.evaluate(() => saverRotator.huidige?.name));
  await p.evaluate(() => exitSaver());
  await wacht(1200);

  console.log('4. Vastgelopen video wordt na 8 s overgeslagen');
  await p.evaluate((ids) => { config.screensaver.mediaIds = ids; save(); }, [id['1 intro.webm'], id['2 uitleg.webm']]);
  await p.evaluate(() => enterSaver());
  await wacht(500);
  const voor = await p.evaluate(() => saverRotator.huidige?.name);
  // de decoder "loopt vast": de speler stopt zonder dat iemand pauze gaf
  // (afspeelsnelheid 0: de speler 'speelt' nog, maar de tijd staat stil)
  await p.evaluate(() => { const v = saverRotator.activeEl; v.loop = false; v.playbackRate = 0; });
  check('niet al eerder overgeslagen', await p.evaluate((v) => saverRotator.huidige?.name === v, voor));
  const door = await tot(p, (v) => saverRotator.huidige?.name !== v && !saverRotator.activeEl.paused, 12000, voor);
  check('na een stilstand door naar de volgende', door, { voor, na: await p.evaluate(() => saverRotator.huidige?.name) });
  await p.evaluate(() => { saverRotator.activeEl.playbackRate = 1; });
  const nu = await p.evaluate(() => saverRotator.huidige?.name);
  await p.evaluate(() => { const v = saverRotator.activeEl; v.loop = false; v.pause(); });
  await wacht(10000);
  check('bewust gepauzeerd: blijft staan', await p.evaluate((v) => saverRotator.huidige?.name === v, nu));
  await p.evaluate(() => exitSaver());

  console.log('5. Eén video loopt in een lus');
  await p.evaluate((i) => { config.screensaver.mediaIds = [i]; save(); enterSaver(); }, id['1 intro.webm']);
  await wacht(3500);
  check('blijft spelen na het einde (lus)', await p.evaluate(() => !saverRotator.activeEl.paused && saverRotator.activeEl.loop));
  await p.evaluate(() => exitSaver());

  check('geen JS-fouten', errs.length === 0, errs.slice(0, 3));
  console.log(`\n${fout ? 'FOUT' : 'OK  '}: ${ok}/${ok + fout}`);
  await b.close();
  process.exit(fout ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
