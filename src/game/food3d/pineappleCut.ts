/**
 * What is inside a cut pineapple, as geometry.
 *
 * A pineapple's cross-section is not a stack of layers. Cut one lengthwise and the
 * whole interior is one continuous wet surface: a pale fibrous core running up
 * the middle, golden flesh radiating away from it in bundles, and a thin band of
 * drier tissue just inside the skin. So the cap is a single surface carrying a
 * generated texture of all of that (see `pineappleFlesh`), and the only pieces of
 * real geometry left are the brown rim of rind and the juice standing on top.
 *
 * The band reduction itself belongs to `silhouetteBand` — the biscuit and the
 * broccoli's logic fits a pineapple's outline exactly as well as it fits theirs,
 * and there is no reason for two algorithms to drift apart. What is left here is
 * the part that is only true of this fruit: where the body ends, how to address
 * one radial texture across the whole face rather than band by band, and where
 * that face actually is so the juice can be put on it.
 */

import * as THREE from 'three';
import { silhouetteBands, type Band } from './silhouetteBand';

export type { Band };

/** Where the fruit stops and the crown starts, measured off the scan: below this
 *  the cut is one clean closed body, above it the plane is passing through a
 *  tangle of separate leaf blades, and there is no single opening up there to
 *  close. */
export const CROWN_Y = 0.02;

/**
 * The fruit body's silhouette, as a left and right edge up its height.
 *
 * Much wider smoothing than the broccoli and the burger ask for. This skin is
 * covered in pineapple eyes, and a band either side is not enough: down at the
 * base the outline's own extremes step around between neighbouring bands, which
 * would show up as a zigzag along the cut.
 */
export function bodyBands(outline: { y: number; z: number }[], count: number): Band[] {
  return silhouetteBands(outline.filter((p) => p.y <= CROWN_Y), count, 4);
}

/** The full extent of a run of bands. */
export function bandExtent(bands: Band[]): { yMin: number; yMax: number; zMin: number; zMax: number } {
  let yMin = Infinity;
  let yMax = -Infinity;
  let zMin = Infinity;
  let zMax = -Infinity;
  for (const b of bands) {
    yMin = Math.min(yMin, b.y);
    yMax = Math.max(yMax, b.y);
    zMin = Math.min(zMin, b.z0);
    zMax = Math.max(zMax, b.z1);
  }
  return { yMin, yMax, zMin, zMax };
}

/** The left and right edge at one height, interpolated between the two bands
 *  that straddle it. */
export function edgesAt(bands: Band[], y: number): { lo: number; hi: number } {
  for (let i = 0; i + 1 < bands.length; i++) {
    const a = bands[i];
    const b = bands[i + 1];
    if (y < a.y || y > b.y) continue;
    const t = (y - a.y) / Math.max(1e-6, b.y - a.y);
    return {
      lo: THREE.MathUtils.lerp(a.z0, b.z0, t),
      hi: THREE.MathUtils.lerp(a.z1, b.z1, t),
    };
  }
  const last = bands[bands.length - 1];
  return { lo: last.z0, hi: last.z1 };
}

/**
 * Whether a point is on the open face rather than out on the skin, so a juice
 * bead is never left hanging in the air beside the fruit.
 */
export function onFlesh(bands: Band[], y: number, z: number, inset = 0.82): boolean {
  if (bands.length < 2) return false;
  if (y < bands[0].y || y > bands[bands.length - 1].y) return false;
  const { lo, hi } = edgesAt(bands, y);
  const mid = (lo + hi) / 2;
  const half = ((hi - lo) / 2) * inset;
  return z > mid - half && z < mid + half;
}

/**
 * Fills between the two edges, `kz` narrowing each band about its own middle and
 * `ky` shortening the whole run, which is how a cap is inset inside the fruit.
 *
 * Unlike `silhouetteBand.bandStrip`, the UVs are laid out across the *whole* face
 * rather than band by band, because the flesh is one radial image: a texture
 * painted in polar-ish space has to be addressed as a single square, or the core
 * would repeat up the length of the fruit.
 *
 * `uv` is the run the texture is addressed against, kept separate from the shape
 * being built. An inset cap still has to have the pale sub-rind band that lives
 * at the fruit's own edge land just inside itself, or the cap ends in a wide flat
 * border. Addressing it against the full silhouette puts the band at the cap's
 * rim, with the brown rind filling only what is beyond it.
 */
export function fleshStrip(bands: Band[], kz: number, ky: number, uv: Band[] = bands): THREE.BufferGeometry | null {
  if (bands.length < 2) return null;

  const ref = uv.length >= 2 ? uv : bands;
  const { yMin, yMax, zMin, zMax } = bandExtent(ref);
  const uOf = (z: number) => (z - zMin) / Math.max(1e-6, zMax - zMin);
  // canvas rows run down the page and texture v runs up, so v is flipped here
  // rather than in the texture
  const vOf = (y: number) => 1 - (y - yMin) / Math.max(1e-6, yMax - yMin);

  const yMid = (bands[0].y + bands[bands.length - 1].y) / 2;
  // The width is taken at the height the band *lands* on, not the one it came
  // from. These are the same when `ky` is 1, but an inset cap also shortens the
  // run, and a band edge is the extreme of a slice of outline rather than the
  // edge at one exact height — so moving the band up without re-reading its width
  // carries a width across to where it does not belong. On this fruit, whose skin
  // steps by more than its own band height down at the base, that pushed the cap
  // a ninth of the fruit's width out through the skin.
  const shaped = bands.map((b) => {
    const y = yMid + (b.y - yMid) * ky;
    const { lo, hi } = edgesAt(bands, y);
    const mid = (lo + hi) / 2;
    const half = ((hi - lo) / 2) * kz;
    return { y, z0: mid - half, z1: mid + half };
  });

  const positions: number[] = [];
  const uvs: number[] = [];
  const corner = (b: Band, z: number) => {
    positions.push(0, b.y, z);
    uvs.push(uOf(z), vOf(b.y));
  };
  for (let i = 0; i + 1 < shaped.length; i++) {
    const a = shaped[i];
    const b = shaped[i + 1];
    corner(a, a.z0); corner(a, a.z1); corner(b, b.z1);
    corner(a, a.z0); corner(b, b.z1); corner(b, b.z0);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}
