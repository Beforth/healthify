import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';

const R = 1.1; // main ring radius
const TUBE = 0.42; // tube radius (thickness of the donut dough)
const HALF_ARC = Math.PI;

// The glaze is its own, slightly larger tube, flattened and lifted so it coats
// roughly the top half of the dough and leaves the rest exposed underneath —
// like a real dipped donut rather than a fully-coated candy shell.
/** Sits the donut down on the cutting board now that it lies flat. */
const REST_Y = -0.2;

const TUBE_GLAZE = TUBE * 1.07;
const GLAZE_SQUASH = 0.54;
const GLAZE_LIFT = TUBE * 0.575;

const SPRINKLE_COLORS = ['#ff5a7a', '#ffd166', '#4dd6ff', '#8bd450', '#ffffff', '#c084fc'];

// Three.js TorusGeometry: ring lies in the XY plane, arc sweeps around Z starting at angle 0 (+X axis).
function torusPoint(u: number, v: number, tube: number = TUBE) {
  const x = (R + tube * Math.cos(v)) * Math.cos(u);
  const y = (R + tube * Math.cos(v)) * Math.sin(u);
  const z = tube * Math.sin(v);
  return new THREE.Vector3(x, y, z);
}

/** A point on the glaze's own (flattened + lifted) coating surface. */
function glazePoint(u: number, v: number) {
  const p = torusPoint(u, v, TUBE_GLAZE);
  p.z = p.z * GLAZE_SQUASH + GLAZE_LIFT;
  return p;
}

function useSprinkles(count: number) {
  return useMemo(() => {
    const items: { pos: THREE.Vector3; color: string; rot: number; len: number; tilt: number }[] = [];
    const shuffled = [...SPRINKLE_COLORS];
    for (let i = 0; i < count; i++) {
      const u = Math.random() * HALF_ARC;
      const v = Math.PI / 2 + (Math.random() - 0.5) * 1.3; // across the glazed top of the tube
      const base = glazePoint(u, v);
      const outward = new THREE.Vector3(Math.cos(u), Math.sin(u), Math.sin(v) * 0.5).normalize();
      const pos = base.clone().add(outward.multiplyScalar(0.03));
      const color = shuffled[Math.floor(Math.random() * shuffled.length)];
      items.push({ pos, color, rot: Math.random() * Math.PI * 2, len: 0.06 + Math.random() * 0.045, tilt: (Math.random() - 0.5) * 0.7 });
    }
    return items;
  }, [count]);
}

/** One half-ring of the donut, spanning local angle [0, PI]. Its two open ends
 * (at u=0 and u=PI) both lie in the local XZ plane with a normal along Y —
 * a plain circle rotated -90 deg about X caps each one. */
function useDrips(count: number) {
  return useMemo(() => {
    const items: { pos: THREE.Vector3; len: number }[] = [];
    for (let i = 0; i < count; i++) {
      const u = 0.15 + (i / count) * (HALF_ARC - 0.3);
      const v = -Math.PI / 2 + (Math.random() - 0.5) * 0.4; // the glaze's lower, dripping edge
      const base = glazePoint(u, v);
      items.push({ pos: base, len: 0.09 + Math.random() * 0.1 });
    }
    return items;
  }, [count]);
}

export function DonutHalfGeometry() {
  const sprinkles = useSprinkles(22);
  const drips = useDrips(5);

  return (
    <group>
      {/* fried dough base — exposed on the sides and underside */}
      <mesh castShadow receiveShadow>
        <torusGeometry args={[R, TUBE, 24, 72, HALF_ARC]} />
        <meshStandardMaterial color="#e8b978" roughness={0.8} />
      </mesh>

      {/* glaze coating — its own flattened, lifted tube so it only covers the top */}
      <mesh castShadow receiveShadow scale={[1, 1, GLAZE_SQUASH]} position={[0, 0, GLAZE_LIFT]}>
        <torusGeometry args={[R, TUBE_GLAZE, 24, 72, HALF_ARC]} />
        <meshPhysicalMaterial
          color="#ff8fb3"
          roughness={0.16}
          metalness={0.04}
          clearcoat={1}
          clearcoatRoughness={0.12}
          envMapIntensity={1.1}
        />
      </mesh>

      {/* icing drips hanging off the glaze's dripping edge */}
      {drips.map((d, i) => (
        <mesh key={i} position={[d.pos.x, d.pos.y, d.pos.z - d.len / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.045, d.len, 3, 6]} />
          <meshPhysicalMaterial color="#ff8fb3" roughness={0.16} clearcoat={1} clearcoatRoughness={0.12} />
        </mesh>
      ))}

      {[0, HALF_ARC].map((u) => (
        <group key={u} position={[R * Math.cos(u), R * Math.sin(u), 0]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <circleGeometry args={[TUBE, 32]} />
            <meshStandardMaterial color="#f4d9a8" roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0, 0.002]}>
            <ringGeometry args={[TUBE * 0.75, TUBE * 0.95, 32]} />
            <meshPhysicalMaterial color="#ff8fb3" roughness={0.4} clearcoat={0.5} side={THREE.DoubleSide} />
          </mesh>
          {/* a few air pockets baked into the dough, visible at the cut face */}
          {[
            [0.12, 0.1, 0.05],
            [-0.15, -0.05, 0.04],
            [0.02, -0.18, 0.045],
          ].map(([x, y, r], i) => (
            <mesh key={i} position={[x, y, 0.003]}>
              <circleGeometry args={[r, 12]} />
              <meshStandardMaterial color="#ffe9c7" side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      ))}

      {sprinkles.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={[s.tilt, 0, s.rot]}>
          <capsuleGeometry args={[0.019, s.len, 2, 6]} />
          <meshPhysicalMaterial color={s.color} roughness={0.25} clearcoat={0.7} />
        </mesh>
      ))}
    </group>
  );
}

export default function DonutModel({
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
    const sep = p * 0.75 + kick * 0.42;
    if (innerA.current) {
      innerA.current.position.set(-sep * 1.05, -sep * 0.1, Math.min(sep * 0.28, 0.2));
      innerA.current.rotation.set(
        Math.min(sep * 0.22, 0.16),
        -Math.min(sep * 0.45, 0.35),
        Math.PI / 2 - Math.min(sep * 0.32, 0.24)
      );
    }
    if (innerB.current) {
      innerB.current.position.set(sep * 1.05, -sep * 0.1, Math.min(sep * 0.28, 0.2));
      innerB.current.rotation.set(
        Math.min(sep * 0.22, 0.16),
        Math.min(sep * 0.45, 0.35),
        -Math.PI / 2 + Math.min(sep * 0.32, 0.24)
      );
    }

    // tap-to-squish jelly wobble, decays back to normal
    squish.current *= Math.exp(-delta * 6);
    if (outer.current) {
      const wobble = Math.sin(state.clock.elapsedTime * 14) * squish.current;
      const hoverBoost = hovered ? 1.06 : 1;
      outer.current.scale.set(
        (1 + wobble * 0.12) * hoverBoost,
        (1 - wobble * 0.18) * hoverBoost,
        (1 + wobble * 0.12) * hoverBoost,
      );
      // lying flat it is far shorter than it was on edge, so drop it onto the board
      const bob = cutProgressRef.current > 0.02 ? 0 : Math.sin(state.clock.elapsedTime * 1.6) * 0.04;
      outer.current.position.y = REST_Y + bob;
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
      {/* A torus is born standing on its edge (its axis points at the camera), so it
          needs roughly -90° about X to lie flat. Stopping a little short of that
          tips it toward the viewer for a 3/4 "donut on a plate" look. Rotating about
          X leaves the X axis alone, so the halves still separate left/right. */}
      <group rotation={[-1.02, 0, 0]}>
        <group ref={innerA} rotation={[0, 0, Math.PI / 2]}>
          <DonutHalfGeometry />
        </group>
        <group ref={innerB} rotation={[0, 0, -Math.PI / 2]}>
          <DonutHalfGeometry />
        </group>
      </group>
    </group>
  );
}
