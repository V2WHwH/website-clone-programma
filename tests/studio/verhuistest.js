// Verhuizen: alles exporteren naar één .holobox-bestand (indeling én media),
// alleen de indeling als .json, en die op een andere (lege of al gevulde)
// computer terugzetten. Daarna moet alles precies zo terugkomen: scènes,
// knoppen, instellingen, de media zelf (byte voor byte) en ze moeten spelen.
// Elke "computer" is een eigen browsercontext met eigen opslag.
const { chromium } = require('playwright');
const { APP, CHROMIUM, VERSIE } = require('./hulp');
const { F, wacht, tot, PNG, OBJ, ids, knoppen, tik, menuOpen, menuDicht, tab } = require('./kernhulp');
const fs = require('fs');
const os = require('os');
const path = require('path');
let ok = 0, fout = 0;
const check = (naam, cond, info) => {
  if (cond) ok++; else fout++;
  console.log(`   ${cond ? '✓' : '✗'} ${naam} ${info !== undefined ? JSON.stringify(info) : ''}`);
};
const MAP = fs.mkdtempSync(path.join(os.tmpdir(), 'hwh-verhuis-'));
const MEDIA = () => [F('clip.webm'), F('1 intro.webm'), F('kort.mp3'), PNG, OBJ];

async function computer(b) {
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'nl-NL', acceptDownloads: true });
  const p = await ctx.newPage();
  p.errs = []; p.consoleErrs = [];
  p.on('pageerror', (e) => p.errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') p.consoleErrs.push(m.text()); });
  p.on('dialog', (d) => d.accept());
  await p.goto(APP);
  await klaar(p);
  return p;
}
async function klaar(p, ms = 20000) { // wacht tot de app (opnieuw) gestart is, ook na een herlaadbeurt
  const eind = Date.now() + ms;
  while (Date.now() < eind) {
    try { if (await p.evaluate(() => typeof mediaGeladen !== 'undefined' && mediaGeladen && !window.__oud)) return true; } catch {}
    await wacht(150);
  }
  return false;
}
// Alles wat het project is, zonder de koppeling met het platform (die hoort bij de computer).
const ontwerp = (p) => p.evaluate(() => { const c = JSON.parse(JSON.stringify(config)); delete c.remote; return c; });
// Elk mediabestand: naam, grootte, soort en een vingerafdruk van de inhoud.
const mediaAfdruk = (p) => p.evaluate(async () => {
  const uit = {};
  for (const r of await dbAll()) {
    const h = new Uint8Array(await crypto.subtle.digest('SHA-256', await r.blob.arrayBuffer()));
    uit[r.id] = { name: r.name, size: r.size, hidden: !!r.hidden, sha: [...h.slice(0, 8)].map((x) => x.toString(16).padStart(2, '0')).join('') };
  }
  return uit;
});
const zelfde = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function verschil(a, b, pad = '') { // eerste plek waar twee objecten verschillen
  if (zelfde(a, b)) return null;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return { pad, a, b };
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const v = verschil(a[k], b[k], pad + '.' + k);
    if (v) return v;
  }
  return { pad, a: '(volgorde)', b: '(volgorde)' };
}
async function download(p, knop) {
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click(knop)]);
  const doel = path.join(MAP, dl.suggestedFilename());
  await dl.saveAs(doel);
  return { naam: dl.suggestedFilename(), pad: doel };
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROMIUM, args: ['--autoplay-policy=no-user-gesture-required'] });

  console.log('1. Project opbouwen op computer A');
  const A = await computer(b);
  await A.setInputFiles('#mediaInput', MEDIA());
  await A.waitForFunction(() => mediaCache.size === 5);
  const idA = await ids(A);
  await A.evaluate((id) => {
    const home = curScene();
    home.title = 'Welkom'; home.titles = { en: 'Welcome' }; home.idleMediaId = id['1 intro.webm'];
    const tweede = { id: 'scn_twee', name: 'Producten', title: 'Producten', idleMediaId: null, idleSound: false, idleVolume: 60, buttons: [] };
    config.scenes.push(tweede);
    home.buttons.push(
      { id: 'k_film', label: 'Film', labels: { en: 'Movie' }, mediaId: id['clip.webm'], mediaIds: [id['clip.webm'], id['1 intro.webm']],
        x: 30, y: 40, size: 9, color: '#2f7ff0', shape: 'rounded', depth: 'subtle', drift: 0, showPreview: true, fx: 'glow', z: 0, imageId: id['knop.png'] },
      { id: 'k_naar', label: 'Producten', action: { type: 'OpenScene', sceneId: 'scn_twee' }, mediaId: null,
        x: 70, y: 40, size: 8, color: '#ef5da8', shape: 'pill', depth: 'off', drift: 3, showPreview: false, fx: 'none', z: 1 },
      { id: 'k_web', label: 'Website', action: { type: 'OpenURL', url: 'https://voorbeeld.test/' }, mediaId: null,
        x: 30, y: 75, size: 8, color: '#22c55e', shape: 'rounded', showPreview: false, z: 2 },
      { id: 'k_en', label: 'English', action: { type: 'SetLanguage', langCode: 'en' }, mediaId: null,
        x: 70, y: 75, size: 7, color: '#eab308', shape: 'circle', showPreview: false, z: 3, schedule: { enabled: false } });
    tweede.buttons.push({ id: 'k_3d', label: 'Kubus', mediaId: id['kubus.obj'], x: 50, y: 50, size: 10, color: '#8b5cf6', shape: 'rounded', showPreview: true, z: 0 },
      { id: 'k_terug', label: 'Terug', action: { type: 'Back' }, mediaId: null, x: 50, y: 85, size: 6, color: '#0f172a', shape: 'pill', showPreview: false, z: 1 });
    home.groups = [{ id: 'g1', name: 'Bovenste rij' }];
    home.buttons[0].groupId = 'g1'; home.buttons[1].groupId = 'g1';
    config.mediaSettings[id['clip.webm']] = { trimStart: 1, trimEnd: 5, volume: 0.6, fadeSec: 0.5, loop: false, holdLastFrame: false };
    config.modelSettings[id['kubus.obj']] = { scale: 1.4 };
    Object.assign(config.theme, { font: 'serif', weight: 600, logoMediaId: id['knop.png'], logoSize: 15, logoPos: 'top-right' });
    Object.assign(config.frameStyle, { mode: 'gradient', color1: '#123456', radius: 20 });
    Object.assign(config.lang, { enabled: true, available: ['nl', 'en', 'de'], current: 'nl', autoDetect: false });
    Object.assign(config.nav, { breadcrumb: true, swipeBack: true });
    Object.assign(config.screensaver, { enabled: true, delaySec: 90, mediaIds: [id['1 intro.webm'], id['clip.webm']], transition: 'fade' });
    Object.assign(config.screensaver.muziek, { aan: true, bron: 'bestand', mediaId: id['kort.mp3'], modus: 'once' });
    Object.assign(config.reeks, { items: [id['1 intro.webm']], wachtId: null });
    config.motion.preset = 'luxury';
    config.masterVolume = 70;
    config.hideButtonsDuringPlay = false;
    config.projectName = 'Beursstand Één 2026';
    config.remote = { ...config.remote, url: 'https://beheer.voorbeeld.test', key: 'BOX-A-SLEUTEL', enabled: false };
    save(); renderStage();
  }, idA);
  // previews laten maken, zodat die ook meeverhuizen
  await A.evaluate(() => Promise.all([...mediaCache.values()].filter((m) => m.kind === 'video').map((m) => ensurePreviewRendition(m.id))));
  await tot(A, () => renditionBusy.size === 0, 30000);
  // Opnieuw starten: zo staat het ontwerp er zoals de app het zelf inleest.
  await A.reload();
  await klaar(A);
  const ontwerpA = await ontwerp(A);
  const afdrukA = await mediaAfdruk(A);
  check('A heeft 5 media en previews', Object.values(afdrukA).filter((m) => !m.hidden).length === 5 &&
    Object.values(afdrukA).filter((m) => m.hidden).length === 2, Object.values(afdrukA).map((m) => m.name));

  console.log('2. Exporteren');
  await menuOpen(A);
  await tab(A, 'share');
  check('vooraf gezegd hoe groot het wordt', /5 mediabestanden/.test(await A.textContent('#bundelInfo')), await A.textContent('#bundelInfo'));
  const hb = await download(A, '#bundelExport');
  const vandaag = new Date().toISOString().slice(0, 10);
  check('bestandsnaam holobox-<project>-<datum>.holobox', hb.naam === `holobox-beursstand-een-2026-${vandaag}.holobox`, hb.naam);
  const ruw = fs.readFileSync(hb.pad);
  const lengte = ruw.readUInt32LE(8);
  const inhoud = JSON.parse(ruw.slice(16, 16 + lengte).toString('utf8'));
  check('kop HOLOBOX1 met inhoudsopgave', ruw.slice(0, 8).toString() === 'HOLOBOX1' && inhoud.format === 'holobox' && inhoud.app === VERSIE);
  check('alle media erin, met previews', inhoud.media.filter((m) => !m.hidden).length === 5 && inhoud.media.filter((m) => m.hidden).length === 2);
  check('bestandsgrootte = kop + inhoud + media', ruw.length === 16 + lengte + inhoud.media.reduce((s, m) => s + m.size, 0));
  await A.click('summary:text-is("Alleen de indeling, zonder media")');
  const js = await download(A, '#exportBtn');
  const json = JSON.parse(fs.readFileSync(js.pad, 'utf8'));
  check('indeling als .json met de lijst van media', js.naam.endsWith('.json') && Array.isArray(json.scenes) && json.mediaFiles?.length === 5);
  check('.json bevat geen apparaatsleutel van deze box', !JSON.stringify(json).includes('BOX-A-SLEUTEL'),
    { 'remote.key': json.remote?.key });

  console.log('3. Alles terugzetten op computer B (had al iets anders)');
  const B = await computer(b);
  await B.setInputFiles('#mediaInput', [F('wacht.webm')]);
  await B.waitForFunction(() => mediaCache.size === 1);
  await B.evaluate(() => {
    curButtons().push({ id: 'k_oud', label: 'Oud', mediaId: [...mediaCache.keys()][0], x: 50, y: 50, size: 8, color: '#35d0ba', z: 0 });
    config.remote = { ...config.remote, key: 'BOX-B-SLEUTEL', url: '', enabled: false };
    save(); renderStage();
  });
  await menuOpen(B);
  await tab(B, 'share');
  await B.setInputFiles('#importInput', hb.pad);
  check('eerst een vraag met wat erin zit', await tot(B, () => !$('#verhuisModal').classList.contains('hidden'), 5000));
  const vraag = await B.textContent('#vhTekst');
  check('vraag noemt project, 2 scènes, 6 knoppen, 5 mediabestanden en wat er vervangen wordt',
    /Beursstand Één 2026/.test(vraag) && /2 scènes/.test(vraag) && /6 knoppen/.test(vraag) && /5 mediabestanden/.test(vraag) && /vervangt/.test(vraag) && /1 knop\)/.test(vraag), vraag);
  await B.evaluate(() => { window.__oud = 1; });
  await B.click('#vhJa');
  check('na terugzetten start de app opnieuw', await klaar(B, 30000));
  const ontwerpB = await ontwerp(B);
  check('ontwerp precies gelijk (scènes, knoppen, instellingen)', zelfde(ontwerpA, ontwerpB), verschil(ontwerpA, ontwerpB));
  const remoteB = await B.evaluate(() => config.remote);
  check('serveradres mee, eigen apparaatsleutel van B blijft', remoteB.url === 'https://beheer.voorbeeld.test' && remoteB.key === 'BOX-B-SLEUTEL', remoteB);
  const afdrukB = await mediaAfdruk(B);
  check('media byte voor byte gelijk, met dezelfde id\'s', zelfde(afdrukA, afdrukB), { A: Object.keys(afdrukA).length, B: Object.keys(afdrukB).length });
  check('oude media van B opgeruimd', !Object.values(afdrukB).some((m) => m.name === 'wacht.webm'));
  check('media weer bruikbaar (soort en preview)', await B.evaluate(() => [...mediaCache.values()].every((m) => m.url) &&
    [...mediaCache.values()].filter((m) => m.kind === 'video').every((m) => m.previewUrl)));
  check('PNG-knop en logo in beeld', await B.locator('#buttonLayer .vbtn.png-face[data-id="k_film"] img').count() === 1 &&
    await B.evaluate(() => !$('#stageLogo').classList.contains('hidden') && !!$('#stageLogo').src));
  check('achtergrondvideo loopt', await tot(B, () => !$('#idleVideo').classList.contains('hidden') && !$('#idleVideo').paused, 5000));
  await B.evaluate(() => { config.screensaver.enabled = false; }); // niet in de screensaver vallen tijdens de test
  await tik(B, 'k_film');
  check('knop speelt met de meegenomen instellingen (begint bij 1 s, volume 0,6 × 70%)', await tot(B, () =>
    playOverlay.classList.contains('show') && !playVideo.paused && playVideo.currentTime >= 0.95 && Math.abs(playVideo.volume - 0.42) < 0.02, 6000),
  await B.evaluate(() => ({ t: playVideo.currentTime, vol: playVideo.volume })));
  await B.evaluate(() => stopPlaying());
  await wacht(800);
  await tik(B, 'k_naar');
  check('scènenavigatie werkt na terugzetten', await tot(B, () => currentSceneId === 'scn_twee', 5000));

  console.log('4. Alleen de indeling (.json) op computer C, media daarna aanwijzen');
  const C = await computer(b);
  await C.evaluate(() => { config.remote = { ...config.remote, key: 'BOX-C-SLEUTEL', enabled: false }; save(); });
  await menuOpen(C);
  await tab(C, 'share');
  await C.setInputFiles('#importInput', js.pad);
  check('melding: ontwerp geïmporteerd', await tot(C, () => /geïmporteerd/.test($('#toast').textContent), 3000));
  const ontwerpC = await ontwerp(C);
  check('indeling gelijk aan A', zelfde(ontwerpA, ontwerpC), verschil(ontwerpA, ontwerpC));
  const remoteC = await C.evaluate(() => config.remote);
  check('eigen apparaatsleutel van C blijft (net als bij .holobox)', remoteC.key === 'BOX-C-SLEUTEL', { key: remoteC.key });
  const ontbreekt = await C.textContent('#relinkText');
  check('lijst met ontbrekende media zichtbaar', await C.locator('#relinkBox').isVisible() && /Nog 5 /.test(ontbreekt) &&
    ['clip.webm', '1 intro.webm', 'kort.mp3', 'knop.png', 'kubus.obj'].every((n) => ontbreekt.includes(n)), ontbreekt);
  await C.setInputFiles('#relinkInput', MEDIA());
  check('media aanwijzen koppelt alle 5 op naam', await tot(C, () => mediaCache.size === 5 && $('#relinkBox').classList.contains('hidden'), 5000),
    await C.textContent('#toast'));
  check('gekoppeld onder de oude id\'s', zelfde(Object.fromEntries(Object.entries(await ids(C)).sort()), Object.fromEntries(Object.entries(idA).sort())));
  await menuDicht(C);
  await C.evaluate(() => { config.screensaver.enabled = false; });
  await tik(C, 'k_film');
  check('knop speelt na koppelen, met de instellingen', await tot(C, () =>
    playOverlay.classList.contains('show') && !playVideo.paused && playVideo.currentTime >= 0.95, 6000));
  await C.evaluate(() => stopPlaying());

  console.log('5. Kapotte bestanden');
  const D = await computer(b);
  await D.setInputFiles('#mediaInput', [F('wacht.webm')]);
  await D.waitForFunction(() => mediaCache.size === 1);
  await D.evaluate(() => { curScene().title = 'Blijft staan'; save(); });
  const voorD = await ontwerp(D);
  await menuOpen(D);
  await tab(D, 'share');
  const half = path.join(MAP, 'half.holobox');
  fs.writeFileSync(half, ruw.slice(0, Math.floor(ruw.length * 0.6)));
  await D.setInputFiles('#importInput', half);
  check('afgebroken .holobox: duidelijke melding', await tot(D, () => /afgebroken/.test($('#toast').textContent), 3000), await D.textContent('#toast'));
  const rommel = path.join(MAP, 'rommel.json');
  fs.writeFileSync(rommel, 'dit is geen json');
  await D.setInputFiles('#importInput', rommel);
  check('geen geldig bestand: melding', await tot(D, () => /Ongeldig bestand/.test($('#toast').textContent), 3000));
  check('en er is niets veranderd', zelfde(voorD, await ontwerp(D)) && await D.evaluate(() => mediaCache.size === 1));

  console.log('6. Alles wissen');
  await D.click('#resetBtn');
  check('Alles wissen: leeg project en geen media', await tot(D, () => mediaCache.size === 0 && config.scenes.length === 1 && !curButtons().length && !curScene().title, 3000));
  check('ook leeg na herladen', await (async () => {
    await D.reload(); await klaar(D);
    return D.evaluate(async () => mediaCache.size === 0 && (await dbAll()).filter((r) => !r.hidden).length === 0 && !curScene().title);
  })());

  for (const [n, p] of [['A', A], ['B', B], ['C', C], ['D', D]]) {
    check(`geen JS-fouten (${n})`, p.errs.length === 0, p.errs.slice(0, 3));
    check(`geen fouten in de console (${n})`, p.consoleErrs.length === 0, p.consoleErrs.slice(0, 3));
  }
  fs.rmSync(MAP, { recursive: true, force: true });
  console.log(`\n${fout ? 'FOUT' : 'OK  '}: ${ok}/${ok + fout}`);
  await b.close();
  process.exit(fout ? 1 : 0);
})().catch((e) => { console.error(e); fs.rmSync(MAP, { recursive: true, force: true }); process.exit(2); });
