/**
 * The small toolkit the cut-face generators are written against.
 *
 * Everything in a generated cross-section is a function of where a pixel landed —
 * where the fibre runs, which cell it sits in, whether the moisture film reaches
 * it — so all of it is noise over a plane, and that noise has to be *the same*
 * noise every time. A random call would give a different cut face on every
 * remount; a hash of the pixel's own coordinates gives the identical face every
 * time, in the browser and in the checks that run outside it.
 *
 * Kept separate from any one food so the pineapple, the cob, the root, the
 * carrot and the broccoli are all drawing from one set of definitions rather than
 * five near-identical copies that drift apart.
 */

/** Deterministic hash → 0–1. Everything random is a hash of its own coordinates,
 *  so the same cut face comes out identical every time. */
export function hash(x: number, y: number, seed = 0): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** Smoothly interpolated value noise. */
export function noise(x: number, y: number, seed = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

/** Octaves of the above, each at twice the frequency and half the weight. */
export function fbm(x: number, y: number, octaves: number, seed = 0): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x, y, seed + i * 131);
    norm += amp;
    x *= 2.03;
    y *= 2.03;
    amp *= 0.5;
  }
  return sum / norm;
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** An sRGB-ish colour as three 0–255 channels, mixed and clamped in place. */
export function blend(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
): [number, number, number] {
  return [
    clamp01(mix(a[0], b[0], t)) * 255,
    clamp01(mix(a[1], b[1], t)) * 255,
    clamp01(mix(a[2], b[2], t)) * 255,
  ];
}
