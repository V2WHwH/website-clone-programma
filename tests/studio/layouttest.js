// Indeling: alle sjablonen zonder overlappende knoppen of afgebroken woorden,
// op staand, liggend en laptop; het aanraakmenu zonder iets dat opzij uitsteekt.
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
  for (const [w, h] of [[1080, 1920], [1920, 1080], [1600, 1000], [1366, 768], [1280, 800], [1024, 768]]) {
    console.log(`== ${w}×${h}`);
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(APP);
    await p.waitForFunction(() => typeof Toetsenbord !== 'undefined');
    const sjablonen = await p.evaluate(() => SJABLONEN.map((s) => s.id));
    for (const id of sjablonen) {
      await p.evaluate((i) => { pasSjabloonToe(SJABLONEN.find((s) => s.id === i)); closeEditor(); renderStage(); }, id);
      await wacht(2500);   // binnenkomst-animatie uit laten lopen
      const meet = () => p.evaluate(() => {
        const knoppen = [...document.querySelectorAll('#buttonLayer .vbtn')].map((x) => ({ r: x.getBoundingClientRect(), x }));
        const over = [];
        for (let i = 0; i < knoppen.length; i++) for (let j = i + 1; j < knoppen.length; j++) {
          const a = knoppen[i].r, c = knoppen[j].r;
          const ox = Math.min(a.right, c.right) - Math.max(a.left, c.left);
          const oy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
          if (ox > 4 && oy > 4) over.push([knoppen[i].x.textContent.trim(), knoppen[j].x.textContent.trim()]);
        }
        const buiten = knoppen.filter(({ r }) => r.left < -2 || r.top < -2 || r.right > innerWidth + 2 || r.bottom > innerHeight + 2)
          .map(({ x }) => x.textContent.trim());
        // Een woord dat midden in breekt: een regel die met een halve lettergreep begint
        // is lastig te meten; wel te meten: tekst breder dan de knop.
        const afgekapt = knoppen.filter(({ x }) => { const l = x.querySelector('.vlabel, .lbl, span') || x;
          return l.scrollWidth > l.clientWidth + 2; }).map(({ x }) => x.textContent.trim());
        return { n: knoppen.length, over, buiten, afgekapt };
      });
      // Vijf keer over drie seconden: een aandachtseffect laat een knop even
      // groeien, en ook dan mogen ze elkaar niet raken.
      let r = await meet();
      for (let k = 0; k < 4 && !r.over.length && !r.buiten.length; k++) { await wacht(750); r = await meet(); }
      check(`${id}: ${r.n} knoppen, geen overlap, binnen beeld`, (id === 'leeg' ? r.n === 0 : r.n > 0) && !r.over.length && !r.buiten.length && !r.afgekapt.length, r.over.length || r.buiten.length || r.afgekapt.length ? r : undefined);
    }
    // Het menu: niets mag opzij uitsteken.
    await p.evaluate(() => openEditor());
    await wacht(300);
    const box = await p.evaluate(() => document.body.classList.contains('aanraakmenu'));
    const tabs = box
      ? await p.$$eval('#startScherm .st-tegel, #startScherm .st-meer button', (ts) => ts.map((t) => t.textContent.trim().slice(0, 24)))
      : await p.$$eval('#panel button[data-tab]', (bs) => [...new Set(bs.map((x) => x.dataset.tab))]);
    const fouten = [];
    for (let i = 0; i < tabs.length; i++) {
      if (box) {
        const doel = p.locator('#startScherm .st-tegel, #startScherm .st-meer button').nth(i);
        await doel.scrollIntoViewIfNeeded(); await doel.tap();
      } else {
        await p.click(`#panel button[data-tab="${tabs[i]}"]`).catch(() => {});
      }
      await wacht(250);
      const uit = await p.evaluate(() => {
        const pg = [...document.querySelectorAll('.tabpage')].find((x) => !x.classList.contains('hidden') && x.offsetParent);
        const bw = document.documentElement.scrollWidth - innerWidth;
        const te = pg ? [...pg.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect();
          return r.width > 0 && r.right > pg.getBoundingClientRect().right + 2 && getComputedStyle(e).position !== 'fixed'; })
          .slice(0, 3).map((e) => e.tagName + '.' + e.className + ' ' + (e.textContent || '').trim().slice(0, 30)) : [];
        return { bw, te };
      });
      if (uit.bw > 0 || uit.te.length) fouten.push({ tab: tabs[i], ...uit });
      if (box) { await p.locator('#tbTerug').tap().catch(() => {}); await wacht(200); }
    }
    check(`menu (${box ? 'aanraakmenu' : 'breed'}): ${tabs.length} onderdelen zonder uitsteeksels`, !fouten.length, fouten.slice(0, 3));
    check('geen JS-fouten', errs.length === 0, errs.slice(0, 3));
    await ctx.close();
  }
  console.log(`\n${fout ? 'FOUT' : 'OK  '}: ${ok}/${ok + fout}`);
  await b.close();
  process.exit(fout ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
