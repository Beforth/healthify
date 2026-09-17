import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

const COMPLETE_THRESHOLD = 0.76;
const PIXEL_TO_WORLD = 0.0092;
const BLADE_LEN = 1.5;
const TRAIL_LEN = 5;

// Rest position directly above the food, matching the reference image
const DEFAULT_REST_X = 0.25;
const DEFAULT_REST_Y = 1.35;
const DEFAULT_REST_Z = 1.8;
const DEFAULT_TILT = -0.34; // slight downward angle like the reference photo

interface Knife3DProps {
  /** Written to continuously (0..1) as the blade travels across the food. */
  progressRef: MutableRefObject<number>;
  /** Called once, the moment the cut is completed. */
  onComplete: () => void;
  /** Cut angle in radians (optional). */
  angle?: number;
  /** Once the cut is done, the knife has nothing left to do — stop it from
   *  swallowing pointer events so whatever's drawn behind it (the food, wrapped
   *  in its own DragRotate) can be grabbed and spun instead. */
  disabled?: boolean;
}

function useBladeShape() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    // Spine (top edge)
    shape.moveTo(0, 0.23);
    shape.lineTo(BLADE_LEN * 0.7, 0.18);
    shape.quadraticCurveTo(BLADE_LEN * 0.94, 0.08, BLADE_LEN, -0.02);
    // Cutting edge (curved belly to tip)
    shape.quadraticCurveTo(BLADE_LEN * 0.88, -0.18, BLADE_LEN * 0.65, -0.22);
    shape.lineTo(0, -0.23);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.085,
      bevelEnabled: true,
      bevelThickness: 0.016,
      bevelSize: 0.016,
      bevelSegments: 3,
    });
  }, []);
}

/** Animated dashed arrow pointing down towards the food, matching the reference image */
function DownwardGuideArrow({ opacity }: { opacity: number }) {
  const arrowRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (arrowRef.current) {
      arrowRef.current.position.y = 0.85 + Math.sin(state.clock.elapsedTime * 3.5) * 0.06;
    }
  });

  if (opacity <= 0.01) return null;

  return (
    <group ref={arrowRef} position={[0, 0.85, 1.4]}>
      {/* Dashed line segments */}
      {[-0.05, 0.12, 0.28].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[0.032, 0.09, 0.01]} />
          <meshBasicMaterial color="#1f7a4d" transparent opacity={opacity * 0.85} />
        </mesh>
      ))}
      {/* Downward arrowhead cone */}
      <mesh position={[0, -0.16, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.085, 0.14, 16]} />
        <meshBasicMaterial color="#1f7a4d" transparent opacity={opacity * 0.95} />
      </mesh>
    </group>
  );
}

export default function Knife3D({
  progressRef,
  onComplete,
  angle = DEFAULT_TILT,
  disabled = false,
}: Knife3DProps) {
  const group = useRef<THREE.Group>(null);
  const bladeGeo = useBladeShape();
  const trailRefs = useRef<(THREE.Mesh | null)[]>([]);
  const trailHistory = useRef<{ x: number; y: number }[]>(
    Array(TRAIL_LEN).fill({ x: DEFAULT_REST_X, y: DEFAULT_REST_Y }),
  );

  const dragging = useRef(false);
  const locked = useRef(false);
  const [guideOpacity, setGuideOpacity] = useState(1);

  const restPos = useMemo(() => {
    return { x: DEFAULT_REST_X, y: DEFAULT_REST_Y };
  }, []);

  const posTarget = useRef({ x: restPos.x, y: restPos.y });
  const startClient = useRef({ x: 0, y: 0 });
  const startTarget = useRef({ x: restPos.x, y: restPos.y });
  const lastPos = useRef({ x: restPos.x, y: restPos.y });
  const speed = useRef(0);
  const wobbleSeed = useRef(4.2);

  useEffect(() => {
    if (!dragging.current && !locked.current) {
      posTarget.current.x = restPos.x;
      posTarget.current.y = restPos.y;
    }
  }, [restPos]);

  const computeProgress = (y: number) => {
    // Distance from rest (1.35) down to bottom (-1.0)
    const span = 2.2;
    return THREE.MathUtils.clamp((DEFAULT_REST_Y - y) / span, 0, 1);
  };

  const startDrag = (clientX: number, clientY: number) => {
    if (locked.current || dragging.current) return;
    dragging.current = true;
    setGuideOpacity(0);
    startClient.current = { x: clientX, y: clientY };
    startTarget.current = { ...posTarget.current };

    const handleMove = (ev: PointerEvent) => {
      if (locked.current) return;
      const dx = (ev.clientX - startClient.current.x) * PIXEL_TO_WORLD;
      const dy = -(ev.clientY - startClient.current.y) * PIXEL_TO_WORLD;

      const newX = THREE.MathUtils.clamp(startTarget.current.x + dx, -1.8, 1.8);
      const newY = THREE.MathUtils.clamp(startTarget.current.y + dy, -1.2, 1.6);
      posTarget.current = { x: newX, y: newY };

      const p = computeProgress(newY);
      progressRef.current = p;

      if (p >= 0.95 && !locked.current) {
        locked.current = true;
        progressRef.current = 1;
        onComplete();
      }
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      dragging.current = false;

      if (locked.current) return;

      const p = computeProgress(posTarget.current.y);
      if (p >= COMPLETE_THRESHOLD) {
        // Complete the slice!
        posTarget.current = { x: 0, y: -1.1 };
        locked.current = true;
        progressRef.current = 1;
        onComplete();
      } else {
        // Return to rest position
        posTarget.current = { x: restPos.x, y: restPos.y };
        progressRef.current = 0;
        setGuideOpacity(1);
      }
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  };

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    startDrag(e.nativeEvent.clientX, e.nativeEvent.clientY);
  };

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;

    if (dragging.current) {
      g.position.x = posTarget.current.x;
      g.position.y = posTarget.current.y;
    } else {
      if (progressRef.current > 0) {
        posTarget.current.y = DEFAULT_REST_Y - progressRef.current * 2.2;
      }
      g.position.x = THREE.MathUtils.damp(g.position.x, posTarget.current.x, 14, delta);
      g.position.y = THREE.MathUtils.damp(g.position.y, posTarget.current.y, 14, delta);
    }

    const distMoved = Math.hypot(lastPos.current.x - g.position.x, lastPos.current.y - g.position.y);
    speed.current = THREE.MathUtils.damp(speed.current, distMoved / Math.max(delta, 0.001), 8, delta);
    lastPos.current = { x: g.position.x, y: g.position.y };

    // Tactile slicing wobble
    const t = state.clock.elapsedTime + wobbleSeed.current;
    const wobbleAmount = dragging.current
      ? THREE.MathUtils.clamp(Math.abs(speed.current) * 0.025, 0, 0.12)
      : 0;

    g.rotation.z = angle + Math.sin(t * 24) * wobbleAmount;
    g.rotation.x = Math.sin(t * 18 + 1) * wobbleAmount * 0.35;

    // Update motion trail
    trailHistory.current.pop();
    trailHistory.current.unshift({ x: g.position.x, y: g.position.y });
    trailRefs.current.forEach((m, i) => {
      if (!m) return;
      const hist = trailHistory.current[i + 1] ?? { x: g.position.x, y: g.position.y };
      m.position.x = hist.x - g.position.x;
      m.position.y = hist.y - g.position.y;
      const mat = m.material as THREE.MeshBasicMaterial;
      const targetOpacity = dragging.current ? 0.22 - i * 0.045 : 0;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, Math.max(targetOpacity, 0), 12, delta);
    });
  });

  return (
    <>
      <DownwardGuideArrow opacity={guideOpacity} />

      {/* Invisible broad grab plane covering the whole canvas — forgiving so kids don't need
          to hit the thin blade exactly. Once the cut is done there's nothing left to drag, so
          it stops listening entirely and lets DragRotate on the food take pointer events instead. */}
      {!disabled && (
        <mesh visible={false} position={[0, 0, 1.7]} onPointerDown={onPointerDown}>
          <planeGeometry args={[14, 12]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

      <group
        ref={group}
        position={[DEFAULT_REST_X, DEFAULT_REST_Y, DEFAULT_REST_Z]}
        rotation={[0, 0, angle]}
        onPointerDown={disabled ? undefined : onPointerDown}
      >
        {/* Fading trail ghosts */}
        {Array.from({ length: TRAIL_LEN - 1 }).map((_, i) => (
          <mesh
            key={i}
            ref={(el) => {
              trailRefs.current[i] = el;
            }}
            geometry={bladeGeo}
            position={[0, 0, -0.042]}
          >
            <meshBasicMaterial color="#eef2f5" transparent opacity={0} depthWrite={false} />
          </mesh>
        ))}

        {/* Blade: Stainless Steel Satin Finish */}
        <mesh geometry={bladeGeo} position={[0, 0, -0.042]}>
          <meshStandardMaterial color="#f2f5f8" metalness={0.48} roughness={0.16} />
        </mesh>

        {/* Shiny Spine Glint */}
        <mesh position={[BLADE_LEN * 0.45, 0.18, 0.001]}>
          <boxGeometry args={[BLADE_LEN * 0.82, 0.026, 0.03]} />
          <meshStandardMaterial color="#ffffff" metalness={0.2} roughness={0.04} />
        </mesh>

        {/* Polished Bolster */}
        <mesh position={[-0.1, -0.02, 0]}>
          <boxGeometry args={[0.16, 0.38, 0.22]} />
          <meshStandardMaterial color="#c2c7ce" metalness={0.65} roughness={0.25} />
        </mesh>

        {/* Ergonomic Matte Black Handle */}
        <mesh position={[-0.58, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.145, 0.74, 4, 12]} />
          <meshStandardMaterial color="#1e2226" roughness={0.45} />
        </mesh>

        {/* 3 Silver Rivets matching the reference image */}
        {[-0.32, -0.56, -0.8].map((x, i) => (
          <group key={i}>
            {/* Front rivet */}
            <mesh position={[x, -0.02, 0.14]}>
              <sphereGeometry args={[0.03, 10, 10]} />
              <meshStandardMaterial color="#dcdfe3" metalness={0.55} roughness={0.25} />
            </mesh>
            {/* Back rivet */}
            <mesh position={[x, -0.02, -0.14]}>
              <sphereGeometry args={[0.03, 10, 10]} />
              <meshStandardMaterial color="#dcdfe3" metalness={0.55} roughness={0.25} />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
}
