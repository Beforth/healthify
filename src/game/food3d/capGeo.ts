/**
 * The flat face left behind by a cut, as a single cap wearing a texture.
 *
 * The scans arrive as shells, so slicing one leaves a hole and the half is hollow
 * — an uncapped half shows straight through the food. A face is laid over that
 * hole, and the face itself is nothing much as geometry: a fan from the middle of
 * the outline out to its edge, which is exact for any outline you can see every
 * edge of from its centre. A cob sliced across, a root sliced across, both qualify.
 *
 * What the fan is *not* allowed to be is untextured. The versions it replaces
 * fanned three overlapping discs in three flat colours, which both read as a
 * boiled egg and left a visible seam down the middle of the food while it was
 * still whole, because each disc had to be nudged out along x to stop it
 * z-fighting the one below. A single cap with the whole interior in its texture
 * needs none of that.
 */

import * as THREE from 'three';

/** A point on the cut plane, in the model's own units. */
export interface OutlinePoint {
  y: number;
  z: number;
}

export interface FaceSpace {
  /** The outline itself, in texture coordinates. */
  points: { u: number; v: number }[];
  uOf(z: number): number;
  vOf(y: number): number;
  yOf(v: number): number;
  zOf(u: number): number;
  yMin: number;
  yMax: number;
  zMin: number;
  zMax: number;
}

/**
 * Where the face is, in one place, for both the geometry and the texture.
 *
 * These two have to agree to the pixel. The cap's UVs and the image painted into
 * it are computed from the same outline, and the only way that stays true is for
 * both to ask here — a generator guessing its own mapping is how a skin band
 * ends up a third of the way into the flesh.
 */
export function faceSpace(outline: OutlinePoint[]): FaceSpace {
  let yMin = Infinity;
  let yMax = -Infinity;
  let zMin = Infinity;
  let zMax = -Infinity;
  for (const p of outline) {
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
    if (p.z < zMin) zMin = p.z;
    if (p.z > zMax) zMax = p.z;
  }
  const spanY = Math.max(1e-6, yMax - yMin);
  const spanZ = Math.max(1e-6, zMax - zMin);

  const uOf = (z: number) => (z - zMin) / spanZ;
  // texture v runs up the page while a generated image is written from the top
  // row down, so v is flipped here rather than in every generator
  const vOf = (y: number) => 1 - (y - yMin) / spanY;

  return {
    points: outline.map((p) => ({ u: uOf(p.z), v: vOf(p.y) })),
    uOf,
    vOf,
    yOf: (v: number) => yMin + (1 - v) * spanY,
    zOf: (u: number) => zMin + u * spanZ,
    yMin,
    yMax,
    zMin,
    zMax,
  };
}

/**
 * Drops corners that repeat, so a ring is not walked out twice in a row.
 *
 * The slice hands back a traced outline, but a mesh with a doubled or welded seam
 * puts the same corner in twice, and two identical neighbours make the ray casting
 * and the fan both count zero length of rim — which reads as a hole one pixel wide
 * rather than as the duplicate it is.
 */
export function cleanOutline(outline: OutlinePoint[]): OutlinePoint[] {
  const out: OutlinePoint[] = [];
  for (const p of outline) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.y - p.y) < 1e-6 && Math.abs(last.z - p.z) < 1e-6) continue;
    out.push(p);
  }
  while (
    out.length > 1 &&
    Math.abs(out[0].y - out[out.length - 1].y) < 1e-6 &&
    Math.abs(out[0].z - out[out.length - 1].z) < 1e-6
  ) {
    out.pop();
  }
  return out;
}

export interface FaceFrame {
  /** The outline, as a ring with no repeated corners. */
  outline: OutlinePoint[];
  face: FaceSpace;
  radius: FaceRadius;
}

/**
 * The outline, its mapping and its rim, built together and once.
 *
 * Generators take this rather than a bare outline because all three have to be
 * talking about the same rim, and anything that builds its own quietly — the cap
 * needing a different one for its own reasons, say — drifts far enough to show.
 */
export function faceFrame(outline: OutlinePoint[]): FaceFrame {
  const clean = cleanOutline(outline);
  const face = faceSpace(clean);
  return { outline: clean, face, radius: new FaceRadius(face.points) };
}

/**
 * How far the face reaches from its middle in every direction.
 *
 * A generated cut face has to know where the skin is, and the skin is the outline
 * — not a circle of half the image. A root sliced across is a wobbly oval, so a
 * generator that assumed it was round put the dark rim somewhere in the middle of
 * the flesh and left a flat band of nothing outside it.
 *
 * The boundary is the outer envelope of the outline points: every direction gets
 * the furthest point that falls in it, and directions the outline skipped are
 * filled in from their neighbours.
 *
 * The obvious alternative is to cast a ray and take where it leaves the outline,
 * which is exact and cheaper. It does not survive a real scan, though. These models
 * are coarse — the sweet potato is 239 triangles — so the plane only passes through
 * a scatter of disconnected slivers rather than a connected band, and a ray aimed
 * at the rim usually passes between two slivers and hits nothing, or hits one far
 * off to the side. Measured on that model, ray casting puts the rim anywhere
 * between 0.09 and 0.56 from the middle on a cross-section whose own points all sit
 * between 0.20 and 0.60, and leaves two thirds of the outline "outside" its own rim.
 * An envelope asks only which points exist, which is the one thing a scatter can
 * answer reliably, and it produces a clean dense rim for the cap and the texture
 * to be measured against.
 */
export function radialBoundary(points: { u: number; v: number }[], steps = 720): Float32Array {
  const out = new Float32Array(steps);
  if (points.length < 3) return out;

  let cu = 0;
  let cv = 0;
  for (const p of points) {
    cu += p.u;
    cv += p.v;
  }
  cu /= points.length;
  cv /= points.length;

  const per = new Float32Array(steps);
  for (const p of points) {
    const du = p.u - cu;
    const dv = p.v - cv;
    const dist = Math.hypot(du, dv);
    if (dist < 1e-9) continue;
    let a = Math.atan2(dv, du);
    if (a < 0) a += Math.PI * 2;
    const i = Math.floor((a / (Math.PI * 2)) * steps) % steps;
    if (dist > per[i]) per[i] = dist;
  }

  // directions with no point in them are normal on a coarse model, so carry the
  // nearest measured one either way round, easing it in so the rim stays smooth
  // rather than stepping
  const filled = new Float32Array(steps);
  const ease = 0.995;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < steps; i++) {
      const prev = filled[(i - 1 + steps) % steps];
      filled[i] = Math.max(per[i], filled[i] || prev * ease);
    }
    for (let i = steps - 1; i >= 0; i--) {
      const next = filled[(i + 1) % steps];
      filled[i] = Math.max(per[i], filled[i] || next * ease);
    }
  }

  let max = 0;
  for (let i = 0; i < steps; i++) max = Math.max(max, filled[i]);
  const fallback = max > 1e-6 ? max : 0.5;
  for (let i = 0; i < steps; i++) out[i] = filled[i] > 1e-6 ? filled[i] : fallback;
  return out;
}

/**
 * How far out a point sits, as 0 at the middle of the face and 1 at the skin.
 *
 * This is the coordinate every generator actually works in: it is what lets the
 * sweet potato's rings, the cob's rows of kernels and the root's cortex all be
 * written as "0.4 of the way to the edge" without any of them knowing the
 * outline's shape.
 */
export class FaceRadius {
  private readonly steps: number;
  private readonly boundary: Float32Array;
  private readonly cu: number;
  private readonly cv: number;
  private readonly fallback: number;

  constructor(points: { u: number; v: number }[], steps = 720) {
    this.steps = steps;
    this.boundary = radialBoundary(points, steps);
    let cu = 0;
    let cv = 0;
    for (const p of points) {
      cu += p.u;
      cv += p.v;
    }
    this.cu = points.length ? cu / points.length : 0.5;
    this.cv = points.length ? cv / points.length : 0.5;
    let max = 0;
    for (let i = 0; i < steps; i++) max = Math.max(max, this.boundary[i]);
    this.fallback = max > 1e-6 ? max : 0.5;
  }

  /** Interpolated skin distance for an angle already reduced to a bucket index.
   *  Shared with the cap so a point can be walked in to a known fraction of the
   *  way to the skin without a second, slightly different boundary. */
  boundaryAt(i0: number, i1: number, f: number): number {
    const edge = this.boundary[i0] * (1 - f) + this.boundary[i1] * f;
    return edge > 1e-6 ? edge : this.fallback;
  }

  /** 0 in the middle, 1 at the skin, past 1 outside the face. */
  at(u: number, v: number): number {
    const du = u - this.cu;
    const dv = v - this.cv;
    const dist = Math.hypot(du, dv);
    let a = Math.atan2(dv, du);
    if (a < 0) a += Math.PI * 2;
    const idx = a / (Math.PI * 2) * this.steps;
    const i0 = Math.floor(idx) % this.steps;
    const i1 = (i0 + 1) % this.steps;
    const f = idx - Math.floor(idx);
    return dist / this.boundaryAt(i0, i1, f);
  }

  /** The rim as a dense ring in texture space, at 1 in every direction.
   *  The cap is fanned to this rather than to the outline points themselves,
   *  because on a coarse scan those are a scatter of slivers with wide gaps. */
  ring(steps = 180): { u: number; v: number }[] {
    const out: { u: number; v: number }[] = [];
    for (let i = 0; i < steps; i++) {
      const ang = (i / steps) * Math.PI * 2;
      // the boundary is sampled far more finely than the ring, so the angle has to
      // be scaled onto it — using the ring's own index here reads a quarter of the
      // rim and sweeps it all the way round
      const idx = (ang / (Math.PI * 2)) * this.steps;
      const i0 = Math.floor(idx) % this.steps;
      const i1 = (i0 + 1) % this.steps;
      const dist = this.boundaryAt(i0, i1, idx - Math.floor(idx));
      out.push({ u: this.cu + Math.cos(ang) * dist, v: this.cv + Math.sin(ang) * dist });
    }
    return out;
  }

  /** The angle of a point, for generators whose pattern runs around the face. */
  angleOf(u: number, v: number): number {
    let a = Math.atan2(v - this.cv, u - this.cu);
    if (a < 0) a += Math.PI * 2;
    return a;
  }

  get centreU(): number {
    return this.cu;
  }

  get centreV(): number {
    return this.cv;
  }
}

/**
 * Fills the cut with one fan, `inset` of the way to the skin, textured with a
 * square image of the interior.
 *
 * Takes the same frame the texture was painted from, because the two have to
 * agree: a cap built against its own idea of the outline is how a fan ends up
 * wider than the hole it is covering.
 *
 * The inset is radial rather than a scale towards the middle, which matters more
 * than it looks. Scaling an outline point in towards the centre assumes the
 * outline is a circle seen from the middle; these roots and cobs are knobbly and
 * lopsided, and on a lopsided one that scale leaves part of the cap's edge sitting
 * outside the skin, showing as a seam of face poking through the food. Walking
 * each point in along its own ray to a known fraction of the distance to the skin
 * puts every one of them exactly `inset` from the middle, by construction.
 *
 * The UVs still come from the *un-inset* point. Addressing a smaller cap against
 * its own smaller edge would stretch the image, and a band that belongs at the
 * fruit's true edge — the dark skin a cut sweet potato is rimmed with — would end
 * up somewhere in the middle of the flesh.
 */
export function planarCap(frame: FaceFrame, inset: number, steps = 180): THREE.BufferGeometry | null {
  const { face, radius } = frame;
  if (frame.outline.length < 3) return null;

  const positions: number[] = [];
  const uvs: number[] = [];
  const corner = (u: number, v: number) => {
    // walked in to the fraction of the rim asked for, but addressed against the
    // rim itself so the image is not stretched to fit the smaller cap
    const du = u - radius.centreU;
    const dv = v - radius.centreV;
    const k = inset;
    const cu = radius.centreU + du * k;
    const cv = radius.centreV + dv * k;
    positions.push(0, face.yOf(cv), face.zOf(cu));
    uvs.push(u, v);
  };

  const cy = face.yOf(radius.centreV);
  const cz = face.zOf(radius.centreU);
  const ring = radius.ring(steps);

  for (let i = 0; i < steps; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % steps];
    positions.push(0, cy, cz);
    uvs.push(radius.centreU, radius.centreV);
    corner(a.u, a.v);
    corner(b.u, b.v);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}
