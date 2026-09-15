import { useMemo } from 'react';
import { motion } from 'framer-motion';

const BALLOON_COLORS = [
  '#ff5a7a',
  '#4dd6ff',
  '#ffd166',
  '#8bd450',
  '#c084fc',
  '#ff8c42',
  '#2ecc71',
  '#f472b6',
];

const CONFETTI_COLORS = ['#ff5a7a', '#4dd6ff', '#ffd166', '#8bd450', '#c084fc', '#ff8c42'];

function Balloon({
  color,
  left,
  size,
  delay,
  duration,
  drift,
}: {
  color: string;
  left: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
}) {
  return (
    <motion.div
      // The element sits at bottom:0, so y:0 is the bottom edge. Start just below it
      // and finish above the top — start much lower and they only show up at the
      // very end of the flight.
      initial={{ y: '18vh', x: 0, opacity: 0 }}
      animate={{ y: '-118vh', x: [0, drift, -drift, 0], opacity: [0, 1, 1, 1] }}
      transition={{
        duration,
        delay,
        ease: 'linear',
        x: { duration: duration / 2, repeat: 1, repeatType: 'reverse', ease: 'easeInOut' },
        opacity: { duration: 0.35, delay, times: [0, 0.2, 0.8, 1] },
      }}
      style={{ position: 'absolute', left: `${left}%`, bottom: 0 }}
    >
      <svg width={size} height={size * 1.55} viewBox="0 0 40 62" fill="none">
        <ellipse cx="20" cy="22" rx="18" ry="22" fill={color} />
        <ellipse cx="13" cy="14" rx="4.5" ry="6.5" fill="#ffffff" opacity="0.38" />
        <path d="M20 43.5 l-3.2 5 h6.4 z" fill={color} />
        <path
          d="M20 48.5 q5 6 0.5 12"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
          opacity="0.55"
        />
      </svg>
    </motion.div>
  );
}

/** A balloon bursting — an expanding ring plus a scatter of little shards. */
function Pop({
  color,
  left,
  top,
  delay,
  size,
}: {
  color: string;
  left: number;
  top: number;
  delay: number;
  size: number;
}) {
  const shards = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return { dx: Math.cos(a) * size * 1.5, dy: Math.sin(a) * size * 1.5 };
      }),
    [size],
  );

  return (
    <div style={{ position: 'absolute', left: `${left}%`, top: `${top}%` }}>
      <motion.div
        initial={{ scale: 0, opacity: 0.9 }}
        animate={{ scale: 2.4, opacity: 0 }}
        transition={{ duration: 0.55, delay, ease: 'easeOut' }}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `3px solid ${color}`,
          marginLeft: -size / 2,
          marginTop: -size / 2,
        }}
      />
      {shards.map((s, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: s.dx, y: s.dy, opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.6, delay, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 7,
            height: 7,
            borderRadius: 2,
            background: color,
          }}
        />
      ))}
    </div>
  );
}

function Confetti({
  color,
  left,
  delay,
  duration,
  spin,
}: {
  color: string;
  left: number;
  delay: number;
  duration: number;
  spin: number;
}) {
  return (
    <motion.div
      initial={{ y: '-12vh', opacity: 0, rotate: 0 }}
      animate={{ y: '110vh', opacity: [0, 1, 1, 0.9], rotate: spin }}
      transition={{ duration, delay, ease: 'linear' }}
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: 0,
        width: 9,
        height: 14,
        borderRadius: 2,
        background: color,
      }}
    />
  );
}

/**
 * Full-screen "you got it right" celebration: balloons floating up, a few of them
 * bursting, and confetti raining down. Purely decorative — it never blocks taps.
 */
export default function Celebration() {
  const balloons = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        color: BALLOON_COLORS[i % BALLOON_COLORS.length],
        left: 4 + Math.random() * 90,
        size: 34 + Math.random() * 26,
        delay: Math.random() * 0.7,
        duration: 2.6 + Math.random() * 1.6,
        drift: 18 + Math.random() * 26,
      })),
    [],
  );

  const pops = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        color: BALLOON_COLORS[(i * 3) % BALLOON_COLORS.length],
        left: 12 + Math.random() * 76,
        top: 12 + Math.random() * 45,
        delay: 0.5 + Math.random() * 1.6,
        size: 26 + Math.random() * 18,
      })),
    [],
  );

  const confetti = useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => ({
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        left: Math.random() * 98,
        delay: Math.random() * 1.2,
        duration: 2.2 + Math.random() * 1.4,
        spin: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 540),
      })),
    [],
  );

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 60,
      }}
    >
      {confetti.map((c, i) => (
        <Confetti key={`c${i}`} {...c} />
      ))}
      {balloons.map((b, i) => (
        <Balloon key={`b${i}`} {...b} />
      ))}
      {pops.map((p, i) => (
        <Pop key={`p${i}`} {...p} />
      ))}
    </div>
  );
}
