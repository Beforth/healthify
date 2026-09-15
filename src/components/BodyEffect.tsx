import { motion } from 'framer-motion';
import { Zap, BatteryLow, Frown, Timer, Smile, Sparkles } from 'lucide-react';
import type { FoodCategory } from '../data/nutritionData';

/**
 * "So what?" — the part of the brief the game was missing.
 *
 * A child can learn that a donut holds 9 g of sugar and still not care. This
 * panel answers the question that actually changes behaviour: what does this
 * food DO once it is inside you? It draws an energy curve over the hour after
 * eating — junk spikes and crashes, healthy climbs and holds — because a shape
 * is something a seven-year-old can read without a single number.
 */

interface Beat {
  icon: typeof Zap;
  title: string;
  text: string;
}

const JUNK_BEATS: Beat[] = [
  { icon: Zap, title: 'A big rush', text: 'Sugar floods in and your energy shoots straight up.' },
  { icon: BatteryLow, title: 'Then the crash', text: 'Half an hour later it drops — you feel tired and grumpy.' },
  { icon: Frown, title: 'Hungry again', text: 'There is no fibre to fill you up, so you want more food soon.' },
];

const HEALTHY_BEATS: Beat[] = [
  { icon: Timer, title: 'Slow and steady', text: 'Fibre lets the sugar in bit by bit, so there is no crash.' },
  { icon: Sparkles, title: 'Builds you up', text: 'Vitamins and minerals go to work helping you grow.' },
  { icon: Smile, title: 'Full for longer', text: 'Your tummy stays happy, so you can keep playing.' },
];

/** The curve is the whole message: one shape spikes and falls off a cliff, the
 *  other climbs and stays up. Points are shared with the travelling dot below. */
const JUNK_POINTS = [
  [12, 118], [62, 108], [100, 48], [142, 24], [178, 62], [216, 116], [272, 142], [352, 140], [428, 139],
];
const HEALTHY_POINTS = [
  [12, 122], [72, 114], [122, 84], [172, 64], [242, 56], [302, 58], [362, 62], [428, 66],
];

function toPath(points: number[][]) {
  // Catmull-Rom through the points, converted to cubic Beziers. Chaining
  // quadratics instead gives a stepped, blocky spike — wrong feel for a curve
  // whose entire job is to look like a rush and a crash.
  const d = [`M ${points[0][0]} ${points[0][1]}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`);
  }
  return d.join(' ');
}

/** "a donut" / "an apple" — the heading reads as broken English without it. */
function article(name: string) {
  return /^[aeiou]/i.test(name) ? 'an' : 'a';
}

const DRAW = 2.4;

export default function BodyEffect({
  category,
  foodName,
}: {
  category: FoodCategory;
  foodName: string;
}) {
  const junk = category === 'junk';
  const points = junk ? JUNK_POINTS : HEALTHY_POINTS;
  const beats = junk ? JUNK_BEATS : HEALTHY_BEATS;

  const line = junk ? '#ef4444' : '#16a34a';
  const fill = junk ? 'rgba(239, 68, 68, 0.16)' : 'rgba(22, 163, 74, 0.16)';
  const panel = junk ? '#fff5f5' : '#f3fdf7';
  const edge = junk ? '#fecaca' : '#bbf7d0';

  const d = toPath(points);
  const area = `${d} L ${points[points.length - 1][0]} 150 L ${points[0][0]} 150 Z`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.45 }}
      style={{
        width: '100%',
        maxWidth: 480,
        margin: '22px auto 0',
        background: panel,
        border: `2px solid ${edge}`,
        borderRadius: 22,
        padding: '16px 16px 18px',
        textAlign: 'left',
        boxShadow: '0 10px 28px rgba(15, 63, 41, 0.08)',
      }}
    >
      <div
        style={{
          fontWeight: 900,
          fontSize: '1.05rem',
          color: junk ? '#b91c1c' : '#15803d',
          textAlign: 'center',
          marginBottom: 2,
        }}
      >
        What {article(foodName)} {foodName} does inside you
      </div>
      <div
        style={{
          fontSize: '0.8rem',
          color: 'var(--ink-soft)',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        Your energy for the hour after eating it
      </div>

      <svg viewBox="0 0 440 168" style={{ width: '100%', display: 'block' }}>
        {/* faint floor lines so the rise and fall have something to be measured against */}
        {[40, 80, 120].map((y) => (
          <line key={y} x1="10" y1={y} x2="430" y2={y} stroke={edge} strokeWidth="1.5" strokeDasharray="4 6" />
        ))}
        <line x1="10" y1="150" x2="430" y2="150" stroke={edge} strokeWidth="2.5" />

        <motion.path
          d={area}
          fill={fill}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: DRAW * 0.75, duration: 0.6 }}
        />
        <motion.path
          d={d}
          fill="none"
          stroke={line}
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.65, duration: DRAW, ease: 'easeInOut' }}
        />

        {/* the dot rides the curve, so the child watches the change happen */}
        <motion.circle
          r="8"
          fill={line}
          stroke="#ffffff"
          strokeWidth="3"
          initial={{ cx: points[0][0], cy: points[0][1], opacity: 0 }}
          animate={{
            cx: points.map((p) => p[0]),
            cy: points.map((p) => p[1]),
            opacity: 1,
          }}
          transition={{
            delay: 0.65,
            duration: DRAW,
            ease: 'easeInOut',
            opacity: { duration: 0.2, delay: 0.65 },
          }}
        />

        <text x="12" y="166" fontSize="13" fontWeight="700" fill="#7d9a8a">
          you eat it
        </text>
        <text x="430" y="166" fontSize="13" fontWeight="700" fill="#7d9a8a" textAnchor="end">
          an hour later
        </text>
      </svg>

      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        {beats.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: DRAW * 0.5 + i * 0.35, duration: 0.35 }}
            style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                flexShrink: 0,
                background: junk ? '#fee2e2' : '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <b.icon size={18} color={line} strokeWidth={2.6} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: junk ? '#991b1b' : '#166534' }}>
                {b.title}
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                {b.text}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
