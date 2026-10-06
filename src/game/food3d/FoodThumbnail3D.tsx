import { memo, useLayoutEffect, useRef, useState } from 'react';
import FoodIcon from '../../components/FoodIcon';
import { FOOD_MODELS } from './foodRegistry';
import { attachPreview } from './PreviewRenderer';
import { isTouchOnly } from '../../lib/touch';

/** A small, auto-rotating preview of a food's real 3D model — used on the picker.
 *  Draggable to spin by hand, same as the other 3D views.
 *  Every model is fitted to that food's own target size, so the grid lines up at
 *  a chosen footprint per food rather than one shared reference.
 *  `scale` shrinks the model inside the canvas box without touching the box
 *  itself, so a caller can widen the canvas while keeping every food a touch
 *  smaller and fully inside it. Foods without a model fall back to their 2D icon,
 *  so every card on the picker still shows the food rather than an empty square.
 *  Memoized — parent re-renders during search/filter never re-run 3D attachment
 *  unless foodId or scale actually changes. */
const FoodThumbnail3D = memo(function FoodThumbnail3D({
  foodId,
  size = 96,
  scale = 1,
}: {
  foodId: string;
  size?: number;
  scale?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef({ x: 0, y: 0, moved: false });
  const [ready, setReady] = useState(false);
  const hasModel = Boolean(FOOD_MODELS[foodId]);
  // On a phone the picker is a list to scroll: a thumbnail that turns under the finger traps
  // the swipe. Touch devices get a still preview that lets every touch fall through to the page.
  const touch = isTouchOnly();

  useLayoutEffect(() => {
    const surface = canvas.current;
    if (!hasModel || !surface) return;
    try {
      return attachPreview(foodId, surface, scale, () => {
        setReady(true);
      });
    } catch (error) {
      console.warn('3D previews unavailable; showing food illustrations.', error);
    }
  // `size` is intentionally excluded — it only controls canvas element
  // dimensions (already set via HTML attrs) and must not re-trigger a full
  // attachPreview teardown/remount on every layout shift.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodId, hasModel, scale]);

  // On mobile/touch devices, previews are non-interactive still images so swipes
  // fall directly through to the scroll container without trapping or stuttering.
  const isTouchOrCoarse = touch || (typeof window !== 'undefined' && (('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth <= 768));

  if (!hasModel) return <FoodIcon id={foodId} size={size} />;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        margin: '0 auto',
        touchAction: 'pan-y',
        pointerEvents: isTouchOrCoarse ? 'none' : 'auto',
      }}
    >
      {/* Instant 2D placeholder backdrop: zero pop-in, zero blank frames */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: ready ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: ready ? 0 : 1,
          transition: 'opacity 0.22s ease-out',
          pointerEvents: 'none',
        }}
      >
        <FoodIcon id={foodId} size={size} />
      </div>

      <canvas
        ref={canvas}
        width={size}
        height={size}
        aria-label={`${foodId} preview`}
        data-food-preview={foodId}
        style={{
          position: 'absolute',
          inset: 0,
          width: size,
          height: size,
          touchAction: 'pan-y',
          pointerEvents: isTouchOrCoarse ? 'none' : 'auto',
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.18s ease-in',
        }}
        {...(!isTouchOrCoarse ? {
          onPointerDown: (event: React.PointerEvent) => {
            drag.current = { x: event.clientX, y: event.clientY, moved: false };
          },
          onPointerMove: (event: React.PointerEvent) => {
            if (event.buttons && Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) > 5) {
              drag.current.moved = true;
            }
          },
          onClick: (event: React.MouseEvent) => {
            if (drag.current.moved) event.stopPropagation();
          },
        } : {})}
      />
    </div>
  );
});

export default FoodThumbnail3D;
