/**
 * The cut face of a carrot, generated pixel by pixel.
 *
 * A carrot split down its own length is the one cut in the app whose interior is
 * not radial from a centre. Every other root is sliced across, so `FaceRadius` —
 * distance from the middle of the face, 1 at the skin — is the whole of its
 * anatomy, and the sweet potato gets its rings out of it in a few lines. This face
 * is a lens about three times as long as it is wide (2.54 by 0.87 on this root,
 * measured off the outline rather than assumed), and a core measured as a circle
 * about the middle of that would come out as a blob at the root's waist instead of
 * the stripe down its length that a carrot actually wears.
 *
 * So everything here is written in two fields taken off the outline instead. `t` is
 * how far along the root a pixel is, 0 at the tip and 1 at the crown, and `s` is how
 * far out from the root's own axis it sits, 0 at the pith and 1 at the skin. The
 * core is then a stripe in `s` and the growth lines a fan in `t`, which is what they
 * are anatomically. Where the two edges of the face are at each height comes from
 * `silhouetteBand`, the same reduction the broccoli and the burger use, because a
 * carrot needs a second answer out of it and there is no reason for a second
 * algorithm to exist alongside the first.
 *
 * The lines are the root's own. The vascular bundles leave the pith and run out
 * and a little toward the crown, strongest where they leave it and blending into
 * one another as they spread — so they are a sum of harmonics of the angle taken
 * about a point on the axis, each a whole number of turns so the pattern closes on
 * itself and leaves no seam where it wraps, and bent on a noise field so no bundle
 * runs dead straight out to the skin. This is the pineapple's fibre construction and
 * it is here for the same reason: a fan is the only thing that reads as a fan.
 *
 * The surface is wet, and nearly all of that wetness lives in the roughness map. A
 * carrot is about 88% water and a fresh cut does glisten, but a glisten is light
 * coming *off* a film, and a film painted into the albedo can only ever be a white
 * smear. So the juice is a broad patchy drop in roughness, plus the darkening wet
 * flesh always has. No beads on this one, unlike the pineapple: a droplet big enough
 * to notice on its own reads as a bubble in the plastic, and the brief this is
 * drawn for asks for a carrot that is not glossy.
 *
 * Nothing here is a canvas draw call, which also means it can be run outside a
 * browser to check what it produces.
 */

import { faceFrame, type OutlinePoint } from './capGeo';
import { edgesAt, silhouetteBands } from './silhouetteBand';
import type { CutMaps } from './cutMaps';
import { clamp01, fbm, hash, mix, noise, smoothstep } from './procTex';

/** Colours read off a split carrot: the bright dense orange of the flesh, the
 *  slightly deeper ring of it against the skin, the pale yellow of the pith down
 *  the middle, the line where the two meet, the paler strands the bundles catch the
 *  light along, and the skin — the one part of this face that is not orange. */
const FLESH = [240, 119, 29] as const;
const FLESH_DEEP = [214, 92, 14] as const;
const CORE = [255, 196, 122] as const;
const CORE_EDGE = [206, 110, 36] as const;
const LINES = [255, 176, 88] as const;
const SKIN = [198, 84, 14] as const;

/** Generated once and shared by every face on screen — both halves of the cut and
 *  the microscope's own copy would otherwise each pay for it. */
const cache = new Map<string, CutMaps>();

/** What the flesh sits at where nothing has happened to it. Higher than the
 *  pineapple's 0.14 by a long way: this one is not meant to look wet so much as
 *  freshly cut. */
const DRY = 0.6;
/** Where the juice is standing. Broad, and still nowhere near a mirror. */
const WET = 0.3;

/** How many cells across the root's width. The cells are the visible grain of the
 *  flesh, and they are read at roughly four pixels each on the board, which is the
 *  coarsest that still looks like cells rather than as dirt. */
const CELLS = 26;

/** Whole numbers, and none a multiple of another, so no two bundles line up and the
 *  fan closes on itself at ±π. The first one sets how far apart the bundles read;
 *  the rest are the finer strands inside each. */
const LINE_HARMONICS = [9, 17, 31, 53, 7];

/** The pith, as a share of the root's half-width at that height. A split carrot's
 *  core is a stripe, not a rod, and it is narrow — about a seventh of the way to
 *  the skin either side of the axis. */
const CORE_HALF = 0.13;

/** How far along the root the pith is visible. It runs the whole length of a real
 *  one, thinning to nothing at the very tip. */
const CORE_TIP = 0.03;
const CORE_FADE = 0.1;

/**
 * The albedo and roughness of the cut face, as RGBA bytes ready for textures.
 *
 * `outline` is this root's real seam, in the model's own units, so the pith, the
 * bundles and the skin band all land on this particular carrot rather than on a
 * guessed ellipse — the face is 2.9:1, and any code that assumes a round one puts
 * the skin a third of the way into the flesh and turns the core into a blob.
 */
export function buildCarrotMaps(size: number, outline: OutlinePoint[]): CutMaps {
  const frame = faceFrame(outline);
  const key = `carrot:${size}:${frame.outline.length}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const { face } = frame;
  // One scale for both axes, so equal steps in the bundle fan are equal distances
  // in world units. Left unscaled, the lines bunch up at the ends of the root and
  // spread out in the middle, which is a pattern no carrot has.
  const spanY = Math.max(1e-6, face.yMax - face.yMin);
  const LONG = spanY / Math.max(1e-6, face.zMax - face.zMin);

  // One left edge and one right edge per height band. 96 of them is two per row of
  // the source sphere's 48, so the root's own curve survives without the band
  // reduction stepping over it.
  const bands = silhouetteBands(outline, 96, 1);

  const albedo = new Uint8ClampedArray(size * size * 4);
  const roughness = new Uint8ClampedArray(size * size * 4);

  for (let py = 0; py < size; py++) {
    const v = (py + 0.5) / size;
    const y = face.yOf(v);
    // 0 at the tip, 1 at the crown
    const t = clamp01((y - face.yMin) / spanY);

    // The root's own axis and half-width at this height, read once per row. The
    // two sides are not the same distance from the axis — the ribbing scales each
    // side by its own groove — so the axis is their middle rather than z = 0, and
    // the whole face's anatomy is measured out from there.
    const edge = edgesAt(bands, y);
    const axis = (edge.z0 + edge.z1) / 2;
    const half = Math.max((edge.z1 - edge.z0) / 2, 1e-6);

    // The pith wanders a little off the axis down the root, and it is narrower at
    // the tip than at the crown.
    const coreW = CORE_HALF * (0.72 + 0.56 * t) * (1 + (noise(t * 5, 3.7, 31) - 0.5) * 0.5);
    const coreRun = smoothstep(CORE_TIP, CORE_TIP + CORE_FADE, t);

    for (let px = 0; px < size; px++) {
      const u = (px + 0.5) / size;
      // -1 at one edge of the skin, 1 at the other, 0 on the axis
      const lat = (face.zOf(u) - axis) / half;
      const s = Math.abs(lat);
      const i = (py * size + px) * 4;

      // The slow field the flesh is mottled by, and the slower patches the juice
      // stands in. Two fields rather than one read twice, because they want
      // different shapes: the mottle is isotropic, the wetness runs with the grain.
      const drift = fbm(t * 7, lat * 1.2, 3, 23);

      // ---- the pith down the middle, and the line where it meets the flesh ----
      // A carrot's core is a stripe, so this is a threshold in `s` and nothing to
      // do with which way the pixel faces. The edge of it is never clean, so the
      // boundary is pushed about before it is tested, and a separate, thinner mask
      // marks the tougher ring just outside it — one mask for both is how the
      // whole flesh ends up looking dried out.
      const coreEdge = coreW * (1 + (noise(t * 9, lat * 2.4, 29) - 0.5) * 0.55);
      const core = (1 - smoothstep(coreEdge * 0.4, coreEdge, s)) * coreRun;
      const coreRim =
        smoothstep(coreEdge * 0.95, coreEdge * 1.3, s) * (1 - smoothstep(coreEdge * 1.3, coreEdge * 1.85, s));

      // ---- the bundles, running out from the pith toward the crown ----
      // A fan about a point on the axis, with both axes on one scale first so the
      // harmonics mean the same world distance wherever they land.
      const ang = Math.atan2((t - 0.52) * LONG, lat);
      const bend = 1.1 * noise(Math.cos(ang) * 2.4, Math.sin(ang) * 2.4, 17);
      // One harmonic carries the fan and the rest only break it up. Summing them
      // with comparable weight, which is the obvious way to write this, gives a
      // low-frequency wobble instead of strands: averaged together they rarely
      // reach half their range, so no threshold carves anything countable out of
      // it and the flesh gets a slow brightness drift rather than lines. The
      // carrier alone is what sets how many bundles there are and how far apart
      // they read; the others stop any two of them being the same.
      let fine = 0;
      let amp = 1;
      let norm = 1;
      for (let k = 1; k < LINE_HARMONICS.length; k++) {
        fine += amp * Math.sin(ang * LINE_HARMONICS[k] + bend + k * 1.7);
        norm += amp;
        amp *= 0.66;
      }
      const carrier = Math.sin(ang * LINE_HARMONICS[0] + bend) + (fine / norm) * 0.55;
      // Strongest where the bundles are packed tightest, at the pith, and thinning
      // out as they spread toward the skin — but never gone: the fibres run all the
      // way out, they just blend into each other rather than stopping.
      const ray = smoothstep(0.4, 0.92, carrier) * (0.5 + 0.5 * Math.exp(-s * 2.0)) * coreRun;
      // the single strands inside each bundle
      const strand = smoothstep(0.5, 0.95, Math.abs(noise(Math.cos(ang) * 110, Math.sin(ang) * 110, 5) * 2 - 1));

      // ---- the cells the flesh is made of ----
      // Each is a jittered dot on a grid, and the nearest one owns the pixel, so
      // the walls between them come out as a connected honeycomb rather than a
      // scatter of unrelated circles. The grid is stretched along the root, and
      // stretched by rather more than the face's own 2.9:1 proportion, because the
      // cells really are longer than they are wide — they are stacked along the
      // bundles. Matching the proportion exactly would square them off, but it
      // would also put barely three pixels of texture in each cell along the root,
      // and a cell wall that thin does not read as a cell, it reads as dirt.
      const gx = (lat * 0.5 + 0.5) * CELLS;
      const gy = t * CELLS * LONG * 0.55;
      const cellX = Math.floor(gx);
      const cellY = Math.floor(gy);
      let near = Infinity;
      let nearSeed = 0;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const jx = cellX + ox + 0.15 + hash(cellX + ox, cellY + oy, 3) * 0.7;
          const jy = cellY + oy + 0.15 + hash(cellX + ox, cellY + oy, 4) * 0.7;
          const d = Math.hypot(gx - jx, gy - jy);
          if (d < near) {
            near = d;
            nearSeed = hash((cellX + ox) * 73856093, (cellY + oy) * 19349663, 7);
          }
        }
      }
      // The window sits high in the distribution on purpose. The nearest-point
      // distance to a grid of jittered dots peaks well below one and falls off
      // slowly, so a threshold anywhere near the middle claims most of the flesh
      // and the honeycomb stops being a structure and becomes a flat darkening —
      // which is what it did at 0.3, where seven pixels in ten counted as wall.
      // Up here the walls are the thin bright-edged lines between cells that the
      // grain is actually made of.
      const wall = smoothstep(0.55, 0.7, near);
      const cellTone = hash(nearSeed, nearSeed, 7);
      // juice sitting proud in each cell catches the light along its near edge
      const cellSheen = smoothstep(0.5, 0.1, near) * (0.35 + cellTone * 0.5);

      // ---- the base colour ----
      // Denser and a shade deeper toward the skin, where the flesh is oldest.
      const deep = smoothstep(0.5, 1.0, s);
      let r = mix(FLESH[0], FLESH_DEEP[0], deep);
      let g = mix(FLESH[1], FLESH_DEEP[1], deep);
      let b = mix(FLESH[2], FLESH_DEEP[2], deep);

      const mottle = (drift - 0.5) * 26;
      r += mottle;
      g += mottle * 0.94;
      b += mottle * 0.8;

      // cells first, then the bundles over the top of them
      const cellShade = 1 - wall * 0.1;
      r = r * cellShade + cellSheen * 30;
      g = g * cellShade + cellSheen * 22;
      b = b * cellShade + cellSheen * 6;
      r = mix(r, FLESH_DEEP[0], wall * 0.16);
      g = mix(g, FLESH_DEEP[1], wall * 0.16);
      b = mix(b, FLESH_DEEP[2], wall * 0.16);

      // the bundles are paler than the flesh they run through, and much fainter
      // inside the pith, which is a solid mass of them rather than something
      // stretched through juice
      const lineInk = clamp01(ray * 0.75 + strand * 0.3) * (0.3 + 0.7 * (1 - core));
      r = mix(r, LINES[0], lineInk);
      g = mix(g, LINES[1], lineInk);
      b = mix(b, LINES[2], lineInk);

      // the pith itself, and the darker line where it meets the flesh
      r = mix(r, CORE[0], core * 0.9);
      g = mix(g, CORE[1], core * 0.9);
      b = mix(b, CORE[2], core * 0.9);
      r = mix(r, CORE_EDGE[0], coreRim * 0.34);
      g = mix(g, CORE_EDGE[1], coreRim * 0.34);
      b = mix(b, CORE_EDGE[2], coreRim * 0.34);

      // ---- the skin ----
      // Sharp, because a cut edge against a wet inside is the whole contrast of
      // the face — and it has to be cut off exactly where the outline is or the cap
      // shows a flat ring of nothing beyond it. The inner edge of it is broken up,
      // because a carrot's skin does not come off in a clean line.
      const skinAt = 0.955 + (noise(t * 40, 1.7, 83) - 0.5) * 0.045;
      const skin = smoothstep(skinAt, 1.0, s);
      r = mix(r, SKIN[0], skin);
      g = mix(g, SKIN[1], skin);
      b = mix(b, SKIN[2], skin);

      // ---- the juice ----
      // Broad and patchy, and never over the whole face: this is a film standing in
      // the low places of a cut surface, not a glaze. Thresholds sit either side
      // of the noise's own median rather than out in its upper tail, because
      // value-noise averages towards the middle and a threshold at 0.6 catches a
      // quarter of the face at best and can easily catch none of it.
      //
      // The field is stretched along the root, so the patches run with the grain
      // instead of dappling it.
      const film = smoothstep(0.5, 0.72, noise(t * 6.5, lat * 2.5, 71));
      // Wet flesh is darker and a shade more saturated than dry flesh, and the
      // part hard against the skin is dry: that is where the cut pulled away from
      // it and there is nothing left to hold juice.
      const wet = film * (1 - smoothstep(0.9, 1.0, s));
      const wetDark = 1 - wet * 0.06;
      r *= wetDark;
      g *= wetDark;
      b *= wetDark;

      let rough = DRY;
      rough += (drift - 0.5) * 0.1;
      rough += wall * 0.12;
      rough += core * 0.07;
      rough -= strand * 0.03;
      rough = mix(rough, WET, wet * 0.9);
      rough = mix(rough, 0.9, skin);

      albedo[i] = r;
      albedo[i + 1] = g;
      albedo[i + 2] = b;
      albedo[i + 3] = 255;

      const rg = clamp01(rough) * 255;
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

/** Exposed so the microscope can point at what is actually on the face. */
export const CARROT_TONES = { FLESH, FLESH_DEEP, CORE, CORE_EDGE, LINES, SKIN } as const;
