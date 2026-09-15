import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { CellKind, MicroSpec } from './microStructures';

const SIZE = 400;
const CX = SIZE / 2;
const CY = SIZE / 2;
const LENS = 176;

/** Deterministic RNG so the tissue is identical on every render and reload —
 *  cells that reshuffle on each frame look like static, not like a sample. */
function rng(seed: number) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A polygon with its corners eased off, which is what turns a hard hexagon
 *  into something that reads as a living cell. */
function roundedPolygon(pts: [number, number][], radius: number) {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const cur = pts[i];
    const next = pts[(i + 1) % n];

    const toPrev = unit(cur, prev);
    const toNext = unit(cur, next);
    const a: [number, number] = [cur[0] + toPrev[0] * radius, cur[1] + toPrev[1] * radius];
    const b: [number, number] = [cur[0] + toNext[0] * radius, cur[1] + toNext[1] * radius];

    d += i === 0 ? `M ${a[0].toFixed(1)} ${a[1].toFixed(1)}` : ` L ${a[0].toFixed(1)} ${a[1].toFixed(1)}`;
    d += ` Q ${cur[0].toFixed(1)} ${cur[1].toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  }
  return `${d} Z`;
}

function unit(from: [number, number], to: [number, number]): [number, number] {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  return [dx / len, dy / len];
}

interface Cell {
  x: number;
  y: number;
  d: string;
  kind: CellKind;
  fill: string;
  face: boolean;
  grains: { dx: number; dy: number; r: number; rot: number }[];
}

function buildTissue(spec: MicroSpec): Cell[] {
  const rand = rng(1337);
  const R = spec.cellRadius;
  const cells: Cell[] = [];
  const faceSlots: number[] = [];

  const cols = Math.ceil(LENS / (R * 1.5)) + 2;
  const rows = Math.ceil(LENS / (R * Math.sqrt(3))) + 2;

  for (let col = -cols; col <= cols; col++) {
    for (let row = -rows; row <= rows; row++) {
      const x = CX + col * R * 1.5;
      const y = CY + row * R * Math.sqrt(3) + (Math.abs(col) % 2) * ((R * Math.sqrt(3)) / 2);
      // keep cells whose centre is near the lens; the clip path trims the rest
      if (Math.hypot(x - CX, y - CY) > LENS + R * 0.9) continue;

      const pts: [number, number][] = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        pts.push([
          x + R * Math.cos(a) + (rand() - 0.5) * spec.jitter * 2,
          y + R * Math.sin(a) + (rand() - 0.5) * spec.jitter * 2,
        ]);
      }

      // a single vascular strand running across the field, not scattered vessels
      const acrossBand = Math.abs((x - CX) * 0.58 + (y - CY) * 0.81) < R * 0.55;
      let kind: CellKind = 'matrix';
      if (spec.hasVessel && acrossBand) kind = 'vessel';
      else if (rand() < spec.pocketChance) kind = 'pocket';

      const grains: Cell['grains'] = [];
      if (kind === 'matrix' && rand() < spec.inclusionChance) {
        const count = 1 + Math.floor(rand() * 3);
        for (let g = 0; g < count; g++) {
          grains.push({
            dx: (rand() - 0.5) * R * 0.9,
            dy: (rand() - 0.5) * R * 0.9,
            r: R * (0.09 + rand() * 0.07),
            rot: rand() * 180,
          });
        }
      }

      const fill =
        kind === 'pocket'
          ? spec.pocket
          : kind === 'vessel'
            ? spec.vessel
            : spec.matrix[rand() < 0.5 ? 0 : 1];

      cells.push({
        x,
        y,
        d: roundedPolygon(pts, R * spec.corner),
        kind,
        fill,
        face: false,
        grains,
      });
      if (kind === 'matrix' && Math.hypot(x - CX, y - CY) < LENS * 0.72) {
        faceSlots.push(cells.length - 1);
      }
    }
  }

  // spread the faces out rather than letting them clump in one corner
  const step = Math.max(1, Math.floor(faceSlots.length / spec.faces));
  for (let i = 0; i < spec.faces; i++) {
    const cell = cells[faceSlots[(i * step + 1) % faceSlots.length]];
    if (cell) cell.face = true;
  }

  return cells;
}

function Face({ x, y, r, ink, delay }: { x: number; y: number; r: number; ink: string; delay: number }) {
  const eye = r * 0.145;
  return (
    <g>
      {[-r * 0.36, r * 0.36].map((dx) => (
        <motion.ellipse
          key={dx}
          cx={x + dx}
          cy={y - r * 0.16}
          rx={eye * 0.8}
          ry={eye}
          fill={ink}
          // the blink is what makes a polygon read as a creature
          animate={{ ry: [eye, eye, eye * 0.13, eye] }}
          transition={{ duration: 4.2, repeat: Infinity, delay, times: [0, 0.82, 0.87, 0.92] }}
        />
      ))}
      <path
        d={`M ${x - r * 0.28} ${y + r * 0.24} Q ${x} ${y + r * 0.52} ${x + r * 0.28} ${y + r * 0.24}`}
        stroke={ink}
        strokeWidth={Math.max(1.4, r * 0.085)}
        strokeLinecap="round"
        fill="none"
      />
      <circle cx={x - r * 0.58} cy={y + r * 0.13} r={r * 0.14} fill="#f6a5a5" opacity={0.6} />
      <circle cx={x + r * 0.58} cy={y + r * 0.13} r={r * 0.14} fill="#f6a5a5" opacity={0.6} />
    </g>
  );
}

function Bubble({
  text,
  at,
  colour,
  selected,
  dimmed,
  onClick,
}: {
  text: string;
  at: [number, number];
  colour: string;
  selected: boolean;
  dimmed: boolean;
  onClick: () => void;
}) {
  // sized from the text so long labels are not clipped, then clamped
  // to something that still fits inside a 400-wide field
  const w = Math.min(232, 26 + text.length * 6.2);
  return (
    <motion.g
      style={{ cursor: 'pointer' }}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: dimmed ? 0.45 : 1, scale: selected ? 1.06 : 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
    >
      <rect
        x={at[0] - w / 2}
        y={at[1] - 17}
        width={w}
        height={34}
        rx={17}
        fill="#ffffff"
        stroke={selected ? colour : '#d6e6d3'}
        strokeWidth={selected ? 3 : 2}
      />
      <text
        x={at[0]}
        y={at[1] + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11.5}
        fontWeight={800}
        fill="#22402f"
      >
        {text}
      </text>
    </motion.g>
  );
}

export default function CellView({ spec }: { spec: MicroSpec }) {
  const cells = useMemo(() => buildTissue(spec), [spec]);
  const [picked, setPicked] = useState<CellKind | null>(null);

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: '100%', display: 'block' }}>
      <defs>
        <clipPath id="lens-clip">
          <circle cx={CX} cy={CY} r={LENS} />
        </clipPath>
        <radialGradient id="lens-vignette">
          <stop offset="62%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </radialGradient>
      </defs>

      <circle cx={CX} cy={CY} r={LENS + 11} fill={spec.bezel} />
      <circle cx={CX} cy={CY} r={LENS + 4} fill="none" stroke="#ffffff" strokeWidth={3} opacity={0.35} />

      <g clipPath="url(#lens-clip)">
        <rect x={0} y={0} width={SIZE} height={SIZE} fill={spec.field} />

        {cells.map((c, i) => {
          const dim = picked !== null && c.kind !== picked;
          const lit = picked !== null && c.kind === picked;
          return (
            <motion.g
              key={i}
              animate={{ opacity: dim ? 0.3 : 1 }}
              transition={{ duration: 0.28 }}
            >
              <motion.path
                d={c.d}
                fill={c.fill}
                stroke={lit ? '#ffffff' : spec.wall}
                strokeWidth={lit ? 4 : 2.4}
                strokeLinejoin="round"
                // only the faced cells breathe; animating every cell every frame
                // is a lot of work for something nobody would notice
                animate={c.face ? { scale: [1, 1.035, 1] } : undefined}
                transition={c.face ? { duration: 3.4, repeat: Infinity, delay: i * 0.13 } : undefined}
                style={{ transformOrigin: `${c.x}px ${c.y}px` }}
              />
              {c.grains.map((g, gi) => (
                <motion.ellipse
                  key={gi}
                  cx={c.x + g.dx}
                  cy={c.y + g.dy}
                  rx={g.r * 1.25}
                  ry={g.r}
                  fill={spec.inclusion}
                  opacity={0.9}
                  transform={`rotate(${g.rot} ${c.x + g.dx} ${c.y + g.dy})`}
                  animate={{ opacity: [0.75, 1, 0.75] }}
                  transition={{ duration: 2.8, repeat: Infinity, delay: (i + gi) * 0.21 }}
                />
              ))}
              {c.face && <Face x={c.x} y={c.y} r={spec.cellRadius} ink={spec.faceInk} delay={i * 0.4} />}
            </motion.g>
          );
        })}

        <circle cx={CX} cy={CY} r={LENS} fill="url(#lens-vignette)" />
      </g>

      {/* scale bar — the detail that makes it read as a microscope rather than a doodle */}
      <g opacity={0.9}>
        <rect x={CX - 150} y={CY + LENS - 30} width={56} height={5} rx={2.5} fill="#ffffff" />
        <text
          x={CX - 88}
          y={CY + LENS - 23}
          fontSize={13}
          fontWeight={800}
          fill="#ffffff"
        >
          20µm
        </text>
      </g>

      {spec.labels.map((l) => (
        <Bubble
          key={l.id}
          text={l.text}
          at={l.at}
          colour={spec.bezel}
          selected={picked === l.kind}
          dimmed={picked !== null && picked !== l.kind}
          onClick={() => setPicked((p) => (p === l.kind ? null : l.kind))}
        />
      ))}
    </svg>
  );
}
