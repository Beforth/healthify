import { motion } from 'framer-motion';
import { Zap, BatteryLow, Frown, Timer, Smile, Sparkles } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  type XAxisTickContentProps,
} from 'recharts';
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
 *  other climbs and stays up. `energy` is unitless on purpose — a seven-year-old
 *  reads the shape, not a number on the axis. */
const JUNK_CURVE = [
  { minute: 0, energy: 20 },
  { minute: 8, energy: 35 },
  { minute: 15, energy: 85 },
  { minute: 20, energy: 100 },
  { minute: 25, energy: 65 },
  { minute: 30, energy: 25 },
  { minute: 40, energy: 10 },
  { minute: 50, energy: 8 },
  { minute: 60, energy: 8 },
];
const HEALTHY_CURVE = [
  { minute: 0, energy: 15 },
  { minute: 10, energy: 30 },
  { minute: 17, energy: 55 },
  { minute: 24, energy: 75 },
  { minute: 33, energy: 85 },
  { minute: 42, energy: 82 },
  { minute: 50, energy: 80 },
  { minute: 60, energy: 78 },
];

/** The two end ticks sit right at the axis's edges — anchoring "you eat it" to
 *  start and "an hour later" to end keeps both readable instead of getting
 *  clipped by the chart's own edge on a narrow screen. Recharts calls this as a
 *  plain function with the real per-tick x/y/payload — passing a JSX element
 *  instead (the other documented form) does not reliably get those props. */
function renderAxisTick({ x, y, payload }: XAxisTickContentProps) {
  const isStart = payload.value === 0;
  return (
    <text x={x} y={Number(y) + 10} textAnchor={isStart ? 'start' : 'end'} fontSize={12} fontWeight={700} fill="#7d9a8a">
      {isStart ? 'you eat it' : 'an hour later'}
    </text>
  );
}

function energyLabel(v: number) {
  if (v >= 70) return 'High energy';
  if (v >= 35) return 'Medium energy';
  return 'Low energy';
}

function ChartTooltip({ active, payload, line }: TooltipContentProps & { line: string }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value as number;
  return (
    <div
      style={{
        background: '#ffffff',
        border: `1.5px solid ${line}`,
        borderRadius: 10,
        padding: '5px 10px',
        fontSize: '0.78rem',
        fontWeight: 800,
        color: line,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        whiteSpace: 'nowrap',
      }}
    >
      {energyLabel(v)}
    </div>
  );
}

/** "a donut" / "an apple" — the heading reads as broken English without it. */
function article(name: string) {
  return /^[aeiou]/i.test(name) ? 'an' : 'a';
}

export default function BodyEffect({
  category,
  foodName,
}: {
  category: FoodCategory;
  foodName: string;
}) {
  const junk = category === 'junk';
  const data = junk ? JUNK_CURVE : HEALTHY_CURVE;
  const beats = junk ? JUNK_BEATS : HEALTHY_BEATS;
  const gradientId = junk ? 'energyFillJunk' : 'energyFillHealthy';

  const line = junk ? '#ef4444' : '#16a34a';
  const panel = junk ? '#fff5f5' : '#f3fdf7';
  const edge = junk ? '#fecaca' : '#bbf7d0';

  const DRAW = 1.4;

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

      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 12, right: 8, left: 8, bottom: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={line} stopOpacity={0.28} />
              <stop offset="100%" stopColor={line} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="minute"
            type="number"
            domain={[0, 60]}
            ticks={[0, 60]}
            axisLine={{ stroke: edge, strokeWidth: 2 }}
            tickLine={false}
            tickMargin={8}
            tick={renderAxisTick}
            interval={0}
          />
          <Tooltip content={(props) => <ChartTooltip {...props} line={line} />} cursor={{ stroke: edge, strokeWidth: 2 }} />
          <Area
            type="monotone"
            dataKey="energy"
            stroke={line}
            strokeWidth={4}
            strokeLinecap="round"
            fill={`url(#${gradientId})`}
            isAnimationActive
            animationDuration={DRAW * 1000}
            animationEasing="ease-in-out"
            dot={false}
            activeDot={{ r: 7, fill: line, stroke: '#ffffff', strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>

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
