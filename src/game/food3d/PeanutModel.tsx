import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { sliceAtX, type SlicedHalf } from './sliceMesh';

const MODEL_URL = `${import.meta.env.BASE_URL}models/peanut.glb`;

/** A photoscanned peanut, about 1.0 x 0.43 x 0.46 in its own units, lying with
 *  its length down the z axis. */
const SCALE = 1.55;

/** Sampled off the scan for the shell. The cut face has to be invented — the
 *  scan is only a shell — and a halved peanut is mostly the two pale kernels
 *  meeting down a seam, so that is what the cap draws. */
const KERNEL = '#e6cb92';
const KERNEL_HEART = '#f0dfa9';
const SEAM = '#c09a62';

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
  const { cut, outline } = half;

  const layers = useMemo(
    () => ({
      kernel: cutCap(outline, 0.97),
      heart: cutCap(outline, 0.8),
    }),
    [outline],
  );

  if (!layers.kernel) return null;

  // A peanut splits down two cotyledons, so the flat face carries a dark seam
  // down its middle — thin, so the kernels read as two halves rather than paint.
  const seamHeight = (cut.yMax - cut.yMin) * 0.82;
  const yMid = (cut.yMin + cut.yMax) / 2;
  const zMid = (cut.zMin + cut.zMax) / 2;

  return (
    <group>
      <mesh geometry={layers.kernel} position={[faceSign * 0.004, 0, 0]}>
        <meshStandardMaterial color={KERNEL} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {layers.heart && (
        <mesh geometry={layers.heart} position={[faceSign * 0.006, 0, 0]}>
          <meshStandardMaterial color={KERNEL_HEART} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
      )}

      <group position={[-faceSign * 0.002, yMid, zMid]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[0.05, seamHeight]} />
          <meshStandardMaterial color={SEAM} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

export function PeanutHalfGeometry({ isLeft = false }: { isLeft?: boolean }) {
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
    // The scan lies with its length down z, so a cut at x = 0 would shave a thin
    // sliver off its side. Turn it a quarter so the length runs along x and the
    // cut splits the peanut the way a person would.
    const upright = (source.geometry as THREE.BufferGeometry).clone();
    upright.rotateY(-Math.PI / 2);
    const sliced = sliceAtX(upright, isLeft);
    upright.dispose();
    return sliced;
  }, [source.geometry, isLeft]);

  if (!half) return null;

  return (
    <group>
      <mesh geometry={half.geometry} castShadow receiveShadow>
        <meshStandardMaterial
          map={source.map}
          flatShading
          roughness={0.8}
          envMapIntensity={0.7}
        />
      </mesh>

      <CutFace half={half} faceSign={isLeft ? -1 : 1} />
    </group>
  );
}

export default function PeanutModel({
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
      // peanuts are hard little things: they barely give when pressed
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
      {/* tipped over so the long nut reads as lying on the board */}
      <group rotation={[0.28, 0.35, 0.7]}>
        <group ref={innerA}>
          <PeanutHalfGeometry isLeft />
        </group>
        <group ref={innerB}>
          <PeanutHalfGeometry isLeft={false} />
        </group>
      </group>
    </group>
  );
}