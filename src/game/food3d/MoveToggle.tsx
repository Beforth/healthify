import { Hand, Check } from 'lucide-react';

/** True on a touchscreen. Read once: a phone does not grow a mouse mid-session. */
export function isTouchOnly(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true;
}

/**
 * Phone-only switch between "scroll the page" and "move the food".
 *
 * A finger on a 3D scene has to mean one of two things. Left alone it scrolls the page,
 * which is what people reach for most; this button hands the scene the finger instead, so
 * the food can be turned freely in any direction until they tap Done.
 */
export default function MoveToggle({
  on,
  onChange,
  corner = 'top-right',
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  corner?: 'top-right' | 'bottom-left';
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      style={{
        position: 'absolute',
        ...(corner === 'top-right' ? { top: 10, right: 10 } : { bottom: 12, left: 10 }),
        zIndex: 5,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        borderRadius: 999,
        border: on ? '2px solid #1c6b48' : '1.5px solid rgba(31, 122, 77, 0.25)',
        background: on ? '#1c6b48' : 'rgba(255,255,255,0.95)',
        color: on ? '#ffffff' : '#1c6b48',
        fontWeight: 800,
        fontSize: '0.82rem',
        fontFamily: 'inherit',
        boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
        cursor: 'pointer',
      }}
    >
      {on ? <Check size={15} /> : <Hand size={15} />}
      {on ? 'Done' : 'Move food'}
    </button>
  );
}
