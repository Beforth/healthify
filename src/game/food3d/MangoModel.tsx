import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { buildHalfSolid } from './halfSolid';

const RADIUS = 0.86;

const SKIN_GOLD = new THREE.Color('#f8c62c');
const SKIN_AMBER = new THREE.Color('#e79a17');

/**
 * Mango silhouette. Axes matter here: x is the width you actually SEE head-on,
 * y is the length, and z is the thickness going away from the camera. Getting
 * those the wrong way round is what made earlier passes read as an egg — all the
 * mango character sat on the hidden axis.
 * The cut still runs down x = 0, so the halves split left/right on screen.
 */
function deformMango(p: THREE.Vector3, ny: number) {
  // Replace the sphere's own cosine profile with a fuller one so the body stays
  // broad for most of its length and only rounds off near the ends.
  const natural = Math.sqrt(Math.max(1e-4, 1 - ny * ny));
  // Different fullness top vs bottom: the base stays broad then rounds off quickly,
  // while the stem end tapers away gradually. That lengthwise asymmetry is what
  // separates a mango from a plain egg — and unlike a sideways bend, it survives
  // the left/right cut.
  const fullness = ny >= 0 ? 2.0 : 2.9;
  const wanted = Math.pow(Math.max(0, 1 - Math.abs(ny) ** fullness), 0.5);
  let k = wanted / natural;

  k *= 1 - 0.13 * ny;
  k *= 1 + 0.06 * Math.exp(-(((ny + 0.2) / 0.55) ** 2));

  p.x *= k;
  p.z *= k;

  // clearly longer than it is wide, and flattened front-to-back
  p.y *= 1.45;
  p.x *= 0.86;
  p.z *= 0.66;
}

function mangoColor(_p: THREE.Vector3, ny: number, target: THREE.Color) {
  // A ripe golden mango reads as one clean colour — just a touch deeper at the base.
  const t = THREE.MathUtils.clamp((ny + 1) / 2, 0, 1);
  target.copy(SKIN_GOLD).lerp(SKIN_AMBER, THREE.MathUtils.smoothstep(t, 0.45, 0) * 0.55);
}

/** A pointed, lance-shaped mango leaf. */
function useLeafGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(0.17, 0.3, 0, 0.66);
    s.quadraticCurveTo(-0.17, 0.3, 0, 0);
    return new THREE.ExtrudeGeometry(s, {
      depth: 0.025,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 2,
    });
  }, []);
}

export function MangoHalfGeometry({
  isLeft = false,
  showStem = false,
}: {
  isLeft?: boolean;
  showStem?: boolean;
}) {
  const { skinGeo, cutGeo } = useMemo(
    () => buildHalfSolid(isLeft, RADIUS, deformMango, mangoColor),
    [isLeft],
  );
  const leafGeo = useLeafGeometry();

  const faceSign = isLeft ? -1 : 1;

  return (
    <group>
      <mesh geometry={skinGeo} castShadow receiveShadow>
        {/* soft, slightly waxy skin — high gloss reads as a balloon, not fruit */}
        <meshPhysicalMaterial
          vertexColors
          roughness={0.46}
          clearcoat={0.3}
          clearcoatRoughness={0.45}
          envMapIntensity={0.85}
        />
      </mesh>

      {/* flat cut face: thin skin rim, juicy flesh, then the big flat fibrous pit */}
      <group position={[faceSign * 0.004, 0, 0]}>
        {/* rim sits flush with the skin — scaling it up would poke out and show as a
            seam line down the middle while the fruit is still whole */}
        <mesh geometry={cutGeo}>
          <meshStandardMaterial color="#e8892a" roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={cutGeo} position={[faceSign * 0.008, 0, 0]} scale={[1, 0.955, 0.955]}>
          <meshStandardMaterial color="#ffc94f" roughness={0.55} side={THREE.DoubleSide} />
        </mesh>

        {/* the big flat pit, a lens lying flush in the cut face */}
        <group position={[faceSign * 0.014, -0.04, 0]}>
          <mesh scale={[0.05, RADIUS * 0.74, RADIUS * 0.38]}>
            <sphereGeometry args={[1, 28, 18]} />
            <meshStandardMaterial color="#f0dca8" roughness={0.9} />
          </mesh>
          {Array.from({ length: 9 }).map((_, i) => {
            const a = (i / 9) * Math.PI * 2;
            const len = RADIUS * 0.34;
            return (
              <mesh
                key={i}
                position={[
                  faceSign * 0.03,
                  Math.sin(a) * len * 0.5,
                  Math.cos(a) * len * 0.5 * 0.62,
                ]}
                rotation={[-a, 0, 0]}
              >
                <boxGeometry args={[0.012, 0.018, len]} />
                <meshStandardMaterial color="#d3b87c" roughness={0.95} />
              </mesh>
            );
          })}
        </group>
      </group>

      {showStem && (
        <group position={[0, RADIUS * 1.42, 0.04]}>
          <mesh position={[0, 0.07, 0]} rotation={[0, 0, 0.12]}>
            <cylinderGeometry args={[0.024, 0.032, 0.16, 10]} />
            <meshStandardMaterial color="#4f7a2a" roughness={0.8} />
          </mesh>

          {/* two lance-shaped leaves, swept out sideways so they clear both the
              fruit's own silhouette and the resting knife */}
          <group position={[0, 0.14, 0]} rotation={[0, 0, 0.5]}>
            <mesh
              geometry={leafGeo}
              position={[-0.05, 0.0, 0.02]}
              rotation={[0.18, -0.4, 1.05]}
              scale={[1.15, 1.35, 1]}
            >
              <meshStandardMaterial color="#2f6b32" roughness={0.62} side={THREE.DoubleSide} />
            </mesh>
            <mesh
              geometry={leafGeo}
              position={[-0.02, 0.06, -0.05]}
              rotation={[-0.14, 0.45, 0.42]}
              scale={[1.02, 1.18, 1]}
            >
              <meshStandardMaterial color="#3a7d3a" roughness={0.62} side={THREE.DoubleSide} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}

export default function MangoModel({
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
    const sep = p * 0.62 + kick * 0.34;

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
        (1 + wobble * 0.1) * hoverBoost,
        (1 - wobble * 0.14) * hoverBoost,
        (1 + wobble * 0.1) * hoverBoost,
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
      <group rotation={[0.05, 0, 0.62]}>
        <group ref={innerA}>
          <MangoHalfGeometry isLeft showStem />
        </group>
        <group ref={innerB}>
          <MangoHalfGeometry isLeft={false} />
        </group>
      </group>
    </group>
  );
}
