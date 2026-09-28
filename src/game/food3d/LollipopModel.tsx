import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { buildHalfSolid } from './halfSolid';

const RADIUS = 0.92;

const CANDY_PINK = new THREE.Color('#ef476f');
const CANDY_CREAM = new THREE.Color('#fff1f4');

/** Lollipop silhouette: a ball pressed in a two-part mould, so it is slightly
 *  flatter front to back, carries a faint seam ridge round its middle, and is
 *  pushed in underneath where the stick goes. x is thickness (cut runs down x = 0). */
function deformLollipop(p: THREE.Vector3, ny: number) {
  p.z *= 0.84;

  // the ridge left where the two halves of the mould met
  const ridge = 1 + 0.02 * Math.exp(-((ny / 0.1) ** 2));
  p.x *= ridge;
  p.z *= ridge;

  if (ny < -0.7) p.y += 0.2 * THREE.MathUtils.smoothstep(-ny, 0.7, 1);
}

/** Twisted stripes running pole to pole — what a swirl lollipop looks like once
 *  the hot sugar has been pulled and wound together. */
function lollipopColor(p: THREE.Vector3, ny: number, target: THREE.Color) {
  const swirl = Math.sin(3 * Math.atan2(p.z, p.x) + ny * 1.7);
  target.copy(CANDY_CREAM).lerp(CANDY_PINK, THREE.MathUtils.smoothstep(swirl, -0.25, 0.25));
}

export function LollipopHalfGeometry({ isLeft = false }: { isLeft?: boolean }) {
  const { skinGeo, cutGeo } = useMemo(
    () => buildHalfSolid(isLeft, RADIUS, deformLollipop, lollipopColor),
    [isLeft],
  );

  const faceSign = isLeft ? -1 : 1;

  // Half the stick, so cutting the lollipop cuts the stick with it rather than
  // leaving the whole thing hanging off one side.
  const thetaStart = isLeft ? 0 : Math.PI;

  return (
    <group>
      <mesh geometry={skinGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          vertexColors
          roughness={0.16}
          clearcoat={0.85}
          clearcoatRoughness={0.12}
          envMapIntensity={1.3}
        />
      </mesh>

      {/* The cut face is the whole lesson here: rings of boiled sugar wound in a
          spiral, and nothing else in the middle. */}
      <group position={[faceSign * 0.004, 0, 0]}>
        {[1, 0.82, 0.64, 0.46, 0.3, 0.15].map((ring, i) => (
          <mesh
            key={ring}
            geometry={cutGeo}
            position={[faceSign * i * 0.003, 0, 0]}
            scale={[1, ring, ring]}
          >
            <meshStandardMaterial
              color={i % 2 === 0 ? '#fdeaf0' : '#ef476f'}
              roughness={0.35}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      <group position={[0, -RADIUS * 0.72, 0]}>
        <mesh position={[0, -0.52, 0]} castShadow>
          <cylinderGeometry args={[0.062, 0.062, 1.05, 18, 1, false, thetaStart, Math.PI]} />
          <meshStandardMaterial color="#f7f8fa" roughness={0.55} side={THREE.DoubleSide} />
        </mesh>
        {/* closes the open side of the half-stick so it does not read as hollow */}
        <mesh position={[faceSign * 0.002, -0.52, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.124, 1.05]} />
          <meshStandardMaterial color="#e6e9ed" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

export default function LollipopModel({
  cutProgressRef,
}: {
  cutProgressRef: MutableRefObject<number>;
  cutAngle?: number;
}) {
  const outer = useRef<THREE.Group>(null);
  const innerA = useRef<THREE.Group>(null);
  const innerB = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const squish = useRef(0);
  const [hovered, setHovered] = useState(false);
  const tickKick = useCutKick(cutProgressRef);

  useFrame((state, delta) => {
    progress.current = THREE.MathUtils.damp(progress.current, cutProgressRef.current, 25, delta);
    const p = progress.current;
    const kick = tickKick(delta);
    const sep = p * 0.55 + kick * 0.3;

    if (innerA.current) {
      innerA.current.position.x = sep;
      innerA.current.rotation.y = Math.min(sep * 0.8, 0.5);
    }
    if (innerB.current) {
      innerB.current.position.x = -sep;
      innerB.current.rotation.y = -Math.min(sep * 0.8, 0.5);
    }

    squish.current *= Math.exp(-delta * 6);
    if (outer.current) {
      const wobble = Math.sin(state.clock.elapsedTime * 14) * squish.current;
      const hoverBoost = hovered ? 1.05 : 1;
      // boiled sugar is glass-hard, so it barely gives when you press it
      outer.current.scale.set(
        (1 + wobble * 0.04) * hoverBoost,
        (1 - wobble * 0.05) * hoverBoost,
        (1 + wobble * 0.04) * hoverBoost,
      );
      outer.current.position.y =
        cutProgressRef.current > 0.02 ? 0 : Math.sin(state.clock.elapsedTime * 1.6) * 0.04;
    }
  });

  const bump = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    squish.current = 1;
  };

  return (
    <group
      ref={outer}
      onPointerDown={bump}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* lifted so the stick has somewhere to hang without leaving the stage */}
      <group position={[0, 0.42, 0]} rotation={[0.06, 0, 0]}>
        <group ref={innerA}>
          <LollipopHalfGeometry isLeft />
        </group>
        <group ref={innerB}>
          <LollipopHalfGeometry isLeft={false} />
        </group>
      </group>
    </group>
  );
}
