import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_URL = `${import.meta.env.BASE_URL}models/milk.glb`;

/** A photoscanned glass of milk, about 0.62 x 1.0 x 0.64 in its own units, standing
 *  upright and already full. */
const SCALE = 1.7;

useGLTF.preload(MODEL_URL);

/** The scan as one piece. A glass of milk is not a food you cut open — the whole
 *  point of looking at it is what is *in* it, not what is inside it — so nothing
 *  here is ever split, and there is no invented interior to get wrong. The
 *  microscope screen does that job instead, with the milk's real cell story
 *  beside it. */
export function MilkWholeGeometry() {
  const { scene } = useGLTF(MODEL_URL);

  // useGLTF hands back a cached, shared scene — read what we need out of it and
  // never mutate it, or every other copy on screen changes too.
  const source = useMemo(() => {
    let geometry: THREE.BufferGeometry | null = null;
    let map: THREE.Texture | null = null;

    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (geometry || !mesh.isMesh) return;
      geometry = mesh.geometry;
      const material = mesh.material as THREE.MeshStandardMaterial;
      map = material?.map ?? null;
    });

    return { geometry, map };
  }, [scene]);

  if (!source.geometry) return null;

  return (
    <mesh geometry={source.geometry} castShadow receiveShadow>
      <meshStandardMaterial
        map={source.map}
        flatShading
        roughness={0.35}
        envMapIntensity={1.1}
      />
    </mesh>
  );
}

export default function MilkModel({
  cutProgressRef,
}: {
  cutProgressRef: MutableRefObject<number>;
  cutAngle?: number;
}) {
  const outer = useRef<THREE.Group>(null);
  const squish = useRef(0);
  const [hovered, setHovered] = useState(false);

  // Deliberately no cut progress in here. `cutProgressRef` is read only to decide
  // whether the glass is still waiting to be introduced, so a child who somehow
  // reaches this food with a drag still never sees it split.
  useFrame((state, delta) => {
    squish.current *= Math.exp(-delta * 6);
    if (!outer.current) return;
    const wobble = Math.sin(state.clock.elapsedTime * 14) * squish.current;
    const hoverBoost = hovered ? 1.05 : 1;
    // liquid in a glass: it settles and jiggles a touch when poked, and swings
    outer.current.scale.setScalar(SCALE * (1 - wobble * 0.03) * hoverBoost);
    outer.current.position.y =
      cutProgressRef.current > 0.02 ? 0 : Math.sin(state.clock.elapsedTime * 1.6) * 0.04;
  });

  const bump = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    squish.current = 1;
  };

  return (
    <group
      ref={outer}
      scale={SCALE}
      onPointerDown={bump}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* the smallest lean a milk carton gets on a shelf, so the glass reads as
          round rather than as a flat card */}
      <group rotation={[0.05, 0.3, 0.04]}>
        <MilkWholeGeometry />
      </group>
    </group>
  );
}
