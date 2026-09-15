import { useMemo, useRef, useState } from 'react';
import { Billboard } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
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
  const isActive = active === id;
  const isDimmed = active !== null && !isActive;
  const ripple = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  const body = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const tex = useMemo(() => getGlowTexture(), []);
  // a slightly lighter shade of the marker colour, for the bead's top highlight
  const tint = useMemo(() => new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.45), [color]);

  useFrame((state, delta) => {
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
      const target = isActive ? 1.55 : hovered ? 1.2 : 1 + Math.sin(t * 2.2) * 0.06;
      glow.current.scale.setScalar(THREE.MathUtils.damp(glow.current.scale.x, target, 10, delta));
      const mat = glow.current.material as THREE.MeshBasicMaterial;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, isActive ? 0.95 : isDimmed ? 0.12 : 0.42, 10, delta);
    }

    if (halo.current) {
      // a second, slowly turning ring that only the open marker wears
      halo.current.rotation.z += delta * 0.9;
      const mat = halo.current.material as THREE.MeshBasicMaterial;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, isActive ? 0.9 : 0, 12, delta);
      const s = THREE.MathUtils.damp(halo.current.scale.x, isActive ? 1 : 0.6, 12, delta);
      halo.current.scale.setScalar(s);
    }

    if (body.current) {
      const target = isActive ? 1.42 : hovered ? 1.18 : isDimmed ? 0.78 : 1;
      body.current.scale.setScalar(THREE.MathUtils.damp(body.current.scale.x, target, 12, delta));
      const fade = isDimmed ? 0.4 : 1;
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
    // renderOrder + depthTest:false keeps every marker drawn on top of the food.
    // Sitting exactly on a curved surface, a marker at a grazing angle gets half
    // buried by its own geometry and simply vanishes near the silhouette — and a
    // marker a child cannot see is a marker they cannot tap.
    <Billboard position={position} scale={scale} renderOrder={10}>
      <group onClick={pick} onPointerOver={enter} onPointerOut={leave}>
        {/* Invisible, generously sized tap target. Small fingers on a phone miss a
            12px dot, so the thing you can hit is far bigger than the thing you see.
            It has to be transparent rather than visible={false} — an invisible mesh
            is skipped by the raycaster and would never receive the tap. */}
        <mesh>
          <circleGeometry args={[0.38, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
        </mesh>

        <mesh ref={glow} position={[0, 0, -0.002]}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshBasicMaterial
            map={tex}
            color={color}
            transparent
            opacity={0.42}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>

        <mesh ref={ripple} position={[0, 0, -0.001]}>
          <ringGeometry args={[0.16, 0.185, 40]} />
          <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} depthTest={false} />
        </mesh>

        <mesh ref={halo}>
          <ringGeometry args={[0.2, 0.235, 4, 1, 0, Math.PI * 2]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} depthTest={false} />
        </mesh>

        <group ref={body}>
          {/* a soft drop shadow so the bead reads as sitting above the food */}
          <mesh position={[0, -0.016, 0]} userData={{ baseOpacity: 0.22 }}>
            <circleGeometry args={[0.166, 28]} />
            <meshBasicMaterial color="#0d3a26" transparent opacity={0.22} depthWrite={false} depthTest={false} />
          </mesh>
          {/* white collar — what makes the bead legible on dark chocolate and pale flesh alike */}
          <mesh position={[0, 0, 0.001]}>
            <circleGeometry args={[0.163, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={1} depthWrite={false} depthTest={false} />
          </mesh>
          <mesh position={[0, 0, 0.002]}>
            <circleGeometry args={[0.128, 32]} />
            <meshBasicMaterial color={color} transparent opacity={1} depthWrite={false} depthTest={false} />
          </mesh>
          {/* glossy top light, the thing that turns a flat disc into a bead */}
          <mesh position={[-0.036, 0.046, 0.003]} scale={[1, 0.68, 1]} userData={{ baseOpacity: 0.55 }}>
            <circleGeometry args={[0.06, 20]} />
            <meshBasicMaterial color={tint} transparent opacity={0.55} depthWrite={false} depthTest={false} />
          </mesh>

          {/* "+" while closed, "–" once open: the invitation, then the way back out */}
          <mesh position={[0, 0, 0.004]}>
            <planeGeometry args={[0.108, 0.028]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={1} depthWrite={false} depthTest={false} />
          </mesh>
          {!isActive && (
            <mesh position={[0, 0, 0.004]} rotation={[0, 0, Math.PI / 2]}>
              <planeGeometry args={[0.108, 0.028]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={1} depthWrite={false} depthTest={false} />
            </mesh>
          )}
        </group>
      </group>
    </Billboard>
  );
}
