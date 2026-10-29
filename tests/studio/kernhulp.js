// Gedeelde hulpjes voor kerntest, scenetest en verhuistest: testbestanden
// die niet in media/ staan, een knop aantikken zoals een bezoeker, het
// afspeelvenster volgen, het menu openen en sluiten.
const path = require('path');
const zlib = require('zlib');
const fs = require('fs');
const { MEDIA } = require('./hulp');
const M = (f) => path.join(MEDIA, f);
// Een bestand uit media/ als buffer (Playwright mengt geen paden en buffers).
const TYPE = { webm: 'video/webm', mp3: 'audio/mpeg', png: 'image/png', obj: 'text/plain' };
const F = (f) => ({ name: f, mimeType: TYPE[f.split('.').pop()] || 'application/octet-stream', buffer: fs.readFileSync(M(f)) });

const wacht = (ms) => new Promise((r) => setTimeout(r, ms));
async function tot(p, fn, ms = 6000, arg) {
  const eind = Date.now() + ms;
  while (Date.now() < eind) { if (await p.evaluate(fn, arg)) return true; await wacht(80); }
  return false;
}

/* ---- Testbestanden die niet in media/ staan: een PNG met een doorzichtige
   rand (knopvorm) en een klein 3D-object. In het geheugen gemaakt, zodat de
   test niet van ffmpeg afhangt. */
function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function maakPng(w = 96, h = 96) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // RGBA
  const rauw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    rauw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const i = y * (w * 4 + 1) + 1 + x * 4;
      const binnen = Math.hypot(x - w / 2, y - h / 2) < w * 0.45;
      rauw[i] = 255; rauw[i + 1] = 140; rauw[i + 2] = 0; rauw[i + 3] = binnen ? 255 : 0;
    }
  }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(rauw)), chunk('IEND', Buffer.alloc(0))]);
}
const PNG = { name: 'knop.png', mimeType: 'image/png', buffer: maakPng() };
const OBJ = { name: 'kubus.obj', mimeType: 'text/plain', buffer: Buffer.from(
  'v -1 -1 -1\nv 1 -1 -1\nv 1 1 -1\nv -1 1 -1\nv -1 -1 1\nv 1 -1 1\nv 1 1 1\nv -1 1 1\n' +
  'f 1 2 3 4\nf 5 8 7 6\nf 1 5 6 2\nf 2 6 7 3\nf 3 7 8 4\nf 5 1 4 8\n') };

/* ---- Hulpjes voor de pagina ---- */
const ids = (p) => p.evaluate(() => Object.fromEntries([...mediaCache.values()].map((m) => [m.name, m.id])));
const knoppen = (p) => p.evaluate(() => curButtons().map((b) => ({ ...b })));
// Wat er nu in het afspeelvenster gebeurt.
const stand = (p) => p.evaluate(() => ({
  show: playOverlay.classList.contains('show'),
  naam: [...mediaCache.values()].find((m) => m.url === playVideo.src)?.name || null,
  t: +playVideo.currentTime.toFixed(2), paused: playVideo.paused,
  vol: +playVideo.volume.toFixed(3), muted: playVideo.muted, loop: playVideo.loop,
  knoppenZichtbaar: $('#buttonLayer').style.visibility !== 'hidden',
  mode3d: playOverlay.classList.contains('mode-3d'),
}));
// Een punt op de knop dat echt bij die knop hoort (knoppen kunnen elkaar
// deels overlappen; dan telt wat bovenop ligt).
async function punt(p, id) {
  // Tijdens de binnenkomst-animatie zijn de knoppen (instelling "Interactie
  // tijdens de entrance") nog niet aan te raken.
  await p.waitForFunction(() => !$('#buttonLayer').classList.contains('wacht'), null, { timeout: 8000 });
  const pt = await p.evaluate((i) => {
    const e = document.querySelector(`#buttonLayer .vbtn[data-id="${i}"]`);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    for (const fy of [0.5, 0.35, 0.65, 0.2, 0.8]) for (const fx of [0.5, 0.35, 0.65, 0.2, 0.8]) {
      const x = r.left + r.width * fx, y = r.top + r.height * fy;
      if (document.elementFromPoint(x, y)?.closest('.vbtn') === e) return { x, y };
    }
    return null;
  }, id);
  if (!pt) throw new Error('knop niet aan te raken: ' + id);
  return pt;
}
// Een knop aantikken zoals een bezoeker, zodra de knoppenlaag weer
// aanraakbaar is (tijdens de binnenkomst-animatie niet).
async function tik(p, id) {
  await p.waitForFunction(() => !$('#buttonLayer').classList.contains('wacht'), null, { timeout: 8000 });
  await wacht(150);
  const { x, y } = await punt(p, id);
  await p.mouse.click(x, y);
}
async function sleep(p, id, dx, dy) {
  const { x, y } = await punt(p, id);
  await p.mouse.move(x, y);
  await p.mouse.down();
  await p.mouse.move(x + dx, y + dy, { steps: 8 });
  await p.mouse.up();
  await wacht(150);
}
// Afspelen volgen tot het venster dicht is (of tot ms om is).
async function volg(p, ms) {
  const uit = [];
  const t0 = Date.now();
  let open = false;
  while (Date.now() - t0 < ms) {
    const s = await stand(p);
    s.ms = Date.now() - t0;
    uit.push(s);
    if (s.show) open = true;
    if (open && !s.show) break;
    await wacht(90);
  }
  return uit;
}
const volgorde = (samples) => {
  const r = [];
  for (const s of samples) if (s.show && s.naam && !s.paused && s.t > 0.05 && r[r.length - 1] !== s.naam) r.push(s.naam);
  return r;
};
async function menuOpen(p) {
  if (await p.evaluate(() => panel.classList.contains('open'))) return;
  for (let i = 0; i < 5; i++) { await p.mouse.click(20, 20); await wacht(60); }
  await p.waitForFunction(() => panel.classList.contains('open'));
}
async function menuDicht(p) {
  await p.click('#closePanel');
  await p.waitForFunction(() => !panel.classList.contains('open') && !editing);
  await wacht(300);
}
async function tab(p, t) { await p.click(`#panel button[data-tab="${t}"]`); await wacht(150); }
// Knop in het podium van de editor aanklikken (selecteren), eventueel met shift.
async function kies(p, id, shift = false) {
  const { x, y } = await punt(p, id);
  if (shift) await p.keyboard.down('Shift');
  await p.mouse.click(x, y);
  if (shift) await p.keyboard.up('Shift');
  await wacht(150);
}
const insp = (p) => p.locator('#inspBody');
async function inspOpen(p, kop) {
  const d = insp(p).locator('details', { has: p.locator(`summary:text-is("${kop}")`) });
  if (!(await d.evaluate((x) => x.open))) await d.locator('summary').click();
  return d;
}
// Afspeelinstellingen van één video via het Media-tabblad invullen.
async function zetAfspeel(p, naam, waarden) {
  await tab(p, 'media');
  const kaart = p.locator('#mediaList .card', { has: p.locator(`.nm[title="${naam}"]`) });
  if (!(await kaart.locator('.play-settings').count())) await kaart.locator('button', { hasText: 'Instellingen' }).click();
  const box = kaart.locator('.play-settings');
  const veld = { trimStart: 'Begin bijsnijden', trimEnd: 'Einde bijsnijden', volume: 'Volume', fadeSec: 'Audio faden' };
  const schakel = { loop: 'Herhalen', holdLastFrame: 'Stoppen op laatste frame' };
  for (const [k, v] of Object.entries(waarden)) {
    if (veld[k]) {
      const inp = box.locator('label.field', { hasText: veld[k] }).locator('input');
      await inp.fill(String(v));
      await inp.dispatchEvent('change');
    } else if (schakel[k]) {
      const cb = box.locator('.toggle-row', { hasText: schakel[k] }).locator('input[type=checkbox]');
      if ((await cb.isChecked()) !== v) await cb.click();
    }
  }
  await kaart.locator('button', { hasText: 'Instellingen' }).click(); // weer inklappen
}


module.exports = { M, F, wacht, tot, maakPng, PNG, OBJ, ids, knoppen, stand, punt, tik, sleep, volg, volgorde,
  menuOpen, menuDicht, tab, kies, insp, inspOpen, zetAfspeel };
