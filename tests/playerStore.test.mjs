import assert from 'node:assert/strict';
import test from 'node:test';

const data = new Map();
globalThis.localStorage = {
  get length() { return data.size; },
  key: (index) => [...data.keys()][index] ?? null,
  getItem: (key) => data.get(key) ?? null,
  setItem: (key, value) => data.set(key, String(value)),
};
let version = 0;
const load = async () => (await import(`../src/store/playerStore.ts?test=${version++}`)).usePlayerStore;

test('creates an identity, retains it on reload, and persists quiz points', async () => {
  data.clear();
  const store = await load();
  const name = store.getState().player.username;
  assert.match(name, /^[A-Za-z]+-[a-f0-9]{12}$/);
  assert.equal(data.get('healthify_username'), name);
  store.getState().addPoints(-5);
  store.getState().addPoints(10);
  const reloaded = await load();
  assert.deepEqual(reloaded.getState().player, { username: name, score: 5 });
});

test('repeated visits reuse one explorer without offering profile creation', async () => {
  data.clear();
  const store = await load();
  const username = store.getState().player.username;
  store.getState().addPoints(20);
  for (let i = 0; i < 10; i++) {
    const reloaded = await load();
    assert.deepEqual(reloaded.getState().player, { username, score: 20 });
    assert.equal(reloaded.getState().players.length, 1);
    assert.equal('choosePlayer' in reloaded.getState(), false);
  }
});

test('invalid stored data is ignored and invalid points cannot corrupt a score', async () => {
  data.clear();
  data.set('healthify_username', '<invalid>');
  data.set('healthify_player_broken', '{');
  data.set('healthify_player_HappyPanda-0123456789ab', JSON.stringify({ username: 'HappyPanda-0123456789ab', score: '100' }));
  const store = await load();
  assert.equal(store.getState().players.length, 1);
  store.getState().addPoints(NaN);
  store.getState().addPoints(Infinity);
  assert.equal(store.getState().player.score, 0);
});

test('unavailable storage allows temporary play', async () => {
  const storage = globalThis.localStorage;
  globalThis.localStorage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, get length() { throw Error('blocked'); } };
  try {
    const store = await load();
    assert.equal(store.getState().storageAvailable, false);
    store.getState().addPoints(10);
    assert.equal(store.getState().player.score, 10);
    store.getState().refresh();
    assert.equal(store.getState().player.score, 10);
  } finally { globalThis.localStorage = storage; }
});

test('another tab score update is included in the next answer', async () => {
  data.clear();
  const first = await load();
  const second = await load();
  first.getState().addPoints(10);
  second.getState().addPoints(-5);
  first.getState().refresh();
  assert.equal(first.getState().player.score, 5);
});
