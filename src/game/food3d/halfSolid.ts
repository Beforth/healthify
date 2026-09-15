import * as THREE from 'three';

/** Nudges a vertex into the fruit's real silhouette. `ny` is the vertex's original
 *  height on the source sphere, -1 at the base to +1 at the top. */
export type Deform = (p: THREE.Vector3, ny: number) => void;

/** Per-vertex skin colour, so fruit gets natural blush gradients without any texture map. */
export type ColorAt = (p: THREE.Vector3, ny: number, target: THREE.Color) => void;

export interface HalfSolid {
  /** The curved outer skin of one half. */
  skinGeo: THREE.BufferGeometry;
  /** The flat cut face at x = 0, triangulated to match the skin's silhouette exactly. */
  cutGeo: THREE.BufferGeometry;
  /** Outline of the cut face in the (z, y) plane — handy for placing cores and pits. */
  outline: THREE.Vector2[];
}

/**
 * Builds one half of a fruit by deforming a half-sphere, then closes it with a flat
 * cut face fan-triangulated from the seam ring — so the face always matches the
 * silhouette, however the deform reshapes it.
 */
export function buildHalfSolid(
  isLeft: boolean,
  radius: number,
  deform: Deform,
  colorAt?: ColorAt,
): HalfSolid {
  const phiStart = isLeft ? Math.PI / 2 : -Math.PI / 2;
  const skinGeo = new THREE.SphereGeometry(radius, 64, 48, phiStart, Math.PI);

  const pos = skinGeo.attributes.position;
  const v = new THREE.Vector3();
  const color = new THREE.Color();
  const colors: number[] = [];
  const seam: THREE.Vector2[] = [];

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const onSeam = Math.abs(v.x) < 1e-4;
    const ny = THREE.MathUtils.clamp(v.y / radius, -1, 1);

    deform(v, ny);

    if (onSeam) {
      v.x = 0;
      seam.push(new THREE.Vector2(v.z, v.y));
    }
    pos.setXYZ(i, v.x, v.y, v.z);

    if (colorAt) {
      colorAt(v, ny, color);
      colors.push(color.r, color.g, color.b);
    }
  }

  if (colorAt) {
    skinGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  }
  skinGeo.computeVertexNormals();

  const outline = orderRing(seam);
  return { skinGeo, cutGeo: fanFace(outline), outline };
}

/** De-duplicates the seam vertices and sorts them into a single loop. */
function orderRing(points: THREE.Vector2[]): THREE.Vector2[] {
  const unique: THREE.Vector2[] = [];
  for (const p of points) {
    if (!unique.some((q) => q.distanceToSquared(p) < 1e-8)) unique.push(p);
  }

  const center = unique
    .reduce((acc, p) => acc.add(p), new THREE.Vector2())
    .divideScalar(Math.max(unique.length, 1));

  return unique.sort(
    (a, b) =>
      Math.atan2(a.y - center.y, a.x - center.x) - Math.atan2(b.y - center.y, b.x - center.x),
  );
}

/** Triangle-fans a closed outline into a flat face lying in the x = 0 plane. */
function fanFace(outline: THREE.Vector2[]): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  if (outline.length < 3) return geo;

  const center = outline
    .reduce((acc, p) => acc.add(p), new THREE.Vector2())
    .divideScalar(outline.length);

  const positions: number[] = [];
  const uvs: number[] = [];
  const extent = Math.max(
    ...outline.map((p) => Math.max(Math.abs(p.x - center.x), Math.abs(p.y - center.y))),
    0.001,
  );

  const push = (p: THREE.Vector2) => {
    positions.push(0, p.y, p.x);
    uvs.push((p.x - center.x) / (2 * extent) + 0.5, (p.y - center.y) / (2 * extent) + 0.5);
  };

  for (let i = 0; i < outline.length; i++) {
    push(center);
    push(outline[i]);
    push(outline[(i + 1) % outline.length]);
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}
