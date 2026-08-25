// HereWeHolo 4K Player
// Draait fullscreen in een browser/kiosk op de holobox (Chromium-kiosk, Android,
// BrightSign-browser, etc.). Haalt zijn manifest op via de integratie-API en
// speelt fixed video, afbeeldingen, live streams (HLS/WHEP) en web-URL's af.
// Portrait en landscape werken automatisch; fysiek gedraaide panelen via rotation.
'use strict';

(() => {
  const deviceKey = location.pathname.split('/').filter(Boolean).pop();
  const stage = document.getElementById('stage');
  const layers = [document.getElementById('layerA'), document.getElementById('layerB')];
  const messageEl = document.getElementById('message');
  const messageText = document.getElementById('messageText');
  const identifyEl = document.getElementById('identify');
  const blackEl = document.getElementById('black');

  let manifest = null;
  let manifestJson = ''; // voor change-detectie
  let items = [];
  let index = -1;
  let activeLayer = 0;
  let itemTimer = null;
  let pollTimer = null;
  let ws = null;
  let hlsInstance = null;
  let pc = null; // WHEP RTCPeerConnection

  /* ---------- Manifest ophalen ---------- */

  async function fetchManifest() {
    const res = await fetch(`/api/v1/manifest/${deviceKey}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Manifest ${res.status}`);
    let mf = await res.json();

    // Externe endpoint van de klant (Portl-stijl custom endpoint): als die is
    // ingesteld, is dát de bron van de playlist. Bij fouten vallen we terug op
    // het lokale manifest zodat de box nooit zwart blijft.
    if (mf.externalEndpoint) {
      try {
        const ext = await fetch(mf.externalEndpoint, { cache: 'no-store' });
        if (ext.ok) {
          const extMf = await ext.json();
          if (Array.isArray(extMf.items)) mf = { ...mf, ...extMf, device: mf.device, externalEndpoint: mf.externalEndpoint };
        }
      } catch (e) {
        console.warn('Externe endpoint niet bereikbaar, lokale playlist actief', e);
      }
    }
    return mf;
  }

  async function refresh(force = false) {
    let mf;
    try {
      mf = await fetchManifest();
    } catch (e) {
      showMessage('Geen verbinding met het platform — opnieuw proberen…');
      return;
    }
    const json = JSON.stringify(mf.items) + JSON.stringify(mf.device) + mf.transitionMs;
    applyOrientation(mf.device);
    document.documentElement.style.setProperty('--transition', (mf.transitionMs || 600) + 'ms');

    if (!force && json === manifestJson) { manifest = mf; return; }
    manifestJson = json;
    manifest = mf;
    items = mf.items || [];
    index = -1;

    if (!items.length) {
      stopPlayback();
      showMessage(`Wachten op content… (device: ${mf.device.name})`);
      return;
    }
    hideMessage();
    next();
  }

  /* ---------- Oriëntatie & rotatie ---------- */

  function applyOrientation(device) {
    const rot = Number(device.rotation || 0) % 360;
    if (rot === 90 || rot === 270) {
      // Paneel is fysiek gedraaid: stage roteren en breedte/hoogte wisselen.
      stage.style.width = window.innerHeight + 'px';
      stage.style.height = window.innerWidth + 'px';
      stage.style.left = (window.innerWidth - window.innerHeight) / 2 + 'px';
      stage.style.top = (window.innerHeight - window.innerWidth) / 2 + 'px';
      stage.style.transform = `rotate(${rot}deg)`;
    } else {
      stage.style.width = '';
      stage.style.height = '';
      stage.style.left = '0';
      stage.style.top = '0';
      stage.style.transform = rot === 180 ? 'rotate(180deg)' : '';
    }
  }

  window.addEventListener('resize', () => manifest && applyOrientation(manifest.device));

  /* ---------- Afspelen ---------- */

  function next() {
    clearTimeout(itemTimer);
    if (!items.length) return;
    index = (index + 1) % items.length;
    if (index === 0 && manifest.playlist && manifest.playlist.loop === false && manifestPlayedOnce) {
      // Niet-loopende playlist: op laatste frame blijven staan.
      return;
    }
    playItem(items[index]);
  }
  let manifestPlayedOnce = false;

  function playItem(item) {
    const incoming = layers[1 - activeLayer];
    const outgoing = layers[activeLayer];
    cleanupLayer(incoming);
    incoming.className = 'layer fit-' + (item.fit || 'cover');

    const onReady = () => {
      incoming.classList.add('visible');
      outgoing.classList.remove('visible');
      activeLayer = 1 - activeLayer;
      const t = Number(manifest.transitionMs || 600);
      setTimeout(() => cleanupLayer(outgoing), t + 100);
      if (index === items.length - 1) manifestPlayedOnce = true;
      sendStatus(item);
    };

    switch (item.type) {
      case 'video': return playVideo(incoming, item, onReady);
      case 'image': return playImage(incoming, item, onReady);
      case 'live': return playLive(incoming, item, onReady);
      case 'url': return playUrl(incoming, item, onReady);
      default: return next();
    }
  }

  function makeVideo(item) {
    const v = document.createElement('video');
    v.autoplay = true;
    v.muted = item.muted !== false;
    v.playsInline = true;
    v.preload = 'auto';
    v.disableRemotePlayback = true;
    return v;
  }

  function playVideo(layer, item, onReady) {
    const v = makeVideo(item);
    v.src = item.url;
    layer.appendChild(v);
    v.addEventListener('canplay', onReady, { once: true });
    v.addEventListener('error', () => scheduleSkip(item), { once: true });
    if (item.durationSec) {
      itemTimer = setTimeout(next, item.durationSec * 1000);
      v.loop = true; // binnen de tijdsduur blijven loopen
    } else {
      v.addEventListener('ended', next, { once: true });
    }
    v.play().catch(() => {});
  }

  function playImage(layer, item, onReady) {
    const img = new Image();
    img.src = item.url;
    layer.appendChild(img);
    img.addEventListener('load', onReady, { once: true });
    img.addEventListener('error', () => scheduleSkip(item), { once: true });
    itemTimer = setTimeout(next, (item.durationSec || 10) * 1000);
  }

  function playLive(layer, item, onReady) {
    const v = makeVideo(item);
    layer.appendChild(v);

    if (item.protocol === 'hls') {
      if (window.Hls && Hls.isSupported()) {
        hlsInstance = new Hls({ lowLatencyMode: item.lowLatency !== false, backBufferLength: 30 });
        hlsInstance.loadSource(item.url);
        hlsInstance.attachMedia(v);
        hlsInstance.on(Hls.Events.ERROR, (ev, data) => {
          if (data.fatal) {
            // Live streams vallen wel eens weg: blijven herproberen.
            setTimeout(() => hlsInstance && hlsInstance.loadSource(item.url), 3000);
          }
        });
      } else {
        v.src = item.url; // Safari/native HLS
      }
      v.addEventListener('playing', onReady, { once: true });
      v.play().catch(() => {});
    } else if (item.protocol === 'whep' || item.protocol === 'webrtc') {
      startWhep(v, item, onReady);
    } else if (item.protocol === 'mjpeg') {
      layer.removeChild(v);
      const img = new Image();
      img.src = item.url;
      layer.appendChild(img);
      img.addEventListener('load', onReady, { once: true });
    } else if (item.protocol === 'webrtc-page') {
      layer.removeChild(v);
      return playUrl(layer, item, onReady);
    } else {
      return scheduleSkip(item);
    }
    if (item.durationSec) itemTimer = setTimeout(next, item.durationSec * 1000);
  }

  // Minimale WHEP-client (WebRTC-HTTP Egress Protocol) — werkt met o.a.
  // MediaMTX, Cloudflare Stream, Dolby/Millicast en SRS.
  async function startWhep(video, item, onReady) {
    try {
      pc = new RTCPeerConnection();
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });
      pc.ontrack = (ev) => {
        if (!video.srcObject) video.srcObject = ev.streams[0] || new MediaStream([ev.track]);
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const res = await fetch(item.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp
      });
      if (!res.ok) throw new Error(`WHEP ${res.status}`);
      await pc.setRemoteDescription({ type: 'answer', sdp: await res.text() });
      video.addEventListener('playing', onReady, { once: true });
      video.play().catch(() => {});
    } catch (e) {
      console.error('WHEP-fout', e);
      scheduleSkip(item);
    }
  }

  function playUrl(layer, item, onReady) {
    const frame = document.createElement('iframe');
    frame.src = item.url;
    frame.allow = 'autoplay; fullscreen; camera; microphone; encrypted-media';
    if (!item.interactive) frame.style.pointerEvents = 'none';
    layer.appendChild(frame);
    frame.addEventListener('load', onReady, { once: true });
    // Iframes melden fouten niet betrouwbaar; alleen doorschakelen op tijdsduur.
    if (item.durationSec) itemTimer = setTimeout(next, item.durationSec * 1000);
  }

  // Item dat faalt: kort tonen van zwart voorkomen door snel door te gaan,
  // maar niet in een tight loop belanden als álles faalt.
  function scheduleSkip(item) {
    console.warn('Item overgeslagen:', item);
    clearTimeout(itemTimer);
    itemTimer = setTimeout(next, items.length > 1 ? 500 : 5000);
  }

  function cleanupLayer(layer) {
    for (const v of layer.querySelectorAll('video')) {
      try { v.pause(); v.removeAttribute('src'); v.srcObject = null; v.load(); } catch {}
    }
    if (hlsInstance && layer.querySelector('video') === null) { /* al opgeruimd */ }
    layer.innerHTML = '';
  }

  function stopPlayback() {
    clearTimeout(itemTimer);
    if (hlsInstance) { try { hlsInstance.destroy(); } catch {} hlsInstance = null; }
    if (pc) { try { pc.close(); } catch {} pc = null; }
    for (const l of layers) { cleanupLayer(l); l.classList.remove('visible'); }
  }

  /* ---------- Berichten & overlays ---------- */

  function showMessage(text) {
    messageText.textContent = text;
    messageEl.classList.remove('hidden');
  }
  function hideMessage() {
    messageEl.classList.add('hidden');
  }

  function identify() {
    identifyEl.textContent = `${manifest?.device?.name || 'Holobox'}\n${deviceKey}`;
    identifyEl.classList.add('show');
    setTimeout(() => identifyEl.classList.remove('show'), 8000);
  }

  /* ---------- WebSocket & status ---------- */

  function connectWs() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}/ws?role=player&key=${deviceKey}`);
    ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      switch (msg.type) {
        case 'refresh': refresh(true); break;
        case 'reload': location.reload(); break;
        case 'identify': identify(); break;
        case 'black': blackEl.classList.toggle('show'); break;
        case 'wake': blackEl.classList.remove('show'); break;
      }
    };
    ws.onclose = () => setTimeout(connectWs, 5000);
  }

  function sendStatus(item) {
    const payload = {
      type: 'status',
      nowPlaying: item ? { id: item.id, name: item.name, type: item.type } : null,
      info: { ua: navigator.userAgent, viewport: `${innerWidth}x${innerHeight}` }
    };
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(payload));
    else fetch(`/api/v1/heartbeat/${deviceKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nowPlaying: payload.nowPlaying })
    }).catch(() => {});
  }

  /* ---------- Start ---------- */

  async function start() {
    if (!deviceKey || deviceKey === 'player') {
      showMessage('Geen device-key in de URL. Gebruik /player/<device-key> uit het CMS.');
      return;
    }
    // Scherm wakker houden (waar ondersteund).
    try { await navigator.wakeLock?.request('screen'); } catch {}
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible') {
        try { await navigator.wakeLock?.request('screen'); } catch {}
      }
    });

    connectWs();
    await refresh(true);
    const poll = () => {
      const sec = manifest?.pollIntervalSec || 30;
      pollTimer = setTimeout(async () => { await refresh(); poll(); }, sec * 1000);
    };
    poll();
    setInterval(() => sendStatus(items[index] || null), 20000);
  }

  start();
})();
