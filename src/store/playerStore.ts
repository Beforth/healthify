import { create } from 'zustand';

export interface Player {
  username: string;
  score: number;
}

const USER_KEY = 'healthify_username';
const PLAYER_PREFIX = 'healthify_player_';
const validName = (name: unknown): name is string =>
  typeof name === 'string' && /^[A-Za-z]+-[a-f0-9]{12}$/.test(name);

function readPlayers(): Player[] {
  const players: Player[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PLAYER_PREFIX)) continue;
      try {
        const player = JSON.parse(localStorage.getItem(key) ?? 'null');
        if (player && validName(player.username) && key === PLAYER_PREFIX + player.username && Number.isSafeInteger(player.score)) {
          players.push(player);
        }
      } catch { /* Ignore an invalid entry without losing other players. */ }
    }
  } catch { /* Keep playing in memory when storage is unavailable. */ }
  return players;
}

function newPlayer(players: Player[]): Player {
  const adjectives = ['Happy', 'Brave', 'Sunny', 'Clever', 'Bouncy', 'Curious'];
  const animals = ['Panda', 'Otter', 'Tiger', 'Koala', 'Dolphin', 'Bunny'];
  let username: string;
  do {
    const random = crypto.getRandomValues(new Uint32Array(2));
    username = `${adjectives[random[0] % adjectives.length]}${animals[random[1] % animals.length]}-${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
  } while (players.some((player) => player.username === username));
  return { username, score: 0 };
}

function save(player: Player): boolean {
  try {
    localStorage.setItem(PLAYER_PREFIX + player.username, JSON.stringify(player));
    localStorage.setItem(USER_KEY, player.username);
    return true;
  } catch { return false; }
}

const savedPlayers = readPlayers();
let savedName: string | null = null;
try { savedName = localStorage.getItem(USER_KEY); } catch { /* Optional storage. */ }
const initialPlayer = validName(savedName)
  ? savedPlayers.find((player) => player.username === savedName) ?? { username: savedName, score: 0 }
  : newPlayer(savedPlayers);
const storageAvailable = save(initialPlayer);

interface PlayerState {
  player: Player;
  players: Player[];
  storageAvailable: boolean;
  addPoints: (points: number) => void;
  refresh: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  player: initialPlayer,
  players: [...savedPlayers.filter((p) => p.username !== initialPlayer.username), initialPlayer],
  storageAvailable,
  addPoints: (points) => {
    if (!Number.isSafeInteger(points)) return;
    const current = get().player;
    const stored = readPlayers().find((p) => p.username === current.username);
    const player = { ...current, score: (stored?.score ?? current.score) + points };
    if (!Number.isSafeInteger(player.score)) return;
    const available = save(player);
    set({ player, storageAvailable: available, players: [...get().players.filter((p) => p.username !== player.username), player] });
  },
  refresh: () => {
    const players = readPlayers();
    const player = players.find((p) => p.username === get().player.username) ?? get().player;
    set({ player, players: [...players.filter((p) => p.username !== player.username), player] });
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => usePlayerStore.getState().refresh());
}
