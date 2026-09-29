/**
 * Cutting a photoscanned food along a shape its outline does not suit.
 *
 * `sliceMesh` hands back the loop the plane cut through, and the obvious thing to
 * do with it — fan a flat cap from the middle, the way the biscuit and the can do —
 * only works while that loop is convex. A broccoli's is not: a narrow stalk under a
 * wide crown, with florets bulging in and out along the top. Fanned from the
 * centre it zigzags, and the cap comes out as a starburst of slivers.
 *
 * So instead of a fan, these two helpers reduce the outline to one left edge and
 * one right edge per height band, and fill the shape as a run of quads. The result
 * can only ever go up, which is right for anything that is wide and roughly
 * convex in silhouette — a broccoli's crown and stalk, a burger's stack of buns
 * and fillings.
 *
 * Kept apart from either model because both a broccoli and a burger need it, and
 * neither should be sized against the other.
 */

import * as THREE from 'three';

export interface Band {
  y: number;
  z0: number;
  z1: number;
}

/**
 * The cut outline as a left and right edge, sampled up its height.
 *
 * One band per slice of height, each keeping only the single widest point pair it
 * caught, lightly smoothed so the silhouette's real shape survives but its
 * per-band jitter does not. The run is then stretched out to the true top and
 * bottom, pinching as it goes, so the strip reaches the ends of the food rather
 * than stopping a band short of them.
 *
 * `smooth` widens that averaging for skins with enough wobble to need it — a
 * pineapple's eyes are knobbly enough that one band either side still steps.
 */
export function silhouetteBands(outline: { y: number; z: number }[], count: number, smooth = 1): Band[] {
  if (outline.length < 6) return [];

  let yMin = Infinity;
  let yMax = -Infinity;
  for (const p of outline) {
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  }
  const span = yMax - yMin;
  if (span <= 0) return [];

  const lo = new Array<number>(count).fill(Infinity);
  const hi = new Array<number>(count).fill(-Infinity);
  for (const p of outline) {
    const i = Math.min(count - 1, Math.floor(((p.y - yMin) / span) * count));
    if (p.z < lo[i]) lo[i] = p.z;
    if (p.z > hi[i]) hi[i] = p.z;
  }

  const raw: Band[] = [];
  for (let i = 0; i < count; i++) {
    if (lo[i] === Infinity) continue;
    raw.push({ y: yMin + (span * (i + 0.5)) / count, z0: lo[i], z1: hi[i] });
  }
  if (raw.length < 2) return [];

  // each band only keeps the single widest point it caught; a light smoothing
  // keeps the crown's bulge but loses the per-band jitter
  const bands = raw.map((band, i) => {
    let z0 = 0;
    let z1 = 0;
    let n = 0;
    for (let k = -smooth; k <= smooth; k++) {
      const other = raw[i + k];
      if (!other) continue;
      z0 += other.z0;
      z1 += other.z1;
      n++;
    }
    return { y: band.y, z0: z0 / n, z1: z1 / n };
  });

  // run the strip out to the true top and bottom, rounding off as it goes
  const pinch = (b: Band, y: number): Band => {
    const mid = (b.z0 + b.z1) / 2;
    const half = ((b.z1 - b.z0) / 2) * 0.8;
    return { y, z0: mid - half, z1: mid + half };
  };
  return [pinch(bands[0], yMin), ...bands, pinch(bands[bands.length - 1], yMax)];
}

/**
 * Fills between the two edges, a hair inside them so the cap never pokes out
 * through the skin. UVs run 0→1 across each band and up the height of the bands
 * given, so a texture painted in that space stays the same thickness in world
 * units as the shape widens. Bands given side by side tile exactly, because a
 * shared y produces the same midpoint and half-width on both sides.
 */
export function bandStrip(bands: Band[], inset: number): THREE.BufferGeometry | null {
  if (bands.length < 2) return null;

  const yMin = bands[0].y;
  const yMax = bands[bands.length - 1].y;
  const positions: number[] = [];
  const uvs: number[] = [];

  const corner = (b: Band, side: 0 | 1) => {
    const mid = (b.z0 + b.z1) / 2;
    const half = ((b.z1 - b.z0) / 2) * inset;
    positions.push(0, b.y, side ? mid + half : mid - half);
    uvs.push(side, (b.y - yMin) / (yMax - yMin));
  };

  for (let i = 0; i + 1 < bands.length; i++) {
    const a = bands[i];
    const b = bands[i + 1];
    corner(a, 0); corner(a, 1); corner(b, 1);
    corner(a, 0); corner(b, 1); corner(b, 0);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

/** The left and right edges at one exact height, interpolated between the two
 *  bands that straddle it. Used to land a strip's ends on a precise height
 *  rather than on whatever band happened to be nearest, and to measure how wide a
 *  food is at one height — a carrot's cut face needs both of its edges at every
 *  height it is painted at, and asks here for the same reason the biscuit's cap
 *  does. */
export function edgesAt(bands: Band[], y: number): Pick<Band, 'z0' | 'z1'> {
  for (let i = 0; i + 1 < bands.length; i++) {
    const a = bands[i];
    const b = bands[i + 1];
    if (y >= a.y && y <= b.y) {
      const t = (y - a.y) / Math.max(1e-6, b.y - a.y);
      return {
        z0: THREE.MathUtils.lerp(a.z0, b.z0, t),
        z1: THREE.MathUtils.lerp(a.z1, b.z1, t),
      };
    }
  }
  const last = bands[bands.length - 1];
  return { z0: last.z0, z1: last.z1 };
}

/**
 * The run of bands covering part of another run, given as fractions of the
 * height rather than world units.
 *
 * Used to cut one continuous silhouette into stacked layers: each layer asks for
 * the slice of the shape between its own bounds, and because the ends are
 * interpolated at the exact heights asked for, a layer is exactly as wide as the
 * food is at its own top and bottom — no notch where a neighbouring band
 * happened to be wider.
 */
export function bandsBetween(bands: Band[], fromV: number, toV: number): Band[] {
  if (bands.length < 2) return [];

  const yMin = bands[0].y;
  const yMax = bands[bands.length - 1].y;
  const at = (v: number) => yMin + (yMax - yMin) * v;
  const lo = at(Math.min(fromV, toV));
  const hi = at(Math.max(fromV, toV));

  const out: Band[] = [];
  if (lo > yMin + 1e-6) out.push({ y: lo, ...edgesAt(bands, lo) });
  for (const b of bands) {
    if (b.y > lo + 1e-6 && b.y < hi - 1e-6) out.push(b);
  }
  if (hi < yMax - 1e-6) out.push({ y: hi, ...edgesAt(bands, hi) });
  return out;
}
