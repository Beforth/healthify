import { useEffect, useLayoutEffect, useState, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useTourStore } from '../store/tourStore';
import { TOUR_STEPS } from '../tour/tourSteps';
import { markTutorialSeen } from '../lib/tutorialSeen';

interface Spotlight {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function TourOverlay() {
  const active = useTourStore((s) => s.active);
  const stepIndex = useTourStore((s) => s.stepIndex);
  const next = useTourStore((s) => s.next);
  const back = useTourStore((s) => s.back);
  const end = useTourStore((s) => s.end);
  const navigate = useNavigate();
  const location = useLocation();
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);

  const step = active ? TOUR_STEPS[stepIndex] : null;
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  // Keep the route in sync with whatever step is showing.
  useEffect(() => {
    if (!step) return;
    if (location.pathname !== step.path) navigate(step.path);
  }, [step, location.pathname, navigate]);

  // The tour walks the player through the "How to Play" screen itself, so
  // that counts as having seen it — otherwise "Show me how" would still force
  // them through the full 4-step carousel again right after the tour.
  useEffect(() => {
    if (step?.path === '/tutorial') markTutorialSeen();
  }, [step]);

  // Once we're on the right route, track the target element's position every
  // frame — it may still be animating in (framer-motion entrances etc.).
  useLayoutEffect(() => {
    if (!step || !step.target || location.pathname !== step.path) {
      setSpotlight(null);
      return;
    }
    let frame: number;
    let last: Spotlight | null = null;
    const pad = 10;
    const close = (a: number, b: number) => Math.abs(a - b) < 0.5;
    const track = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        const next = { top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
        // Skip the setState when nothing moved — the target is often mid-animation
        // (framer-motion entrances etc.), so this still tracks it, but a wasted
        // setState every single frame was starving the step-change re-render.
        if (!last || !close(last.top, next.top) || !close(last.left, next.left) || !close(last.width, next.width) || !close(last.height, next.height)) {
          last = next;
          setSpotlight(next);
        }
      } else if (last !== null) {
        last = null;
        setSpotlight(null);
      }
      frame = requestAnimationFrame(track);
    };
    track();
    return () => cancelAnimationFrame(frame);
  }, [step, location.pathname]);

  if (!step) return null;

  let bubbleStyle: CSSProperties = {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  };
  if (spotlight && step.placement !== 'center') {
    const centerX = Math.min(Math.max(spotlight.left + spotlight.width / 2, 160), window.innerWidth - 160);
    bubbleStyle =
      step.placement === 'top'
        ? { position: 'fixed', left: centerX, top: spotlight.top - 14, transform: 'translate(-50%, -100%)' }
        : { position: 'fixed', left: centerX, top: spotlight.top + spotlight.height + 14, transform: 'translate(-50%, 0)' };
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999 }}>
      <div
        onClick={end}
        style={{
          position: 'fixed',
          inset: 0,
          background: spotlight ? 'transparent' : 'rgba(10, 30, 20, 0.55)',
        }}
      />
      {spotlight && (
        <motion.div
          animate={spotlight}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed',
            borderRadius: 18,
            boxShadow: '0 0 0 9999px rgba(10, 30, 20, 0.55)',
            border: '2.5px solid #ffffff',
            pointerEvents: 'none',
          }}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            ...bubbleStyle,
            zIndex: 1000,
            background: '#ffffff',
            borderRadius: 20,
            padding: '18px 20px',
            width: 280,
            boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
            textAlign: 'left',
          }}
        >
          <button
            onClick={end}
            aria-label="Skip tour"
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--ink-soft)',
            }}
          >
            <X size={18} />
          </button>

          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              color: 'var(--green-dark)',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            Step {stepIndex + 1} of {TOUR_STEPS.length}
          </div>
          <div style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--ink)', marginTop: 4 }}>
            {step.title}
          </div>
          <p style={{ margin: '6px 0 16px', color: 'var(--ink-soft)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            {step.text}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={end}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--ink-soft)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Skip
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              {stepIndex > 0 && (
                <button onClick={back} className="btn secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Back
                </button>
              )}
              <button
                onClick={() => (isLast ? end() : next())}
                className="btn"
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              >
                {isLast ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
