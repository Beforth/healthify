import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { sliceAtX, type SlicedHalf } from './sliceMesh';

const MODEL_URL = `${import.meta.env.BASE_URL}models/poptao-chip.glb`;

/** A photoscanned wavy potato crisp, about 0.87 x 1.0 x 0.23 in its own units.
 *  It arrives standing on edge; the whole sheet is turned flat so the crisp
 *  reads lying on the board, and the thin edge is what gets cut. */
const SCALE = 1.6;

/** Sampled off the scan: a golden fried crust. The cut face has to be invented —
 *  the scan is only a shell — and a snapped crisp is a pale, dry crumb inside. */
const CRISP_EDGE = '#d9a94f';
const CRISP_INNER = '#f2d28f';

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
      edge: cutCap(half.outline, 0.99),
      inner: cutCap(half.outline, 0.8),
    }),
    [half.outline],
  );

  if (!layers.edge) return null;

  return (
    <group>
      <mesh geometry={layers.edge} position={[faceSign * 0.004, 0, 0]}>
        <meshStandardMaterial color={CRISP_EDGE} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {layers.inner && (
        <mesh geometry={layers.inner} position={[faceSign * 0.006, 0, 0]}>
          <meshStandardMaterial color={CRISP_INNER} roughness={0.75} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

export function PotatoChipHalfGeometry({ isLeft = false }: { isLeft?: boolean }) {
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

  const half = useMemo(() => {
    if (!source.geometry) return null;
    // The scan arrives upright with its thin dimension along z. Lay it flat the
    // way a crisp really sits — thickness up — so the cut at x = 0 snaps it
    // across its width like a biscuit.
    const flat = (source.geometry as THREE.BufferGeometry).clone();
    flat.rotateX(Math.PI / 2);
    const sliced = sliceAtX(flat, isLeft);
    flat.dispose();
    return sliced;
  }, [source.geometry, isLeft]);

  if (!half) return null;

  return (
    <group>
      <mesh geometry={half.geometry} castShadow receiveShadow>
        <meshStandardMaterial
          map={source.map}
          flatShading
          roughness={0.5}
          side={THREE.DoubleSide}
          envMapIntensity={0.8}
        />
      </mesh>

      <CutFace half={half} faceSign={isLeft ? -1 : 1} />
    </group>
  );
}

export default function PotatoChipModel({
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
      innerA.current.rotation.y = Math.min(sep * 0.9, 0.5);
    }
    if (innerB.current) {
      innerB.current.position.x = -sep;
      innerB.current.rotation.y = -Math.min(sep * 0.9, 0.5);
    }

    squish.current *= Math.exp(-delta * 6);
    if (outer.current) {
      const wobble = Math.sin(state.clock.elapsedTime * 14) * squish.current;
      const hoverBoost = hovered ? 1.05 : 1;
      // a crisp is the same brittle thing a biscuit is, so it gives almost not at all
      outer.current.scale.setScalar(SCALE * (1 - wobble * 0.05) * hoverBoost);
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
      {/* tipped up off the board so both the wavy top and the broken edge read */}
      <group rotation={[0.42, 0.2, 0]}>
        <group ref={innerA}>
          <PotatoChipHalfGeometry isLeft />
        </group>
        <group ref={innerB}>
          <PotatoChipHalfGeometry isLeft={false} />
        </group>
      </group>
    </group>
  );
}