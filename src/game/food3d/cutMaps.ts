/**
 * The plumbing every generated cut face shares: turning a pair of pixel buffers
 * into textures, and describing how the flesh that wears them should catch light.
 *
 * Two things live here rather than in each model. The first is the texture
 * upload — a generated face is the same pixels on both halves of the cut *and* on
 * the microscope's own copy of it, and a `useMemo` inside each model would have
 * every one of them upload its own identical megabyte, none of which would ever be
 * disposed, since the food outlives any single component holding one. The second
 * is the subsurface look. There is no scattering term in the renderer, so all of
 * the light coming through a cut vegetable is the transmission, the attenuation
 * colour and the faint glow underneath — which means those numbers have to be
 * tuned as a set, and tuning them in four different files is how they end up
 * disagreeing.
 */

import * as THREE from 'three';

/** Both readings of a cut face in one entry, as RGBA bytes ready for textures.
 *  Generated together, so there is never a reason to have one without the other. */
export interface CutMaps {
  albedo: Uint8ClampedArray;
  roughness: Uint8ClampedArray;
}

export interface CutTextures {
  map: THREE.DataTexture;
  roughnessMap: THREE.DataTexture;
}

const cache = new Map<string, CutTextures>();

/**
 * The textures for one food's cut face, built on first use and kept.
 *
 * Mipmaps and anisotropy are worth the memory: a cut face is very often seen
 * nearly edge-on as the halves swing open, and without them the fibres, cells and
 * kernels dissolve into shimmer the moment the food turns.
 */
export function cutTextures(key: string, maps: CutMaps, size: number): CutTextures {
  const hit = cache.get(key);
  if (hit) return hit;

  const make = (data: Uint8ClampedArray, srgb: boolean) => {
    const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    // colour only on the albedo — a roughness map read as colour comes out warm
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  };

  const built = { map: make(maps.albedo, true), roughnessMap: make(maps.roughness, false) };
  cache.set(key, built);
  return built;
}

/**
 * How a cut face should behave as a material, per food.
 *
 * `transmission` is the entire subsurface effect available here. A cut vegetable
 * is a slab of water and cells a few millimetres deep, so a little light comes
 * through the front of it rather than bouncing off — a little, because these are
 * not glass, and the attenuation colour is what the light turns on the way.
 */
export interface FleshLook {
  /** How much light passes through the front of the flesh. 0 is opaque. */
  transmission: number;
  /** How deep a slab that light is travelling through, in world units. */
  thickness: number;
  /** What the light turns as it travels through the flesh. */
  attenuation: string;
  attenuationDistance: number;
  /** The wet film sitting on top of the cut. */
  clearcoat: number;
  clearcoatRoughness: number;
  /** The glow of light bleeding out of the cut, and how much of it. */
  emissive: string;
  emissiveIntensity: number;
  envMapIntensity: number;
  ior: number;
}

/**
 * The full prop set for a cut face, ready to spread onto a physical material.
 *
 * `roughness` stays pinned at 1 because it multiplies the map: the wettest and
 * driest parts of a face are the ones the generator found, not one flat value laid
 * over all of it.
 */
export function fleshMaterialProps(
  textures: CutTextures,
  look: FleshLook,
): THREE.MeshPhysicalMaterialParameters {
  return {
    map: textures.map,
    roughnessMap: textures.roughnessMap,
    roughness: 1,
    metalness: 0,
    ior: look.ior,
    transmission: look.transmission,
    thickness: look.thickness,
    attenuationColor: look.attenuation,
    attenuationDistance: look.attenuationDistance,
    clearcoat: look.clearcoat,
    clearcoatRoughness: look.clearcoatRoughness,
    emissive: look.emissive,
    emissiveMap: textures.map,
    emissiveIntensity: look.emissiveIntensity,
    envMapIntensity: look.envMapIntensity,
    side: THREE.DoubleSide,
  };
}
