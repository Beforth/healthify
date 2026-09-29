import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

test('procedural previews initialize once without drawing or keeping frame subscribers', async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  let builder;
  try {
    const { PreviewBuilder } = await server.ssrLoadModule('/src/game/food3d/previewResources.tsx');
    let draws = 0;
    const renderer = {
      domElement: { width: 200, height: 200 },
      render() { draws++; },
      setPixelRatio() {}, setSize() {},
      xr: { addEventListener() {}, removeEventListener() {}, setAnimationLoop() {}, isPresenting: false },
      shadowMap: {},
    };
    builder = new PreviewBuilder(renderer);
    for (const id of ['donut', 'mango', 'apple', 'burger', 'egg', 'carrot']) {
      const resource = await builder.build(id);
      assert.ok(resource.bytes > 0, `${id} has owned geometry`);
      assert.ok(resource.object.children.length > 0, `${id} has a model`);
      let geometry;
      resource.object.traverse((object) => { if (object.isMesh) geometry = object.geometry; });
      let disposed = 0;
      geometry.addEventListener('dispose', () => { disposed++; });
      resource.dispose();
      assert.equal(disposed, 1, `${id} releases its owned geometry`);
      // Let the null-tree commit complete. These are actual Fiber subscriptions,
      // tested without requiring a GPU; browser visual/GPU checks remain separate.
      await new Promise((resolve) => setTimeout(resolve, 25));
      assert.equal(builder.store.getState().internal.subscribers.length, 0);
    }
    assert.equal(draws, 0, 'initialization must not render offscreen gameplay models');
  } finally {
    builder?.dispose();
    await server.close();
  }
});
