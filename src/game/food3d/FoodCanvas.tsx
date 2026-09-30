import { Suspense, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';

interface FoodCanvasProps {
  children: ReactNode;
  height?: number | string;
  width?: number | string;
  autoRotate?: boolean;
  controlsEnabled?: boolean;
  showPedestal?: boolean;
}

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

export default function FoodCanvas({
  children,
  height = 260,
  width = 360,
  autoRotate = true,
  controlsEnabled = true,
  showPedestal = false,
}: FoodCanvasProps) {
  // Auto-rotate fights a hand-drag if it keeps nudging the camera mid-gesture —
  // pause it for as long as the user is actually holding the drag.
  const [interacting, setInteracting] = useState(false);

  const cameraPos: [number, number, number] = showPedestal ? [0, 1.1, 5.2] : [0, 1.25, 5.6];
  const cameraTarget: [number, number, number] = showPedestal ? [0, -0.05, 0] : [0, 0.35, 0];

  return (
    <div style={{ width: '100%', maxWidth: width, height, margin: '0 auto', touchAction: 'none' }}>
      <Canvas camera={{ position: cameraPos, fov: 46 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3.2, 4.8, 3.5]} intensity={1.35} />
        <directionalLight position={[-3.5, 1.5, -2]} intensity={0.45} color="#cfe8ff" />

        <Suspense fallback={null}>
          <Environment preset="apartment" background={false} environmentIntensity={0.85} />
        </Suspense>
        <Suspense fallback={null}>
          {children}
          {showPedestal ? <CuttingPedestal /> : <GroundShadow />}
        </Suspense>
        <OrbitControls
          enabled={controlsEnabled}
          target={cameraTarget}
          enablePan={false}
          enableZoom
          minDistance={2.8}
          maxDistance={6}
          minPolarAngle={Math.PI / 3.2}
          maxPolarAngle={Math.PI / 1.6}
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
