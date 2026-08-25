// Manifest-builder: vertaalt de CMS-configuratie van een device naar één
// JSON-document dat de player (of een holobox van een derde partij, zoals een
// Portl "Cloud Persona custom endpoint"-integratie) kan ophalen en afspelen.
'use strict';

const db = require('./db');
const media = require('./media');

// Bouwt het afspeel-manifest voor een device.
// baseUrl is de externe URL van deze server (bijv. http://192.168.1.50:8080),
// zodat media-URL's absoluut zijn en ook door externe boxen te laden zijn.
function buildManifest(device, baseUrl) {
  const state = db.load();
  const playlist = state.playlists.find((p) => p.id === device.playlistId) || null;

  const items = [];
  for (const item of playlist?.items || []) {
    const resolved = resolveItem(item, state, baseUrl);
    if (resolved) items.push(resolved);
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    platform: state.settings.platformName,
    device: {
      id: device.id,
      name: device.name,
      orientation: device.orientation || state.settings.defaultOrientation,
      // Fysieke rotatie van het paneel in graden (0/90/180/270) voor boxen
      // waarvan het scherm gedraaid is gemonteerd.
      rotation: device.rotation || 0,
      resolution: device.orientation === 'landscape' ? '3840x2160' : '2160x3840'
    },
    playlist: playlist ? { id: playlist.id, name: playlist.name, loop: playlist.loop !== false } : null,
    pollIntervalSec: state.settings.pollIntervalSec,
    transitionMs: state.settings.transitionMs,
    // Als het device een externe endpoint heeft (integratie van de klant zelf),
    // geeft de player daar voorrang aan. Zie docs/INTEGRATIE.md.
    externalEndpoint: device.externalEndpoint || null,
    items
  };
}

function resolveItem(item, state, baseUrl) {
  const abs = (u) => (u && u.startsWith('/') ? baseUrl + u : u);

  switch (item.type) {
    case 'video':
    case 'image': {
      if (!item.mediaPath || !media.fileExists(item.mediaPath)) return null;
      const url = '/media/' + item.mediaPath.split('/').map(encodeURIComponent).join('/');
      return {
        id: item.id,
        type: item.type,
        name: item.name || item.mediaPath.split('/').pop(),
        url: abs(url),
        // Video's zonder duur spelen tot het einde; afbeeldingen default 10s.
        durationSec: item.durationSec || (item.type === 'image' ? 10 : null),
        fit: item.fit || 'cover',
        muted: item.muted !== false
      };
    }
    case 'live': {
      const src = state.liveSources.find((s) => s.id === item.liveSourceId);
      if (!src) return null;
      return {
        id: item.id,
        type: 'live',
        name: item.name || src.name,
        protocol: src.protocol, // 'hls' | 'whep' | 'webrtc-page' | 'mjpeg'
        url: abs(src.url),
        durationSec: item.durationSec || null, // null = blijf op de stream staan
        fit: item.fit || 'cover',
        muted: item.muted !== false,
        lowLatency: src.lowLatency !== false
      };
    }
    case 'url': {
      if (!item.url) return null;
      return {
        id: item.id,
        type: 'url',
        name: item.name || item.url,
        url: item.url,
        durationSec: item.durationSec || null,
        interactive: item.interactive === true
      };
    }
    default:
      return null;
  }
}

module.exports = { buildManifest };
