// M6 — measured capabilities, shared by HoloMe (encode) and HoloSee (decode).
// Everything here is a MEASUREMENT via the MediaCapabilities API, never an assumption:
// `powerEfficient` is the browser's own signal for hardware acceleration, and a rung is
// only "ok" when the browser reports it both supported and smooth. STREAMING.md §7.

export interface Rung {
  label: string;
  w: number;
  h: number;
  fps: number;
  kbps: number; // target bitrate for this rung
}

// The adaptive ladder (STREAMING.md): down fast, up slow.
export const RUNGS: Rung[] = [
  { label: '4K60', w: 3840, h: 2160, fps: 60, kbps: 24000 },
  { label: '4K30', w: 3840, h: 2160, fps: 30, kbps: 16000 },
  { label: '1440p30', w: 2560, h: 1440, fps: 30, kbps: 8000 },
  { label: '1080p60', w: 1920, h: 1080, fps: 60, kbps: 6000 },
  { label: '1080p30', w: 1920, h: 1080, fps: 30, kbps: 4500 },
  { label: '720p30', w: 1280, h: 720, fps: 30, kbps: 2500 },
];

const CODECS: { name: string; contentType: string }[] = [
  { name: 'h264', contentType: 'video/H264;profile-level-id=640033' }, // High, level 5.1 (4K-capable)
  { name: 'vp9', contentType: 'video/VP9' },
  { name: 'av1', contentType: 'video/AV1' },
];

export interface RungCap {
  rung: string;
  ok: boolean; // supported AND smooth for at least one codec
  hw: boolean; // powerEfficient for at least one ok codec (browser's hardware signal)
  codecs: { name: string; supported: boolean; smooth: boolean; hw: boolean }[];
}

async function probe(direction: 'encodingInfo' | 'decodingInfo'): Promise<RungCap[]> {
  const out: RungCap[] = [];
  for (const r of RUNGS) {
    const codecs: RungCap['codecs'] = [];
    for (const c of CODECS) {
      try {
        const info = await navigator.mediaCapabilities[direction]({
          type: 'webrtc',
          video: { contentType: c.contentType, width: r.w, height: r.h, framerate: r.fps, bitrate: r.kbps * 1000 },
        } as MediaDecodingConfiguration & MediaEncodingConfiguration);
        codecs.push({ name: c.name, supported: info.supported, smooth: info.smooth, hw: info.powerEfficient });
      } catch {
        codecs.push({ name: c.name, supported: false, smooth: false, hw: false });
      }
    }
    const okCodecs = codecs.filter((c) => c.supported && c.smooth);
    out.push({ rung: r.label, ok: okCodecs.length > 0, hw: okCodecs.some((c) => c.hw), codecs });
  }
  return out;
}

export const probeEncode = (): Promise<RungCap[]> => probe('encodingInfo');
export const probeDecode = (): Promise<RungCap[]> => probe('decodingInfo');

// Highest rung reported ok, as an index into RUNGS; -1 when nothing qualifies.
export function topOkRung(caps: RungCap[]): number {
  for (let i = 0; i < RUNGS.length; i++) {
    if (caps.find((c) => c.rung === RUNGS[i]!.label)?.ok) return i;
  }
  return -1;
}
