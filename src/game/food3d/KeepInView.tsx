import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** How far across the canvas the food may reach, in normalised device
 *  coordinates where ±1 is the edge. Tightest at the bottom, where the stage's
 *  action button overlaps the canvas; the top-centre is clear (the food name
 *  and tips panels only cover the upper corners). */
const LIMIT_X = 0.92;
const LIMIT_TOP = 0.94;
const LIMIT_BOTTOM = 0.82;

/** The 26 directions of a cube's faces, edges and corners. */
const DIRECTIONS: THREE.Vector3[] = [];
for (let x = -1; x <= 1; x++)
  for (let y = -1; y <= 1; y++)
    for (let z = -1; z <= 1; z++) {
      if (x || y || z) DIRECTIONS.push(new THREE.Vector3(x, y, z).normalize());
    }

/**
 * The vertices of a geometry that stick out furthest in each of 26 directions.
 *
 * A bounding box is a poor stand-in for a food's silhouette: the corner of a
 * broccoli's box nearest the camera is empty air, and it would read as the
 * vegetable poking out of the frame long before it does. The real outermost
 * points, in enough directions, hug the true shape closely and are found once
 * per geometry, so each frame only ever has to look at a handful of points.
 */
const extremesCache = new WeakMap<THREE.BufferGeometry, THREE.Vector3[]>();
function extremePoints(geometry: THREE.BufferGeometry): THREE.Vector3[] {
  const cached = extremesCache.get(geometry);
  if (cached) return cached;

  const pos = geometry.attributes.position as THREE.BufferAttribute | undefined;
  const points: THREE.Vector3[] = [];
  if (pos && pos.count > 0) {
    const best = new Array<number>(DIRECTIONS.length).fill(-Infinity);
    const bestIndex = new Array<number>(DIRECTIONS.length).fill(0);
    // a coarse stride keeps a 40k-vertex scan quick and still lands within a
    // vertex or two of the true extreme on a dense mesh
    const stride = Math.max(1, Math.floor(pos.count / 6000));
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i += stride) {
      v.fromBufferAttribute(pos, i);
      for (let d = 0; d < DIRECTIONS.length; d++) {
        const dot = v.dot(DIRECTIONS[d]);
        if (dot > best[d]) {
          best[d] = dot;
          bestIndex[d] = i;
        }
      }
    }
    const seen = new Set<number>();
    for (const i of bestIndex) {
      if (seen.has(i)) continue;
      seen.add(i);
      points.push(new THREE.Vector3().fromBufferAttribute(pos, i));
    }
  }

  extremesCache.set(geometry, points);
  return points;
}

/**
 * Shrinks its children — only ever shrinks — so they never leave the canvas.
 *
 * `FitScale` sizes a food from a single measurement taken while it is whole. The
 * moment the two halves slide apart the ensemble is wider than that, and on a
 * narrow canvas (a phone held upright, a small window) a half can drift straight
 * off the edge. Rather than every model second-guessing its own separation, this
 * watches the outermost points of every mesh inside it each frame, projects them
 * through the canvas's camera, and eases the scale down whenever one would land
 * outside the frame.
 *
 * It measures against the camera's *settled starting* pose, not the live one, so
 * a hand that has zoomed or spun the microscope view is never fought.
 */
export default function KeepInView({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const shrink = useRef(1);
  const settled = useRef(0);

  const probe = useMemo(() => new THREE.PerspectiveCamera(), []);
  const point = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const node = group.current;
    if (!node) return;

    // The canvas's camera takes a frame or two to settle (its controls aim it on
    // their first update). Follow it until then, then hold that pose — only the
    // aspect keeps tracking, so a resized window is still measured correctly.
    const live = state.camera as THREE.PerspectiveCamera;
    if (settled.current < 0.3) {
      settled.current += delta;
      probe.copy(live);
    } else if (probe.aspect !== live.aspect) {
      probe.aspect = live.aspect;
      probe.updateProjectionMatrix();
    }
    probe.updateMatrixWorld();
    node.updateWorldMatrix(true, true);

    let reach = 0;
    node.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || !mesh.visible) return;
      for (const p of extremePoints(mesh.geometry)) {
        point.copy(p).applyMatrix4(mesh.matrixWorld).project(probe);
        if (point.z > 1) continue; // behind the camera
        const r = Math.max(
          Math.abs(point.x) / LIMIT_X,
          point.y > 0 ? point.y / LIMIT_TOP : -point.y / LIMIT_BOTTOM,
        );
        if (r > reach) {
          reach = r;
          if (import.meta.env.DEV) {
            (window as unknown as { __kivWorst: unknown }).__kivWorst = { count: mesh.geometry.attributes.position?.count, local: p.toArray(), ndc: point.toArray(), world: p.clone().applyMatrix4(mesh.matrixWorld).toArray(), mat: mesh.material && (mesh.material as THREE.Material).type };
          }
        }
      }
    });
    if (reach === 0) return;

    // `reach` > 1 means the furthest point is past the edge. The scale that
    // just fits is roughly the current one over that overshoot; easing toward
    // it (and re-measuring next frame) converges in a few frames without a pop.
    // Once there is room again — the bounce at the end of a cut is transient —
    // it drifts back up, slowly and never past the food's natural size.
    const target = Math.min(1, shrink.current / reach);
    shrink.current = THREE.MathUtils.damp(shrink.current, target, reach > 1 ? 14 : 2.5, delta);
    node.scale.setScalar(shrink.current);
    if (import.meta.env.DEV) {
      (window as unknown as { __kiv: unknown }).__kiv = { shrink: shrink.current, reach };
    }
  });

  return <group ref={group}>{children}</group>;
}
