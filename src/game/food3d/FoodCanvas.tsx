import { Component, Suspense, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface FoodCanvasProps {
  children: ReactNode;
  height?: number | string;
  width?: number | string;
  autoRotate?: boolean;
  controlsEnabled?: boolean;
  showPedestal?: boolean;
  /** For a canvas that sits inside a scrolling page. Leaves vertical swipes to the
   *  page (so a thumb on the model can still scroll), spins sideways only, and
   *  stops the mouse wheel from zooming instead of scrolling. */
  scrollFriendly?: boolean;
}

/** The camera's resting polar angle, from its position and orbit target. */
const REST_POLAR = Math.acos((1.25 - 0.35) / Math.hypot(5.6, 1.25 - 0.35));

/** The plate is a short cylinder hanging below the origin, so the surface a food
 *  actually rests on is nowhere near y = 0. Every measurement of it lives here so
 *  the food can be sat on the board and the board itself can never drift apart
 *  from that. */
const BOARD_Y = -1.25;
const BOARD_THICKNESS = 0.16;
const BOARD_RADIUS_TOP = 2.25;
const BOARD_RADIUS_BOTTOM = 2.32;

/** The world height of the cutting board's top surface. A food on the board is
 *  fitted to this, not to the origin — otherwise the tallest foods sink through
 *  the plate, since a fit centred on y = 0 leaves them hanging below its edge. */
export const BOARD_TOP_Y = BOARD_Y + BOARD_THICKNESS / 2;

/** How far out from the middle the board reaches, as a square corner-to-axis
 *  radius. A food whose corners pass this is off the edge of the plate. */
export const BOARD_RADIUS = BOARD_RADIUS_TOP;

/** Round cutting board pedestal matching the reference design */
function CuttingPedestal() {
  return (
    <group position={[0, BOARD_Y, 0]}>
      {/* Soft shadow on the kitchen table */}
      <mesh position={[0, -0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.55, 36]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.14} />
      </mesh>
      {/* Round cutting board plate */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[BOARD_RADIUS_TOP, BOARD_RADIUS_BOTTOM, BOARD_THICKNESS, 48]} />
        <meshStandardMaterial color="#d5e8dd" roughness={0.55} />
      </mesh>
      {/* Subtle recessed inner top rim */}
      <mesh position={[0, 0.082, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.18, 48]} />
        <meshStandardMaterial color="#cbe2d4" roughness={0.45} />
      </mesh>
    </group>
  );
}

/** A cheap, static "grounding" shadow — no real-time shadow map, no per-frame cost. */
function GroundShadow() {
  return (
    <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[1.6, 32]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.16} />
    </mesh>
  );
}

/** Subtle animated 3D placeholder while the food GLB parses */
function ModelLoadingPlaceholder() {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 2.2;
      group.current.position.y = BOARD_TOP_Y + 0.45 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
    }
  });

  return (
    <group ref={group} position={[0, BOARD_TOP_Y + 0.45, 0]}>
      <mesh>
        <torusGeometry args={[0.55, 0.035, 16, 40]} />
        <meshStandardMaterial
          color="#2ecc71"
          emissive="#2ecc71"
          emissiveIntensity={0.6}
          roughness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial
          color="#48bb78"
          emissive="#38a169"
          emissiveIntensity={0.75}
          roughness={0.25}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}

class CanvasErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.warn('3D model load error caught by canvas boundary:', error);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default function FoodCanvas({
  children,
  height = 260,
  width = 360,
  autoRotate = true,
  controlsEnabled = true,
  showPedestal = false,
  scrollFriendly = false,
}: FoodCanvasProps) {
  // Auto-rotate fights a hand-drag if it keeps nudging the camera mid-gesture —
  // pause it for as long as the user is actually holding the drag.
  const [interacting, setInteracting] = useState(false);

  const cameraPos: [number, number, number] = showPedestal ? [0, 1.1, 5.2] : [0, 1.25, 5.6];
  const cameraTarget: [number, number, number] = showPedestal ? [0, -0.05, 0] : [0, 0.35, 0];

  // Detect mobile or touch environment where vertical page scroll must never be hijacked
  const isTouchDevice = typeof window !== 'undefined' && (
    window.matchMedia?.('(pointer: coarse)').matches === true ||
    window.matchMedia?.('(max-width: 768px)').matches === true ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
  const allowPageScroll = scrollFriendly || isTouchDevice;

  return (
    <div style={{ width: '100%', maxWidth: width, height, margin: '0 auto', touchAction: allowPageScroll ? 'pan-y' : 'none' }}>
      <Canvas
        camera={{ position: cameraPos, fov: 46 }}
        dpr={[1, 1.5]}
        style={{ touchAction: allowPageScroll ? 'pan-y' : 'none', width: '100%', height: '100%' }}
        onCreated={(state) => {
          if (allowPageScroll) {
            state.gl.domElement.style.touchAction = 'pan-y';
          }
        }}
      >
        {/* Studio multi-light setup: instant, zero network dependencies, 60fps */}
        <ambientLight intensity={0.68} />
        <directionalLight position={[3.5, 5.2, 3.8]} intensity={1.38} />
        <directionalLight position={[-3.8, 1.8, -2.2]} intensity={0.48} color="#cfe8ff" />
        <directionalLight position={[0, -2, 2.5]} intensity={0.22} color="#fff6e8" />

        {/* Board and table pedestal render immediately without waiting for model */}
        {showPedestal ? <CuttingPedestal /> : <GroundShadow />}

        {/* Model stream: Suspends independently with a 3D placeholder */}
        <CanvasErrorBoundary>
          <Suspense fallback={<ModelLoadingPlaceholder />}>
            {children}
          </Suspense>
        </CanvasErrorBoundary>

        <OrbitControls
          enabled={controlsEnabled && !allowPageScroll}
          target={cameraTarget}
          enablePan={false}
          enableZoom={!allowPageScroll}
          minDistance={2.8}
          maxDistance={6}
          minPolarAngle={allowPageScroll ? REST_POLAR : Math.PI / 3.2}
          maxPolarAngle={allowPageScroll ? REST_POLAR : Math.PI / 1.6}
          enableDamping
          dampingFactor={0.12}
          autoRotate={autoRotate && !interacting}
          autoRotateSpeed={1.4}
          onStart={() => setInteracting(true)}
          onEnd={() => setInteracting(false)}
        />
      </Canvas>
    </div>
  );
}
