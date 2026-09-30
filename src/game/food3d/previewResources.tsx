import { Component, useLayoutEffect, useRef, type ReactNode } from 'react';
import { createRoot, extend, useFrame, type ReconcilerRoot, type RootStore } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { FOOD_MODELS, PREVIEW_SCANS, foodSizeOf } from './foodRegistry';

// Register only constructors used by procedural food models (not THREE utilities).
extend({ Group: THREE.Group, Mesh: THREE.Mesh, SphereGeometry: THREE.SphereGeometry,
  CylinderGeometry: THREE.CylinderGeometry, TorusGeometry: THREE.TorusGeometry,
  BoxGeometry: THREE.BoxGeometry, CircleGeometry: THREE.CircleGeometry,
  PlaneGeometry: THREE.PlaneGeometry, RingGeometry: THREE.RingGeometry,
  ConeGeometry: THREE.ConeGeometry, CapsuleGeometry: THREE.CapsuleGeometry,
  MeshStandardMaterial: THREE.MeshStandardMaterial, MeshPhysicalMaterial: THREE.MeshPhysicalMaterial,
  MeshBasicMaterial: THREE.MeshBasicMaterial });

function resources(object: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    geometries.add(node.geometry);
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  return { geometries, materials, textures };
}

function disposeObject(object: THREE.Object3D, closeImages = false) {
  const { geometries, materials, textures } = resources(object);
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  textures.forEach((t) => {
    t.dispose();
    const image = t.image as { close?: () => void } | undefined;
    if (closeImages && typeof image?.close === 'function') image.close();
  });
}

function cloneProcedural(source: THREE.Object3D): THREE.Object3D {
  const result = source.clone(true);
  result.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      if (node.geometry) node.geometry = node.geometry.clone();
      if (node.material) {
        node.material = Array.isArray(node.material)
          ? node.material.map((m) => m.clone())
          : node.material.clone();
      }
    }
  });
  return result;
}

class BuildBoundary extends Component<{ children: ReactNode; fail: (error: Error) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { this.props.fail(error); }
  render() { return this.state.failed ? null : this.props.children; }
}

// This is a private, short-lived Fiber tree owned by the builder, not a refresh boundary.
// eslint-disable-next-line react/only-export-components
function BuildModel({ id, ready }: { id: string; ready: (group: THREE.Group) => void }) {
  const group = useRef<THREE.Group>(null);
  const cut = useRef(0);
  const Model = FOOD_MODELS[id];
  // Initialization only. A positive priority disables Fiber's automatic draw;
  // no texture upload or hidden render happens while taking the snapshot.
  useFrame(() => {}, 1);
  useLayoutEffect(() => { ready(group.current!); }, [ready]);
  return <group ref={group} dispose={null}><Model cutProgressRef={cut} /></group>;
}

export interface PreviewResource {
  object: THREE.Object3D;
  bytes: number;
  dispose: () => void;
}

/** One dormant Fiber root, sharing the renderer, is used ONLY to initialize
 * procedural models. GLB previews use the whole scan directly. */
export class PreviewBuilder {
  private root?: ReconcilerRoot<HTMLCanvasElement>;
  private store?: RootStore;
  private gl: THREE.WebGLRenderer;
  private time = 0;

  constructor(gl: THREE.WebGLRenderer) { this.gl = gl; }

  async build(id: string): Promise<PreviewResource> {
    let object: THREE.Object3D;
    const scan = PREVIEW_SCANS[id];
    if (scan) {
      const gltf = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}${scan.url}`);
      const pose = new THREE.Group();
      const upright = new THREE.Group();
      upright.rotation.set(...(scan.rotate ?? [0, 0, 0]));
      upright.add(gltf.scene);
      pose.rotation.set(...(scan.tilt ?? [0, 0, 0]));
      pose.add(upright);
      object = pose;
    } else {
      if (!this.root) {
        this.root = createRoot(this.gl.domElement);
        await this.root.configure({ gl: this.gl, frameloop: 'never', dpr: 1,
          size: { width: 200, height: 200, top: 0, left: 0 }, events: undefined });
      }
      let source: THREE.Group | undefined;
      try {
        source = await new Promise<THREE.Group>((resolve, reject) => {
          this.store = this.root!.render(
            <BuildBoundary key={id} fail={reject}><BuildModel id={id} ready={resolve} /></BuildBoundary>,
          );
        });
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        this.store!.getState().advance(this.time += 1 / 60, false);
        this.store!.getState().advance(this.time += 1 / 60, false);
        object = cloneProcedural(source);
      } finally {
        this.root.render(null);
      }
    }

    object.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(object);
    const dimensions = bounds.getSize(new THREE.Vector3());
    const fit = foodSizeOf(id) / Math.max(dimensions.x, dimensions.y, dimensions.z, 0.001);
    const fitted = new THREE.Group();
    fitted.scale.setScalar(fit);
    fitted.add(object);
    return { object: fitted, bytes: 1024, dispose: () => disposeObject(fitted) };
  }

  dispose() { this.root?.unmount(); }
}
