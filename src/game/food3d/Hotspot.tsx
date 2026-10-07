import { useMemo, useRef, useState } from 'react';
import { Billboard } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

interface HotspotProps {
  id: string;
  position: [number, number, number];
  color: string;
  active: string | null;
  onSelect: (id: string | null) => void;
  /** Markers live inside each food's own scaled group, so a small model needs
   *  smaller markers to stop the dots swallowing the food. */
  scale?: number;
}

/** A marker's on-screen size, as a multiple of its drawn size once every parent scale is
 *  divided out. Fixed, so it no longer depends on the food's own scale or how far the fit
 *  zoomed — the per-food `scale` prop is now only the starting value. */
const WORLD_SIZE = 1.8;
const WORLD_SIZE_NARROW = 1.6;

/** One soft radial-gradient disc, shared by every marker and simply tinted per
 *  marker. A painted falloff reads as a glow; a hard-edged ring reads as a
 *  stray circle sitting on the food, which is what the first pass looked like. */
let glowTexture: THREE.Texture | null = null;
function getGlowTexture() {
  if (glowTexture) return glowTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  glowTexture = new THREE.CanvasTexture(canvas);
  return glowTexture;
}

/**
 * A "poke me" marker stuck onto the 3D food itself.
 *
 * Children don't read instructions — they tap whatever is glowing and moving.
 * Chips in a row under the canvas are a grown-up's idea of an affordance; a
 * pulsing bead sitting ON the mango is a child's. Every marker carries a white
 * "+" until it is opened, so the invitation is explicit rather than implied.
 *
 * Once something IS open, the other markers fade back and shrink so the chosen
 * one is unmistakably the thing the card below is talking about.
 */
export default function Hotspot({ id, position, color, active, onSelect, scale = 1 }: HotspotProps) {
  // On a phone the whole canvas is a third as wide, so the same dot is a third as easy to
  // spot and to hit. Narrow canvases get a clearly bigger dot, with a bigger tap target.
  const isActive = active === id;
  const isDimmed = active !== null && !isActive;
  const ripple = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  const body = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const billboard = useRef<THREE.Group>(null);
  const worldScale = useMemo(() => new THREE.Vector3(), []);
  const [hovered, setHovered] = useState(false);

  const tex = useMemo(() => getGlowTexture(), []);
  // a slightly lighter shade of the marker colour, for the bead's top highlight
  const tint = useMemo(() => new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.45), [color]);

  const narrow = useThree((state) => state.size.width < 500);

  useFrame((state, delta) => {
    // The markers sit inside scaled groups (per-food scale × FitScale), so a small cut piece
    // that gets zoomed to fill the panel would zoom its dots too. Cap their on-screen size.
    const bb = billboard.current;
    if (bb?.parent) {
      bb.parent.getWorldScale(worldScale);
      bb.scale.setScalar((narrow ? WORLD_SIZE_NARROW : WORLD_SIZE) / Math.max(worldScale.x, 1e-3));
    }
    const t = state.clock.elapsedTime;
    // stagger by position so the markers do not all breathe in lockstep
    const phase = (t * 0.62 + position[1] * 0.3 + position[2] * 0.17) % 1;

    if (ripple.current) {
      // the ripple is the "untouched, tap me" signal — it stops once opened
      const s = 1 + phase * 1.35;
      ripple.current.scale.set(s, s, 1);
      const mat = ripple.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isActive ? 0 : (1 - phase) * (isDimmed ? 0.08 : 0.3);
    }

    if (glow.current) {
      const target = isActive ? 1.4 : hovered ? 1.15 : 1 + Math.sin(t * 2.2) * 0.06;
      glow.current.scale.setScalar(THREE.MathUtils.damp(glow.current.scale.x, target, 10, delta));
      const mat = glow.current.material as THREE.MeshBasicMaterial;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, isActive ? 0.95 : isDimmed ? 0.12 : 0.42, 10, delta);
    }

    if (halo.current) {
      halo.current.rotation.z += delta * 0.9;
      const mat = halo.current.material as THREE.MeshBasicMaterial;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, isActive ? 0.9 : 0, 12, delta);
      const s = THREE.MathUtils.damp(halo.current.scale.x, isActive ? 1 : 0.6, 12, delta);
      halo.current.scale.setScalar(s);
    }

    if (body.current) {
      const target = isActive ? 1.35 : hovered ? 1.14 : isDimmed ? 0.8 : 1;
      body.current.scale.setScalar(THREE.MathUtils.damp(body.current.scale.x, target, 12, delta));
      const fade = isDimmed ? 0.65 : 1;
      body.current.traverse((o) => {
        const mat = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
        if (!mat || mat.opacity === undefined) return;
        const base = (o.userData.baseOpacity as number) ?? 1;
        mat.opacity = THREE.MathUtils.damp(mat.opacity, base * fade, 10, delta);
      });
    }
  });

  const pick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(isActive ? null : id);
  };

  const enter = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const leave = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  return (
    <Billboard ref={billboard} position={position} scale={scale} renderOrder={10}>
      <group onClick={pick} onPointerOver={enter} onPointerOut={leave}>
        {/* Generously sized tap target */}
        <mesh userData={{ isHotspot: true }}>
          <circleGeometry args={[0.26, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
        </mesh>

        <mesh ref={glow} position={[0, 0, -0.002]} userData={{ isHotspot: true }}>
          <planeGeometry args={[0.28, 0.28]} />
          <meshBasicMaterial
            map={tex}
            color={color}
            transparent
            opacity={0.42}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>

        <mesh ref={ripple} position={[0, 0, -0.001]} userData={{ isHotspot: true }}>
          <ringGeometry args={[0.09, 0.108, 36]} />
          <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} depthTest={false} />
        </mesh>

        <mesh ref={halo} userData={{ isHotspot: true }}>
          <ringGeometry args={[0.115, 0.138, 4, 1, 0, Math.PI * 2]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} depthTest={false} />
        </mesh>

        <group ref={body}>
          {/* soft drop shadow */}
          <mesh position={[0, -0.01, 0]} userData={{ isHotspot: true, baseOpacity: 0.22 }}>
            <circleGeometry args={[0.098, 24]} />
            <meshBasicMaterial color="#0d3a26" transparent opacity={0.22} depthWrite={false} depthTest={false} />
          </mesh>
          {/* white collar */}
          <mesh position={[0, 0, 0.001]} userData={{ isHotspot: true }}>
            <circleGeometry args={[0.095, 28]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={1} depthWrite={false} depthTest={false} />
          </mesh>
          {/* colored bead */}
          <mesh position={[0, 0, 0.002]} userData={{ isHotspot: true }}>
            <circleGeometry args={[0.076, 28]} />
            <meshBasicMaterial color={color} transparent opacity={1} depthWrite={false} depthTest={false} />
          </mesh>
          {/* glossy top light */}
          <mesh position={[-0.02, 0.026, 0.003]} scale={[1, 0.68, 1]} userData={{ isHotspot: true, baseOpacity: 0.55 }}>
            <circleGeometry args={[0.035, 16]} />
            <meshBasicMaterial color={tint} transparent opacity={0.55} depthWrite={false} depthTest={false} />
          </mesh>

          {/* "+" while closed, "–" once open */}
          <mesh position={[0, 0, 0.004]} userData={{ isHotspot: true }}>
            <planeGeometry args={[0.065, 0.018]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={1} depthWrite={false} depthTest={false} />
          </mesh>
          {!isActive && (
            <mesh position={[0, 0, 0.004]} rotation={[0, 0, Math.PI / 2]} userData={{ isHotspot: true }}>
              <planeGeometry args={[0.065, 0.018]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={1} depthWrite={false} depthTest={false} />
            </mesh>
          )}
        </group>
      </group>
    </Billboard>
  );
}
