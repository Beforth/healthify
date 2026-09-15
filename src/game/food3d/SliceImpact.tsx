import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LIFE = 0.55;

/** A one-shot burst — an expanding ring plus scattering shards — played once when a cut lands. */
export default function SliceImpact() {
  const start = useRef<number | null>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const shardRefs = useRef<(THREE.Mesh | null)[]>([]);

  const shards = useMemo(
    () =>
      Array.from({ length: 12 }).map(() => ({
        dir: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 0.6 + 0.1,
          (Math.random() - 0.5) * 2,
        ).normalize(),
        speed: 1.4 + Math.random() * 1.6,
        size: 0.035 + Math.random() * 0.045,
      })),
    [],
  );

  useFrame((state) => {
    if (start.current === null) start.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - start.current;
    const p = Math.min(t / LIFE, 1);
    const ease = 1 - Math.pow(1 - p, 3);

    if (ringRef.current) {
      ringRef.current.scale.setScalar(0.3 + ease * 2.6);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.8;
    }
    if (ring2Ref.current) {
      ring2Ref.current.scale.setScalar(0.15 + ease * 1.6);
      (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.9;
    }
    shardRefs.current.forEach((m, i) => {
      if (!m) return;
      const s = shards[i];
      m.position.copy(s.dir.clone().multiplyScalar(s.speed * ease));
      m.position.y += ease - p * p * 1.6;
      m.rotation.x += 0.2;
      m.rotation.y += 0.15;
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = 1 - p;
    });
  });

  return (
    <group position={[0, 0.1, 1.1]}>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.14, 0.19, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} depthWrite={false} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.08, 0.11, 24]} />
        <meshBasicMaterial color="#ffe9a8" transparent opacity={0.9} depthWrite={false} />
      </mesh>
      {shards.map((s, i) => (
        <mesh
          key={i}
          ref={(el) => {
            shardRefs.current[i] = el;
          }}
        >
          <octahedronGeometry args={[s.size, 0]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={1} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
