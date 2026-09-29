/**
 * Dumps a generated cut face to a PNG so it can be looked at without a browser.
 *
 * The cut-face generators are deliberately free of canvas draw calls, which is what
 * lets this exist: Node strips the types off the `.ts` sources on the way in
 * (`--experimental-strip-types`, below) and three.js builds and runs fine outside a
 * DOM, so `carrotFlesh` and the carrot's own geometry can be evaluated here exactly
 * as they are in the app. What comes out is the same bytes the DataTexture is built
 * from, so if the face is wrong here it is wrong on the board.
 *
 *   node --experimental-strip-types .qs3/carrotface.mjs [size]
 *
 * The outline is built from the real deform rather than a stand-in, which is the
 * whole point — a guessed ellipse puts the skin a third of the way into the flesh
 * on a face that is 2.9:1, and the guess would be the only thing under test.
 *
 * The app's own modules are loaded by dynamic import, after a resolve hook is
 * registered, because Node cannot follow the extensionless relative imports that
 * Vite resolves for it.
 *
 * PNG is written by hand because there is nothing to write it with: no image
 * library in the project, and pulling one in to look at a texture would be a
 * strange trade. It is a signature, an IHDR, one IDAT of zlib-deflated filtered
 * scanlines, and an IEND.
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { register } from 'node:module';

register('./ts-resolve.mjs', import.meta.url);

const { buildCarrotMaps } = await import('../src/game/food3d/carrotFlesh.ts');
const { carrotHalf, carrotOutline } = await import('../src/game/food3d/carrotShape.ts');

const here = dirname(fileURLToPath(import.meta.url));
const size = Number(process.argv[2]) || 512;

// Both halves are sliced, and the outlines compared. They are generated from the
// same deform on the same sphere columns, so they must come out identical — and if
// they ever do not, the two halves are wearing different flesh and the cached
// texture would only be right for one of them.
const left = carrotOutline(carrotHalf(true));
const right = carrotOutline(carrotHalf(false));
const drift = Math.max(...left.map((p, i) => Math.hypot(p.y - right[i].y, p.z - right[i].z)));

console.log(`outline: ${left.length} points, max half-width ${left.reduce((m, p) => Math.max(m, Math.abs(p.z)), 0).toFixed(3)}`);
console.log(`halves differ by ${drift.toExponential(2)} — the shared texture is ${drift < 1e-9 ? 'sound' : 'UNSOUND'}`);

const { albedo, roughness } = buildCarrotMaps(size, left);

// Both readings, at the same size, so they can be flipped between.
png(join(here, 'carrot-face.png'), size, albedo);
png(join(here, 'carrot-face-rough.png'), size, roughness);

// A quick read of what came out, since a face can be wrong in a way that is obvious
// as a number and invisible as a thumbnail. Percentiles of luminance, the same
// measure `.qs3/texcolor.py` takes off a real scan's texture.
const lums = [];
for (let i = 0; i < albedo.length; i += 4) {
  lums.push(0.2126 * albedo[i] + 0.7152 * albedo[i + 1] + 0.0722 * albedo[i + 2]);
}
lums.sort((a, b) => a - b);
const at = (p) => lums[Math.floor(p * (lums.length - 1))].toFixed(0);
console.log(`luminance p10 ${at(0.1)} / median ${at(0.5)} / p90 ${at(0.9)}`);

let rMin = 255;
let rMax = 0;
for (let i = 0; i < roughness.length; i += 4) {
  if (roughness[i] < rMin) rMin = roughness[i];
  if (roughness[i] > rMax) rMax = roughness[i];
}
console.log(`roughness ${rMin}–${rMax} of 255`);
console.log(`wrote .qs3/carrot-face.png and .qs3/carrot-face-rough.png at ${size}x${size}`);

function png(path, w, rgba) {
  // Every buffer handed to this is square, so there is one dimension to name.
  // Each scanline is prefixed with its filter type; 0 is "none", which is all that
  // is needed for a buffer that is going to be looked at rather than compressed
  // hard.
  const raw = Buffer.alloc(w * (w * 4 + 1));
  for (let y = 0; y < w; y++) {
    const at = y * (w * 4 + 1);
    raw[at] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, at + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(w, 4);
  ihdr[8] = 8; // bits per channel
  ihdr[9] = 6; // RGBA
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body) >>> 0, 0);
    return Buffer.concat([len, body, crc]);
  }
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c;
}
