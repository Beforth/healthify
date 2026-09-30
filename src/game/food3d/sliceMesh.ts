import * as THREE from 'three';

export interface SlicedHalf {
  /** The source surface with everything past x = 0 removed. */
  geometry: THREE.BufferGeometry;
  /** The loop the plane cut through, ordered around the face. Used to cap the
   *  opening — a sliced shell is hollow, and an uncapped half shows straight
   *  through the food. Following the real outline rather than a rectangle
   *  around it keeps the cap from poking out through the model's curved sides. */
  outline: { y: number; z: number }[];
  cut: { yMin: number; yMax: number; zMin: number; zMax: number };
}

/**
 * Cuts a loaded mesh in half down the x = 0 plane, once, at load time.
 *
 * The procedural foods get their halves for free: `buildHalfSolid` only ever
 * builds half a sphere. An imported model arrives whole, so it has to be cut,
 * and doing it in the geometry rather than with renderer clipping planes means
 * each half is then an ordinary mesh — free to slide, spin and bob with the rest
 * of the model instead of needing its clip plane re-derived every frame.
 *
 * Triangles that straddle the plane are clipped by walking the triangle's own
 * edges (Sutherland–Hodgman), which preserves winding, so the surface keeps
 * facing the way the artist built it.
 */
// Pre-allocated static vectors to eliminate 100,000+ GC object allocations during slicing
const v0 = new THREE.Vector3();
const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();
const p = [v0, v1, v2];

const u0 = new THREE.Vector2();
const u1 = new THREE.Vector2();
const u2 = new THREE.Vector2();
const t = [u0, u1, u2];

const polyP = [
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
  new THREE.Vector3(),
];
const polyT = [
  new THREE.Vector2(),
  new THREE.Vector2(),
  new THREE.Vector2(),
  new THREE.Vector2(),
];

export function sliceAtX(source: THREE.BufferGeometry, keepPositive: boolean): SlicedHalf {
  const geo = source.index ? source.toNonIndexed() : source;
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute | undefined;
  const sign = keepPositive ? 1 : -1;

  const outPos: number[] = [];
  const outUv: number[] = [];

  let yMin = Infinity;
  let yMax = -Infinity;
  let zMin = Infinity;
  let zMax = -Infinity;

  // Cross-section points along the cut plane x = 0
  const seen = new Map<string, { y: number; z: number }>();

  for (let i = 0; i + 2 < pos.count; i += 3) {
    for (let k = 0; k < 3; k++) {
      p[k].fromBufferAttribute(pos, i + k);
      if (uv) t[k].fromBufferAttribute(uv, i + k);
      else t[k].set(0, 0);
    }

    let polyLen = 0;

    for (let k = 0; k < 3; k++) {
      const cur = k;
      const next = (k + 1) % 3;
      const dCur = p[cur].x * sign;
      const dNext = p[next].x * sign;
      const keepCur = dCur >= 0;

      if (keepCur) {
        polyP[polyLen].copy(p[cur]);
        polyT[polyLen].copy(t[cur]);
        polyLen++;
      }

      if (keepCur !== dNext >= 0) {
        const s = dCur / (dCur - dNext);
        const hit = polyP[polyLen];
        hit.lerpVectors(p[cur], p[next], s);
        hit.x = 0;
        polyT[polyLen].lerpVectors(t[cur], t[next], s);
        polyLen++;

        if (hit.y < yMin) yMin = hit.y;
        if (hit.y > yMax) yMax = hit.y;
        if (hit.z < zMin) zMin = hit.z;
        if (hit.z > zMax) zMax = hit.z;
        const key = `${Math.round(hit.y * 2000)}:${Math.round(hit.z * 2000)}`;
        if (!seen.has(key)) seen.set(key, { y: hit.y, z: hit.z });
      }
    }

    // The clipped polygon has 3 or 4 corners; fan it back into triangles
    for (let k = 1; k + 1 < polyLen; k++) {
      for (const idx of [0, k, k + 1]) {
        const pt = polyP[idx];
        const uvPt = polyT[idx];
        outPos.push(pt.x, pt.y, pt.z);
        outUv.push(uvPt.x, uvPt.y);
      }
    }
  }

  // Dispose temporary non-indexed geometry to prevent GPU/heap leaks
  if (geo !== source) {
    geo.dispose();
  }

  const half = new THREE.BufferGeometry();
  half.setAttribute('position', new THREE.Float32BufferAttribute(outPos, 3));
  half.setAttribute('uv', new THREE.Float32BufferAttribute(outUv, 2));

  if (seen.size < 3) {
    source.computeBoundingBox();
    const b = source.boundingBox ?? new THREE.Box3();
    return {
      geometry: half,
      outline: [],
      cut: { yMin: b.min.y, yMax: b.max.y, zMin: b.min.z, zMax: b.max.z },
    };
  }

  const points = [...seen.values()];
  const cy = points.reduce((sum, pt) => sum + pt.y, 0) / points.length;
  const cz = points.reduce((sum, pt) => sum + pt.z, 0) / points.length;
  points.sort((a, b) => Math.atan2(a.z - cz, a.y - cy) - Math.atan2(b.z - cz, b.y - cy));

  return { geometry: half, outline: points, cut: { yMin, yMax, zMin, zMax } };
}
