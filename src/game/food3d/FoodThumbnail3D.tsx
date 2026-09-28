import { useRef } from 'react';
import FoodCanvas from './FoodCanvas';
import FoodIcon from '../../components/FoodIcon';
import FitScale from './FitScale';
import { FOOD_MODELS, foodSizeOf } from './foodRegistry';

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
  const cutProgressRef = useRef(0);
  const Model = FOOD_MODELS[foodId];
  if (!Model) return <FoodIcon id={foodId} size={size} />;

  return (
    <FoodCanvas height={size} width={size} autoRotate controlsEnabled>
      <group scale={scale}>
        <FitScale target={foodSizeOf(foodId)}>
          <Model cutProgressRef={cutProgressRef} />
        </FitScale>
      </group>
    </FoodCanvas>
  );
}
