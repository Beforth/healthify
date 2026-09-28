import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { sliceAtX, type SlicedHalf } from './sliceMesh';

const MODEL_URL = `${import.meta.env.BASE_URL}models/soft-drink.glb`;

/** A photoscanned drink can, about 0.52 x 1.0 x 0.53 in its own units, standing
 *  upright with the brand label wrapped around the scan. */
const SCALE = 1.6;

/** Sampled off the scan: bare silver rim. The inside is invented — the scan is
 *  only a shell — and a halved can shows open cola, not aluminium. */
const CAN_WALL = '#b7c0c1';
const COLA = '#4a2a18';
const COLA_DARK = '#3a2110';

useGLTF.preload(MODEL_URL);

function cutCap(outline: { y: number; z: number }[], inset: number): THREE.BufferGeometry | null {
  if (outline.length < 3) return null;

  const cy = outline.reduce((sum, p) => sum + p.y, 0) / outline.length;
  const cz = outline.reduce((sum, p) => sum + p.z, 0) / outline.length;

  const positions: number[] = [];
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i];
    const b = outline[(i + 1) % outline.length];
    positions.push(
      0, cy, cz,
      0, cy + (a.y - cy) * inset, cz + (a.z - cz) * inset,
      0, cy + (b.y - cy) * inset, cz + (b.z - cz) * inset,
    );
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

function CutFace({ half, faceSign }: { half: SlicedHalf; faceSign: number }) {
  const layers = useMemo(
    () => ({
      rim: cutCap(half.outline, 0.99),
      cola: cutCap(half.outline, 0.93),
      deep: cutCap(half.outline, 0.6),
    }),
    [half.outline],
  );

  if (!layers.rim) return null;

  return (
    <group>
      <mesh geometry={layers.rim} position={[faceSign * 0.004, 0, 0]}>
        <meshStandardMaterial color={CAN_WALL} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
      {layers.cola && (
        <mesh geometry={layers.cola} position={[faceSign * 0.006, 0, 0]}>
          <meshStandardMaterial color={COLA} roughness={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}
      {layers.deep && (
        <mesh geometry={layers.deep} position={[faceSign * 0.008, 0, 0]}>
          <meshStandardMaterial color={COLA_DARK} roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

export function SoftDrinkHalfGeometry({ isLeft = false }: { isLeft?: boolean }) {
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

  const half = useMemo(
    () => (source.geometry ? sliceAtX(source.geometry, isLeft) : null),
    [source.geometry, isLeft],
  );

  if (!half) return null;

  return (
    <group>
      <mesh geometry={half.geometry} castShadow receiveShadow>
        <meshStandardMaterial map={source.map} flatShading roughness={0.4} envMapIntensity={0.9} />
      </mesh>

      <CutFace half={half} faceSign={isLeft ? -1 : 1} />
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
    const sep = p * 0.42 + kick * 0.24;

    if (innerA.current) {
      innerA.current.position.x = sep;
      innerA.current.rotation.y = Math.min(sep * 0.5, 0.3);
    }
    if (innerB.current) {
      innerB.current.position.x = -sep;
      innerB.current.rotation.y = -Math.min(sep * 0.5, 0.3);
    }

    squish.current *= Math.exp(-delta * 6);
    if (outer.current) {
      const wobble = Math.sin(state.clock.elapsedTime * 14) * squish.current;
      const hoverBoost = hovered ? 1.05 : 1;
      // a can of soft drink is the hardest thing on the board: tin barely gives
      outer.current.scale.setScalar(SCALE * (1 - wobble * 0.04) * hoverBoost);
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
      {/* standing tall; the tiniest twist so the cylinder's roundness reads */}
      <group rotation={[0.05, 0.3, 0]}>
        <group ref={innerA}>
          <SoftDrinkHalfGeometry isLeft />
        </group>
        <group ref={innerB}>
          <SoftDrinkHalfGeometry isLeft={false} />
        </group>
      </group>
    </group>
  );
}