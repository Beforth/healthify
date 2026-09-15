import { useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';

const HALF_WIDTH = 0.7;
const HEIGHT = 0.32;
const DEPTH = 1.0;
const SQUARES = 3;

export function ChocolateHalf() {
  const squareDepth = DEPTH / SQUARES;
  const squareWidth = HALF_WIDTH - 0.1;
  const gap = 0.045;

  return (
    <group>
      {/* base slab, gently rounded edges like a real moulded bar */}
      <RoundedBox
        args={[HALF_WIDTH, HEIGHT, DEPTH]}
        radius={0.025}
        smoothness={3}
        castShadow
        receiveShadow
        position={[-HALF_WIDTH / 2, 0, 0]}
      >
        <meshPhysicalMaterial color="#4a2a18" roughness={0.4} clearcoat={0.5} clearcoatRoughness={0.3} />
      </RoundedBox>

      {/* raised, individually-moulded squares on top, like a real chocolate bar */}
      {Array.from({ length: SQUARES }).map((_, i) => {
        const z = -DEPTH / 2 + squareDepth * (i + 0.5);
        return (
          <RoundedBox
            key={i}
            args={[squareWidth, 0.07, squareDepth - gap]}
            radius={0.014}
            smoothness={2}
            castShadow
            receiveShadow
            position={[-HALF_WIDTH / 2, HEIGHT / 2 + 0.035, z]}
          >
            <meshPhysicalMaterial
              color="#5c331d"
              roughness={0.35}
              clearcoat={0.7}
              clearcoatRoughness={0.2}
            />
          </RoundedBox>
        );
      })}

      {/* pressed "snap line" grooves between squares, like a real moulded bar */}
      {Array.from({ length: SQUARES - 1 }).map((_, i) => {
        const z = -DEPTH / 2 + squareDepth * (i + 1);
        return (
          <mesh key={i} position={[-HALF_WIDTH / 2, HEIGHT / 2 + 0.032, z]}>
            <boxGeometry args={[squareWidth * 0.94, 0.014, 0.02]} />
            <meshStandardMaterial color="#2f1a10" roughness={0.7} />
          </mesh>
        );
      })}

      {/* subtle glossy highlight streak */}
      <mesh position={[-HALF_WIDTH / 2, HEIGHT / 2 + 0.076, -DEPTH * 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[squareWidth * 0.5, DEPTH * 0.7]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.08} roughness={0.1} />
      </mesh>

      {/* a sliver of foil wrapper peeking out from underneath, like it's freshly unwrapped */}
      <mesh position={[-HALF_WIDTH / 2, -HEIGHT / 2 - 0.015, DEPTH / 2 + 0.03]}>
        <boxGeometry args={[HALF_WIDTH + 0.04, 0.03, 0.08]} />
        <meshStandardMaterial color="#d8d8dc" roughness={0.25} metalness={0.6} />
      </mesh>
    </group>
  );
}

export default function ChocolateBarModel({
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
    const sep = p * 0.7 + kick * 0.4;
    if (innerA.current) {
      innerA.current.position.set(-sep * 1.05, -sep * 0.1, Math.min(sep * 0.24, 0.18));
      innerA.current.rotation.set(
        Math.min(sep * 0.14, 0.1),
        Math.min(sep * 0.38, 0.28),
        Math.min(sep * 0.26, 0.2)
      );
    }
    if (innerB.current) {
      innerB.current.position.set(sep * 1.05, -sep * 0.1, Math.min(sep * 0.24, 0.18));
      innerB.current.rotation.set(
        Math.min(sep * 0.14, 0.1),
        Math.PI - Math.min(sep * 0.38, 0.28),
        -Math.min(sep * 0.26, 0.2)
      );
    }

    squish.current *= Math.exp(-delta * 6);
    if (outer.current) {
      const wobble = Math.sin(state.clock.elapsedTime * 14) * squish.current;
      const hoverBoost = hovered ? 1.06 : 1;
      outer.current.scale.set(
        (1 + wobble * 0.1) * hoverBoost,
        (1 - wobble * 0.15) * hoverBoost,
        (1 + wobble * 0.1) * hoverBoost,
      );
      outer.current.position.y = cutProgressRef.current > 0.02 ? 0 : Math.sin(state.clock.elapsedTime * 1.6) * 0.04;
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
      <group rotation={[0.35, 0.25, 0]}>
        <group ref={innerA}>
          <ChocolateHalf />
        </group>
        <group ref={innerB} rotation={[0, Math.PI, 0]}>
          <ChocolateHalf />
        </group>
      </group>
    </group>
  );
}
