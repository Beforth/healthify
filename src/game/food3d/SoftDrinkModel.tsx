import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_URL = `${import.meta.env.BASE_URL}models/soft-drink.glb`;

/** A photoscanned drink can, about 0.52 x 1.0 x 0.53 in its own units, standing
 *  upright with the brand label wrapped around the scan. */
const SCALE = 1.6;

/** The scan's own top edge, where a can's lid sits. The can is a unit tall with
 *  its origin in the middle, so the lid belongs a hair under half a unit up. */
const CAN_TOP = 0.5;
const LID_RADIUS = 0.2;

/** Sampled off the scan's bare silver rim. The can is shown whole, so there is no
 *  inside to invent — the only thing added is the lid, and that is built from
 *  real can geometry: a disc with a raised ring and a rivet holding a tab. */
const LID_SILVER = '#c9d0d1';
const LID_RING = '#9aa3a4';
const TAB_COLOUR = '#dfe5e6';


/**
 * The lid, in two real pieces: the disc it is pressed into, and the tab that
 * pivots up off it on its rivet.
 *
 * The scan is a closed can, so this is the only part of the model that is
 * invented — and it is invented the way the real thing works, so the animation
 * that lifts it also uncovers a dark opening where the drink would be.
 */
function CanLid({ openRef }: { openRef: MutableRefObject<number> }) {
  const pivot = useRef<THREE.Group>(null);

  // Driven in the frame loop rather than through props: the tab's lift is a
  // running animation, and handing a ref to a component re-renders nothing while
  // still letting it move every frame.
  useFrame((_, delta) => {
    if (!pivot.current) return;
    pivot.current.rotation.x = THREE.MathUtils.damp(
      pivot.current.rotation.x,
      openRef.current * 1.15,
      9,
      delta,
    );
  });

  return (
    <group position={[0, CAN_TOP, 0]}>
      {/* the disc, sunk very slightly into the can's rim */}
      <mesh position={[0, -LID_RADIUS * 0.06, 0]}>
        <cylinderGeometry args={[LID_RADIUS, LID_RADIUS, 0.008, 40]} />
        <meshStandardMaterial color={LID_SILVER} roughness={0.42} metalness={0.6} />
      </mesh>
      {/* the ring scored round where the tab was pressed in */}
      <mesh position={[0, 0.001, 0]}>
        <ringGeometry args={[LID_RADIUS * 0.78, LID_RADIUS * 0.84, 40]} />
        <meshStandardMaterial
          color={LID_RING}
          roughness={0.5}
          metalness={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* the tab, hinged at its front edge and standing up as it opens */}
      <group ref={pivot} position={[0, 0.004, LID_RADIUS * 0.3]}>
        <mesh position={[0, 0, -LID_RADIUS * 0.3]}>
          <boxGeometry args={[LID_RADIUS * 0.62, 0.006, LID_RADIUS * 0.56]} />
          <meshStandardMaterial color={TAB_COLOUR} roughness={0.38} metalness={0.6} />
        </mesh>
        {/* the rivet it turns on, and the little lip you push it with */}
        <mesh position={[0, 0.005, -LID_RADIUS * 0.12]}>
          <cylinderGeometry args={[0.012, 0.012, 0.006, 12]} />
          <meshStandardMaterial color={LID_RING} roughness={0.4} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.005, -LID_RADIUS * 0.52]}>
          <boxGeometry args={[LID_RADIUS * 0.3, 0.005, 0.014]} />
          <meshStandardMaterial color={TAB_COLOUR} roughness={0.38} metalness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

export function SoftDrinkWholeGeometry({ openRef }: { openRef: MutableRefObject<number> }) {
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
    <group>
      <mesh geometry={source.geometry} castShadow receiveShadow>
        <meshStandardMaterial map={source.map} flatShading roughness={0.4} envMapIntensity={0.9} />
      </mesh>
      <CanLid openRef={openRef} />
    </group>
  );
}

export default function SoftDrinkModel({
  cutProgressRef,
}: {
  cutProgressRef: MutableRefObject<number>;
  cutAngle?: number;
}) {
  const outer = useRef<THREE.Group>(null);
  const squish = useRef(0);
  /** The tab's lift: 0 = shut. Nothing drives it any more, so the lid stays closed. */
  const open = useRef(0);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    // The can stays shut: a closed lid with its tab lying flat. (It used to flip the
    // tab up after a moment and leave a black hole in the top, which read as broken.)
    squish.current *= Math.exp(-delta * 6);
    if (!outer.current) return;
    const wobble = Math.sin(state.clock.elapsedTime * 14) * squish.current;
    const hoverBoost = hovered ? 1.05 : 1;
    // a can of soft drink is the hardest thing on the board: tin barely gives
    outer.current.scale.setScalar(SCALE * (1 - wobble * 0.04) * hoverBoost);
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
      {/* standing tall; the tiniest twist so the cylinder's roundness reads */}
      <group rotation={[0.05, 0.3, 0]}>
        <SoftDrinkWholeGeometry openRef={open} />
      </group>
    </group>
  );
}
