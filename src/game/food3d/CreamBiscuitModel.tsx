import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { sliceAtX, type SlicedHalf } from './sliceMesh';

const MODEL_URL = `${import.meta.env.BASE_URL}models/cream_biscuit.glb`;

/** The only imported model in the project: a photoscanned rectangular sandwich
 *  biscuit, about 1.0 x 0.36 x 0.94 in its own units, lying flat with its
 *  thickness up the y axis. Everything else here is built in code. */
const SCALE = 1.6;

/** Sampled off the scan itself: a golden crust over pale crumb. The cut face has
 *  to be invented — the scan is only a shell — so the crumb keeps the inside
 *  looking like it belongs to the outside, and the cream is the one thing a
 *  child is looking for when the biscuit opens: a pale, unmistakable band. */
const CRUMB = '#d6a257';
const CRUMB_EDGE = '#b8783f';
const CREAM = '#fff3d6';
const CREAM_SHADE = '#f1dcae';

useGLTF.preload(MODEL_URL);

/**
 * The flat face left behind by the cut.
 *
 * The scan is a closed shell, so a sliced half is hollow — without this you see
 * straight through the biscuit. Capping it is also the one chance to show what a
 * cream biscuit actually is on the inside: two baked wafers with a band of cream
 * between them, which is exactly what the sheet's ≈5–7 g of fat is doing here.
 */
function CutFace({ half, faceSign }: { half: SlicedHalf; faceSign: number }) {
  const { cut, outline } = half;
  const height = cut.yMax - cut.yMin;
  const yMid = (cut.yMin + cut.yMax) / 2;
  const zMid = (cut.zMin + cut.zMax) / 2;

  const crumbGeo = useMemo(() => {
    if (outline.length < 3) return null;

    const cy = outline.reduce((sum, p) => sum + p.y, 0) / outline.length;
    const cz = outline.reduce((sum, p) => sum + p.z, 0) / outline.length;
    // The cap sits a hair inside the opening rather than exactly in it, so pull
    // the outline in by the same hair: the biscuit's faces are slightly domed,
    // and at full size the cap would break the surface along the whole seam.
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

  if (!crumbGeo) return null;

  // A sandwich biscuit is roughly a third cream by thickness.
  const creamHeight = height * 0.34;
  // kept a little short of the rim so only the crumb cap ever touches the edge
  const creamWidth = (cut.zMax - cut.zMin) * 0.9;
  const seam = height * 0.025;

  // Every layer stands a hair further out of the opening than the one beneath
  // it, so the cream sits *on* the crumb cap rather than being buried behind it.
  return (
    <group position={[faceSign * 0.004, 0, 0]}>
      <mesh geometry={crumbGeo}>
        <meshStandardMaterial color={CRUMB} roughness={0.92} side={THREE.DoubleSide} />
      </mesh>

      {/* a plane faces +z by default; a quarter turn about y stands it up
          facing ±x, putting its width along z and its height along y */}
      <group position={[faceSign * 0.002, yMid, zMid]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[creamWidth, creamHeight]} />
          <meshStandardMaterial color={CREAM} roughness={0.5} side={THREE.DoubleSide} />
        </mesh>

        {/* a softer tone along the lower edge — cream squashed under the top
            wafer — so the band reads as something with thickness */}
        <mesh position={[0, -creamHeight * 0.3, faceSign * 0.0005]}>
          <planeGeometry args={[creamWidth * 0.96, creamHeight * 0.28]} />
          <meshStandardMaterial color={CREAM_SHADE} roughness={0.6} side={THREE.DoubleSide} />
        </mesh>

        {/* where the cream meets each wafer — without these the bands read as
            stripes of paint rather than layers */}
        {[1, -1].map((dir) => (
          <mesh key={dir} position={[0, dir * (creamHeight / 2), faceSign * 0.001]}>
            <planeGeometry args={[creamWidth, seam]} />
            <meshStandardMaterial color={CRUMB_EDGE} roughness={0.95} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function CreamBiscuitHalfGeometry({ isLeft = false }: { isLeft?: boolean }) {
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

  const faceSign = isLeft ? -1 : 1;

  return (
    <group>
      {/* The scan ships without normals, so it is lit flat — which suits a
          biscuit's crisp baked edges better than smoothing them over would. */}
      <mesh geometry={half.geometry} castShadow receiveShadow>
        <meshStandardMaterial
          map={source.map}
          flatShading
          roughness={0.78}
          envMapIntensity={0.7}
        />
      </mesh>

      <CutFace half={half} faceSign={faceSign} />
    </group>
  );
}

export default function CreamBiscuitModel({
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
      // a biscuit is brittle: it barely gives when you press it, so the squish
      // is much smaller here than on the fruit
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
      {/* tipped up off the board so both the stamped top and the cut edge read */}
      <group rotation={[0.42, 0.2, 0]}>
        <group ref={innerA}>
          <CreamBiscuitHalfGeometry isLeft />
        </group>
        <group ref={innerB}>
          <CreamBiscuitHalfGeometry isLeft={false} />
        </group>
      </group>
    </group>
  );
}
