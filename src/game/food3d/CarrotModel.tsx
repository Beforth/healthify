import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { buildHalfSolid } from './halfSolid';

const RADIUS = 0.82;

const SKIN_DEEP = new THREE.Color('#c9560c');
const SKIN_ORANGE = new THREE.Color('#f0791a');
const SKIN_LIGHT = new THREE.Color('#ff9f43');

/** Carrot silhouette: a long cone, widest at the crown and tapering to a point,
 *  with the shoulder rounded off on top. The cut runs down x = 0. */
function deformCarrot(p: THREE.Vector3, ny: number) {
  const natural = Math.sqrt(Math.max(1e-4, 1 - ny * ny));
  // 0 at the tip, 1 at the crown
  const t = THREE.MathUtils.clamp((ny + 1) / 2, 0, 1);

  // A near-linear taper is what makes it a root rather than a fruit; the
  // exponent keeps a touch of belly so it doesn't look machined.
  const taper = Math.pow(t, 0.44);
  // round the very top over instead of leaving a flat-cut cylinder
  const shoulder = Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, (t - 0.88) / 0.12), 2)));
  const k = (taper * shoulder) / natural;

  p.x *= k * 0.56;
  p.z *= k * 0.56;
  p.y *= 1.55;

  // a slight lean toward the tip, so it reads as something grown, not turned on a lathe
  p.z += 0.14 * (1 - t) * (1 - t);
}

function carrotColor(_p: THREE.Vector3, ny: number, target: THREE.Color) {
  const t = THREE.MathUtils.clamp((ny + 1) / 2, 0, 1);

  // deeper at the tip, brighter toward the crown
  target.copy(SKIN_DEEP).lerp(SKIN_ORANGE, THREE.MathUtils.smoothstep(t, 0.05, 0.6));
  target.lerp(SKIN_LIGHT, THREE.MathUtils.smoothstep(t, 0.55, 1) * 0.55);

  // faint horizontal banding, the marks a carrot carries where rootlets grew
  const band = 0.5 + 0.5 * Math.cos(ny * 34);
  target.lerp(SKIN_DEEP, band * 0.14);
}

/** Feathery carrot tops, built from a few tapered blades. */
function CarrotTops() {
  const blades = useMemo(
    () => [
      { rot: [0.24, 0.0, -0.36] as const, scale: 1.0 },
      { rot: [-0.18, 0.7, 0.3] as const, scale: 0.86 },
      { rot: [0.32, -0.8, 0.12] as const, scale: 0.92 },
      { rot: [-0.1, 2.1, -0.16] as const, scale: 0.8 },
    ],
    [],
  );

  return (
    <group position={[0, RADIUS * 1.6, 0]}>
      {/* the pale collar the greens sprout from */}
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.1, 0.13, 0.08, 14]} />
        <meshStandardMaterial color="#d8e8a8" roughness={0.8} />
      </mesh>

      {blades.map((b, i) => (
        <group key={i} rotation={b.rot} scale={b.scale}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.012, 0.03, 0.4, 8]} />
            <meshStandardMaterial color="#3f8f36" roughness={0.75} />
          </mesh>
          {/* three little leaflets fanned off the top of each stalk */}
          {[-0.5, 0, 0.5].map((tilt, j) => (
            <mesh
              key={j}
              position={[Math.sin(tilt) * 0.12, 0.44, Math.cos(tilt) * 0.04]}
              rotation={[0.2, 0, tilt]}
              scale={[1, 1.5, 0.35]}
            >
              <sphereGeometry args={[0.1, 10, 8]} />
              <meshStandardMaterial color="#4faa41" roughness={0.68} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function CarrotHalfGeometry({
  isLeft = false,
  showTops = false,
}: {
  isLeft?: boolean;
  showTops?: boolean;
}) {
  const { skinGeo, cutGeo } = useMemo(
    () => buildHalfSolid(isLeft, RADIUS, deformCarrot, carrotColor),
    [isLeft],
  );

  const faceSign = isLeft ? -1 : 1;
  // the growth rings a carrot shows once it is sliced open
  const rings = useMemo(() => [0.62, 0.2, -0.24, -0.66], []);

  return (
    <group>
      <mesh geometry={skinGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          vertexColors
          roughness={0.42}
          clearcoat={0.3}
          clearcoatRoughness={0.4}
          envMapIntensity={0.9}
        />
      </mesh>

      {/* flat cut face: thin skin rim, bright flesh, then the pale core down the middle */}
      <group position={[faceSign * 0.004, 0, 0]}>
        {/* rim sits flush with the skin — scaling it up would poke out and show as a
            seam line down the middle while the carrot is still whole */}
        <mesh geometry={cutGeo}>
          <meshStandardMaterial color="#d15c0c" roughness={0.55} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={cutGeo} position={[faceSign * 0.008, 0, 0]} scale={[1, 0.97, 0.9]}>
          <meshStandardMaterial color="#ffa74f" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>

        {/* the core: a pale strip running the length of the root */}
        <mesh geometry={cutGeo} position={[faceSign * 0.014, -0.02, 0]} scale={[1, 0.9, 0.34]}>
          <meshStandardMaterial color="#ffc978" roughness={0.7} side={THREE.DoubleSide} />
        </mesh>

        {rings.map((y, i) => (
          <mesh key={i} position={[faceSign * 0.02, y, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.006, 0.006, 0.34 * (1 - Math.abs(y) * 0.6), 6]} />
            <meshStandardMaterial color="#e07a1c" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {showTops && <CarrotTops />}
    </group>
  );
}

export default function CarrotModel({
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
    // The halves part along the carrot's own tilted axis, so every bit of
    // separation also costs height on screen — kept modest so a bigger carrot
    // still clears the canvas edge once it is open.
    const sep = p * 0.42 + kick * 0.28;

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
        (1 + wobble * 0.08) * hoverBoost,
        (1 - wobble * 0.12) * hoverBoost,
        (1 + wobble * 0.08) * hoverBoost,
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
      {/* laid over at an angle so a long root still fits the same framing as the
          rounder foods, and the greens stay clear of the resting knife; lifted
          a touch so the tip does not run off the bottom of the stage */}
      <group position={[0, 0.12, 0]} rotation={[0.05, 0, 0.78]}>
        <group ref={innerA}>
          <CarrotHalfGeometry isLeft showTops />
        </group>
        <group ref={innerB}>
          <CarrotHalfGeometry isLeft={false} />
        </group>
      </group>
    </group>
  );
}
