// Muziek bij de screensaver: keuze, doorlopend / één keer / pauze, zwijgen
// tijdens een knopvideo, proefknop, migratie en geen JS-fouten.
const { chromium } = require('playwright');
const { APP, MEDIA, CHROMIUM, VERSIE } = require('./hulp');
const path = require('path');
const M = (f) => path.join(MEDIA, f);
const LANG = process.env.LANG_TEST === '1';   // pauze-test wacht echt een minuut

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
  const b = await chromium.launch({ executablePath: CHROMIUM,
    args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(APP);
  await p.waitForFunction(() => typeof Muziek !== 'undefined' && typeof config !== 'undefined');

  console.log('1. Standaard en migratie');
  check('versie gelijk aan de Windows-app (' + VERSIE + ')', await p.evaluate(() => APP_VERSION) === VERSIE);
  check('configversie 21', await p.evaluate(() => config.version) === 21);
  check('muziek staat standaard uit, doorlopend, 5 min, 60%',
    await p.evaluate(() => JSON.stringify(config.screensaver.muziek)) ===
    JSON.stringify({ aan: false, bron: 'bestand', mediaId: null, url: '', modus: 'loop', pauzeMin: 5, volume: 60 }));
  check('mp3 is muziek, webm blijft video',
    await p.evaluate(() => [mediaKind('a.mp3'), mediaKind('b.M4A'), mediaKind('c.wav'), mediaKind('d.webm'), mediaKind('e.mp4')].join()) ===
    'audio,audio,audio,video,video');
  // Project uit 2.31 (versie 20, zonder muziek) laden
  await p.evaluate(() => {
    const c = JSON.parse(localStorage.getItem('hwh_studio_config_v1'));
    c.version = 20; delete c.screensaver.muziek;
    localStorage.setItem('hwh_studio_config_v1', JSON.stringify(c));
  });
  await p.reload();
  await p.waitForFunction(() => typeof Muziek !== 'undefined');
  check('oud project krijgt muziek-instelling (uit)', await p.evaluate(() =>
    config.version === 21 && config.screensaver.muziek && config.screensaver.muziek.aan === false));

  console.log('2. Bestanden toevoegen');
  await p.setInputFiles('#mediaInput', [M('clip.webm')]);
  await tot(p, () => [...mediaCache.values()].some((m) => m.kind === 'video'));
  const vid = await p.evaluate(() => [...mediaCache.values()].find((m) => m.kind === 'video').id);
  await p.evaluate(() => openEditor());
  await p.click('#panel [data-tab="saver"]');
  await p.waitForSelector('#svMuziekAan', { state: 'attached' });
  check('pauzeveld verborgen bij doorlopend', await p.evaluate(() => $('#svMuziekPauzeVeld').classList.contains('hidden')));
  check('uitleg: uit', (await p.textContent('#svMuziekNote')).startsWith('Uit'));
  await p.setInputFiles('#svMuziekInput', [M('kort.mp3')]);
  await tot(p, () => !!Muziek.nummer());
  const mz = await p.evaluate(() => ({ ...config.screensaver.muziek, kind: mediaCache.get(config.screensaver.muziek.mediaId)?.kind }));
  check('nummer toegevoegd, gekozen en muziek aan', mz.aan && mz.kind === 'audio', mz);
  check('keuzelijst toont het nummer', (await p.$eval('#svMuziekId', (s) => s.selectedOptions[0]?.textContent)) === 'kort.mp3');
  check('uitleg noemt het nummer', (await p.textContent('#svMuziekNote')).includes('“kort.mp3” speelt doorlopend'));
  await p.setInputFiles('#mediaInput', [M('lang.mp3')]);
  await tot(p, () => [...mediaCache.values()].filter((m) => m.kind === 'audio').length === 2);
  const lang = await p.evaluate(() => [...mediaCache.values()].find((m) => m.name === 'lang.mp3').id);
  const kort = mz.mediaId;
  check('ook via de mediabibliotheek', !!lang);
  check('knoppen kunnen geen muziek kiezen', await p.evaluate(() =>
    ![...mediaSelect(null, () => {}).options].some((o) => mediaCache.get(o.value)?.kind === 'audio')));
  await p.click('#panel [data-tab="media"]').catch(() => {});
  await p.evaluate(() => renderMediaList());
  check('bibliotheek toont muziek als muziek', (await p.textContent('#mediaList')).includes('Muziek ·'));
  check('muziek speelt niet zonder screensaver', !(await p.evaluate(() => Muziek.speelt)));

  console.log('3. Doorlopend');
  await p.evaluate((id) => {
    config.screensaver.enabled = true; config.screensaver.mediaIds = [id];
    config.screensaver.sound = false; save();
    closeEditor(); enterSaver();
  }, vid);
  check('speelt zodra de screensaver begint', await tot(p, () => Muziek.speelt, 3000));
  await wacht(1800);
  const vol = await p.evaluate(() => Muziek.volume);
  check('na het infaden op 60%', Math.abs(vol - 0.6) < 0.02, vol);
  await wacht(2500);
  check('kort nummer (3 s) loopt na 4 s nog door', await p.evaluate(() => Muziek.speelt && Muziek.positie < 3));
  await p.evaluate(() => { config.masterVolume = 50; });
  await wacht(400);
  check('hoofdvolume telt mee (60% × 50%)', Math.abs(await p.evaluate(() => Muziek.volume) - 0.3) < 0.02,
    await p.evaluate(() => Muziek.volume));
  await p.evaluate(() => { config.masterVolume = 100; exitSaver(); });
  check('stil binnen een halve seconde na aanraken', await tot(p, () => !Muziek.speelt, 700));

  console.log('4. Eén keer');
  await p.evaluate(() => { config.screensaver.muziek.modus = 'once'; save(); enterSaver(); });
  check('speelt', await tot(p, () => Muziek.speelt, 3000));
  check('na afloop stil en klaar', await tot(p, () => !Muziek.speelt && Muziek.klaar, 5000));
  await wacht(1500);
  check('blijft daarna stil', !(await p.evaluate(() => Muziek.speelt)));
  await p.evaluate(() => { exitSaver(); });
  await wacht(300);
  await p.evaluate(() => enterSaver());
  check('opnieuw bij de volgende screensaver, vooraan', await tot(p, () => Muziek.speelt && Muziek.positie < 1.5, 3000));
  await p.evaluate(() => exitSaver());
  await tot(p, () => !Muziek.speelt, 1000);

  console.log('5. Pauze');
  await p.evaluate(() => { config.screensaver.muziek.modus = 'pauze'; config.screensaver.muziek.pauzeMin = 1; save(); enterSaver(); });
  check('speelt', await tot(p, () => Muziek.speelt, 3000));
  check('na afloop pauze van een minuut', await tot(p, () => !Muziek.speelt && Muziek.wachtTot > Date.now(), 5000));
  const rest = await p.evaluate(() => Muziek.wachtTot - Date.now());
  check('pauze ≈ 60 s', rest > 55000 && rest <= 60000, rest);
  // Niet klikken: een aanraking beëindigt de screensaver (en daarmee de pauze).
  await wacht(1200);
  const note = await p.evaluate(() => { renderMuziekNote(); return $('#svMuziekNote').textContent; });
  check('uitleg telt de pauze af', /Nu: pauze, nog 0:5\d\./.test(note), note.slice(-40));
  check('pauzeveld zichtbaar', !(await p.evaluate(() => $('#svMuziekPauzeVeld').classList.contains('hidden'))));
  await p.mouse.click(800, 500);
  check('aanraken stopt de screensaver en de pauze', await tot(p, () => !saverActive && !Muziek.wachtTot, 1500));
  await p.evaluate(() => enterSaver());
  check('volgende screensaver begint meteen met muziek', await tot(p, () => Muziek.speelt && Muziek.positie < 1.5, 3000));
  if (LANG) {
    await p.evaluate(() => enterSaver());
    check('na de pauze weer, vooraan', await tot(p, () => Muziek.speelt && Muziek.positie < 1.5, 70000));
  }
  await p.evaluate(() => exitSaver());
  await tot(p, () => !Muziek.speelt, 1000);

  console.log('6. Achtergrondmodus en een knopvideo');
  await p.evaluate((id) => {
    const mz = config.screensaver.muziek; mz.modus = 'loop'; mz.mediaId = id;
    config.screensaver.background = true; save(); syncBackgroundRotator();
  }, lang);
  check('speelt achter de knoppen', await tot(p, () => Muziek.speelt, 3000));
  await wacht(2500);
  const voor = await p.evaluate(() => Muziek.positie);
  await p.evaluate((id) => playMedia(id), vid);
  check('zwijgt tijdens de knopvideo', await tot(p, () => !Muziek.speelt, 1000));
  await wacht(1500);
  const tijdens = await p.evaluate(() => Muziek.positie);
  check('staat stil tijdens de video', Math.abs(tijdens - voor) < 1.2, { voor, tijdens });
  await p.evaluate(() => stopPlaying());
  check('gaat daarna verder', await tot(p, () => Muziek.speelt, 3000));
  const na = await p.evaluate(() => Muziek.positie);
  check('waar hij was, niet vooraan', na >= tijdens - 0.2 && na > 1.5, { tijdens, na });
  await p.evaluate(() => { config.screensaver.background = false; save(); syncBackgroundRotator(); });
  check('stopt als de achtergrondmodus uitgaat', await tot(p, () => !Muziek.speelt, 1000));

  console.log('7. Proefknop en uit');
  await p.evaluate(() => openEditor());
  await p.click('#panel [data-tab="saver"]');
  await p.click('#svMuziekTest');
  check('proef speelt zonder screensaver', await tot(p, () => Muziek.speelt, 2000));
  check('knop wordt Stoppen', (await p.textContent('#svMuziekTest')).includes('Stoppen'));
  await p.click('#svMuziekTest');
  check('nog eens drukken stopt', await tot(p, () => !Muziek.speelt, 1000));
  await p.click('#svMuziekAan');
  check('schakelaar zet hem uit', await p.evaluate(() => config.screensaver.muziek.aan === false));
  await p.evaluate(() => { closeEditor(); enterSaver(); });
  await wacht(1500);
  check('uit = geen muziek bij de screensaver', !(await p.evaluate(() => Muziek.speelt)));
  await p.evaluate(() => exitSaver());

  console.log('8. Bewaard na herladen');
  await p.evaluate(() => { config.screensaver.muziek.modus = 'pauze'; config.screensaver.muziek.pauzeMin = 7; save(); });
  await p.reload();
  await p.waitForFunction(() => typeof Muziek !== 'undefined' && mediaCache.size >= 3);
  const bewaard = await p.evaluate(() => ({ ...config.screensaver.muziek, naam: Muziek.nummer()?.name }));
  check('modus, pauze en nummer bewaard', bewaard.modus === 'pauze' && bewaard.pauzeMin === 7 && bewaard.naam === 'lang.mp3', bewaard);
  check('zoekfunctie kent muziek', await p.evaluate(() =>
    ZOEK_EXTRA.some((z) => z.tab === 'saver' && z.woorden.includes('muziek') && z.tekst.startsWith('Muziek bij de screensaver'))));

  check('geen JS-fouten', errs.length === 0, errs.slice(0, 3));
  console.log(`\n${fout ? 'FOUT' : 'OK  '}: ${ok}/${ok + fout}`);
  await b.close();
  process.exit(fout ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
