// HereWeHolo CMS — vanilla JS, geen build-stap nodig.
'use strict';

/* ---------- API-helper ---------- */
async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: opts.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body instanceof FormData ? opts.body : opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (res.status === 401) { showLogin(); throw new Error('Niet ingelogd'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Fout ${res.status}`);
  return data;
}

const $ = (sel) => document.querySelector(sel);
const el = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null) node.setAttribute(k, v);
  }
  for (const c of children.flat()) if (c != null) node.append(c.nodeType ? c : document.createTextNode(c));
  return node;
};

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2600);
}

function copy(text) {
  navigator.clipboard?.writeText(text).then(() => toast('Gekopieerd')).catch(() => prompt('Kopieer handmatig:', text));
}

function fmtSize(bytes) {
  if (bytes > 1e9) return (bytes / 1e9).toFixed(2) + ' GB';
  if (bytes > 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
  return Math.round(bytes / 1e3) + ' kB';
}

function fmtAgo(ts) {
  if (!ts) return 'nooit';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 90) return s + 's geleden';
  if (s < 5400) return Math.round(s / 60) + ' min geleden';
  if (s < 129600) return Math.round(s / 3600) + ' uur geleden';
  return Math.round(s / 86400) + ' dagen geleden';
}

/* ---------- Login & sessies ---------- */
function showLogin() {
  $('#loginView').classList.remove('hidden');
  $('#appView').classList.add('hidden');
}

async function boot() {
  const s = await fetch('/api/session').then((r) => r.json());
  if (s.authed) return showApp(s.defaultPassword);
  showLogin();
}

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const r = await api('/api/login', { method: 'POST', body: { password: $('#loginPassword').value } });
    showApp(r.defaultPassword);
  } catch (err) {
    $('#loginError').textContent = err.message;
  }
});

$('#logoutBtn').addEventListener('click', async () => {
  await api('/api/logout', { method: 'POST' });
  location.reload();
});

function showApp(defaultPassword) {
  $('#loginView').classList.add('hidden');
  $('#appView').classList.remove('hidden');
  $('#passwordWarning').classList.toggle('hidden', !defaultPassword);
  connectAdminWs();
  loadDevices();
  loadMedia('');
  loadPlaylists();
  loadLive();
  loadIntegration();
  loadSettings();
}

/* ---------- Tabs ---------- */
document.querySelectorAll('.sidebar nav button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sidebar nav button').forEach((b) => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('hidden', t.id !== 'tab-' + btn.dataset.tab));
    if (btn.dataset.tab === 'integratie') loadIntegration();
    if (btn.dataset.tab === 'dashboard') loadDevices();
  });
});

/* ---------- Admin-WebSocket (live status) ---------- */
let adminWs;
function connectAdminWs() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  adminWs = new WebSocket(`${proto}://${location.host}/ws?role=admin`);
  adminWs.onopen = () => $('#connState').classList.add('online');
  adminWs.onclose = () => { $('#connState').classList.remove('online'); setTimeout(connectAdminWs, 4000); };
  adminWs.onmessage = () => loadDevices(); // elke device-event: lijst verversen
}

/* ---------- Devices ---------- */
let playlistsCache = [];

async function loadDevices() {
  const [devices, playlists] = await Promise.all([api('/api/devices'), api('/api/playlists')]);
  playlistsCache = playlists;
  const wrap = $('#deviceList');
  wrap.innerHTML = '';
  if (!devices.length) {
    wrap.append(el('p', { class: 'muted' }, 'Nog geen holoboxen. Voeg er één toe — je krijgt dan een player-URL en device-key voor de box.'));
  }
  for (const d of devices) wrap.append(deviceCard(d));
}

function deviceCard(d) {
  const playerUrl = `${location.origin}/player/${d.key}`;
  const plSelect = el('select', {
    onchange: async (e) => { await api(`/api/devices/${d.id}`, { method: 'PUT', body: { playlistId: e.target.value || null } }); toast('Playlist gekoppeld'); }
  },
    el('option', { value: '' }, '— geen playlist —'),
    playlistsCache.map((p) => { const o = el('option', { value: p.id }, p.name); if (p.id === d.playlistId) o.selected = true; return o; })
  );
  const orSelect = el('select', {
    onchange: async (e) => { await api(`/api/devices/${d.id}`, { method: 'PUT', body: { orientation: e.target.value } }); toast('Oriëntatie aangepast'); }
  },
    el('option', { value: 'portrait' }, 'Portrait (2160×3840)'),
    el('option', { value: 'landscape' }, 'Landscape (3840×2160)')
  );
  orSelect.value = d.orientation;
  const rotSelect = el('select', {
    onchange: async (e) => { await api(`/api/devices/${d.id}`, { method: 'PUT', body: { rotation: Number(e.target.value) } }); toast('Rotatie aangepast'); }
  }, [0, 90, 180, 270].map((r) => { const o = el('option', { value: r }, r + '°'); if ((d.rotation || 0) === r) o.selected = true; return o; }));

  const cmd = (command) => async () => { const r = await api(`/api/devices/${d.id}/command`, { method: 'POST', body: { command } }); toast(r.delivered ? 'Verzonden' : 'Box is offline'); };

  return el('div', { class: 'card' },
    el('h3', {},
      el('span', { class: 'status-dot' + (d.online ? ' online' : '') }),
      el('span', {
        contenteditable: 'plaintext-only',
        onblur: async (e) => { const name = e.target.textContent.trim(); if (name && name !== d.name) { await api(`/api/devices/${d.id}`, { method: 'PUT', body: { name } }); toast('Naam opgeslagen'); } }
      }, d.name)
    ),
    el('dl', { class: 'kv' },
      el('dt', {}, 'Status'), el('dd', {}, d.online ? 'Online' : `Offline (laatst gezien: ${fmtAgo(d.lastSeen)})`),
      el('dt', {}, 'IP-adres'), el('dd', {}, d.lastIp || 'onbekend'),
      el('dt', {}, 'Speelt nu'), el('dd', {}, d.nowPlaying ? `${d.nowPlaying.name} (${d.nowPlaying.type})` : '—'),
      el('dt', {}, 'Playlist'), el('dd', {}, plSelect),
      el('dt', {}, 'Oriëntatie'), el('dd', {}, orSelect),
      el('dt', {}, 'Paneelrotatie'), el('dd', {}, rotSelect),
      el('dt', {}, 'Locatie'), el('dd', {}, el('input', {
        value: d.location || '', placeholder: 'bijv. showroom Amsterdam',
        onchange: async (e) => { await api(`/api/devices/${d.id}`, { method: 'PUT', body: { location: e.target.value } }); toast('Locatie opgeslagen'); }
      })),
      el('dt', {}, 'Externe endpoint'), el('dd', {}, el('input', {
        value: d.externalEndpoint || '', placeholder: 'https://… (optioneel, eigen content-API)',
        onchange: async (e) => { await api(`/api/devices/${d.id}`, { method: 'PUT', body: { externalEndpoint: e.target.value || null } }); toast('Endpoint opgeslagen'); }
      }))
    ),
    el('div', { class: 'copy-line' }, el('span', { class: 'grow' }, playerUrl), el('button', { class: 'btn small', onclick: () => copy(playerUrl) }, 'Kopieer')),
    el('div', { class: 'actions' },
      el('button', { class: 'btn small', onclick: () => window.open(playerUrl, '_blank') }, '▶ Preview'),
      el('button', { class: 'btn small', onclick: cmd('identify') }, 'Identificeer'),
      el('button', { class: 'btn small', onclick: cmd('refresh') }, 'Ververs content'),
      el('button', { class: 'btn small', onclick: cmd('reload') }, 'Herstart player'),
      el('button', { class: 'btn small', onclick: cmd('black') }, 'Scherm zwart aan/uit'),
      el('button', { class: 'btn small danger', onclick: async () => { if (confirm(`Holobox "${d.name}" verwijderen?`)) { await api(`/api/devices/${d.id}`, { method: 'DELETE' }); loadDevices(); } } }, 'Verwijderen')
    )
  );
}

$('#addDeviceBtn').addEventListener('click', async () => {
  const name = prompt('Naam van de holobox:', 'Holobox showroom');
  if (!name) return;
  await api('/api/devices', { method: 'POST', body: { name } });
  loadDevices();
  toast('Holobox toegevoegd');
});

/* ---------- Media ---------- */
let currentFolder = '';

async function loadMedia(folder) {
  currentFolder = folder;
  const data = await api('/api/media?folder=' + encodeURIComponent(folder));
  const list = $('#folderList');
  list.innerHTML = '';
  document.querySelectorAll('.folder-item.root').forEach((r) => r.classList.toggle('active', folder === ''));
  for (const f of data.folders) {
    const depth = f.split('/').length - 1;
    const item = el('div', { class: 'folder-item' + (f === folder ? ' active' : ''), style: `padding-left:${0.7 + depth * 0.9}rem` },
      el('span', { onclick: () => loadMedia(f) }, '📁 ' + f.split('/').pop()),
      el('span', { class: 'del', title: 'Map verwijderen', onclick: async (e) => { e.stopPropagation(); if (confirm(`Map "${f}" en alle inhoud verwijderen?`)) { await api('/api/media?path=' + encodeURIComponent(f), { method: 'DELETE' }); loadMedia(''); } } }, '✕')
    );
    list.append(item);
  }
  const tbody = $('#fileTable tbody');
  tbody.innerHTML = '';
  $('#fileEmpty').classList.toggle('hidden', data.files.length > 0);
  $('#fileTable').classList.toggle('hidden', data.files.length === 0);
  for (const f of data.files) {
    const thumb = f.kind === 'image'
      ? el('img', { class: 'thumb', src: f.url, loading: 'lazy' })
      : el('video', { class: 'thumb', src: f.url + '#t=1', preload: 'metadata', muted: '' });
    tbody.append(el('tr', {},
      el('td', {}, thumb),
      el('td', {}, f.name),
      el('td', {}, f.kind === 'video' ? '🎬 Video' : '🖼️ Afbeelding'),
      el('td', {}, fmtSize(f.size)),
      el('td', {}, el('div', { class: 'row' },
        el('button', { class: 'btn small', onclick: () => window.open(f.url, '_blank') }, 'Bekijk'),
        el('button', { class: 'btn small danger', onclick: async () => { if (confirm(`"${f.name}" verwijderen?`)) { await api('/api/media?path=' + encodeURIComponent(f.path), { method: 'DELETE' }); loadMedia(currentFolder); } } }, 'Verwijder')
      ))
    ));
  }
}

document.querySelector('.folder-item.root').addEventListener('click', () => loadMedia(''));

$('#newFolderBtn').addEventListener('click', async () => {
  const name = prompt('Naam van de nieuwe map' + (currentFolder ? ` (binnen "${currentFolder}")` : '') + ':');
  if (!name) return;
  await api('/api/media/folder', { method: 'POST', body: { path: (currentFolder ? currentFolder + '/' : '') + name } });
  loadMedia(currentFolder);
});

$('#uploadInput').addEventListener('change', (e) => {
  const files = [...e.target.files];
  if (!files.length) return;
  const fd = new FormData();
  for (const f of files) fd.append('files', f);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/media/upload?folder=' + encodeURIComponent(currentFolder));
  $('#uploadProgress').classList.remove('hidden');
  xhr.upload.onprogress = (ev) => {
    const pct = Math.round((ev.loaded / ev.total) * 100);
    $('#uploadBar').style.width = pct + '%';
    $('#uploadText').textContent = `Uploaden… ${pct}% (${files.length} bestand${files.length > 1 ? 'en' : ''})`;
  };
  xhr.onload = () => {
    $('#uploadProgress').classList.add('hidden');
    $('#uploadBar').style.width = '0%';
    e.target.value = '';
    if (xhr.status === 200) { toast('Upload voltooid'); loadMedia(currentFolder); }
    else toast('Upload mislukt');
  };
  xhr.onerror = () => { $('#uploadProgress').classList.add('hidden'); toast('Upload mislukt'); };
  xhr.send(fd);
});

/* ---------- Playlists ---------- */
let currentPlaylist = null;

async function loadPlaylists() {
  const playlists = await api('/api/playlists');
  playlistsCache = playlists;
  const list = $('#playlistList');
  list.innerHTML = '';
  for (const p of playlists) {
    list.append(el('div', { class: 'folder-item' + (currentPlaylist?.id === p.id ? ' active' : ''), onclick: () => openPlaylist(p.id) },
      el('span', {}, '🎞️ ' + p.name),
      el('span', { class: 'del', onclick: async (e) => { e.stopPropagation(); if (confirm(`Playlist "${p.name}" verwijderen?`)) { await api(`/api/playlists/${p.id}`, { method: 'DELETE' }); currentPlaylist = null; $('#playlistEditor').textContent = 'Selecteer of maak een playlist.'; loadPlaylists(); } } }, '✕')
    ));
  }
}

$('#addPlaylistBtn').addEventListener('click', async () => {
  const name = prompt('Naam van de playlist:', 'Presentatie');
  if (!name) return;
  const p = await api('/api/playlists', { method: 'POST', body: { name } });
  await loadPlaylists();
  openPlaylist(p.id);
});

async function openPlaylist(id) {
  const playlists = await api('/api/playlists');
  currentPlaylist = playlists.find((p) => p.id === id);
  loadPlaylists();
  renderPlaylistEditor();
}

async function savePlaylist() {
  currentPlaylist = await api(`/api/playlists/${currentPlaylist.id}`, { method: 'PUT', body: currentPlaylist });
  toast('Playlist opgeslagen — spelende boxen verversen automatisch');
  renderPlaylistEditor();
  loadPlaylists();
}

function renderPlaylistEditor() {
  const p = currentPlaylist;
  const pane = $('#playlistEditor');
  pane.classList.remove('muted');
  pane.innerHTML = '';

  pane.append(el('div', { class: 'row', style: 'margin-bottom:1rem' },
    el('input', { value: p.name, style: 'max-width:280px', onchange: (e) => { p.name = e.target.value; savePlaylist(); } }),
    el('label', { class: 'row', style: 'flex-direction:row;align-items:center' },
      el('input', { type: 'checkbox', style: 'width:auto', ...(p.loop !== false ? { checked: '' } : {}), onchange: (e) => { p.loop = e.target.checked; savePlaylist(); } }),
      ' Loop (blijven herhalen)')
  ));

  if (!p.items.length) pane.append(el('p', { class: 'muted' }, 'Nog geen items. Voeg hieronder video\'s, afbeeldingen, live streams of URL\'s toe.'));

  p.items.forEach((item, i) => {
    const icon = { video: '🎬', image: '🖼️', live: '📡', url: '🌐' }[item.type] || '❓';
    pane.append(el('div', { class: 'pl-item' },
      el('span', {}, `${i + 1}. ${icon}`),
      el('div', { class: 'grow' },
        el('div', { class: 'name' }, item.name || item.mediaPath || item.url || item.liveSourceId),
        el('div', { class: 'meta' }, item.type + (item.mediaPath ? ' · ' + item.mediaPath : '') + (item.url ? ' · ' + item.url : ''))
      ),
      el('input', { class: 'dur', type: 'number', min: 0, placeholder: 'sec', title: 'Tijdsduur in seconden (leeg = hele video / blijf op stream)', value: item.durationSec || '', onchange: (e) => { item.durationSec = Number(e.target.value) || null; savePlaylist(); } }),
      el('select', { class: 'fit', title: 'Beeldvulling', onchange: (e) => { item.fit = e.target.value; savePlaylist(); } },
        ['cover', 'contain'].map((f) => { const o = el('option', { value: f }, f === 'cover' ? 'Vullend' : 'Passend' ); if ((item.fit || 'cover') === f) o.selected = true; return o; })),
      el('button', { class: 'btn small', title: 'Omhoog', onclick: () => { if (i > 0) { [p.items[i - 1], p.items[i]] = [p.items[i], p.items[i - 1]]; savePlaylist(); } } }, '↑'),
      el('button', { class: 'btn small', title: 'Omlaag', onclick: () => { if (i < p.items.length - 1) { [p.items[i + 1], p.items[i]] = [p.items[i], p.items[i + 1]]; savePlaylist(); } } }, '↓'),
      el('button', { class: 'btn small danger', onclick: () => { p.items.splice(i, 1); savePlaylist(); } }, '✕')
    ));
  });

  pane.append(el('div', { class: 'pl-add' },
    el('button', { class: 'btn', onclick: addMediaItem }, '+ Media uit bibliotheek'),
    el('button', { class: 'btn', onclick: addLiveItem }, '+ Live-bron'),
    el('button', { class: 'btn', onclick: addUrlItem }, '+ Web-URL / eigen presentatie')
  ));
}

async function addMediaItem() {
  const folders = ['', ...(await api('/api/media')).folders];
  const all = [];
  for (const f of folders) {
    const d = await api('/api/media?folder=' + encodeURIComponent(f));
    all.push(...d.files);
  }
  if (!all.length) return toast('Geen media — upload eerst bestanden in Media & mappen');
  const choice = prompt('Kies een bestand (nummer):\n' + all.map((f, i) => `${i + 1}. ${f.path}`).join('\n'));
  const file = all[Number(choice) - 1];
  if (!file) return;
  currentPlaylist.items.push({ type: file.kind, name: file.name, mediaPath: file.path, fit: 'cover' });
  savePlaylist();
}

async function addLiveItem() {
  const sources = await api('/api/live-sources');
  if (!sources.length) return toast('Geen live-bronnen — maak er eerst één aan op het tabblad Live-bronnen');
  const choice = prompt('Kies een live-bron (nummer):\n' + sources.map((s, i) => `${i + 1}. ${s.name} (${s.protocol})`).join('\n'));
  const src = sources[Number(choice) - 1];
  if (!src) return;
  currentPlaylist.items.push({ type: 'live', name: src.name, liveSourceId: src.id, fit: 'cover' });
  savePlaylist();
}

function addUrlItem() {
  const url = prompt('Web-URL (bijv. de eigen holobox-presentatie van de klant):', 'https://');
  if (!url || url === 'https://') return;
  const durationSec = Number(prompt('Tijdsduur in seconden (leeg = blijf op deze pagina):', '')) || null;
  currentPlaylist.items.push({ type: 'url', name: url, url, durationSec });
  savePlaylist();
}

/* ---------- Live-bronnen ---------- */
async function loadLive() {
  const sources = await api('/api/live-sources');
  const wrap = $('#liveList');
  wrap.innerHTML = '';
  for (const s of sources) wrap.append(liveCard(s));
}

function liveCard(s) {
  return el('div', { class: 'card' },
    el('h3', {}, '📡 ', s.name),
    el('dl', { class: 'kv' },
      el('dt', {}, 'Protocol'), el('dd', {}, protocolSelect(s)),
      el('dt', {}, 'Stream-URL'), el('dd', {}, el('input', { value: s.url, onchange: async (e) => { await api(`/api/live-sources/${s.id}`, { method: 'PUT', body: { url: e.target.value } }); toast('Opgeslagen'); } })),
      el('dt', {}, 'Notities'), el('dd', {}, el('input', { value: s.notes || '', placeholder: 'bijv. OBS → MediaMTX kanaal 1', onchange: async (e) => { await api(`/api/live-sources/${s.id}`, { method: 'PUT', body: { notes: e.target.value } }); toast('Opgeslagen'); } }))
    ),
    el('div', { class: 'actions' },
      el('button', { class: 'btn small danger', onclick: async () => { if (confirm(`Live-bron "${s.name}" verwijderen?`)) { await api(`/api/live-sources/${s.id}`, { method: 'DELETE' }); loadLive(); } } }, 'Verwijderen')
    )
  );
}

function protocolSelect(s) {
  const sel = el('select', { onchange: async (e) => { await api(`/api/live-sources/${s.id}`, { method: 'PUT', body: { protocol: e.target.value } }); toast('Opgeslagen'); } },
    el('option', { value: 'hls' }, 'HLS (.m3u8) — universeel, ±5-20s vertraging'),
    el('option', { value: 'whep' }, 'WHEP / WebRTC — laagste latency (<1s)'),
    el('option', { value: 'webrtc-page' }, 'WebRTC-pagina (iframe, bijv. meetlink)'),
    el('option', { value: 'mjpeg' }, 'MJPEG (IP-camera)')
  );
  sel.value = s.protocol;
  return sel;
}

$('#addLiveBtn').addEventListener('click', async () => {
  const name = prompt('Naam van de live-bron:', 'Livestream studio');
  if (!name) return;
  const url = prompt('Stream-URL (bijv. https://…/stream.m3u8 of https://…/whep):');
  if (!url) return;
  const protocol = url.includes('.m3u8') ? 'hls' : url.toLowerCase().includes('whep') ? 'whep' : 'hls';
  await api('/api/live-sources', { method: 'POST', body: { name, url, protocol } });
  loadLive();
  toast('Live-bron toegevoegd');
});

/* ---------- Integratie ---------- */
async function loadIntegration() {
  const [sys, devices] = await Promise.all([api('/api/system'), api('/api/devices')]);
  const wrap = $('#integrationInfo');
  wrap.innerHTML = '';

  wrap.append(el('div', { class: 'int-block' },
    el('h3', {}, '🌐 Netwerk & poorten'),
    el('dl', { class: 'kv' },
      el('dt', {}, 'Hostnaam'), el('dd', {}, sys.hostname),
      el('dt', {}, 'Poort'), el('dd', {}, String(sys.port) + ' (HTTP + WebSocket op hetzelfde poortnummer)'),
      el('dt', {}, 'Basis-URL'), el('dd', {}, sys.baseUrl),
      ...sys.interfaces.flatMap((i) => [el('dt', {}, `IP (${i.interface})`), el('dd', {}, el('span', { class: 'copy-line' }, `http://${i.address}:${sys.port}`, el('button', { class: 'btn small', onclick: () => copy(`http://${i.address}:${sys.port}`) }, 'Kopieer')))])
    ),
    el('p', { class: 'muted' }, 'Zet voor gebruik buiten het lokale netwerk een reverse proxy met HTTPS (bijv. Caddy of nginx) voor deze poort, en configureer PUBLIC_BASE_URL in .env.')
  ));

  const devBlock = el('div', { class: 'int-block' }, el('h3', {}, '🔑 Endpoints per holobox'));
  if (!devices.length) devBlock.append(el('p', { class: 'muted' }, 'Nog geen holoboxen aangemaakt.'));
  for (const d of devices) {
    devBlock.append(
      el('h3', { style: 'margin-top:0.9rem;font-size:0.95rem' }, d.name),
      el('div', { class: 'copy-line' }, el('span', {}, 'Player: ', `${sys.baseUrl}/player/${d.key}`), el('button', { class: 'btn small', onclick: () => copy(`${sys.baseUrl}/player/${d.key}`) }, 'Kopieer')),
      el('div', { class: 'copy-line' }, el('span', {}, 'Manifest (JSON): ', `${sys.baseUrl}/api/v1/manifest/${d.key}`), el('button', { class: 'btn small', onclick: () => copy(`${sys.baseUrl}/api/v1/manifest/${d.key}`) }, 'Kopieer'))
    );
  }
  wrap.append(devBlock);

  wrap.append(el('div', { class: 'int-block' },
    el('h3', {}, '🔌 Eigen presentatie koppelen (custom endpoint)'),
    el('p', {}, 'Er zijn drie manieren om een eigen holobox-presentatie te integreren:'),
    el('pre', {}, `1. WEB-URL IN PLAYLIST (simpelst)
   Voeg in een playlist een "Web-URL" item toe dat naar de eigen
   presentatie wijst. De player toont die fullscreen (4K, portrait
   of landscape).

2. EXTERNE ENDPOINT PER HOLOBOX (Portl "Cloud Persona"-stijl)
   Zet bij een holobox een "Externe endpoint"-URL. De player haalt
   daar de playlist op i.p.v. uit dit CMS. De endpoint moet JSON
   teruggeven in dit formaat:

   { "items": [
       { "type": "video", "url": "https://…/film.mp4", "fit": "cover" },
       { "type": "live", "protocol": "hls", "url": "https://…/live.m3u8" },
       { "type": "url", "url": "https://…/presentatie", "durationSec": 60 }
   ] }

   Valt de endpoint weg, dan speelt de box automatisch de lokale
   playlist als fallback.

3. MANIFEST PULL DOOR EXTERNE PLAYER (eigen hardware/software)
   Een box van een andere leverancier pollt het manifest-endpoint
   hierboven en speelt de items zelf af. Alle media-URL's zijn
   absoluut en CORS staat open voor /media en /api/v1.`),
    el('p', { class: 'muted' }, 'Volledige protocolbeschrijving: docs/INTEGRATIE.md in de repository.')
  ));

  wrap.append(el('div', { class: 'int-block' },
    el('h3', {}, '📡 Live streamen naar de holobox'),
    el('pre', {}, `LAGE LATENCY (aanbevolen, <1s): WebRTC via MediaMTX
  1. Draai MediaMTX (gratis) op een server: poorten 8889/tcp (WHEP),
     8890/udp (SRT), 1935/tcp (RTMP).
  2. Stuur vanuit OBS/vMix/camera: rtmp://<server>/live of SRT.
  3. Maak hier een live-bron met protocol WHEP en URL:
     http://<server>:8889/live/whep

STANDAARD (5-20s): HLS
  1. Stream naar een HLS-dienst (Mux, Cloudflare Stream, YouTube
     is niet geschikt) of MediaMTX met HLS aan (poort 8888).
  2. Maak hier een live-bron met protocol HLS en de .m3u8-URL.

TIP 4K: gebruik H.265/HEVC of H.264 High@L5.1, 20-40 Mbps voor
fixed content; voor live 4K minimaal 15 Mbps upload.`)
  ));
}

/* ---------- Instellingen ---------- */
async function loadSettings() {
  const s = await api('/api/settings');
  const f = $('#settingsForm');
  f.platformName.value = s.platformName;
  f.pollIntervalSec.value = s.pollIntervalSec;
  f.transitionMs.value = s.transitionMs;
  f.defaultOrientation.value = s.defaultOrientation;
}

$('#settingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  await api('/api/settings', { method: 'PUT', body: {
    platformName: f.platformName.value,
    pollIntervalSec: Number(f.pollIntervalSec.value),
    transitionMs: Number(f.transitionMs.value),
    defaultOrientation: f.defaultOrientation.value
  } });
  toast('Instellingen opgeslagen');
});

boot();
