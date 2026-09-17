import { useRef } from 'react';
import FoodCanvas from './FoodCanvas';
import { FOOD_MODELS } from './foodRegistry';

/** A small, auto-rotating preview of a food's real 3D model — used on the picker.
 *  Draggable to spin by hand, same as the other 3D views. */
export default function FoodThumbnail3D({ foodId, size = 96 }: { foodId: string; size?: number }) {
  const cutProgressRef = useRef(0);
  const Model = FOOD_MODELS[foodId];
  if (!Model) return null;

  return (
    <FoodCanvas height={size} width={size} autoRotate controlsEnabled>
      <Model cutProgressRef={cutProgressRef} />
    </FoodCanvas>
  );
}
