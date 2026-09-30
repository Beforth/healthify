import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { sliceAtX, type SlicedHalf } from './sliceMesh';
import { bandExtent, bodyBands, fleshStrip, onFlesh } from './pineappleCut';
import { buildFleshMaps, dropletSpots } from './pineappleFlesh';

const MODEL_URL = `${import.meta.env.BASE_URL}models/pineapple.glb`;

/** A photoscanned whole pineapple, about 0.57 x 0.99 x 0.55 in its own units,
 *  standing upright. Roughly the bottom half is fruit and the top half crown. */
const SCALE = 2.4;

/** Sampled off the scan for the skin, and off a real cut pineapple for the parts
 *  the scan cannot know about — it is only a shell, so the inside is invented.
 *  The rind is a dark tan-brown rim: it has to read as hard and dry against the
 *  wet gold right next to it, which is the whole contrast of a cut pineapple. */
const RIND = '#8a5f18';

/** How big the flesh is generated at. Sharp enough to hold the cell structure
 *  when the face is seen at an angle, small enough that generating it is a
 *  one-off cost rather than a pause. */
const FLESH_SIZE = 512;

type FleshTextures = { map: THREE.DataTexture; roughnessMap: THREE.DataTexture };
let fleshTextures: FleshTextures | null = null;

/**
 * The flesh, as textures.
 *
 * One set for the whole app, built on first use. Both halves of a cut and the
 * microscope's own copy read off the same pixels, and — the reason this is not
 * just a `useMemo` — the same GPU upload. A memo per component would have every
 * face upload its own megabyte of identical data, and none of them would ever be
 * disposed anyway, since the fruit outlives any one of them.
 *
 * Mipmaps and anisotropy are worth the memory here: a cut face is seen almost
 * edge-on, and without them the fibres and cells dissolve into shimmer the moment
 * the fruit turns.
 */
function getFleshTextures(): FleshTextures {
  if (!fleshTextures) {
    const { albedo, roughness } = buildFleshMaps(FLESH_SIZE);
    const make = (data: Uint8ClampedArray, srgb: boolean) => {
      const t = new THREE.DataTexture(data, FLESH_SIZE, FLESH_SIZE, THREE.RGBAFormat);
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.wrapS = THREE.ClampToEdgeWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = true;
      t.anisotropy = 8;
      t.needsUpdate = true;
      return t;
    };
    fleshTextures = { map: make(albedo, true), roughnessMap: make(roughness, false) };
  }
  return fleshTextures;
}

/**
 * The flat face left behind by the cut.
 *
 * Only the fruit is capped. The crown is a loose bunch of blades rather than one
 * solid thing, so there is no single opening up there to close — the leaves are
 * drawn double-sided instead, which reads as a blade seen edge-on.
 *
 * The face itself is not layered. A pineapple cut lengthwise is one continuous
 * wet surface with a pale core running up the middle of it, and painting that as
 * three stacked discs made it look like a boiled egg — so the whole interior is
 * a single cap wearing a generated texture of the real thing, and the only
 * geometry left is the thin brown rim of rind around it.
 */
function CutFace({ half, faceSign }: { half: SlicedHalf; faceSign: number }) {
  const textures = getFleshTextures();

  const { rind, flesh, beads } = useMemo(() => {
    const bands = bodyBands(half.outline, 34);
    if (bands.length < 2) {
      return { rind: null, flesh: null, beads: [] as { y: number; z: number; r: number; glint: number }[] };
    }

    // where the face is, so the juice can be placed in its own units
    const { yMin, yMax, zMin, zMax } = bandExtent(bands);
    const spanY = Math.max(1e-6, yMax - yMin);
    const spanZ = Math.max(1e-6, zMax - zMin);

    const beads = dropletSpots()
      .map((s) => ({
        y: yMin + s.v * spanY,
        z: zMin + s.u * spanZ,
        r: s.r * spanZ,
        glint: s.glint,
      }))
      .filter((b) => onFlesh(bands, b.y, b.z));

    return {
      rind: fleshStrip(bands, 1, 1),
      // addressed against the full silhouette, not against its own inset
      flesh: fleshStrip(bands, 0.9, 0.96, bands),
      beads,
    };
  }, [half.outline]);

  if (!rind || !flesh) return null;

  return (
    <group>
      <mesh geometry={rind} position={[faceSign * 0.004, 0, 0]}>
        <meshStandardMaterial color={RIND} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={flesh} position={[faceSign * 0.006, 0, 0]}>
        {/* Roughness comes entirely from the map, so `roughness` stays at 1 and
            the wettest and driest parts of the face are the ones the generator
            found, not one flat value over all of it. */}
        <meshPhysicalMaterial
          map={textures.map}
          roughnessMap={textures.roughnessMap}
          roughness={1}
          metalness={0}
          ior={1.35}
          // The flesh is a slab of water and cells a few millimetres deep, so a
          // little light comes through the front of it rather than bouncing off.
          // This is the whole of the subsurface effect: there is no scattering
          // term in the renderer, only the transmission and the glow below.
          transmission={0.22}
          thickness={0.3}
          attenuationColor="#f2a81c"
          attenuationDistance={0.55}
          // the juice film on top, and the warm bleed of light out of the fruit
          clearcoat={0.4}
          clearcoatRoughness={0.1}
          emissive="#ffcf6a"
          emissiveMap={textures.map}
          emissiveIntensity={0.11}
          envMapIntensity={1.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* The juice standing on the face. Painted beads can only ever be white
          dots; a bead is a clear lens sitting on the flesh, and what sells it is
          the hard little highlight the environment throws along its curve. */}
      {beads.map((b, i) => (
        <mesh
          key={i}
          position={[faceSign * 0.008, b.y, b.z]}
          scale={[0.55, 1, 1]}
        >
          <sphereGeometry args={[b.r, 12, 10]} />
          <meshPhysicalMaterial
            color="#fff6dc"
            roughness={0.03}
            metalness={0}
            ior={1.33}
            clearcoat={1}
            clearcoatRoughness={0.02}
            transparent
            opacity={0.45 + b.glint * 0.25}
            envMapIntensity={2.4 + b.glint * 1.2}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function PineappleHalfGeometry({ isLeft = false }: { isLeft?: boolean }) {
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
      {/* Double-sided because the crown is left uncapped: a leaf halved down its
          length is an open shell, and single-sided you would see straight
          through it. The fruit below is capped, so nothing else is affected. */}
      <mesh geometry={half.geometry} castShadow receiveShadow>
        <meshStandardMaterial
          map={source.map}
          flatShading
          roughness={0.85}
          side={THREE.DoubleSide}
          envMapIntensity={0.7}
        />
      </mesh>

      <CutFace half={half} faceSign={isLeft ? -1 : 1} />
    </group>
  );
}

export default function PineappleModel({
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
      // firm under a tough skin: it gives a little, but nowhere near as much as
      // the soft fruit does
      outer.current.scale.setScalar(SCALE * (1 - wobble * 0.07) * hoverBoost);
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
      {/* barely tipped: a pineapple reads as a pineapple standing up */}
      <group rotation={[0.08, 0.3, 0]}>
        <group ref={innerA}>
          <PineappleHalfGeometry isLeft />
        </group>
        <group ref={innerB}>
          <PineappleHalfGeometry isLeft={false} />
        </group>
      </group>
    </group>
  );
}
