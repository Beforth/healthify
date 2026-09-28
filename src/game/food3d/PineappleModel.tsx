import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { sliceAtX, type SlicedHalf } from './sliceMesh';

const MODEL_URL = `${import.meta.env.BASE_URL}models/pineapple.glb`;

/** A photoscanned whole pineapple, about 0.57 x 0.99 x 0.55 in its own units,
 *  standing upright. Roughly the bottom half is fruit and the top half crown. */
const SCALE = 2.4;

/** Where the fruit stops and the crown starts, measured off the scan: below this
 *  the cut is one clean closed body, above it the plane is passing through a
 *  tangle of separate leaf blades. */
const CROWN_Y = 0.02;

/** Sampled off the scan for the skin, and off a real cut pineapple for the parts
 *  the scan cannot know about — it is only a shell, so the inside is invented. */
const RIND = '#a8791f';
const FLESH = '#e9a71b';
const CORE = '#f2d27a';

useGLTF.preload(MODEL_URL);

interface Band {
  y: number;
  z0: number;
  z1: number;
}

/**
 * The fruit body's silhouette, as a left and right edge sampled up its height.
 *
 * The biscuit and the bar both cap their cut with a fan around the outline's
 * middle, which works because their outlines are smooth and convex. A pineapple
 * is neither: its skin is knobbly, so neighbouring outline points sit at the same
 * angle but different distances and the fan zigzags. Sampling one left and one
 * right edge per height band instead gives an outline that can only ever go up.
 */
function bodyBands(outline: { y: number; z: number }[], count: number): Band[] {
  const points = outline.filter((p) => p.y <= CROWN_Y);
  if (points.length < 6) return [];

  let yMin = Infinity;
  let yMax = -Infinity;
  for (const p of points) {
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  }
  const span = yMax - yMin;
  if (span <= 0) return [];

  const lo = new Array<number>(count).fill(Infinity);
  const hi = new Array<number>(count).fill(-Infinity);
  for (const p of points) {
    const i = Math.min(count - 1, Math.floor(((p.y - yMin) / span) * count));
    if (p.z < lo[i]) lo[i] = p.z;
    if (p.z > hi[i]) hi[i] = p.z;
  }

  const raw: Band[] = [];
  for (let i = 0; i < count; i++) {
    if (lo[i] === Infinity) continue;
    raw.push({ y: yMin + (span * (i + 0.5)) / count, z0: lo[i], z1: hi[i] });
  }
  if (raw.length < 2) return [];

  // Each band takes the single widest point it happened to catch, and on skin
  // this knobbly that alone staircases visibly. Averaging each edge with its
  // neighbours keeps the fruit's bulge but loses the jitter.
  const bands = raw.map((band, i) => {
    let z0 = 0;
    let z1 = 0;
    let n = 0;
    for (let k = -2; k <= 2; k++) {
      const other = raw[i + k];
      if (!other) continue;
      z0 += other.z0;
      z1 += other.z1;
      n++;
    }
    return { y: band.y, z0: z0 / n, z1: z1 / n };
  });

  // The first and last samples sit half a band in from the real ends, which
  // would leave the cap with a flat lip top and bottom. Run it out to the true
  // extremes, narrowing as it goes so the fruit rounds off instead.
  const first = bands[0];
  const last = bands[bands.length - 1];
  const pinch = (b: Band, y: number): Band => {
    const mid = (b.z0 + b.z1) / 2;
    const half = ((b.z1 - b.z0) / 2) * 0.82;
    return { y, z0: mid - half, z1: mid + half };
  };
  return [pinch(first, yMin), ...bands, pinch(last, yMax)];
}

/** Fills between the two edges. `kz` narrows each band about its own middle and
 *  `ky` shortens the whole run, which is how the inner layers are inset. */
function bandStrip(bands: Band[], kz: number, ky: number): THREE.BufferGeometry | null {
  if (bands.length < 2) return null;

  const yMid = (bands[0].y + bands[bands.length - 1].y) / 2;
  const shaped = bands.map((b) => {
    const mid = (b.z0 + b.z1) / 2;
    const half = ((b.z1 - b.z0) / 2) * kz;
    return { y: yMid + (b.y - yMid) * ky, z0: mid - half, z1: mid + half };
  });

  const positions: number[] = [];
  for (let i = 0; i + 1 < shaped.length; i++) {
    const a = shaped[i];
    const b = shaped[i + 1];
    positions.push(
      0, a.y, a.z0, 0, a.y, a.z1, 0, b.y, b.z1,
      0, a.y, a.z0, 0, b.y, b.z1, 0, b.y, b.z0,
    );
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * The flat face left behind by the cut.
 *
 * Only the fruit is capped. The crown is a loose bunch of blades rather than one
 * solid thing, so there is no single opening up there to close — the leaves are
 * drawn double-sided instead, which reads as a blade seen edge-on.
 */
function CutFace({ half, faceSign }: { half: SlicedHalf; faceSign: number }) {
  const layers = useMemo(() => {
    const bands = bodyBands(half.outline, 34);
    return {
      rind: bandStrip(bands, 1, 1),
      flesh: bandStrip(bands, 0.88, 0.94),
      core: bandStrip(bands, 0.2, 0.7),
    };
  }, [half.outline]);

  if (!layers.rind) return null;

  // each layer stands a little further out of the opening than the one under it,
  // so they stack front to back instead of fighting for the same depth
  return (
    <group>
      <mesh geometry={layers.rind} position={[faceSign * 0.004, 0, 0]}>
        <meshStandardMaterial color={RIND} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {layers.flesh && (
        <mesh geometry={layers.flesh} position={[faceSign * 0.006, 0, 0]}>
          <meshStandardMaterial color={FLESH} roughness={0.72} side={THREE.DoubleSide} />
        </mesh>
      )}
      {layers.core && (
        <mesh geometry={layers.core} position={[faceSign * 0.008, 0, 0]}>
          <meshStandardMaterial color={CORE} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}
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
