/**
 * The carrot's own geometry, kept apart from the component that draws it.
 *
 * `carrotFlesh` has to know the shape of the face it is painting — where the skin
 * is at every height, how wide the root is there, how far along it a pixel is —
 * and it has to be able to ask without a React tree, a WebGL context or a browser
 * standing between the question and the answer. The silhouette and the skin
 * gradient are the answers, so they live here, and `CarrotModel` imports them like
 * every other model in this folder imports its own shape.
 *
 * The split is a long way down the carrot's own axis rather than a lathe, so the
 * cut face is a lens about three times as long as it is wide (2.54 by 0.87 on this
 * root, measured off the outline below). Everything downstream depends on that
 * number, which is why it is not left to be assumed.
 */

import * as THREE from 'three';
import { buildHalfSolid, type HalfSolid } from './halfSolid';
import type { OutlinePoint } from './capGeo';
import { noise } from './procTex';

/** A root this size is a 20 mm carrot in the app's world units: 0.82 across the
 *  crown, 2.54 from tip to shoulder once the length scale is on. */
export const RADIUS = 0.82;

/** Kept as one set of colours rather than rebuilt per vertex: the skin gradient is
 *  evaluated for every vertex of both halves, and this loop is the one place in the
 *  model that runs often enough to notice. */
const SKIN_DEEP = new THREE.Color('#c9560c');
const SKIN_ORANGE = new THREE.Color('#f0791a');
const SKIN_LIGHT = new THREE.Color('#ff9f43');

/** The ribbing: how much a given side of the root is standing out at one height
 *  around its axis, as a multiplier on the radius.
 *
 *  Read off `atan2(z, x)` rather than off a single height, because a root is not
 *  round — the number of shallow grooves down its length is what separates it from
 *  a lathe-turned cone, and a noise field sampled around the circle gives them
 *  irregularly instead of in a fluted pattern, which is the other way to look
 *  machined. Sampling it on `(cos, sin)` of the angle rather than on the angle
 *  itself is what keeps the field continuous where the angle wraps.
 *
 *  A radial multiplier leaves the angle itself alone, which matters twice over:
 *  the skin gradient can call this again on the already-deformed vertex and get
 *  the same number back, and the cut plane passes through two diametrically
 *  opposite sides of the root, so the two edges of the face are scaled by
 *  whatever each side's own groove happens to be. That is a lopsided root, which
 *  is correct, and it is why this can be applied to a food that gets sliced. */
function ridgeAt(p: THREE.Vector3): number {
  const a = Math.atan2(p.z, p.x);
  return noise(Math.cos(a) * 3.2, Math.sin(a) * 3.2, 61) * 2 - 1;
}

/** Carrot silhouette: a long cone, widest at the crown and tapering to a point,
 *  with the shoulder rounded off on top. The cut runs down x = 0. */
export function deformCarrot(p: THREE.Vector3, ny: number) {
  const natural = Math.sqrt(Math.max(1e-4, 1 - ny * ny));
  // 0 at the tip, 1 at the crown
  const t = THREE.MathUtils.clamp((ny + 1) / 2, 0, 1);

  // A near-linear taper is what makes it a root rather than a fruit; the
  // exponent keeps a touch of belly so it doesn't look machined.
  const taper = Math.pow(t, 0.44);
  // round the very top over instead of leaving a flat-cut cylinder
  const shoulder = Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, (t - 0.88) / 0.12), 2)));
  const k = (taper * shoulder) / natural;

  // Ribbing is a share of the root's own width rather than a fixed depth, so a
  // groove near the tip is as shallow as the tip is thin.
  const rib = 1 + ridgeAt(p) * 0.016 * (1 - 0.35 * t);

  p.x *= k * 0.56 * rib;
  p.z *= k * 0.56 * rib;
  p.y *= 1.55;

  // a slight lean toward the tip, so it reads as something grown, not turned on a lathe
  p.z += 0.14 * (1 - t) * (1 - t);
}

export function carrotColor(p: THREE.Vector3, ny: number, target: THREE.Color) {
  const t = THREE.MathUtils.clamp((ny + 1) / 2, 0, 1);

  // deeper at the tip, brighter toward the crown
  target.copy(SKIN_DEEP).lerp(SKIN_ORANGE, THREE.MathUtils.smoothstep(t, 0.05, 0.6));
  target.lerp(SKIN_LIGHT, THREE.MathUtils.smoothstep(t, 0.55, 1) * 0.55);

  // faint horizontal banding, the marks a carrot carries where rootlets grew
  const band = 0.5 + 0.5 * Math.cos(ny * 34);
  target.lerp(SKIN_DEEP, band * 0.14);

  // Dirt and shadow collect in the grooves, so a ridge that stands proud is a
  // little brighter and a groove a little darker. `ridgeAt` reads the same number
  // off the deformed vertex that `deformCarrot` scaled the radius by, so the
  // shading lands in the same grooves the geometry is actually wearing.
  const rib = ridgeAt(p);
  if (rib > 0) target.lerp(SKIN_LIGHT, rib * 0.05);
  else target.lerp(SKIN_DEEP, -rib * 0.16);
}

/** One half of the root: the skin shell, and the outline the cut left behind. */
export function carrotHalf(isLeft: boolean): HalfSolid {
  return buildHalfSolid(isLeft, RADIUS, deformCarrot, carrotColor);
}

/**
 * The half's cut outline, in the `(y, z)` shape every cut-face helper wants.
 *
 * `buildHalfSolid` hands the seam back as `(z, y)` pairs, because it was written
 * for placing cores and pits in a face's own 2D space. The cap and the texture both
 * address the face as a point on the cut plane instead, so the two components are
 * named rather than left to be read off an index.
 *
 * For a root split down its own length this is not a closed ring in any interesting
 * sense: the seam is the two diametrically opposite sides of the root, so the loop
 * is a single closed lens running out to the tip and back from the crown — 96
 * points, `y` from -1.27 to 1.27, `z` from -0.43 to 0.44, half-width 0.435 at its
 * widest. It is star-shaped about its middle, so `planarCap` can fan it.
 */
export function carrotOutline(half: HalfSolid): OutlinePoint[] {
  return half.outline.map((p) => ({ y: p.y, z: p.x }));
}
