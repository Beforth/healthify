import type { ComponentType, MutableRefObject } from 'react';
import { useGLTF } from '@react-three/drei';
import DonutModel from './DonutModel';
import ChocolateBarModel from './ChocolateBarModel';
import MangoModel from './MangoModel';
import AppleModel from './AppleModel';
import PineappleModel from './PineappleModel';
import EggModel from './EggModel';
import CarrotModel from './CarrotModel';
import SweetPotatoModel from './SweetPotatoModel';
import CreamBiscuitModel from './CreamBiscuitModel';
import DonutCrossSection3D from './DonutCrossSection3D';
import ChocolateBarCrossSection3D from './ChocolateBarCrossSection3D';
import MangoCrossSection3D from './MangoCrossSection3D';
import AppleCrossSection3D from './AppleCrossSection3D';
import PineappleCrossSection3D from './PineappleCrossSection3D';
import EggCrossSection3D from './EggCrossSection3D';
import CarrotCrossSection3D from './CarrotCrossSection3D';
import SweetPotatoCrossSection3D from './SweetPotatoCrossSection3D';
import CreamBiscuitCrossSection3D from './CreamBiscuitCrossSection3D';
import BroccoliModel from './BroccoliModel';
import PeanutModel from './PeanutModel';
import SoftDrinkModel from './SoftDrinkModel';
import PotatoChipModel from './PotatoChipModel';
import SweetCornModel from './SweetCornModel';
import BroccoliCrossSection3D from './BroccoliCrossSection3D';
import PeanutCrossSection3D from './PeanutCrossSection3D';
import SoftDrinkCrossSection3D from './SoftDrinkCrossSection3D';
import PotatoChipCrossSection3D from './PotatoChipCrossSection3D';
import SweetCornCrossSection3D from './SweetCornCrossSection3D';
import LollipopCrossSection3D from './LollipopCrossSection3D';
import IceCreamCrossSection3D from './IceCreamCrossSection3D';
import BurgerModel from './BurgerModel';
import BurgerCrossSection3D from './BurgerCrossSection3D';
import MilkModel from './MilkModel';
import MilkCrossSection3D from './MilkCrossSection3D';
import { DEFAULT_TARGET } from './FitScale';
import { scannedFood, type ScannedFoodConfig } from './ScannedFoodModel';

type FoodModel = ComponentType<{
  cutProgressRef: MutableRefObject<number>;
  cutAngle?: number;
  stage?: 'picker' | 'cut';
}>;

/** Long roots/pods/scans that sit with their length down z get a quarter turn so the
 *  cut runs across the food (the same move SweetCorn and SweetPotato make). */
const Z_CUT: [number, number, number] = [0, -Math.PI / 2, 0];

/** Display leans: long horizontal foods get tipped a touch like a cob on a board;
 *  round/upright ones get the tiny broccoli-style lean. */
const LYING: [number, number, number] = [0, 0.3, 0.1];
const STAND: [number, number, number] = [0.06, 0.3, 0];

/** Foods that never get a cutting beat — drinks, bowls of loose grains or flakes,
 *  shelled nuts, loose candies or leaves. They are already opened or poured,
 *  so they stay whole with no knife or cut animation, and let the child inspect directly. */
export const NO_CUT_FOODS = new Set([
  'milk',
  'bubble-tea',
  'oats',
  'walnuts',
  'spinach',
  'candy',
  'curd',
  'green-peas',
  'peanuts',
  'rajma',
  'urad-dal',
  'moong-dal',
  'chana-dal',
  'masoor-dal',
  'toor-dal',
  'soybeans',
  'brown-rice',
  'bajra',
  'ragi',
  'cheese-fries',
  'pasta',
  'soft-drink',
  'potato-chips',
]);

/** Every photoscanned glb in public/models wired to its food. Cut-face colours are invented
 *  — a scan is only a shell — and follow the real food's inside where one is visible. */
const SCANNED: Record<string, ScannedFoodConfig> = {
  amla: { url: 'models/amla.glb', tilt: STAND, rim: '#6f9e4f', flesh: '#c9e0a0', heart: '#e8f0d0' },
  bajra: { url: 'models/bajra.glb', tilt: [0.25, 0.2, 0], rim: '#c9b080', flesh: '#e8d9b0', heart: '#f2e8cc', noCut: true },
  beetroot: { url: 'models/beetroot.glb', tilt: STAND, rim: '#7a1f3d', flesh: '#c0263f', heart: '#e04a5f' },
  'urad-dal': { url: 'models/black-gram.glb', tilt: [0.25, 0.2, 0], rim: '#2e2418', flesh: '#e8dcc0', heart: '#f5eedd', noCut: true },
  lauki: { url: 'models/bottel gourd.glb', rotate: Z_CUT, tilt: LYING, rim: '#9ec89a', flesh: '#e0f0dc', heart: '#f2f9f0' },
  bread: { url: 'models/bread.glb', rotate: Z_CUT, tilt: LYING, rim: '#a06a3a', flesh: '#f0e0c0', heart: '#faf0d8' },
  'brown-rice': { url: 'models/brown-rice.glb', rotate: Z_CUT, tilt: [0.25, 0.2, 0], rim: '#8a6a40', flesh: '#d0b888', heart: '#e8d8b0', noCut: true },
  'bubble-tea': {
    url: 'models/bubble-tea.glb',
    tilt: [0.04, 0.3, 0],
    rim: '#d8b088',
    flesh: '#f0d0b0',
    heart: '#4a2818',
    noCut: true,
    roughness: 0.28,
    metalness: 0.05,
    envMapIntensity: 1.25,
  },
  cabbage: {
    url: 'models/cabbage.glb',
    tilt: [0.08, 0.3, 0],
    rim: '#538f3e',
    flesh: '#9ed882',
    heart: '#eafae0',
    roughness: 0.52,
    envMapIntensity: 1.1,
  },
  cake: { url: 'models/cake.glb', tilt: STAND, rim: '#d9a050', flesh: '#f5e0a8', heart: '#fff0d0' },
  candy: {
    url: 'models/candy.glb',
    rotate: Z_CUT,
    tilt: [0.2, 0.35, 0.1],
    rim: '#e02840',
    flesh: '#ff6080',
    heart: '#ffffff',
    noCut: true,
    roughness: 0.35,
    envMapIntensity: 1.25,
  },
  capsicum: { url: 'models/capsicum.glb', tilt: STAND, rim: '#3a8a3a', flesh: '#8fd06a', heart: '#d8f0b0' },
  cauliflower: { url: 'models/cauliflower.glb', tilt: STAND, rim: '#d8e0c0', flesh: '#f5f5e8', heart: '#ffffff' },
  'chana-dal': { url: 'models/chana-daal.glb', tilt: [0.25, 0.2, 0], rim: '#d9a840', flesh: '#f0d878', heart: '#f8eab0', noCut: true },
  'cheese-fries': { url: 'models/cheese-fries.glb', tilt: [0.25, 0.2, 0], rim: '#d9a040', flesh: '#f5d878', heart: '#ffeaa0', noCut: true },
  cucumber: { url: 'models/cucumber.glb', rotate: Z_CUT, tilt: LYING, rim: '#4a8a40', flesh: '#c8e8b0', heart: '#e8f5d0' },
  cupcake: {
    url: 'models/cupcake.glb',
    tilt: STAND,
    rim: '#a64253',
    flesh: '#f9e0a2',
    heart: '#ff94b8',
    roughness: 0.52,
    envMapIntensity: 1.1,
  },
  curd: { url: 'models/curd.glb', rotate: Z_CUT, tilt: [0.3, 0.2, 0], rim: '#e8e8e0', flesh: '#f8f8f0', heart: '#ffffff', noCut: true },
  drumstick: { url: 'models/drumstick.glb', rotate: Z_CUT, tilt: LYING, rim: '#5a8a3a', flesh: '#b8d888', heart: '#e0efc0' },
  garlic: { url: 'models/garlic.glb', rotate: Z_CUT, tilt: LYING, rim: '#e8dcc0', flesh: '#faf5e8', heart: '#ffffff' },
  'green-beans': { url: 'models/green-beans.glb', tilt: STAND, rim: '#3a8a3a', flesh: '#8fd06a', heart: '#d0efb0' },
  'moong-dal': { url: 'models/green-gram.glb', tilt: [0.25, 0.2, 0], rim: '#6a9a4a', flesh: '#d8e8b0', heart: '#f0f5d8', noCut: true },
  'green-peas': { url: 'models/green-peas.glb', rotate: Z_CUT, tilt: [0.25, 0.2, 0], rim: '#4a9a40', flesh: '#90d870', heart: '#d0f0b0', noCut: true },
  guava: { url: 'models/guava.glb', tilt: STAND, rim: '#7aa040', flesh: '#f5c8b0', heart: '#f8e0c0' },
  'hot-dog': {
    url: 'models/hot-dog.glb',
    rotate: Z_CUT,
    tilt: LYING,
    rim: '#b86834',
    flesh: '#f7e8c8',
    heart: '#d6453d',
    roughness: 0.52,
    envMapIntensity: 1.1,
  },
  'ice-cream': { url: 'models/ice-creame.glb', tilt: STAND, rim: '#d9a860', flesh: '#f5e0c0', heart: '#ffe8d0' },
  rajma: { url: 'models/kidney_beans.glb', tilt: [0.25, 0.2, 0], rim: '#7a2a20', flesh: '#e8c8a0', heart: '#f5e0c0', noCut: true },
  kiwi: { url: 'models/kiwi.glb', rotate: Z_CUT, tilt: LYING, rim: '#6a5030', flesh: '#90d060', heart: '#f0f8d0' },
  lollipop: { url: 'models/lollipop.glb', rotate: Z_CUT, tilt: LYING, rim: '#ff6a9a', flesh: '#ff9ec0', heart: '#ffd0e0' },
  'masoor-dal': { url: 'models/masoor-daal.glb', tilt: [0.25, 0.2, 0], rim: '#d97030', flesh: '#f0a860', heart: '#f8d0a0', noCut: true },
  oats: {
    url: 'models/oats.glb',
    tilt: [0.35, 0.2, 0],
    rim: '#d0b888',
    flesh: '#ebd8b0',
    heart: '#f5e8cc',
    noCut: true,
    roughness: 0.58,
    envMapIntensity: 1.05,
  },
  onion: { url: 'models/onion.glb', tilt: STAND, rim: '#b06aa0', flesh: '#f5e8f0', heart: '#ffffff' },
  orange: { url: 'models/orange.glb', tilt: STAND, rim: '#e07a20', flesh: '#f5a840', heart: '#ffd080' },
  pancakes: {
    url: 'models/pan-cake.glb',
    tilt: [0.18, 0.3, 0],
    rim: '#bf7d28',
    flesh: '#fde2a6',
    heart: '#fff2cf',
    roughness: 0.55,
    envMapIntensity: 1.05,
  },
  papaya: { url: 'models/papaaya.glb', rotate: Z_CUT, tilt: LYING, rim: '#e08840', flesh: '#f5b870', heart: '#3a2a20' },
  pasta: { url: 'models/pasta.glb', tilt: [0.25, 0.2, 0], rim: '#e8d8a0', flesh: '#f5ecc8', heart: '#fff8e0', noCut: true },
  pomegranate: { url: 'models/pomegranate.glb', rotate: Z_CUT, tilt: LYING, rim: '#c02040', flesh: '#e04060', heart: '#f08090' },
  pumpkin: { url: 'models/pumpckin.glb', tilt: STAND, rim: '#d98030', flesh: '#f5b060', heart: '#ffcc90' },
  radish: { url: 'models/radish.glb', tilt: STAND, rim: '#d04050', flesh: '#f8f0e8', heart: '#ffffff' },
  ragi: { url: 'models/ragi.glb', tilt: [0.25, 0.2, 0], rim: '#8a4a30', flesh: '#c08060', heart: '#d8a888', noCut: true },
  soybeans: { url: 'models/soyabean.glb', tilt: [0.25, 0.2, 0], rim: '#d0c080', flesh: '#f0e8c0', heart: '#faf5e0', noCut: true },
  spinach: {
    url: 'models/spinach.glb',
    tilt: [0.22, 0.3, 0],
    rim: '#2d6a30',
    flesh: '#48a048',
    heart: '#70c868',
    noCut: true,
    roughness: 0.55,
    envMapIntensity: 1.1,
  },
  'sweet-lime': { url: 'models/sweet-lime.glb', tilt: STAND, rim: '#8ab040', flesh: '#e8f0c0', heart: '#f8f8e0' },
  taco: { url: 'models/taco.glb', tilt: STAND, rim: '#e0a050', flesh: '#a85838', heart: '#f5e0a0' },
  tomato: { url: 'models/tomato.glb', tilt: STAND, rim: '#c02030', flesh: '#f05060', heart: '#f8a0a0' },
  'toor-dal': { url: 'models/toor-daal.glb', tilt: [0.25, 0.2, 0], rim: '#d9a040', flesh: '#f0d070', heart: '#f8e8a0', noCut: true },
  waffle: {
    url: 'models/waffles.glb',
    tilt: [0.22, 0.25, 0],
    rim: '#c48232',
    flesh: '#fde49e',
    heart: '#fff3bd',
    roughness: 0.55,
    envMapIntensity: 1.05,
  },
  walnuts: {
    url: 'models/walnuts.glb',
    tilt: [0.28, 0.3, 0],
    rim: '#784828',
    flesh: '#d8a870',
    heart: '#f0d0a0',
    noCut: true,
    roughness: 0.55,
    envMapIntensity: 1.05,
  },
  watermelon: { url: 'models/watermelon.glb', tilt: STAND, rim: '#2e7a30', flesh: '#f04050', heart: '#f89090' },
  okra: { url: 'models/bhindi.glb', rotate: Z_CUT, tilt: LYING, rim: '#4a7a3a', flesh: '#b5d98a', heart: '#e0efc0' },
};

/** Whole scans for thumbnails: never split/triangulate a model just to show it whole.
 * Kept beside the gameplay registry so paths and display poses stay in sync. */
export const PREVIEW_SCANS: Record<string, Pick<ScannedFoodConfig, 'url' | 'rotate' | 'tilt'>> = {
  ...SCANNED,
  'chocolate-bar': { url: 'models/chocolate.glb', tilt: [0.38, 0.22, 0] },
  pineapple: { url: 'models/pineapple.glb', tilt: [0.08, 0.3, 0] },
  broccoli: { url: 'models/broccoli.glb', tilt: [0.08, 0.3, 0] },
  'cream-biscuits': { url: 'models/cream_biscuit.glb', tilt: [0.42, 0.2, 0] },
  'sweet-potato': { url: 'models/sweet-potato.glb', rotate: Z_CUT, tilt: [0.05, 0, 0.72] },
  peanuts: { url: 'models/peanut.glb', rotate: Z_CUT, tilt: [0.28, 0.35, 0.7] },
  'soft-drink': { url: 'models/soft-drink.glb', tilt: [0.05, 0.3, 0] },
  'potato-chips': { url: 'models/potato-chips.glb', rotate: [Math.PI / 2, 0, 0], tilt: [0.42, 0.2, 0] },
  corn: { url: 'models/sweet corn.glb', rotate: Z_CUT, tilt: [0.1, 0.4, 0.65] },
  burger: { url: 'models/burger.glb', tilt: [0.1, 0.3, 0] },
  milk: { url: 'models/milk.glb', tilt: [0.06, 0.3, 0] },
};

/** Foods with a hand-built 3D model. Anything absent here is still perfectly
 *  playable — GameScreen and the picker fall back to the food's 2D icon. */
const HAND_BUILT: Record<string, FoodModel> = {
  donut: DonutModel,
  'chocolate-bar': ChocolateBarModel,
  mango: MangoModel,
  apple: AppleModel,
  pineapple: PineappleModel,
  egg: EggModel,
  carrot: CarrotModel,
  'sweet-potato': SweetPotatoModel,
  'cream-biscuits': CreamBiscuitModel,
  broccoli: BroccoliModel,
  peanuts: PeanutModel,
  'soft-drink': SoftDrinkModel,
  'potato-chips': PotatoChipModel,
  corn: SweetCornModel,
  burger: BurgerModel,
  milk: MilkModel,
};

const SCANNED_MODELS: Record<string, FoodModel> = Object.fromEntries(
  Object.entries(SCANNED).map(([id, config]) => [id, scannedFood(config)]),
);

export const FOOD_MODELS: Record<string, FoodModel> = {
  ...HAND_BUILT,
  ...SCANNED_MODELS,
};

export const FOOD_CROSS_SECTIONS: Record<string, ComponentType> = {
  donut: DonutCrossSection3D,
  'chocolate-bar': ChocolateBarCrossSection3D,
  mango: MangoCrossSection3D,
  apple: AppleCrossSection3D,
  pineapple: PineappleCrossSection3D,
  egg: EggCrossSection3D,
  carrot: CarrotCrossSection3D,
  'sweet-potato': SweetPotatoCrossSection3D,
  'cream-biscuits': CreamBiscuitCrossSection3D,
  broccoli: BroccoliCrossSection3D,
  peanuts: PeanutCrossSection3D,
  'soft-drink': SoftDrinkCrossSection3D,
  'potato-chips': PotatoChipCrossSection3D,
  corn: SweetCornCrossSection3D,
  lollipop: LollipopCrossSection3D,
  'ice-cream': IceCreamCrossSection3D,
  burger: BurgerCrossSection3D,
  milk: MilkCrossSection3D,
};

/** Hand-picked sizes, as world-unit targets: a food's largest dimension fills
 *  this footprint on the picker and the cut stage. Each food sizes itself —
 *  nothing is measured off another food — so a pineapple can be a touch bigger
 *  than its neighbours and a tall burger smaller, without any of them sharing a
 *  reference. Anything not listed keeps FitScale's default target. */
const FOOD_SIZES: Record<string, number> = {
  carrot: 3.5,
  broccoli: 3.5,
  pineapple: 3.5,
  corn: 3.5,
  burger: 2.9,
  'sweet-potato': 2.9,
  'hot-dog': 3.4,
  waffle: 3.2,
  pancakes: 3.0,
  cupcake: 3.0,
  candy: 2.8,
  'bubble-tea': 3.1,
  spinach: 3.3,
  cabbage: 3.2,
  oats: 3.2,
  walnuts: 3.0,
  milk: 3.0,
};

/** The on-screen footprint target for a food, in world units. */
export function foodSizeOf(id: string): number {
  return FOOD_SIZES[id] ?? DEFAULT_TARGET;
}

/**
 * Fire-and-forget: pre-populate drei's useGLTF Suspense cache for every GLB
 * a food needs during gameplay (its hand-built model and/or its scanned halves).
 * Call this the moment the user selects a food so the download overlaps the
 * route transition. When the game screen mounts, useGLTF() reads from cache
 * synchronously and the model paints on the very first frame.
 */
export function preloadForGame(id: string): void {
  const BASE = import.meta.env.BASE_URL;
  // Scanned whole/half geometry used in the game screen
  const scan = SCANNED[id];
  if (scan) useGLTF.preload(`${BASE}${scan.url}`);

  // Hand-built models that load their own GLB via useGLTF inside the component
  const handBuiltUrls: Partial<Record<string, string>> = {
    'chocolate-bar':  `${BASE}models/chocolate.glb`,
    pineapple:        `${BASE}models/pineapple.glb`,
    'sweet-potato':   `${BASE}models/sweet-potato.glb`,
    burger:           `${BASE}models/burger.glb`,
    broccoli:         `${BASE}models/broccoli.glb`,
    peanuts:          `${BASE}models/peanut.glb`,
    'soft-drink':     `${BASE}models/soft-drink.glb`,
    'potato-chips':   `${BASE}models/potato-chips.glb`,
    corn:             `${BASE}models/sweet corn.glb`,
    milk:             `${BASE}models/milk.glb`,
    'cream-biscuits': `${BASE}models/cream_biscuit.glb`,
  };
  const url = handBuiltUrls[id];
  if (url) useGLTF.preload(url);
}
