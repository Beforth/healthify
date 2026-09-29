/**
 * The cut face of a sweet potato, generated pixel by pixel.
 *
 * A sweet potato is the one food in the app whose cut is genuinely a disc. The
 * scan lies with its length down z, the model turns a quarter so the length runs
 * along x, and the cut is a slice across the root — so what shows is the
 * transverse section, and everything in it runs in rings from the middle outwards.
 * That is the whole difference from the three stacked discs it used to be given:
 * there is a centre, there are growth rings that spiral out from it, there is a
 * denser band of cortex against the skin, and the skin itself closes the edge.
 *
 * The surface is dry. A tuber has no shine on it at all while it is whole, and
 * the cut is no wetter than the skin beside it — what it has instead is a starchy
 * milkiness that settles in patches and goes *dull* specular rather than bright,
 * so the film is carried almost entirely in the roughness map.
 *
 * Nothing here is a canvas draw call, which also means it can be run outside a
 * browser to check what it produces.
 */

import { faceFrame, type OutlinePoint } from './capGeo';
import type { CutMaps } from './cutMaps';
import { clamp01, fbm, hash, mix, noise, smoothstep } from './procTex';

/** Colours read off a cut sweet potato: the dense orange-terracotta flesh, the
 *  slightly paler heart, the deeper ring of cortex against the skin, and the skin
 *  itself — dusty and purplish, the one part of this face that is not orange. */
const FLESH = [198, 96, 44] as const;
const HEART = [216, 124, 62] as const;
const CORTEX = [172, 78, 36] as const;
const SKIN = [58, 40, 52] as const;
const FILM = [238, 222, 208] as const;

/** Generated once and shared by every face on screen — both halves of the cut
 *  and the microscope's own copy would otherwise each pay for it. */
const cache = new Map<string, CutMaps>();

/** The matte base the flesh sits at. High: a tuber reflects almost nothing. */
const DRY = 0.84;
/** What the starchy film drops to where it settles. Still broad, never a mirror. */
const FILM_ROUGH = 0.42;

/**
 * The albedo and roughness of the cut face, as RGBA bytes ready for textures.
 *
 * `outline` is the real sliced outline in the model's units, so that the ring
 * pattern and the skin band land on this particular root rather than on a guessed
 * circle — these roots are knobbly and lopsided, and a round assumption puts the
 * dark rim a third of the way into the flesh.
 */
export function buildSweetPotatoMaps(size: number, outline: OutlinePoint[]): CutMaps {
  const frame = faceFrame(outline);
  const key = `sweet-potato:${size}:${frame.outline.length}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const radius = frame.radius;

  const albedo = new Uint8ClampedArray(size * size * 4);
  const roughness = new Uint8ClampedArray(size * size * 4);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const u = (px + 0.5) / size;
      const v = (py + 0.5) / size;
      const i = (py * size + px) * 4;

      const r = radius.at(u, v);
      const ang = radius.angleOf(u, v);

      // The growth rings. A sweet potato's are not even circles — they wander,
      // and they drift a little anticlockwise as they go out, which is what makes
      // a cut one read as grown rather than machined.
      const spin = ang + r * 1.35;
      const ringPhase = (spin * 5.5 + fbm(u * 7, v * 7, 3, 11) * 2.2) % 1;
      const ring = 0.5 - 0.5 * Math.cos(ringPhase * Math.PI * 2);
      // rings fade out toward the middle, where the flesh is uniformly dense
      const ringWeight = smoothstep(0.06, 0.3, r) * (1 - smoothstep(0.72, 0.94, r));

      // Fine fibre, running mostly outward along the root with a tangential
      // wander. Stretched noise: the root is fibrous, not grainy.
      const fibre = fbm(u * 46 + Math.cos(ang) * 3, v * 46 + Math.sin(ang) * 3, 3, 3) - 0.5;

      // The starchy film. Broad, patchy, and never over most of the face — this
      // is milkiness settling in the cuts of a dry surface, not a glaze.
      //
      // Thresholds sit either side of the noise's own median rather than out in
      // its upper tail: value-noise averages towards the middle, so a threshold
      // at 0.6 catches a quarter of the face at best and can easily catch none of
      // it depending on where the seed happens to land. Around the median it is
      // reliably patchy.
      const filmNoise = noise(u * 9, v * 9, 71);
      const film = smoothstep(0.52, 0.66, filmNoise) * smoothstep(0.08, 0.2, r);

      // Flesh: the heart is a touch paler and only right in the middle.
      let col: [number, number, number] = [
        mix(FLESH[0], HEART[0], (1 - smoothstep(0, 0.34, r)) * 0.8),
        mix(FLESH[1], HEART[1], (1 - smoothstep(0, 0.34, r)) * 0.8),
        mix(FLESH[2], HEART[2], (1 - smoothstep(0, 0.34, r)) * 0.8),
      ];

      // The rings, as a density change rather than a colour swap.
      const d = 1 + ring * ringWeight * 0.16 + fibre * 0.1;
      col = [col[0] * d, col[1] * d, col[2] * d];

      // Denser cortex in the last stretch before the skin.
      const cortex = smoothstep(0.72, 0.9, r) * (1 - smoothstep(0.9, 0.985, r));
      col = [mix(col[0], CORTEX[0], cortex), mix(col[1], CORTEX[1], cortex), mix(col[2], CORTEX[2], cortex)];

      // The film, laid over the flesh rather than mixed into it.
      col = [mix(col[0], FILM[0], film * 0.42), mix(col[1], FILM[1], film * 0.42), mix(col[2], FILM[2], film * 0.42)];

      // The skin. Sharp, because a cut edge against a rough outside is the whole
      // contrast of the face — and it has to be cut off exactly where the outline
      // is or the cap shows a flat ring of nothing beyond it.
      const skin = smoothstep(0.955, 0.995, r);
      col = [mix(col[0], SKIN[0], skin), mix(col[1], SKIN[1], skin), mix(col[2], SKIN[2], skin)];

      let rough = DRY - ring * ringWeight * 0.03 + fibre * 0.06;
      rough = mix(rough, FILM_ROUGH, film * 0.85);
      rough = mix(rough, 0.92, skin);

      albedo[i] = col[0];
      albedo[i + 1] = col[1];
      albedo[i + 2] = col[2];
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
export const SWEET_POTATO_TONES = { FLESH, HEART, CORTEX, SKIN, FILM } as const;

/** Kept for the deterministic per-pixel jitter the fibre uses. */
export const detailNoise = noise;
export const pixelHash = hash;
