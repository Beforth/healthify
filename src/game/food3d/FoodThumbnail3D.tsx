import { useLayoutEffect, useRef } from 'react';
import FoodIcon from '../../components/FoodIcon';
import { FOOD_MODELS } from './foodRegistry';
import { attachPreview } from './PreviewRenderer';

/** A small, auto-rotating preview of a food's real 3D model — used on the picker.
 *  Draggable to spin by hand, same as the other 3D views.
 *  Every model is fitted to that food's own target size, so the grid lines up at
 *  a chosen footprint per food rather than one shared reference.
 *  `scale` shrinks the model inside the canvas box without touching the box
 *  itself, so a caller can widen the canvas while keeping every food a touch
 *  smaller and fully inside it. Foods without a model fall back to their 2D icon,
 *  so every card on the picker still shows the food rather than an empty square. */
export default function FoodThumbnail3D({
  foodId,
  size = 96,
  scale = 1,
}: {
  foodId: string;
  size?: number;
  scale?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const fallback = useRef<HTMLDivElement>(null);
  const drag = useRef({ x: 0, y: 0, moved: false });
  const hasModel = Boolean(FOOD_MODELS[foodId]);
  useLayoutEffect(() => {
    const surface = canvas.current;
    if (!hasModel || !surface) return;
    surface.style.opacity = '0';
    if (fallback.current) fallback.current.style.opacity = '1';
    let painted = false;
    let fadeTimer: number | undefined;
    try {
      const detach = attachPreview(foodId, surface, scale, () => {
        if (painted) return;
        painted = true;
        surface.style.opacity = '1';
        fadeTimer = window.setTimeout(() => {
          if (fallback.current && painted) {
            fallback.current.style.opacity = '0';
          }
        }, 250);
      });
      return () => {
        if (fadeTimer) clearTimeout(fadeTimer);
        detach();
      };
    } catch (error) {
      console.warn('3D previews unavailable; showing food illustrations.', error);
    }
  }, [foodId, hasModel, scale, size]);

  if (!hasModel) return <FoodIcon id={foodId} size={size} />;

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <div
        ref={fallback}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'opacity 0.25s ease-out',
        }}
      >
        <FoodIcon id={foodId} size={size} />
      </div>
      <canvas
        ref={canvas}
        width={size}
        height={size}
        aria-label={`Rotate ${foodId} preview`}
        data-food-preview={foodId}
        style={{
          position: 'absolute',
          inset: 0,
          width: size,
          height: size,
          opacity: 0,
          transition: 'opacity 0.3s ease-out',
          touchAction: 'none',
        }}
        onPointerDown={(event) => {
          drag.current = { x: event.clientX, y: event.clientY, moved: false };
        }}
        onPointerMove={(event) => {
          if (event.buttons && Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) > 5) {
            drag.current.moved = true;
          }
        }}
        onClick={(event) => {
          if (drag.current.moved) event.stopPropagation();
        }}
      />
    </div>
  );
}
