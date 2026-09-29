import assert from 'node:assert/strict';
import test from 'node:test';
import { PreviewCache } from '../src/game/food3d/previewCache.ts';

function resource(bytes = 10) {
  return { bytes, disposals: 0, dispose() { this.disposals++; } };
}

test('pages 1–4 and repeated backwards visits reuse the same resources', () => {
  const cache = new PreviewCache(32, 320);
  const originals = Array.from({ length: 32 }, () => resource());
  for (let page = 0; page < 4; page++) {
    const ids = Array.from({ length: 8 }, (_, i) => String(page * 8 + i));
    for (const id of ids) assert.equal(cache.add(id, originals[Number(id)], new Set(ids)), true);
  }
  for (let cycle = 0; cycle < 20; cycle++) {
    for (let i = 31; i >= 0; i--) assert.equal(cache.get(String(i)), originals[i]);
  }
  assert.equal(cache.bytes, 320);
  assert.equal(cache.size, 32);
  assert.ok(originals.every((entry) => entry.disposals === 0));
});

test('search admissions evict least recently used inactive resources exactly once', () => {
  const cache = new PreviewCache(3, 30);
  const [a, b, c, d] = Array.from({ length: 4 }, () => resource());
  cache.add('a', a, new Set());
  cache.add('b', b, new Set());
  cache.add('c', c, new Set());
  cache.get('a');
  assert.equal(cache.add('d', d, new Set(['b', 'd'])), true);
  assert.equal(cache.has('c'), false);
  assert.equal(c.disposals, 1);
  assert.equal(b.disposals, 0);
  cache.clear();
  assert.deepEqual([a, b, c, d].map((entry) => entry.disposals), [1, 1, 1, 1]);
  assert.equal(cache.bytes, 0);
});

test('byte budget, oversized resources, and pinned pages cannot grow memory', () => {
  const cache = new PreviewCache(32, 20);
  const a = resource(15);
  const b = resource(10);
  cache.add('a', a, new Set());
  assert.equal(cache.add('b', b, new Set(['a'])), false);
  assert.equal(b.disposals, 1);
  assert.equal(a.disposals, 0);
  const huge = resource(21);
  assert.equal(cache.add('huge', huge, new Set()), false);
  assert.equal(huge.disposals, 1);
  assert.equal(cache.get('a'), a);
  for (let i = 0; i < 1000; i++) {
    cache.add(String(i), resource(10), new Set());
    assert.ok(cache.bytes <= 20);
    assert.ok(cache.size <= 2);
  }
});

test('leaving and returning to gameplay does not require clearing the cache', () => {
  const cache = new PreviewCache(32, 320);
  const apple = resource();
  cache.add('apple', apple, new Set(['apple']));
  assert.equal(cache.get('apple'), apple);
  assert.equal(apple.disposals, 0);
  cache.clear();
  cache.clear();
  assert.equal(apple.disposals, 1);
});
