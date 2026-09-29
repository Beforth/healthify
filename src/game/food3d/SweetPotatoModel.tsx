import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { sliceAtX, type SlicedHalf } from './sliceMesh';
import { faceFrame, planarCap } from './capGeo';
import { buildSweetPotatoMaps } from './sweetPotatoFlesh';
import { cutTextures, fleshMaterialProps, type FleshLook } from './cutMaps';

const MODEL_URL = `${import.meta.env.BASE_URL}models/sweet-potato.glb`;

/** A photoscanned sweet potato, about 0.34 x 0.32 x 1.0 in its own units, lying
 *  with its length down the z axis. This replaces the old code-built root — the
 *  scan's knobbly, soil-stained skin is the only part worth copying. */
const SCALE = 2.1;

/** The inside is invented — the scan is only a shell — so the cut face is drawn as
 *  one generated image: the dark skin it is actually wearing at that edge, the
 *  flesh, the faint concentric rings, and the starchy film the cut has left on it.
 *  That replaces three flat discs in three flat colours, which read as a boiled
 *  egg. */
const TEXTURE = 512;

/** A cut root is a wet slab a few millimetres deep, so a little light comes
 *  through the front of it, and what gets through has gone orange on the way. */
const FLESH_LOOK: FleshLook = {
  transmission: 0.18,
  thickness: 0.06,
  attenuation: '#c2560d',
  attenuationDistance: 0.16,
  clearcoat: 0.35,
  clearcoatRoughness: 0.42,
  emissive: '#c2551a',
  emissiveIntensity: 0.06,
  envMapIntensity: 0.7,
  ior: 1.4,
};

useGLTF.preload(MODEL_URL);

function CutFace({ half, faceSign }: { half: SlicedHalf; faceSign: number }) {
  // one cap, one texture, the whole interior in it
  const cut = useMemo(() => {
    const maps = buildSweetPotatoMaps(TEXTURE, half.outline);
    return {
      geo: planarCap(faceFrame(half.outline), 0.98),
      tex: cutTextures(`sweet-potato:${TEXTURE}`, maps, TEXTURE),
    };
  }, [half.outline]);

  if (!cut.geo) return null;

  return (
    <mesh geometry={cut.geo} position={[faceSign * 0.004, 0, 0]}>
      <meshPhysicalMaterial {...fleshMaterialProps(cut.tex, FLESH_LOOK)} />
    </mesh>
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
      {/* Lying across the board with a gentle lean, and turned a little toward
          the camera. The 0.2 about z is the lean — enough to read as a root set
          down at an angle rather than laid out square. The 0.2 about y is the one
          that earns its place: the cut face points along x, so with no turn toward
          the camera the whole interior is edge-on and invisible, and the cut is
          the entire point. A quarter turn like the cob's would overdo it and hide
          the face again, so this is deliberately much less. */}
      <group rotation={[0.05, 0.2, 0.2]}>
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