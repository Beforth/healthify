/**
 * The cut face of a burger, generated pixel by pixel.
 *
 * This is the awkward one of the interiors, and the awkwardness is structural
 * rather than decorative. A sweet potato, a carrot, a cob — all of those are cut
 * across, so what shows is a disc and everything in it runs outward from a
 * centre. A burger is cut *down through the stack*, so what shows is a wall: the
 * layers are horizontal bands, and the only thing that gives them their shape is
 * the silhouette. The cheese cannot be a ring, the tomato's seeds cannot radiate,
 * and the air pockets in the bun cannot be concentric. Everything here is a
 * function of two numbers instead — how high up the burger a pixel is, and how far
 * across it is — which is why this file does not resemble the potato's at all.
 *
 * So the face is addressed in the cap's own (u, v), the silhouette is reduced to a
 * left and right edge per height, and each pixel is told which side of the stack it
 * has fallen on. The layers are separated by *seams* rather than by fixed ranges: a
 * seam is a height that wanders, sags and frills across the width, which is what
 * makes a cheese slice read as draped over a patty instead of as a horizontal
 * stripe of paint. The seams are forced back into order afterwards, so a wild
 * wobble can make one wavy but can never fold a layer inside its neighbour.
 *
 * Nothing here is a canvas draw call, which also means it can be run outside a
 * browser to check what it produces.
 */

import { faceFrame, type OutlinePoint } from './capGeo';
import type { CutMaps } from './cutMaps';
import { clamp01, fbm, mix, noise, smoothstep } from './procTex';

export type BurgerLayerId =
  | 'bottom-bun'
  | 'sauce-lower'
  | 'patty'
  | 'cheese'
  | 'lettuce'
  | 'tomato'
  | 'sauce-upper'
  | 'top-bun';

export interface BurgerLayer {
  id: BurgerLayerId;
  /** The band's own reach, as a fraction of the face's height from the bottom. */
  v0: number;
  v1: number;
  color: readonly [number, number, number];
  roughness: number;
}

/** The roughness each material rests at, and how far down it goes at its wettest.
 *  Declared before the layer table, which quotes them. */
const ROUGH_BUN = 0.88;
const ROUGH_CRUST = 0.34;
const ROUGH_PATTY = 0.62;
const ROUGH_PATTY_WET = 0.24;
const ROUGH_FAT = 0.18;
const ROUGH_CHEESE = 0.38;
const ROUGH_CHEESE_WET = 0.22;
const ROUGH_LETTUCE = 0.6;
const ROUGH_LETTUCE_THIN = 0.3;
const ROUGH_TOMATO = 0.34;
const ROUGH_TOMATO_WET = 0.14;
const ROUGH_SAUCE = 0.52;
const ROUGH_SAUCE_PEAK = 0.3;

/**
 * The stack, bottom to top. Exported through `BurgerModel` so the cross-section
 * screen's markers and this texture can never disagree about a burger's anatomy.
 */
export const BURGER_LAYERS: BurgerLayer[] = [
  { id: 'bottom-bun', v0: 0.0, v1: 0.185, color: [242, 217, 166], roughness: ROUGH_BUN },
  { id: 'sauce-lower', v0: 0.17, v1: 0.215, color: [246, 232, 202], roughness: ROUGH_SAUCE },
  { id: 'patty', v0: 0.205, v1: 0.64, color: [146, 66, 46], roughness: ROUGH_PATTY },
  { id: 'cheese', v0: 0.6, v1: 0.7, color: [255, 201, 60], roughness: ROUGH_CHEESE },
  { id: 'lettuce', v0: 0.672, v1: 0.78, color: [96, 168, 84], roughness: ROUGH_LETTUCE },
  { id: 'tomato', v0: 0.762, v1: 0.848, color: [206, 44, 44], roughness: ROUGH_TOMATO },
  { id: 'sauce-upper', v0: 0.836, v1: 0.888, color: [246, 232, 202], roughness: ROUGH_SAUCE },
  { id: 'top-bun', v0: 0.87, v1: 1.0, color: [242, 217, 166], roughness: ROUGH_BUN },
];

/** Where each boundary sits before it is allowed to wander, and by how much. A
 *  burger's layers are stacked hard against one another, so the amplitudes are a
 *  couple of millimetres of a real sandwich rather than anything dramatic. */
const SEAMS: { v: number; wobble: number; freq: number; seed: number; droop: number }[] = [
  { v: 0.185, wobble: 0.006, freq: 5, seed: 21, droop: 0 },
  { v: 0.215, wobble: 0.005, freq: 7, seed: 22, droop: 0 },
  { v: 0.64, wobble: 0.009, freq: 4, seed: 23, droop: 0.5 },
  { v: 0.7, wobble: 0.012, freq: 9, seed: 24, droop: 0.3 },
  { v: 0.78, wobble: 0.016, freq: 15, seed: 25, droop: 0 },
  { v: 0.848, wobble: 0.008, freq: 6, seed: 26, droop: 0 },
  { v: 0.888, wobble: 0.006, freq: 5, seed: 27, droop: 0 },
];

/** Which layer sits in each of the eight runs the seams cut the face into. */
const BAND_IDS: BurgerLayerId[] = [
  'bottom-bun',
  'sauce-lower',
  'patty',
  'cheese',
  'lettuce',
  'tomato',
  'sauce-upper',
  'top-bun',
];

/** Brioche crumb: pale, enriched, and full of small round alveoli. */
const CRUMB = [242, 217, 166] as const;
const CRUMB_LIGHT = [251, 236, 199] as const;
const CRUMB_SHADE = [211, 176, 124] as const;
/** The glazed outside of a bun: far darker than its crumb, and far glossier. */
const CRUST = [161, 90, 33] as const;
const CRUST_HI = [203, 126, 51] as const;

/** Beef, read from the middle outwards: pink heart, browned transition, seared
 *  shell, charred at the very edge, with fat running through all of it. */
const PATTY_PINK = [199, 93, 86] as const;
const PATTY_MID = [148, 67, 46] as const;
const PATTY_SEAR = [103, 53, 31] as const;
const PATTY_CHAR = [43, 26, 19] as const;
const FAT = [244, 228, 189] as const;
const FAT_SEARED = [212, 174, 116] as const;

/** Cheddar, thin enough at the edges that light gets through it. */
const CHEESE = [255, 201, 60] as const;
const CHEESE_DEEP = [232, 155, 37] as const;
const CHEESE_THIN = [255, 226, 137] as const;

/** Lettuce: the frill is nearly translucent, the rib under it is not. */
const LETTUCE = [96, 168, 84] as const;
const LETTUCE_LIGHT = [158, 210, 110] as const;
const LETTUCE_DEEP = [51, 115, 59] as const;

/** Tomato: crimson gel, paler walls between the chambers, and the seeds. */
const TOMATO = [204, 42, 42] as const;
const TOMATO_GEL = [233, 94, 76] as const;
const TOMATO_WALL = [239, 170, 140] as const;
const TOMATO_SEED = [239, 223, 169] as const;

/** A mayonnaise-ish sauce: matte in the hollows, glossy on the peaks. */
const SAUCE = [246, 232, 202] as const;
const SAUCE_SHADE = [221, 199, 163] as const;

/** Outside the silhouette. The cap is inset a couple of percent so this is only
 *  ever a hairline, but it has to be the dark of a crevice rather than a colour,
 *  or the edge of the cap shows as a bright ring. */
const OUTSIDE = [25, 15, 10] as const;

/** The smallest gap two seams are allowed to close to, as a fraction of height.
 *  Below this the layers stop being layers and become noise. */
const MIN_SEAM_GAP = 0.004;

const cache = new Map<string, CutMaps>();

type Rgb = [number, number, number];

interface Painted {
  col: Rgb;
  rough: number;
}

const toward = (
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
): Rgb => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

/* ------------------------------------------------------------------ materials */

/**
 * Brioche. The crumb is a lace of small round holes, and the giveaway that it is
 * bread rather than sponge is what happens at the rim of each one: the hole is
 * darker than the crumb, but the crumb immediately *below* it is lighter, because
 * that is the wall the light came through. So the pockets are thresholded, then
 * shaded with a copy of the same field sampled a little lower down.
 */
function paintCrumb(w: number, v: number, t: number, isTop: boolean, U: (n: number) => number): Painted {
  // the pocket field, and a copy of it offset downward for the lit lower wall
  const field = fbm(U(w * 21), v * 21, 3, 31) * 0.7 + fbm(U(w * 9), v * 9, 2, 32) * 0.3;
  const shadow = fbm(U(w * 21), v * 21 + 0.16, 3, 31) * 0.7 + fbm(U(w * 9), v * 9 + 0.16, 2, 32) * 0.3;

  // thresholds sit either side of the noise's own median, which is where value
  // noise is reliably speckled rather than empty or solid
  const hole = smoothstep(0.6, 0.7, field);
  const rim = smoothstep(0.53, 0.6, field) * (1 - hole);
  const litWall = rim * (1 - smoothstep(0.6, 0.7, shadow));

  // the fine grain inside the crumb walls, and a slow density drift across the bun
  const grain = fbm(U(w * 78), v * 78, 2, 33) - 0.5;
  const drift = fbm(U(w * 4), v * 4, 2, 34) - 0.5;

  let col: Rgb = [CRUMB[0], CRUMB[1], CRUMB[2]];
  col = toward(col, CRUMB_SHADE, clamp01(0.5 + drift * 0.5) * 0.55);
  col = toward(col, CRUMB_LIGHT, litWall * 0.6);
  col = toward(col, CRUMB_SHADE, hole * 0.82);
  col = toward(col, CRUMB_SHADE, rim * 0.3);
  const g = 1 + grain * 0.09;
  col = [col[0] * g, col[1] * g, col[2] * g];

  // the underside of a bun is compressed and toasted where it sat on the board,
  // so the bottom bun darkens towards its own base
  if (!isTop) col = toward(col, CRUST, smoothstep(0.22, 0, t) * 0.4);

  // crumb is matte, and the holes are matte-er still
  const rough = ROUGH_BUN - litWall * 0.12 + hole * 0.06;
  return { col, rough };
}

/**
 * Beef. Doneness is a distance field, not a colour ramp: measured from the patty's
 * own four sides, a slice of beef is pink all the way through the middle and
 * browns towards every edge at once, because that is what the heat does to it. The
 * fat then runs through the whole of it as pale veins, and the outer shell is
 * charred wherever the grill was hottest.
 */
function paintPatty(
  w: number,
  v: number,
  sideZ: number,
  lo: number,
  hi: number,
  spanZ: number,
  U: (n: number) => number,
): Painted {
  // Doneness is a distance field, not a colour ramp: measured from the patty's own
  // four sides, a slice of beef is pink all the way through the middle and browns
  // towards every edge at once, because that is what the heat does to it. Both
  // axes are normalised by their own reach first, otherwise the patty — which is
  // far wider than it is thick — would brown only top and bottom and stay raw at
  // its ends, which is the giveaway of a fillet rather than a pressed patty.
  const hx = clamp01(sideZ / (spanZ * 0.5));
  const hy = clamp01(Math.min(v - lo, hi - v) / Math.max(1e-4, (hi - lo) * 0.5));
  const depth = Math.min(hx, hy);

  // the meat's own coarse grain, stretched along the burger the way a patty is
  // pressed — this is what makes it read as coarse rather than as a smooth fill
  const grain = fbm(U(w * 34), v * 26, 3, 41) - 0.5;
  const coarse = fbm(U(w * 13), v * 11, 3, 42) - 0.5;
  // griddle marks: the streaks a press leaves, only on the seared shell
  const grill = Math.sin(w * 34 + coarse * 5) * 0.5 + 0.5;

  // fat, as veins and as beads. Thresholding stretched noise gives long pale
  // streaks, and a second, tighter field gives the round beads of rendered fat
  // that sit in the seared part.
  const veinField = fbm(U(w * 26), v * 15, 3, 43);
  const vein = smoothstep(0.55, 0.66, veinField);
  const beadField = fbm(U(w * 52), v * 40, 2, 44);
  const bead = smoothstep(0.63, 0.72, beadField);

  const sear = smoothstep(0.3, 0.08, depth);
  const char = smoothstep(0.09, 0, depth) * (0.55 + grill * 0.45);
  const pink = smoothstep(0.18, 0.48, depth);

  let col: Rgb = [PATTY_MID[0], PATTY_MID[1], PATTY_MID[2]];
  col = toward(col, PATTY_PINK, pink * 0.92);
  col = toward(col, PATTY_SEAR, sear * 0.9);
  col = toward(col, PATTY_CHAR, clamp01(char) * 0.95);

  // the grain runs through the meat and deepens the colour where it is dense
  const d = 1 + grain * 0.13 + coarse * 0.16;
  col = [col[0] * d, col[1] * d, col[2] * d];

  // fat sits on top of all of that, and is lighter than every version of the meat
  col = toward(col, FAT, vein * 0.7);
  col = toward(col, bead > 0.5 ? FAT : FAT_SEARED, bead * 0.6 * (0.35 + sear * 0.65));

  // a cut patty is wet, and the middle is the wettest — that is the juice the
  // burger is sold on, and it is the only part of the face that should look wet
  const juice = pink * (0.5 + (fbm(U(w * 19), v * 16, 2, 45) - 0.5) * 0.9);
  col = toward(col, [214, 116, 104], clamp01(juice) * 0.3);

  let rough = ROUGH_PATTY;
  rough = mix(rough, ROUGH_PATTY_WET, clamp01(juice) * 0.85);
  rough = mix(rough, ROUGH_FAT, clamp01(vein) * 0.7);
  rough = mix(rough, 0.14, bead * 0.5);
  rough = mix(rough, 0.94, char * 0.8);

  return { col, rough };
}

/**
 * Cheddar. A slice that has been on a hot patty is not a slab: it has slumped, so
 * it is thickest where it landed and thinnest at the corners, and it has pulled
 * into faint strands as it cooled. Both of those are in the roughness and the
 * streaks rather than in the outline — the seam above the patty does the draping.
 */
function paintCheese(w: number, v: number, t: number, U: (n: number) => number): Painted {
  // thin towards the corners of the slice, which is where it stretched most
  const thin = 1 - smoothstep(0.0, 0.42, Math.min(w, 1 - w));
  // strands, pulled as it set
  const strand = fbm(U(w * 44), v * 12, 2, 51);
  const strandMask = smoothstep(0.56, 0.68, strand);
  // where the cheese is pooled and glossy rather than set
  const gloss = fbm(U(w * 15), v * 11, 2, 52);

  let col: Rgb = [CHEESE[0], CHEESE[1], CHEESE[2]];
  col = toward(col, CHEESE_DEEP, smoothstep(0.45, 0.8, t) * 0.45);
  col = toward(col, CHEESE_THIN, thin * 0.5);
  col = toward(col, CHEESE_THIN, strandMask * 0.28);
  // the underside, where it has welded to the meat, is darker and browner
  col = toward(col, FAT_SEARED, smoothstep(0.16, 0, t) * 0.22);

  const wet = clamp01(gloss * 1.2 - 0.25) * 0.7;
  const rough = mix(ROUGH_CHEESE, ROUGH_CHEESE_WET, wet);
  return { col, rough: rough + (strandMask - 0.5) * 0.06 };
}

/**
 * Lettuce. A frill of leaf cut through shows three things at once: the ruffle
 * itself, which is a torn edge and not level; the veins, which fan out and are much
 * paler than the blade; and the thin places, where the leaf is translucent enough
 * that light comes through it and it goes almost yellow.
 */
function paintLettuce(w: number, v: number, t: number, U: (n: number) => number): Painted {
  // the ruffle: a wave along the leaf that is folded over on itself in places
  const ruffle = Math.sin(w * 27 + noise(U(w * 6), v * 6, 61) * 5) * 0.5 + 0.5;
  const fold = fbm(U(w * 17), v * 7, 2, 62);
  // veins fanning along the leaf
  const veinField = fbm(U(w * 3), v * 40, 2, 63);
  const vein = smoothstep(0.58, 0.7, veinField);
  // where the leaf is thinnest
  const thin = smoothstep(0.72, 0.95, fold);

  let col: Rgb = [LETTUCE[0], LETTUCE[1], LETTUCE[2]];
  col = toward(col, LETTUCE_DEEP, (1 - ruffle) * 0.55);
  col = toward(col, LETTUCE_LIGHT, ruffle * 0.35);
  col = toward(col, [206, 226, 148], vein * 0.5);
  // the thin blade lets light through, so it goes yellow-green rather than white
  col = toward(col, [222, 234, 150], thin * 0.5);
  // the cut edge of the leaf all the way along, darker and crisper than the blade
  col = toward(col, LETTUCE_DEEP, smoothstep(0.1, 0, t) * 0.3);

  const rough = mix(ROUGH_LETTUCE, ROUGH_LETTUCE_THIN, thin * 0.7 + vein * 0.2);
  return { col, rough: rough - ruffle * 0.06 };
}

/**
 * Tomato. A slice is a ring of flesh around two or three chambers, divided by pale
 * radial walls and packed with seeds sitting in gel. The gel is the interesting
 * part: it is the most translucent thing on the face, and where it has run to the
 * bottom of the slice it pools and goes glassy.
 */
function paintTomato(w: number, v: number, t: number, U: (n: number) => number): Painted {
  // the slice's own centre, so everything is measured against the section and not
  // against the image
  const dx = (w - 0.5) * 2;
  const dy = (t - 0.5) * 2;
  const rad = Math.hypot(dx, dy * 1.5);

  // three chambers, so the walls are the two near-vertical creases
  const chamber = Math.abs(Math.sin(w * Math.PI * 3 + dy * 0.5));
  const wall = smoothstep(0.13, 0.0, chamber) * smoothstep(1.02, 0.9, rad);

  // the seeds, in a loose quincunx that drifts, each one a small pale lens
  const sx = w * 17 + noise(w * 4, v * 4, 71) * 2.4;
  const sy = (t - 0.5) * 9 + noise(w * 4, v * 4, 72) * 1.6;
  const cellX = sx - Math.floor(sx) - 0.5;
  const cellY = sy - Math.floor(sy) - 0.5;
  // seeds sit in the middle two thirds of the slice, not against its wall
  const seed = (1 - smoothstep(0.06, 0.17, Math.hypot(cellX, cellY * 1.4))) *
    smoothstep(1.0, 0.75, rad) * (1 - wall);

  // gel, and the juice that has run to the low edge of the slice
  const gel = fbm(U(w * 12), v * 5, 2, 73);
  const pool = smoothstep(0.3, 0.05, t) * smoothstep(0.5, 0.85, gel);

  let col: Rgb = [TOMATO[0], TOMATO[1], TOMATO[2]];
  col = toward(col, TOMATO_GEL, clamp01(gel * 1.3 - 0.2) * 0.6);
  col = toward(col, [242, 132, 116], pool * 0.45);
  col = toward(col, TOMATO_WALL, wall * 0.75);
  col = toward(col, TOMATO_SEED, seed * 0.9);
  // the skin, a darker ring right at the edge of the slice
  col = toward(col, [163, 26, 30], smoothstep(0.86, 1.0, rad) * 0.8);

  let rough = ROUGH_TOMATO;
  rough = mix(rough, ROUGH_TOMATO_WET, pool * 0.8 + clamp01(gel * 1.3 - 0.2) * 0.3);
  // the seeds are matte, which is most of what separates them from the gel
  rough = mix(rough, 0.62, seed * 0.85);
  rough = mix(rough, 0.5, wall * 0.6);
  return { col, rough };
}

/** A spooned sauce: ridges where it was spread, hollows between them, and a sheen
 *  on every peak. The sheen is the only thing that stops it reading as a filling. */
function paintSauce(w: number, v: number, t: number, U: (n: number) => number): Painted {
  const ridge = fbm(U(w * 20), v * 9, 3, 81);
  const bubble = smoothstep(0.7, 0.82, fbm(U(w * 40), v * 20, 2, 82));
  const peak = smoothstep(0.5, 0.75, ridge);

  let col: Rgb = [SAUCE[0], SAUCE[1], SAUCE[2]];
  col = toward(col, SAUCE_SHADE, smoothstep(0.55, 0.3, ridge) * 0.5);
  col = toward(col, SAUCE_SHADE, bubble * 0.3);
  // a bubble's lip catches the light on one side only
  col = toward(col, [255, 250, 238], bubble * smoothstep(0.6, 0.8, t) * 0.3);

  const rough = mix(ROUGH_SAUCE, ROUGH_SAUCE_PEAK, peak) + bubble * 0.12;
  return { col, rough };
}

/* ---------------------------------------------------------------------- build */

/**
 * The albedo and roughness of the cut face, as RGBA bytes ready for textures.
 *
 * `outline` is the real sliced outline in the model's units, so every band is as
 * wide as this particular burger is. The scan is lopsided, and a band painted to a
 * guessed width leaves daylight down both edges.
 */
export function buildBurgerMaps(size: number, outline: OutlinePoint[]): CutMaps {
  const frame = faceFrame(outline);
  const key = `burger:${size}:${frame.outline.length}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const face = frame.face;
  const spanZ = face.zMax - face.zMin;
  const spanY = face.yMax - face.yMin;
  // The face is not square, so noise is asked for at a different frequency across
  // it than up it. Without this an air pocket is a sixth wider than it is tall and
  // every seed in the tomato is an ellipse.
  const aspect = spanZ / Math.max(1e-6, spanY);
  const U = (n: number) => n * aspect;

  /* The silhouette, taken from the *cap's own* boundary rather than worked out a
   * second time. This scan is coarse enough that the two answers are not the same:
   * above the middle it contributes about one outline point per percent of height,
   * and between 80% and 85% it contributes four points spanning 8% of the width.
   * Any per-height edge of its own either collapses the dome into a funnel or has
   * to be repaired with outlier rejection, and either way it stops being the shape
   * the cap was fanned to — which shows up as texture spilling past the rim, or a
   * ring of daylight where the cap runs out before the paint does.
   *
   * `Frame.radius` is the boundary the cap itself is built from, and its `at` is 0
   * in the middle, 1 at the skin and past 1 outside, so walking a row outwards until
   * it crosses 1 finds the edge the geometry actually has. The left and right edges
   * are wanted separately for anything that has to know where it is across the
   * burger — the wobble on a seam, the drape of the cheese, how far in a crust
   * reaches — and those are the same two crossings. */
  const radius = frame.radius;

  const edgeAcross = (v: number, dir: 1 | -1): number => {
    let inside = 0.5;
    let outside = 0.5;
    let found = false;
    for (let step = 1; step <= 48; step++) {
      const u = 0.5 + dir * (step / 48);
      if (u < 0 || u > 1) break;
      if (radius.at(u, v) >= 1) {
        outside = u;
        inside = u - dir * (1 / 48);
        found = true;
        break;
      }
      inside = u;
    }
    if (!found) return dir === 1 ? 1 : 0;
    for (let k = 0; k < 10; k++) {
      const m = (inside + outside) / 2;
      if (radius.at(m, v) >= 1) outside = m;
      else inside = m;
    }
    return (inside + outside) / 2;
  };

  /** The left and right edge of the burger at one height, as texture u. */
  const edgesAtV = (v: number): [number, number] => [edgeAcross(v, -1), edgeAcross(v, 1)];

  const albedo = new Uint8ClampedArray(size * size * 4);
  const roughness = new Uint8ClampedArray(size * size * 4);

  for (let py = 0; py < size; py++) {
    // the cap's v runs from the burger's top down, because `faceSpace` flips it
    const v = 1 - (py + 0.5) / size;
    // the two edges are the same for every pixel in a row, and finding them means
    // walking out to the boundary and bisecting, which is far too much work to do
    // once per pixel — a 512 face would spend most of its time redrawing the same
    // two numbers 512 times over
    const [uL, uR] = edgesAtV(v);
    const width = Math.max(1e-4, uR - uL);

    for (let px = 0; px < size; px++) {
      const u = (px + 0.5) / size;
      const i = (py * size + px) * 4;

      if (u < uL || u > uR) {
        albedo[i] = OUTSIDE[0];
        albedo[i + 1] = OUTSIDE[1];
        albedo[i + 2] = OUTSIDE[2];
        albedo[i + 3] = 255;
        const o = 235;
        roughness[i] = o;
        roughness[i + 1] = o;
        roughness[i + 2] = o;
        roughness[i + 3] = 255;
        continue;
      }

      // how far across the burger this pixel is, 0 at one edge and 1 at the other
      const w = (u - uL) / width;
      // the same distance in the burger's own units, for anything that has to be a
      // real thickness: a crust is a millimetre, not a fraction of a face
      const sideZ = Math.min(u - uL, uR - u) * spanZ;

      /** The seven boundaries, at this pixel's place across the burger. */
      const seams = SEAMS.map((s) => {
        const wob =
          Math.sin(w * Math.PI) * 0.55 * s.wobble * s.droop +
          (fbm(U(w * s.freq), v * s.freq, 2, s.seed) - 0.5) * 2 * s.wobble;
        return s.v + wob;
      });
      // forced back into order, so a seam can wander but a layer cannot fold
      for (let k = 1; k < seams.length; k++) {
        if (seams[k] < seams[k - 1] + MIN_SEAM_GAP) seams[k] = seams[k - 1] + MIN_SEAM_GAP;
      }

      // which run the pixel has landed in: `band` counts the seams below it, and
      // the count runs to the full length so the run above the last seam — the top
      // bun — is reachable
      let band = 0;
      while (band < seams.length && v > seams[band]) band++;
      const id = BAND_IDS[band];
      const lo = band === 0 ? 0 : seams[band - 1];
      const hi = band < seams.length ? seams[band] : 1;
      const t = clamp01((v - lo) / Math.max(1e-4, hi - lo));

      let painted: Painted;
      switch (id) {
        case 'bottom-bun':
        case 'top-bun': {
          const isTop = id === 'top-bun';
          painted = paintCrumb(w, v, t, isTop, U);
          // the crust only exists where the bun's own surface has been in the
          // oven: the domed top, the flat base, and the two cut sides
          const vert = isTop ? (1 - v) * spanY : v * spanY;
          const crust = smoothstep(0.014, 0.001, Math.min(sideZ, vert));
          const sheen = fbm(U(w * 23), v * 23, 2, 91);
          painted.col = toward(painted.col, CRUST, crust * 0.93);
          painted.col = toward(painted.col, CRUST_HI, crust * sheen * 0.5);
          painted.rough = mix(painted.rough, ROUGH_CRUST, crust * 0.9);
          break;
        }
        case 'sauce-lower':
        case 'sauce-upper':
          painted = paintSauce(w, v, t, U);
          break;
        case 'patty':
          painted = paintPatty(w, v, sideZ, lo, hi, spanZ, U);
          break;
        case 'cheese':
          painted = paintCheese(w, v, t, U);
          break;
        case 'lettuce':
          painted = paintLettuce(w, v, t, U);
          break;
        default:
          painted = paintTomato(w, v, t, U);
          break;
      }

      // The bun is not a lining. In a real burger the crumb wraps round the
      // fillings, so the left and right edges of every middle layer are crumb
      // again rather than meat meeting the outside world.
      if (id !== 'bottom-bun' && id !== 'top-bun') {
        const wall = smoothstep(0.015, 0.003, sideZ);
        painted.col = toward(painted.col, CRUMB_SHADE, wall * 0.9);
        painted.rough = mix(painted.rough, ROUGH_BUN, wall * 0.85);
      }

      // a hairline of shadow wherever two layers touch, so they read as resting
      // on one another rather than as painted beside one another
      let contact = 0;
      for (const s of seams) {
        contact = Math.max(contact, 1 - smoothstep(0, 0.005, Math.abs(v - s)));
      }
      painted.col = toward(painted.col, [64, 40, 26], contact * 0.38);
      painted.rough = mix(painted.rough, 0.82, contact * 0.45);

      const col = painted.col;
      albedo[i] = col[0];
      albedo[i + 1] = col[1];
      albedo[i + 2] = col[2];
      albedo[i + 3] = 255;

      const rg = clamp01(painted.rough) * 255;
      roughness[i] = rg;
      roughness[i + 1] = rg;
      roughness[i + 2] = rg;
      roughness[i + 3] = 255;
    }
  }

  const maps = { albedo, roughness };
  cache.set(key, maps);
  return maps;
}




