// Sensoren en geluid: de camera (nepcamera van Chromium) met aanwezigheid,
// handgebaar en diepte-effect; de geluidsreactie per knop met de demo-beat,
// met het geluid van een video en met de screensavermuziek; en de speaker
// wakker houden (meter, drie soorten signaal, puls, 5 seconden hardop).
const { chromium } = require('playwright');
const { APP, MEDIA, CHROMIUM } = require('./hulp');
const { maakBeeldMedia } = require('./beeldmedia');
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
  maakBeeldMedia();
  const b = await chromium.launch({ executablePath: CHROMIUM, args: ['--autoplay-policy=no-user-gesture-required',
    '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, permissions: ['camera', 'microphone'] });
  const p = await ctx.newPage();
  const errs = [], cerrs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') cerrs.push(m.text()); });
  p.on('dialog', (d) => d.accept());
  await p.goto(APP);
  await p.waitForFunction(() => typeof Muziek !== 'undefined' && mediaGeladen === true);
  await p.setInputFiles('#mediaInput', [M('clip.webm'), M('1 intro.webm'), M('lang.mp3')]);
  await p.waitForFunction(() => mediaCache.size === 3);
  const id = await p.evaluate(() => Object.fromEntries([...mediaCache.values()].map((m) => [m.name, m.id])));
  const tab = async (t) => { await p.click(`#panel button[data-tab="${t}"]`); await wacht(120); };
  const zet = (sel, waarde, evt = 'input') => p.evaluate(([s, w, e]) => {
    const n = document.querySelector(s); n.value = w; n.dispatchEvent(new Event(e, { bubbles: true }));
  }, [sel, String(waarde), evt]);
  const schakel = async (sel, aan) => {
    if ((await p.isChecked(sel)) !== aan) await p.locator(sel).locator('xpath=..').click();
  };
  const open = async () => { await p.evaluate(() => openEditor()); await wacht(200); };
  const dicht = async () => { await p.evaluate(() => closeEditor()); await wacht(250); };
  await p.evaluate((id) => {
    const k = (i, label, x, y) => ({ id: 'b' + i, label, mediaId: id['1 intro.webm'], x, y, size: 8 + i * 2, color: PALETTE[i],
      shape: 'rounded', depth: 'off', drift: 0, showPreview: false, fx: 'none', z: 0, beat: { on: false } });
    curScene().buttons = [k(0, 'Links', 25, 50), k(1, 'Midden', 50, 50), k(2, 'Rechts', 75, 50)];
    save(); renderStage();
  }, id);

  console.log('1. Camera aanzetten (nepcamera)');
  await open(); await tab('cam');
  check('beginstand: camera uit', (await p.textContent('#camLiveText')) === 'Camerabeeld: uit' && (await p.textContent('#camStatusText')) === 'Camera uit');
  await p.click('#camTest');
  check('"Camera inschakelen & testen" zet de detectie aan', await p.evaluate(() => config.camera.enabled) && await p.isChecked('#camEnabled'));
  check('camerabeeld komt binnen', await tot(p, () => camStream && camStream.getVideoTracks()[0]?.readyState === 'live' && camVideoEl?.readyState >= 2, 6000));
  check('statuslampje groen: "werkt (juiste camera actief)"', await tot(p, () => /werkt/.test($('#camLiveText').textContent) && $('#camLiveDot').classList.contains('live'), 4000),
    await p.textContent('#camLiveText'));
  check('voorbeeldbeeld in het menu', await p.evaluate(() => !!$('#camPreviewBox video')?.srcObject));
  check('cameralijst toont de nepcamera', await tot(p, () => [...$('#camDevice').options].some((o) => o.value && /fake|camera/i.test(o.textContent)), 3000),
    await p.evaluate(() => [...$('#camDevice').options].map((o) => o.textContent)));
  check('meter toont wat de camera meet', await tot(p, () => !$('#camMeter').classList.contains('hidden') && /Nu gemeten/.test($('#cmTekst').textContent), 3000),
    await p.textContent('#cmTekst'));
  check('status bijgewerkt (niet meer "Camera wordt gestart")', await p.evaluate(() => /Camera actief|Beweging gezien|Bezoeker aanwezig/.test($('#camStatusText').textContent)),
    await p.textContent('#camStatusText'));

  console.log('2. Aanwezigheid');
  await zet('#camSens', 1);
  check('gevoeligheid 1: uitleg noemt 35% van het beeld', /Stand 1: .*35%/.test(await p.textContent('#camSensNote')), await p.textContent('#camSensNote'));
  await zet('#camSens', 10);
  await p.evaluate(() => $('#camSens').dispatchEvent(new Event('change', { bubbles: true })));
  check('gevoeligheid 10 bewaard, uitleg 2%', await p.evaluate(() => config.camera.sensitivity) === 10 && /Stand 10: .*2%/.test(await p.textContent('#camSensNote')));
  await p.fill('#camDwell', '0.2'); await p.dispatchEvent('#camDwell', 'change');
  check('sta-tijd begrensd op minimaal 1 s', await p.evaluate(() => config.camera.dwellSec) === 1);
  await p.fill('#camStuck', '30'); await p.dispatchEvent('#camStuck', 'change');
  check('opnieuw ijken na 30 s bewaard', await p.evaluate(() => config.camera.stuckSec) === 30);
  // De nepcamera beweegt voortdurend; op stand 10 telt dat als iemand voor de box.
  const aanwezig = await tot(p, () => /Bezoeker aanwezig/.test($('#camStatusText').textContent) && $('#camDot').classList.contains('present'), 10000);
  check('beweging voor de camera telt na de sta-tijd als bezoeker', aanwezig, await p.textContent('#camStatusText'));
  if (aanwezig) {
    await p.evaluate((id) => { config.screensaver.enabled = true; config.screensaver.mediaIds = [id['clip.webm']]; save(); }, id);
    await dicht();
    await p.evaluate(() => enterSaver());
    check('screensaver gaat uit zodra de camera een bezoeker ziet', await tot(p, () => !saverActive, 4000));
    check('een bezoeker houdt de screensaver weg', await p.evaluate(() => Date.now() - lastInteraction < 1500));
    await p.evaluate(() => { config.screensaver.enabled = false; save(); });
    await open(); await tab('cam');
  }

  console.log('3. Handgebaar en diepte-effect');
  await schakel('#gestEnabled', true);
  await p.selectOption('#gestHand', 'any');
  await p.fill('#gestHold', '9'); await p.dispatchEvent('#gestHold', 'change');
  check('handgebaar aan, hand "maakt niet uit", vasthouden begrensd op 5 s', await p.evaluate(() =>
    config.camera.gesture.enabled && config.camera.gesture.hand === 'any' && config.camera.gesture.holdSec === 5));
  await wacht(1500);
  await schakel('#gestEnabled', false);
  check('handgebaar weer uit', await p.evaluate(() => !config.camera.gesture.enabled));
  const pOff = () => p.evaluate(() => [...document.querySelectorAll('.vbtn')].map((k) => k.style.getPropertyValue('--pOff')));
  check('diepte-effect uit: knoppen hebben geen verschuiving', (await pOff()).every((x) => x === ''));
  await schakel('#paraEnabled', true);
  let po = await pOff();
  check('diepte-effect aan: elke knop krijgt een diepte, de grootste het meest', po.every((x) => x !== '') && Number(po[2]) > Number(po[0]), po);
  await zet('#paraSterkte', 100);
  const po2 = await pOff();
  check('sterkte 100: verder dan bij 55', Number(po2[2]) > Number(po[2]), { bij55: po[2], bij100: po2[2] });
  await wacht(2500);
  console.log(`   ℹ --px op de knoppenlaag door de nepcamera: ${await p.evaluate(() => $('#buttonLayer').style.getPropertyValue('--px'))}`);
  await p.click('#paraDemo');
  const demoPx = [];
  for (let i = 0; i < 20; i++) { demoPx.push(Number(await p.evaluate(() => $('#buttonLayer').style.getPropertyValue('--px')) || 0)); await wacht(150); }
  check('"Laat zien op het podium": de knoppen schuiven heen en weer', Math.min(...demoPx) < -0.5 && Math.max(...demoPx) > 0.5, demoPx.map((x) => x.toFixed(2)));
  await tot(p, () => !$('#paraDemo').disabled, 4000);
  await schakel('#paraEnabled', false);
  check('diepte-effect uit: verschuiving weg', (await pOff()).every((x) => x === '') && await p.evaluate(() => !$('#buttonLayer').style.getPropertyValue('--px')));

  console.log('3b. Camera-analyse met nagemaakte beelden (aanwezigheid, gebaar, diepte, opnieuw ijken)');
  // De nepcamera toont alleen een draaiend patroon. Om de analyse zelf te
  // toetsen vervangen we het uitlezen van het camerabeeld door eigen beelden:
  // een lege ruimte, een bezoeker (romp + hoofd) en een opgestoken hand.
  await p.evaluate(() => {
    window.__tel = 0;
    window.__scene = { persoon: null, hand: null, beweeg: true };
    window.__frame = (o) => {
      const W = CAM_W, H = CAM_H, g = new Float32Array(W * H).fill(30);
      const vlak = (x0, x1, y0, y1) => { for (let y = Math.max(0, y0); y < Math.min(H, y1); y++) for (let x = Math.max(0, x0); x < Math.min(W, x1); x++) g[y * W + x] = 200; };
      if (o.persoon != null) {
        const c = o.persoon + (o.beweeg ? (window.__tel++ % 2) : 0);
        vlak(c - 12, c + 12, 30, H);         // romp
        vlak(c - 4, c + 4, 16, 30);          // hoofd
        if (o.hand === 'beeldlinks') vlak(c - 22, c - 19, 4, 30);
        if (o.hand === 'beeldrechts') vlak(c + 19, c + 22, 4, 30);
        if (o.hand === 'boven') vlak(c - 1, c + 2, 4, 16);
      }
      return g;
    };
    grayFrame = () => window.__frame(window.__scene);
    camBg = null;   // opnieuw ijken op de lege ruimte
  });
  check('detector: hand links in beeld = rechterhand van de bezoeker', await p.evaluate(() => {
    const bg = __frame({ persoon: null });
    return detectRaisedHand(__frame({ persoon: 48, hand: 'beeldlinks' }), bg, 20) === 'right' &&
      detectRaisedHand(__frame({ persoon: 48, hand: 'beeldrechts' }), bg, 20) === 'left';
  }));
  check('detector: hand recht boven het hoofd of geen hand telt niet', await p.evaluate(() => {
    const bg = __frame({ persoon: null });
    return detectRaisedHand(__frame({ persoon: 48, hand: 'boven' }), bg, 20) === null && detectRaisedHand(__frame({ persoon: 48 }), bg, 20) === null;
  }));
  await p.evaluate(() => { config.camera.sensitivity = 7; config.camera.dwellSec = 1; config.camera.stuckSec = 30;
    config.camera.gesture = { enabled: false, hand: 'right', holdSec: 0.6 }; save(); });
  await wacht(800);
  check('lege ruimte: niemand', await tot(p, () => /nog niemand/.test($('#camStatusText').textContent) && !$('#camDot').classList.contains('present'), 3000),
    await p.textContent('#camStatusText'));
  await p.evaluate(() => { __scene.persoon = 48; });
  check('bezoeker in beeld: eerst "Beweging gezien", na 1 s "Bezoeker aanwezig"', await tot(p, () => /Beweging gezien/.test($('#camStatusText').textContent), 2000) &&
    await tot(p, () => /Bezoeker aanwezig/.test($('#camStatusText').textContent) && $('#camDot').classList.contains('present'), 3000), await p.textContent('#camStatusText'));
  await p.evaluate(() => { __scene.persoon = null; });
  check('bezoeker weg: weer niemand', await tot(p, () => /nog niemand/.test($('#camStatusText').textContent) && !$('#camDot').classList.contains('present'), 4000),
    await p.textContent('#camStatusText'));
  // Diepte-effect volgt waar de bezoeker staat
  await p.evaluate(() => { config.camera.parallax.enabled = true; save(); renderStage(); __scene.persoon = 20; });
  await wacht(2000);
  const pxLinks = Number(await p.evaluate(() => $('#buttonLayer').style.getPropertyValue('--px')));
  await p.evaluate(() => { __scene.persoon = 76; });
  await wacht(2000);
  const pxRechts = Number(await p.evaluate(() => $('#buttonLayer').style.getPropertyValue('--px')));
  check('diepte-effect: bezoeker links in beeld → knoppen naar de ene kant, rechts → naar de andere', pxLinks < -0.3 && pxRechts > 0.3, { pxLinks, pxRechts });
  await p.evaluate(() => { config.camera.parallax.enabled = false; save(); Parallax.uit(); renderStage(); __scene.persoon = null; });
  await wacht(1500);
  // Handgebaar: rechterhand omhoog haalt de screensaver weg (sta-tijd zo lang
  // dat alleen het gebaar het kan doen)
  await p.evaluate((id) => { config.camera.dwellSec = 30; config.camera.gesture = { enabled: true, hand: 'right', holdSec: 0.6 };
    config.screensaver.enabled = true; config.screensaver.mediaIds = [id['clip.webm']]; save(); }, id);
  await dicht();
  await p.evaluate(() => { lastInteraction = Date.now(); enterSaver(); __scene.persoon = 48; __scene.hand = null; });
  await wacht(1500);
  check('alleen aanwezig (zonder gebaar, sta-tijd 30 s): screensaver blijft', await p.evaluate(() => saverActive));
  await p.evaluate(() => { __scene.hand = 'beeldrechts'; });
  await wacht(1500);
  check('linkerhand omhoog terwijl de rechter gevraagd is: niets', await p.evaluate(() => saverActive));
  await p.evaluate(() => { __scene.hand = 'beeldlinks'; });
  check('rechterhand omhoog: screensaver weg', await tot(p, () => !saverActive, 3000));
  check('status meldt het gebaar', /rechterhand omhoog/.test(await p.textContent('#camStatusText')), await p.textContent('#camStatusText'));
  await p.evaluate(() => { __scene.hand = null; });
  // Gebaar stopt een spelende video (na de rustpauze van 6 s)
  await wacht(6200);
  const kr = await p.evaluate(() => { const r = document.querySelector('.vbtn[data-id="b1"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.click(kr.x, kr.y);
  await tot(p, () => playOverlay.classList.contains('show'), 4000);
  await p.evaluate(() => { playVideo.loop = true; __scene.hand = 'beeldlinks'; });
  check('rechterhand omhoog tijdens een video: terug naar de knoppen', await tot(p, () => !playOverlay.classList.contains('show'), 4000));
  await p.evaluate(() => { __scene.hand = null; config.camera.gesture.enabled = false; config.screensaver.enabled = false; save(); });
  // Opnieuw ijken: een blijvende verandering zonder beweging is geen bezoeker
  await p.evaluate(() => { config.camera.dwellSec = 1; config.camera.stuckSec = 2; save(); __scene.beweeg = false; __scene.persoon = 30; });
  check('stilstaand "voorwerp" wordt na 2 s opnieuw geijkt', await tot(p, () => /opnieuw geijkt/.test($('#camStatusText').textContent), 6000),
    await p.textContent('#camStatusText'));
  check('...en telt daarna niet meer als bezoeker', await tot(p, () => /nog niemand/.test($('#camStatusText').textContent), 3000), await p.textContent('#camStatusText'));
  await p.evaluate(() => { config.camera.stuckSec = 30; config.camera.dwellSec = 1; save(); __scene.beweeg = true; __scene.persoon = null; });
  await open(); await tab('cam');

  console.log('4. Camera uit');
  await p.evaluate(() => { window.__spoor = camStream.getVideoTracks()[0]; });
  await schakel('#camEnabled', false);
  check('camera uit: spoor gestopt, status uit, geen voorbeeld', await tot(p, () => window.__spoor.readyState === 'ended' && !camStream &&
    $('#camLiveText').textContent === 'Camerabeeld: uit' && $('#camStatusText').textContent === 'Camera uit' && !$('#camPreviewBox video'), 2000));
  await p.selectOption('#camDevice', { index: 1 });
  await wacht(1500);
  const naKeuze = await p.evaluate(() => ({ aan: config.camera.enabled, stroom: !!camStream, status: $('#camStatusText').textContent }));
  check('camera kiezen terwijl de detectie uit staat zet de camera niet aan', !naKeuze.stroom, naKeuze);
  await p.evaluate(() => stopCamera());
  await schakel('#camEnabled', true);
  check('weer aan: start opnieuw', await tot(p, () => camStream && /werkt/.test($('#camLiveText').textContent), 6000));
  await p.reload();
  await p.waitForFunction(() => typeof Muziek !== 'undefined' && mediaGeladen === true);
  check('na herstart start de camera vanzelf', await tot(p, () => camStream && camStream.getVideoTracks()[0]?.readyState === 'live', 6000));
  await p.evaluate(() => { config.camera.enabled = false; save(); stopCamera(); });

  console.log('5. Geluidsreactie per knop: de demo-beat');
  await open(); await tab('buttons');
  await p.click('.box-rij[data-knop="b1"]');
  await wacht(200);
  await p.locator('#inspBody details', { hasText: 'MOTION' }).locator('summary').click();
  await p.locator('#inspBody input[data-role="beat"]').locator('xpath=..').click();
  check('beats aan voor de middelste knop', await p.evaluate(() => curButtons()[1].beat.on === true &&
    document.querySelector('.vbtn[data-id="b1"]').classList.contains('beat-on')));
  const menuZichtbaar = () => p.evaluate(() => { const m = document.querySelector('#inspBody .beat-menu');
    return !!m && !m.classList.contains('hidden') && !![...m.querySelectorAll('button')].find((x) => /Demo-beat/.test(x.textContent)); });
  check('na het aanzetten verschijnen de beat-instellingen in de inspector', await menuZichtbaar(),
    await p.evaluate(() => document.querySelector('#inspBody .beat-menu')?.className));
  if (!(await menuZichtbaar())) {
    // Opnieuw selecteren tekent de inspector wél opnieuw.
    await p.evaluate(() => markSelection());
    if (!(await p.evaluate(() => document.querySelector('#inspBody details:has(.beat-blok)')?.open))) {
      await p.locator('#inspBody details', { hasText: 'MOTION' }).locator('summary').click();
    }
  }
  const demoKnop = p.locator('#inspBody .beat-menu button', { hasText: 'Demo-beat' });
  await demoKnop.click();
  check('demo-beat loopt', await p.evaluate(() => AudioFX.demoLoopt && AudioFX.ready));
  check('de knop zegt nu "Demo-beat stoppen"', /stoppen/.test(await demoKnop.textContent()), await demoKnop.textContent());
  const meet = async (n = 30) => {
    const uit = [];
    for (let i = 0; i < n; i++) {
      uit.push(await p.evaluate(() => { const k = (i) => getComputedStyle(document.querySelector(`.vbtn[data-id="b${i}"]`));
        const L = $('#buttonLayer').style; return { s1: k(1).scale, t1: k(1).translate, s0: k(0).scale, t0: k(0).translate, ar: Number(L.getPropertyValue('--ar') || 0),
          eq: Math.max(...Array.from({ length: AR_BANDS }, (_, i) => Number(L.getPropertyValue('--eq' + i) || 0))) }; }));
      await wacht(70);
    }
    return uit;
  };
  let m = await meet();
  const schalen = m.map((x) => parseFloat(x.s1) || 1);
  check('de beat-knop zwelt mee (scale varieert)', Math.max(...schalen) - Math.min(...schalen) > 0.005, [Math.min(...schalen), Math.max(...schalen)]);
  check('de beat-knop veert op (translate varieert)', new Set(m.map((x) => x.t1)).size > 3, [...new Set(m.map((x) => x.t1))].slice(0, 4));
  check('beat-envelope en equalizer bewegen', Math.max(...m.map((x) => x.ar)) > 0.05 && Math.max(...m.map((x) => x.eq)) > 0.1,
    { ar: Math.max(...m.map((x) => x.ar)), eq: Math.max(...m.map((x) => x.eq)) });
  check('knop zonder beats blijft stil', m.every((x) => x.s0 === 'none' && x.t0 === m[0].t0), [m[0].s0, m[0].t0]);
  // Bolling: een knop aan de rand reageert minder dan in het midden
  const bK = await p.evaluate(() => { const b0 = curButtons()[0]; b0.beat.on = true; save(); renderStage();
    return [document.querySelector('.vbtn[data-id="b0"]').style.getPropertyValue('--bK'), document.querySelector('.vbtn[data-id="b1"]').style.getPropertyValue('--bK')]; });
  check('bolling: de knop links reageert zwakker dan die in het midden', Number(bK[0]) < Number(bK[1]), bK);
  check('twee meedoeners: links laag, rechts hoger in het spectrum', await p.evaluate(() =>
    document.querySelector('.vbtn[data-id="b0"]').style.getPropertyValue('--bLvl') === 'var(--eq0, 0)' &&
    document.querySelector('.vbtn[data-id="b1"]').style.getPropertyValue('--bLvl') === 'var(--eq15, 0)'),
    await p.evaluate(() => [0, 1].map((i) => document.querySelector(`.vbtn[data-id="b${i}"]`).style.getPropertyValue('--bLvl'))));
  await p.evaluate(() => { curButtons()[0].beat.on = false; save(); renderStage(); });
  // Instellingen voor alle knoppen
  const schuif = (label) => p.locator('#inspBody .beat-menu label.field', { hasText: label }).locator('input');
  await p.evaluate(() => markSelection());
  if (!(await p.evaluate(() => document.querySelector('#inspBody details:has(.beat-blok)')?.open))) {
    await p.locator('#inspBody details', { hasText: 'MOTION' }).locator('summary').click();
  }
  await schuif('Gevoeligheid').evaluate((n) => { n.value = '9'; n.dispatchEvent(new Event('input', { bubbles: true })); });
  await schuif('Opzwellen').evaluate((n) => { n.value = '30'; n.dispatchEvent(new Event('input', { bubbles: true })); });
  check('gevoeligheid en opzwellen bewaard', await p.evaluate(() => config.audioFx.sens === 9 && curButtons()[1].beat.swell === 30 &&
    document.querySelector('.vbtn[data-id="b1"]').style.getPropertyValue('--bSwell') === '0.3'));
  await p.locator('#inspBody .beat-menu select').selectOption('low');
  check('vaste band "lage tonen"', await p.evaluate(() => curButtons()[1].beat.band === 'low' &&
    document.querySelector('.vbtn[data-id="b1"]').style.getPropertyValue('--bLvl') === 'var(--eq1, 0)'));
  await dicht();
  m = await meet(25);
  check('ook met het menu dicht reageert de knop op de demo-beat', new Set(m.map((x) => x.s1)).size > 3, [...new Set(m.map((x) => x.s1))].slice(0, 4));
  await p.evaluate(() => AudioFX.demo(false));
  await wacht(1200);

  console.log('6. Geluidsreactie op het geluid van een video en op de screensavermuziek');
  await p.evaluate((id) => { const sc = curScene(); sc.idleMediaId = id['clip.webm']; sc.idleSound = true; sc.idleVolume = 80;
    curButtons()[1].beat.band = 'auto'; save(); renderStage(); AudioFX.apply(); }, id);
  await wacht(1500);
  m = await meet(15);
  check('de achtergrondvideo met geluid loopt door de analyser (equalizer > 0)', Math.max(...m.map((x) => x.eq)) > 0.05, Math.max(...m.map((x) => x.eq)));
  check('de achtergrondvideo speelt nog met geluid (niet stilgevallen door de koppeling)', await p.evaluate(() => {
    const v = $('#idleVideo'); return !v.paused && !v.muted && v.volume > 0.5; }));
  await p.evaluate((id) => { const sc = curScene(); sc.idleMediaId = null; save(); renderStage(); }, id);
  await wacht(1200);
  await p.evaluate((id) => {
    Object.assign(config.screensaver, { enabled: true, background: true, mediaIds: [id['1 intro.webm']], sound: false });
    Object.assign(config.screensaver.muziek, { aan: true, bron: 'bestand', mediaId: id['lang.mp3'], modus: 'loop', volume: 80 });
    save(); renderStage();
  }, id);
  check('achtergrondmodus met muziek: de muziek speelt', await tot(p, () => Muziek.speelt && bgRotator.running, 6000));
  await wacht(800);
  m = await meet(15);
  check('beat-knop beweegt op de screensavermuziek', Math.max(...m.map((x) => x.eq)) > 0.05 || new Set(m.map((x) => x.s1)).size > 2,
    { eq: Math.max(...m.map((x) => x.eq)), schalen: [...new Set(m.map((x) => x.s1))].slice(0, 3) });
  await p.evaluate(() => { config.screensaver.enabled = false; config.screensaver.muziek.aan = false; save(); renderStage(); });
  await wacht(800);

  console.log('7. Speaker wakker houden');
  await open(); await tab('saver');
  check('uit: uitleg zegt dat de speaker niets krijgt', /^Uit/.test(await p.textContent('#kaNote')));
  await schakel('#kaOn', true);
  check('aan: bewaard', await p.evaluate(() => JSON.parse(localStorage.getItem(LS_KEY)).keepAlive.on === true));
  check('aan (na een aanraking): signaal op de meter', await tot(p, () => Wakker.klaar && Wakker.niveau() > 0, 3000), await p.evaluate(() => Wakker.niveau()));
  check('balk in het menu beweegt mee', await tot(p, () => parseFloat($('#kaVul').style.width) > 0, 2000), await p.evaluate(() => $('#kaVul').style.width));
  check('uitleg: stand 3, zachte ruis, het signaal loopt', /Stand 3: zachte ruis op 0,7% .*doorlopend.*Het signaal loopt/.test(await p.textContent('#kaNote')), await p.textContent('#kaNote'));
  const niveaus = {};
  for (const soort of ['ruis', 'hoog', 'laag']) {
    await p.selectOption('#kaType', soort);
    await wacht(500);
    let max = 0;
    for (let i = 0; i < 8; i++) { max = Math.max(max, await p.evaluate(() => Wakker.niveau())); await wacht(40); }
    niveaus[soort] = max;
  }
  check('elk soort signaal komt op de meter (ruis, 18,5 kHz, 50 Hz)', Object.values(niveaus).every((x) => x > 0.001), niveaus);
  await p.selectOption('#kaType', 'ruis');
  await zet('#kaLevel', 20);
  await wacht(600);
  let hoog = 0;
  for (let i = 0; i < 8; i++) { hoog = Math.max(hoog, await p.evaluate(() => Wakker.niveau())); await wacht(40); }
  check('stand 20 geeft meer signaal dan stand 3', hoog > niveaus.ruis, { stand3: niveaus.ruis, stand20: hoog });
  await zet('#kaLevel', 3);
  await p.evaluate(() => $('#kaLevel').dispatchEvent(new Event('change', { bubbles: true })));
  check('niveau bewaard', await p.evaluate(() => JSON.parse(localStorage.getItem(LS_KEY)).keepAlive.level) === 3);
  // Puls: anderhalve seconde geluid, dan stil
  await schakel('#kaPuls', true);
  await wacht(700);
  const inPuls = await p.evaluate(() => Wakker.niveau());
  await wacht(2200);
  let naPuls = 0;
  for (let i = 0; i < 6; i++) { naPuls = Math.max(naPuls, await p.evaluate(() => Wakker.niveau())); await wacht(40); }
  check('puls: eerst signaal, na anderhalve seconde stil', inPuls > 0.001 && naPuls < inPuls / 5, { inPuls, naPuls });
  check('uitleg noemt de puls', /elke 30 seconden anderhalve seconde/.test(await p.textContent('#kaNote')));
  await schakel('#kaPuls', false);
  await wacht(600);
  check('puls uit: weer doorlopend signaal', await p.evaluate(() => Wakker.niveau()) > 0.001);
  // 5 seconden hardop
  const voor = await p.evaluate(() => Wakker.niveau());
  await p.click('#kaTest');
  await wacht(700);
  const luid = await p.evaluate(() => ({ n: Wakker.niveau(), luid: Wakker.luid, knop: $('#kaTest').textContent, uit: $('#kaTest').disabled }));
  check('5 seconden hardop: veel sterker signaal, knop zegt "Je hoort hem nu"', luid.n > voor * 10 && luid.luid && /hoort hem nu/.test(luid.knop) && luid.uit, { voor, ...luid });
  await wacht(5200);
  const na = await p.evaluate(() => ({ n: Wakker.niveau(), luid: Wakker.luid, knop: $('#kaTest').textContent, uit: $('#kaTest').disabled }));
  check('na 5 seconden terug naar het zachte niveau, knop weer bruikbaar', na.n < 0.05 && na.n > 0 && !na.luid && !na.uit && /5 seconden/.test(na.knop), na);
  await schakel('#kaOn', false);
  await wacht(600);
  check('uit: geen signaal meer', await p.evaluate(() => Wakker.niveau()) < 0.0005, await p.evaluate(() => Wakker.niveau()));
  await p.click('#kaTest');
  check('testknop zonder signaal: melding "Zet het signaal eerst aan"', await tot(p, () => /eerst aan/.test($('#toast').textContent), 1500));
  // Wakker na herstart: wacht op de eerste aanraking
  await schakel('#kaOn', true);
  await p.reload();
  await p.waitForFunction(() => typeof Muziek !== 'undefined' && mediaGeladen === true);
  await wacht(800);
  await p.mouse.click(800, 900);
  check('na herstart en een aanraking loopt het signaal vanzelf', await tot(p, () => Wakker.niveau() > 0, 3000));

  console.log('8. Zoals in een gewone browser: geluid pas na de eerste aanraking');
  const b2 = await chromium.launch({ executablePath: CHROMIUM });
  const ctx2 = await b2.newContext({ viewport: { width: 1600, height: 1000 } });
  const q = await ctx2.newPage();
  q.on('pageerror', (e) => errs.push(e.message));
  await q.goto(APP);
  await q.waitForFunction(() => typeof Muziek !== 'undefined' && mediaGeladen === true);
  await q.setInputFiles('#mediaInput', [M('clip.webm')]);
  await q.waitForFunction(() => mediaCache.size === 1);
  await q.evaluate(() => { const sc = curScene(); sc.idleMediaId = [...mediaCache.keys()][0]; sc.idleSound = true; sc.idleVolume = 70;
    config.keepAlive.on = true; config.keepAlive.level = 3; sc.buttons = [{ id: 'q0', label: 'Q', x: 50, y: 30, size: 8, color: '#35d0ba',
      shape: 'rounded', depth: 'off', showPreview: false, fx: 'none', z: 0, beat: { on: true } }]; save(); });
  await q.reload();
  await q.waitForFunction(() => typeof Muziek !== 'undefined' && mediaGeladen === true);
  await wacht(1500);
  const voorTik = await q.evaluate(() => ({ niveau: Wakker.niveau(), klaar: Wakker.klaar, idleSpeelt: !$('#idleVideo').paused, idleMuted: $('#idleVideo').muted,
    geblokkeerd: bgAudioBlocked, ctx: AudioFX.ctx?.state }));
  console.log(`   ℹ vóór een aanraking in headless Chromium: AudioContext ${voorTik.ctx}, speaker-meter ${voorTik.niveau.toFixed(4)} (headless laat de audiomotor zonder aanraking toe)`);
  check('vóór een aanraking: achtergrondvideo speelt, maar gedempt (browser weigert geluid)', voorTik.idleSpeelt && voorTik.idleMuted && voorTik.geblokkeerd, voorTik);
  // Tabbladen met element.click(): dat telt niet als aanraking.
  await q.evaluate(() => { openEditor(); document.querySelector('#panel button[data-tab="look"]').click(); });
  check('uitleg bij de achtergrondvideo: browser dempt tot iemand aanraakt', /dempt tot iemand het scherm aanraakt/.test(await q.textContent('#cfgIdleSoundNote')), await q.textContent('#cfgIdleSoundNote'));
  await q.evaluate(() => closeEditor());
  await wacht(300);
  await q.mouse.click(800, 950);
  check('na de eerste aanraking: speaker-signaal loopt', await tot(q, () => Wakker.klaar && Wakker.niveau() > 0, 3000), await q.evaluate(() => Wakker.niveau()));
  check('na de eerste aanraking: achtergrondvideo met geluid (70%)', await tot(q, () => !$('#idleVideo').muted && Math.abs($('#idleVideo').volume - 0.7) < 0.02 && !$('#idleVideo').paused, 3000),
    await q.evaluate(() => ({ muted: $('#idleVideo').muted, vol: $('#idleVideo').volume, paused: $('#idleVideo').paused })));
  await wacht(800);
  const eqNa = await q.evaluate(() => Math.max(...Array.from({ length: AR_BANDS }, (_, i) => Number($('#buttonLayer').style.getPropertyValue('--eq' + i) || 0))));
  check('na de eerste aanraking: beat-knop hoort de achtergrondvideo', eqNa > 0.05, eqNa);
  await b2.close();

  check('geen JS-fouten', errs.length === 0, errs.slice(0, 5));
  if (cerrs.length) console.log('   ℹ consolefouten:', JSON.stringify(cerrs.slice(0, 5)));
  console.log(`\n${fout ? 'FOUT' : 'OK  '}: ${ok}/${ok + fout}`);
  await b.close();
  process.exit(fout ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
