import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import KeepInView from './KeepInView';

/** Default on-screen size, in world units: a food's largest dimension is fitted
 *  to this many units. One food's size never depends on another's — every model
 *  is measured on its own and scaled to its own `target` number, so each food
 *  can be sized however it wants without a shared reference. */
export const DEFAULT_TARGET = 3.1;

/** Measures maximum dimension and lowest Y coordinate strictly in `node`'s local space.
 *  By pulling back through the inverse of `node.matrixWorld`, any transforms applied
 *  to `node`'s parents (scale, seat offset, KeepInView shrink) are completely cancelled out. */
function measureLocalBounds(node: THREE.Object3D): { max: number; floor: number } | null {
  node.updateWorldMatrix(true, true);
  const invWorld = new THREE.Matrix4().copy(node.matrixWorld).invert();
  const local = new THREE.Matrix4();
  const box = new THREE.Box3();
  const piece = new THREE.Box3();

  node.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    mesh.geometry.computeBoundingBox();
    if (!geometryHasValidBounds(mesh.geometry)) return;
    local.copy(invWorld).multiply(child.matrixWorld);
    box.union(piece.copy(mesh.geometry.boundingBox!).applyMatrix4(local));
  });

  if (box.isEmpty()) return null;
  const size = box.getSize(new THREE.Vector3());
  const max = Math.max(size.x, size.y, size.z);
  if (max <= 1e-6) return null;
  return { max, floor: box.min.y };
}

function geometryHasValidBounds(geometry: THREE.BufferGeometry): boolean {
  const box = geometry.boundingBox;
  if (!box) return false;
  return Number.isFinite(box.min.x) && Number.isFinite(box.max.x);
}

/**
 * Scales its children so the ensemble fills a chosen on-screen footprint,
 * and drops the food so its lowest point rests flush on `groundY`.
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
  const contentRef = useRef<THREE.Group>(null);
  const fittedRef = useRef(false);
  const [fit, setFit] = useState({ scale: 1, offsetY: 0 });

  const applyFit = useCallback(() => {
    const node = contentRef.current;
    if (!node) return false;
    const bounds = measureLocalBounds(node);
    if (!bounds) return false;
    const scale = target / bounds.max;
    const offsetY = groundY === undefined ? 0 : groundY - bounds.floor * scale;
    setFit({ scale, offsetY });
    fittedRef.current = true;
    return true;
  }, [target, groundY]);

  useLayoutEffect(() => {
    fittedRef.current = false;
    applyFit();
  }, [applyFit]);

  // Fallback for async GLTF models that mount geometry after initial layout effect
  useFrame(() => {
    if (!fittedRef.current) {
      applyFit();
    }
  });

  return (
    <group position={[0, fit.offsetY, 0]}>
      <KeepInView>
        <group scale={fit.scale}>
          <group ref={contentRef}>{children}</group>
        </group>
      </KeepInView>
    </group>
  );
}