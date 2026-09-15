import type { ThreeEvent } from '@react-three/fiber';

interface SliceLayerProps {
  /** Footprint radius of this layer, seen from above. */
  radius: number;
  /** Real thickness of this layer — this is what gives the slice actual depth. */
  height: number;
  color: string;
  roughness?: number;
  metalness?: number;
  /** When set, renders as a glossy meshPhysicalMaterial instead of plain matte. */
  clearcoat?: number;
  clearcoatRoughness?: number;
  segments?: number;
  onClick?: (e: ThreeEvent<PointerEvent>) => void;
}

/** A solid disc with real height, not a flat painted circle — stack a few of these
 * (widest/shortest first, each next one a touch taller so its caps clear the one
 * below without z-fighting) to build a cut food's cross-section as an actual volume. */
export function SliceLayer({
  radius,
  height,
  color,
  roughness = 0.55,
  metalness = 0,
  clearcoat,
  clearcoatRoughness = 0.25,
  segments = 56,
  onClick,
}: SliceLayerProps) {
  return (
    <mesh onClick={onClick} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, height, segments]} />
      {clearcoat !== undefined ? (
        <meshPhysicalMaterial
          color={color}
          roughness={roughness}
          metalness={metalness}
          clearcoat={clearcoat}
          clearcoatRoughness={clearcoatRoughness}
        />
      ) : (
        <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
      )}
    </mesh>
  );
}

interface SliceBlockProps {
  width: number;
  height: number;
  depth: number;
  color: string;
  roughness?: number;
  metalness?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  onClick?: (e: ThreeEvent<PointerEvent>) => void;
}

/** Box version of SliceLayer, for rectangular cut faces (chocolate, wafer, etc). */
export function SliceBlock({
  width,
  height,
  depth,
  color,
  roughness = 0.55,
  metalness = 0,
  clearcoat,
  clearcoatRoughness = 0.25,
  onClick,
}: SliceBlockProps) {
  return (
    <mesh onClick={onClick} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      {clearcoat !== undefined ? (
        <meshPhysicalMaterial
          color={color}
          roughness={roughness}
          metalness={metalness}
          clearcoat={clearcoat}
          clearcoatRoughness={clearcoatRoughness}
        />
      ) : (
        <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
      )}
    </mesh>
  );
}
