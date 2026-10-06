import { useEffect, useRef, useState } from 'react';
import { Sprout } from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';

export default function UsernameModal({ editing = false, onClose }: { editing?: boolean; onClose?: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const player = usePlayerStore((s) => s.player);
  const confirmUsername = usePlayerStore((s) => s.confirmUsername);
  const [name, setName] = useState(player.username);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog ref={dialog} className="username-modal" aria-labelledby="username-title" aria-describedby="username-description" onCancel={(event) => { if (editing) onClose?.(); else event.preventDefault(); }}>
      <Sprout size={48} color="var(--green-dark)" aria-hidden="true" />
      <h2 id="username-title">{editing ? 'Change your explorer name' : 'Hello, explorer!'}</h2>
      <p id="username-description">{editing ? 'Pick a new name. Your points will stay with you.' : 'We picked a name just for you. Keep it or make it your own. You can change it anytime.'}</p>
      <form onSubmit={(event) => { event.preventDefault(); const result = confirmUsername(name); setError(result); if (!result) onClose?.(); }}>
        <label htmlFor="explorer-name">Your explorer name</label>
        <input id="explorer-name" value={name} onChange={(event) => { setName(event.target.value); setError(null); }} minLength={3} maxLength={32} required autoFocus autoComplete="off" spellCheck={false} aria-invalid={!!error} aria-describedby={error ? 'username-help username-error' : 'username-help'} />
        <p id="username-help">3–32 letters, numbers, underscores or hyphens. Use a nickname, not your real name.</p>
        {error && <p id="username-error" role="alert">{error}</p>}
        <button className="btn" type="submit">Save my name</button>
        {editing && <button className="btn" type="button" onClick={onClose}>Cancel</button>}
      </form>
    </dialog>
  );
}
