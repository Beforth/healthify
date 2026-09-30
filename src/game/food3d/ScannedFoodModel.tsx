import { useMemo, useRef, useState, type ComponentType, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { sliceAtX, type SlicedHalf } from './sliceMesh';

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
  roughness?: number;
  metalness?: number;
  envMapIntensity?: number;
}

interface ScannedFoodProps {
  config: ScannedFoodConfig;
  cutProgressRef: MutableRefObject<number>;
  cutAngle?: number;
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
  const upright = (geo as THREE.BufferGeometry).clone();
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

function ScannedWholeGeometry({ config, scene }: { config: ScannedFoodConfig; scene: THREE.Group }) {
  const source = useMemo(() => {
    const key = config.url;
    const cached = WHOLE_FOOD_CACHE.get(key);
    if (cached) return cached;

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

    if (geometry) {
      WHOLE_FOOD_CACHE.set(key, { geometry, map });
    }
    return { geometry, map };
  }, [config.url, scene]);

  if (!source.geometry) return null;

  const [rx, ry, rz] = config.rotate ?? [0, 0, 0];

  return (
    <group rotation={[rx, ry, rz]}>
      <mesh geometry={source.geometry} castShadow receiveShadow>
        <meshStandardMaterial
          map={source.map}
          roughness={config.roughness ?? 0.52}
          metalness={config.metalness ?? 0.04}
          envMapIntensity={config.envMapIntensity ?? 1.1}
          flatShading={false}
        />
      </mesh>
    </group>
  );
}

export default function ScannedFoodModel({ config, cutProgressRef }: ScannedFoodProps) {
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

  useFrame((state, delta) => {
    if (!config.noCut) {
      progress.current = THREE.MathUtils.damp(progress.current, cutProgressRef.current, 25, delta);
      const p = progress.current;
      const kick = tickKick(delta);
      const sep = p * 0.55 + kick * 0.32;

      if (innerA.current) {
        innerA.current.position.x = sep;
        innerA.current.rotation.y = Math.min(sep * 0.75, 0.45);
      }
      if (innerB.current) {
        innerB.current.position.x = -sep;
        innerB.current.rotation.y = -Math.min(sep * 0.75, 0.45);
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
      <group rotation={config.tilt ?? [0, 0, 0]}>
        {config.noCut ? (
          <ScannedWholeGeometry config={config} scene={scene} />
        ) : (
          sliced && (
            <>
              <group ref={innerA}>
                <mesh geometry={sliced.left.geometry} castShadow receiveShadow>
                  <meshStandardMaterial {...matProps!} />
                </mesh>
                <CutFace half={sliced.left} faceSign={-1} config={config} />
              </group>
              <group ref={innerB}>
                <mesh geometry={sliced.right.geometry} castShadow receiveShadow>
                  <meshStandardMaterial {...matProps!} />
                </mesh>
                <CutFace half={sliced.right} faceSign={1} config={config} />
              </group>
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
}> {
  return function ScannedFood(props: { cutProgressRef: MutableRefObject<number>; cutAngle?: number }) {
    return <ScannedFoodModel config={config} {...props} />;
  };
}