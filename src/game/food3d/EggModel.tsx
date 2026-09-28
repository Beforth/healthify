import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { buildHalfSolid } from './halfSolid';

const RADIUS = 0.92;

const SHELL_WARM = new THREE.Color('#f6e3c4');
const SHELL_PALE = new THREE.Color('#fffaf0');

/** Egg silhouette: a rounded ovoid, broad at the base and tapering toward the top.
 *  The cut runs down x = 0, so the halves split left/right on screen. */
function deformEgg(p: THREE.Vector3, ny: number) {
  const natural = Math.sqrt(Math.max(1e-4, 1 - ny * ny));
  // Fuller toward the base than the top — that single asymmetry is the whole
  // difference between an egg and a ball.
  const fullness = ny >= 0 ? 1.7 : 2.6;
  const wanted = Math.pow(Math.max(0, 1 - Math.abs(ny) ** fullness), 0.5);
  const k = (wanted / natural) * (1 - 0.07 * ny);

  p.x *= k;
  p.z *= k;

  // a little longer than it is wide, and round the whole way about the axis
  p.y *= 1.3;
}

function eggColor(p: THREE.Vector3, ny: number, target: THREE.Color) {
  const t = THREE.MathUtils.clamp((ny + 1) / 2, 0, 1);

  // pale at the top, warming toward the base, with the faintest mottling
  target.copy(SHELL_PALE).lerp(SHELL_WARM, THREE.MathUtils.smoothstep(t, 0.9, 0.05));

  const speckle = 0.5 + 0.5 * Math.cos(9 * Math.atan2(p.z, p.x) + ny * 6);
  target.lerp(SHELL_WARM, speckle * 0.18);
}

export function EggHalfGeometry({ isLeft = false }: { isLeft?: boolean }) {
  const { skinGeo, cutGeo } = useMemo(
    () => buildHalfSolid(isLeft, RADIUS, deformEgg, eggColor),
    [isLeft],
  );

  const faceSign = isLeft ? -1 : 1;

  return (
    <group>
      <mesh geometry={skinGeo} castShadow receiveShadow>
        {/* a boiled shell is matte and chalky, not glossy like fruit skin */}
        <meshPhysicalMaterial
          vertexColors
          roughness={0.62}
          clearcoat={0.12}
          clearcoatRoughness={0.6}
          envMapIntensity={0.7}
        />
      </mesh>

      {/* flat cut face: thin shell rim, set white, then the yolk sitting in the middle */}
      <group position={[faceSign * 0.004, 0, 0]}>
        {/* rim sits flush with the skin — scaling it up would poke out and show as a
            seam line down the middle while the egg is still whole */}
        <mesh geometry={cutGeo}>
          <meshStandardMaterial color="#e8d3ae" roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={cutGeo} position={[faceSign * 0.008, 0, 0]} scale={[1, 0.965, 0.965]}>
          <meshStandardMaterial color="#fffdf7" roughness={0.68} side={THREE.DoubleSide} />
        </mesh>

        {/* the yolk: a dome rather than a flat disc, so it reads as a half-cut ball */}
        <mesh position={[faceSign * 0.014, -0.02, 0]} scale={[0.16, 1, 1]}>
          <sphereGeometry args={[RADIUS * 0.44, 28, 20]} />
          <meshStandardMaterial color="#f7b32b" roughness={0.58} />
        </mesh>
        <mesh position={[faceSign * 0.03, 0.06, 0.06]} scale={[0.1, 1, 1]}>
          <sphereGeometry args={[RADIUS * 0.19, 20, 14]} />
          <meshStandardMaterial color="#ffd15c" roughness={0.65} />
        </mesh>
      </group>
    </group>
  );
}

export default function EggModel({
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
    const sep = p * 0.58 + kick * 0.34;

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
        (1 + wobble * 0.09) * hoverBoost,
        (1 - wobble * 0.13) * hoverBoost,
        (1 + wobble * 0.09) * hoverBoost,
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
      {/* tipped slightly off upright, the way an egg actually settles */}
      <group rotation={[0.05, 0, 0.16]}>
        <group ref={innerA}>
          <EggHalfGeometry isLeft />
        </group>
        <group ref={innerB}>
          <EggHalfGeometry isLeft={false} />
        </group>
      </group>
    </group>
  );
}
