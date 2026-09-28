import { useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useCutKick } from './useCutKick';
import { buildHalfSolid } from './halfSolid';

const RADIUS = 0.86;

/** Where the cone's wide rim and its point sit, in the half's own space. The cut
 *  face of a cone is a triangle between those three corners. */
const CONE_TOP_Y = -0.42;
const CONE_TIP_Y = -1.78;
/** Close to the scoop's own width. Much narrower and the pair reads as a
 *  mushroom rather than as ice cream sitting in a cone. */
const CONE_RADIUS = 0.78;

const CREAM_PALE = new THREE.Color('#fdf1f6');
const CREAM_PINK = new THREE.Color('#f4b3cb');
const CREAM_BERRY = new THREE.Color('#e07a9f');

/** Scoop silhouette: lumpy the way a scoop is lumpy, never a clean ball, and
 *  flattened underneath where it is pressed onto the cone. */
function deformScoop(p: THREE.Vector3, ny: number) {
  const azimuth = Math.atan2(p.z, p.x);
  const lumps =
    1 + 0.075 * Math.cos(5 * azimuth) * (1 - ny * ny) + 0.04 * Math.cos(3 * azimuth + 2.1);
  p.x *= lumps;
  p.z *= lumps;

  if (ny < -0.3) p.y += 0.36 * THREE.MathUtils.smoothstep(-ny, 0.3, 1);
}

function scoopColor(p: THREE.Vector3, ny: number, target: THREE.Color) {
  target.copy(CREAM_PINK).lerp(CREAM_PALE, THREE.MathUtils.smoothstep(ny, -0.7, 0.85) * 0.45);

  // the fruit ribbon folded through while it was churned
  const ribbon = 0.5 + 0.5 * Math.sin(4 * Math.atan2(p.z, p.x) + ny * 3.1);
  target.lerp(CREAM_BERRY, ribbon * 0.24);
}

export function IceCreamHalfGeometry({ isLeft = false }: { isLeft?: boolean }) {
  const { skinGeo, cutGeo } = useMemo(
    () => buildHalfSolid(isLeft, RADIUS, deformScoop, scoopColor),
    [isLeft],
  );

  const faceSign = isLeft ? -1 : 1;

  // Half a cone, on the same side of x = 0 as this half of the scoop, so the
  // whole thing comes apart in one piece rather than the cone staying behind.
  const thetaStart = isLeft ? 0 : Math.PI;

  const coneFace = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [0, CONE_TOP_Y, CONE_RADIUS, 0, CONE_TOP_Y, -CONE_RADIUS, 0, CONE_TIP_Y, 0],
        3,
      ),
    );
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Air is nearly half of what you buy — worth seeing on the cut face.
  const bubbles = useMemo(
    () => [
      { y: 0.34, z: 0.3, r: 0.07 },
      { y: 0.12, z: -0.34, r: 0.055 },
      { y: -0.12, z: 0.14, r: 0.065 },
      { y: 0.44, z: -0.12, r: 0.045 },
      { y: -0.26, z: -0.16, r: 0.05 },
    ],
    [],
  );

  return (
    <group>
      <mesh geometry={skinGeo} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.62} envMapIntensity={0.85} />
      </mesh>

      <group position={[faceSign * 0.004, 0, 0]}>
        {/* denser and paler inside than out, the way a scoop looks when you halve it */}
        <mesh geometry={cutGeo}>
          <meshStandardMaterial color="#fbe2ec" roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={cutGeo} position={[faceSign * 0.006, 0, 0]} scale={[1, 0.94, 0.94]}>
          <meshStandardMaterial color="#fdf2f7" roughness={0.75} side={THREE.DoubleSide} />
        </mesh>

        {bubbles.map((b, i) => (
          <mesh key={i} position={[faceSign * 0.012, b.y, b.z]} scale={[0.5, 1, 1]}>
            <sphereGeometry args={[b.r, 12, 10]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Waffle cone: rotated about x so the point ends up underneath, which
          leaves the half on the same side of x = 0 that it started on. */}
      <group position={[0, (CONE_TOP_Y + CONE_TIP_Y) / 2, 0]} rotation={[Math.PI, 0, 0]}>
        <mesh castShadow receiveShadow>
          <coneGeometry
            args={[CONE_RADIUS, CONE_TIP_Y - CONE_TOP_Y, 28, 1, false, thetaStart, Math.PI]}
          />
          <meshStandardMaterial color="#d9a352" roughness={0.88} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <mesh geometry={coneFace} position={[faceSign * 0.004, 0, 0]}>
        <meshStandardMaterial color="#e8bc78" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* the rolled rim the scoop sits in */}
      <mesh position={[0, CONE_TOP_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[CONE_RADIUS * 0.97, 0.045, 8, 28, Math.PI]} />
        <meshStandardMaterial color="#c88f3c" roughness={0.85} />
      </mesh>
    </group>
  );
}

export default function IceCreamModel({
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
    const sep = p * 0.58 + kick * 0.32;

    if (innerA.current) {
      innerA.current.position.x = sep;
      innerA.current.rotation.y = Math.min(sep * 0.7, 0.45);
    }
    if (innerB.current) {
      innerB.current.position.x = -sep;
      innerB.current.rotation.y = -Math.min(sep * 0.7, 0.45);
    }

    squish.current *= Math.exp(-delta * 6);
    if (outer.current) {
      const wobble = Math.sin(state.clock.elapsedTime * 14) * squish.current;
      const hoverBoost = hovered ? 1.05 : 1;
      outer.current.scale.set(
        (1 + wobble * 0.08) * hoverBoost,
        (1 - wobble * 0.1) * hoverBoost,
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
      {/* lifted so the cone's point does not hang below the cutting board */}
      <group position={[0, 0.5, 0]} rotation={[0.08, 0, 0]}>
        <group ref={innerA}>
          <IceCreamHalfGeometry isLeft />
        </group>
        <group ref={innerB}>
          <IceCreamHalfGeometry isLeft={false} />
        </group>
      </group>
    </group>
  );
}
