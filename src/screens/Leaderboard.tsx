import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import { mergePlayers, useSharedPlayersStore } from '../store/sharedPlayersStore';

export default function Leaderboard() {
  const { player, players, refresh, storageAvailable } = usePlayerStore();
  useEffect(() => { refresh(); }, [refresh]);
  const { snapshot, status } = useSharedPlayersStore();
  const ranked = mergePlayers(Object.values(snapshot.players), players).sort((a, b) => b.score - a.score || a.username.localeCompare(b.username));
  return (
    <main className="screen">
      <section className="card leaderboard-card">
        <Trophy size={52} color="var(--green-dark)" aria-hidden="true" />
        <h1>Explorer leaderboard</h1>
        <p>Every question is a chance to learn!</p>
        <p>Correct answer: +10 points. First wrong attempt: −5 points. Further wrong retries: no deduction.</p>
        <p className="leaderboard-note">Shared rankings update automatically. Your gameplay and name changes are saved on this browser.</p>
        {status === 'offline' && <p role="status">Shared rankings are unavailable. Showing the last saved snapshot.</p>}
        {!storageAvailable && <p role="status">Storage is unavailable. These scores are temporary.</p>}
        <table className="leaderboard-table">
          <caption>Explorer rankings — equal scores share a rank</caption>
          <thead><tr><th scope="col">Rank</th><th scope="col">Explorer</th><th scope="col">Points</th></tr></thead>
          <tbody>{ranked.map((p) => (
            <tr key={p.username} className={p.username === player.username ? 'current-player' : ''}>
              <td>{ranked.findIndex((entry) => entry.score === p.score) + 1}</td>
              <th scope="row">{p.username}{p.username === player.username && <span className="you-badge">You</span>}</th>
              <td>{p.score}</td>
            </tr>
          ))}</tbody>
        </table>
        {ranked.every((p) => p.score === 0) && <p>Ready to earn your first points? Pick a food and try a question!</p>}
        <button type="button" className="btn" onClick={() => {
          refresh();
          const entries = mergePlayers(Object.values(snapshot.players), usePlayerStore.getState().players);
          const blob = new Blob([JSON.stringify({ version: 1, players: Object.fromEntries(entries.map((entry) => [entry.username, entry])) }, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'players.json';
          link.click();
          window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}>Download rankings JSON</button>
        <div className="player-actions"><Link className="btn" to="/foods">Keep exploring</Link><Link to="/">Home</Link></div>
      </section>
    </main>
  );
}
