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

/** The lowest point of this subtree, in *this group's* own coordinates.
 *
 *  `measureMax` measures in world space, which only matches local space while
 *  the group and all of its parents are untransformed — and the cut stage's
 *  `DragRotate` rotates the moment the user drags. The seat offset has to survive
 *  that, so the box is rebuilt from the children's own bounding boxes pulled
 *  back through the inverse of this group's world matrix. Visibility is ignored,
 *  exactly as `Box3.setFromObject` ignores it, so both measurements always agree
 *  about which meshes count as part of the food. */
function measureLocalFloor(node: THREE.Object3D): number {
  node.updateWorldMatrix(true, true);
  const invWorld = new THREE.Matrix4().copy(node.matrixWorld).invert();
  const local = new THREE.Matrix4();
  const box = new THREE.Box3();
  const piece = new THREE.Box3();

  node.traverse((child) => {
    const geometry = (child as THREE.Mesh).geometry;
    if (!geometry) return;
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    if (!geometry.boundingBox) return;
    local.copy(invWorld).multiply(child.matrixWorld);
    box.union(piece.copy(geometry.boundingBox).applyMatrix4(local));
  });

  return box.isEmpty() ? 0 : box.min.y;
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
 *
 * `groundY` is the other half of the placement. Fitting normalises a food's *size*
 * but leaves it centred on the origin, and on the cut stage the origin is half a
 * unit above the cutting board, so the taller foods ended up hanging through it.
 * Given the board's height, the food is dropped until its lowest point rests
 * there. A model that already seats itself — the donut's `REST_Y`, the ice
 * cream's lifted cone — comes out of this unchanged, because its own offset is
 * part of the box being measured. Omit `groundY` wherever there is no board
 * under the food, and the food stays centred on the origin as before.
 */
export default function FitScale({
  target = DEFAULT_TARGET,
  groundY,
  children,
}: {
  target?: number;
  groundY?: number;
  children: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const [fit, setFit] = useState({ scale: 1, offsetY: 0 });

  useLayoutEffect(() => {
    const node = group.current;
    if (!node) return;
    const max = measureMax(node);
    if (max === null) return;

    const scale = target / max;
    const floor = measureLocalFloor(node);
    setFit({ scale, offsetY: groundY === undefined ? 0 : groundY - floor * scale });
  }, [target, groundY]);

  // The fit is taken once, while the food is whole. `KeepInView` covers what
  // happens after — halves sliding apart on a canvas too narrow for them. The
  // seat sits outside it, so `KeepInView` shrinking a too-wide food scales the
  // food about its own middle and never drags it off the board.
  return (
    <group ref={group} position={[0, fit.offsetY, 0]}>
      <KeepInView>
        <group scale={fit.scale}>{children}</group>
      </KeepInView>
    </group>
  );
}