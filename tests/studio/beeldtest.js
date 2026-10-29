// Beeld: Scherm & scène (titel, achtergrondvideo met en zonder geluid,
// overlaag met menglaag en dekking, hoofdvolume, oriëntatie, knoppen
// verbergen), Vormgeving (lettertype, gewicht, logo, themapreset, frame style,
// vormen, kleuren, PNG-knop) en Motion (presets, intensiteit, entrance- en
// exit-effecten, selectie-effect, aandachtseffect, demo-handje en de
// interactie tijdens de entrance).
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
const bijna = (a, b, marge = 0.02) => typeof a === 'number' && Math.abs(a - b) <= marge;

(async () => {
  maakBeeldMedia();
  const b = await chromium.launch({ executablePath: CHROMIUM, args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } });
  const p = await ctx.newPage();
  const errs = [], cerrs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') cerrs.push(m.text()); });
  p.on('dialog', (d) => d.accept());
  await p.goto(APP);
  await p.waitForFunction(() => typeof Muziek !== 'undefined' && mediaGeladen === true);
  await p.setInputFiles('#mediaInput', [M('clip.webm'), M('1 intro.webm'), M('2 uitleg.webm'), M('bk-logo.png')]);
  await p.waitForFunction(() => mediaCache.size === 4);
  const id = await p.evaluate(() => Object.fromEntries([...mediaCache.values()].map((m) => [m.name, m.id])));

  // Hulpjes voor de bediening
  const tab = async (t) => { await p.click(`#panel button[data-tab="${t}"]`); await wacht(120); };
  const zet = (sel, waarde, evt = 'input') => p.evaluate(([s, w, e]) => {
    const n = document.querySelector(s); n.value = w; n.dispatchEvent(new Event(e, { bubbles: true }));
  }, [sel, String(waarde), evt]);
  const schakel = async (sel, aan) => {
    if ((await p.isChecked(sel)) !== aan) await p.locator(sel).locator('xpath=..').click();
  };
  const open = async () => { await p.evaluate(() => openEditor()); await wacht(200); };
  const dicht = async () => { await p.evaluate(() => closeEditor()); await wacht(250); };
  const knopRect = (bid) => p.evaluate((i) => {
    const r = document.querySelector(`.vbtn[data-id="${i}"]`).getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, l: r.left, t: r.top };
  }, bid);
  const rendersKlaar = () => tot(p, () => renditionBusy.size === 0, 20000);

  // Drie gewone knoppen (zonder videovoorbeeld) en één met voorbeeld.
  await p.evaluate((id) => {
    const k = (i, label, mediaId, x, y, extra = {}) => ({ id: 'k' + i, label, mediaId, x, y, size: 8, color: PALETTE[i],
      shape: 'rounded', depth: 'off', drift: 0, showPreview: false, fx: 'none', z: i, beat: { on: false }, ...extra });
    curScene().buttons = [
      k(0, 'Clip', id['clip.webm'], 30, 40),
      k(1, 'Intro', id['1 intro.webm'], 70, 40),
      k(2, 'Uitleg', id['2 uitleg.webm'], 30, 75),
      k(3, 'Voorbeeld', id['1 intro.webm'], 70, 75, { showPreview: true }),
    ];
    save(); renderStage();
  }, id);
  await rendersKlaar();

  console.log('1. Scherm & scène: titel');
  await open();
  await tab('look');
  await p.fill('#cfgTitle', 'Welkom bij de test');
  check('titel komt in de scène en op het scherm', await p.evaluate(() =>
    curScene().title === 'Welkom bij de test' && $('#stageTitle').textContent === 'Welkom bij de test'));
  check('titel is bewaard', await p.evaluate(() => JSON.parse(localStorage.getItem(LS_KEY)).scenes[0].title) === 'Welkom bij de test');

  console.log('2. Achtergrondvideo, met en zonder geluid');
  await p.selectOption('#cfgIdle', id['clip.webm']);
  await dicht();
  const idle = () => p.evaluate(() => { const v = $('#idleVideo'); return { hidden: v.classList.contains('hidden'),
    src: v.src, t: v.currentTime, paused: v.paused, muted: v.muted, vol: v.volume, loop: v.loop }; });
  const i0 = await idle();
  await wacht(800);
  const i1 = await idle();
  check('achtergrondvideo staat in beeld en speelt', !i1.hidden && i1.src === (await p.evaluate((i) => mediaCache.get(i).url, id['clip.webm'])) &&
    !i1.paused && i1.t > i0.t, { i0, i1 });
  check('achtergrondvideo loopt in een lus en standaard zonder geluid', i1.loop && i1.muted, i1);
  await open(); await tab('look');
  await schakel('#cfgIdleSound', true);
  await zet('#cfgIdleVolume', 40);
  await p.evaluate(() => $('#cfgIdleVolume').dispatchEvent(new Event('change', { bubbles: true })));
  let iv = await idle();
  check('geluid aan: niet meer gedempt, volume 40%', !iv.muted && bijna(iv.vol, 0.4), iv);
  check('geluid en volume bewaard per scène', await p.evaluate(() => curScene().idleSound === true && curScene().idleVolume === 40));
  check('uitleg onder de schakelaar noemt 40%', /40%/.test(await p.textContent('#cfgIdleSoundNote')), await p.textContent('#cfgIdleSoundNote'));

  console.log('3. Hoofdvolume');
  await zet('#cfgMasterVol', 50);
  iv = await idle();
  check('hoofdvolume 50% halveert de achtergrondvideo (0,2)', bijna(iv.vol, 0.2), iv);
  check('hoofdvolume bewaard', await p.evaluate(() => JSON.parse(localStorage.getItem(LS_KEY)).masterVolume) === 50);
  // Eigen volume voor clip.webm via Media → Instellingen
  await tab('media');
  await p.locator('#mediaList .card', { hasText: 'clip.webm' }).locator('button', { hasText: 'Instellingen' }).click();
  const volVeld = p.locator('#mediaList .card', { hasText: 'clip.webm' }).locator('label.field', { hasText: 'Volume' }).locator('input');
  await volVeld.fill('0.8');
  await volVeld.dispatchEvent('change');
  check('volume per video bewaard (0,8)', await p.evaluate((i) => config.mediaSettings[i]?.volume, id['clip.webm']) === 0.8);
  await dicht();
  let r = await knopRect('k0');
  await p.mouse.click(r.x, r.y);
  check('knop speelt zijn video', await tot(p, () => playOverlay.classList.contains('show') && !playVideo.paused, 4000));
  let pv = await p.evaluate(() => ({ vol: playVideo.volume, muted: playVideo.muted }));
  check('knopvideo: 0,8 × hoofdvolume 50% = 0,4', !pv.muted && bijna(pv.vol, 0.4), pv);
  check('achtergrondvideo pauzeert tijdens de knopvideo', await p.evaluate(() => $('#idleVideo').paused));
  await zet('#cfgMasterVol', 100);
  pv = await p.evaluate(() => ({ vol: playVideo.volume, muted: playVideo.muted }));
  check('hoofdvolume wijzigen tijdens het afspelen werkt direct (0,8)', bijna(pv.vol, 0.8), pv);
  await wacht(300);
  const achter = await p.evaluate(() => ({ paused: $('#idleVideo').paused, muted: $('#idleVideo').muted, vol: $('#idleVideo').volume }));
  check('na het wijzigen van het hoofdvolume blijft de achtergrondvideo stil op pauze', achter.paused, achter);
  await p.evaluate(() => { $('#idleVideo').pause(); runRemoteCommand({ type: 'setVolume', value: 90 }); });
  await wacht(300);
  const achter2 = await p.evaluate(() => ({ paused: $('#idleVideo').paused, muted: $('#idleVideo').muted, master: config.masterVolume, knop: playVideo.volume }));
  check('volume op afstand (beheerpaneel) tijdens een knopvideo: achtergrond blijft op pauze', achter2.paused && bijna(achter2.knop, 0.72), achter2);
  check('knoppen verborgen tijdens het afspelen (standaard)', await p.evaluate(() => $('#buttonLayer').style.visibility === 'hidden'));
  await p.click('#stopPlay');
  await tot(p, () => !playOverlay.classList.contains('show'), 2000);
  await wacht(600);
  check('na stoppen: knoppen terug, achtergrondvideo speelt weer', await p.evaluate(() =>
    $('#buttonLayer').style.visibility === '' && !$('#idleVideo').paused));
  // Video zonder eigen volume
  r = await knopRect('k1');
  await p.mouse.click(r.x, r.y);
  await tot(p, () => playOverlay.classList.contains('show') && !playVideo.paused, 4000);
  pv = await p.evaluate(() => ({ vol: playVideo.volume, muted: playVideo.muted, master: config.masterVolume }));
  console.log(`   ℹ knopvideo zonder eigen volume-instelling: muted=${pv.muted}, volume=${pv.vol} (hoofdvolume ${pv.master}%)`);
  await p.evaluate(() => stopPlaying());
  await wacht(700);

  console.log('4. Knoppen verbergen tijdens afspelen');
  await open(); await tab('look');
  await schakel('#cfgHideBtns', false);
  check('schakelaar uit → config.hideButtonsDuringPlay false', await p.evaluate(() => config.hideButtonsDuringPlay === false));
  await dicht();
  r = await knopRect('k1');
  const r2 = await knopRect('k2');
  await p.mouse.click(r.x, r.y);
  await tot(p, () => playOverlay.classList.contains('show') && !playVideo.paused, 4000);
  await wacht(500);
  const zicht = await p.evaluate(([x, y]) => {
    const n = document.elementFromPoint(x, y);
    return { laag: $('#buttonLayer').style.visibility, bovenste: n ? (n.closest('.vbtn') ? 'knop' : n.id || n.className) : null };
  }, [r2.x, r2.y]);
  check('uit: knoppen blijven zichtbaar tijdens het afspelen (bovenop de video)', zicht.laag !== 'hidden' && zicht.bovenste === 'knop', zicht);
  await p.evaluate(() => stopPlaying());
  await wacht(700);
  await open(); await tab('look'); await schakel('#cfgHideBtns', true);

  console.log('5. Overlaag met menglaag en dekking');
  await p.selectOption('#cfgOverlay', id['1 intro.webm']);
  await p.selectOption('#cfgOverlayBlend', 'lighten');
  await zet('#cfgOverlayOpacity', 70);
  await dicht();
  await wacht(400);
  const ov = await p.evaluate(() => { const v = $('#overlayVideo'); const cs = getComputedStyle(v);
    return { hidden: v.classList.contains('hidden'), op: cs.opacity, blend: cs.mixBlendMode, paused: v.paused, src: v.src }; });
  check('overlaag in beeld, speelt, menglaag lighten, dekking 0,7', !ov.hidden && !ov.paused && ov.blend === 'lighten' && bijna(Number(ov.op), 0.7), ov);
  check('overlaag ligt boven de achtergrond', await p.evaluate(() => Number(getComputedStyle($('#overlayVideo')).zIndex) >
    (Number(getComputedStyle($('#idleVideo')).zIndex) || 0)));
  await open(); await tab('look');
  await p.selectOption('#cfgOverlayBlend', 'screen');
  check('menglaag screen', await p.evaluate(() => getComputedStyle($('#overlayVideo')).mixBlendMode) === 'screen');
  await p.selectOption('#cfgOverlay', '');
  check('overlaag weg → verborgen, geen bron', await p.evaluate(() => $('#overlayVideo').classList.contains('hidden') && !$('#overlayVideo').src));

  console.log('6. Achtergrond per scène');
  await p.evaluate((id) => {
    config.scenes.push({ id: 'scn2', name: 'Twee', title: 'Scène twee', idleMediaId: id['2 uitleg.webm'], idleSound: false, idleVolume: 60,
      buttons: [{ id: 't0', label: 'Terug', x: 50, y: 50, size: 8, color: '#35d0ba', shape: 'pill', action: { type: 'Back' }, z: 0, showPreview: false, fx: 'none', beat: { on: false } }] });
    curScene().buttons[2].action = { type: 'OpenScene', sceneId: 'scn2' };
    save(); renderStage();
  }, id);
  await dicht();
  r = await knopRect('k2');
  await p.mouse.click(r.x, r.y);
  check('knop opent scène twee', await tot(p, () => currentSceneId === 'scn2', 4000));
  await wacht(300);
  iv = await idle();
  check('scène twee: eigen achtergrondvideo, zonder geluid', iv.src === (await p.evaluate((i) => mediaCache.get(i).url, id['2 uitleg.webm'])) && iv.muted && !iv.paused, iv);
  check('scène twee: eigen titel', await p.textContent('#stageTitle') === 'Scène twee');
  await wacht(1500);
  r = await knopRect('t0');
  await p.mouse.click(r.x, r.y);
  check('terug naar home', await tot(p, () => currentSceneId === config.homeSceneId, 4000));
  await wacht(300);
  iv = await idle();
  check('home: weer clip.webm met geluid', iv.src === (await p.evaluate((i) => mediaCache.get(i).url, id['clip.webm'])) && !iv.muted, iv);

  console.log('7. Oriëntatie');
  await open(); await tab('look');
  await p.selectOption('#cfgOrientation', 'portrait');
  check('portrait bewaard; in het menu niet gedraaid', await p.evaluate(() => config.orientationMode === 'portrait' && !/rotate/.test($('#stage').style.transform)),
    await p.evaluate(() => $('#stage').style.transform));
  await dicht();
  let st = await p.evaluate(() => ({ tf: $('#stage').style.transform, w: $('#stage').style.width, h: $('#stage').style.height,
    saver: $('#saver').style.transform, play: playOverlay.style.transform }));
  check('portrait op een liggend scherm: podium 90° gedraaid, 1000×1600', st.tf === 'rotate(90deg)' && st.w === '1000px' && st.h === '1600px', st);
  check('screensaver en afspeellaag draaien mee', st.saver === 'rotate(90deg)' && st.play === 'rotate(90deg)', st);
  await wacht(1500);
  r = await knopRect('k1');
  await p.mouse.click(r.x, r.y);
  check('gedraaid podium: knop aantikken speelt de video', await tot(p, () => playOverlay.classList.contains('show'), 4000));
  await p.evaluate(() => stopPlaying()); await wacht(700);
  await open(); await tab('look');
  await p.selectOption('#cfgOrientation', 'landscape');
  await dicht();
  check('landscape op een liggend scherm: niet gedraaid', await p.evaluate(() => $('#stage').style.transform === ''));
  await open(); await tab('look');
  await p.selectOption('#cfgOrientation', 'auto');
  await dicht();
  check('automatisch: niet gedraaid', await p.evaluate(() => $('#stage').style.transform === '' && config.orientationMode === 'auto'));

  console.log('8. Vormgeving: lettertype, gewicht, logo, themapreset');
  await open(); await tab('style');
  const font = () => p.evaluate(() => getComputedStyle(document.querySelector('.vbtn[data-id="k0"]')).fontFamily);
  await p.selectOption('#thFont', 'serif');
  check('lettertype serif op de knoppen', /Georgia/.test(await font()), await font());
  await p.selectOption('#thFont', 'mono');
  check('lettertype mono op de knoppen', /Consolas|Courier/.test(await font()), await font());
  check('lettertype ook op de titel', /Consolas|Courier/.test(await p.evaluate(() => getComputedStyle($('#stageTitle')).fontFamily)));
  await p.selectOption('#thWeight', '400');
  check('tekstgewicht 400 op de knoppen', await p.evaluate(() => getComputedStyle(document.querySelector('.vbtn[data-id="k0"]')).fontWeight) === '400');
  await p.selectOption('#thWeight', '800');
  check('tekstgewicht 800 op de knoppen', await p.evaluate(() => getComputedStyle(document.querySelector('.vbtn[data-id="k0"]')).fontWeight) === '800');
  console.log(`   ℹ titel volgt het tekstgewicht niet: gewicht titel = ${await p.evaluate(() => getComputedStyle($('#stageTitle')).fontWeight)}`);
  check('logokeuze toont alleen afbeeldingen', await p.evaluate(() => [...$('#thLogo').options].map((o) => o.textContent).join('|')) === '— geen logo —|bk-logo.png');
  await p.selectOption('#thLogo', id['bk-logo.png']);
  await dicht();
  await tot(p, () => $('#stageLogo').complete && $('#stageLogo').naturalWidth > 0, 3000);
  let lg = await p.evaluate(() => { const l = $('#stageLogo'); const rr = l.getBoundingClientRect();
    return { cls: l.className, w: Math.round(rr.width), l: Math.round(rr.left), t: Math.round(rr.top), r: Math.round(innerWidth - rr.right), b: Math.round(innerHeight - rr.bottom), src: l.src }; });
  check('logo linksboven, 12vmin breed (120 px)', lg.cls === 'pos-top-left' && lg.w === 120 && lg.l === 30 && lg.t === 30, lg);
  await open(); await tab('style');
  await zet('#thLogoSize', 20);
  await p.selectOption('#thLogoPos', 'bottom-right');
  await dicht();
  lg = await p.evaluate(() => { const l = $('#stageLogo'); const rr = l.getBoundingClientRect();
    return { cls: l.className, w: Math.round(rr.width), r: Math.round(innerWidth - rr.right), b: Math.round(innerHeight - rr.bottom) }; });
  check('logo rechtsonder, 20vmin (200 px)', lg.cls === 'pos-bottom-right' && lg.w === 200 && lg.r === 30 && lg.b === 30, lg);
  await open(); await tab('style');
  await p.selectOption('#thLogoPos', 'top-center');
  lg = await p.evaluate(() => { const rr = $('#stageLogo').getBoundingClientRect(); return { mid: Math.round(rr.left + rr.width / 2), stageMid: Math.round($('#stage').getBoundingClientRect().left + $('#stage').getBoundingClientRect().width / 2) }; });
  check('logo bovenaan gecentreerd', Math.abs(lg.mid - lg.stageMid) <= 2, lg);
  await p.selectOption('#thLogo', '');
  check('geen logo → verborgen', await p.evaluate(() => $('#stageLogo').classList.contains('hidden')));
  await p.selectOption('#thPreset', 'luxury');
  check('themapreset Luxury: frame, motion, lettertype en gewicht', await p.evaluate(() =>
    config.frameStyle.color1 === '#0d0d0f' && config.motion.preset === 'luxury' && config.theme.font === 'serif' &&
    config.theme.weight === 600 && $('#thPreset').value === '' && $('#thFont').value === 'serif'));

  console.log('9. Video Frame Style');
  const kader = () => p.evaluate(() => {
    const k = document.querySelector('.vbtn[data-id="k3"]');
    const cs = getComputedStyle(k), w = k.querySelector('.pv-well'), v = k.querySelector('video.preview');
    return { cls: k.className, bg: k.style.background, bgc: cs.backgroundColor, bgi: cs.backgroundImage, rad: cs.borderTopLeftRadius,
      pad: v ? getComputedStyle(v).left : null, well: w ? getComputedStyle(w).boxShadow : null, shadow: cs.boxShadow,
      gloss: getComputedStyle(k, '::before').backgroundImage, frad: k.style.getPropertyValue('--frad'), glowI: k.style.getPropertyValue('--glowI') };
  });
  check('voorbeeldknop heeft een kader met video', (await kader()).cls.includes('has-preview'), (await kader()).cls);
  await p.selectOption('#fsMode', 'gradient');
  await zet('#fsColor1', '#ff0000'); await zet('#fsColor2', '#0000ff'); await zet('#fsAngle', 90);
  let kd = await kader();
  check('kleurverloop: rood → blauw onder 90°', /linear-gradient\(90deg, rgb\(255, 0, 0\), rgb\(0, 0, 255\)\)/.test(kd.bgi), kd.bgi);
  await p.selectOption('#fsMode', 'solid');
  kd = await kader();
  check('effen kleur: rood', kd.bgc === 'rgb(255, 0, 0)' && kd.bgi === 'none', { bgc: kd.bgc, bgi: kd.bgi });
  await p.selectOption('#fsMode', 'outline');
  kd = await kader();
  check('alleen omlijning: open frame', kd.cls.includes('frame-outline') && kd.bgc === 'rgba(0, 0, 0, 0)', { cls: kd.cls, bgc: kd.bgc });
  await p.selectOption('#fsMode', 'button');
  kd = await kader();
  const eigen = await p.evaluate(() => curButtons()[3].color);
  check('knopkleur: het kader krijgt de kleur van de knop', kd.bgc === await p.evaluate((h) => { const d = document.createElement('div'); d.style.color = h; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; }, eigen), { bgc: kd.bgc, eigen });
  await zet('#fsRadius', 0); const rad0 = (await kader()).rad;
  await zet('#fsRadius', 48); const rad48 = (await kader()).rad;
  check('hoekafronding verandert het kader', rad0 !== rad48 && parseFloat(rad0) === 0, { rad0, rad48 });
  await zet('#fsThickness', 2); const dik2 = (await kader()).pad;
  await zet('#fsThickness', 18); const dik18 = (await kader()).pad;
  check('framedikte verschuift het videovlak', parseFloat(dik18) > parseFloat(dik2), { dik2, dik18 });
  await zet('#fsDepth', 0); const d0 = (await kader()).well;
  await zet('#fsDepth', 16); const d16 = (await kader()).well;
  check('diepte verandert de schaduw in het kader', d0 !== d16, { d0, d16 });
  await zet('#fsGloss', 0); const g0 = (await kader()).gloss;
  await zet('#fsGloss', 0.7); const g7 = (await kader()).gloss;
  check('gloss verandert de glanslaag', g0 !== g7, { g0, g7 });
  await zet('#fsHighlight', 0); const h0 = (await kader()).shadow;
  await zet('#fsHighlight', 0.8); const h8 = (await kader()).shadow;
  check('highlight verandert de reflectie', h0 !== h8);
  await zet('#fsGlow', 0); const gl0 = (await kader()).glowI;
  await zet('#fsGlow', 2.5); const gl25 = (await kader()).glowI;
  check('gloed-intensiteit komt op de knop', gl0 === '0.00' && gl25 === '2.50', { gl0, gl25 });
  await zet('#fsShadow', 0); const s0 = await kader();
  await zet('#fsShadow', 1); const s1 = await kader();
  check('schaduw tussen frame en beeld bewaard', await p.evaluate(() => config.frameStyle.shadow) === 1);
  check('schaduw tussen frame en beeld verandert iets aan de knop', JSON.stringify(s0) !== JSON.stringify(s1),
    { well0: s0.well, well1: s1.well });

  console.log('10. Vormen, kleuren en een PNG als knop');
  await tab('buttons');
  await p.click('.box-rij[data-knop="k0"]');
  await wacht(200);
  const vormSel = p.locator('#inspBody select:has(option[value="hotspot"])');
  const vorm = () => p.evaluate(() => { const k = document.querySelector('.vbtn[data-id="k0"]'); const cs = getComputedStyle(k); const rr = k.getBoundingClientRect();
    return { cls: k.className, rad: cs.borderTopLeftRadius, w: Math.round(rr.width), h: Math.round(rr.height), bg: cs.backgroundColor, color: cs.color }; });
  const vormen = {};
  for (const v of ['square', 'rounded', 'pill', 'circle', 'hotspot']) {
    await vormSel.selectOption(v);
    vormen[v] = await vorm();
  }
  check('vorm komt in de config', await p.evaluate(() => curButtons()[0].shape) === 'hotspot');
  check('vierkant: geen afronding', vormen.square.cls.includes('shape-square') && vormen.square.rad === '0px', vormen.square);
  check('afgerond: kleine afronding', vormen.rounded.cls.includes('shape-rounded') && parseFloat(vormen.rounded.rad) > 0, vormen.rounded);
  check('ovaal: volledig afgerond', parseFloat(vormen.pill.rad) >= vormen.pill.h / 2, vormen.pill);
  check('rond: vierkant vlak met 50%', vormen.circle.rad === '50%' && Math.abs(vormen.circle.w - vormen.circle.h) <= 1, vormen.circle);
  check('hotspot in de bewerkstand: gestippeld zichtbaar', vormen.hotspot.cls.includes('shape-hotspot'), vormen.hotspot);
  await dicht();
  const hs = await vorm();
  check('onzichtbare hotspot op het podium: transparant, zonder tekst', hs.bg === 'rgba(0, 0, 0, 0)' && hs.color === 'rgba(0, 0, 0, 0)', hs);
  await open(); await tab('buttons');
  await p.click('.box-rij[data-knop="k0"]');
  await wacht(200);
  await vormSel.selectOption('rounded');
  await p.locator('#inspBody details', { hasText: 'UITERLIJK' }).locator('.swatch').nth(4).click();
  check('kleur kiezen: knop wordt oranje', (await vorm()).bg === 'rgb(240, 118, 47)' && await p.evaluate(() => curButtons()[0].color) === '#f0762f', (await vorm()).bg);
  await p.locator('#inspBody details', { hasText: 'UITERLIJK' }).locator('.swatch').nth(8).click();
  check('witte knop krijgt donkere tekst', (await vorm()).color !== 'rgb(255, 255, 255)', (await vorm()).color);
  await p.locator('#inspBody details', { hasText: 'UITERLIJK' }).locator('label.field', { hasText: 'Eigen PNG' }).locator('select').selectOption(id['bk-logo.png']);
  const pngVorm = () => p.evaluate((i) => { const k = document.querySelector('.vbtn[data-id="k0"]');
    return k.classList.contains('png-face') && k.querySelector('img')?.src === mediaCache.get(i).url; }, id['bk-logo.png']);
  check('PNG als knopvorm bewaard', await p.evaluate((i) => curButtons()[0].imageId === i, id['bk-logo.png']));
  check('PNG als knopvorm, bij een knop zonder videovoorbeeld', await pngVorm(),
    await p.evaluate(() => document.querySelector('.vbtn[data-id="k0"]').className));
  // Met videovoorbeeld aan
  await p.locator('#inspBody details', { hasText: 'INTERACTIE' }).locator('summary').click();
  await p.locator('#inspBody details', { hasText: 'INTERACTIE' }).locator('label.field', { hasText: 'Videovoorbeeld' }).locator('select').selectOption('yes');
  check('PNG als knopvorm, met videovoorbeeld aan', await pngVorm());
  await dicht();
  await wacht(2200);
  await tot(p, () => document.querySelector('.vbtn[data-id="k0"] img')?.complete, 3000);
  r = await knopRect('k0');
  await p.mouse.click(r.l + r.w * 0.08, r.t + r.h * 0.08);
  await wacht(1200);
  check('PNG-knop: tik op het doorzichtige deel doet niets', !(await p.evaluate(() => playOverlay.classList.contains('show'))));
  await p.mouse.click(r.x, r.y);
  check('PNG-knop: tik op de afbeelding speelt de video', await tot(p, () => playOverlay.classList.contains('show'), 4000));
  await p.evaluate(() => stopPlaying()); await wacht(700);

  console.log('11. Motion: presets en intensiteit');
  await open(); await tab('fx');
  check('preset-keuze heeft alle presets', await p.evaluate(() => $('#mpPreset').options.length === Object.keys(MOTION_PRESETS).length));
  await p.selectOption('#mpEffect', '');
  const presets = await p.evaluate(() => Object.keys(MOTION_PRESETS));
  const presetUit = [];
  for (const pr of presets) {
    await p.selectOption('#mpPreset', pr);
    for (const it of ['subtle', 'immersive', 'showcase']) {
      await p.selectOption('#mpIntensity', it);
      presetUit.push(await p.evaluate(async () => {
        const pr = runEntrance(); const n = document.getAnimations().length;
        const t0 = performance.now(); await pr;
        return { preset: config.motion.preset, it: config.motion.intensity, n, ms: Math.round(performance.now() - t0), cfg: entranceCfg() };
      }));
    }
  }
  check(`alle ${presets.length} presets × 3 intensiteiten spelen een entrance`, presetUit.every((x) => x.n > 0 && x.ms < 6000),
    presetUit.filter((x) => !(x.n > 0 && x.ms < 6000)));
  const corp = presetUit.filter((x) => x.preset === 'corporate');
  check('intensiteit schaalt de duur (subtle < immersive < showcase)', corp[0].cfg.duration < corp[1].cfg.duration && corp[1].cfg.duration < corp[2].cfg.duration,
    corp.map((x) => x.cfg.duration));
  check('preset bepaalt het entrance-effect als er geen eigen effect is', presetUit.find((x) => x.preset === 'retail').cfg.effect === 'scalePop');
  check('geen JS-fouten bij de presets', errs.length === 0, errs.slice(0, 3));

  console.log('12. Motion: alle entrance-effecten, volgordes en exits');
  const effecten = await p.evaluate(() => [...$('#mpEffect').options].map((o) => o.value).filter(Boolean));
  const effUit = [];
  for (const ef of effecten) {
    await p.selectOption('#mpEffect', ef);
    effUit.push(await p.evaluate(async () => { const pr = runEntrance(); const n = document.getAnimations().length; await pr; return { ef: config.motion.overrides.effect, n }; }));
  }
  check(`alle ${effecten.length} entrance-effecten draaien`, effUit.every((x) => x.n > 0), effUit.filter((x) => !(x.n > 0)));
  await p.selectOption('#mpEffect', 'fade');
  const seqs = await p.evaluate(() => [...$('#mpSequence').options].map((o) => o.value).filter(Boolean));
  const seqUit = [];
  for (const s of seqs) {
    await p.selectOption('#mpSequence', s);
    seqUit.push(await p.evaluate(async () => { await runEntrance(); return entranceCfg().sequence; }));
  }
  check(`alle ${seqs.length} volgordes werken`, JSON.stringify(seqUit) === JSON.stringify(seqs), seqUit);
  await p.fill('#mpDuration', '500'); await p.dispatchEvent('#mpDuration', 'change');
  await p.fill('#mpStagger', '40'); await p.dispatchEvent('#mpStagger', 'change');
  check('eigen duur en stagger overschrijven de preset', await p.evaluate(() => { const c = entranceCfg(); const m = INTENSITY[config.motion.intensity];
    return c.duration === Math.round(500 * m) && c.stagger === Math.round(40 * m); }));
  const exits = await p.evaluate(() => [...$('#mpExit').options].map((o) => o.value));
  const exUit = [];
  for (const ex of exits) {
    await p.selectOption('#mpExit', ex);
    exUit.push(await p.evaluate(async () => { const pr = runSceneExit(); const n = document.getAnimations().length; await pr;
      cancelSelectAnims(); for (const a of document.getAnimations()) a.cancel(); return { ex: config.exitFx, n }; }));
  }
  check(`alle ${exits.length} exit-effecten draaien`, exUit.every((x) => x.n > 0), exUit.filter((x) => !(x.n > 0)));
  check('geen JS-fouten bij effecten en exits', errs.length === 0, errs.slice(0, 3));

  console.log('13. Galaxy Tiles: fijnafstelling, reduced motion en interactie');
  await p.fill('#gxDuration', '5000'); await p.dispatchEvent('#gxDuration', 'change');
  await p.fill('#gxChaos', '60'); await p.dispatchEvent('#gxChaos', 'change');
  await p.fill('#gxSeed', '42'); await p.dispatchEvent('#gxSeed', 'change');
  check('galaxy-velden bewaard en begrensd (duur max 2400)', await p.evaluate(() => config.galaxy.durationMs === 2400 && config.galaxy.chaos === 60 && config.galaxy.seed === 42));
  await p.selectOption('#mpEffect', 'galaxyTiles');
  await p.click('#gxPreview');
  check('galaxy-voorbeeld speelt', await p.evaluate(() => document.getAnimations().length > 0));
  await schakel('#gxReduced', true);
  const red = await p.evaluate(async () => { for (const a of document.getAnimations()) a.cancel();
    const pr = runEntrance(); const d = document.getAnimations().filter((a) => a.effect?.target?.classList?.contains('vbtn')).map((a) => a.effect.getTiming().duration); await pr; return d; });
  check('reduced motion: rustige fade van 420 ms', red.length > 0 && red.every((d) => d === 420), red.slice(0, 4));
  await schakel('#gxReduced', false);
  await p.fill('#gxDuration', '2000'); await p.dispatchEvent('#gxDuration', 'change');
  await p.selectOption('#gxInteraction', 'disabled');
  await dicht();
  await wacht(2600);
  r = await knopRect('k1');
  const gate = await p.evaluate(async ([x, y]) => {
    for (const a of document.getAnimations()) a.cancel();
    const pr = runEntrance();
    await new Promise((res) => setTimeout(res, 1600));   // ~70% van de entrance
    const n = document.elementFromPoint(x, y);
    const uit = { laag: $('#buttonLayer').style.pointerEvents, knopPE: getComputedStyle(document.querySelector('.vbtn[data-id="k1"]')).pointerEvents,
      raak: !!(n && n.closest('.vbtn')) };
    await pr;
    return uit;
  }, [r.x, r.y]);
  check("'Pas na afloop': knoppen tijdens de entrance niet aan te tikken", !gate.raak, gate);
  await wacht(800);
  await open(); await tab('fx'); await p.selectOption('#gxInteraction', 'after50');

  console.log('14. Selectie-effect bij het aantikken');
  await p.selectOption('#mpEffect', 'fade');
  await p.fill('#mpDuration', ''); await p.dispatchEvent('#mpDuration', 'change');
  await p.fill('#mpStagger', ''); await p.dispatchEvent('#mpStagger', 'change');
  const selUit = [];
  for (const fx of ['preset', 'morph', 'zoom', 'aside', 'depth', 'burst', 'none']) {
    await open(); await tab('fx');
    await p.selectOption('#cfgSelectFx', fx);
    await dicht();
    await wacht(1200);
    r = await knopRect('k3');
    await p.evaluate(() => {
      window.__sel = { anims: 0, morph: false };
      new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.classList?.contains('morph-clone')) window.__sel.morph = true; })
        .observe(document.body, { childList: true });
      const orig = Element.prototype.animate;
      Element.prototype.animate = function (...a) { if (this.classList?.contains('vbtn')) window.__sel.anims++; return orig.apply(this, a); };
      window.__selHerstel = () => { Element.prototype.animate = orig; };
    });
    const t0 = Date.now();
    await p.mouse.click(r.x, r.y);
    const gespeeld = await tot(p, () => playOverlay.classList.contains('show'), 4000);
    const ms = Date.now() - t0;
    const s = await p.evaluate(() => { window.__selHerstel(); return { ...window.__sel, actief: activeSelectFx(), opgeslagen: config.selectFx }; });
    selUit.push({ fx, gespeeld, ms, ...s });
    await p.evaluate(() => stopPlaying());
    await wacht(900);
  }
  check('elk selectie-effect start daarna de video', selUit.every((x) => x.gespeeld), selUit);
  check('selectie-effecten animeren de knoppen (behalve "geen")', selUit.filter((x) => x.fx !== 'none').every((x) => x.anims >= 4) &&
    selUit.find((x) => x.fx === 'none').anims <= 1, selUit.map((x) => [x.fx, x.anims]));
  check('"volgens preset" volgt de motionpreset', selUit[0].actief === 'zoom' || selUit[0].actief === 'depth', selUit[0]);
  check('morph: de tegel groeit uit tot het videovlak', selUit.find((x) => x.fx === 'morph').morph);
  check('"geen effect" start direct', selUit.find((x) => x.fx === 'none').ms < 600, selUit.find((x) => x.fx === 'none').ms);
  await open(); await tab('fx');
  await p.click('#selFxDemo');
  check('"Laat zien op het podium" speelt het effect en zet alles terug', await tot(p, () => $('#selFxDemo').textContent.includes('Laat zien'), 4000) &&
    await p.evaluate(() => document.querySelectorAll('.vbtn').length === 4));

  console.log('15. Aandachtseffecten');
  await p.fill('#cfgFxInterval', '1'); await p.dispatchEvent('#cfgFxInterval', 'change');
  check('interval begrensd op minimaal 3 s', await p.evaluate(() => config.fxIntervalSec) === 3);
  await p.evaluate(() => {
    const soorten = ['glow', 'sweep', 'flash', 'shine'];
    curButtons().forEach((k, i) => { k.fx = soorten[i]; });
    save(); renderStage();
    window.__fx = new Set();
    new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === 'attributes') for (const c of m.target.classList) if (c.startsWith('fx-')) window.__fx.add(m.target.dataset.id + ':' + c);
        for (const n of m.addedNodes || []) if (n.classList && /fx-(ring|shine)/.test(n.className)) window.__fx.add(n.parentElement?.dataset.id + ':' + n.className);
      }
    }).observe($('#buttonLayer'), { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });
  });
  await dicht();
  await p.evaluate(() => { fxSuppressUntil = 0; });
  await tot(p, () => window.__fx.size >= 4, 12000);
  const fxGezien = await p.evaluate(() => [...window.__fx].sort());
  check('elke knop speelt zijn eigen aandachtseffect (gloed, lichtrand, flits, glans)',
    ['k0:fx-glow', 'k1:fx-ring', 'k2:fx-flash', 'k3:fx-shine'].every((x) => fxGezien.includes(x)), fxGezien);
  await p.evaluate(() => { curButtons().forEach((k) => { k.fx = 'none'; }); save(); window.__fx.clear(); });
  await wacht(4500);
  check('aandachtseffect "uit": niets meer', await p.evaluate(() => window.__fx.size === 0), await p.evaluate(() => [...window.__fx]));

  console.log('16. Demo-handje');
  await open(); await tab('fx');
  await schakel('#handEnabled', true);
  await zet('#handSize', 1.5);
  await p.fill('#handDelay', '3'); await p.dispatchEvent('#handDelay', 'change');
  check('handje-instellingen bewaard', await p.evaluate(() => config.hand.enabled && config.hand.size === 1.5 && config.hand.delaySec === 3 &&
    $('#hand').style.getPropertyValue('--handScale') === '1.5'));
  check('handje niet zichtbaar zolang het menu open is', await p.evaluate(() => !$('#hand').classList.contains('visible')));
  await dicht();
  const t0 = Date.now();
  await p.evaluate(() => { lastInteraction = Date.now(); });
  const zichtbaar = await tot(p, () => $('#hand').classList.contains('visible'), 7000);
  const naSec = (Date.now() - t0) / 1000;
  check('handje verschijnt na de ingestelde rust (3 s)', zichtbaar && naSec >= 2.8, naSec.toFixed(1));
  check('handje wijst een knop aan', await p.evaluate(() => curButtons().some((k) => $('#hand').style.left.includes(k.x + '%'))), await p.evaluate(() => $('#hand').style.left));
  await p.mouse.click(800, 960);
  await wacht(60);
  check('aanraking: handje direct weg', await p.evaluate(() => !$('#hand').classList.contains('visible')));
  await open(); await tab('fx'); await schakel('#handEnabled', false); await dicht();

  check('geen JS-fouten', errs.length === 0, errs.slice(0, 5));
  if (cerrs.length) console.log('   ℹ consolefouten:', JSON.stringify(cerrs.slice(0, 5)));
  console.log(`\n${fout ? 'FOUT' : 'OK  '}: ${ok}/${ok + fout}`);
  await b.close();
  process.exit(fout ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
