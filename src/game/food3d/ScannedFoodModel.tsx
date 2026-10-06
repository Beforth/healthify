import { useMemo, useRef, useState, type ComponentType, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { sliceAtX, type SlicedHalf } from './sliceMesh';
import { splitBowl } from './bowlSplit';
import { largestPart } from './meshParts';
import Hotspot from './Hotspot';

/** Shared recipe for the photoscanned glb models that show up once the scans were
 *  added for the rest of the pantry. Every one follows the exact same behaviour as
 *  the hand-built foods — auto-rotate, shadows, tap-squish, hover boost, drag-to-cut
 *  with the kick-on-complete pop — so a scan never feels like a different breed of
 *  food next to a donut. The only things that vary food-to-food are the file, which
 *  way it stands, and the invented colours of the cut face (the scan is only a shell). */
export interface ScannedFoodConfig {
  /** Base URL-relative path to the glb, e.g. `models/soyabean.glb`. */
  url: string;
  /** Uniform scale applied to the model before the fit. Sits above 1 so the scans
   *  (built near unit size) keep a sensible presence next to the code-built foods. */
  scale?: number;
  /** Model-space rotation applied to the whole food before cutting, if the scan sits
   *  in a pose that doesn't cut nicely down x = 0 — e.g. a long root lying along z. */
  rotate?: [number, number, number];
  /** Display lean on the outer group, like the hand-built foods use to tip a long
   *  vegetable over so it reads as lying on the board. Applied after cutting. */
  tilt?: [number, number, number];
  /** Invented inside palette, sampled off the real vegetable/fruit where visible. */
  rim: string;
  flesh: string;
  heart?: string;
  /** Food is already open, liquid, or loose — skip cutting and keep intact */
  noCut?: boolean;
  /** The scan is food in a bowl: everything below this fraction of its height (0 = foot,
   *  1 = top of the heap) is the bowl, repainted in `bowlColor` so it never blends into the food. */
  bowlBelow?: number;
  bowlColor?: string;
  /** The scan arrived with a piece already cut off beside it; keep only the main body. */
  keepLargest?: boolean;
  roughness?: number;
  metalness?: number;
  envMapIntensity?: number;
}

interface ScannedFoodProps {
  config: ScannedFoodConfig;
  cutProgressRef: MutableRefObject<number>;
  cutAngle?: number;
  /** The microscope panel's presentation: the halves swing open like a book so both
   *  cut faces look straight at the viewer, instead of sitting edge-on beside each other. */
  showcase?: boolean;
  stage?: 'picker' | 'cut';
  markers?: FoodMarkers;
}

/** The tappable "+" dots stuck onto the food, one per fact. */
export interface FoodMarkers {
  facts: { id: string; color: string }[];
  active: string | null;
  onSelect: (id: string | null) => void;
}

/** How big a marker looks on screen, in world units, however the food was scaled. */
const MARKER_WORLD = 0.8;

/** Keeps its children one fixed size on screen: a food is scaled by its own fit, the
 *  halves are scaled again, and a marker stuck on it would inherit all of that. */
function MarkerAt({
  position,
  fact,
  markers,
}: {
  position: [number, number, number];
  fact: { id: string; color: string };
  markers: FoodMarkers;
}) {
  const group = useRef<THREE.Group>(null);
  const world = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const g = group.current;
    if (!g?.parent) return;
    g.parent.getWorldScale(world);
    g.scale.setScalar(MARKER_WORLD / Math.max(world.x, 1e-4));
  });
  return (
    <group ref={group} position={position}>
      <Hotspot
        id={fact.id}
        position={[0, 0, 0]}
        color={fact.color}
        active={markers.active}
        onSelect={markers.onSelect}
      />
    </group>
  );
}

/** Where on a cut face each fact's marker sits: facts alternate between the halves. */
const FACE_SLOTS: [number, number][][] = [
  [[0.3, 0.2], [-0.4, -0.3], [0.0, 0.5]],
  [[0.25, -0.2], [-0.4, 0.3], [0.0, -0.5]],
];

/** Spots across the single cut face shown on the microscope panel. */
const SHOWCASE_SLOTS: [number, number][] = [[0.35, -0.3], [0.3, 0.35], [-0.35, 0.3], [-0.35, -0.35], [0.0, 0.0]];

function FaceMarkers({
  half,
  outward,
  facts,
  slots,
  markers,
}: {
  half: SlicedHalf;
  outward: number;
  facts: { id: string; color: string }[];
  slots: [number, number][];
  markers: FoodMarkers;
}) {
  const { yMin, yMax, zMin, zMax } = half.cut;
  const cy = (yMin + yMax) / 2;
  const cz = (zMin + zMax) / 2;
  return (
    <>
      {facts.map((f, i) => {
        const [dy, dz] = slots[i % slots.length];
        return (
          <MarkerAt
            key={f.id}
            fact={f}
            markers={markers}
            position={[outward * 0.03, cy + dy * (yMax - yMin) * 0.5, cz + dz * (zMax - zMin) * 0.5]}
          />
        );
      })}
    </>
  );
}

/** Spots on top of a whole (uncut) food: the highest point of the scan near each slot. */
function surfaceSlots(geo: THREE.BufferGeometry, count: number): [number, number, number][] {
  geo.computeBoundingBox();
  const box = geo.boundingBox!;
  const w = box.max.x - box.min.x;
  const d = box.max.z - box.min.z;
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const spots: [number, number][] = [[-0.22, 0.12], [0.2, -0.14], [0.02, 0.3], [-0.05, -0.3], [0.3, 0.25]];
  return spots.slice(0, Math.max(count, 1)).map(([fx, fz]) => {
    const x = (box.min.x + box.max.x) / 2 + fx * w;
    const z = (box.min.z + box.max.z) / 2 + fz * d;
    const r = Math.max(w, d) * 0.12;
    let top = -Infinity;
    for (let i = 0; i < pos.count; i += 2) {
      if (Math.abs(pos.getX(i) - x) < r && Math.abs(pos.getZ(i) - z) < r) top = Math.max(top, pos.getY(i));
    }
    return [x, (Number.isFinite(top) ? top : box.max.y) + 0.02, z];
  });
}

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

function CutFace({ half, faceSign, config }: { half: SlicedHalf; faceSign: number; config: ScannedFoodConfig }) {
  const layers = useMemo(
    () => ({
      rim: cutCap(half.outline, 0.97),
      flesh: cutCap(half.outline, 0.9),
      heart: config.heart ? cutCap(half.outline, 0.55) : null,
    }),
    [half.outline, config.heart],
  );

  if (!layers.rim) return null;

  return (
    <group>
      <mesh geometry={layers.rim} position={[faceSign * 0.004, 0, 0]}>
        <meshStandardMaterial color={config.rim} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      {layers.flesh && (
        <mesh geometry={layers.flesh} position={[faceSign * 0.006, 0, 0]}>
          <meshStandardMaterial color={config.flesh} roughness={0.65} side={THREE.DoubleSide} />
        </mesh>
      )}
      {layers.heart && (
        <mesh geometry={layers.heart} position={[faceSign * 0.008, 0, 0]}>
          <meshStandardMaterial color={config.heart} roughness={0.65} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

interface SlicedCacheEntry {
  left: SlicedHalf;
  right: SlicedHalf;
  map: THREE.Texture | null;
}

const SLICED_FOOD_CACHE = new Map<string, SlicedCacheEntry>();
const WHOLE_FOOD_CACHE = new Map<string, { geometry: THREE.BufferGeometry; map: THREE.Texture | null }>();

function getOrComputeSliced(config: ScannedFoodConfig, scene: THREE.Group): SlicedCacheEntry | null {
  const key = `${config.url}:${(config.rotate ?? []).join(',')}`;
  const cached = SLICED_FOOD_CACHE.get(key);
  if (cached) return cached;

  let geo: THREE.BufferGeometry | null = null;
  let map: THREE.Texture | null = null;
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (geo || !mesh.isMesh) return;
    geo = mesh.geometry;
    const material = mesh.material as THREE.MeshStandardMaterial;
    map = material?.map ?? null;
  });

  if (!geo) return null;

  // Clone geometry once to rotate upright for slicing
  const upright = (config.keepLargest ? largestPart(geo as THREE.BufferGeometry) : (geo as THREE.BufferGeometry)).clone();
  if (!upright.attributes.normal) upright.computeVertexNormals();

  const [rx, ry, rz] = config.rotate ?? [0, 0, 0];
  upright.rotateX(rx);
  upright.rotateY(ry);
  upright.rotateZ(rz);

  // Compute both halves in sequence from the same upright geometry
  const right = sliceAtX(upright, true);
  if (right.geometry && !right.geometry.attributes.normal) {
    right.geometry.computeVertexNormals();
  }

  const left = sliceAtX(upright, false);
  if (left.geometry && !left.geometry.attributes.normal) {
    left.geometry.computeVertexNormals();
  }

  upright.dispose();

  const entry: SlicedCacheEntry = { left, right, map };
  SLICED_FOOD_CACHE.set(key, entry);
  return entry;
}

function ScannedWholeGeometry({
  config,
  scene,
  markers,
}: {
  config: ScannedFoodConfig;
  scene: THREE.Group;
  markers?: FoodMarkers;
}) {
  const source = useMemo(() => {
    const key = config.url;
    const cached = WHOLE_FOOD_CACHE.get(key);
    if (cached) return cached;

    let geometry: THREE.BufferGeometry | null = null;
    let map: THREE.Texture | null = null;

    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (geometry || !mesh.isMesh) return;
      geometry = (config.keepLargest ? largestPart(mesh.geometry) : mesh.geometry).clone();
      if (!geometry.attributes.normal) {
        geometry.computeVertexNormals();
      }
      const material = mesh.material as THREE.MeshStandardMaterial;
      map = material?.map ?? null;
    });

    if (geometry) {
      WHOLE_FOOD_CACHE.set(key, { geometry, map });
    }
    return { geometry, map };
  }, [config.url, scene]);

  const spots = useMemo(
    () => (markers && source.geometry ? surfaceSlots(source.geometry, markers.facts.length) : []),
    [markers, source.geometry],
  );
  if (!source.geometry) return null;

  const [rx, ry, rz] = config.rotate ?? [0, 0, 0];

  const parts = config.bowlBelow !== undefined ? splitBowl(source.geometry, config.bowlBelow) : null;

  return (
    <group rotation={[rx, ry, rz]}>
      <mesh geometry={parts ? parts.food : source.geometry} castShadow receiveShadow>
        <meshStandardMaterial
          map={source.map}
          roughness={config.roughness ?? 0.52}
          metalness={config.metalness ?? 0.04}
          envMapIntensity={config.envMapIntensity ?? 1.1}
          flatShading={false}
          side={parts ? THREE.DoubleSide : THREE.FrontSide}
        />
      </mesh>
      {parts && (
        <mesh geometry={parts.bowl} castShadow receiveShadow>
          <meshStandardMaterial
            color={config.bowlColor ?? '#4a7fb5'}
            roughness={0.45}
            metalness={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {markers &&
        markers.facts.map((f, i) => spots[i] && <MarkerAt key={f.id} fact={f} markers={markers} position={spots[i]} />)}
    </group>
  );
}

export default function ScannedFoodModel({ config, cutProgressRef, showcase = false, markers }: ScannedFoodProps) {
  const outer = useRef<THREE.Group>(null);
  const innerA = useRef<THREE.Group>(null);
  const innerB = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const squish = useRef(0);
  const [hovered, setHovered] = useState(false);
  const tickKick = useCutKick(cutProgressRef);
  const scale = config.scale ?? 2.1;

  const { scene } = useGLTF(`${import.meta.env.BASE_URL}${config.url}`);
  const sliced = useMemo(() => {
    if (config.noCut) return null;
    return getOrComputeSliced(config, scene);
  }, [config, scene]);

  // How far each half slides is a fraction of the food's own half-width. A fixed
  // distance was fine for a pumpkin but threw a small scan (a pancake stack is under
  // half a unit wide) so far apart that the pair no longer fitted the canvas.
  const reach = useMemo(() => {
    const geo = sliced?.right.geometry;
    if (!geo) return 1;
    geo.computeBoundingBox();
    return Math.min(1, Math.max(0.5, (geo.boundingBox?.max.x ?? 0.5) * 2));
  }, [sliced]);

  // How far apart book-open halves must sit to clear each other: half the cut face's
  // width, plus how far the body of the half still reaches sideways once it has swung.
  // A long food (a cucumber is twice as long as it is wide) otherwise has its two
  // bodies pile up behind the faces.
  // A long, thin food (a cob, a cucumber) swung all the way round points its body away
  // from the camera and shows only a small end face, so those open less and stay legible.
  const swing = useMemo(() => {
    const cut = sliced?.right.cut;
    const geo = sliced?.right.geometry;
    const face = cut ? Math.max(0.1, (cut.zMax - cut.zMin) / 2) : 0.4;
    geo?.computeBoundingBox();
    const body = geo?.boundingBox?.max.x ?? 0.5;
    return body > face * 1.9 ? 0.75 : 1.25;
  }, [sliced]);

  useFrame((state, delta) => {
    if (!config.noCut && showcase) {
      progress.current = THREE.MathUtils.damp(progress.current, cutProgressRef.current, 6, delta);
      const p = progress.current;
      // one half, face to the camera and centred: the microscope panel is about the cut
      // face, and a second half only halves the size of the one you are looking at
      if (innerA.current) {
        innerA.current.position.x = 0;
        innerA.current.rotation.y = -p * swing;
      }
    } else if (!config.noCut) {
      progress.current = THREE.MathUtils.damp(progress.current, cutProgressRef.current, 25, delta);
      const p = progress.current;
      const kick = tickKick(delta);
      const open = p * 0.55 + kick * 0.32;
      // the halves only need to clear each other and show their faces: pulled any further
      // apart the live fit has to shrink the whole food to keep both on the board
      const sep = open * reach * 0.6;

      // each half stays on its own side: the left of the scan slides left and the right
      // slides right, so the cut faces end up facing each other like a loaf pulled apart
      if (innerA.current) {
        innerA.current.position.x = -sep;
        innerA.current.rotation.y = -Math.min(open * 0.75, 0.45);
      }
      if (innerB.current) {
        innerB.current.position.x = sep;
        innerB.current.rotation.y = Math.min(open * 0.75, 0.45);
      }
    }

    squish.current *= Math.exp(-delta * 6);
    if (outer.current) {
      const wobble = Math.sin(state.clock.elapsedTime * 14) * squish.current;
      const hoverBoost = hovered ? 1.05 : 1;
      outer.current.scale.set(
        scale * (1 + wobble * 0.08) * hoverBoost,
        scale * (1 - wobble * 0.1) * hoverBoost,
        scale * (1 + wobble * 0.08) * hoverBoost,
      );
      outer.current.position.y =
        !config.noCut && cutProgressRef.current > 0.02
          ? 0
          : Math.sin(state.clock.elapsedTime * 1.6) * 0.04;
    }
  });

  const bump = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    squish.current = 1;
  };

  const matProps = sliced ? {
    map: sliced.map,
    roughness: config.roughness ?? 0.52,
    metalness: config.metalness ?? 0.04,
    envMapIntensity: config.envMapIntensity ?? 1.1,
    flatShading: false,
  } : null;

  return (
    <group
      ref={outer}
      onPointerDown={bump}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <group rotation={showcase ? [(config.tilt?.[0] ?? 0) * 0.5, 0, 0] : (config.tilt ?? [0, 0, 0])}>
        {config.noCut ? (
          <ScannedWholeGeometry config={config} scene={scene} markers={markers} />
        ) : (
          sliced && (
            <>
              <group ref={innerA}>
                <mesh geometry={sliced.left.geometry} castShadow receiveShadow>
                  <meshStandardMaterial {...matProps!} />
                </mesh>
                <CutFace half={sliced.left} faceSign={1} config={config} />
                {markers && (
                  <FaceMarkers
                    half={sliced.left}
                    outward={1}
                    facts={showcase ? markers.facts : markers.facts.filter((_, i) => i % 2 === 0)}
                    slots={showcase ? SHOWCASE_SLOTS : FACE_SLOTS[0]}
                    markers={markers}
                  />
                )}
              </group>
              {!showcase && <group ref={innerB}>
                <mesh geometry={sliced.right.geometry} castShadow receiveShadow>
                  <meshStandardMaterial {...matProps!} />
                </mesh>
                <CutFace half={sliced.right} faceSign={-1} config={config} />
                {markers && (
                  <FaceMarkers
                    half={sliced.right}
                    outward={-1}
                    facts={markers.facts.filter((_, i) => i % 2 === 1)}
                    slots={FACE_SLOTS[1]}
                    markers={markers}
                  />
                )}
              </group>}
            </>
          )
        )}
      </group>
    </group>
  );
}

/** Builds a FOOD_MODELS entry for a scanned glb on demand. */
export function scannedFood(config: ScannedFoodConfig): ComponentType<{
  cutProgressRef: MutableRefObject<number>;
  cutAngle?: number;
  showcase?: boolean;
  stage?: 'picker' | 'cut';
  markers?: FoodMarkers;
}> {
  return function ScannedFood(props: Omit<ScannedFoodProps, 'config'>) {
    return <ScannedFoodModel config={config} {...props} />;
  };
}