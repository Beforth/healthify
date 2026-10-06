import * as THREE from 'three';

/**
 * Splits a photoscanned "food in a bowl" mesh into the bowl and the food.
 *
 * The scans arrive as one fused surface with one texture, so there is no part to
 * hide. What does separate them is height: the bowl is the smooth shell up to its
 * rim, and the food is the heap above it. Every triangle is sorted by where its
 * centre sits, as a fraction of the model's height (0 = foot, 1 = top of the heap).
 */
export interface BowlSplit {
  food: THREE.BufferGeometry;
  bowl: THREE.BufferGeometry;
}

const cache = new WeakMap<THREE.BufferGeometry, Map<number, BowlSplit>>();

export function splitBowl(source: THREE.BufferGeometry, below: number): BowlSplit {
  let byLevel = cache.get(source);
  if (!byLevel) cache.set(source, (byLevel = new Map()));
  const hit = byLevel.get(below);
  if (hit) return hit;

  const geo = source.index ? source.toNonIndexed() : source;
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox!;
  const cut = min.y + (max.y - min.y) * below;

  const names = ['position', 'normal', 'uv'] as const;
  const attrs = names.map((n) => geo.getAttribute(n) as THREE.BufferAttribute | undefined);
  const food: number[][] = names.map(() => []);
  const bowl: number[][] = names.map(() => []);
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;

  for (let i = 0; i + 2 < pos.count; i += 3) {
    const y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
    const into = y < cut ? bowl : food;
    attrs.forEach((a, k) => {
      if (!a) return;
      for (let v = 0; v < 3; v++) {
        for (let c = 0; c < a.itemSize; c++) into[k].push(a.getComponent(i + v, c));
      }
    });
  }

  const build = (lists: number[][]) => {
    const g = new THREE.BufferGeometry();
    attrs.forEach((a, k) => {
      if (a) g.setAttribute(names[k], new THREE.Float32BufferAttribute(lists[k], a.itemSize));
    });
    if (!g.getAttribute('normal')) g.computeVertexNormals();
    return g;
  };

  const out = { food: build(food), bowl: build(bowl) };
  byLevel.set(below, out);
  return out;
}
