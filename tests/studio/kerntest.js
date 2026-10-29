// Kern van de Studio zoals een beheerder en een bezoeker hem gebruiken:
// media toevoegen en verwijderen, afspeelinstellingen per video (bijsnijden,
// volume, faden, herhalen, laatste beeld), knoppen maken en aantikken,
// playlist per knop, stoppen, dupliceren, verwijderen, ongedaan maken en
// groepen. Breed scherm (1600×1000), dus het brede menu, geen aanraakmenu.
const { chromium } = require('playwright');
const { APP, CHROMIUM, VERSIE } = require('./hulp');
const { F, wacht, tot, PNG, OBJ, ids, knoppen, stand, punt, tik, sleep, volg, volgorde,
  menuOpen, menuDicht, tab, kies, insp, inspOpen, zetAfspeel } = require('./kernhulp');
let ok = 0, fout = 0;
const check = (naam, cond, info) => {
  if (cond) ok++; else fout++;
  console.log(`   ${cond ? '✓' : '✗'} ${naam} ${info !== undefined ? JSON.stringify(info) : ''}`);
};

(async () => {
  const b = await chromium.launch({ executablePath: CHROMIUM, args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } });
  const p = await ctx.newPage();
  const errs = [], consoleErrs = [], dialogen = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text()); });
  p.on('dialog', (d) => { dialogen.push(d.message()); d.accept(); });
  await p.goto(APP);
  await p.waitForFunction(() => typeof mediaGeladen !== 'undefined' && mediaGeladen);
  check(`versie van de app is ${VERSIE}`, await p.evaluate(() => APP_VERSION) === VERSIE, await p.evaluate(() => APP_VERSION));

  console.log('1. Media toevoegen');
  await menuOpen(p);
  check('menu open, breed (geen aanraakmenu)', await p.evaluate(() => panel.classList.contains('open') && !AanraakMenu.aan));
  await tab(p, 'media');
  // Muziek bewust als eerste: een nieuwe knop mag daar niet aan vast komen te zitten.
  await p.setInputFiles('#mediaInput', [F('kort.mp3'), F('clip.webm'), F('1 intro.webm'), F('2 uitleg.webm'), F('3 slot.webm'), PNG, OBJ]);
  await p.waitForFunction(() => mediaCache.size === 7);
  const soorten = await p.evaluate(() => Object.fromEntries([...mediaCache.values()].map((m) => [m.name, m.kind])));
  check('soort herkend: video, muziek, PNG, 3D', soorten['clip.webm'] === 'video' && soorten['kort.mp3'] === 'audio' &&
    soorten['knop.png'] === 'image' && soorten['kubus.obj'] === 'model', soorten);
  const lijst = await p.locator('#mediaList').innerText();
  check('medialijst toont alle 7 bestanden', ['kort.mp3', 'clip.webm', '1 intro.webm', '2 uitleg.webm', '3 slot.webm', 'knop.png', 'kubus.obj']
    .every((n) => lijst.includes(n)));
  check('muziek gemarkeerd als Muziek, 3D als 3D-object', lijst.includes('Muziek ·') && lijst.includes('3D-object ·'));
  check('PNG met miniatuur', await p.locator('#mediaList img').count() === 1);
  check('alleen video\'s hebben afspeelinstellingen', await p.locator('#mediaList button', { hasText: /^Instellingen$/ }).count() === 4);
  check('opgeslagen in IndexedDB', await p.evaluate(async () => (await dbAll()).filter((r) => !r.hidden).length) === 7);
  const id = await ids(p);

  console.log('2. Knop toevoegen en instellen');
  await tab(p, 'buttons');
  await p.click('#addBtn');
  let bs = await knoppen(p);
  check('+ Knop toevoegen maakt een knop', bs.length === 1, bs.length);
  const k1 = bs[0].id;
  check('nieuwe knop krijgt een video (niet het muziekbestand dat toevallig eerst staat)',
    await p.evaluate((i) => mediaCache.get(curButtons().find((b) => b.id === i).mediaId)?.kind === 'video', k1),
    await p.evaluate((i) => mediaCache.get(curButtons().find((b) => b.id === i).mediaId)?.name, k1));
  check('knop staat op het podium', await p.locator(`#buttonLayer .vbtn[data-id="${k1}"]`).count() === 1);
  await kies(p, k1);
  check('aanklikken in het podium selecteert hem', await p.evaluate((i) => selectedIds.has(i) && selectedIds.size === 1, k1));
  const label = insp(p).locator('label.field', { hasText: 'Tekst op de knop' }).locator('input');
  await label.fill('Welkom');
  check('tekst via de inspector', (await knoppen(p))[0].label === 'Welkom' &&
    (await p.locator(`#buttonLayer .vbtn[data-id="${k1}"]`).innerText()).includes('Welkom'));
  // Wat een bezoeker ziet als de knop zo blijft (muziekbestand als knopmedia)
  const mediaKeuze = insp(p).locator('label.field', { hasText: /^Media/ }).locator('select').first();
  check('inspector toont welke media de nieuwe knop heeft', await mediaKeuze.inputValue() === (await knoppen(p))[0].mediaId,
    { keuzelijst: await mediaKeuze.evaluate((x) => x.selectedOptions[0]?.textContent), knop: 'kort.mp3' });
  await menuDicht(p);
  await tik(p, k1);
  const zwart = await volg(p, 5000);
  check('zo\'n knop aantikken: geen zwart scherm zonder beeld en geluid', !zwart.some((x) => x.show && x.naam === 'kort.mp3' && x.muted),
    zwart.filter((x) => x.show).slice(-1));
  await p.evaluate(() => stopPlaying());
  await wacht(700);
  await menuOpen(p);
  await tab(p, 'buttons');
  await kies(p, k1);
  await insp(p).locator('label.field', { hasText: /^Media/ }).locator('select').first().selectOption(id['clip.webm']);
  check('video via de inspector', (await knoppen(p))[0].mediaId === id['clip.webm']);
  check('instellingen bewaard in localStorage', await p.evaluate((i) =>
    JSON.parse(localStorage.getItem('hwh_studio_config_v1')).scenes[0].buttons.find((b) => b.id === i)?.label === 'Welkom', k1));

  console.log('3. Afspeelinstellingen per video werken echt');
  await zetAfspeel(p, 'clip.webm', { trimStart: 2, trimEnd: 4.5, volume: 0.8, fadeSec: 1 });
  const ps = await p.evaluate((i) => config.mediaSettings[i], id['clip.webm']);
  check('instellingen opgeslagen', ps && ps.trimStart === 2 && ps.trimEnd === 4.5 && ps.volume === 0.8 && ps.fadeSec === 1, ps);
  await menuDicht(p);
  await tik(p, k1);
  let s = await volg(p, 9000);
  const loopt = s.filter((x) => x.show && !x.paused && x.naam === 'clip.webm' && x.t > 0.05);
  check('aantikken opent het afspeelvenster met de video', loopt.length > 3, s.slice(0, 3));
  const minT = Math.min(...loopt.map((x) => x.t)), maxT = Math.max(...loopt.map((x) => x.t));
  check('begint bij trimStart (2 s)', minT >= 1.85, { minT });
  check('stopt bij trimEnd (4,5 s), niet aan het eind (6 s)', maxT < 4.95 && maxT > 4.0, { maxT });
  check('geluid aan (niet gedempt) bij volume 0,8', loopt.some((x) => !x.muted && x.vol > 0.75), loopt.map((x) => x.vol));
  const eerste = loopt[0];
  check('fade-in: begint zacht', eerste && eerste.vol < 0.6, eerste);
  check('fade-uit: wordt zachter vlak voor het einde', loopt.filter((x) => x.t > 4.1).some((x) => x.vol < 0.55),
    loopt.filter((x) => x.t > 3.3).map((x) => [x.t, x.vol]));
  check('knoppen verborgen tijdens afspelen', loopt.every((x) => !x.knoppenZichtbaar));
  check('na afloop terug naar de knoppen', s.length && !s[s.length - 1].show && s[s.length - 1].knoppenZichtbaar, s[s.length - 1]);
  check('afspeelduur klopt met het stuk tussen 2 en 4,5 s', (() => {
    const a = s.find((x) => x.show && !x.paused && x.t > 0.05), e = s[s.length - 1];
    return a && e.ms - a.ms > 1500 && e.ms - a.ms < 4500;
  })(), { tot: s[s.length - 1].ms });

  console.log('4. Standaardvolume (niets ingesteld)');
  await menuOpen(p);
  await tab(p, 'buttons');
  await p.click('#addBtn');
  const k2 = (await knoppen(p)).find((x) => x.id !== k1).id;
  await p.evaluate(([k, m]) => { curButtons().find((b) => b.id === k).mediaId = m; save(); renderStage(); }, [k2, id['1 intro.webm']]);
  await menuDicht(p);
  await tik(p, k2);
  s = await volg(p, 6000);
  check('video zonder instellingen speelt helemaal af en sluit', volgorde(s).join() === '1 intro.webm' && !s[s.length - 1].show, volgorde(s));
  check('zonder ingesteld volume speelt de video gedempt (standaard volume 0)', s.filter((x) => x.show && !x.paused).every((x) => x.muted),
    'let op: ontwerpkeuze of fout? PLAY_DEFAULTS.volume = 0');

  console.log('5. Herhalen en laatste beeld');
  await menuOpen(p);
  await zetAfspeel(p, '1 intro.webm', { loop: true });
  check('Herhalen opgeslagen', await p.evaluate((i) => config.mediaSettings[i]?.loop === true, id['1 intro.webm']));
  await menuDicht(p);
  await tik(p, k2);
  s = await volg(p, 5500);
  const lus = s.filter((x) => x.show && x.naam === '1 intro.webm');
  const terug = lus.some((x, i) => i && x.t + 0.5 < lus[i - 1].t);
  check('herhalen: na 5 s nog in beeld en weer van voren begonnen', s[s.length - 1].show && !s[s.length - 1].paused && terug,
    lus.map((x) => x.t));
  await p.click('#stopPlay');
  check('✕ stopt de herhalende video', await tot(p, () => !playOverlay.classList.contains('show'), 2000));
  await wacht(700);
  check('na ✕ zijn de knoppen terug en is de speler leeg', await p.evaluate(() =>
    $('#buttonLayer').style.visibility !== 'hidden' && playVideo.paused && !playVideo.src));

  // Herhalen met een begin-bijsnijding: na elke ronde weer bij trimStart.
  await menuOpen(p);
  await zetAfspeel(p, 'clip.webm', { trimEnd: 0, loop: true, trimStart: 4 });
  await menuDicht(p);
  await tik(p, k1);
  s = await volg(p, 7000);
  const ronde = s.filter((x) => x.show && x.naam === 'clip.webm' && !x.paused);
  const naWissel = ronde.filter((x, i) => i && ronde.slice(0, i).some((y, j) => j && y.t + 0.5 < ronde[j - 1].t));
  check('herhalen + trimStart: tweede ronde begint weer bij 4 s, niet bij 0', naWissel.length > 0 && Math.min(...naWissel.map((x) => x.t)) >= 3.8,
    { tijden: ronde.map((x) => x.t) });
  await p.click('#stopPlay');
  await tot(p, () => !playOverlay.classList.contains('show'), 2000);
  await wacht(700);

  await menuOpen(p);
  await zetAfspeel(p, 'clip.webm', { loop: false, trimStart: 0 });
  await zetAfspeel(p, '1 intro.webm', { loop: false, holdLastFrame: true });
  await menuDicht(p);
  await tik(p, k2);
  s = await volg(p, 4500);
  const laatste = s[s.length - 1];
  check('laatste beeld: blijft na afloop staan (gepauzeerd aan het eind)', laatste.show && laatste.paused && laatste.t > 1.7, laatste);
  await p.click('#stopPlay');
  check('✕ sluit het stilstaande beeld', await tot(p, () => !playOverlay.classList.contains('show'), 2000));
  await wacht(700);

  console.log('6. Knoppen tonen tijdens afspelen (instelling)');
  await menuOpen(p);
  await tab(p, 'look');
  await p.locator('#cfgHideBtns').uncheck();
  check('schakelaar zet hideButtonsDuringPlay uit', await p.evaluate(() => config.hideButtonsDuringPlay === false));
  await menuDicht(p);
  await tik(p, k1);
  await tot(p, () => playOverlay.classList.contains('show') && !playVideo.paused, 4000);
  check('knoppenlaag blijft zichtbaar tijdens afspelen', (await stand(p)).knoppenZichtbaar);
  await p.click('#stopPlay');
  await tot(p, () => !playOverlay.classList.contains('show'), 2000);
  await wacht(700);
  await p.evaluate(() => { config.hideButtonsDuringPlay = true; save(); });

  console.log('7. Playlist per knop');
  await menuOpen(p);
  await tab(p, 'buttons');
  await kies(p, k2);
  await zetAfspeel(p, '1 intro.webm', { holdLastFrame: false });
  await tab(p, 'buttons');
  await kies(p, k2);
  const pl = () => insp(p).locator('select[data-role="playlist-add"]');
  await pl().selectOption({ label: '2 uitleg.webm' });
  await pl().selectOption({ label: '3 slot.webm' });
  let kb = (await knoppen(p)).find((x) => x.id === k2);
  check('playlist via de inspector: intro, uitleg, slot', JSON.stringify(kb.mediaIds) === JSON.stringify([id['1 intro.webm'], id['2 uitleg.webm'], id['3 slot.webm']]), kb.mediaIds);
  await menuDicht(p);
  await tik(p, k2);
  s = await volg(p, 12000);
  check('playlist speelt de drie video\'s na elkaar', volgorde(s).join(' → ') === '1 intro.webm → 2 uitleg.webm → 3 slot.webm', volgorde(s));
  check('na de laatste terug naar de knoppen', !s[s.length - 1].show);

  // Eerste video uit de playlist halen met ✕
  await menuOpen(p);
  await tab(p, 'buttons');
  await kies(p, k2);
  const rijen = insp(p).locator('.field', { hasText: 'Playlist' }).locator('.row');
  await rijen.first().locator('button.danger').click();
  await wacht(150);
  const plTekst = await insp(p).locator('.field', { hasText: 'Playlist' }).first().innerText();
  kb = (await knoppen(p)).find((x) => x.id === k2);
  check('playlist toont nu 1. uitleg, 2. slot', /1\. 2 uitleg\.webm[\s\S]*2\. 3 slot\.webm/.test(plTekst), plTekst.split('\n').slice(0, 3));
  await menuDicht(p);
  await tik(p, k2);
  s = await volg(p, 9000);
  check('na ✕ op de eerste: speelt uitleg → slot (zoals de lijst toont)', volgorde(s).join(' → ') === '2 uitleg.webm → 3 slot.webm',
    { gespeeld: volgorde(s), mediaId: kb.mediaId === id['1 intro.webm'] ? '1 intro.webm' : kb.mediaId, mediaIds: kb.mediaIds });
  await p.evaluate(() => stopPlaying());
  await wacht(700);

  // Hoofdvideo wisselen nadat de playlist er al is
  await menuOpen(p);
  await tab(p, 'buttons');
  await kies(p, k2);
  await insp(p).locator('label.field', { hasText: /^Media/ }).locator('select').first().selectOption(id['clip.webm']);
  const plNa = await insp(p).locator('.field', { hasText: 'Playlist' }).first().innerText();
  kb = (await knoppen(p)).find((x) => x.id === k2);
  check('media-keuze en playlist blijven met elkaar kloppen (eerste playlistregel = gekozen media)',
    !kb.mediaIds || kb.mediaIds[0] === kb.mediaId, { mediaId: 'clip.webm', playlistToont: plNa.split('\n').filter((r) => /^\d\./.test(r)) });
  // weer netjes: één playlist intro → uitleg → slot
  await p.evaluate(([k, a, b2, c]) => { const b = curButtons().find((x) => x.id === k); b.mediaId = a; b.mediaIds = [a, b2, c]; save(); renderStage(); },
    [k2, id['1 intro.webm'], id['2 uitleg.webm'], id['3 slot.webm']]);

  console.log('8. Stoppen tijdens afspelen');
  await menuDicht(p);
  await tik(p, k2);
  await tot(p, () => playOverlay.classList.contains('show') && !playVideo.paused && playVideo.currentTime > 0.3, 4000);
  await p.click('#stopPlay');
  check('✕ midden in een playlist sluit direct', await tot(p, () => !playOverlay.classList.contains('show'), 1500));
  await wacht(2500);
  check('en de rest van de playlist komt niet alsnog', await p.evaluate(() => !playOverlay.classList.contains('show') && playVideo.paused && playQueue.length === 0));
  check('knoppen weer aanraakbaar', await tot(p, () => $('#buttonLayer').style.visibility !== 'hidden' && $('#buttonLayer').style.pointerEvents !== 'none', 5000));
  // Een andere knop meteen daarna werkt gewoon
  await tik(p, k1);
  check('direct daarna een andere knop: speelt', await tot(p, () => playOverlay.classList.contains('show') && !playVideo.paused &&
    [...mediaCache.values()].find((m) => m.url === playVideo.src)?.name === 'clip.webm', 4000));
  await p.click('#stopPlay');
  await tot(p, () => !playOverlay.classList.contains('show'), 2000);
  await wacht(700);

  // Een bezoeker die dubbel tikt
  await tot(p, () => $('#buttonLayer').style.pointerEvents !== 'none' && $('#buttonLayer').style.visibility !== 'hidden', 5000);
  await wacht(300);
  const dp = await punt(p, k2);
  await p.mouse.dblclick(dp.x, dp.y);
  s = await volg(p, 12000);
  check('dubbel tikken: playlist speelt gewoon één keer intro → uitleg → slot', volgorde(s).join(' → ') === '1 intro.webm → 2 uitleg.webm → 3 slot.webm' &&
    !s[s.length - 1].show, volgorde(s));
  await wacht(700);

  // Selectie-effect "Geen effect" en interactie "Direct": een bezoeker die
  // vlak na ✕ (of vlak na het einde) een andere knop aantikt.
  await menuOpen(p);
  await tab(p, 'fx');
  await p.selectOption('#cfgSelectFx', 'none');
  await p.selectOption('#gxInteraction', 'immediate');
  check('Motion: geen selectie-effect, direct aanraakbaar', await p.evaluate(() => config.selectFx === 'none' && config.galaxy.interaction === 'immediate'));
  await menuDicht(p);
  await tik(p, k1);
  await tot(p, () => playOverlay.classList.contains('show') && !playVideo.paused && playVideo.currentTime > 0.3, 4000);
  await p.click('#stopPlay');
  await wacht(120);
  const snel = await punt(p, k2);
  await p.mouse.click(snel.x, snel.y);
  await wacht(1500);
  const naSnel = await stand(p);
  check('snel na ✕ een andere knop: die video speelt (geen zwart scherm)', naSnel.show && naSnel.naam === '1 intro.webm' && !naSnel.paused, naSnel);
  await p.evaluate(() => stopPlaying());
  await wacht(700);
  await p.evaluate(() => { config.selectFx = 'preset'; config.galaxy.interaction = 'after50'; save(); });

  console.log('9. PNG als knopvorm en 3D-object');
  await menuOpen(p);
  await tab(p, 'buttons');
  await kies(p, k1);
  const uiterlijk = await inspOpen(p, 'UITERLIJK');
  await uiterlijk.locator('label.field', { hasText: 'Eigen PNG' }).locator('select').selectOption(id['knop.png']);
  check('knop krijgt de vorm van de PNG', await p.locator(`#buttonLayer .vbtn.png-face[data-id="${k1}"] img`).count() === 1);
  await p.click('#addBtn');
  const k3 = (await knoppen(p)).find((x) => ![k1, k2].includes(x.id)).id;
  await kies(p, k3);
  await insp(p).locator('label.field', { hasText: /^Media/ }).locator('select').first().selectOption(id['kubus.obj']);
  await menuDicht(p);
  await tik(p, k1);
  check('PNG-knop aantikken speelt zijn video', await tot(p, () => playOverlay.classList.contains('show') && !playVideo.paused, 4000));
  await p.click('#stopPlay');
  await tot(p, () => !playOverlay.classList.contains('show'), 2000);
  await wacht(700);
  await tik(p, k3);
  check('3D-knop opent het 3D-venster', await tot(p, () => playOverlay.classList.contains('show') && playOverlay.classList.contains('mode-3d') && objViewers.has('fullscreen'), 5000));
  await p.click('#stopPlay');
  check('✕ sluit het 3D-venster', await tot(p, () => !playOverlay.classList.contains('show') && !objViewers.has('fullscreen'), 2000));
  await wacht(700);

  console.log('10. Dupliceren, verwijderen, ongedaan maken');
  await menuOpen(p);
  await tab(p, 'buttons');
  await kies(p, k1);
  let gev = await inspOpen(p, 'GEAVANCEERD');
  const aantal0 = (await knoppen(p)).length;
  await gev.locator('button', { hasText: 'Dupliceren' }).click();
  bs = await knoppen(p);
  const kopie = bs.find((x) => x.label === 'Welkom kopie');
  check('⧉ Dupliceren maakt een kopie met dezelfde video', bs.length === aantal0 + 1 && kopie && kopie.mediaId === id['clip.webm'] && kopie.id !== k1, bs.map((x) => x.label));
  check('kopie staat op het podium', await p.locator(`#buttonLayer .vbtn[data-id="${kopie?.id}"]`).count() === 1);
  await p.evaluate(() => document.activeElement?.blur()); // focus weg uit tekstvakken
  await p.keyboard.press('Control+z');
  check('Ctrl+Z haalt de kopie weg', (await knoppen(p)).length === aantal0);
  await p.keyboard.press('Control+y');
  check('Ctrl+Y zet hem terug', (await knoppen(p)).length === aantal0 + 1 && (await knoppen(p)).some((x) => x.label === 'Welkom kopie'));
  await kies(p, kopie.id);
  gev = await inspOpen(p, 'GEAVANCEERD');
  await gev.locator('button', { hasText: 'Verwijderen' }).click();
  await wacht(150);
  check('🗑 Verwijderen (met bevestiging) haalt de knop weg', (await knoppen(p)).length === aantal0 && dialogen.some((d) => d.includes('verwijderen')),
    dialogen.slice(-1));
  check('verwijderde knop is van het podium', await p.locator(`#buttonLayer .vbtn[data-id="${kopie.id}"]`).count() === 0);
  await p.click('#tbUndo');
  check('↶ in de bovenbalk zet de verwijderde knop terug', (await knoppen(p)).some((x) => x.id === kopie.id));

  // Slepen in het podium en dat ongedaan maken
  const voorSleep = (await knoppen(p)).find((x) => x.id === k1);
  await sleep(p, k1, 80, 60);
  const naSleep = (await knoppen(p)).find((x) => x.id === k1);
  check('slepen verplaatst de knop', Math.abs(naSleep.x - voorSleep.x) > 3 || Math.abs(naSleep.y - voorSleep.y) > 3,
    { voor: [voorSleep.x, voorSleep.y], na: [naSleep.x, naSleep.y] });
  const nKnoppen = (await knoppen(p)).length;
  await p.keyboard.press('Control+z');
  const naUndo = (await knoppen(p)).find((x) => x.id === k1);
  check('Ctrl+Z na slepen zet de knop terug op zijn plek', naUndo && naUndo.x === voorSleep.x && naUndo.y === voorSleep.y,
    { voor: [voorSleep.x, voorSleep.y], naUndo: naUndo ? [naUndo.x, naUndo.y] : 'knop weg', knoppen: `${nKnoppen} → ${(await knoppen(p)).length}` });
  // De stap daarvóór was het dupliceren (het wissen is al teruggedraaid):
  // een tweede Ctrl+Z haalt precies die kopie weg, en verder niets.
  await p.keyboard.press('Control+z');
  const naUndo2 = (await knoppen(p)).find((x) => x.id === k1);
  check('… een tweede Ctrl+Z draait precies de stap daarvóór terug (het dupliceren)',
    (await knoppen(p)).length === nKnoppen - 1 && !(await knoppen(p)).some((x) => x.id === kopie.id) &&
      naUndo2 && naUndo2.x === voorSleep.x && naUndo2.y === voorSleep.y,
    { knoppen: `${nKnoppen} → ${(await knoppen(p)).length}`, k1: naUndo2 ? [naUndo2.x, naUndo2.y] : 'weg' });
  await p.keyboard.press('Control+y');
  check('… en Ctrl+Y zet de kopie terug', (await knoppen(p)).length === nKnoppen);

  // Tekst wijzigen en ongedaan maken
  await p.click('#addBtn');
  const k4 = (await knoppen(p)).find((x) => ![k1, k2, k3].includes(x.id)).id;
  await kies(p, k4);
  await insp(p).locator('label.field', { hasText: 'Tekst op de knop' }).locator('input').fill('Nieuwe tekst');
  await p.evaluate(() => document.activeElement?.blur());
  await p.keyboard.press('Control+z');
  const k4na = (await knoppen(p)).find((x) => x.id === k4);
  check('Ctrl+Z na een tekstwijziging zet de oude tekst terug (knop blijft)', k4na && k4na.label !== 'Nieuwe tekst',
    k4na ? { label: k4na.label } : 'de hele knop is weg: tekst typen staat niet op de ongedaan-stapel');
  if (!k4na) await p.keyboard.press('Control+y');

  console.log('11. Groepen');
  bs = await knoppen(p);
  const [g1, g2] = [k3, k4];
  await kies(p, g1);
  await kies(p, g2, true);
  check('shift-klik selecteert twee knoppen', await p.evaluate(() => selectedIds.size) === 2);
  await p.click('#groupBtn');
  check('Groeperen vraagt een naam in het eigen venster', await tot(p, () => !$('#tekstVraag').classList.contains('hidden'), 2000));
  await p.fill('#tvVeld', 'Groep A');
  await p.press('#tvVeld', 'Enter');
  await wacht(200);
  bs = await knoppen(p);
  const gid = bs.find((x) => x.id === g1).groupId;
  check('beide knoppen in dezelfde groep, met naam', gid && bs.find((x) => x.id === g2).groupId === gid &&
    await p.evaluate((g) => curScene().groups.find((x) => x.id === g)?.name, gid) === 'Groep A');
  await p.click('#selNone');
  await kies(p, g1);
  check('één klik op een groepslid selecteert de hele groep', await p.evaluate(([a, c]) => selectedIds.size === 2 && selectedIds.has(a) && selectedIds.has(c), [g1, g2]));
  const voorG = (await knoppen(p)).filter((x) => [g1, g2].includes(x.id)).map((x) => [x.x, x.y]);
  await sleep(p, g1, -60, 40);
  const naG = (await knoppen(p)).filter((x) => [g1, g2].includes(x.id)).map((x) => [x.x, x.y]);
  const d1 = [naG[0][0] - voorG[0][0], naG[0][1] - voorG[0][1]], d2 = [naG[1][0] - voorG[1][0], naG[1][1] - voorG[1][1]];
  check('slepen verplaatst de hele groep evenveel', Math.abs(d1[0]) > 2 && Math.abs(d1[0] - d2[0]) < 0.01 && Math.abs(d1[1] - d2[1]) < 0.01, { d1, d2 });
  await p.click('#ungroupBtn');
  check('Groep opheffen', (await knoppen(p)).every((x) => !x.groupId) && await p.evaluate(() => (curScene().groups || []).length === 0));

  console.log('12. Uitlijnen, verbergen, vergrendelen, planning');
  await p.click('#selNone');
  await kies(p, g2);
  const xVeld = (await inspOpen(p, 'POSITIE')).locator('label.field', { hasText: 'X (%)' }).locator('input');
  await xVeld.fill('70');
  check('X via de inspector', (await knoppen(p)).find((x) => x.id === g2).x === 70);
  await p.click('#selNone');
  await kies(p, g1);
  await kies(p, g2, true);
  await p.click('[data-align="left"]');
  bs = await knoppen(p);
  check('links uitlijnen: twee knoppen op dezelfde x', bs.find((x) => x.id === g1).x === bs.find((x) => x.id === g2).x);
  await p.click('#selNone');
  await kies(p, g2);
  await p.keyboard.press('Control+z');
  bs = await knoppen(p);
  check('uitlijnen is ongedaan te maken', bs.find((x) => x.id === g1).x !== bs.find((x) => x.id === g2).x);
  await kies(p, g2);
  gev = await inspOpen(p, 'GEAVANCEERD');
  await gev.locator('.toggle-row', { hasText: 'Vergrendelen' }).locator('input').check();
  const voorSlot = (await knoppen(p)).find((x) => x.id === g2);
  await sleep(p, g2, 90, 0);
  const naSlot = (await knoppen(p)).find((x) => x.id === g2);
  check('vergrendelde knop schuift niet mee bij slepen', naSlot.x === voorSlot.x && naSlot.y === voorSlot.y && naSlot.locked === true);
  gev = await inspOpen(p, 'GEAVANCEERD');
  await gev.locator('.toggle-row', { hasText: 'Vergrendelen' }).locator('input').uncheck();
  await gev.locator('.toggle-row', { hasText: 'Verbergen' }).locator('input').check();
  check('verborgen knop staat niet op het podium', await p.locator(`#buttonLayer .vbtn[data-id="${g2}"]`).count() === 0);
  await p.click('#inspTabLayers');
  const g2label = (await knoppen(p)).find((x) => x.id === g2).label;
  await p.locator('#layersBody .lay-row', { hasText: g2label }).locator('button[title="Tonen"]').click();
  check('via Lagen weer tonen', await p.locator(`#buttonLayer .vbtn[data-id="${g2}"]`).count() === 1);
  await p.click('#inspTabInspector');
  // Planning: alleen tonen in een tijdvenster dat nu niet geldt
  await kies(p, g2);
  const plan = await inspOpen(p, 'PLANNING & TAAL');
  await plan.locator('input[data-role="sched-on"]').check();
  const hhmm = (min) => { const m = ((min % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  const nu = await p.evaluate(() => new Date().getHours() * 60 + new Date().getMinutes());
  await plan.locator('input[data-role="sched-from"]').fill(hhmm(nu + 120));
  await plan.locator('input[data-role="sched-to"]').fill(hhmm(nu + 180));
  await wacht(200);
  check('planning opgeslagen', await p.evaluate((k) => { const s = curButtons().find((x) => x.id === k).schedule; return s?.enabled && !!s.from && !!s.to; }, g2));
  check('in de editor blijft hij zichtbaar om te bewerken', await p.locator(`#buttonLayer .vbtn[data-id="${g2}"]`).count() === 1);
  // De planningscontrole loopt elke 30 s. Iemand die daarna nog even in het
  // menu bezig is, sluit het pas als die controle de wijziging al gezien heeft.
  await tot(p, () => lastScheduleKey === curButtons().map((b) => scheduleActive(b) ? 1 : 0).join(''), 32000);
  await menuDicht(p);
  await wacht(1000);
  const direct = await p.locator(`#buttonLayer .vbtn[data-id="${g2}"]`).count() === 0;
  await wacht(31000);
  check('na Sluiten: knop buiten zijn tijdvenster niet zichtbaar voor bezoekers', direct && await p.locator(`#buttonLayer .vbtn[data-id="${g2}"]`).count() === 0,
    { directNaSluiten: direct ? 'weg' : 'zichtbaar', na32s: await p.locator(`#buttonLayer .vbtn[data-id="${g2}"]`).count() ? 'nog steeds zichtbaar' : 'weg' });
  await p.reload();
  await p.waitForFunction(() => typeof mediaGeladen !== 'undefined' && mediaGeladen);
  check('na herladen: knop buiten zijn tijdvenster weg', await p.locator(`#buttonLayer .vbtn[data-id="${g2}"]`).count() === 0);
  await p.evaluate((k) => { delete curButtons().find((x) => x.id === k).schedule; save(); renderStage(); }, g2);
  await menuOpen(p);
  await tab(p, 'buttons');

  console.log('13. Media verwijderen');
  await p.evaluate(([k, a, b2]) => { const b = curButtons().find((x) => x.id === k); b.mediaId = a; b.mediaIds = [a, b2]; save(); },
    [k2, id['2 uitleg.webm'], id['3 slot.webm']]);
  await tab(p, 'media');
  const kaartClip = p.locator('#mediaList .card', { has: p.locator('.nm[title="clip.webm"]') });
  await kaartClip.locator('button.danger').click();
  await p.waitForFunction(() => ![...mediaCache.values()].some((m) => m.name === 'clip.webm'));
  bs = await knoppen(p);
  check('knop die clip.webm afspeelde is leeg', bs.find((x) => x.id === k1).mediaId === null);
  check('weg uit IndexedDB', await p.evaluate(async (i) => !(await dbAll()).some((r) => r.id === i), id['clip.webm']));
  check('weg uit de medialijst', !(await p.locator('#mediaList').innerText()).includes('clip.webm'));
  check('afspeelinstellingen van de verwijderde video opgeruimd', await p.evaluate((i) => !(i in config.mediaSettings), id['clip.webm']));
  // De eerste video van een playlist (intro → uitleg → slot is nu uitleg → slot) verwijderen
  const weg = async (naam) => {
    await tab(p, 'media');
    await p.locator('#mediaList .card', { has: p.locator(`.nm[title="${naam}"]`) }).locator('button.danger').click();
    await p.waitForFunction((n) => ![...mediaCache.values()].some((m) => m.name === n), naam);
  };
  await weg('2 uitleg.webm');
  kb = (await knoppen(p)).find((x) => x.id === k2);
  check('verwijderde video ook uit de playlist van een knop', !(kb.mediaIds || []).includes(id['2 uitleg.webm']),
    { mediaId: kb.mediaId, mediaIds: kb.mediaIds });
  await menuDicht(p);
  await tot(p, () => renditionBusy.size === 0, 15000);
  await tik(p, k2);
  s = await volg(p, 5000);
  check('playlist zonder zijn eerste video speelt de rest nog (3 slot)', volgorde(s).join() === '3 slot.webm',
    { gespeeld: volgorde(s), melding: await p.textContent('#toast') });
  await p.evaluate(() => stopPlaying());
  await wacht(600);
  await menuOpen(p);
  await weg('3 slot.webm');
  kb = (await knoppen(p)).find((x) => x.id === k2);
  check('playlist-knop zonder video\'s meer: geen spookverwijzingen', !kb.mediaId && !(kb.mediaIds || []).length, { mediaId: kb.mediaId, mediaIds: kb.mediaIds });
  await menuDicht(p);
  await tot(p, () => renditionBusy.size === 0, 15000); // geen "Preview gerenderd"-melding er doorheen
  await wacht(300);
  await tik(p, k1);
  const melding = await tot(p, () => /nog geen/.test($('#toast').textContent), 2000);
  check('leeg geworden knop aantikken: melding, geen afspeelvenster, geen fout', melding && await p.evaluate(() =>
    !playOverlay.classList.contains('show')), await p.evaluate(() => $('#toast').textContent));

  console.log('14. Na herladen staat alles er nog');
  const voorHerladen = await p.evaluate(() => JSON.stringify(config.scenes));
  await p.reload();
  await p.waitForFunction(() => typeof mediaGeladen !== 'undefined' && mediaGeladen);
  check('knoppen en scènes bewaard', await p.evaluate(() => JSON.stringify(config.scenes)) === voorHerladen);
  check('media terug uit IndexedDB', JSON.stringify(Object.keys(await ids(p)).sort()) ===
    JSON.stringify(['1 intro.webm', 'knop.png', 'kort.mp3', 'kubus.obj']), Object.keys(await ids(p)));
  await tik(p, k3);
  check('na herladen werkt een knop gewoon (3D-object)', await tot(p, () => playOverlay.classList.contains('show'), 4000));
  await p.evaluate(() => stopPlaying());

  check('geen JS-fouten', errs.length === 0, errs.slice(0, 3));
  check('geen fouten in de console', consoleErrs.length === 0, consoleErrs.slice(0, 3));
  console.log(`\n${fout ? 'FOUT' : 'OK  '}: ${ok}/${ok + fout}`);
  await b.close();
  process.exit(fout ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
