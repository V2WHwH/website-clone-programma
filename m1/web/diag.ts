// Diagnostic resolution chain — the honesty instrumentation from STREAMING.md §7.
// Every value below is read from the running system; nothing is assumed or estimated,
// and anything that is an estimate says so in its label.

export interface StageRow {
  stage: string;
  w?: number;
  h?: number;
  fps?: number;
  note?: string;
}

export class RateMeter {
  private lastBytes = 0;
  private lastTs = 0;
  /** Returns bitrate in Mbps for the delta since the previous sample. */
  sample(bytes: number, ts: number): number | undefined {
    if (this.lastTs === 0) {
      this.lastBytes = bytes;
      this.lastTs = ts;
      return undefined;
    }
    const dt = (ts - this.lastTs) / 1000;
    if (dt <= 0) return undefined;
    const mbps = ((bytes - this.lastBytes) * 8) / dt / 1e6;
    this.lastBytes = bytes;
    this.lastTs = ts;
    return mbps;
  }
}

export class RenderFpsMeter {
  private frames = 0;
  private windowStart = performance.now();
  private _fps = 0;

  attach(video: HTMLVideoElement): void {
    const tick = () => {
      this.frames += 1;
      const now = performance.now();
      if (now - this.windowStart >= 1000) {
        this._fps = (this.frames * 1000) / (now - this.windowStart);
        this.frames = 0;
        this.windowStart = now;
      }
      video.requestVideoFrameCallback(tick);
    };
    video.requestVideoFrameCallback(tick);
  }

  get fps(): number {
    return this._fps;
  }
}

const fixed = (n: number | undefined, digits = 1): string =>
  n === undefined || Number.isNaN(n) ? '—' : n.toFixed(digits);

export async function senderChain(
  pc: RTCPeerConnection,
  track: MediaStreamTrack,
  rate: RateMeter,
): Promise<StageRow[]> {
  const s = track.getSettings();
  const rows: StageRow[] = [
    { stage: 'capture', w: s.width, h: s.height, fps: s.frameRate, note: track.label || 'camera' },
  ];

  const stats = await pc.getStats();
  let out: Record<string, number | string> | undefined;
  let pair: Record<string, number | string> | undefined;
  stats.forEach((r) => {
    if (r.type === 'outbound-rtp' && r.kind === 'video') out = r as never;
    if (r.type === 'candidate-pair' && (r as { nominated?: boolean }).nominated && r.state === 'succeeded')
      pair = r as never;
  });

  if (out) {
    rows.push({
      stage: 'encoded output',
      w: out.frameWidth as number,
      h: out.frameHeight as number,
      fps: out.framesPerSecond as number,
      note: `${out.encoderImplementation ?? '?'} · limit: ${out.qualityLimitationReason ?? '?'}`,
    });
    const mbps = rate.sample(out.bytesSent as number, out.timestamp as number);
    rows.push({
      stage: 'transport (send)',
      note: `${fixed(mbps, 2)} Mbps · RTT ${pair ? fixed((pair.currentRoundTripTime as number) * 1000, 0) : '—'} ms`,
    });
  } else {
    rows.push({ stage: 'encoded output', note: 'no outbound-rtp yet' });
  }
  return rows;
}

export async function receiverChain(
  pc: RTCPeerConnection,
  video: HTMLVideoElement,
  render: RenderFpsMeter,
  rate: RateMeter,
): Promise<StageRow[]> {
  const rows: StageRow[] = [];
  const stats = await pc.getStats();
  let inb: Record<string, number | string> | undefined;
  let pair: Record<string, number | string> | undefined;
  stats.forEach((r) => {
    if (r.type === 'inbound-rtp' && r.kind === 'video') inb = r as never;
    if (r.type === 'candidate-pair' && (r as { nominated?: boolean }).nominated && r.state === 'succeeded')
      pair = r as never;
  });

  if (inb) {
    const mbps = rate.sample(inb.bytesReceived as number, inb.timestamp as number);
    rows.push({
      stage: 'transport (recv)',
      note: `${fixed(mbps, 2)} Mbps · RTT ${pair ? fixed((pair.currentRoundTripTime as number) * 1000, 0) : '—'} ms`,
    });
    const jbAvgMs =
      inb.jitterBufferDelay !== undefined && (inb.jitterBufferEmittedCount as number) > 0
        ? ((inb.jitterBufferDelay as number) / (inb.jitterBufferEmittedCount as number)) * 1000
        : undefined;
    rows.push({
      stage: 'decode',
      w: inb.frameWidth as number,
      h: inb.frameHeight as number,
      fps: inb.framesPerSecond as number,
      note: `${inb.decoderImplementation ?? '?'} · dropped ${inb.framesDropped ?? 0} · jitterbuf ~${fixed(jbAvgMs, 0)} ms (estimate, not glass-to-glass)`,
    });
  } else {
    rows.push({ stage: 'decode', note: 'no inbound-rtp yet' });
  }

  rows.push({
    stage: 'render',
    w: video.videoWidth || undefined,
    h: video.videoHeight || undefined,
    fps: render.fps || undefined,
    note: 'video element',
  });
  rows.push({
    stage: 'physical output',
    w: Math.round(screen.width * devicePixelRatio),
    h: Math.round(screen.height * devicePixelRatio),
    note: 'reported by OS — verify the display EDID/mode on the Holobox PC',
  });
  return rows;
}

/** All stages that report dimensions must agree (physical output may be larger; it is the canvas the video is scaled onto). */
export function verdict(rows: StageRow[]): { ok: boolean; text: string } {
  const dims = rows
    .filter((r) => r.stage !== 'physical output' && r.w && r.h)
    .map((r) => `${r.w}×${r.h}`);
  const uniq = [...new Set(dims)];
  if (dims.length === 0) return { ok: false, text: 'NO MEDIA YET' };
  if (uniq.length === 1) return { ok: true, text: `ALL MEASURED STAGES AGREE — ${uniq[0]}` };
  return { ok: false, text: `STAGE MISMATCH: ${uniq.join(' vs ')}` };
}

export function renderDiag(el: HTMLElement, rows: StageRow[], v: { ok: boolean; text: string }): void {
  const line = (r: StageRow) => {
    const dim = r.w && r.h ? `${r.w} × ${r.h}` : '';
    const fps = r.fps ? ` @ ${fixed(r.fps, 0)}` : '';
    return `<tr><td>${r.stage}</td><td>${dim}${fps}</td><td>${r.note ?? ''}</td></tr>`;
  };
  el.innerHTML =
    `<table>${rows.map(line).join('')}</table>` +
    `<div class="verdict ${v.ok ? 'ok' : 'bad'}">${v.text}</div>`;
}
