/**
 * The cut face of a pineapple, generated pixel by pixel.
 *
 * A pineapple's interior is the least forgiving thing in the app to draw: it is
 * a radial anatomy rather than a set of flat layers, so the three-band cap the
 * other fruit get — rind, flesh, core — reads as a boiled egg. What is actually
 * there is one continuous wet surface, golden flesh whose pale fibrous core sits
 * in the middle, with fine fibre bundles running from that core out to the skin
 * and every step of the way filled with cells holding juice.
 *
 * All of that is a function of position, so it is written as a function of
 * position and evaluated per pixel. Nothing here is a canvas draw call, which
 * also means it can be run outside a browser to check what it produces.
 *
 * Size: 8K would be 256 MB of texture and minutes of stall for an image a few
 * hundred pixels wide. This is generated at the size the face is actually
 * resolved at on screen, with anisotropy left on to keep it sharp at an angle.
 */

import { clamp01, fbm, hash, mix, noise, smoothstep } from './procTex';

export interface DropletSpot {
  /** Position over the cut face, 0–1 on each axis. */
  u: number;
  v: number;
  /** Radius as a fraction of the face's width. */
  r: number;
  /** 0–1, used to vary how much each droplet catches the light. */
  glint: number;
}

/** Both readings of the face, in one entry: they are generated together, so
 *  there is never a reason to have one without the other. */
export interface FleshMaps {
  albedo: Uint8ClampedArray;
  roughness: Uint8ClampedArray;
}

/** Generated once and shared by every face on screen — both halves of the cut
 *  and the microscope's own copy would otherwise each pay for it. */
const cache = new Map<string, FleshMaps>();

/** Colours read off a cut pineapple: the pale cream of the core, the golden
 *  flesh either side of it, the deeper ring of fruit that sits against the skin,
 *  and the pale strands the fibre bundles catch the light along. */
const CORE = [248, 234, 176] as const;
const FLESH = [247, 191, 26] as const;
const FLESH_DEEP = [237, 168, 16] as const;
const SUB_RIND = [243, 219, 158] as const;
const FIBRE = [253, 243, 205] as const;
const CELL_WALL = [214, 152, 16] as const;

/** How the flesh is broken into the cells that hold the juice. Fine enough to
 *  read as a texture rather than as spots, coarse enough to see at arm's length. */
const CELLS = 46;

/** Whole numbers, and coprime-ish, so the bundles never line up into one fan. */
const FIBRE_HARMONICS = [74, 131, 199, 263, 41];

/** The geometry the pixels are addressed in. A cut pineapple seen lengthwise is
 *  close to a rounded square, and the core is a tall oval up the middle of it. */
const CORE_HALF_W = 0.19;
const CORE_HALF_H = 0.46;

/** One pixel's worth of the interior: its colour, and how wet it looks. */
interface Sample {
  rgb: [number, number, number];
  rough: number;
}

/**
 * The interior at one point, given coordinates centred on the face.
 *
 * `cx` and `cy` run -1…1 across the face. Three fields are derived from them and
 * everything else falls out of those: where we are between the middle and the
 * skin, where we are between the middle and the edge of the core, and which way
 * from the core we are — the last one being what makes the fibres radiate rather
 * than run in some unrelated direction.
 */
function sample(cx: number, cy: number): Sample {
  const rEdge = Math.hypot(cx, cy * 1.02);
  const rCore = Math.hypot(cx / CORE_HALF_W, cy / CORE_HALF_H);
  const ang = Math.atan2(cy, cx);

  // The core's edge is never a clean ellipse, so its boundary is pushed in and
  // out along the angle before it is tested. `gold` is the slow blend out of
  // cream, while `coreRim` is the thin tough line right at the boundary — two
  // different things, and using one mask for both is how the whole flesh ended up
  // dried out.
  const coreWobble = 1 + (noise(Math.cos(ang) * 2.4, Math.sin(ang) * 2.4, 91) - 0.5) * 0.3;
  const coreT = rCore / coreWobble;
  const gold = smoothstep(0.55, 1.25, coreT);
  const coreRim = smoothstep(0.88, 1.08, coreT) * (1 - smoothstep(1.08, 1.34, coreT));
  const inCore = 1 - gold;

  // Fibre bundles, running outward from the core. Every harmonic is a whole
  // number of turns around the core, so the pattern closes on itself and there is
  // no seam where the angle wraps; the noise term bends each bundle so none of
  // them runs dead straight out to the skin.
  const bend = 2.6 * noise(Math.cos(ang) * 2.2, Math.sin(ang) * 2.2, 17);
  let bundles = 0;
  let amp = 1;
  let norm = 0;
  for (let k = 0; k < FIBRE_HARMONICS.length; k++) {
    bundles += amp * Math.sin(ang * FIBRE_HARMONICS[k] + bend + k * 1.7);
    norm += amp;
    amp *= 0.66;
  }
  bundles /= norm;
  // Strongest where the bundles are packed tightest, at the core, and thinning
  // out as they spread toward the skin — but never gone: the fibres run all the
  // way out, they just blend into each other rather than stopping.
  const bundleWeight = 0.55 + 0.45 * Math.exp(-rCore * 1.2);
  const fibre = smoothstep(0.34, 0.92, Math.abs(bundles)) * bundleWeight;
  // the fine single strands inside each bundle
  const strand = smoothstep(0.55, 1, Math.abs(noise(Math.cos(ang) * 90, Math.sin(ang) * 90, 5) * 2 - 1));

  // The cells. Each is a jittered dot on a grid, and the nearest one owns the
  // pixel, so the walls between them come out as a connected honeycomb instead
  // of a scatter of unrelated circles.
  const gx = (cx * 0.5 + 0.5) * CELLS;
  const gy = (cy * 0.5 + 0.5) * CELLS;
  const cellX = Math.floor(gx);
  const cellY = Math.floor(gy);
  let near = Infinity;
  let nearSeed = 0;
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const px = cellX + ox;
      const py = cellY + oy;
      const jx = px + 0.15 + hash(px, py, 3) * 0.7;
      const jy = py + 0.15 + hash(px, py, 4) * 0.7;
      const d = Math.hypot(gx - jx, gy - jy);
      if (d < near) {
        near = d;
        nearSeed = hash(px * 73856093, py * 19349663, 7);
      }
    }
  }
  // the core is packed tighter and the flesh nearer the skin is looser
  const cellScale = 1 + 0.45 * inCore;
  const cellD = near / cellScale;
  const wall = smoothstep(0.3, 0.52, cellD);
  const cellTone = hash(nearSeed, nearSeed, 7);
  // juice sitting proud in each cell catches the light along its near edge
  const cellSheen = smoothstep(0.5, 0.1, cellD) * (0.35 + cellTone * 0.5);

  // Base colour: cream at the core, gold through the middle, and a deeper,
  // denser ring against the skin.
  let r = mix(CORE[0], FLESH[0], gold);
  let g = mix(CORE[1], FLESH[1], gold);
  let b = mix(CORE[2], FLESH[2], gold);

  const deep = smoothstep(0.45, 0.95, rEdge);
  r = mix(r, FLESH_DEEP[0], deep);
  g = mix(g, FLESH_DEEP[1], deep);
  b = mix(b, FLESH_DEEP[2], deep);

  // a paler, tighter layer of flesh just inside the skin
  const subRind = smoothstep(0.86, 0.99, rEdge) * (1 - smoothstep(0.99, 1.06, rEdge));
  r = mix(r, SUB_RIND[0], subRind * 0.8);
  g = mix(g, SUB_RIND[1], subRind * 0.8);
  b = mix(b, SUB_RIND[2], subRind * 0.8);

  // One field of noise, read two ways: a slow drift across the face for the
  // mottling, and a thresholded version of the same thing for the patches that
  // have already dried off. Sampling noise twice would cost the whole generation
  // about a fifth more for a field that looks no better.
  const drift = fbm(cx * 3.1, cy * 3.1, 3, 23);
  const mottle = (drift - 0.5) * 26;

  // cells first, then the fibres over the top of them
  const cellShade = 1 - wall * 0.22;
  r = r * cellShade + cellSheen * 34;
  g = g * cellShade + cellSheen * 26;
  b = b * cellShade + cellSheen * 6;
  r = mix(r, CELL_WALL[0], wall * 0.35);
  g = mix(g, CELL_WALL[1], wall * 0.35);
  b = mix(b, CELL_WALL[2], wall * 0.35);

  // the fibres are paler out in the flesh, and much fainter inside the core,
  // which is a solid mass of them rather than something stretched through juice
  const fibreInk = clamp01(fibre * 0.52 + strand * 0.24) * (0.45 + 0.55 * gold);
  r = mix(r, FIBRE[0], fibreInk);
  g = mix(g, FIBRE[1], fibreInk);
  b = mix(b, FIBRE[2], fibreInk);

  // a slightly darker line where the tough core meets the juicy flesh
  r = mix(r, r * 0.84, coreRim * 0.5);
  g = mix(g, g * 0.84, coreRim * 0.5);
  b = mix(b, b * 0.86, coreRim * 0.5);

  r += mottle;
  g += mottle * 0.94;
  b += mottle * 0.8;

  // Wet. The whole face is a film of juice over packed cells, so it is glossy
  // almost everywhere; the fibrous core, the cell walls and the flesh right at
  // the skin are the parts that drink the light instead of reflecting it, and a
  // cut fruit is never uniformly wet — patches of it have already dried off.
  const dried = smoothstep(0.52, 0.8, 1 - drift);
  let rough = 0.14;
  rough += inCore * 0.22;
  rough += coreRim * 0.1;
  rough += wall * 0.1;
  rough -= strand * 0.03;
  rough += dried * 0.2;
  // the outside edge of the fruit, where it was pulled off the skin, is driest
  rough += smoothstep(0.9, 1.02, rEdge) * 0.28;

  return {
    rgb: [clamp01(r / 255) * 255, clamp01(g / 255) * 255, clamp01(b / 255) * 255],
    rough: clamp01(rough),
  };
}

/**
 * The albedo and roughness of the cut face, as RGBA bytes ready for DataTextures.
 *
 * Both are produced in one pass. They are two readings of the same field, and
 * asking the field twice would double the cost for nothing — the one place it is
 * worth paying for is the inside of a fruit nobody is looking at yet.
 *
 * Built once and cached, so the second half of a cut and the microscope's own
 * copy of the face cost nothing.
 */
export function buildFleshMaps(size: number): FleshMaps {
  const key = `maps${size}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const albedo = new Uint8ClampedArray(size * size * 4);
  const roughness = new Uint8ClampedArray(size * size * 4);
  for (let py = 0; py < size; py++) {
    const cy = ((py + 0.5) / size) * 2 - 1;
    for (let px = 0; px < size; px++) {
      const cx = ((px + 0.5) / size) * 2 - 1;
      const { rgb, rough } = sample(cx, cy);
      const i = (py * size + px) * 4;
      albedo[i] = rgb[0];
      albedo[i + 1] = rgb[1];
      albedo[i + 2] = rgb[2];
      albedo[i + 3] = 255;
      const v = rough * 255;
      roughness[i] = v;
      roughness[i + 1] = v;
      roughness[i + 2] = v;
      roughness[i + 3] = 255;
    }
  }
  const maps = { albedo, roughness };
  cache.set(key, maps);
  return maps;
}

/**
 * Where the juice is sitting on the face.
 *
 * These are drawn as real geometry rather than painted into the texture: a juice
 * bead is a clear lens sitting *on* the flesh, and the one thing that sells it is
 * the hard little highlight the environment throws on its curve. Painted, it can
 * only ever be a white dot.
 */
export function dropletSpots(count = 40): DropletSpot[] {
  const out: DropletSpot[] = [];
  for (let i = 0; i < count; i++) {
    // pushed away from the very edge of the face, where the fruit is still
    // attached to the skin and holds no beads
    const u = 0.09 + hash(i, 0, 41) * 0.82;
    const v = 0.07 + hash(i, 1, 43) * 0.86;
    // Juice beads on a cut face are a millimetre or two across, on a face a
    // hundred wide — a couple of percent. The range is narrow on purpose: beads
    // are drawn from one set of cells and are all much the same size, and a bead
    // big enough to notice on its own reads as a bubble in the plastic rather
    // than as wet fruit.
    out.push({
      u,
      v,
      r: 0.0035 + hash(i, 2, 47) * 0.0075,
      glint: hash(i, 3, 53),
    });
  }
  return out;
}
