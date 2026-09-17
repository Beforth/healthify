import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface BackButtonProps {
  /** Where to go if there's no in-app history to pop (e.g. arrived via a direct link). */
  fallback: string;
  dark?: boolean;
  showLabel?: boolean;
  /** Always go to `fallback`, skipping the "pop browser history" behavior — for
   *  screens where in-app history doesn't map to a sensible "back" (e.g. a chain
   *  of auto-picked foods), so Back always lands somewhere predictable instead. */
  force?: boolean;
}

export default function BackButton({ fallback, dark, showLabel = true, force = false }: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const canGoBack = !force && location.key !== 'default';

  const goBack = () => {
    if (canGoBack) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <motion.button
      onClick={goBack}
      whileTap={{ scale: 0.94 }}
      whileHover={{ scale: 1.04 }}
      aria-label="Go back"
      style={{
        borderRadius: 999,
        border: '1px solid rgba(0,0,0,0.06)',
        padding: showLabel ? '9px 18px' : '9px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        cursor: 'pointer',
        background: dark ? 'rgba(255,255,255,0.25)' : '#ffffff',
        color: dark ? 'white' : 'var(--ink)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
        fontSize: '0.92rem',
        fontWeight: 700,
        zIndex: 10,
      }}
    >
      <ArrowLeft size={18} strokeWidth={2.5} />
      {showLabel && <span>Back</span>}
    </motion.button>
  );
}
