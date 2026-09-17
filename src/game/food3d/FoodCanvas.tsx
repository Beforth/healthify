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

/** Round cutting board pedestal matching the reference design */
function CuttingPedestal() {
  return (
    <group position={[0, -1.25, 0]}>
      {/* Soft shadow on the kitchen table */}
      <mesh position={[0, -0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.55, 36]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.14} />
      </mesh>
      {/* Round cutting board plate */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[2.25, 2.32, 0.16, 48]} />
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

  return (
    <div style={{ width: '100%', maxWidth: width, height, margin: '0 auto', touchAction: 'none' }}>
      <Canvas camera={{ position: [0, 1.25, 5.6], fov: 46 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3.2, 4.8, 3.5]} intensity={1.35} />
        <directionalLight position={[-3.5, 1.5, -2]} intensity={0.45} color="#cfe8ff" />

        <Suspense fallback={null}>
          <Environment preset="apartment" background={false} environmentIntensity={0.85} />
          {children}
          {showPedestal ? <CuttingPedestal /> : <GroundShadow />}
        </Suspense>
        <OrbitControls
          enabled={controlsEnabled}
          target={[0, 0.35, 0]}
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
