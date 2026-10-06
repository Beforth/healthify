import { create } from 'zustand';

interface SharedPlayer { username: string; score: number }
export interface PlayerSnapshot { version: 1; players: Record<string, SharedPlayer> }
const CACHE_KEY = 'healthify_shared_players_v1';

export function parseSnapshot(value: unknown): PlayerSnapshot {
  if (!value || typeof value !== 'object') throw new Error('Invalid snapshot');
  const snapshot = value as Record<string, unknown>;
  if (snapshot.version !== 1 || !snapshot.players || typeof snapshot.players !== 'object' || Array.isArray(snapshot.players)) throw new Error('Invalid snapshot');
  const entries = Object.entries(snapshot.players);
  if (entries.length > 10000) throw new Error('Snapshot is too large');
  const players: Record<string, SharedPlayer> = Object.create(null);
  const names = new Set<string>();
  for (const [key, value] of entries) {
    if (!value || typeof value !== 'object') throw new Error('Invalid player');
    const player = value as Record<string, unknown>;
    if (typeof player.username !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{2,31}$/.test(player.username) || key !== player.username || !Number.isSafeInteger(player.score)) throw new Error('Invalid player');
    const normalized = key.toLowerCase();
    if (names.has(normalized)) throw new Error('Duplicate username');
    names.add(normalized);
    players[key] = { username: player.username, score: player.score as number };
  }
  return { version: 1, players };
}

function cached(): PlayerSnapshot {
  try { return parseSnapshot(JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null')); }
  catch { return { version: 1, players: {} }; }
}

interface SharedState {
  snapshot: PlayerSnapshot;
  status: 'cached' | 'live' | 'offline';
  sync: (url: string, signal?: AbortSignal) => Promise<void>;
}

let pending = false;
export const useSharedPlayersStore = create<SharedState>((set) => ({
  snapshot: cached(),
  status: 'cached',
  sync: async (url, signal) => {
    if (pending) return;
    pending = true;
    try {
      const response = await fetch(url + '?t=' + Date.now(), { cache: 'no-store', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Snapshot unavailable');
      const snapshot = parseSnapshot(await response.json());
      if (signal?.aborted) return;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot)); } catch { /* Memory fallback. */ }
      set({ snapshot, status: 'live' });
    } catch {
      if (!signal?.aborted) set({ status: 'offline' });
    } finally { pending = false; }
  },
}));

export function mergePlayers(shared: SharedPlayer[], local: SharedPlayer[]): SharedPlayer[] {
  const localNames = new Set(local.map((player) => player.username.toLowerCase()));
  return [...shared.filter((player) => !localNames.has(player.username.toLowerCase())), ...local];
}
