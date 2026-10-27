// Reeks met klikker: op nummer, wachtlus bij het opstarten, > via de
// wachtvideo, < 1× opnieuw / 2× vorige, naadloos naar beeld 0 van de
// wachtvideo, muziek stil tijdens de reeks, menu met 5× tikken.
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
  while (Date.now() < eind) { if (await p.evaluate(fn, arg)) return true; await wacht(80); }
  return false;
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROMIUM, args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(APP);
  await p.waitForFunction(() => typeof Reeks !== 'undefined');
  // Bewust door elkaar toegevoegd: de nummers in de naam bepalen de volgorde.
  await p.setInputFiles('#mediaInput', [M('3 slot.webm'), M('1 intro.webm'), M('2 uitleg.webm'), M('wacht.webm'), M('kort.mp3'), M('clip.webm')]);
  await p.waitForFunction(() => mediaCache.size === 6);
  await p.evaluate(() => {
    const id = Object.fromEntries([...mediaCache.values()].map((m) => [m.name, m.id]));
    Object.assign(config.reeks, { aan: true, items: [id['3 slot.webm'], id['1 intro.webm'], id['2 uitleg.webm']],
      wachtId: id['wacht.webm'], opNummer: true });
    // Achtergrondmodus met muziek: die moet zwijgen zolang de reeks loopt.
    Object.assign(config.screensaver, { enabled: true, background: true, mediaIds: [id['clip.webm']] });
    Object.assign(config.screensaver.muziek, { aan: true, bron: 'bestand', mediaId: id['kort.mp3'], modus: 'loop' });
    save();
  });

  console.log('1. Opstarten');
  await p.reload();
  await p.waitForFunction(() => typeof Reeks !== 'undefined' && mediaCache.size === 6);
  check('wachtlus loopt vanzelf na het opstarten', await tot(p, () => Reeks.actief && Reeks.fase === 'wacht', 6000),
    await p.evaluate(() => ({ actief: Reeks.actief, fase: Reeks.fase })));
  check('volgorde op nummer: 1, 2, 3', await p.evaluate(() => config.reeks.items.map((i) => mediaCache.get(i).name).join() === '1 intro.webm,2 uitleg.webm,3 slot.webm'),
    await p.evaluate(() => config.reeks.items.map((i) => mediaCache.get(i).name)));
  await wacht(1500);
  check('muziek zwijgt zolang de reeks loopt', !(await p.evaluate(() => Muziek.speelt)));
  check('geen menuknoppen in beeld', await p.evaluate(() => [...document.querySelectorAll('.fab')].every((f) => getComputedStyle(f).display === 'none')));

  const voor = () => p.evaluate(() => {
    const v = [...document.querySelectorAll('#reeksLaag video')].find((x) => x.classList.contains('voor'));
    return v ? { naam: [...mediaCache.values()].find((m) => m.url === v.src)?.name, t: v.currentTime, paused: v.paused } : null;
  });

  console.log('2. > via de wachtvideo');
  await p.keyboard.press('PageDown');
  check('> start video 1', await tot(p, () => Reeks.fase === 'video' && Reeks.pos === 1, 2000));
  await wacht(300);
  check('in beeld: 1 intro', (await voor())?.naam === '1 intro.webm', await voor());
  await p.keyboard.press('PageDown');
  await wacht(300);
  check('> tijdens de video: video speelt gewoon uit', await p.evaluate(() => Reeks.fase === 'video' && Reeks.pos === 1));
  check('na afloop vanzelf de wachtvideo', await tot(p, () => Reeks.fase === 'wacht', 4000));
  const o = await p.evaluate(() => Reeks.laatsteOvergang);
  check('wachtvideo begint op beeld 0', typeof o.wachtStart === 'number' && o.wachtStart < 0.1, o);
  await p.keyboard.press('PageDown');
  check('> in de wachtlus: video 2', await tot(p, () => Reeks.fase === 'video' && Reeks.pos === 2, 2000));
  await wacht(900);

  console.log('3. < 1× opnieuw, 2× vorige');
  const t1 = (await voor()).t;
  await p.keyboard.press('PageUp');
  await wacht(1000);   // de box wacht 0,6 s of er een tweede < komt
  const na = await voor();
  check('1× <: dezelfde video opnieuw van voren', await p.evaluate(() => Reeks.pos === 2) && na.naam === '2 uitleg.webm' && na.t < t1, { t1, na });
  await p.keyboard.press('PageUp');
  await wacht(150);
  await p.keyboard.press('PageUp');
  check('2× snel <: vorige video', await tot(p, () => Reeks.pos === 1 && Reeks.fase === 'video', 1500));
  await tot(p, () => Reeks.fase === 'wacht', 4000);
  await p.keyboard.press('PageDown');
  await tot(p, () => Reeks.pos === 2, 1500);
  await tot(p, () => Reeks.fase === 'wacht', 4000);
  await p.keyboard.press('PageDown');
  await tot(p, () => Reeks.pos === 3, 1500);
  await tot(p, () => Reeks.fase === 'wacht', 4000);
  await p.keyboard.press('PageDown');
  check('na de laatste begint > weer bij 1', await tot(p, () => Reeks.pos === 1 && Reeks.fase === 'video', 2000),
    await p.evaluate(() => ({ pos: Reeks.pos, fase: Reeks.fase })));

  console.log('4. Muziek blijft stil, menu met 5× tikken');
  check('muziek nog steeds stil', !(await p.evaluate(() => Muziek.speelt)));
  for (let i = 0; i < 5; i++) { await p.touchscreen.tap(20, 20); await wacht(80); }
  await wacht(400);
  check('5× tikken linksboven opent het menu, reeks stopt', await p.evaluate(() => panel.classList.contains('open') && !Reeks.actief));
  await p.evaluate(() => closeEditor());
  await p.keyboard.press('PageDown');
  check('na het menu: > start weer de reeks (wachtlus)', await tot(p, () => Reeks.actief, 2000));
  await p.keyboard.press('Home');
  check('Home stopt de reeks', await tot(p, () => !Reeks.actief, 1500));
  check('zonder reeks: muziek bij de achtergrondplaylist', await tot(p, () => Muziek.speelt, 4000));

  check('geen JS-fouten', errs.length === 0, errs.slice(0, 3));
  console.log(`\n${fout ? 'FOUT' : 'OK  '}: ${ok}/${ok + fout}`);
  await b.close();
  process.exit(fout ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
