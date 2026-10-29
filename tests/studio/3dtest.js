// 3D-objecten: OBJ met .mtl en texture, GLB met animatie, een knop met een
// model opent de 3D-weergave, slepen draait het model, automatisch sluiten,
// de instellingen per model (Media → 3D-instellingen) en voor alle modellen
// (tabblad 3D-objecten).
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
// Hoeveel beeldpunten verschillen er tussen twee momentopnames (64×64)?
const verschil = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) {
  if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) + Math.abs(a[i + 3] - b[i + 3]) > 40) n++; } return n; };
const gevuld = (a) => { let n = 0; for (let i = 3; i < a.length; i += 4) if (a[i] > 10) n++; return n; };

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
  const tab = async (t) => { await p.click(`#panel button[data-tab="${t}"]`); await wacht(120); };
  const zet = (sel, waarde, evt = 'input') => p.evaluate(([s, w, e]) => {
    const n = document.querySelector(s); n.value = w; n.dispatchEvent(new Event(e, { bubbles: true }));
  }, [sel, String(waarde), evt]);
  const schakel = async (sel, aan) => {
    if ((await p.isChecked(sel)) !== aan) await p.locator(sel).locator('xpath=..').click();
  };
  const open = async () => { await p.evaluate(() => openEditor()); await wacht(200); };
  const dicht = async () => { await p.evaluate(() => closeEditor()); await wacht(250); };
  const knopMidden = (bid) => p.evaluate((i) => {
    const r = document.querySelector(`.vbtn[data-id="${i}"]`).getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, bid);
  // Momentopname van een WebGL-canvas, verkleind tot 64×64 RGBA.
  const foto = (sel) => p.evaluate((s) => {
    const cv = document.querySelector(s);
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const g = c.getContext('2d'); g.drawImage(cv, 0, 0, 64, 64);
    return [...g.getImageData(0, 0, 64, 64).data];
  }, sel);

  console.log('1. 3D-bestanden toevoegen');
  await p.evaluate(() => openEditor());
  await tab('media');
  await p.setInputFiles('#mediaInput', [M('bk-kubus.obj'), M('bk-kubus.mtl'), M('bk-kubus-tex.png'), M('bk-kubus.glb'), M('bk-kaal.obj'), M('clip.webm')]);
  await p.waitForFunction(() => mediaCache.size === 6);
  const id = await p.evaluate(() => Object.fromEntries([...mediaCache.values()].map((m) => [m.name, m.id])));
  check('soorten: model, mtl, afbeelding, model', await p.evaluate((id) =>
    [mediaCache.get(id['bk-kubus.obj']).kind, mediaCache.get(id['bk-kubus.mtl']).kind, mediaCache.get(id['bk-kubus-tex.png']).kind,
      mediaCache.get(id['bk-kubus.glb']).kind].join(), id) === 'model,mtl,image,model');
  check('mediabibliotheek toont 3D-instellingen bij de drie modellen', await p.locator('#mediaList button', { hasText: '3D-instellingen' }).count() === 3);
  check('.mtl staat niet in de keuze voor een knop', await p.evaluate(() => !mediaSelect(null, () => {}).textContent.includes('.mtl')));

  console.log('2. Modellen inlezen');
  const geo = await p.evaluate(async (id) => {
    const o = await loadObjGeometry(id['bk-kubus.obj']);
    const g = await loadObjGeometry(id['bk-kubus.glb']);
    return { obj: { tris: o.tris, fmt: o.format, tex: !!o.prims[0].texture },
      glb: { tris: g.tris, fmt: g.format, anim: g.animations.length, dur: g.animations[0]?.duration, kleur: g.prims[0].color } };
  }, id);
  check('OBJ: 12 driehoeken met texture uit de .mtl', geo.obj.tris === 12 && geo.obj.fmt === 'obj' && geo.obj.tex, geo.obj);
  check('GLB: 12 driehoeken, één animatie van 2 s, materiaalkleur', geo.glb.tris === 12 && geo.glb.fmt === 'gltf' && geo.glb.anim === 1 &&
    geo.glb.dur === 2 && Math.abs(geo.glb.kleur[0] - 0.9) < 0.01, geo.glb);

  console.log('3. Knop met een 3D-model');
  await p.evaluate((id) => {
    const k = (i, label, mediaId, x, extra = {}) => ({ id: 'm' + i, label, mediaId, x, y: 50, size: 9, color: PALETTE[i],
      shape: 'rounded', depth: 'off', drift: 0, showPreview: true, fx: 'none', z: i, ...extra });
    curScene().buttons = [k(0, 'Kubus', id['bk-kubus.obj'], 25), k(1, 'Animatie', id['bk-kubus.glb'], 50), k(2, 'Kaal', id['bk-kaal.obj'], 75)];
    save(); renderStage();
  }, id);
  await dicht();
  check('voorbeeld in de knop: 3D-canvas met badge', await tot(p, () => objViewers.has('m0') && objViewers.has('m1') &&
    document.querySelector('.vbtn[data-id="m0"] canvas.preview3d') && document.querySelector('.vbtn[data-id="m0"] .pv-badge')?.textContent === '3D', 5000));
  await wacht(600);
  check('voorbeeld tekent het model', gevuld(await foto('.vbtn[data-id="m0"] canvas.preview3d')) > 50);
  const pv1 = await foto('.vbtn[data-id="m0"] canvas.preview3d');
  await wacht(700);
  check('voorbeeld draait langzaam rond', verschil(pv1, await foto('.vbtn[data-id="m0"] canvas.preview3d')) > 20);

  console.log('4. De 3D-weergave');
  let r = await knopMidden('m0');
  await p.mouse.click(r.x, r.y);
  check('aantikken opent de 3D-weergave', await tot(p, () => playOverlay.classList.contains('show') && playOverlay.classList.contains('mode-3d') &&
    objViewers.has('fullscreen'), 5000));
  check('witte studio-achtergrond (standaard), knoppen verborgen', await p.evaluate(() => playOverlay.classList.contains('light') &&
    $('#buttonLayer').style.visibility === 'hidden' && getComputedStyle($('#playCanvas')).display === 'block'));
  await wacht(500);
  check('het model staat in beeld', gevuld(await foto('#playCanvas')) > 100, gevuld(await foto('#playCanvas')));
  await p.click('#stopPlay');
  check('kruisje sluit de 3D-weergave', await tot(p, () => !playOverlay.classList.contains('show') && !objViewers.has('fullscreen'), 2000));
  await wacht(800);

  console.log('5. Slepen draait het model');
  await open(); await tab('3d');
  await zet('#o3Rot', 0);
  check('draaisnelheid 0 bewaard', await p.evaluate(() => config.object3d.rotSpeed) === 0);
  await dicht();
  r = await knopMidden('m0');
  await p.mouse.click(r.x, r.y);
  await tot(p, () => objViewers.has('fullscreen'), 5000);
  await wacht(1800);
  const a1 = await foto('#playCanvas');
  await wacht(600);
  const a2 = await foto('#playCanvas');
  check('zonder draaien en slepen staat het model stil', verschil(a1, a2) < 15, verschil(a1, a2));
  await p.mouse.move(800, 500);
  await p.mouse.down();
  for (let i = 1; i <= 10; i++) { await p.mouse.move(800 + i * 25, 500 + i * 6); await wacht(30); }
  await p.mouse.up();
  await wacht(1500);
  const a3 = await foto('#playCanvas');
  check('slepen draait het model', verschil(a2, a3) > 40, verschil(a2, a3));
  await p.mouse.wheel(0, 600);
  await wacht(1200);
  const a4 = await foto('#playCanvas');
  check('scrollen zoomt uit (model kleiner)', gevuld(a4) < gevuld(a3), { voor: gevuld(a3), na: gevuld(a4) });
  await p.click('#stopPlay');
  await wacht(800);

  console.log('6. Automatisch sluiten');
  await open(); await tab('3d');
  await p.fill('#o3Close', '4'); await p.dispatchEvent('#o3Close', 'change');
  check('sluittijd bewaard', await p.evaluate(() => config.object3d.autoCloseSec) === 4);
  await dicht();
  r = await knopMidden('m0');
  await p.mouse.click(r.x, r.y);
  await tot(p, () => objViewers.has('fullscreen'), 5000);
  let t0 = Date.now();
  await tot(p, () => !playOverlay.classList.contains('show'), 9000);
  let s = (Date.now() - t0) / 1000;
  check('sluit vanzelf na 4 s zonder aanraking', s > 3.3 && s < 5.5, s.toFixed(1));
  await wacht(1500);
  await p.mouse.click(r.x, r.y);
  await tot(p, () => objViewers.has('fullscreen'), 5000);
  t0 = Date.now();
  await wacht(2500);
  await p.mouse.move(700, 500); await p.mouse.down(); await p.mouse.move(760, 500); await p.mouse.up();
  await tot(p, () => !playOverlay.classList.contains('show'), 9000);
  s = (Date.now() - t0) / 1000;
  check('aanraking zet de klok opnieuw (sluit ~4 s na de laatste aanraking)', s > 5.8 && s < 8, s.toFixed(1));
  await wacht(1000);
  await open(); await tab('3d');
  await p.fill('#o3Close', '0'); await p.dispatchEvent('#o3Close', 'change');
  await dicht();
  await p.mouse.click(r.x, r.y);
  await tot(p, () => objViewers.has('fullscreen'), 5000);
  await wacht(5500);
  check('0 = nooit automatisch sluiten', await p.evaluate(() => playOverlay.classList.contains('show')));

  console.log('7. Instellingen voor alle modellen (tabblad 3D-objecten)');
  await open(); await tab('3d');
  await schakel('#o3LightBg', false);
  check('witte achtergrond uit → direct donker, ook tijdens de weergave', await p.evaluate(() => config.object3d.lightBg === false && !playOverlay.classList.contains('light')));
  await schakel('#o3LightBg', true);
  check('weer aan → licht decor', await p.evaluate(() => playOverlay.classList.contains('light')));
  await zet('#o3Shadow', 0.7);
  check('schaduw → doorgezet naar de weergave', await p.evaluate(() => config.object3d.shadow === 0.7 && playOverlay.style.getPropertyValue('--objShadow') === '0.7'));
  await zet('#o3Light', 1.8); await zet('#o3Shine', 0.9);
  check('licht en glans bewaard', await p.evaluate(() => config.object3d.light === 1.8 && config.object3d.shininess === 0.9));
  await p.evaluate(() => stopPlaying());
  await wacht(800);
  // Globale kleur: alleen voor een model zonder texture of materiaalkleur
  const kaalFoto = async () => {
    await p.evaluate(() => stopPlaying()); await wacht(700);
    await dicht();
    const rr = await knopMidden('m2');
    await p.mouse.click(rr.x, rr.y);
    await tot(p, () => objViewers.has('fullscreen'), 5000);
    await wacht(1500);
    const f = await foto('#playCanvas');
    let rood = 0, groen = 0;
    for (let i = 0; i < f.length; i += 4) if (f[i + 3] > 10) { rood += f[i]; groen += f[i + 1]; }
    return { rood, groen };
  };
  await open(); await tab('3d');
  await zet('#o3Color', '#ff2020');
  const kRood = await kaalFoto();
  await open(); await tab('3d');
  await zet('#o3Color', '#20ff20');
  const kGroen = await kaalFoto();
  check('globale 3D-kleur kleurt een model zonder texture', kRood.rood > kRood.groen && kGroen.groen > kGroen.rood, { kRood, kGroen });
  await p.evaluate(() => stopPlaying()); await wacht(700);
  await open(); await tab('3d');
  await p.selectOption('#o3MaxTris', '50000');
  check('detail-limiet bewaard, modellen opnieuw geladen', await p.evaluate(() => config.object3d.maxTriangles === 50000));

  console.log('8. Instellingen per model (Media → 3D-instellingen)');
  await tab('media');
  const kaart = (naam) => p.locator('#mediaList .card').filter({ has: p.locator('.nm', { hasText: new RegExp('^' + naam.replace('.', '\\.') + '$') }) });
  await kaart('bk-kubus.obj').locator('button', { hasText: '3D-instellingen' }).click();
  await tot(p, () => /driehoeken/.test(document.querySelector('#mediaList .model-settings')?.textContent || ''), 4000);
  const objInfo = await kaart('bk-kubus.obj').locator('.model-settings .note').first().textContent();
  check('OBJ-info: 12 driehoeken, met texture', /OBJ-model — 12 driehoeken · 1 onderdeel · met texture/.test(objInfo), objInfo);
  const schaal = kaart('bk-kubus.obj').locator('.model-settings label.field', { hasText: 'Schaal' }).locator('input');
  await schaal.evaluate((n) => { n.value = '2'; n.dispatchEvent(new Event('input', { bubbles: true })); });
  await kaart('bk-kubus.obj').locator('.model-settings select').first().selectOption('none');
  check('schaal en draai-as per model bewaard', await p.evaluate((i) => config.modelSettings[i]?.scale === 2 && config.modelSettings[i]?.spinAxis === 'none', id['bk-kubus.obj']));
  await kaart('bk-kubus.glb').locator('button', { hasText: '3D-instellingen' }).click();
  await tot(p, () => document.querySelectorAll('#mediaList .model-settings').length === 2 &&
    /animatie/.test(document.querySelectorAll('#mediaList .model-settings')[1].textContent), 4000);
  const glbInfo = await kaart('bk-kubus.glb').locator('.model-settings .note').first().textContent();
  check('GLB-info: 12 driehoeken, 1 animatie', /GLTF?|GLB/.test(glbInfo) && /12 driehoeken/.test(glbInfo) && /1 animatie/.test(glbInfo), glbInfo);
  check('GLB heeft de schakelaar "Animatie afspelen"', await kaart('bk-kubus.glb').locator('.t-label', { hasText: 'Animatie afspelen' }).count() === 1);
  await kaart('bk-kubus.glb').locator('.model-settings label.switch').click();
  check('animatie uit per model bewaard', await p.evaluate((i) => config.modelSettings[i]?.animate === false, id['bk-kubus.glb']));
  // Schaal 2 maakt het model in beeld groter
  await dicht();
  r = await knopMidden('m0');
  await p.mouse.click(r.x, r.y);
  await tot(p, () => objViewers.has('fullscreen'), 5000);
  await wacht(1500);
  const groot = gevuld(await foto('#playCanvas'));
  check('schaal 2 maakt het model groter dan in stap 5', groot > gevuld(a3) * 1.6, { groot, eerst: gevuld(a3) });
  await p.evaluate(() => stopPlaying()); await wacht(700);
  // GLB: animatie uit = stil, aan = beweegt (draaisnelheid staat op 0)
  r = await knopMidden('m1');
  await p.mouse.click(r.x, r.y);
  await tot(p, () => objViewers.has('fullscreen'), 5000);
  await wacht(1800);
  const g1 = await foto('#playCanvas'); await wacht(500); const g2 = await foto('#playCanvas');
  check('GLB met animatie uit staat stil', verschil(g1, g2) < 15, verschil(g1, g2));
  await p.evaluate((i) => { config.modelSettings[i].animate = true; save(); }, id['bk-kubus.glb']);
  await wacht(300);
  const g3 = await foto('#playCanvas'); await wacht(500); const g4 = await foto('#playCanvas');
  check('GLB met animatie aan beweegt', verschil(g3, g4) > 20, verschil(g3, g4));
  await p.evaluate(() => stopPlaying()); await wacht(700);
  // Standaardwaarden herstellen in de GLB-kaart terwijl beide kaarten open staan
  await open(); await tab('media');
  if (await p.locator('#mediaList .model-settings').count() < 2) {
    if (await kaart('bk-kubus.obj').locator('.model-settings').count() === 0) await kaart('bk-kubus.obj').locator('button', { hasText: '3D-instellingen' }).click();
    if (await kaart('bk-kubus.glb').locator('.model-settings').count() === 0) await kaart('bk-kubus.glb').locator('button', { hasText: '3D-instellingen' }).click();
    await tot(p, () => [...document.querySelectorAll('#mediaList .model-settings')].every((n) => /driehoeken/.test(n.textContent)) &&
      document.querySelectorAll('#mediaList .model-settings').length === 2, 4000);
  }
  await kaart('bk-kubus.glb').locator('.model-settings button', { hasText: 'Standaardwaarden herstellen' }).click();
  await wacht(800);
  check('herstellen zet de GLB terug op de standaard', await p.evaluate((i) => config.modelSettings[i].animate === true && config.modelSettings[i].scale === 1, id['bk-kubus.glb']));
  const naHerstel = await p.evaluate(() => [...document.querySelectorAll('#mediaList .card')].map((c) => ({
    naam: c.querySelector('.nm')?.textContent, info: c.querySelector('.model-settings .note')?.textContent || null })).filter((x) => x.info));
  check('herstellen in de GLB-kaart laat de OBJ-kaart met rust', naHerstel.find((x) => x.naam === 'bk-kubus.obj')?.info?.startsWith('OBJ') &&
    naHerstel.find((x) => x.naam === 'bk-kubus.glb')?.info?.includes('animatie'), naHerstel);

  console.log('9. Kapot model');
  await p.evaluate(async () => {
    const f = new File(['dit is geen obj'], 'bk-kapot.obj'); await addMediaFile(f);
  });
  const kapot = await p.evaluate(() => [...mediaCache.values()].find((m) => m.name === 'bk-kapot.obj').id);
  await p.evaluate((i) => { curButtons().push({ id: 'mk', label: 'Kapot', mediaId: i, x: 50, y: 85, size: 8, color: '#2f7ff0',
    shape: 'rounded', depth: 'off', drift: 0, showPreview: true, fx: 'none', z: 9 }); save(); renderStage(); }, kapot);
  await dicht();
  check('kapot model: nette melding in de knop', await tot(p, () => /niet leesbaar/.test(document.querySelector('.vbtn[data-id="mk"] .pv-label')?.textContent || ''), 4000));
  await wacht(1500);
  r = await knopMidden('mk');
  await p.mouse.click(r.x, r.y);
  await wacht(2000);
  check('kapot model aantikken: geen 3D-weergave die blijft hangen', await p.evaluate(() => !playOverlay.classList.contains('show')));

  check('geen JS-fouten', errs.length === 0, errs.slice(0, 5));
  if (cerrs.length) console.log('   ℹ consolefouten:', JSON.stringify(cerrs.slice(0, 5)));
  console.log(`\n${fout ? 'FOUT' : 'OK  '}: ${ok}/${ok + fout}`);
  await b.close();
  process.exit(fout ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
