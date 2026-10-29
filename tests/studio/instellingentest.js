// Screensaver (start vanzelf na de ingestelde rust, aanraking brengt de
// knoppen terug, achtergrondmodus), AI-avatars (karakterblad, koppeling,
// verbinding testen tegen een nagebootste server), Opslaan & beheer
// (statistieken, onderhoud), Help, en tot slot alle schakelaars en
// keuzelijsten van de tabbladen één voor één omgezet zonder fouten.
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
  // Nagebootste beheerserver en proefpagina: er is geen internet.
  const verzoeken = [];
  let serverAntwoord = { status: 200, body: { url: 'https://hwh.daily.co/kamer', sessionId: 's1', keySource: 'device' } };
  await ctx.route('http://avatar.test/**', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') verzoeken.push({ url: req.url(), body: JSON.parse(req.postData() || '{}') });
    await route.fulfill({ status: serverAntwoord.status, contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(serverAntwoord.body) });
  });
  await ctx.route('https://lemonslice.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html',
    body: '<!doctype html><title>Proef</title><h1>Proefavatar</h1>' }));
  const p = await ctx.newPage();
  const errs = [], cerrs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') cerrs.push(m.text()); });
  let dialoog = 'accept';
  p.on('dialog', (d) => (dialoog === 'accept' ? d.accept() : d.dismiss()));
  await p.goto(APP);
  await p.waitForFunction(() => typeof Muziek !== 'undefined' && mediaGeladen === true);
  await p.setInputFiles('#mediaInput', [M('clip.webm'), M('1 intro.webm'), M('2 uitleg.webm'), M('bk-logo.png')]);
  await p.waitForFunction(() => mediaCache.size === 4);
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
  const knopMidden = (bid) => p.evaluate((i) => {
    const r = document.querySelector(`.vbtn[data-id="${i}"]`).getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, bid);
  await p.evaluate((id) => {
    const k = (i, label, mediaId, x, y) => ({ id: 'k' + i, label, mediaId, x, y, size: 8, color: PALETTE[i],
      shape: 'rounded', depth: 'off', drift: 0, showPreview: false, fx: 'none', z: i });
    curScene().buttons = [k(0, 'Film', id['1 intro.webm'], 35, 50), k(1, 'Uitleg', id['2 uitleg.webm'], 65, 50)];
    curScene().idleMediaId = id['2 uitleg.webm'];
    save(); renderStage();
  }, id);

  console.log('1. Screensaver: start vanzelf na de ingestelde rust');
  await open(); await tab('saver');
  await schakel('#svEnabled', true);
  await p.fill('#svDelay', '3'); await p.dispatchEvent('#svDelay', 'change');
  check('wachttijd begrensd op minimaal 10 s', await p.evaluate(() => config.screensaver.delaySec) === 10);
  await p.locator(`.sv-kies-rij[data-id="${id['clip.webm']}"]`).click();
  await p.locator(`.sv-kies-rij[data-id="${id['1 intro.webm']}"]`).click();
  check('playlist: clip, intro', await p.evaluate(() => config.screensaver.mediaIds.map((i) => mediaCache.get(i).name).join()) === 'clip.webm,1 intro.webm');
  await zet('#svTransitionSec', 0.5);
  await p.evaluate(() => { lastInteraction = Date.now() - 60000; });
  await wacht(2000);
  check('zolang het menu open is start hij niet', await p.evaluate(() => !saverActive));
  await p.evaluate(() => { lastInteraction = Date.now(); });
  await dicht();
  const t0 = Date.now() - 8000;
  await p.evaluate((t) => { lastInteraction = t; }, t0);
  await wacht(1100);
  check('na 9 s rust nog niet', await p.evaluate(() => !saverActive));
  check('na 10 s rust start de screensaver vanzelf', await tot(p, () => saverActive && $('#saver').classList.contains('show'), 4000));
  const startNa = (Date.now() - t0) / 1000;
  check('...op tijd (tussen 10 en 12 s)', startNa >= 9.5 && startNa <= 12, startNa.toFixed(1));
  check('playlist speelt schermvullend', await tot(p, () => { const v = saverRotator.activeEl; return !v.paused && v.currentTime > 0.3; }, 4000));
  check('de playlist begint met clip.webm', await p.evaluate((u) => saverRotator.activeEl.src === u, await p.evaluate((i) => mediaCache.get(i).url, id['clip.webm'])));
  check('screensaver dekt de knoppen af', await p.evaluate(() => { const r = document.querySelector('.vbtn[data-id="k0"]').getBoundingClientRect();
    return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('#saver') != null; }));
  let r = await knopMidden('k0');
  await p.mouse.click(r.x, r.y);
  check('aanraking: direct terug naar de knoppen', await p.evaluate(() => !saverActive && !$('#saver').classList.contains('show')));
  await wacht(1200);
  check('...zonder dat de aanraking ook de knop eronder indrukt', await p.evaluate(() => !playOverlay.classList.contains('show')));
  check('scène-achtergrondvideo speelt weer', await p.evaluate(() => !$('#idleVideo').paused));
  await wacht(1500);
  check('screensavervideo gestopt na het uitvaden', await p.evaluate(() => !saverRotator.running && $('#saverVideo').paused));
  // Tijdens een knopvideo start hij niet
  r = await knopMidden('k1');
  await p.mouse.click(r.x, r.y);
  await tot(p, () => playOverlay.classList.contains('show'), 4000);
  await p.evaluate(() => { playVideo.loop = true; lastInteraction = Date.now() - 30000; });
  await wacht(2200);
  check('tijdens een knopvideo start de screensaver niet', await p.evaluate(() => !saverActive));
  await p.evaluate(() => stopPlaying());
  await wacht(800);
  check('na de knopvideo telt de rust opnieuw', await p.evaluate(() => Date.now() - lastInteraction < 2000 && !saverActive));

  console.log('1b. Overgangen en geluid van de screensaver');
  await open(); await tab('saver');
  await p.locator(`.sv-kies-rij[data-id="${id['clip.webm']}"]`).click();               // clip eruit
  await p.locator(`.sv-kies-rij[data-id="${id['2 uitleg.webm']}"]`).click();           // twee korte video's
  check('playlist: intro, uitleg', await p.evaluate(() => config.screensaver.mediaIds.map((i) => mediaCache.get(i).name).join()) === '1 intro.webm,2 uitleg.webm');
  const overgangen = await p.evaluate(() => [...$('#svTransition').options].map((o) => o.value));
  const ovUit = [];
  for (const o of overgangen) {
    await p.selectOption('#svTransition', o);
    await p.evaluate(() => { lastInteraction = Date.now(); });
    await dicht();
    await p.evaluate(() => enterSaver());
    await tot(p, () => saverRotator.huidige && !saverRotator.activeEl.paused, 3000);
    const eerst = await p.evaluate(() => saverRotator.huidige.name);
    const gewisseld = await tot(p, (n) => saverRotator.huidige?.name !== n && !saverRotator.activeEl.paused && saverRotator.activeEl.currentTime > 0.1, 6000, eerst);
    await wacht(900);
    const na = await p.evaluate(() => { const a = saverRotator.activeEl, bEl = a === saverVideo ? $('#saverVideoB') : saverVideo;
      return { actief: a.classList.contains('front'), opAndere: getComputedStyle(bEl).opacity, andereSpeelt: !bEl.paused }; });
    ovUit.push({ o, eerst, gewisseld, ...na });
    await p.mouse.click(800, 950);
    await wacht(1000);
    await open(); await tab('saver');
  }
  check(`alle ${overgangen.length} overgangen wisselen naar de volgende video en ruimen de vorige op`,
    ovUit.every((x) => x.gewisseld && x.actief && !x.andereSpeelt), ovUit);
  await schakel('#svSound', true);
  await zet('#svVolume', 50); await p.evaluate(() => $('#svVolume').dispatchEvent(new Event('change', { bubbles: true })));
  await p.evaluate(() => { lastInteraction = Date.now(); });
  await dicht();
  await p.evaluate(() => enterSaver());
  await tot(p, () => !saverRotator.activeEl.paused, 3000);
  const geluid = await p.evaluate(() => ({ muted: saverRotator.activeEl.muted, vol: saverRotator.activeEl.volume, master: config.masterVolume }));
  check('geluid bij de screensaver: 50% × hoofdvolume', !geluid.muted && Math.abs(geluid.vol - 0.5 * geluid.master / 100) < 0.02, geluid);
  await p.mouse.click(800, 950);
  check('aanraking: screensavergeluid meteen stil', await p.evaluate(() => saverVideo.muted && $('#saverVideoB').muted));
  await wacht(1000);
  await open(); await tab('saver');
  await schakel('#svSound', false);
  await p.locator(`.sv-kies-rij[data-id="${id['2 uitleg.webm']}"]`).click();
  await p.locator(`.sv-kies-rij[data-id="${id['clip.webm']}"]`).click();
  await p.evaluate(() => { config.screensaver.mediaIds = [...config.screensaver.mediaIds].sort((a, b) => mediaCache.get(a).name === 'clip.webm' ? -1 : 1); save(); renderSaver(); });
  await p.evaluate(() => { lastInteraction = Date.now(); });
  await dicht();

  console.log('2. Achtergrondmodus');
  await open(); await tab('saver');
  await schakel('#svBackground', true);
  await dicht();
  const bg = () => p.evaluate(() => { const v = bgRotator.activeEl; return { running: bgRotator.running, rot: $('#idleVideo').classList.contains('rot'),
    naam: bgRotator.huidige?.name, t: v.currentTime, paused: v.paused, zicht: getComputedStyle(v).opacity }; });
  check('playlist draait achter de knoppen', await tot(p, async () => bgRotator.running && !bgRotator.activeEl.paused && bgRotator.activeEl.currentTime > 0.2, 4000), await bg());
  const bg1 = await bg();
  check('de playlist vervangt de achtergrondvideo van de scène', bg1.rot && bg1.naam !== '2 uitleg.webm' && bg1.zicht === '1', bg1);
  check('knoppen blijven bruikbaar boven de playlist', await p.evaluate(() => { const r = document.querySelector('.vbtn[data-id="k0"]').getBoundingClientRect();
    return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('.vbtn')?.dataset.id === 'k0'; }));
  const eerste = bg1.naam;
  check('na de eerste video volgt de volgende', await tot(p, (n) => bgRotator.huidige?.name !== n && !bgRotator.activeEl.paused, 9000, eerste),
    await p.evaluate(() => bgRotator.huidige?.name));
  await p.evaluate(() => { lastInteraction = Date.now() - 20000; });
  check('screensaver start ook in achtergrondmodus', await tot(p, () => saverActive, 3000));
  check('achtergrond pauzeert onder de schermvullende screensaver', await p.evaluate(() => $('#idleVideo').paused && $('#idleVideoB').paused));
  await p.mouse.click(800, 900);
  check('aanraking: achtergrondplaylist speelt verder', await tot(p, () => !saverActive && !bgRotator.activeEl.paused, 2000));
  await open(); await tab('saver');
  await schakel('#svBackground', false);
  await dicht();
  check('achtergrondmodus uit: weer de eigen achtergrondvideo van de scène', await tot(p, (u) => !bgRotator.running && $('#idleVideo').src === u && !$('#idleVideo').paused &&
    !$('#idleVideo').classList.contains('rot'), 3000, await p.evaluate((i) => mediaCache.get(i).url, id['2 uitleg.webm'])),
    await p.evaluate(() => ({ running: bgRotator.running, cls: $('#idleVideo').className, paused: $('#idleVideo').paused })));
  await p.click('#panel button[data-tab="saver"]').catch(() => {});

  console.log('3. AI-avatars: karakterblad');
  await open(); await tab('avatar');
  check('lege lijst met uitleg', /Nog geen avatars/.test(await p.textContent('#avList')));
  await p.click('#avAdd');
  check('"+ Avatar toevoegen" opent het karakterblad', await p.evaluate(() => $('#avEditor').classList.contains('open') && config.avatars.length === 1));
  const veld = (label) => p.locator('#avEditorBody label.field', { hasText: label }).locator('input, textarea, select').first();
  await veld('Naam').fill('Sanne');
  await veld('Avatar-ID').fill('agent_123');
  await veld('Begroeting').fill('Hallo, welkom!');
  await veld('Wie is hij').fill('Je bent Sanne, de gastvrouw van de stand.');
  await p.locator('#avEditorBody .chip', { hasText: 'jong en fris' }).click();
  await p.locator('#avEditorBody .chip', { hasText: /^warm$/ }).click();
  await p.locator('#avEditorBody .chip', { hasText: /^speels$/ }).click();
  await veld('Taal').selectOption('en');
  await veld('Aanspreekvorm').selectOption('u');
  const av = () => p.evaluate(() => config.avatars[0]);
  let a = await av();
  check('velden worden meteen bewaard', a.name === 'Sanne' && a.providerAvatarId === 'agent_123' && a.greeting === 'Hallo, welkom!' &&
    a.role.startsWith('Je bent Sanne') && a.age === 'jong' && a.emotions.join() === 'warm,speels' && a.language === 'en' && a.address === 'u', a);
  check('titel van het blad volgt de naam', (await p.textContent('#avEdTitle')) === 'Sanne');
  await p.click('#avEditorTabs button[data-avtab="kennis"]');
  await veld('Wat hij weet').fill('Wij maken hologrammen. Open van 9 tot 17 uur.');
  await p.click('#avEditorBody button:has-text("+ Vraag toevoegen")');
  await p.locator('#avEditorBody .faqrow input').fill('Wat kost het?');
  await p.locator('#avEditorBody .faqrow textarea').fill('Vraag het aan de balie.');
  await veld('Als hij het antwoord niet weet').fill('Dat weet ik niet.');
  await p.click('#avEditorTabs button[data-avtab="prompt"]');
  const prompt = await p.textContent('#avPrompt');
  check('"Wat de avatar meekrijgt" bevat het hele blad', /Je bent Sanne/.test(prompt) && /warm, speels/.test(prompt) && /Spreek Engels/.test(prompt) &&
    /met u/.test(prompt) && /hologrammen/.test(prompt) && /Vraag: Wat kost het\?/.test(prompt) && /Hallo, welkom!/.test(prompt) && /Dat weet ik niet/.test(prompt), prompt);
  await p.click('#avEdDone');
  check('"Klaar" sluit het blad; de lijst toont wat er is ingevuld', await p.evaluate(() => !$('#avEditor').classList.contains('open')) &&
    /Ingevuld: rol · karakter · kennis · 1 vraag/.test(await p.textContent('#avList')), await p.textContent('#avList'));

  console.log('4. AI-avatars: koppeling');
  await schakel('#avEnabled', true);
  check('koppeling aan: uitleg zegt dat er geen serveradres is', /nog geen serveradres/.test(await p.textContent('#avLinkNote')), await p.textContent('#avLinkNote'));
  await p.fill('#avAutoClose', '5'); await p.dispatchEvent('#avAutoClose', 'change');
  check('sessie sluiten begrensd op minimaal 15 s', await p.evaluate(() => config.avatarLink.autoCloseSec) === 15);
  await schakel('#avMic', false);
  check('microfoon uit bewaard', await p.evaluate(() => config.avatarLink.mic === false));
  await p.click('#avTest');
  check('verbinding testen zonder server: duidelijke melding', await tot(p, () => /Mislukt: geen serveradres/.test($('#avTestOut').textContent), 3000), await p.textContent('#avTestOut'));
  await tab('share');
  await p.fill('#rmUrl', 'http://avatar.test/'); await p.dispatchEvent('#rmUrl', 'change');
  await p.fill('#rmKey', 'hwh_test'); await p.dispatchEvent('#rmKey', 'change');
  await tab('avatar');
  check('uitleg noemt nu de server', /avatar\.test/.test(await p.textContent('#avLinkNote')));
  await p.click('#avTest');
  check('verbinding testen tegen de (nagebootste) server werkt', await tot(p, () => /^Werkt: .*hwh\.daily\.co\/kamer.*daily.*sessie s1.*eigen sleutel/.test($('#avTestOut').textContent), 4000),
    await p.textContent('#avTestOut'));
  const vz = verzoeken[verzoeken.length - 1];
  check('het verzoek gaat naar /api/v1/avatar/session met key, probe en het karakter', vz && vz.url === 'http://avatar.test/api/v1/avatar/session' &&
    vz.body.key === 'hwh_test' && vz.body.probe === true && vz.body.avatar?.providerAvatarId === 'agent_123' && /Je bent Sanne/.test(vz.body.avatar?.persona || ''),
    vz && { url: vz.url, key: vz.body.key, probe: vz.body.probe, avatar: vz.body.avatar?.providerAvatarId });
  serverAntwoord = { status: 500, body: { error: 'sleutel ongeldig' } };
  await p.click('#avTest');
  check('foutmelding van de server komt in beeld', await tot(p, () => /Mislukt: sleutel ongeldig/.test($('#avTestOut').textContent), 4000), await p.textContent('#avTestOut'));
  // Een knop opent de avatar
  await p.evaluate(() => { curButtons()[1].action = { type: 'OpenAvatar', avatarId: config.avatars[0].id }; save(); renderStage(); });
  await dicht();
  r = await knopMidden('k1');
  await p.mouse.click(r.x, r.y);
  check('knop opent de avatar; serverfout netjes in beeld', await tot(p, () => !$('#avatarOverlay').classList.contains('hidden') &&
    /Kan geen sessie starten/.test($('#avatarStatusText').textContent) && /sleutel ongeldig/.test($('#avatarHelp').textContent), 4000),
    await p.evaluate(() => $('#avatarStatusText').textContent + ' | ' + $('#avatarHelp').textContent));
  check('naam van de avatar in beeld', (await p.textContent('#avatarName')) === 'Sanne');
  // Rust tijdens een avatargesprek
  await p.evaluate(() => { lastInteraction = Date.now() - 30000; });
  await wacht(2200);
  const tijdensAvatar = await p.evaluate(() => saverActive);
  check('tijdens een avatargesprek start de screensaver niet', !tijdensAvatar);
  if (tijdensAvatar) await p.mouse.click(800, 500);
  await p.click('#avatarClose');
  check('sluiten: overlay weg', await p.evaluate(() => $('#avatarOverlay').classList.contains('hidden')));
  await open(); await tab('avatar');
  await schakel('#avEnabled', false);
  await dicht();
  r = await knopMidden('k1');
  await p.mouse.click(r.x, r.y);
  check('koppeling uit: melding "De avatarkoppeling staat uit"', await tot(p, () => /koppeling staat uit/.test($('#avatarStatusText').textContent) &&
    !$('#avatarOverlay').classList.contains('hidden'), 4000));
  await p.click('#avatarClose');
  // Proefavatar opent de proefpagina
  await open(); await tab('avatar');
  await p.click('#avAddTry');
  check('proefavatar: blad open met proefmodus aan', await p.evaluate(() => $('#avEditor').classList.contains('open') &&
    config.avatars[1].tryMode === true && /lemonslice\.com\/try\//.test(config.avatars[1].tryUrl)) &&
    await p.locator('#avEditorBody input[type=checkbox]').first().isChecked());
  await p.click('#avEdClose');
  check('lijst: proefmodus met adres', /Proefmodus — opent https:\/\/lemonslice\.com\/try\//.test(await p.textContent('#avList')));
  await p.evaluate(() => { curButtons()[1].action.avatarId = config.avatars[1].id; save(); });
  await dicht();
  r = await knopMidden('k1');
  await p.mouse.click(r.x, r.y);
  check('proefavatar opent de proefpagina in de presentatie', await tot(p, () => !$('#webOverlay').classList.contains('hidden') &&
    /lemonslice\.com\/try\//.test($('#webFrame')?.src || ''), 4000));
  await p.evaluate(() => { config.screensaver.enabled = true; save(); lastInteraction = Date.now() - 30000; });
  await wacht(2200);
  const tijdensWeb = await p.evaluate(() => saverActive);
  check('terwijl een webpagina open staat start de screensaver niet', !tijdensWeb);
  await p.click('#webClose');
  await p.evaluate(() => { if (saverActive) exitSaver(); config.screensaver.enabled = false; save(); });
  // Avatar verwijderen: de knop verliest zijn actie
  await open(); await tab('avatar');
  await p.locator('#avList .card', { hasText: 'Proefavatar' }).locator('button.danger').click();
  check('avatar verwijderen haalt hem ook van de knop', await p.evaluate(() => config.avatars.length === 1 && !curButtons()[1].action));
  await p.reload();
  await p.waitForFunction(() => typeof Muziek !== 'undefined' && mediaGeladen === true);
  check('karakterblad bewaard na herstart', await p.evaluate(() => config.avatars[0]?.name === 'Sanne' && config.avatars[0].faq[0]?.q === 'Wat kost het?'));
  await p.evaluate(() => { config.screensaver.enabled = false; save(); });

  console.log('5. Opslaan & beheer: statistieken');
  await open(); await tab('share');
  check('statistieken standaard uit', !(await p.isChecked('#statsEnabled')));
  await schakel('#statsEnabled', true);
  check('aan: bewaard', await p.evaluate(() => JSON.parse(localStorage.getItem(LS_KEY)).analytics.enabled === true));
  await p.click('#statsReset');
  await dicht();
  for (let i = 0; i < 2; i++) {
    r = await knopMidden('k0');
    await p.mouse.click(r.x, r.y);
    await tot(p, () => playOverlay.classList.contains('show'), 4000);
    await p.evaluate(() => stopPlaying());
    await wacht(2600);
  }
  const st = await p.evaluate(() => JSON.parse(localStorage.getItem(STATS_KEY)));
  check('twee keer "Film" geteld, met starts en een plek op de heatmap', st.presses.Film === 2 && st.playStarts >= 2 && st.heatmap.length === 2 &&
    st.heatmap[0].x === 35 && st.heatmap[0].y === 50, { presses: st.presses, starts: st.playStarts, heatmap: st.heatmap });
  await open(); await tab('share');
  const sv = await p.textContent('#statsView');
  check('overzicht: meest gekozen, gestart, interacties per uur en heatmap', /Meest gekozen: Film \(2×\)/.test(sv) && /Gestart: 2/.test(sv) &&
    /Interacties per uur/.test(sv) && /Heatmap — 2 interacties/.test(sv), sv);
  await p.click('#statsReset');
  check('wissen: leeg overzicht', /Nog geen knopinteracties/.test(await p.textContent('#statsView')) &&
    await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem(STATS_KEY)).presses).length === 0));
  await schakel('#statsEnabled', false);
  await dicht();
  r = await knopMidden('k0');
  await p.mouse.click(r.x, r.y);
  await tot(p, () => playOverlay.classList.contains('show'), 4000);
  await p.evaluate(() => stopPlaying()); await wacht(800);
  check('uit: niets geteld', await p.evaluate(() => !stats.presses.Film));

  console.log('6. Opslaan & beheer: onderhoud');
  await open(); await tab('share');
  check('status van het onderhoud in beeld', /Draait nu .* onderhoudsronden/.test(await p.textContent('#mtStatus')), await p.textContent('#mtStatus'));
  await schakel('#mtEnabled', false);
  check('zelfonderhoud uit bewaard', await p.evaluate(() => config.maintenance.enabled === false));
  await schakel('#mtEnabled', true);
  await p.fill('#mtMemory', '100'); await p.dispatchEvent('#mtMemory', 'change');
  check('geheugengrens begrensd op minimaal 300 MB', await p.evaluate(() => config.maintenance.memoryLimitMb) === 300);
  await schakel('#mtNightly', false);
  check('nachtelijke verversing uit bewaard', await p.evaluate(() => config.maintenance.nightlyRestart === false));
  await schakel('#mtNightly', true);
  await p.fill('#mtHour', '23'); await p.dispatchEvent('#mtHour', 'change');
  check('tijdstip 23 uur bewaard', await p.evaluate(() => config.maintenance.restartHour) === 23);
  await p.fill('#mtHour', '0'); await p.dispatchEvent('#mtHour', 'change');
  check('tijdstip 0 uur (middernacht) bewaard', await p.evaluate(() => config.maintenance.restartHour) === 0,
    { veld: await p.inputValue('#mtHour'), config: await p.evaluate(() => config.maintenance.restartHour) });
  await p.fill('#mtWatchdog', '5'); await p.dispatchEvent('#mtWatchdog', 'change');
  check('watchdog begrensd op minimaal 10 s', await p.evaluate(() => config.maintenance.watchdogSec) === 10);
  const rondes = await p.evaluate(() => health.sweeps);
  await p.click('#mtSweep');
  check('"Nu opruimen": ronde geteld en melding', await p.evaluate((n) => health.sweeps === n + 1, rondes) &&
    await tot(p, () => /Opgeruimd/.test($('#toast').textContent), 1500));
  dialoog = 'dismiss';
  await p.click('#mtRestart');
  await wacht(800);
  check('"Nu herstarten" annuleren: geen herstart', await p.evaluate(() => typeof mediaGeladen !== 'undefined' && health.reloads === 0));
  dialoog = 'accept';
  await p.reload();
  await p.waitForFunction(() => typeof Muziek !== 'undefined' && mediaGeladen === true);
  check('onderhoudsinstellingen bewaard na herstart', await p.evaluate(() => config.maintenance.memoryLimitMb === 300 && config.maintenance.watchdogSec === 10));

  console.log('7. Help');
  await open(); await tab('help');
  const help = await p.evaluate(() => { const pg = $('#page-help'); return { zicht: !pg.classList.contains('hidden'), tekst: pg.textContent,
    koppen: [...pg.querySelectorAll('.sec-ttl, h2')].map((h) => h.textContent) }; });
  check('help-tabblad toont de onderdelen', help.zicht && /Snel aan de slag/.test(help.tekst) && /Offline op een andere pc/.test(help.tekst) && /Soepel 4K/.test(help.tekst), help.koppen);
  // "Snel aan de slag" verwijst naar het slot linksonder en de knop volledig scherm.
  await dicht();
  const fabs = await p.evaluate(() => ['lockFab', 'fsFab'].map((i) => getComputedStyle(document.getElementById(i)).display));
  check('wat de help noemt (slot linksonder, volledig scherm) staat ook op het scherm', !/slot<\/b> linksonder|slot linksonder/.test(help.tekst) || fabs.every((d) => d !== 'none'),
    { help: (help.tekst.match(/3\. Klik op het slot[^.]*\./) || [''])[0], fabs });
  await open(); await tab('help');

  console.log('8. Alle schakelaars en keuzelijsten omzetten');
  const fouten0 = errs.length;
  const tabs = ['look', 'style', 'fx', '3d', 'cam', 'avatar', 'saver', 'share', 'media', 'dashboard', 'help'];
  const gedaan = { schakelaars: 0, keuzes: 0 };
  const overgeslagen = new Set(['rmEnabled']);   // koppeling naar het beheerplatform valt buiten deze test
  for (const t of tabs) {
    await tab(t);
    const schakelaars = await p.$$eval(`#page-${t} input[type=checkbox][id]`, (xs) => xs.map((x) => x.id));
    for (const s of schakelaars) {
      if (overgeslagen.has(s) || !(await p.locator('#' + s).locator('xpath=..').isVisible())) continue;
      const was = await p.isChecked('#' + s);
      await p.locator('#' + s).locator('xpath=..').click(); await wacht(60);
      if ((await p.isChecked('#' + s)) === was) console.log(`   ℹ schakelaar #${s} reageert niet op aantikken`);
      await p.locator('#' + s).locator('xpath=..').click(); await wacht(60);
      gedaan.schakelaars++;
    }
    const keuzes = await p.$$eval(`#page-${t} select[id]`, (xs) => xs.map((x) => x.id));
    for (const s of keuzes) {
      if (!(await p.locator('#' + s).isVisible())) continue;
      const opties = await p.$$eval(`#${s} option`, (os) => os.map((o) => o.value));
      const was = await p.inputValue('#' + s);
      for (const o of opties) { await p.selectOption('#' + s, o); await wacht(40); }
      if (s !== 'thPreset' && s !== 'edLayout') await p.selectOption('#' + s, was).catch(() => {});
      gedaan.keuzes++;
    }
  }
  await wacht(500);
  check(`${gedaan.schakelaars} schakelaars en ${gedaan.keuzes} keuzelijsten omgezet zonder JS-fouten`, errs.length === fouten0, errs.slice(fouten0, fouten0 + 4));
  await p.evaluate(() => { stopCamera(); config.camera.enabled = false; save(); });

  check('geen JS-fouten', errs.length === 0, errs.slice(0, 5));
  if (cerrs.length) console.log('   ℹ consolefouten:', JSON.stringify([...new Set(cerrs)].slice(0, 6)));
  console.log(`\n${fout ? 'FOUT' : 'OK  '}: ${ok}/${ok + fout}`);
  await b.close();
  process.exit(fout ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
