import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { sliceAtX, type SlicedHalf } from './sliceMesh';

const MODEL_URL = `${import.meta.env.BASE_URL}models/broccoli.glb`;

/** A photoscanned head of broccoli, about 0.93 x 0.998 x 0.87 in its own units,
 *  standing upright. The whole dome is one closed body, so a cut down x = 0
 *  splits it cleanly down the middle. */
const SCALE = 1.55;

/** Sampled off the scan for the skin, and off a real cut stalk for the parts the
 *  scan cannot know about — it is only a shell, so the inside is invented. */
const FLORET = '#2f6b2a';
const FLORET_LIGHT = '#4f9440';
const FLORET_DEEP = '#22521f';
const STALK = '#cfe6a6';
const STALK_CORE = '#e8f3cf';
const STALK_SKIN = '#8dbf5e';

useGLTF.preload(MODEL_URL);

interface Band {
  y: number;
  z0: number;
  z1: number;
}

/**
 * The head's silhouette as a left and right edge sampled up its height.
 *
 * The biscuit caps its cut with a fan around the outline's middle, which works
 * because a biscuit's outline is convex. A broccoli's is not: a narrow stalk
 * under a wide crown, with florets bulging in and out along the top. Fanned from
 * the centre, that outline zigzags and the cap comes out as a starburst of
 * slivers. One left and one right edge per height band gives a clean shape that
 * can only ever go up.
 */
function silhouetteBands(outline: { y: number; z: number }[], count: number): Band[] {
  if (outline.length < 6) return [];

  let yMin = Infinity;
  let yMax = -Infinity;
  for (const p of outline) {
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  }
  const span = yMax - yMin;
  if (span <= 0) return [];

  const lo = new Array<number>(count).fill(Infinity);
  const hi = new Array<number>(count).fill(-Infinity);
  for (const p of outline) {
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

  // each band only keeps the single widest point it caught; a light smoothing
  // keeps the crown's bulge but loses the per-band jitter
  const bands = raw.map((band, i) => {
    let z0 = 0;
    let z1 = 0;
    let n = 0;
    for (let k = -1; k <= 1; k++) {
      const other = raw[i + k];
      if (!other) continue;
      z0 += other.z0;
      z1 += other.z1;
      n++;
    }
    return { y: band.y, z0: z0 / n, z1: z1 / n };
  });

  // run the strip out to the true top and bottom, rounding off as it goes
  const pinch = (b: Band, y: number): Band => {
    const mid = (b.z0 + b.z1) / 2;
    const half = ((b.z1 - b.z0) / 2) * 0.8;
    return { y, z0: mid - half, z1: mid + half };
  };
  return [pinch(bands[0], yMin), ...bands, pinch(bands[bands.length - 1], yMax)];
}

/** Fills between the two edges, a hair inside them so the cap never pokes out
 *  through the skin. UVs run 0→1 across each band and up the height, so a
 *  texture painted in that space keeps its stalk centred in the shape. */
function bandStrip(bands: Band[], inset: number): THREE.BufferGeometry | null {
  if (bands.length < 2) return null;

  const yMin = bands[0].y;
  const yMax = bands[bands.length - 1].y;
  const positions: number[] = [];
  const uvs: number[] = [];

  const corner = (b: Band, side: 0 | 1) => {
    const mid = (b.z0 + b.z1) / 2;
    const half = ((b.z1 - b.z0) / 2) * inset;
    positions.push(0, b.y, side ? mid + half : mid - half);
    uvs.push(side, (b.y - yMin) / (yMax - yMin));
  };

  for (let i = 0; i + 1 < bands.length; i++) {
    const a = bands[i];
    const b = bands[i + 1];
    corner(a, 0); corner(a, 1); corner(b, 1);
    corner(a, 0); corner(b, 1); corner(b, 0);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

/**
 * What the inside of a halved broccoli looks like, painted once into a texture:
 * a pale stalk running up the middle and branching out, packed dark-green
 * florets everywhere else. Painted in band space (see `bandStrip`), so the
 * stalk is drawn as a fraction of each row's width — `bands` tells it how wide
 * each row really is, so the stalk stays the same thickness in world units as
 * the shape widens into the crown.
 */
function paintCutFace(bands: Band[]): THREE.CanvasTexture | null {
  const W = 256;
  const H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const yMin = bands[0].y;
  const yMax = bands[bands.length - 1].y;
  const widthAt = (v: number) => {
    const y = yMin + v * (yMax - yMin);
    for (let i = 0; i + 1 < bands.length; i++) {
      const a = bands[i];
      const b = bands[i + 1];
      if (y >= a.y && y <= b.y) {
        const t = (y - a.y) / Math.max(1e-6, b.y - a.y);
        return THREE.MathUtils.lerp(a.z1 - a.z0, b.z1 - b.z0, t);
      }
    }
    return bands[bands.length - 1].z1 - bands[bands.length - 1].z0;
  };

  // the stalk is about as wide as the shape's foot; the crown starts where the
  // silhouette first gets clearly wider than that
  const footWidth = widthAt(0.06);
  let crownV = 0.45;
  for (let v = 0.06; v < 0.9; v += 0.01) {
    if (widthAt(v) > footWidth * 1.7) {
      crownV = v;
      break;
    }
  }

  // canvas y runs down the page; texture v runs up, so flip once here
  const rowY = (v: number) => (1 - v) * H;

  // florets: a dark ground with a scatter of lighter and darker beads
  ctx.fillStyle = FLORET;
  ctx.fillRect(0, 0, W, H);
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 900; i++) {
    const u = rand();
    const v = rand();
    const r = 3 + rand() * 7;
    ctx.fillStyle = rand() < 0.55 ? FLORET_LIGHT : FLORET_DEEP;
    ctx.globalAlpha = 0.55 + rand() * 0.35;
    ctx.beginPath();
    ctx.arc(u * W, rowY(v), r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // the stalk, drawn row by row so its world-unit width holds as the shape
  // widens, tapering as it climbs into the crown and stopping short of the top
  const stalkTopV = Math.min(0.92, crownV + 0.36);
  for (let py = 0; py < H; py++) {
    const v = 1 - py / H;
    if (v > stalkTopV) continue;
    const taper = v < crownV ? 1 : 1 - ((v - crownV) / (stalkTopV - crownV)) * 0.72;
    const stalkWorld = footWidth * 0.84 * taper;
    const halfU = Math.min(0.48, (stalkWorld / Math.max(1e-6, widthAt(v))) * 0.5);
    const x0 = (0.5 - halfU) * W;
    const x1 = (0.5 + halfU) * W;
    ctx.fillStyle = STALK_SKIN;
    ctx.fillRect(x0, py, x1 - x0, 1);
    const skin = Math.max(2, (x1 - x0) * 0.09);
    ctx.fillStyle = STALK;
    ctx.fillRect(x0 + skin, py, x1 - x0 - skin * 2, 1);
    const coreHalf = (x1 - x0) * 0.16;
    ctx.fillStyle = STALK_CORE;
    ctx.fillRect(W / 2 - coreHalf, py, coreHalf * 2, 1);
  }

  // branches: the stalk splits into the stems that hold the florets up
  ctx.strokeStyle = STALK;
  ctx.lineCap = 'round';
  const forkV = crownV + 0.1;
  const branches = [-0.36, -0.2, 0.2, 0.36, -0.08, 0.08];
  branches.forEach((dx, i) => {
    const fromV = forkV - (i > 3 ? 0.04 : 0);
    const toV = Math.min(0.94, forkV + 0.24 + Math.abs(dx) * 0.2);
    ctx.lineWidth = i > 3 ? 7 : 5;
    ctx.beginPath();
    ctx.moveTo(W / 2, rowY(fromV));
    ctx.quadraticCurveTo(W / 2 + dx * W * 0.4, rowY(fromV + 0.06), W / 2 + dx * W, rowY(toV));
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function CutFace({ half, faceSign }: { half: SlicedHalf; faceSign: number }) {
  const cap = useMemo(() => {
    const bands = silhouetteBands(half.outline, 40);
    const geometry = bandStrip(bands, 0.97);
    if (!geometry) return null;
    return { geometry, texture: paintCutFace(bands) };
  }, [half.outline]);

  if (!cap) return null;

  return (
    <mesh geometry={cap.geometry} position={[faceSign * 0.004, 0, 0]}>
      <meshStandardMaterial map={cap.texture} roughness={0.85} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function BroccoliHalfGeometry({ isLeft = false }: { isLeft?: boolean }) {
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

export default function BroccoliModel({
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
      {/* standing up like the real vegetable, just given the tiniest lean */}
      <group rotation={[0.08, 0.3, 0]}>
        <group ref={innerA}>
          <BroccoliHalfGeometry isLeft />
        </group>
        <group ref={innerB}>
          <BroccoliHalfGeometry isLeft={false} />
        </group>
      </group>
    </group>
  );
}