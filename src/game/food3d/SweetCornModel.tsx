import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { sliceAtX, type SlicedHalf } from './sliceMesh';

const MODEL_URL = `${import.meta.env.BASE_URL}models/sweet corn.glb`;

/** A photoscanned sweet corn cob, about 0.46 x 0.3 x 1.0 in its own units,
 *  lying with its length down the z axis. */
const SCALE = 1.55;

/** Sampled off the scan for the kernels. The cut face has to be invented — the
 *  scan is only a shell — and a sliced cob shows rows of yellow kernels around a
 *  pale spongy core, which is exactly what the two cap layers draw. */
const KERNEL = '#ffd23f';
const KERNEL_DARK = '#efb32f';
const CORE = '#f7e9b8';

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
      rim: cutCap(half.outline, 0.97),
      kernel: cutCap(half.outline, 0.9),
      core: cutCap(half.outline, 0.38),
    }),
    [half.outline],
  );

  if (!layers.rim) return null;

  return (
    <group>
      <mesh geometry={layers.rim} position={[faceSign * 0.004, 0, 0]}>
        <meshStandardMaterial color={KERNEL_DARK} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {layers.kernel && (
        <mesh geometry={layers.kernel} position={[faceSign * 0.006, 0, 0]}>
          <meshStandardMaterial color={KERNEL} roughness={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}
      {layers.core && (
        <mesh geometry={layers.core} position={[faceSign * 0.008, 0, 0]}>
          <meshStandardMaterial color={CORE} roughness={0.75} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

export function SweetCornHalfGeometry({ isLeft = false }: { isLeft?: boolean }) {
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
    // The scan lies with its length down z, so turn it a quarter so the length
    // runs along x and the cut splits the cob across its rows of kernels.
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
          roughness={0.7}
          envMapIntensity={0.7}
        />
      </mesh>

      <CutFace half={half} faceSign={isLeft ? -1 : 1} />
    </group>
  );
}

export default function SweetCornModel({
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
      // a cob is firm but not rock-hard: it gives a little when you press
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
      {/* Stood on its tip and leaned well off vertical, about 60 degrees.
          The -90 degrees about z is the whole reason it is upright: the cob is
          sliced across its length, and the scan arrives with that length down z,
          so standing it up is a quarter turn. The 0.25 about y now spins the cob
          about its own standing axis rather than turning its cut face to the
          camera, which the lean already did.

          The steep lean is not decoration, it is what lets the cob stand at all.
          The halves part by 0.8 of a cob that is only 1.0 long — eighty percent of
          the food's whole length. Lying down, that separation goes into the
          frame's width and nobody sees it; standing up it goes into the height,
          where there is none to spare, and at the old 3.6 the upper half ended up
          45% above the top of the frame once the cut settled. Leaning this far
          tips the separation back over into the width, where there is room. The
          price is the size: 3.0 is the largest that keeps the whole cut in frame.

          What the upright pose buys is the cut. Pointing up, the camera looks
          down into the face — 40% of it visible, against 27% when the cob lies
          down — so this is the only orientation that shows what the cut is for. */}
      <group rotation={[1.05, 0.25, -Math.PI / 2]}>
        <group ref={innerA}>
          <SweetCornHalfGeometry isLeft />
        </group>
        <group ref={innerB}>
          <SweetCornHalfGeometry isLeft={false} />
        </group>
      </group>
    </group>
  );
}