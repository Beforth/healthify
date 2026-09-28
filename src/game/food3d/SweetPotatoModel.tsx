import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { sliceAtX, type SlicedHalf } from './sliceMesh';

const MODEL_URL = `${import.meta.env.BASE_URL}models/sweet-potato.glb`;

/** A photoscanned sweet potato, about 0.34 x 0.32 x 1.0 in its own units, lying
 *  with its length down the z axis. This replaces the old code-built root — the
 *  scan's knobbly, soil-stained skin is the only part worth copying. */
const SCALE = 2.1;

/** The inside is invented — the scan is only a shell — so the cut face keeps the
 *  same three tones the code-built root used: thin skin rim, dense orange
 *  flesh, then a slightly paler heart. */
const RIM = '#9c4a18';
const FLESH = '#f59a42';
const HEART = '#ffb765';

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
      flesh: cutCap(half.outline, 0.92),
      heart: cutCap(half.outline, 0.55),
    }),
    [half.outline],
  );

  // the pale fibrous flecks scattered through the flesh, sized for the scan's
  // much smaller cut face
  const flecks = useMemo(
    () => [
      { y: 0.06, z: 0.05 },
      { y: 0.02, z: -0.08 },
      { y: -0.04, z: 0.07 },
      { y: -0.1, z: -0.03 },
      { y: 0.11, z: -0.06 },
    ],
    [],
  );

  if (!layers.rim) return null;

  return (
    <group>
      {/* rim sits flush with the skin — scaling it up would poke out and show as a
          seam line down the middle while the root is still whole */}
      <mesh geometry={layers.rim} position={[faceSign * 0.004, 0, 0]}>
        <meshStandardMaterial color={RIM} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      {layers.flesh && (
        <mesh geometry={layers.flesh} position={[faceSign * 0.006, 0, 0]}>
          <meshStandardMaterial color={FLESH} roughness={0.66} side={THREE.DoubleSide} />
        </mesh>
      )}
      {layers.heart && (
        <mesh geometry={layers.heart} position={[faceSign * 0.008, 0, 0]}>
          <meshStandardMaterial color={HEART} roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}

      {flecks.map((f, i) => (
        <mesh
          key={i}
          position={[faceSign * 0.012, f.y, f.z]}
          rotation={[0, 0, 0.4 + i * 0.3]}
          scale={[0.4, 1, 1]}
        >
          <sphereGeometry args={[0.028, 10, 8]} />
          <meshStandardMaterial color="#ffe0b0" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

export function SweetPotatoHalfGeometry({ isLeft = false }: { isLeft?: boolean }) {
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
    // runs along x and the cut splits the root along its length.
    const upright = (source.geometry as THREE.BufferGeometry).clone();
    upright.rotateY(-Math.PI / 2);
    const sliced = sliceAtX(upright, isLeft);
    upright.dispose();
    return sliced;
  }, [source.geometry, isLeft]);

  if (!half) return null;

  return (
    <group>
      {/* earthy, matte skin — a tuber has no shine at all */}
      <mesh geometry={half.geometry} castShadow receiveShadow>
        <meshStandardMaterial map={source.map} flatShading roughness={0.72} envMapIntensity={0.65} />
      </mesh>

      <CutFace half={half} faceSign={isLeft ? -1 : 1} />
    </group>
  );
}

export default function SweetPotatoModel({
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
        SCALE * (1 + wobble * 0.08) * hoverBoost,
        SCALE * (1 - wobble * 0.12) * hoverBoost,
        SCALE * (1 + wobble * 0.08) * hoverBoost,
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
      scale={SCALE}
      onPointerDown={bump}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* tipped over so a long root reads as lying on the board */}
      <group rotation={[0.05, 0, 0.72]}>
        <group ref={innerA}>
          <SweetPotatoHalfGeometry isLeft />
        </group>
        <group ref={innerB}>
          <SweetPotatoHalfGeometry isLeft={false} />
        </group>
      </group>
    </group>
  );
}