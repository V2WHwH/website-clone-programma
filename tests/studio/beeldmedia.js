// Extra testmedia voor beeldtest, 3dtest, sensortest en instellingentest:
// een PNG met doorzichtige rand (logo en knopvorm), een OBJ-kubus met .mtl en
// texture, en een GLB-kubus met een draai-animatie. Wordt gemaakt als hij nog
// niet bestaat; ffmpeg alleen voor de plaatjes.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { MEDIA } = require('./hulp');

const uit = (f) => path.join(MEDIA, f);
const ff = (...args) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });

// Kubus: 6 vlakken × 4 hoekpunten, met normalen en uv.
function kubus() {
  const vlakken = [
    { n: [0, 0, 1], h: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
    { n: [0, 0, -1], h: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]] },
    { n: [1, 0, 0], h: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]] },
    { n: [-1, 0, 0], h: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]] },
    { n: [0, 1, 0], h: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]] },
    { n: [0, -1, 0], h: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] },
  ];
  const uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
  return { vlakken, uv };
}

function maakObj() {
  const { vlakken, uv } = kubus();
  const r = ['# testkubus', 'mtllib bk-kubus.mtl', 'usemtl kubusmat'];
  for (const v of vlakken) for (const h of v.h) r.push(`v ${h.join(' ')}`);
  for (const t of uv) r.push(`vt ${t.join(' ')}`);
  for (const v of vlakken) r.push(`vn ${v.n.join(' ')}`);
  vlakken.forEach((v, i) => {
    const b = i * 4;
    r.push(`f ${b + 1}/1/${i + 1} ${b + 2}/2/${i + 1} ${b + 3}/3/${i + 1} ${b + 4}/4/${i + 1}`);
  });
  fs.writeFileSync(uit('bk-kubus.obj'), r.join('\n') + '\n');
  // Dezelfde kubus zonder texture en materiaal: krijgt de globale 3D-kleur.
  fs.writeFileSync(uit('bk-kaal.obj'), r.filter((x) => !/^(mtllib|usemtl|vt) /.test(x)).join('\n')
    .replace(/(\d+)\/\d+\/(\d+)/g, '$1//$2') + '\n');
  fs.writeFileSync(uit('bk-kubus.mtl'), 'newmtl kubusmat\nKd 1 1 1\nmap_Kd bk-kubus-tex.png\n');
}

function maakGlb() {
  const { vlakken } = kubus();
  const pos = [], nor = [], idx = [];
  vlakken.forEach((v, i) => {
    for (const h of v.h) { pos.push(...h.map((x) => x * 0.5)); nor.push(...v.n); }
    const b = i * 4;
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  const tijden = [0, 1, 2];
  const rot = [0, 0, 0, 1, 0, Math.SQRT1_2, 0, Math.SQRT1_2, 0, 1, 0, 0];
  const delen = [new Float32Array(pos), new Float32Array(nor), new Uint16Array(idx),
    new Float32Array(tijden), new Float32Array(rot)];
  const views = [];
  let off = 0;
  const bufs = [];
  for (const d of delen) {
    const b = Buffer.from(d.buffer);
    views.push({ buffer: 0, byteOffset: off, byteLength: b.length });
    bufs.push(b);
    off += b.length;
    const pad = (4 - (off % 4)) % 4;
    if (pad) { bufs.push(Buffer.alloc(pad)); off += pad; }
  }
  const bin = Buffer.concat(bufs);
  const json = {
    asset: { version: '2.0', generator: 'beeldmedia.js' },
    scene: 0, scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }] }],
    materials: [{ pbrMetallicRoughness: { baseColorFactor: [0.9, 0.3, 0.2, 1] } }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: views,
    accessors: [
      { bufferView: 0, componentType: 5126, count: 24, type: 'VEC3', min: [-0.5, -0.5, -0.5], max: [0.5, 0.5, 0.5] },
      { bufferView: 1, componentType: 5126, count: 24, type: 'VEC3' },
      { bufferView: 2, componentType: 5123, count: 36, type: 'SCALAR' },
      { bufferView: 3, componentType: 5126, count: 3, type: 'SCALAR', min: [0], max: [2] },
      { bufferView: 4, componentType: 5126, count: 3, type: 'VEC4' },
    ],
    animations: [{ samplers: [{ input: 3, output: 4, interpolation: 'LINEAR' }],
      channels: [{ sampler: 0, target: { node: 0, path: 'rotation' } }] }],
  };
  let js = Buffer.from(JSON.stringify(json));
  const jpad = (4 - (js.length % 4)) % 4;
  if (jpad) js = Buffer.concat([js, Buffer.alloc(jpad, 0x20)]);
  const kop = Buffer.alloc(12);
  const totaal = 12 + 8 + js.length + 8 + bin.length;
  kop.writeUInt32LE(0x46546C67, 0); kop.writeUInt32LE(2, 4); kop.writeUInt32LE(totaal, 8);
  const c1 = Buffer.alloc(8); c1.writeUInt32LE(js.length, 0); c1.writeUInt32LE(0x4E4F534A, 4);
  const c2 = Buffer.alloc(8); c2.writeUInt32LE(bin.length, 0); c2.writeUInt32LE(0x004E4942, 4);
  fs.writeFileSync(uit('bk-kubus.glb'), Buffer.concat([kop, c1, js, c2, bin]));
}

// Een PNG zonder hulpprogramma's: RGBA, 8 bit, ongefilterde rijen.
function pngRgba(w, h, kleur) {
  const zlib = require('zlib');
  const crcTab = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xFFFFFFFF; for (const x of buf) c = crcTab[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const blok = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const rauw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = y * (1 + w * 4) + 1 + x * 4; const [r, g, b, a] = kleur(x, y); rauw[o] = r; rauw[o + 1] = g; rauw[o + 2] = b; rauw[o + 3] = a; }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), blok('IHDR', ihdr), blok('IDAT', zlib.deflateSync(rauw)), blok('IEND', Buffer.alloc(0))]);
}

function maakBeeldMedia() {
  fs.mkdirSync(MEDIA, { recursive: true });
  if (!fs.existsSync(uit('bk-logo.png'))) {
    // 256×256: doorzichtige rand, in het midden een rood vlak van 128×128.
    fs.writeFileSync(uit('bk-logo.png'), pngRgba(256, 256, (x, y) =>
      (x >= 64 && x < 192 && y >= 64 && y < 192) ? [230, 30, 40, 255] : [0, 0, 0, 0]));
  }
  if (!fs.existsSync(uit('bk-kubus-tex.png'))) {
    ff('-f', 'lavfi', '-i', 'testsrc=size=64x64:rate=1', '-frames:v', '1', uit('bk-kubus-tex.png'));
  }
  if (!['bk-kubus.obj', 'bk-kubus.mtl', 'bk-kaal.obj'].every((f) => fs.existsSync(uit(f)))) maakObj();
  if (!fs.existsSync(uit('bk-kubus.glb'))) maakGlb();
  for (const f of ['clip.webm', '1 intro.webm', '2 uitleg.webm', 'kort.mp3']) {
    if (!fs.existsSync(uit(f))) throw new Error(`testmedia ${f} ontbreekt — draai eerst: node maak-media.js`);
  }
}

module.exports = { maakBeeldMedia };
if (require.main === module) { maakBeeldMedia(); console.log('Beeldmedia klaar in', MEDIA); }
