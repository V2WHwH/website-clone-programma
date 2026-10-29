// Scènes, webpagina's, taal en zoeken, zoals een beheerder ze instelt en een
// bezoeker ze gebruikt: scène toevoegen (eigen invoervenster), knop naar een
// scène, terug, kruimelpad, veeg terug, hernoemen en verwijderen; een knop
// die een webpagina toont en weer sluit; een knop die de taal omzet; het
// zoekveld in het menu. Breed scherm (1600×1000).
const { chromium } = require('playwright');
const { APP, CHROMIUM } = require('./hulp');
const { F, wacht, tot, PNG, knoppen, tik, kies, menuOpen, menuDicht, tab, insp, inspOpen, volg, volgorde } = require('./kernhulp');
let ok = 0, fout = 0;
const check = (naam, cond, info) => {
  if (cond) ok++; else fout++;
  console.log(`   ${cond ? '✓' : '✗'} ${naam} ${info !== undefined ? JSON.stringify(info) : ''}`);
};

const knopIn = (p, label) => p.evaluate((l) => curButtons().find((b) => b.label === l)?.id, label);
const opPodium = (p) => p.evaluate(() => [...document.querySelectorAll('#buttonLayer .vbtn')].map((e) => e.textContent.replace(/▶/g, '').trim()));
const scene = (p) => p.evaluate(() => curScene().name);
// Nieuwe knop via "+ Knop toevoegen", kiezen in de knoppenlijst en een tekst geven.
async function nieuweKnop(p, label) {
  const voor = (await knoppen(p)).map((x) => x.id);
  await p.click('#addBtn');
  const id = (await knoppen(p)).find((x) => !voor.includes(x.id)).id;
  await p.click(`#boxKnoppen .box-rij[data-knop="${id}"]`);
  await wacht(100);
  await insp(p).locator('label.field', { hasText: 'Tekst op de knop' }).locator('input').fill(label);
  return id;
}
const actieSelect = (p) => insp(p).locator('label.field', { hasText: /^Actie/ }).locator('select');
// Is er ergens in het menu een zichtbare keuzelijst met deze optie (buiten de scènekiezer bovenaan)?
const keuzeZichtbaar = (p, tekst) => p.evaluate((t) => [...document.querySelectorAll('#panel select')]
  .filter((s) => !['sceneSelect', 'tbScene'].includes(s.id) && s.offsetParent !== null && s.getClientRects().length)
  .some((s) => [...s.options].some((o) => o.textContent.includes(t))), tekst);
async function dialoog(p, tekst) {
  await p.waitForFunction(() => !$('#tekstVraag').classList.contains('hidden'), null, { timeout: 3000 });
  const standaard = await p.inputValue('#tvVeld');
  await p.fill('#tvVeld', tekst);
  await p.press('#tvVeld', 'Enter');
  await p.waitForFunction(() => $('#tekstVraag').classList.contains('hidden'), null, { timeout: 3000 });
  return standaard;
}
async function netjes(p) { // knoppen in een raster, zodat ze niet over elkaar liggen
  await p.click('#selNone');
  await p.selectOption('#edLayout', 'grid3');
  await wacht(150);
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROMIUM, args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'nl-NL' });
  // Geen internet in de test: een nagebootste website met een logo, en een
  // site die niet bereikbaar is.
  await ctx.route('https://voorbeeld.test/**', (r) => {
    const u = new URL(r.request().url());
    if (u.pathname === '/apple-touch-icon.png') return r.fulfill({ status: 200, contentType: 'image/png', body: PNG.buffer });
    if (u.pathname === '/pagina') return r.fulfill({ status: 200, contentType: 'text/html',
      body: '<!doctype html><title>Voorbeeld</title><h1 id="kop">Voorbeeldpagina</h1>' });
    return r.fulfill({ status: 404, body: '' });
  });
  await ctx.route('https://kapot.test/**', (r) => r.abort('connectionrefused'));
  const p = await ctx.newPage();
  const errs = [], consoleErrs = [], dialogen = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/kapot\.test|ERR_CONNECTION_REFUSED|404/.test(m.text())) consoleErrs.push(m.text()); });
  p.on('dialog', (d) => { dialogen.push(d.message()); d.accept(); });
  await p.goto(APP);
  await p.waitForFunction(() => typeof mediaGeladen !== 'undefined' && mediaGeladen);
  await p.setInputFiles('#mediaInput', [F('1 intro.webm'), F('2 uitleg.webm')]);
  await p.waitForFunction(() => mediaCache.size === 2);
  const home = await p.evaluate(() => config.homeSceneId);

  console.log('1. Scènes maken');
  await menuOpen(p);
  await tab(p, 'buttons');
  await p.click('#sceneAdd');
  const voorstel = await dialoog(p, 'Producten');
  check('+ Nieuwe scène vraagt de naam in het eigen venster (voorstel "Scène 2")', voorstel === 'Scène 2', voorstel);
  const prod = await p.evaluate(() => config.scenes.find((s) => s.name === 'Producten')?.id);
  check('scène Producten bestaat en is de huidige', prod && await p.evaluate((i) => currentSceneId === i, prod));
  check('scènekiezers tonen Producten', await p.$eval('#sceneSelect', (s) => s.selectedOptions[0].textContent) === 'Producten' &&
    await p.$eval('#tbScene', (s) => s.selectedOptions[0].textContent) === 'Producten');
  check('nieuwe scène is leeg', (await opPodium(p)).length === 0);
  const kTerug = await nieuweKnop(p, 'Terug');
  await actieSelect(p).selectOption('Back');
  const kFilm = await nieuweKnop(p, 'Film');
  await insp(p).locator('label.field', { hasText: /^Media/ }).locator('select').first()
    .selectOption({ label: '1 intro.webm' });
  const kMeer = await nieuweKnop(p, 'Meer');
  await actieSelect(p).selectOption('OpenScene');
  await netjes(p);

  await p.click('#sceneAdd');
  await dialoog(p, 'Details');
  const det = await p.evaluate(() => config.scenes.find((s) => s.name === 'Details')?.id);
  const kHuis = await nieuweKnop(p, 'Naar huis');
  await actieSelect(p).selectOption('Home');
  const kTerug2 = await nieuweKnop(p, 'Terug');
  await actieSelect(p).selectOption('Back');
  await netjes(p);

  await p.selectOption('#sceneSelect', home);
  await wacht(200);
  check('scènekiezer wisselt terug naar Home', await scene(p) === 'Home' && (await opPodium(p)).length === 0);
  const kNaar = await nieuweKnop(p, 'Naar producten');
  await actieSelect(p).selectOption('OpenScene');
  let kb = (await knoppen(p)).find((x) => x.id === kNaar);
  check('actie "Ga naar scène" ingesteld', kb.action?.type === 'OpenScene' && kb.action.sceneId === prod, kb.action);
  check('het menu laat kiezen NAAR WELKE scène (Details staat ertussen)', await keuzeZichtbaar(p, 'Details'),
    'geen zichtbare "Doel-scène"-keuze; de knop gaat altijd naar de eerste andere scène');
  // Zonder keuzelijst kan het niet via het menu: voor de rest van de test zelf zetten.
  await p.evaluate(([k, d]) => { for (const sc of config.scenes) for (const b of sc.buttons) if (b.id === k) b.action.sceneId = d; save(); },
    [kMeer, det]);
  await netjes(p);
  await tab(p, 'look');
  await p.locator('#navCrumb').check();
  check('kruimelpad aangezet', await p.evaluate(() => config.nav.breadcrumb === true));
  await p.locator('#navSwipe').check();
  check('veeg-terug aangezet', await p.evaluate(() => config.nav.swipeBack === true));
  await menuDicht(p);

  console.log('2. Navigeren als bezoeker');
  check('start op Home zonder kruimelpad', await scene(p) === 'Home' && await p.evaluate(() => $('#breadcrumb').classList.contains('hidden')));
  await tik(p, kNaar);
  check('knop "Naar producten" opent de scène', await tot(p, (i) => currentSceneId === i, 5000, prod));
  await wacht(400);
  check('podium toont de knoppen van Producten', JSON.stringify((await opPodium(p)).sort()) === JSON.stringify(['Film', 'Meer', 'Terug']), await opPodium(p));
  check('kruimelpad: Home › Producten', (await p.innerText('#breadcrumb')).replace(/\s+/g, ' ').trim() === 'Home › Producten',
    await p.innerText('#breadcrumb'));
  await tik(p, kFilm);
  const s = await volg(p, 6000);
  check('video in een subscène speelt en sluit', volgorde(s).join() === '1 intro.webm' && !s[s.length - 1].show, volgorde(s));
  check('na de video nog steeds in Producten', await scene(p) === 'Producten');
  await tik(p, kMeer);
  check('door naar Details', await tot(p, (i) => currentSceneId === i, 5000, det));
  check('kruimelpad: Home › Producten › Details', (await p.innerText('#breadcrumb')).replace(/\s+/g, ' ').trim() === 'Home › Producten › Details');
  await p.click('#breadcrumb button:text-is("Producten")');
  check('kruimel "Producten" gaat één stap terug', await tot(p, (i) => currentSceneId === i, 5000, prod) &&
    await p.evaluate((h) => JSON.stringify(sceneStack) === JSON.stringify([h]), home), await p.evaluate(() => sceneStack));
  await wacht(500);
  await tik(p, kTerug);
  check('knop "Terug" gaat naar Home', await tot(p, (i) => currentSceneId === i, 5000, home));
  check('op Home geen kruimelpad meer, stapel leeg', await p.evaluate(() => $('#breadcrumb').classList.contains('hidden') && sceneStack.length === 0));
  await tik(p, kNaar);
  await tot(p, (i) => currentSceneId === i, 5000, prod);
  await tik(p, kMeer);
  await tot(p, (i) => currentSceneId === i, 5000, det);
  await tik(p, kTerug2);
  check('"Terug" in Details gaat naar Producten', await tot(p, (i) => currentSceneId === i, 5000, prod));
  await tik(p, kMeer);
  await tot(p, (i) => currentSceneId === i, 5000, det);
  await tik(p, kHuis);
  check('"Naar huis" gaat direct naar Home en wist de stapel', await tot(p, (i) => currentSceneId === i && sceneStack.length === 0, 5000, home));
  await wacht(400);
  await tik(p, kNaar);
  await tot(p, (i) => currentSceneId === i, 5000, prod);
  await wacht(800);
  // Naar rechts vegen over een leeg stuk podium
  await p.mouse.move(250, 880);
  await p.mouse.down();
  await p.mouse.move(650, 890, { steps: 6 });
  await p.mouse.up();
  check('naar rechts vegen = terug', await tot(p, (i) => currentSceneId === i, 4000, home));

  console.log('3. Hernoemen en verwijderen');
  await menuOpen(p);
  await tab(p, 'buttons');
  await p.selectOption('#sceneSelect', prod);
  await p.click('#sceneRename');
  const oud = await dialoog(p, 'Assortiment');
  check('Hernoemen toont de huidige naam en past hem aan', oud === 'Producten' && await scene(p) === 'Assortiment' &&
    await p.$eval('#sceneSelect', (sel) => sel.selectedOptions[0].textContent) === 'Assortiment');
  await p.click('#sceneDelete');
  await wacht(200);
  check('verwijderen vraagt bevestiging', dialogen.some((d) => d.includes('Assortiment')), dialogen.slice(-1));
  check('scène is weg, terug op Home', await p.evaluate((i) => !config.scenes.some((s) => s.id === i), prod) && await scene(p) === 'Home');
  kb = (await knoppen(p)).find((x) => x.id === kNaar);
  check('knop die naar de verwijderde scène ging, verwijst er niet meer naar', !kb.action || kb.action.sceneId !== prod, kb.action);
  check('scènekiezer kent hem niet meer', !(await p.$$eval('#sceneSelect option', (os) => os.map((o) => o.textContent))).some((t) => t.includes('Assortiment')));
  await p.click('#sceneDelete');
  await wacht(200);
  check('Home kan niet verwijderd worden', await p.evaluate(() => config.scenes.some((s) => s.id === config.homeSceneId)) &&
    /homescène kan niet/.test(await p.textContent('#toast')), await p.textContent('#toast'));
  await p.evaluate((k) => { const b = curButtons().find((x) => x.id === k); b.label = 'Weg'; b.hidden = true; save(); renderStage(); }, kNaar);

  console.log('4. Webpagina tonen');
  const kWeb = await nieuweKnop(p, 'Website');
  await actieSelect(p).selectOption('OpenURL');
  const urlVeld = insp(p).locator('input[placeholder^="https://"]');
  await urlVeld.fill('https://voorbeeld.test/pagina');
  await urlVeld.blur();
  check('adres opgeslagen', (await knoppen(p)).find((x) => x.id === kWeb).action?.url === 'https://voorbeeld.test/pagina');
  check('logo van de site gevonden', await tot(p, (k) => {
    const b = curButtons().find((x) => x.id === k); return b.webLogo && !b.webLogo.bezig && !!b.webLogo.url;
  }, 8000, kWeb));
  check('… en zichtbaar in de knop (geen videovoorbeeld van een willekeurige video)',
    await p.locator(`#buttonLayer .vbtn[data-id="${kWeb}"] img.wl-img`).count() === 1,
    await p.evaluate((k) => { const e = document.querySelector(`.vbtn[data-id="${k}"]`); const b = curButtons().find((x) => x.id === k);
      return { klasse: e.className, video: !!e.querySelector('video.preview'), mediaVanDeKnop: mediaCache.get(b.mediaId)?.name }; }, kWeb));
  const kKaal = await nieuweKnop(p, 'Zonder https');
  await actieSelect(p).selectOption('OpenURL');
  await urlVeld.fill('voorbeeld.test/pagina');
  await urlVeld.blur();
  await tot(p, (k) => { const b = curButtons().find((x) => x.id === k); return b.webLogo && !b.webLogo.bezig; }, 8000, kKaal);
  check('ook zonder https:// wordt het logo gevonden (de pagina zelf opent wél)', await p.evaluate((k) => !!curButtons().find((x) => x.id === k).webLogo?.url, kKaal),
    await p.evaluate((k) => curButtons().find((x) => x.id === k).webLogo, kKaal));
  const kKapot = await nieuweKnop(p, 'Kapot');
  await actieSelect(p).selectOption('OpenURL');
  await urlVeld.fill('https://kapot.test/');
  await netjes(p);
  await menuDicht(p);
  await tik(p, kWeb);
  check('webvenster gaat open', await tot(p, () => !$('#webOverlay').classList.contains('hidden'), 3000));
  check('iframe met het adres', await p.evaluate(() => $('#webFrame')?.src) === 'https://voorbeeld.test/pagina');
  let inhoud = null;
  for (let i = 0; i < 50 && !inhoud; i++) {
    const frame = p.frames().find((f) => f.url() === 'https://voorbeeld.test/pagina');
    try { inhoud = frame ? await frame.textContent('#kop', { timeout: 200 }) : null; } catch {}
    if (!inhoud) await wacht(100);
  }
  check('pagina staat er echt in', inhoud === 'Voorbeeldpagina', inhoud);
  check('laadmelding verdwijnt na het laden', await tot(p, () => $('#webStatus').classList.contains('hidden'), 3000));
  await p.click('#webClose');
  check('× Sluiten sluit het webvenster en ruimt op', await tot(p, () => $('#webOverlay').classList.contains('hidden') && !$('#webHost').children.length, 2000));
  check('daarna weer gewoon de knoppen', await tot(p, () => AppState.is('IDLE') && $('#buttonLayer').style.pointerEvents !== 'none', 5000));
  await tik(p, kKaal);
  check('adres zonder https:// wordt https://', await tot(p, () => $('#webFrame')?.src === 'https://voorbeeld.test/pagina', 3000),
    await p.evaluate(() => $('#webFrame')?.src));
  await p.click('#webClose');
  await tot(p, () => $('#buttonLayer').style.pointerEvents !== 'none', 5000);
  await tik(p, kKapot);
  check('onbereikbare site: eerlijke melding', await tot(p, () => /niet bereikbaar/.test($('#webBlockedText').textContent) &&
    !$('#webStatus').classList.contains('hidden'), 5000), await p.evaluate(() => $('#webBlockedText').textContent));
  await p.click('#webClose');
  check('ook dan te sluiten', await tot(p, () => $('#webOverlay').classList.contains('hidden'), 2000));

  console.log('5. Taal omschakelen');
  await menuOpen(p);
  await tab(p, 'look');
  await p.locator('#lgEnabled').check();
  check('meertaligheid aan, nl en en beschikbaar', await p.evaluate(() => config.lang.enabled && config.lang.available.includes('en')));
  check('vertaalvelden voor de titel verschijnen meteen', await p.locator('#titleTrans input[data-title-lang="en"]').count() === 1,
    'pas na het menu sluiten en opnieuw openen');
  await menuDicht(p); await menuOpen(p); await tab(p, 'look');
  await p.fill('#cfgTitle', 'Welkom');
  await p.fill('#titleTrans input[data-title-lang="en"]', 'Welcome');
  check('titel met vertaling', await p.evaluate(() => curScene().title === 'Welkom' && curScene().titles?.en === 'Welcome'));
  await tab(p, 'buttons');
  const kHallo = await nieuweKnop(p, 'Hallo');
  const pt = await inspOpen(p, 'PLANNING & TAAL');
  await pt.locator('input[data-lang="en"]').fill('Hello');
  check('labelvertaling via de inspector', (await knoppen(p)).find((x) => x.id === kHallo).labels?.en === 'Hello');
  const kEn = await nieuweKnop(p, 'English');
  await actieSelect(p).selectOption('SetLanguage');
  kb = (await knoppen(p)).find((x) => x.id === kEn);
  check('actie "Taal omschakelen" ingesteld', kb.action?.type === 'SetLanguage', kb.action);
  check('het menu laat kiezen NAAR WELKE taal (English)', await keuzeZichtbaar(p, 'English'),
    { langCode: kb.action?.langCode, probleem: 'geen zichtbare taalkeuze; de knop zet altijd de eerste taal (nl)' });
  await p.evaluate((k) => { curButtons().find((x) => x.id === k).action.langCode = 'en'; save(); }, kEn);
  const kNl = await nieuweKnop(p, 'Nederlands');
  await actieSelect(p).selectOption('SetLanguage');
  await netjes(p);
  await p.evaluate(() => setLanguage('nl'));
  await menuDicht(p);
  check('Nederlands: Hallo en Welkom', (await opPodium(p)).includes('Hallo') && await p.textContent('#stageTitle') === 'Welkom');
  await tik(p, kEn);
  check('knop English zet de taal op en', await tot(p, () => config.lang.current === 'en', 3000));
  check('labels en titel in het Engels', await tot(p, (k) => document.querySelector(`.vbtn[data-id="${k}"]`)?.textContent.includes('Hello') &&
    $('#stageTitle').textContent === 'Welcome', 3000, kHallo), { podium: await opPodium(p), titel: await p.textContent('#stageTitle') });
  check('zonder vertaling blijft de gewone tekst staan', (await opPodium(p)).includes('Nederlands'));
  check('taalbalk toont en als gekozen', await p.evaluate(() => !$('#langBar').classList.contains('hidden') && $('#langBar button.sel')?.textContent === 'en'));
  await tik(p, kNl);
  check('knop Nederlands zet hem terug', await tot(p, (k) => config.lang.current === 'nl' &&
    document.querySelector(`.vbtn[data-id="${k}"]`)?.textContent.includes('Hallo') && $('#stageTitle').textContent === 'Welkom', 3000, kHallo));
  await p.click('#langBar button:text-is("en")');
  check('taalbalk: en aantikken werkt ook', await tot(p, () => config.lang.current === 'en', 2000));
  await p.click('#langBar button:text-is("nl")');

  console.log('6. Zoeken in het menu');
  await menuOpen(p);
  await tab(p, 'buttons');
  const zoek = async (w) => {
    await p.fill('#zoekVeld', w);
    await p.waitForFunction(() => !$('#zoekUit').classList.contains('hidden'), null, { timeout: 2000 }).catch(() => {});
    await wacht(250);
    return p.$$eval('#zoekUit button', (bs) => bs.map((x) => x.firstChild.textContent));
  };
  let r = await zoek('hoofdvolume');
  check('"hoofdvolume" vindt de instelling', r[0] && /Hoofdvolume/.test(r[0]), r);
  await p.click('#zoekUit button >> nth=0');
  await wacht(500);
  check('klik: tabblad Scherm & scène open', await p.evaluate(() => document.querySelector('#tabs button.active')?.dataset.tab) === 'look');
  check('het veld licht op en staat in beeld', await p.evaluate(() => {
    const n = $('#cfgMasterVol').closest('label');
    const rr = n.getBoundingClientRect();
    return n.classList.contains('zoek-vondst') && rr.top >= 0 && rr.bottom <= innerHeight;
  }));
  check('zoekveld weer leeg, lijst dicht', await p.inputValue('#zoekVeld') === '' && await p.evaluate(() => $('#zoekUit').classList.contains('hidden')));
  r = await zoek('rastergrootte');
  await p.press('#zoekVeld', 'Enter');
  await wacht(500);
  check('Enter springt naar de eerste treffer (Knoppen › raster)', await p.evaluate(() =>
    document.querySelector('#tabs button.active')?.dataset.tab === 'buttons' && $('#edGrid').closest('label').classList.contains('zoek-vondst')), r);
  r = await zoek('usb');
  check('"usb" vindt verhuizen via de woordenlijst', r.some((t) => /exporteren/i.test(t)), r);
  await p.click('#zoekUit button >> nth=0');
  await wacht(300);
  check('klik: tabblad Opslaan & beheer en een aanwijzing', await p.evaluate(() =>
    document.querySelector('#tabs button.active')?.dataset.tab === 'share' && /Naar een andere computer/.test($('#toast').textContent)),
  await p.textContent('#toast'));
  r = await zoek('volume');
  await p.press('#zoekVeld', 'ArrowDown');
  const tweede = await p.$$eval('#zoekUit button', (bs) => bs.findIndex((x) => x.classList.contains('op')));
  check('pijltje omlaag kiest de volgende treffer', r.length > 1 && tweede === 1, { r, tweede });
  await p.press('#zoekVeld', 'Escape');
  check('Escape sluit de lijst', await p.evaluate(() => $('#zoekUit').classList.contains('hidden') && !$('#zoekVeld').value));
  r = await zoek('xyzqq');
  check('onzin: "Niets gevonden"', /Niets gevonden/.test(await p.textContent('#zoekUit')));
  await p.press('#zoekVeld', 'Escape');
  // Een dichtgeklapt onderdeel wordt bij een treffer eerst opengeklapt
  await tab(p, 'look');
  const sec = p.locator('#page-look .sec', { has: p.locator('#cfgHideBtns') });
  await sec.locator('.sec-head').click();
  check('onderdeel dichtgeklapt', await sec.evaluate((x) => x.classList.contains('closed')));
  await tab(p, 'buttons');
  await zoek('knoppen verbergen');
  await p.press('#zoekVeld', 'Enter');
  await wacht(500);
  check('treffer in een dichtgeklapt onderdeel klapt het open', await sec.evaluate((x) => !x.classList.contains('closed')) &&
    await p.locator('#cfgHideBtns').isVisible());

  console.log('7. PIN op het menu');
  await tab(p, 'share');
  await p.click('#pinSet');
  await p.waitForFunction(() => !$('#tekstVraag').classList.contains('hidden'));
  check('PIN-veld is verborgen invoer', await p.getAttribute('#tvVeld', 'type') === 'password');
  await p.fill('#tvVeld', '12a');
  await p.press('#tvVeld', 'Enter');
  check('ongeldige PIN geweigerd met uitleg', await p.evaluate(() => !$('#tekstVraag').classList.contains('hidden') &&
    !$('#tvFout').classList.contains('hidden')), await p.textContent('#tvFout'));
  await p.fill('#tvVeld', '4321');
  await p.press('#tvVeld', 'Enter');
  check('PIN ingesteld', await tot(p, () => !!config.security.pinHash && /PIN is actief/.test($('#pinStatus').textContent), 2000));
  await menuDicht(p);
  await p.evaluate(() => { adminUnlockedUntil = 0; }); // tien minuten later
  const hoek = async () => { for (let i = 0; i < 5; i++) { await p.mouse.click(20, 20); await wacht(60); } };
  await hoek();
  check('5× tikken vraagt nu de PIN', await tot(p, () => !$('#tekstVraag').classList.contains('hidden') && /PIN/.test($('#tvVraag').textContent), 2000));
  await p.fill('#tvVeld', '0000');
  await p.press('#tvVeld', 'Enter');
  check('verkeerde PIN: menu blijft dicht', await tot(p, () => /Onjuiste PIN/.test($('#toast').textContent), 2000) &&
    await p.evaluate(() => !panel.classList.contains('open')));
  await hoek();
  await p.waitForFunction(() => !$('#tekstVraag').classList.contains('hidden'));
  await p.fill('#tvVeld', '4321');
  await p.press('#tvVeld', 'Enter');
  check('juiste PIN: menu open', await tot(p, () => panel.classList.contains('open'), 2000));
  await tab(p, 'share');
  await p.click('#pinClear');
  check('PIN verwijderen', await tot(p, () => !config.security.pinHash, 2000));

  check('geen JS-fouten', errs.length === 0, errs.slice(0, 3));
  check('geen fouten in de console', consoleErrs.length === 0, consoleErrs.slice(0, 3));
  console.log(`\n${fout ? 'FOUT' : 'OK  '}: ${ok}/${ok + fout}`);
  await b.close();
  process.exit(fout ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
