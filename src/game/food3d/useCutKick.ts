import { useRef, type MutableRefObject } from 'react';

/**
 * Returns a ref that spikes to 1 the instant cutProgressRef first reaches 1,
 * then decays back to 0 — call `.current *= Math.exp(-delta * 5)` isn't needed,
 * this does the decay for you when you call `tick(delta)` each frame.
 * Use the returned ref's value to add a one-shot "pop apart" overshoot on top
 * of the steady drag-driven separation, so completing a cut feels like an
 * impact rather than just reaching the end of a slider.
 */
export function useCutKick(cutProgressRef: MutableRefObject<number>) {
  const kick = useRef(0);
  const wasDone = useRef(false);

  const tick = (delta: number) => {
    if (cutProgressRef.current >= 0.999) {
      if (!wasDone.current) {
        wasDone.current = true;
        kick.current = 1;
      }
    } else {
      wasDone.current = false;
    }
    kick.current *= Math.exp(-delta * 5);
    return kick.current;
  };

  return tick;
}
