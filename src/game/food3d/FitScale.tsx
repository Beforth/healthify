import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import KeepInView from './KeepInView';

/** Default on-screen size, in world units: a food's largest dimension is fitted
 *  to this many units. One food's size never depends on another's — every model
 *  is measured on its own and scaled to its own `target` number, so each food
 *  can be sized however it wants without a shared reference. */
export const DEFAULT_TARGET = 3.1;

/** Where a live-fitted food's middle sits vertically: the height the canvas camera aims at. */
const LIVE_CENTER_Y = 0.35;

/** Measures maximum dimension and lowest Y coordinate strictly in `node`'s local space.
 *  By pulling back through the inverse of `node.matrixWorld`, any transforms applied
 *  to `node`'s parents (scale, seat offset, KeepInView shrink) are completely cancelled out. */
function measureLocalBounds(
  node: THREE.Object3D,
): { max: number; screen: number; floor: number; cx: number; cy: number; cz: number } | null {
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
  return { max, screen: Math.max(size.x, size.y), floor: box.min.y, cx: (box.min.x + box.max.x) / 2, cy: (box.min.y + box.max.y) / 2, cz: (box.min.z + box.max.z) / 2 };
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
  live = false,
  children,
}: {
  target?: number;
  groundY?: number;
  /** Keep re-measuring while the food moves. A food fitted once while whole is
   *  too wide the moment its halves slide apart and ends up off-centre and
   *  clipped by the canvas edge; live mode fits and centres the *cut* pair. */
  live?: boolean;
  children: ReactNode;
}) {
  // A tall, narrow canvas (a phone held upright) sees far less sideways than a laptop
  // does, so a food fitted to the same size spills out of both sides of it.
  const aspect = useThree((state) => state.size.width / Math.max(state.size.height, 1));
  const width = Math.min(1, aspect / 1.15);
  const contentRef = useRef<THREE.Group>(null);
  const fittedRef = useRef(false);
  const [fit, setFit] = useState({ scale: 1, offsetY: 0 });
  const liveGroup = useRef<THREE.Group>(null);
  const liveScale = useRef<THREE.Group>(null);
  const liveState = useRef({ scale: 0, x: 0, y: 0, z: 0, frame: 0 });

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
  useFrame((_, delta) => {
    if (!live) {
      if (!fittedRef.current) applyFit();
      return;
    }
    const node = contentRef.current;
    const holder = liveScale.current;
    const outer = liveGroup.current;
    if (!node || !holder || !outer) return;
    const st = liveState.current;
    // measuring walks every vertex-bound of every mesh: a few times a second is plenty
    if (st.frame++ % 5 === 0 || st.scale === 0) {
      // measured in the content's own space, so the current fit never skews it
      const bounds = measureLocalBounds(node);
      if (bounds) {
        // what the camera sees is width and height; how far a half reaches back is nearly
        // free, and counting it would shrink every long, thin food to a speck
        const scale = (target * width) / Math.max(bounds.screen, bounds.max * 0.6);
        const first = st.scale === 0;
        st.scale = scale;
        st.x = -bounds.cx * scale;
        st.z = -bounds.cz * scale;
        // no board to stand on: sit the middle of the food on the camera's aim point
        st.y = groundY === undefined ? LIVE_CENTER_Y - bounds.cy * scale : 0;
        if (first) {
          holder.scale.setScalar(scale);
          holder.position.set(st.x, st.y, st.z);
        }
        if (groundY !== undefined) outer.position.y = groundY - bounds.floor * scale;
      }
    }
    if (st.scale !== 0) {
      const k = 1 - Math.exp(-delta * 8);
      holder.scale.setScalar(holder.scale.x + (st.scale - holder.scale.x) * k);
      holder.position.x += (st.x - holder.position.x) * k;
      holder.position.y += (st.y - holder.position.y) * k;
      holder.position.z += (st.z - holder.position.z) * k;
    }
  });

  if (live) {
    const fitted = (
      <group ref={liveScale} scale={0.0001}>
        <group ref={contentRef}>{children}</group>
      </group>
    );
    return (
      <group ref={liveGroup}>
        {/* A food standing on the board is fitted to it directly. KeepInView shrinks about the
            group's origin, which lifts a shrunk food off the board and leaves it hovering. */}
        {groundY === undefined ? <KeepInView>{fitted}</KeepInView> : fitted}
      </group>
    );
  }

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