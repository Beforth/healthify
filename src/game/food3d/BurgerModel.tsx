import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { sliceAtX, type SlicedHalf } from './sliceMesh';
import { faceFrame, planarCap } from './capGeo';
import { buildBurgerMaps, BURGER_LAYERS } from './burgerFlesh';
import { cutTextures, fleshMaterialProps, type FleshLook } from './cutMaps';

export { BURGER_LAYERS };

const MODEL_URL = `${import.meta.env.BASE_URL}models/burger.glb`;

/** A photoscanned burger, about 0.47 x 0.40 x 0.50 in its own units, standing
 *  upright on its base bun with the whole stack running up the y axis. That is
 *  what makes a cut straight down x = 0 worth doing: the plane crosses every
 *  layer, so the face it leaves behind is the burger's own cross-section. */
const SCALE = 1.6;

const TEXTURE = 512;

/** A cut burger is a stack of different things in a small depth, so almost nothing
 *  in it is properly translucent — the transmission that suits a slab of sweet
 *  potato would turn the patty to glass. What it does have is a lot of wetness in
 *  a few places, so the clearcoat is doing most of the work: a thin gloss over the
 *  whole face, letting the tomato and the fat beads catch a highlight the way the
 *  matte crumb beside them never will. */
const FLESH_LOOK: FleshLook = {
  transmission: 0.04,
  thickness: 0.02,
  attenuation: '#8d2b12',
  attenuationDistance: 0.3,
  clearcoat: 0.62,
  clearcoatRoughness: 0.28,
  emissive: '#3a1206',
  emissiveIntensity: 0.04,
  envMapIntensity: 0.9,
  ior: 1.42,
};

/** Where each layer sits, as a fraction of the cut face's height from the bottom
 *  up, now owned by `burgerFlesh` and re-exported from here. The cross-section
 *  screen drops its markers onto this table, and the generated map is clipped to
 *  the same seams, so the markers cannot drift off the bands they name. */

/**
 * The flat face left behind by the cut.
 *
 * This used to be a run of flat-coloured strips, one per layer, fanned between the
 * silhouette's own left and right edges. It is now a single cap carrying a
 * generated albedo and roughness map, for the reason the other cut foods moved the
 * same way: a burger opened up is not a set of stripes. The bun is full of little
 * holes, the patty has a pink middle and a charred edge and beads of fat, the
 * cheese sags off the patty, and the tomato is wet enough to catch a highlight.
 * None of that survives being reduced to one `color` and one `roughness` per band.
 *
 * The cap is the same `planarCap` every other food uses, and the map is clipped to
 * the same boundary, so the two agree on where the burger ends — see the note in
 * `burgerFlesh` about why the silhouette is read off the cap's own radius rather
 * than measured a second time.
 */
function BurgerCutFace({ half, faceSign }: { half: SlicedHalf; faceSign: number }) {
  const cut = useMemo(() => {
    const maps = buildBurgerMaps(TEXTURE, half.outline);
    return {
      geo: planarCap(faceFrame(half.outline), 0.98),
      tex: cutTextures(`burger:${TEXTURE}`, maps, TEXTURE),
    };
  }, [half.outline]);

  if (!cut.geo) return null;

  return (
    <mesh geometry={cut.geo} position={[faceSign * 0.004, 0, 0]}>
      <meshPhysicalMaterial {...fleshMaterialProps(cut.tex, FLESH_LOOK)} />
    </mesh>
  );
}

export function BurgerHalfGeometry({ isLeft = false }: { isLeft?: boolean }) {
  const { scene } = useGLTF(MODEL_URL);

  // useGLTF hands back a cached, shared scene — read what we need out of it and
  // never mutate it, or every other copy on screen changes too.
  const source = useMemo(() => {
    let geometry: THREE.BufferGeometry | null = null;
    let map: THREE.Texture | null = null;

    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (geometry || !mesh.isMesh) return;
      geometry = mesh.geometry.clone();
      if (!geometry.attributes.normal) {
        geometry.computeVertexNormals();
      }
      const material = mesh.material as THREE.MeshStandardMaterial;
      map = material?.map ?? null;
    });

    return { geometry, map };
  }, [scene]);

  const half = useMemo(() => {
    if (!source.geometry) return null;
    const sliced = sliceAtX(source.geometry, isLeft);
    if (sliced.geometry && !sliced.geometry.attributes.normal) {
      sliced.geometry.computeVertexNormals();
    }
    return sliced;
  }, [source.geometry, isLeft]);

  if (!half) return null;

  return (
    <group>
      {/* Smooth vertex normals let the seeded bun dome and succulent patty catch glossy highlights */}
      <mesh geometry={half.geometry} castShadow receiveShadow>
        <meshStandardMaterial
          map={source.map}
          roughness={0.58}
          metalness={0.04}
          envMapIntensity={1.1}
          flatShading={false}
        />
      </mesh>

      <BurgerCutFace half={half} faceSign={isLeft ? -1 : 1} />
    </group>
  );
}

export default function BurgerModel({
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
      // a burger is soft: it gives a little when you press, like the fruit
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
      {/* Standing straight up on its base bun, with no lean.
          The stack used to be pitched 0.4 about x, which tipped the whole burger
          over at an angle as it turned. That is gone, and with it the reason it
          was there: the pitch was shortening the burger's footprint by
          foreshortening it, which is how 3.05 fitted the board. Held upright the
          footprint is genuinely that big, so the size is not buying the lean
          back. The 0.25 about y stays, because that one is not cosmetic — it is
          what angles the cut face toward the camera instead of edge-on. */}
      <group rotation={[0, 0.25, 0]}>
        <group ref={innerA}>
          <BurgerHalfGeometry isLeft />
        </group>
        <group ref={innerB}>
          <BurgerHalfGeometry isLeft={false} />
        </group>
      </group>
    </group>
  );
}
