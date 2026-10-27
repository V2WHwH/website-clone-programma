// Muziek van internet: adressen herkennen, directe stream, en YouTube en
// SoundCloud via hun berichtenprotocol (hier met nagebootste spelers, want
// deze machine kan YouTube en SoundCloud niet bereiken). De echte diensten
// worden in de Windows-build getest.
const { chromium } = require('playwright');
const { APP, MEDIA, CHROMIUM, VERSIE } = require('./hulp');
const http = require('http');
const fs = require('fs');
const path = require('path');

let ok = 0, fout = 0;
const check = (naam, cond, info) => {
  if (cond) ok++; else fout++;
  console.log(`   ${cond ? '✓' : '✗'} ${naam} ${info !== undefined ? JSON.stringify(info) : ''}`);
};
const wacht = (ms) => new Promise((r) => setTimeout(r, ms));
async function tot(p, fn, ms = 6000, arg) {
  const eind = Date.now() + ms;
  while (Date.now() < eind) { if (await p.evaluate(fn, arg)) return true; await wacht(100); }
  return false;
}

// Nagebootste YouTube-speler: praat het "widget"-protocol van de embed.
const YT_MOCK = `<!doctype html><script>
const id = location.pathname.split('/').pop();
const dur = id.startsWith('kort') ? 4 : 60;
let state = -1, t = 0, vol = 100, muted = false, luistert = false;
window.log = [];
const zend = (o) => parent.postMessage(JSON.stringify(Object.assign(o, { id: 1, channel: 'widget' })), '*');
const zet = (s) => { state = s; if (luistert) zend({ event: 'onStateChange', info: s }); };
addEventListener('message', (e) => {
  let d; try { d = JSON.parse(e.data); } catch { return; }
  if (d.event === 'listening') {
    if (!luistert) { luistert = true; zend({ event: 'initialDelivery', info: { playerState: state, currentTime: t, duration: dur } }); zend({ event: 'onReady' }); }
    return;
  }
  if (d.event !== 'command') return;
  log.push(d.func + (d.args && d.args.length ? ':' + d.args.join(',') : ''));
  if (d.func === 'playVideo') { if (state === 0) t = 0; zet(1); }
  else if (d.func === 'pauseVideo') zet(2);
  else if (d.func === 'seekTo') { t = d.args[0]; if (state === 0) zet(2); }
  else if (d.func === 'setVolume') vol = d.args[0];
  else if (d.func === 'unMute') muted = false;
});
setInterval(() => { if (state === 1) { t = Math.min(dur, t + 0.1); if (t >= dur) zet(0); } }, 100);
setInterval(() => { if (luistert) zend({ event: 'infoDelivery', info: { playerState: state, currentTime: t, volume: vol, muted } }); }, 250);
window.stand = () => ({ state, t, vol, muted });
</script>`;

// Nagebootste SoundCloud-widget: praat het protocol van de widget-API.
const SC_MOCK = `<!doctype html><script>
const url = new URLSearchParams(location.search).get('url') || '';
const dur = url.includes('kort') ? 4000 : 60000;
let playing = false, pos = 0, vol = 100;
const subs = new Set();
window.log = [];
const zend = (method, value) => parent.postMessage(JSON.stringify({ widgetId: 'w1', method, value }), '*');
const emit = (m, v) => { if (subs.has(m)) zend(m, v); };
addEventListener('load', () => zend('ready'));
addEventListener('message', (e) => {
  let d; try { d = JSON.parse(e.data); } catch { return; }
  log.push(d.method + (d.value !== undefined ? ':' + d.value : ''));
  if (d.method === 'addEventListener') subs.add(d.value);
  else if (d.method === 'play') { if (pos >= dur) pos = 0; playing = true; emit('play'); }
  else if (d.method === 'pause') { playing = false; emit('pause'); }
  else if (d.method === 'seekTo') pos = d.value;
  else if (d.method === 'setVolume') vol = d.value;
});
setInterval(() => {
  if (!playing) return;
  pos = Math.min(dur, pos + 100);
  if (pos >= dur) { playing = false; emit('pause'); emit('finish'); }
  else emit('playProgress', { currentPosition: pos });
}, 100);
window.stand = () => ({ playing, pos, vol });
</script>`;

(async () => {
  // Directe stream: een gewone webserver met een mp3.
  const mp3 = fs.readFileSync(path.join(MEDIA, 'lang.mp3'));
  const srv = http.createServer((req, res) => {
    if (req.url.startsWith('/radio.mp3')) { res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': mp3.length }); res.end(mp3); }
    else { res.writeHead(404); res.end(); }
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const STREAM = `http://127.0.0.1:${srv.address().port}/radio.mp3`;

  const b = await chromium.launch({ executablePath: CHROMIUM,
    args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 } });
  await ctx.route('https://www.youtube-nocookie.com/embed/**', (r) => r.fulfill({ contentType: 'text/html', body: YT_MOCK }));
  await ctx.route('https://w.soundcloud.com/player/**', (r) => r.fulfill({ contentType: 'text/html', body: SC_MOCK }));
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(APP);
  await p.waitForFunction(() => typeof Muziek !== 'undefined');
  const speler = (host) => p.frames().find((f) => f.url().includes(host));

  console.log('1. Adressen herkennen');
  const r = await p.evaluate(() => [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtu.be/dQw4w9WgXcQ?t=10',
    'https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=RDAMVMdQw4w9WgXcQ',
    'https://www.youtube.com/playlist?list=PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG',
    'https://youtube.com/shorts/dQw4w9WgXcQ', 'https://www.youtube.com/channel/UC123',
    'https://soundcloud.com/forss/flickermood', 'https://on.soundcloud.com/abc123', 'https://soundcloud.com/',
    'https://open.spotify.com/track/123', 'radio.example.nl/stream.mp3', 'ftp://x.nl/a.mp3', 'geen adres hier', '', 'zomaar', 'http://localhost:8000/radio'
  ].map((u) => { const a = muziekAdres(u); return [a.soort, a.id || '', a.list || '']; }));
  const verwacht = [
    ['youtube', 'dQw4w9WgXcQ', ''], ['youtube', 'dQw4w9WgXcQ', ''],
    ['youtube', 'dQw4w9WgXcQ', 'RDAMVMdQw4w9WgXcQ'], ['youtube', '', 'PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG'],
    ['youtube', 'dQw4w9WgXcQ', ''], ['fout', '', ''],
    ['soundcloud', '', ''], ['soundcloud', '', ''], ['fout', '', ''],
    ['fout', '', ''], ['stream', '', ''], ['fout', '', ''], ['fout', '', ''], ['leeg', '', ''], ['fout', '', ''], ['stream', '', '']];
  r.forEach((x, i) => check(`adres ${i + 1}: ${verwacht[i][0]}`, JSON.stringify(x) === JSON.stringify(verwacht[i]), x));

  console.log('2. Instellingen: bron kiezen en adres invullen');
  await p.evaluate(() => { openEditor(); });
  await p.click('#panel button[data-tab="saver"]');
  check('adresveld verborgen bij een bestand', await p.evaluate(() => $('#svMuziekUrlVelden').classList.contains('hidden')));
  await p.selectOption('#svMuziekBron', 'url');
  check('adresveld zichtbaar, bestandskeuze weg', await p.evaluate(() =>
    !$('#svMuziekUrlVelden').classList.contains('hidden') && $('#svMuziekBestandVelden').classList.contains('hidden')));
  await p.fill('#svMuziekUrl', 'https://open.spotify.com/track/123');
  check('Spotify krijgt uitleg waarom niet', (await p.textContent('#svMuziekUrlSoort')).includes('30 seconden'));
  await p.fill('#svMuziekUrl', 'soundcloud.com/forss/kort-nummer');
  check('SoundCloud herkend tijdens het typen', (await p.textContent('#svMuziekUrlSoort')) === 'SoundCloud herkend.');
  await p.press('#svMuziekUrl', 'Tab');
  const mz = await p.evaluate(() => ({ ...config.screensaver.muziek }));
  check('adres bewaard met https:// ervoor, muziek aan', mz.url === 'https://soundcloud.com/forss/kort-nummer' && mz.aan && mz.bron === 'url', mz);
  check('uitleg noemt SoundCloud en internet', await p.evaluate(() => {
    renderMuziekNote(); const s = $('#svMuziekNote').textContent;
    return s.includes('De muziek van SoundCloud speelt doorlopend') && s.includes('internet nodig'); }));
  await p.evaluate(() => closeEditor());

  // Een video voor de playlist, anders start de screensaver niet.
  await p.setInputFiles('#mediaInput', [path.join(MEDIA, 'clip.webm')]);
  await tot(p, () => mediaCache.size === 1);
  await p.evaluate(() => { const v = [...mediaCache.values()][0];
    Object.assign(config.screensaver, { enabled: true, mediaIds: [v.id], sound: false }); save(); });

  console.log('3. SoundCloud (kort nummer, 4 s)');
  await p.evaluate(() => enterSaver());
  check('speelt via de widget', await tot(p, () => Muziek.speelt, 4000));
  let f = speler('w.soundcloud.com');
  const scLog = await f.evaluate(() => log.slice());
  const iScVol = scLog.findIndex((x) => x.startsWith('setVolume'));
  check('eerst het volume, dan pas play', iScVol >= 0 && iScVol < scLog.indexOf('play'), scLog.slice(0, 9));
  await wacht(2000);
  const scVol = await f.evaluate(() => stand().vol);
  check('volume ingefaded naar 60', scVol === 60, scVol);
  check('na het einde weer vooraan (doorlopend)', await tot(p, () => Muziek.speelt && Muziek.positie < 1.5, 6000));
  await p.evaluate(() => exitSaver());
  check('stil na aanraken', await tot(p, () => !Muziek.speelt, 1500));
  check('widget gepauzeerd', await (async () => {
    const e = Date.now() + 2000; while (Date.now() < e) { if (!(await f.evaluate(() => stand().playing))) return true; await wacht(100); } return false; })());
  await p.evaluate(() => { config.screensaver.muziek.modus = 'once'; save(); enterSaver(); });
  check('één keer: speelt', await tot(p, () => Muziek.speelt, 4000));
  const okEen = await tot(p, () => !Muziek.speelt && Muziek.klaar, 7000);
  check('één keer: daarna stil', okEen, okEen ? undefined : { muziek: await p.evaluate(() => ({ speelt: Muziek.speelt, klaar: Muziek.klaar, pos: Muziek.positie, vol: Muziek.volume })), widget: await f.evaluate(() => ({ ...stand(), log: log.slice(-12) })) });
  await wacht(1500);
  check('één keer: blijft stil', !(await p.evaluate(() => Muziek.speelt)));
  await p.evaluate(() => exitSaver());

  console.log('4. YouTube (kort, 4 s)');
  await p.evaluate(() => { Object.assign(config.screensaver.muziek, { url: 'https://youtu.be/kortkortkor', modus: 'pauze', pauzeMin: 2 }); save(); });
  await wacht(300);
  check('SoundCloud-speler opgeruimd', !speler('w.soundcloud.com'));
  await p.evaluate(() => enterSaver());
  check('speelt via de embed', await tot(p, () => Muziek.speelt, 5000));
  f = speler('youtube-nocookie.com/embed');
  const ytLog = await f.evaluate(() => log.slice());
  const iVol = ytLog.findIndex((x) => x.startsWith('setVolume')), iPlay = ytLog.indexOf('playVideo');
  check('eerst volume, dan playVideo', iVol >= 0 && iVol < iPlay, ytLog.slice(0, 8));
  check('embed-adres klopt', f.url().startsWith('https://www.youtube-nocookie.com/embed/kortkortkor?') && f.url().includes('enablejsapi=1'), f.url());
  check('na het einde: pauze van 2 minuten', await tot(p, () => !Muziek.speelt && Muziek.wachtTot - Date.now() > 110000, 7000));
  await wacht(1000);
  check('blijft stil tijdens de pauze', !(await p.evaluate(() => Muziek.speelt)) && (await f.evaluate(() => stand().state)) !== 1);
  await p.evaluate(() => exitSaver());
  await p.evaluate(() => { Object.assign(config.screensaver.muziek, { url: 'https://www.youtube.com/watch?v=langlanglan', modus: 'loop' });
    config.screensaver.background = true; save(); syncBackgroundRotator(); });
  check('achtergrondmodus: speelt', await tot(p, () => Muziek.speelt, 5000));
  await wacht(1500);
  f = speler('youtube-nocookie.com/embed');
  const vid = await p.evaluate(() => [...mediaCache.values()][0].id);
  await p.evaluate((id) => playMedia(id), vid);
  check('knopvideo: YouTube zwijgt', await tot(p, () => !Muziek.speelt, 1500));
  check('knopvideo: speler echt gepauzeerd', await tot(p, () => true, 1) && await (async () => {
    const e = Date.now() + 2000; while (Date.now() < e) { if ((await f.evaluate(() => stand().state)) === 2) return true; await wacht(100); } return false; })());
  const tPauze = await f.evaluate(() => stand().t);
  await p.evaluate(() => stopPlaying());
  check('daarna verder waar hij was', await tot(p, () => Muziek.speelt, 3000) && (await f.evaluate(() => stand().t)) >= tPauze - 0.2 && tPauze > 1, tPauze);
  await p.evaluate(() => { config.screensaver.background = false; save(); syncBackgroundRotator(); });
  check('uit met de achtergrondmodus', await tot(p, () => !Muziek.speelt, 1500));
  check('browserversie waarschuwt voor YouTube', await p.evaluate(() => { renderMuziekNote(); return $('#svMuziekNote').textContent.includes('Windows-app werkt het wel'); }));

  console.log('5. Directe stream');
  await p.evaluate((u) => { Object.assign(config.screensaver.muziek, { url: u, modus: 'loop' }); save(); enterSaver(); }, STREAM);
  check('stream speelt', await tot(p, () => Muziek.speelt && Muziek.soort === 'stream', 5000));
  check('YouTube-speler opgeruimd', !speler('youtube-nocookie.com/embed'));
  await p.evaluate(() => exitSaver());
  check('stream stil na aanraken', await tot(p, () => !Muziek.speelt, 1500));
  const t1 = await p.evaluate((u) => Muziek.test(u, 10), STREAM);
  check('build-test op een stream', t1.speelde && t1.loopt && t1.pauze && t1.staatStil && t1.hervat && t1.naarBegin, t1);
  const t2 = await p.evaluate(() => Muziek.test('https://soundcloud.com/forss/lang-nummer', 10));
  check('build-test op (nagebootst) SoundCloud', t2.speelde && t2.loopt && t2.pauze && t2.staatStil && t2.hervat && t2.naarBegin, t2);
  const t3 = await p.evaluate(() => Muziek.test('https://youtu.be/langlanglan', 10));
  check('build-test op (nagebootst) YouTube', t3.speelde && t3.loopt && t3.pauze && t3.staatStil && t3.hervat && t3.naarBegin, t3);
  const t4 = await p.evaluate(() => Muziek.test('http://127.0.0.1:1/bestaat-niet.mp3', 4));
  check('build-test meldt een onbereikbare stream', !t4.speelde && /niet bereikbaar/.test(t4.fout), t4);
  check('testspelers opgeruimd', await p.evaluate(() => !$('#muziekLaag') || $('#muziekLaag').children.length === 0));

  console.log('6. Terug naar een bestand');
  await p.evaluate(() => { config.screensaver.muziek.bron = 'bestand'; save(); });
  await wacht(300);
  check('zonder nummer: geen muziek, geen fout', !(await p.evaluate(() => Muziek.speelt)));

  check('geen JS-fouten', errs.length === 0, errs.slice(0, 3));
  console.log(`\n${fout ? 'FOUT' : 'OK  '}: ${ok}/${ok + fout}`);
  await b.close(); srv.close();
  process.exit(fout ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
