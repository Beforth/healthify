import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';

/** A hand-built burger, layered the way BurgerIcon draws it: a domed bun over
 *  lettuce, cheese and a thick patty, sitting on the base of the bun. Every
 *  layer is an open-ended half-cylinder sharing the x = 0 plane, so each one
 *  presents a clean flat face once cut; the top bun is capped by the top half
 *  of a sphere. The scale lives in JSX (not only in useFrame) so FitScale can
 *  measure it and fit it to the food's own target size. */
const SCALE = 1.1;

const BUN = '#d9913a';
const BUN_TOP = '#e8b26a';
const BUN_CRUMB = '#f2d9a6';
const PATTY = '#7b4526';
const CHEESE = '#ffc93c';
const LETTUCE = '#5cb85c';
const SESAME = '#fff3d8';
const SEAM = '#a45c24';

/** Shared layout, bottom up. The cross-section screen reuses these numbers so
 *  its markers land on exactly the bands the cut screen shows. */
export const BURGER_LAYERS = [
  { id: 'bottom-bun', r: 1.0, y0: -0.52, y1: -0.18, color: BUN, roughness: 0.85 },
  { id: 'patty', r: 0.95, y0: -0.18, y1: 0.12, color: PATTY, roughness: 0.95 },
  { id: 'cheese', r: 1.06, y0: 0.12, y1: 0.22, color: CHEESE, roughness: 0.6 },
  { id: 'lettuce', r: 1.0, y0: 0.22, y1: 0.34, color: LETTUCE, roughness: 0.8 },
  { id: 'top-bun', r: 1.06, y0: 0.34, y1: 0.54, color: BUN_TOP, roughness: 0.9 },
];
export const BURGER_DOME = { r: 1.06, base: 0.54, top: 1.6 };
export const BURGER_BOTTOM = -0.52;

type BurgerLayer = (typeof BURGER_LAYERS)[number];

/** A half-cylinder shell for one layer, sitting on the isLeft-chosen side of
 *  the x = 0 plane. Open-ended so the cut face is its own flat opening. */
function HalfCylinder({ layer, dir }: { layer: BurgerLayer; dir: 1 | -1 }) {
  const mid = (layer.y0 + layer.y1) / 2;
  const height = layer.y1 - layer.y0;
  return (
    <mesh position={[0, mid, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[layer.r, layer.r, height, 40, 1, true, dir === 1 ? 0 : Math.PI, Math.PI]} />
      <meshStandardMaterial color={layer.color} roughness={layer.roughness} />
    </mesh>
  );
}

/** The top half of the bun: the upper half of a sphere over the top bun ring. */
function HalfDome({ dir }: { dir: 1 | -1 }) {
  return (
    <mesh position={[0, BURGER_DOME.base, 0]} castShadow receiveShadow>
      <sphereGeometry args={[BURGER_DOME.r, 40, 20, dir === 1 ? 0 : Math.PI, Math.PI, 0, Math.PI / 2]} />
      <meshStandardMaterial color={BUN_TOP} roughness={0.85} />
    </mesh>
  );
}

/** The underside of the whole burger — a half disc lying flat under the base. */
function BottomCap({ dir }: { dir: 1 | -1 }) {
  return (
    <mesh position={[0, BURGER_BOTTOM, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.0, 40, dir === 1 ? -Math.PI / 2 : Math.PI / 2, Math.PI]} />
      <meshStandardMaterial color={BUN} roughness={0.85} side={THREE.DoubleSide} />
    </mesh>
  );
}

/** A few flat seeds dotted over the dome, echoing the bun in BurgerIcon. */
function SesameSeeds({ dir }: { dir: 1 | -1 }) {
  const spots = useMemo(
    () => [
      [0.55, 1.21, 0.62],
      [0.7, 0.98, 0.05],
      [0.38, 1.43, 0.06],
      [0.62, 1.07, -0.4],
    ],
    [],
  );
  return (
    <group>
      {spots.map(([x, y, z], i) => (
        <mesh
          key={i}
          position={[dir * x, y, z]}
          rotation={[0, 0.5 + i, 0.3 - i * 0.2]}
          scale={[0.16, 0.09, 0.2]}
        >
          <sphereGeometry args={[0.22, 12, 10]} />
          <meshStandardMaterial color={SESAME} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** The flat face left behind by the cut, painted in horizontal bands —
 *  one per layer, with the dome a semicircle on top. A sliced burger shows its
 *  crumb, its greens, its cheese and its patty, which is exactly what these draw. */
function domeCapGeometry(radius: number, segments: number, centerY: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const pts: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / segments;
    pts.push([centerY + Math.cos(a) * radius, Math.sin(a) * radius]);
  }
  for (let i = 0; i < segments; i++) {
    positions.push(0, centerY, 0);
    positions.push(0, pts[i][0], pts[i][1]);
    positions.push(0, pts[i + 1][0], pts[i + 1][1]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

function CutFace({ faceSign }: { faceSign: 1 | -1 }) {
  const domeCap = useMemo(() => domeCapGeometry(BURGER_DOME.r, 48, BURGER_DOME.base), []);

  return (
    <group position={[faceSign * 0.006, 0, 0]}>
      {BURGER_LAYERS.map((layer, i) => {
        const mid = (layer.y0 + layer.y1) / 2;
        const height = layer.y1 - layer.y0;
        const prev = BURGER_LAYERS[i - 1];
        return (
          <group key={layer.id}>
            <mesh position={[0, mid, 0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[layer.r * 2, height]} />
              <meshStandardMaterial
                color={layer.id === 'top-bun' ? BUN_CRUMB : layer.color}
                roughness={0.9}
                side={THREE.DoubleSide}
              />
            </mesh>
            {prev && (
              <mesh position={[faceSign * 0.0012, layer.y0, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[Math.min(layer.r, prev.r) * 2, 0.024]} />
                <meshStandardMaterial color={SEAM} roughness={1} side={THREE.DoubleSide} />
              </mesh>
            )}
          </group>
        );
      })}

      <mesh geometry={domeCap}>
        <meshStandardMaterial color={BUN_CRUMB} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function BurgerHalfGeometry({ isLeft = false }: { isLeft?: boolean }) {
  const dir: 1 | -1 = isLeft ? 1 : -1;
  const faceSign: 1 | -1 = isLeft ? -1 : 1;

  return (
    <group>
      {BURGER_LAYERS.map((layer) => (
        <HalfCylinder key={layer.id} layer={layer} dir={dir} />
      ))}
      <HalfDome dir={dir} />
      <BottomCap dir={dir} />
      <SesameSeeds dir={dir} />
      <CutFace faceSign={faceSign} />
    </group>
  );
}

export default function BurgerModel({
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
    const sep = p * 0.5 + kick * 0.3;

    if (innerA.current) {
      innerA.current.position.x = sep;
      innerA.current.rotation.y = Math.min(sep * 0.8, 0.45);
    }
    if (innerB.current) {
      innerB.current.position.x = -sep;
      innerB.current.rotation.y = -Math.min(sep * 0.8, 0.45);
    }

    squish.current *= Math.exp(-delta * 6);
    if (outer.current) {
      const wobble = Math.sin(state.clock.elapsedTime * 14) * squish.current;
      const hoverBoost = hovered ? 1.05 : 1;
      // a burger is soft: it gives a little when you press, like the fruit
      outer.current.scale.setScalar(SCALE * (1 - wobble * 0.06) * hoverBoost);
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
      scale={SCALE}
      onPointerDown={bump}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* tipped up off the board so the domed top and the cut edge both read */}
      <group rotation={[0.4, 0.25, 0]}>
        <group ref={innerA}>
          <BurgerHalfGeometry isLeft />
        </group>
        <group ref={innerB}>
          <BurgerHalfGeometry isLeft={false} />
        </group>
      </group>
    </group>
  );
}