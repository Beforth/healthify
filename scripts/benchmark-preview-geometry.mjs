// CPU microbenchmark only: excludes downloads, image decoding, GPU uploads and UI.
// Uses the actual GLB geometry, with image loading stubbed out for Node.
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { Texture } from 'three';
import { GLTFLoader } from 'three-stdlib';
import { sliceAtX } from '../src/game/food3d/sliceMesh.ts';

const loader = new GLTFLoader();
loader.register(() => ({ name: 'BENCHMARK_NO_IMAGES', loadTexture: async () => new Texture() }));
const results = [];
for (const file of ['chocolate.glb', 'pineapple.glb', 'sweet-potato.glb', 'broccoli.glb', 'cream_biscuit.glb']) {
  const data = await readFile(new URL(`../public/models/${file}`, import.meta.url));
  const gltf = await loader.parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), '');
  let geometry;
  gltf.scene.traverse((node) => { if (!geometry && node.isMesh) geometry = node.geometry; });
  const before = [];
  const after = [];
  for (let run = 0; run < 12; run++) {
    let start = performance.now();
    const left = sliceAtX(geometry, true);
    const right = sliceAtX(geometry, false);
    const oldMs = performance.now() - start;
    left.geometry.dispose();
    right.geometry.dispose();
    start = performance.now();
    const copy = geometry.clone();
    const newMs = performance.now() - start;
    copy.dispose();
    if (run >= 2) { before.push(oldMs); after.push(newMs); }
  }
  const median = (values) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
  results.push({ file, vertices: geometry.attributes.position.count,
    beforeTwoSlicesMs: +median(before).toFixed(3), afterWholeCloneMs: +median(after).toFixed(3) });
  gltf.scene.traverse((node) => {
    if (!node.isMesh) return;
    node.geometry.dispose();
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) material.dispose();
  });
}
console.log(JSON.stringify({ note: 'Median of 10 measured runs after 2 warmups; CPU geometry only.', results }, null, 2));
