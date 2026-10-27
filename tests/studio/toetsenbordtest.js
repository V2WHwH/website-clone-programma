// Typen op de holobox: eigen toetsenbord bij aanraken, invoervenster in
// plaats van prompt(), PIN met cijfertoetsen, en niets van dit alles met muis.
const { chromium } = require('playwright');
const { APP, MEDIA, CHROMIUM, VERSIE } = require('./hulp');
let ok = 0, fout = 0;
const check = (naam, cond, info) => {
  if (cond) ok++; else fout++;
  console.log(`   ${cond ? '✓' : '✗'} ${naam} ${info !== undefined ? JSON.stringify(info) : ''}`);
};
const wacht = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const b = await chromium.launch({ executablePath: CHROMIUM });

  console.log('1. Holobox (staand, aanraken): knopnaam');
  const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('dialog', (d) => { errs.push('native dialoog: ' + d.message()); d.dismiss(); });
  await p.goto(APP);
  await p.waitForFunction(() => typeof Toetsenbord !== 'undefined');
  await p.evaluate(() => {
    curScene().buttons = [{ id: 'k1', label: 'Oud', x: 50, y: 50, size: 1, color: '#15f2e0', shape: 'pill' }];
    save(); renderStage(); openEditor();
  });
  await wacht(300);
  await p.locator('#startScherm .st-tegel', { hasText: 'Knoppen' }).tap();
  await wacht(300);
  await p.locator('.box-rij[data-knop="k1"]').tap();
  await wacht(300);
  const osk = p.locator('#osk');
  const toets = (k) => p.locator(`#osk .osk-k[data-k="${k}"]`).first().tap();
  await p.locator('#bkTekst').tap();
  await wacht(200);
  check('toetsenbord verschijnt bij aantikken', await osk.isVisible());
  check('toetsenbord van Windows onderdrukt (inputmode none)', await p.evaluate(() => $('#bkTekst').getAttribute('inputmode') === 'none'));
  check('bovenin staat welk vak het is', (await p.textContent('#osk .osk-lbl')).includes('Tekst op de knop'));
  check('tekstvak houdt de focus', await p.evaluate(() => document.activeElement.id === 'bkTekst'));
  for (let i = 0; i < 3; i++) await toets('⌫');
  check('wissen werkt', await p.evaluate(() => curButtons()[0].label === ''));
  check('leeg vak: eerste letter wordt een hoofdletter', (await p.textContent('#osk .osk-k[data-k="n"]')) === 'N');
  for (const k of ['n', 'i', 'e', 'u', 'w', 'spatie', 'f', 'i', 'l', 'm']) await toets(k);
  check('typen werkt: knop heet nu "Nieuw film"', await p.evaluate(() => curButtons()[0].label === 'Nieuw film'),
    await p.evaluate(() => curButtons()[0].label));
  check('podium toont de nieuwe naam', await p.evaluate(() => [...document.querySelectorAll('#buttonLayer .vbtn')].some((x) => x.textContent.includes('Nieuw film'))));
  check('bovenin staat wat je typt, met cursor', (await p.textContent('#osk .osk-waarde')) === 'Nieuw film' &&
    await p.locator('#osk .osk-cursor').count() === 1);
  await toets('←'); await toets('←'); await toets('←'); await toets('←');
  await toets('⇧'); await toets('d'); await toets('e'); await toets('spatie');
  check('cursor verplaatsen en midden in de tekst typen', await p.evaluate(() => curButtons()[0].label === 'Nieuw De film'),
    await p.evaluate(() => curButtons()[0].label));
  await toets('123'); await toets('é'); await toets('abc');
  check('tekens-laag: é', await p.evaluate(() => curButtons()[0].label === 'Nieuw De éfilm'));
  await toets('⌫');
  await p.evaluate(() => { window.__changes = 0; $('#bkTekst').addEventListener('change', () => window.__changes++); });
  await toets('Klaar');
  await wacht(150);
  check('Klaar sluit het toetsenbord', !(await osk.isVisible()));
  check('Klaar geeft de wijziging door (change)', await p.evaluate(() => window.__changes === 1));
  check('inputmode weer zoals hij was', await p.evaluate(() => !$('#bkTekst').hasAttribute('inputmode')));
  check('bewaard', await p.evaluate(() => JSON.parse(localStorage.getItem('hwh_studio_config_v1')).scenes[0].buttons[0].label === 'Nieuw De film'));

  console.log('2. Invoervenster in plaats van prompt (nieuwe scène)');
  await p.locator('#boxKaart .bk-kop button', { hasText: 'Alle knoppen' }).tap();
  await wacht(300);
  await p.evaluate(() => { $('#sceneAdd').scrollIntoView(); });
  await p.locator('#sceneAdd').tap();
  await wacht(250);
  check('eigen venster open', await p.locator('#tekstVraag').isVisible());
  check('met toetsenbord, voorgevuld', await osk.isVisible() && (await p.inputValue('#tvVeld')).startsWith('Scène'));
  await p.evaluate(() => { const v = $('#tvVeld'); v.setSelectionRange(0, v.value.length); });
  for (const k of ['⇧', 'b', 'e', 'u', 'r', 's']) await toets(k);
  await toets('Klaar');
  await wacht(250);
  check('scène "Beurs" aangemaakt', await p.evaluate(() => config.scenes.some((s) => s.name === 'Beurs')));
  check('venster en toetsenbord dicht', !(await p.locator('#tekstVraag').isVisible()) && !(await osk.isVisible()));
  await p.evaluate(() => $('#sceneRename').scrollIntoView());
  await p.locator('#sceneRename').tap();
  await wacht(200);
  await p.locator('#tvAnnuleer').tap();
  await wacht(150);
  check('Annuleren laat de naam staan', await p.evaluate(() => curScene().name === 'Beurs'));

  console.log('3. PIN met cijfertoetsen');
  await p.locator('#tbTerug').tap();
  await wacht(250);
  await p.locator('#startScherm .st-tegel', { hasText: 'Opslaan' }).tap();
  await wacht(300);
  await p.evaluate(() => { $('#pinSet').scrollIntoView({ block: 'center' }); });
  await p.locator('#pinSet').tap();
  await wacht(250);
  check('PIN-venster met cijferblok', await p.evaluate(() => $('#tvVeld').type === 'password' && $('#osk').dataset.laag === 'cijfers'));
  for (const k of ['1', '2']) await toets(k);
  await toets('Klaar');
  await wacht(150);
  check('te korte PIN geweigerd met uitleg', (await p.textContent('#tvFout')).includes('4 tot 8 cijfers') && await p.locator('#tekstVraag').isVisible());
  for (const k of ['3', '4']) await toets(k);
  check('bovenin bolletjes, geen cijfers', (await p.textContent('#osk .osk-waarde')) === '••••');
  await toets('Klaar');
  await wacht(250);
  check('PIN ingesteld', await p.evaluate(() => !!config.security.pinHash));
  await p.evaluate(() => { closeEditor(); adminUnlockedUntil = 0; });
  await wacht(300);
  for (let i = 0; i < 5; i++) { await p.touchscreen.tap(20, 20); await wacht(80); }
  await wacht(300);
  check('5× tikken vraagt de PIN', await p.locator('#tekstVraag').isVisible() && await osk.isVisible());
  for (const k of ['9', '9', '9', '9']) await toets(k);
  await toets('Klaar');
  await wacht(300);
  check('verkeerde PIN: menu blijft dicht', !(await p.evaluate(() => panel.classList.contains('open'))));
  for (let i = 0; i < 5; i++) { await p.touchscreen.tap(20, 20); await wacht(80); }
  await wacht(300);
  for (const k of ['1', '2', '3', '4']) await toets(k);
  await toets('Klaar');
  await wacht(400);
  check('goede PIN: menu open', await p.evaluate(() => panel.classList.contains('open')));

  console.log('4. Getalvak');
  await p.evaluate(() => { config.screensaver.delaySec = 120; save(); });
  await p.locator('#tbTerug').tap().catch(() => {});
  await wacht(250);
  await p.locator('#startScherm .st-tegel', { hasText: 'Screensaver' }).tap();
  await wacht(300);
  await p.evaluate(() => $('#svDelay').scrollIntoView({ block: 'center' }));
  await p.locator('#svDelay').tap();
  await wacht(150);
  check('cijferblok bij een getalvak', await p.evaluate(() => $('#osk').dataset.laag === 'cijfers'));
  for (let i = 0; i < 3; i++) await toets('⌫');
  for (const k of ['4', '5']) await toets(k);
  await toets('Klaar');
  await wacht(150);
  check('getal opgeslagen (change)', await p.evaluate(() => config.screensaver.delaySec === 45), await p.evaluate(() => config.screensaver.delaySec));

  console.log('5. Uitzetten');
  await p.evaluate(() => { config.toetsenbord = 'uit'; save(); });
  await p.locator('#startScherm .st-tegel, .box-terug, #boxTerug').first().isVisible().catch(() => {});
  await p.evaluate(() => $('#svDelay').scrollIntoView({ block: 'center' }));
  await p.locator('#svDelay').tap();
  await wacht(150);
  check('uit: geen eigen toetsenbord', !(await osk.isVisible()));
  check('uit: toetsenbord van Windows niet onderdrukt', await p.evaluate(() => !$('#svDelay').hasAttribute('inputmode')));
  await p.evaluate(() => { config.toetsenbord = 'aan'; save(); document.activeElement.blur(); });
  check('geen JS-fouten en geen prompt()', errs.length === 0, errs.slice(0, 3));
  await ctx.close();

  console.log('6. Breed scherm met muis en toetsenbord');
  const ctx2 = await b.newContext({ viewport: { width: 1600, height: 1000 } });
  const q = await ctx2.newPage();
  const errs2 = [];
  q.on('pageerror', (e) => errs2.push(e.message));
  q.on('dialog', (d) => { errs2.push('native dialoog: ' + d.message()); d.dismiss(); });
  await q.goto(APP);
  await q.waitForFunction(() => typeof Toetsenbord !== 'undefined');
  await q.evaluate(() => {
    curScene().buttons = [{ id: 'k1', label: 'Oud', x: 50, y: 50, size: 1, color: '#15f2e0', shape: 'pill' }];
    save(); renderStage(); openEditor(); selectedIds.clear(); selectedIds.add('k1'); renderInspector();
  });
  const veld = q.locator('#inspBody input[type=text]').first();
  await veld.click();
  await wacht(150);
  check('met de muis: geen schermtoetsenbord', !(await q.locator('#osk').isVisible()));
  check('duidelijke rand om het actieve vak', await veld.evaluate((x) => getComputedStyle(x).boxShadow !== 'none'));
  await q.keyboard.press('Control+A');
  await q.keyboard.type('Met toetsenbord');
  check('gewoon typen werkt', await q.evaluate(() => curButtons()[0].label === 'Met toetsenbord'));
  await q.click('#panel button[data-tab="look"]').catch(() => {});
  await q.evaluate(() => $('#sceneAdd').click());
  await wacht(200);
  check('nieuwe scène: eigen venster, geen toetsenbord bij muis', await q.locator('#tekstVraag').isVisible() && !(await q.locator('#osk').isVisible()));
  await q.keyboard.press('Control+A');
  await q.keyboard.type('Showroom');
  await q.keyboard.press('Enter');
  await wacht(200);
  check('Enter bevestigt', await q.evaluate(() => config.scenes.some((s) => s.name === 'Showroom')));
  await q.evaluate(() => $('#sceneRename').click());
  await wacht(150);
  await q.keyboard.press('Escape');
  await wacht(150);
  check('Escape annuleert', !(await q.locator('#tekstVraag').isVisible()) && await q.evaluate(() => curScene().name === 'Showroom'));
  check('geen JS-fouten en geen prompt()', errs2.length === 0, errs2.slice(0, 3));
  await ctx2.close();

  console.log(`\n${fout ? 'FOUT' : 'OK  '}: ${ok}/${ok + fout}`);
  await b.close();
  process.exit(fout ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
