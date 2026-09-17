import { useRef, type ReactNode } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

/** Spins JUST its children in place when dragged — the camera never moves, so
 *  anything outside this group (a knife, a pedestal, the background) stays put.
 *  Uses its own invisible catch-plane (rather than relying on the model's own
 *  meshes) because every food model already has its own onPointerDown for a
 *  little squish effect, and that calls stopPropagation before it can bubble
 *  up to a wrapping group's handler. */
export default function DragRotate({ children, sensitivity = 0.01 }: { children: ReactNode; sensitivity?: number }) {
  const group = useRef<THREE.Group>(null);
  const last = useRef({ x: 0, y: 0 });

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    last.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };

    const handleMove = (ev: PointerEvent) => {
      const dx = ev.clientX - last.current.x;
      const dy = ev.clientY - last.current.y;
      last.current = { x: ev.clientX, y: ev.clientY };
      const g = group.current;
      if (!g) return;
      g.rotation.y += dx * sensitivity;
      g.rotation.x = THREE.MathUtils.clamp(g.rotation.x + dy * sensitivity, -0.6, 0.6);
    };
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  return (
    <>
      <mesh visible={false} position={[0, 0.3, 1.5]} onPointerDown={onPointerDown}>
        <planeGeometry args={[3.4, 3.4]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <group ref={group}>{children}</group>
    </>
  );
}
