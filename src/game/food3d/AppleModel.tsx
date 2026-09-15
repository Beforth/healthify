import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { buildHalfSolid } from './halfSolid';

const RADIUS = 1.05;

const SKIN_DEEP = new THREE.Color('#b8122c');
const SKIN_RED = new THREE.Color('#e63127');
const SKIN_GOLD = new THREE.Color('#f5b83d');

/** Apple silhouette: broad shoulders, tapered base, a dimple at the stem and calyx,
 *  and five very soft lobes around the axis. x is thickness (the cut runs down x = 0). */
function deformApple(p: THREE.Vector3, ny: number) {
  // Swap the sphere's cosine profile for a fuller one, then bias it so the fruit
  // carries broad shoulders up top and tapers toward the base.
  const natural = Math.sqrt(Math.max(1e-4, 1 - ny * ny));
  const wanted = Math.pow(Math.max(0, 1 - Math.abs(ny) ** 2.4), 0.46);
  const k = (wanted / natural) * (1 + 0.13 * ny - 0.08 * ny * ny);

  p.x *= k;
  p.z *= k;

  // soft lobing, strongest around the middle
  const lobe = 1 + 0.022 * Math.cos(5 * Math.atan2(p.z, p.x)) * (1 - ny * ny);
  p.x *= lobe;
  p.z *= lobe;

  const axial = Math.hypot(p.x, p.z) / RADIUS;
  const well = Math.exp(-((axial / 0.4) ** 2));

  if (ny > 0.25) p.y -= 0.42 * well * THREE.MathUtils.smoothstep(ny, 0.25, 1);
  if (ny < -0.25) p.y += 0.3 * well * THREE.MathUtils.smoothstep(-ny, 0.25, 1);

  p.y *= 0.95;
}

function appleColor(p: THREE.Vector3, ny: number, target: THREE.Color) {
  const t = THREE.MathUtils.clamp((ny + 1) / 2, 0, 1);

  // deep red up top fading to a golden-green base, with faint vertical striping
  target.copy(SKIN_GOLD).lerp(SKIN_RED, THREE.MathUtils.smoothstep(t, 0.12, 0.62));
  target.lerp(SKIN_DEEP, THREE.MathUtils.smoothstep(t, 0.55, 1) * 0.55);

  const stripe = 0.5 + 0.5 * Math.cos(11 * Math.atan2(p.z, p.x));
  target.lerp(SKIN_DEEP, stripe * 0.16);
}

export function AppleHalfGeometry({
  isLeft = false,
  showStem = false,
}: {
  isLeft?: boolean;
  showStem?: boolean;
}) {
  const { skinGeo, cutGeo } = useMemo(
    () => buildHalfSolid(isLeft, RADIUS, deformApple, appleColor),
    [isLeft],
  );

  const faceSign = isLeft ? -1 : 1;
  const seeds = useMemo(
    () => [
      { y: 0.04, z: -0.13, tilt: 0.55 },
      { y: 0.04, z: 0.13, tilt: -0.55 },
      { y: -0.22, z: 0, tilt: 0 },
    ],
    [],
  );

  return (
    <group>
      <mesh geometry={skinGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          vertexColors
          roughness={0.24}
          clearcoat={0.7}
          clearcoatRoughness={0.2}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* flat cut face: a thin red skin rim, bright flesh, then the core and seeds */}
      <group position={[faceSign * 0.004, 0, 0]}>
        {/* rim sits flush with the skin — scaling it up would poke out and show as a
            seam line down the middle while the fruit is still whole */}
        <mesh geometry={cutGeo}>
          <meshStandardMaterial color="#d42a2a" roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={cutGeo} position={[faceSign * 0.008, 0, 0]} scale={[1, 0.96, 0.96]}>
          <meshStandardMaterial color="#fffaf0" roughness={0.62} side={THREE.DoubleSide} />
        </mesh>

        {/* core outline, a slim upright lens around the seeds */}
        <mesh
          position={[faceSign * 0.016, -0.02, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[0.5, 1, 1]}
        >
          <torusGeometry args={[0.3, 0.011, 6, 30]} />
          <meshStandardMaterial color="#efe0b4" roughness={0.9} />
        </mesh>

        {seeds.map((s, i) => (
          <mesh
            key={i}
            position={[faceSign * 0.018, s.y, s.z]}
            rotation={[s.tilt, 0, 0]}
            scale={[0.6, 1.5, 0.85]}
          >
            <sphereGeometry args={[0.05, 10, 8]} />
            <meshStandardMaterial color="#54331a" roughness={0.45} />
          </mesh>
        ))}
      </group>

      {showStem && (
        <group position={[0, RADIUS * 0.82, 0]}>
          <mesh position={[0, 0.16, 0]} rotation={[0.08, 0, 0.12]}>
            <cylinderGeometry args={[0.024, 0.032, 0.34, 10]} />
            <meshStandardMaterial color="#6b4a2b" roughness={0.85} />
          </mesh>
          <mesh position={[0.11, 0.28, 0.02]} rotation={[0.3, 0.4, -0.5]} scale={[1, 0.35, 1]}>
            <sphereGeometry args={[0.13, 12, 10]} />
            <meshStandardMaterial color="#5ba83c" roughness={0.6} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function AppleModel({
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
    const sep = p * 0.6 + kick * 0.34;

    if (innerA.current) {
      innerA.current.position.x = sep;
      innerA.current.rotation.y = Math.min(sep * 0.7, 0.5);
    }
    if (innerB.current) {
      innerB.current.position.x = -sep;
      innerB.current.rotation.y = -Math.min(sep * 0.7, 0.5);
    }

    squish.current *= Math.exp(-delta * 6);
    if (outer.current) {
      const wobble = Math.sin(state.clock.elapsedTime * 14) * squish.current;
      const hoverBoost = hovered ? 1.05 : 1;
      outer.current.scale.set(
        (1 + wobble * 0.11) * hoverBoost,
        (1 - wobble * 0.15) * hoverBoost,
        (1 + wobble * 0.11) * hoverBoost,
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
      <group rotation={[0.05, 0, 0]}>
        <group ref={innerA}>
          <AppleHalfGeometry isLeft showStem />
        </group>
        <group ref={innerB}>
          <AppleHalfGeometry isLeft={false} />
        </group>
      </group>
    </group>
  );
}
