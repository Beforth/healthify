import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { sliceAtX, type SlicedHalf } from './sliceMesh';

const MODEL_URL = `${import.meta.env.BASE_URL}models/chocolate.glb`;

/** A photoscanned moulded bar, about 0.53 x 0.13 x 1.0 in its own units: it
 *  arrives lying flat with its length down the z axis. */
const SCALE = 1.95;

/** Sampled off the scan: a deep, red-leaning cocoa brown. The cut face has to be
 *  invented — the scan is only a shell — and a snapped bar is matte inside where
 *  the moulded outside is glossy, so it sits a shade lighter than the surface. */
const SNAP = '#63291a';

/**
 * The flat face left behind by the snap.
 *
 * Chocolate is the same all the way through, so unlike the biscuit there are no
 * layers to draw here — just a clean matte cap following the real cut outline,
 * which for this bar is a rectangle with the moulding's ripple along its top.
 */
function CutFace({ half, faceSign }: { half: SlicedHalf; faceSign: number }) {
  const { outline } = half;

  const geometry = useMemo(() => {
    if (outline.length < 3) return null;

    const cy = outline.reduce((sum, p) => sum + p.y, 0) / outline.length;
    const cz = outline.reduce((sum, p) => sum + p.z, 0) / outline.length;
    // the cap sits a hair proud of the opening, so pull the outline in by the
    // same hair or it breaks the surface along the bar's rounded edges
    const inset = 0.97;

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
  }, [outline]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry} position={[faceSign * 0.003, 0, 0]}>
      <meshStandardMaterial color={SNAP} roughness={0.85} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function ChocolateBarHalfGeometry({ isLeft = false }: { isLeft?: boolean }) {
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
    // The scan lies with its length down z, so a cut at x = 0 would split it the
    // long way. Turn it a quarter so the length runs along x and the same cut
    // snaps the bar in two the way a person would.
    const upright = (source.geometry as THREE.BufferGeometry).clone();
    upright.rotateY(-Math.PI / 2);
    const sliced = sliceAtX(upright, isLeft);
    upright.dispose();
    return sliced;
  }, [source.geometry, isLeft]);

  if (!half) return null;

  return (
    <group>
      {/* The scan ships without normals, so it is lit flat — which suits the
          bar's crisp moulded facets better than smoothing them over would. */}
      <mesh geometry={half.geometry} castShadow receiveShadow>
        <meshStandardMaterial
          map={source.map}
          flatShading
          roughness={0.5}
          envMapIntensity={0.9}
        />
      </mesh>

      <CutFace half={half} faceSign={isLeft ? -1 : 1} />
    </group>
  );
}

export default function ChocolateBarModel({
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
    const sep = p * 0.5 + kick * 0.28;

    // a snapped bar does not slide apart flat — the two halves tip away from the
    // break, which is what sells it as broken rather than sawn
    if (innerA.current) {
      innerA.current.position.set(sep, -sep * 0.06, 0);
      innerA.current.rotation.z = -Math.min(sep * 0.5, 0.3);
    }
    if (innerB.current) {
      innerB.current.position.set(-sep, -sep * 0.06, 0);
      innerB.current.rotation.z = Math.min(sep * 0.5, 0.3);
    }

    squish.current *= Math.exp(-delta * 6);
    if (outer.current) {
      const wobble = Math.sin(state.clock.elapsedTime * 14) * squish.current;
      const hoverBoost = hovered ? 1.05 : 1;
      // chocolate is hard: it barely gives when you press it, so the squish is
      // much smaller here than on the fruit
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
      {/* tipped up off the board so both the moulded top and the snapped edge read */}
      <group rotation={[0.38, 0.22, 0]}>
        <group ref={innerA}>
          <ChocolateBarHalfGeometry isLeft />
        </group>
        <group ref={innerB}>
          <ChocolateBarHalfGeometry isLeft={false} />
        </group>
      </group>
    </group>
  );
}
