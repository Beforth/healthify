import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { positionPopup, type PopupPosition, type Rect } from '../tour/positionPopup';
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
  const popupRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{ step: number; position: PopupPosition } | null>(null);

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

  useLayoutEffect(() => {
    if (!step || location.pathname !== step.path) return;
    let frame = 0;
    let target: HTMLElement | null = null;
    let restoreTarget: (() => void) | undefined;
    let restoreScrollSpace: (() => void) | undefined;
    let last = '';
    let previous: PopupPosition['side'] | undefined;
    let initialScroll = true;
    const measure = () => {
      const popup = popupRef.current;
      const content = contentRef.current;
      if (!popup || !content) return;
      const visual = window.visualViewport;
      const viewport: Rect = { left: visual?.offsetLeft ?? 0, top: visual?.offsetTop ?? 0, width: visual?.width ?? window.innerWidth, height: visual?.height ?? window.innerHeight };
      const found = step.target ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`) : null;
      if (found !== target) {
        restoreTarget?.();
        restoreScrollSpace?.();
        restoreScrollSpace = undefined;
        target = found;
        initialScroll = true;
        if (target) {
          const element = target;
          const properties = ['max-height', 'overflow-y', 'min-height', 'flex-shrink', 'scroll-margin'];
          const originals = properties.map((name) => [name, element.style.getPropertyValue(name), element.style.getPropertyPriority(name)]);
          restoreTarget = () => originals.forEach(([name, value, priority]) => value ? element.style.setProperty(name, value, priority) : element.style.removeProperty(name));
        }
      }
      if (step.target && !target) {
        popup.style.visibility = 'hidden';
        setSpotlight(null);
        return;
      }
      const width = Math.min(280, Math.max(0, viewport.width - 24));
      popup.style.width = width + 'px';
      // Measure un-clipped content, including the panel padding.
      const height = content.getBoundingClientRect().height + 36;
      if (target) {
        // A tall group cannot physically fit alongside a popup on a small screen.
        // Temporarily make that group scrollable, keeping its full bounds visible.
        const bounds = target.getBoundingClientRect();
        const hasSideRoom = bounds.left - viewport.left >= width + 40 || viewport.left + viewport.width - bounds.right >= width + 40;
        const limit = Math.max(80, viewport.height - (hasSideRoom ? 48 : Math.min(height, viewport.height * .45) + 64));
        if (target.scrollHeight > limit) {
          target.style.maxHeight = limit + 'px';
          target.style.minHeight = '0';
          target.style.flexShrink = '0';
          target.style.overflowY = 'auto';
        } else {
          restoreTarget?.();
        }
        target.style.scrollMargin = '24px';
        const rect = target.getBoundingClientRect();
        if (initialScroll || rect.top < viewport.top || rect.bottom > viewport.top + viewport.height) {
          target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
          initialScroll = false;
        }
      }
      const rect = target?.getBoundingClientRect();
      const spot = rect ? { left: rect.left - 8, top: rect.top - 8, width: rect.width + 16, height: rect.height + 16 } : null;
      const position = positionPopup(spot, { width, height }, viewport, previous);
      if (!position && target) {
        // Give a near-bottom target enough scroll runway to reach the top.
        // This is restored when the step ends and is only needed when no region fits.
        const screen = target.closest<HTMLElement>('.screen');
        if (screen && !restoreScrollSpace) {
          const original = screen.style.paddingBottom;
          screen.style.paddingBottom = `${parseFloat(getComputedStyle(screen).paddingBottom) + viewport.height}px`;
          restoreScrollSpace = () => { screen.style.paddingBottom = original; };
        }
        target.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' });
        // Remeasure next frame after the scroll; never display an overlapping panel.
        popup.style.visibility = 'hidden';
        return;
      }
      if (!position) return;
      previous = position.side;
      const signature = JSON.stringify([spot, position]);
      if (signature !== last) {
        last = signature;
        setSpotlight(spot);
        setLayout({ step: stepIndex, position });
      }
      popup.style.visibility = 'visible';
    };
    const tick = () => { measure(); frame = requestAnimationFrame(tick); };
    // Continuous bounds tracking also catches transforms, font loading and layout shifts
    // that do not generate resize/scroll events. React updates only when bounds change.
    measure();
    frame = requestAnimationFrame(tick);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    window.addEventListener('scroll', measure, true);
    window.visualViewport?.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('scroll', measure);
    const observer = new ResizeObserver(measure);
    if (contentRef.current) observer.observe(contentRef.current);
    // Let highlighted controls actually work, including their navigation.
    const onTargetClick = (event: MouseEvent) => {
      if (event.target instanceof Element && target?.contains(event.target) && event.target.closest('button, a')) end();
    };
    document.addEventListener('click', onTargetClick, true);
    return () => {
      cancelAnimationFrame(frame);
      restoreTarget?.();
      restoreScrollSpace?.();
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
      window.removeEventListener('scroll', measure, true);
      window.visualViewport?.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('scroll', measure);
      document.removeEventListener('click', onTargetClick, true);
    };
  }, [step, stepIndex, location.pathname, end]);

  if (!step) return null;
  const position = layout?.step === stepIndex ? layout.position : null;
  const hole = position ? spotlight : null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, pointerEvents: 'none' }}>
      {hole ? <>
        {/* Four hit areas leave a real click-through hole around the target. */}
        {[
          { left: 0, top: 0, width: '100%', height: Math.max(0, hole.top) },
          { left: 0, top: Math.max(0, hole.top + hole.height), width: '100%', bottom: 0 },
          { left: 0, top: Math.max(0, hole.top), width: Math.max(0, hole.left), height: hole.height },
          { left: Math.max(0, hole.left + hole.width), right: 0, top: Math.max(0, hole.top), height: hole.height },
        ].map((style, index) => <div key={index} onClick={end} style={{ position: 'fixed', pointerEvents: 'auto', ...style }} />)}
        <div style={{ position: 'fixed', ...hole, borderRadius: 18, boxShadow: '0 0 0 9999px rgba(10, 30, 20, 0.55)', border: '2.5px solid #ffffff', pointerEvents: 'none' }} />
      </> : <div onClick={end} style={{ position: 'fixed', inset: 0, background: 'rgba(10, 30, 20, 0.55)', pointerEvents: 'auto' }} />}
      <div
        ref={popupRef}
        role="dialog"
        aria-label={step.title}
        data-tour-popup=""
        data-placement={position?.side}
        style={{
          position: 'fixed', left: position?.left ?? 0, top: position?.top ?? 0,
          visibility: position ? 'visible' : 'hidden',
          zIndex: 1000, pointerEvents: 'auto', background: '#ffffff', borderRadius: 20,
          padding: '18px 20px', width: position?.width ?? 280, maxHeight: position?.height,
          overflowY: 'auto', overscrollBehavior: 'contain', scrollbarGutter: 'stable',
          boxShadow: '0 16px 40px rgba(0,0,0,0.25)', textAlign: 'left',
        }}
      >
        <div ref={contentRef}>
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
          <div style={{ paddingRight: 14, fontWeight: 900, fontSize: '1.05rem', color: 'var(--ink)', marginTop: 4 }}>
            {step.title}
          </div>
          <p style={{ margin: '6px 0 16px', color: 'var(--ink-soft)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            {step.text}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
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
        </div>
      </div>
    </div>,
    document.body,
  );
}
