import { create } from 'zustand';

export interface Player {
  username: string;
  score: number;
}

const USER_KEY = 'healthify_username';
const CONFIRMED_KEY = 'healthify_username_confirmed';
const PLAYER_PREFIX = 'healthify_player_';
const validName = (name: unknown): name is string =>
  typeof name === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{2,31}$/.test(name);

function confirmed(): boolean {
  try { return localStorage.getItem(CONFIRMED_KEY) === '1'; } catch { return false; }
}

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
  usernameConfirmed: boolean;
  confirmUsername: (name: string) => string | null;
  addPoints: (points: number) => void;
  refresh: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  player: initialPlayer,
  players: [...savedPlayers.filter((p) => p.username !== initialPlayer.username), initialPlayer],
  storageAvailable,
  usernameConfirmed: confirmed(),
  confirmUsername: (name) => {
    if (get().usernameConfirmed || confirmed()) {
      get().refresh();
      return 'Your explorer name has already been saved.';
    }
    const username = name.trim();
    if (!validName(username)) return 'Use 3–32 letters, numbers, underscores or hyphens. Start with a letter or number.';
    const previous = get().player;
    const players = readPlayers();
    if (players.some((p) => p.username !== previous.username && p.username.toLowerCase() === username.toLowerCase())) {
      return 'That name is already taken in this browser. Try another one.';
    }
    const player = { username, score: players.find((p) => p.username === previous.username)?.score ?? previous.score };
    try {
      // Keep the original profile intact unless the new identity and lock save successfully.
      localStorage.setItem(PLAYER_PREFIX + username, JSON.stringify(player));
      localStorage.setItem(USER_KEY, username);
      localStorage.setItem(CONFIRMED_KEY, '1');
    } catch {
      try {
        localStorage.setItem(USER_KEY, previous.username);
        if (username !== previous.username) localStorage.removeItem(PLAYER_PREFIX + username);
      } catch { /* Storage may remain unavailable. */ }
      set({ storageAvailable: false });
      return 'Your name could not be saved. Please enable browser storage and try again.';
    }
    try {
      if (username !== previous.username) localStorage.removeItem(PLAYER_PREFIX + previous.username);
    } catch { /* The confirmed identity is already safely stored. */ }
    set({ player, usernameConfirmed: true, storageAvailable: true, players: [...players.filter((p) => p.username !== previous.username), player] });
    return null;
  },
  addPoints: (points) => {
    if (!Number.isSafeInteger(points)) return;
    get().refresh();
    const current = get().player;
    const stored = readPlayers().find((p) => p.username === current.username);
    const player = { ...current, score: (stored?.score ?? current.score) + points };
    if (!Number.isSafeInteger(player.score)) return;
    const available = save(player);
    set({ player, storageAvailable: available, players: [...get().players.filter((p) => p.username !== player.username), player] });
  },
  refresh: () => {
    const players = readPlayers();
    let username = get().player.username;
    try { username = localStorage.getItem(USER_KEY) ?? username; } catch { /* Optional storage. */ }
    const player = players.find((p) => p.username === username) ?? get().player;
    set({ player, usernameConfirmed: get().usernameConfirmed || confirmed(), players: [...players.filter((p) => p.username !== player.username), player] });
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => usePlayerStore.getState().refresh());
}
