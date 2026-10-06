import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSnapshot, mergePlayers, useSharedPlayersStore } from '../src/store/sharedPlayersStore.ts';

const snapshot = (score = 50) => ({ version: 1, players: { HappyPanda: { username: 'HappyPanda', score } } });

test('rejects malformed snapshots, unsafe scores and duplicate names', () => {
  for (const value of [null, { version: 2, players: {} }, { version: 1, players: [] }, { version: 1, players: { WrongKey: { username: 'HappyPanda', score: 3 } } }, snapshot(Infinity), { version: 1, players: { ...snapshot().players, happypanda: { username: 'happypanda', score: 3 } } }]) {
    assert.throws(() => parseSnapshot(value));
  }
  assert.equal(parseSnapshot(snapshot()).players.HappyPanda.score, 50);
});

test('local records override matching shared names without mutating the snapshot', () => {
  const shared = Object.values(snapshot().players);
  assert.deepEqual(mergePlayers(shared, [{ username: 'happypanda', score: 10 }]), [{ username: 'happypanda', score: 10 }]);
  assert.equal(shared[0].score, 50);
});

test('refreshes and removes shared records, caches success and retains data on failed fetches', async () => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.localStorage;
  const cache = new Map();
  globalThis.localStorage = { setItem: (key, value) => cache.set(key, value) };
  try {
    globalThis.fetch = async (url, options) => {
      assert.match(url, /players.json\?t=/);
      assert.equal(options.cache, 'no-store');
      return { ok: true, json: async () => snapshot() };
    };
    await useSharedPlayersStore.getState().sync('/data/players.json');
    assert.equal(useSharedPlayersStore.getState().snapshot.players.HappyPanda.score, 50);
    assert.equal(cache.size, 1);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ version: 99 }) });
    await useSharedPlayersStore.getState().sync('/data/players.json');
    assert.equal(useSharedPlayersStore.getState().status, 'offline');
    assert.equal(useSharedPlayersStore.getState().snapshot.players.HappyPanda.score, 50);
    globalThis.fetch = async () => ({ ok: false });
    await useSharedPlayersStore.getState().sync('/data/players.json');
    assert.equal(useSharedPlayersStore.getState().snapshot.players.HappyPanda.score, 50);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ version: 1, players: {} }) });
    await useSharedPlayersStore.getState().sync('/data/players.json');
    assert.equal(Object.keys(useSharedPlayersStore.getState().snapshot.players).length, 0);
    assert.equal(useSharedPlayersStore.getState().status, 'live');
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.localStorage = originalStorage;
  }
});
