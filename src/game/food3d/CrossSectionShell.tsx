import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand } from 'lucide-react';
import FoodCanvas from './FoodCanvas';
import CellView, { type MicroVariant } from '../micro/CellView';
import type { MicroSpec } from '../micro/microStructures';

export interface CrossSectionFact {
  id: string;
  icon: ReactNode;
  /** Short, plain name a child can read out loud. */
  name: string;
  /** One or two simple sentences. No nutrition-science vocabulary. */
  fact: string;
  /** The grown-up number, shown as a small badge rather than as the headline. */
  tag?: string;
  /** Ties this fact's marker on the 3D model to its chip below. */
  color: string;
}

interface CrossSectionShellProps {
  facts: CrossSectionFact[];
  /** The tissue itself, drawn beside the cut model. A microscope screen that
   *  only shows a cut solid is not really a microscope. */
  micro: MicroSpec;
  /** Renders the 3D scene. Receives the current selection, plus a setter so the
   *  markers stuck onto the model can change it — tapping the food and tapping a
   *  chip are the same action. */
  scene: (active: string | null, select: (id: string | null) => void) => ReactNode;
}

function PanelTitle({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2,
        padding: '5px 14px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.9)',
        color: 'var(--green-dark)',
        fontWeight: 800,
        fontSize: '0.78rem',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {children}
    </div>
  );
}

export default function CrossSectionShell({ facts, micro, scene }: CrossSectionShellProps) {
  // Deliberately starts empty. Pre-selecting a fact used to suppress the one line
  // of text that tells a child the thing is interactive at all.
  const [active, setActive] = useState<string | null>(null);
  const [variant, setVariant] = useState<MicroVariant>('cartoon');
  const activeFact = facts.find((f) => f.id === active) ?? null;

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 980, margin: '0 auto' }}>
      {/* Two halves of one idea: the cut you made, and what that cut looks like
          close up. They wrap to a single column on a phone. */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          justifyContent: 'center',
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            position: 'relative',
            flex: '1 1 380px',
            minWidth: 300,
            borderRadius: 28,
            overflow: 'hidden',
            background: 'radial-gradient(circle, #f4fff7 0%, #e3faec 100%)',
            boxShadow: '0 14px 40px rgba(0,0,0,0.08)',
            border: '2px solid rgba(46, 204, 113, 0.22)',
          }}
        >
          <PanelTitle>Your cut, in 3D</PanelTitle>
          {/* No auto-rotate: the cut face should stay facing the viewer. Controls stay on
              so they can still spin it by hand. */}
          <FoodCanvas height={420} width="100%" autoRotate={false} controlsEnabled>
            {scene(active, setActive)}
          </FoodCanvas>

          {/* Sits over the canvas, where the child is already looking, instead of
              below the fold underneath the chips. */}
          <AnimatePresence>
            {!activeFact && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10, transition: { duration: 0.15 } }}
                style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: 14,
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 16px',
                  borderRadius: 999,
                  background: 'rgba(27, 105, 70, 0.94)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 6px 20px rgba(27, 105, 70, 0.3)',
                  pointerEvents: 'none',
                }}
              >
                <motion.span
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ display: 'flex' }}
                >
                  <Hand size={16} />
                </motion.span>
                Tap a glowing dot!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div
          style={{
            position: 'relative',
            flex: '1 1 380px',
            minWidth: 300,
            borderRadius: 28,
            overflow: 'hidden',
            background: 'radial-gradient(circle, #f7fdf9 0%, #e9f6ee 100%)',
            boxShadow: '0 14px 40px rgba(0,0,0,0.08)',
            border: '2px solid rgba(46, 204, 113, 0.22)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '46px 8px 12px',
            boxSizing: 'border-box',
          }}
        >
          <PanelTitle>
            {variant === 'science' ? micro.sciCaption : micro.caption}
          </PanelTitle>
          <CellView spec={micro} variant={variant} />

          {/* Same tissue, two audiences: a child pokes the cells with faces, a
              grown-up in the room wants to see it look like a real sample. */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
            {(['cartoon', 'science'] as MicroVariant[]).map((v) => {
              const on = variant === v;
              return (
                <button
                  key={v}
                  onClick={() => setVariant(v)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 999,
                    border: on ? '2px solid #1b6946' : '1.5px solid #d3e9db',
                    background: on ? '#1b6946' : '#ffffff',
                    color: on ? '#ffffff' : '#41604f',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {v === 'cartoon' ? 'Fun view' : 'Science view'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* The chips mirror the markers on the model — same colour, same order — so
          either one works and each one teaches the other. */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 9,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 14,
          marginBottom: 6,
        }}
      >
        {facts.map((f) => {
          const isSelected = active === f.id;
          return (
            <motion.button
              key={f.id}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActive((cur) => (cur === f.id ? null : f.id))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 999,
                border: isSelected ? `2px solid ${f.color}` : '1.5px solid #d3e9db',
                background: isSelected ? '#1b6946' : '#ffffff',
                color: isSelected ? '#ffffff' : '#1e3a2b',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: 'pointer',
                boxShadow: isSelected
                  ? '0 6px 18px rgba(27, 105, 70, 0.28)'
                  : '0 2px 6px rgba(0,0,0,0.04)',
                transition: 'background 0.18s ease, color 0.18s ease, border 0.18s ease',
              }}
            >
              {/* the coloured bead is what links a chip back to its dot on the model */}
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: f.color,
                  border: '2px solid #ffffff',
                  boxShadow: `0 0 0 1.5px ${f.color}`,
                  flexShrink: 0,
                }}
              />
              <span style={{ display: 'flex', alignItems: 'center' }}>{f.icon}</span>
              <span>{f.name}</span>
            </motion.button>
          );
        })}
      </div>

      <div style={{ minHeight: 96, marginTop: 10 }}>
        <AnimatePresence mode="wait">
          {activeFact ? (
            <motion.div
              key={activeFact.id}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.14 } }}
              transition={{ type: 'spring', stiffness: 280, damping: 20 }}
              className="card"
              style={{
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
                textAlign: 'left',
                padding: '16px 18px',
                border: `2px solid ${activeFact.color}`,
                background: '#ffffff',
                borderRadius: 18,
                boxShadow: '0 8px 24px rgba(31, 122, 77, 0.1)',
              }}
            >
              <motion.div
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: 'var(--green-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                {activeFact.icon}
              </motion.div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                    fontWeight: 800,
                    fontSize: '1.08rem',
                    color: 'var(--green-dark)',
                  }}
                >
                  {activeFact.name}
                  {activeFact.tag && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: '#dff5e6',
                        color: 'var(--green-dark)',
                      }}
                    >
                      {activeFact.tag}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '0.95rem',
                    color: 'var(--ink-soft)',
                    marginTop: 5,
                    lineHeight: 1.5,
                  }}
                >
                  {activeFact.fact}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--ink-soft)',
                padding: '18px 0',
                textAlign: 'center',
              }}
            >
              Drag the food to spin it around and look inside.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
