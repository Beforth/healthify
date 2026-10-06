import * as THREE from 'three';

const cache = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();

/**
 * Drops every loose piece of a scan except the biggest.
 *
 * Some scans were captured mid-cut: the bread loaf comes with a slice already
 * lying beside it, the cucumber with a few rounds. Shown as the "whole" food that
 * reads as a food that has already been cut, so only the main body is kept and
 * the cut itself is left to the knife.
 */
export function largestPart(source: THREE.BufferGeometry): THREE.BufferGeometry {
  const hit = cache.get(source);
  if (hit) return hit;

  const geo = source.index ? source.toNonIndexed() : source;
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const triCount = Math.floor(pos.count / 3);

  // weld coincident vertices so triangles that only touch at a seam still join up
  const welded = new Map<string, number>();
  const id = new Int32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const k = `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`;
    let v = welded.get(k);
    if (v === undefined) welded.set(k, (v = welded.size));
    id[i] = v;
  }
  const parent = Array.from({ length: welded.size }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  for (let t = 0; t < triCount; t++) {
    const a = find(id[t * 3]);
    parent[find(id[t * 3 + 1])] = a;
    parent[find(id[t * 3 + 2])] = a;
  }
  const size = new Map<number, number>();
  for (let t = 0; t < triCount; t++) {
    const r = find(id[t * 3]);
    size.set(r, (size.get(r) ?? 0) + 1);
  }
  let best = -1;
  let bestSize = 0;
  size.forEach((n, r) => {
    if (n > bestSize) {
      best = r;
      bestSize = n;
    }
  });

  const names = ['position', 'normal', 'uv'] as const;
  const attrs = names.map((n) => geo.getAttribute(n) as THREE.BufferAttribute | undefined);
  const lists: number[][] = names.map(() => []);
  for (let t = 0; t < triCount; t++) {
    if (find(id[t * 3]) !== best) continue;
    attrs.forEach((a, k) => {
      if (!a) return;
      for (let v = 0; v < 3; v++) for (let c = 0; c < a.itemSize; c++) lists[k].push(a.getComponent(t * 3 + v, c));
    });
  }
  const out = new THREE.BufferGeometry();
  attrs.forEach((a, k) => {
    if (a) out.setAttribute(names[k], new THREE.Float32BufferAttribute(lists[k], a.itemSize));
  });
  if (!out.getAttribute('normal')) out.computeVertexNormals();
  // with its neighbour gone the body is no longer centred on the origin, and the knife
  // cuts through the origin: bring the body back to the middle (floor height stays put)
  out.computeBoundingBox();
  const c = out.boundingBox!.getCenter(new THREE.Vector3());
  out.translate(-c.x, 0, -c.z);
  cache.set(source, out);
  return out;
}
