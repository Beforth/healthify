import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { faceFrame, planarCap, type OutlinePoint } from './capGeo';
import { cutTextures, fleshMaterialProps, type FleshLook } from './cutMaps';
import { buildCarrotMaps } from './carrotFlesh';
import { carrotHalf, carrotOutline, RADIUS } from './carrotShape';

/** The shape of the root itself — its taper, its ribbing, its skin gradient — is
 *  in `carrotShape`, so the cut face can be measured against it without dragging a
 *  React tree into the question. */

/** How big the cut face's image is generated. The face is a shade under 300 px of
 *  canvas across its length, so anything much past this is generated, uploaded and
 *  never seen — while anything much under it dissolves the moment the halves swing
 *  open, since a cut face spends most of that swing nearly edge-on. */
const TEXTURE = 512;

/** A split carrot is wet — about 88% water — but it is a firm, dense vegetable
 *  rather than a glassy fruit, so the subsurface is a whisper and the whole of the
 *  look is the film on top. `clearcoatRoughness` is what keeps that film from
 *  reading as a glaze: at the pineapple's 0.1 the same numbers look like lacquer,
 *  and the whole point here is a cut root that is damp rather than shiny. */
const FLESH_LOOK: FleshLook = {
  transmission: 0.14,
  thickness: 0.05,
  attenuation: '#c85a10',
  attenuationDistance: 0.14,
  clearcoat: 0.45,
  clearcoatRoughness: 0.3,
  emissive: '#e8721c',
  emissiveIntensity: 0.05,
  envMapIntensity: 0.85,
  ior: 1.42,
};

/**
 * The flat face left behind by the cut, as one cap wearing the whole interior.
 *
 * It used to be four flat-coloured discs stacked a few thousandths of a unit apart,
 * which is how a boiled egg gets built: a skin rim, a bright flesh disc, a pale
 * core disc, and four little cylinders for growth rings. The stacking was the only
 * way to keep four coplanar meshes from z-fighting, and it left two artefacts — a
 * visible seam down the middle of the carrot while it was still whole, and an
 * interior with no texture in it at all. One cap with a generated image of the real
 * thing needs neither.
 */
function CutFace({ outline, faceSign }: { outline: OutlinePoint[]; faceSign: number }) {
  const cut = useMemo(() => {
    const maps = buildCarrotMaps(TEXTURE, outline);
    return {
      // Inset by 1% so the cap never pokes out through the skin. Kept shallow on
      // purpose: the inset is radial, and the root's tip is a cusp where 2% of the
      // distance to the middle is a visible nick. Anything the envelope over-covers
      // at the point is hidden by the skin sitting in the same place.
      geo: planarCap(faceFrame(outline), 0.99),
      tex: cutTextures(`carrot:${TEXTURE}`, maps, TEXTURE),
    };
  }, [outline]);

  if (!cut.geo) return null;

  return (
    <mesh geometry={cut.geo} position={[faceSign * 0.004, 0, 0]}>
      <meshPhysicalMaterial {...fleshMaterialProps(cut.tex, FLESH_LOOK)} />
    </mesh>
  );
}

/** Feathery carrot tops, built from a few tapered blades. */
function CarrotTops() {
  const blades = useMemo(
    () => [
      { rot: [0.24, 0.0, -0.36] as const, scale: 1.0 },
      { rot: [-0.18, 0.7, 0.3] as const, scale: 0.86 },
      { rot: [0.32, -0.8, 0.12] as const, scale: 0.92 },
      { rot: [-0.1, 2.1, -0.16] as const, scale: 0.8 },
    ],
    [],
  );

  return (
    <group position={[0, RADIUS * 1.6, 0]}>
      {/* the pale collar the greens sprout from */}
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.1, 0.13, 0.08, 14]} />
        <meshStandardMaterial color="#d8e8a8" roughness={0.8} />
      </mesh>

      {blades.map((b, i) => (
        <group key={i} rotation={b.rot} scale={b.scale}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.012, 0.03, 0.4, 8]} />
            <meshStandardMaterial color="#3f8f36" roughness={0.75} />
          </mesh>
          {/* three little leaflets fanned off the top of each stalk */}
          {[-0.5, 0, 0.5].map((tilt, j) => (
            <mesh
              key={j}
              position={[Math.sin(tilt) * 0.12, 0.44, Math.cos(tilt) * 0.04]}
              rotation={[0.2, 0, tilt]}
              scale={[1, 1.5, 0.35]}
            >
              <sphereGeometry args={[0.1, 10, 8]} />
              <meshStandardMaterial color="#4faa41" roughness={0.68} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function CarrotHalfGeometry({
  isLeft = false,
  showTops = false,
}: {
  isLeft?: boolean;
  showTops?: boolean;
}) {
  const { skinGeo, outline } = useMemo(() => {
    const half = carrotHalf(isLeft);
    return { skinGeo: half.skinGeo, outline: carrotOutline(half) };
  }, [isLeft]);

  const faceSign = isLeft ? -1 : 1;

  return (
    <group>
      <mesh geometry={skinGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          vertexColors
          roughness={0.48}
          clearcoat={0.25}
          clearcoatRoughness={0.45}
          envMapIntensity={0.9}
        />
      </mesh>

      <CutFace outline={outline} faceSign={faceSign} />

      {showTops && <CarrotTops />}
    </group>
  );
}

/**
 * How the root lies on each screen.
 *
 * The picker has always shown it on the diagonal, which frames a long root well
 * inside a square thumbnail. But a diagonal also turns the cut face about 80° away
 * from the camera, so on the board — the one screen where the cut is the entire
 * point — the interior was edge-on until the player dragged it round. The two
 * screens want different things and there is no pose that does both, so each gets
 * its own.
 *
 * The board pose lays the root across the frame with its length horizontal and tips
 * the face up toward the camera: measured against the cut stage's own camera at
 * `[0, 1.25, 5.6]`, this shows 90% of the face where the diagonal showed 15%. 0.95
 * rather than a full quarter turn, because 26° off the view axis still reads as a
 * solid object with depth behind the face, and it keeps the two halves' separation
 * mostly in-plane — tip it further and they part toward and away from the camera
 * instead of visibly opening.
 *
 * `lift` is only needed on the picker. The cut stage seats its food on the board by
 * measuring the model's own lowest point, which cancels any offset the model
 * carries, so lifting the root there would just float it.
 */
const POSES: Record<'picker' | 'cut', { rotation: [number, number, number]; lift: number }> = {
  picker: { rotation: [0.05, 0, 0.78], lift: 0.12 },
  cut: { rotation: [0.95, 0, Math.PI / 2], lift: 0 },
};

export default function CarrotModel({
  cutProgressRef,
  stage = 'picker',
}: {
  cutProgressRef: MutableRefObject<number>;
  cutAngle?: number;
  stage?: 'picker' | 'cut';
}) {
  const outer = useRef<THREE.Group>(null);
  const innerA = useRef<THREE.Group>(null);
  const innerB = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const squish = useRef(0);
  const [hovered, setHovered] = useState(false);
  const tickKick = useCutKick(cutProgressRef);
  const pose = POSES[stage];

  useFrame((state, delta) => {
    progress.current = THREE.MathUtils.damp(progress.current, cutProgressRef.current, 25, delta);
    const p = progress.current;
    const kick = tickKick(delta);
    // The halves part along the carrot's own axis, so every bit of separation also
    // costs height on screen — kept modest so a bigger carrot still clears the
    // canvas edge once it is open.
    const sep = p * 0.42 + kick * 0.28;

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
        (1 + wobble * 0.08) * hoverBoost,
        (1 - wobble * 0.12) * hoverBoost,
        (1 + wobble * 0.08) * hoverBoost,
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
      onPointerDown={bump}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <group position={[0, pose.lift, 0]} rotation={pose.rotation}>
        <group ref={innerA}>
          <CarrotHalfGeometry isLeft showTops />
        </group>
        <group ref={innerB}>
          <CarrotHalfGeometry isLeft={false} />
        </group>
      </group>
    </group>
  );
}
