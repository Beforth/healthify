import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import KeepInView from './KeepInView';

/** Default on-screen size, in world units: a food's largest dimension is fitted
 *  to this many units. One food's size never depends on another's — every model
 *  is measured on its own and scaled to its own `target` number, so each food
 *  can be sized however it wants without a shared reference. */
export const DEFAULT_TARGET = 3.1;

function measureMax(node: THREE.Object3D): number | null {
  node.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(node);
  if (box.isEmpty()) return null;
  const size = box.getSize(new THREE.Vector3());
  const max = Math.max(size.x, size.y, size.z);
  return max > 1e-6 ? max : null;
}

/**
 * Scales its children so the ensemble fills a chosen on-screen footprint.
 *
 * Each food model is drawn at its own natural size — the scans carry a per-food
 * SCALE, the code-built ones use their raw units — so without this the picker and
 * the cut stage line them all up at different sizes. Fitting every model to its
 * own `target` (instead of hand-tuning every model's SCALE) keeps the food sized
 * to exactly the footprint the caller wants while leaving the model free to keep
 * its own proportions.
 *
 * The measurement covers only this model's own subtree: no model publishes a size
 * for another to scale against, so two foods on the same page never influence
 * each other.
 */
export default function FitScale({ target = DEFAULT_TARGET, children }: { target?: number; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const node = group.current;
    if (!node) return;
    const max = measureMax(node);
    if (max === null) return;
    setScale(target / max);
  }, [target]);

  // The fit is taken once, while the food is whole. `KeepInView` covers what
  // happens after — halves sliding apart on a canvas too narrow for them.
  return (
    <group ref={group}>
      <KeepInView>
        <group scale={scale}>{children}</group>
      </KeepInView>
    </group>
  );
}