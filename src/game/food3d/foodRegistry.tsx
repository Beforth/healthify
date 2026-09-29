import type { ComponentType, MutableRefObject } from 'react';
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
import SoftDrinkModel from './SoftDrinkModel';
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
  /** Which screen this instance is being drawn on. A model that needs a different
   *  pose on the board than in the picker reads it and picks between two layouts
   *  of its own; the rest ignore it, and the picker never passes it. The carrot is
   *  the one that has to — its diagonal frames well in a square thumbnail, and
   *  turns the cut face away from the camera at the same time. */
  stage?: 'picker' | 'cut';
}>;

/** Long roots/pods/scans that sit with their length down z get a quarter turn so the
 *  cut runs across the food (the same move SweetCorn and SweetPotato make). */
const Z_CUT: [number, number, number] = [0, -Math.PI / 2, 0];

/** A scan photographed standing on its edge — one flat chip, thin down z, long up y —
 *  gets tipped onto its face. A quarter turn about x leaves x alone, so the cut plane
 *  still crosses the middle of it. */
const LAY_FLAT: [number, number, number] = [Math.PI / 2, 0, 0];

/** Display leans: long horizontal foods get tipped a touch like a cob on a board;
 *  round/upright ones get the tiny broccoli-style lean. */
const LYING: [number, number, number] = [0, 0.3, 0.1];
const STAND: [number, number, number] = [0.06, 0.3, 0];

/** The photoscanned glbs in public/models wired to their food, ordered by file name.
 *  Each key is the food's own id, not the scan's file name, and the two only differ
 *  where the scan was named after the vegetable rather than the food — `okra` is
 *  `bhindi.glb`. Anything in this record that is also in `HAND_BUILT` below loses:
 *  the merge puts the scans last, so a scan is the newer word on how a food looks.
 *  Cut-face colours are invented — a scan is only a shell — and follow the real
 *  food's inside where one is visible. */
const SCANNED: Record<string, ScannedFoodConfig> = {
  amla: { url: 'models/amla.glb', tilt: STAND, rim: '#6f9e4f', flesh: '#c9e0a0', heart: '#e8f0d0' },
  bajra: { url: 'models/bajra.glb', tilt: STAND, rim: '#c9b080', flesh: '#e8d9b0', heart: '#f2e8cc' },
  beetroot: { url: 'models/beetroot.glb', tilt: STAND, rim: '#7a1f3d', flesh: '#c0263f', heart: '#e04a5f' },
  'urad-dal': { url: 'models/black-gram.glb', tilt: STAND, rim: '#2e2418', flesh: '#e8dcc0', heart: '#f5eedd' },
  lauki: { url: 'models/bottel gourd.glb', rotate: Z_CUT, tilt: LYING, rim: '#9ec89a', flesh: '#e0f0dc', heart: '#f2f9f0' },
  bread: { url: 'models/bread.glb', rotate: Z_CUT, tilt: LYING, rim: '#a06a3a', flesh: '#f0e0c0', heart: '#faf0d8' },
  'brown-rice': { url: 'models/brown-rice.glb', rotate: Z_CUT, tilt: LYING, rim: '#8a6a40', flesh: '#d0b888', heart: '#e8d8b0' },
  'bubble-tea': { url: 'models/bubble-tea.glb', tilt: STAND, rim: '#e9dfc8', flesh: '#c89a62', heart: '#5c3a28' },
  cabbage: { url: 'models/cabbage.glb', tilt: STAND, rim: '#7fa856', flesh: '#dfecc4', heart: '#f6f8e4' },
  cake: { url: 'models/cake.glb', tilt: STAND, rim: '#d9a050', flesh: '#f5e0a8', heart: '#fff0d0' },
  candy: { url: 'models/candy.glb', rotate: Z_CUT, tilt: LYING, rim: '#e8536a', flesh: '#ff9ab0', heart: '#ffd6e0' },
  capsicum: { url: 'models/capsicum.glb', tilt: STAND, rim: '#3a8a3a', flesh: '#8fd06a', heart: '#d8f0b0' },
  cauliflower: { url: 'models/cauliflower.glb', tilt: STAND, rim: '#d8e0c0', flesh: '#f5f5e8', heart: '#ffffff' },
  'chana-dal': { url: 'models/chana-daal.glb', tilt: STAND, rim: '#d9a840', flesh: '#f0d878', heart: '#f8eab0' },
  'cheese-fries': { url: 'models/cheese-fries.glb', tilt: STAND, rim: '#d9a040', flesh: '#f5d878', heart: '#ffeaa0' },
  cucumber: { url: 'models/cucumber.glb', rotate: Z_CUT, tilt: LYING, rim: '#4a8a40', flesh: '#c8e8b0', heart: '#e8f5d0' },
  cupcake: { url: 'models/cupcake.glb', tilt: STAND, rim: '#e88fb0', flesh: '#f5e0ab', heart: '#fff0d0' },
  curd: { url: 'models/curd.glb', rotate: Z_CUT, tilt: LYING, rim: '#e8e8e0', flesh: '#f8f8f0', heart: '#ffffff' },
  drumstick: { url: 'models/drumstick.glb', rotate: Z_CUT, tilt: LYING, rim: '#5a8a3a', flesh: '#b8d888', heart: '#e0efc0' },
  garlic: { url: 'models/garlic.glb', rotate: Z_CUT, tilt: LYING, rim: '#e8dcc0', flesh: '#faf5e8', heart: '#ffffff' },
  'green-beans': { url: 'models/green-beans.glb', tilt: STAND, rim: '#3a8a3a', flesh: '#8fd06a', heart: '#d0efb0' },
  'moong-dal': { url: 'models/green-gram.glb', tilt: STAND, rim: '#6a9a4a', flesh: '#d8e8b0', heart: '#f0f5d8' },
  'green-peas': { url: 'models/green-peas.glb', rotate: Z_CUT, tilt: LYING, rim: '#4a9a40', flesh: '#90d870', heart: '#d0f0b0' },
  guava: { url: 'models/guava.glb', tilt: STAND, rim: '#7aa040', flesh: '#f5c8b0', heart: '#f8e0c0' },
  'hot-dog': { url: 'models/hot-dog.glb', rotate: Z_CUT, tilt: LYING, rim: '#d09a52', flesh: '#f0d9a8', heart: '#c2503c' },
  'ice-cream': { url: 'models/ice-creame.glb', tilt: STAND, rim: '#d9a860', flesh: '#f5e0c0', heart: '#ffe8d0' },
  rajma: { url: 'models/kidney_beans.glb', tilt: STAND, rim: '#7a2a20', flesh: '#e8c8a0', heart: '#f5e0c0' },
  kiwi: { url: 'models/kiwi.glb', rotate: Z_CUT, tilt: LYING, rim: '#6a5030', flesh: '#90d060', heart: '#f0f8d0' },
  lollipop: { url: 'models/lollipop.glb', rotate: Z_CUT, tilt: LYING, rim: '#ff6a9a', flesh: '#ff9ec0', heart: '#ffd0e0' },
  'masoor-dal': { url: 'models/masoor-daal.glb', tilt: STAND, rim: '#d97030', flesh: '#f0a860', heart: '#f8d0a0' },
  oats: { url: 'models/oats.glb', rotate: Z_CUT, tilt: LYING, rim: '#c8a878', flesh: '#e8d4a8', heart: '#f5ead0' },
  onion: { url: 'models/onion.glb', tilt: STAND, rim: '#b06aa0', flesh: '#f5e8f0', heart: '#ffffff' },
  orange: { url: 'models/orange.glb', tilt: STAND, rim: '#e07a20', flesh: '#f5a840', heart: '#ffd080' },
  papaya: { url: 'models/papaaya.glb', rotate: Z_CUT, tilt: LYING, rim: '#e08840', flesh: '#f5b870', heart: '#3a2a20' },
  pancakes: { url: 'models/pan-cake.glb', tilt: STAND, rim: '#cf8a44', flesh: '#f0c878', heart: '#fae3a4' },
  pasta: { url: 'models/pasta.glb', tilt: STAND, rim: '#e8d8a0', flesh: '#f5ecc8', heart: '#fff8e0' },
  peanuts: { url: 'models/peanut.glb', tilt: STAND, rim: '#c08a4a', flesh: '#e8c88a', heart: '#f0dcae' },
  'potato-chips': { url: 'models/potato-chips.glb', rotate: LAY_FLAT, tilt: STAND, rim: '#d8a838', flesh: '#f2d478' },
  pomegranate: { url: 'models/pomegranate.glb', rotate: Z_CUT, tilt: LYING, rim: '#c02040', flesh: '#e04060', heart: '#f08090' },
  pumpkin: { url: 'models/pumpckin.glb', tilt: STAND, rim: '#d98030', flesh: '#f5b060', heart: '#ffcc90' },
  radish: { url: 'models/radish.glb', tilt: STAND, rim: '#d04050', flesh: '#f8f0e8', heart: '#ffffff' },
  ragi: { url: 'models/ragi.glb', tilt: STAND, rim: '#8a4a30', flesh: '#c08060', heart: '#d8a888' },
  soybeans: { url: 'models/soyabean.glb', tilt: STAND, rim: '#d0c080', flesh: '#f0e8c0', heart: '#faf5e0' },
  spinach: { url: 'models/spinach.glb', tilt: STAND, rim: '#2f6b32', flesh: '#5f9c4a', heart: '#a8cf7a' },
  'sweet-lime': { url: 'models/sweet-lime.glb', tilt: STAND, rim: '#8ab040', flesh: '#e8f0c0', heart: '#f8f8e0' },
  taco: { url: 'models/taco.glb', tilt: STAND, rim: '#e0a050', flesh: '#a85838', heart: '#f5e0a0' },
  tomato: { url: 'models/tomato.glb', tilt: STAND, rim: '#c02030', flesh: '#f05060', heart: '#f8a0a0' },
  'toor-dal': { url: 'models/toor-daal.glb', tilt: STAND, rim: '#d9a040', flesh: '#f0d070', heart: '#f8e8a0' },
  waffle: { url: 'models/waffles.glb', tilt: STAND, rim: '#c2874a', flesh: '#e8bd78', heart: '#f6dc9e' },
  walnuts: { url: 'models/walnuts.glb', tilt: STAND, rim: '#6b4a2c', flesh: '#c99a5e', heart: '#e8c88e' },
  watermelon: { url: 'models/watermelon.glb', tilt: STAND, rim: '#2e7a30', flesh: '#f04050', heart: '#f89090' },
  okra: { url: 'models/bhindi.glb', rotate: Z_CUT, tilt: LYING, rim: '#4a7a3a', flesh: '#b5d98a', heart: '#e0efc0' },
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
  'soft-drink': SoftDrinkModel,
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
  // The carrot lies on a diagonal, so its box is mostly empty corners: it needs
  // a bigger footprint than a round food to look the same size. `KeepInView`
  // reins it back in on a canvas too narrow for it.
  carrot: 3.5,
  // A head of broccoli is as wide as it is tall, so at 3.5 its corners reached
  // past the plate's edge and its top sat exactly on the top of the frame. 3.15
  // is what keeps the whole head on the board with room to spare.
  broccoli: 3.15,
  // Capped by the top of the frame rather than by the board, which it uses barely
  // a third of. 3.6 is 95% of the way to the limit and the 5% hover boost pushes
  // the crown straight through it, and 3.55 still clips — the ceiling is the crown
  // at 3.5, which sits just inside at rest and 99% of the way there on hover.
  pineapple: 3.5,
  // The one standing on end, leaned about 60 degrees. Upright is the only
  // orientation that shows the cut — the face points up, so the camera looks into
  // 40% of it instead of 27% on its side — but standing spends the frame's
  // height, and the halves part by 0.8 of a 1.0-long cob. At 3.6 the upper half
  // settled 45% above the top of the frame; the steep lean tips that separation
  // into the width, and 3.0 is the largest size whose whole cut still fits. On
  // the board it uses barely a third of the radius either way.
  corn: 3.0,
  // A shade bigger than it was. The board is 2.25 across and this is a square
  // footprint, so the corners decide it: hovering scales a food up by 5%, and
  // 3.1 is where the burger's corner crosses the plate's edge. 3.05 is as far as
  // this goes while staying wholly on the board even on hover. Held upright rather
  // than pitched, it now uses more of the frame's height and sits at 95% of the
  // bottom limit, where it used to sit at 75% — the last of the margin, but inside.
  burger: 3.05,
  // The only one of the four with real room. It lies across the board rather than
  // standing up, so nothing about it runs into the top of the frame, and its
  // footprint is less than half the board's radius even with the lean and the turn
  // toward the camera. It was the smallest of the group and had the most to give.
  'sweet-potato': 3.5,
};

/** The on-screen footprint target for a food, in world units. */
export function foodSizeOf(id: string): number {
  return FOOD_SIZES[id] ?? DEFAULT_TARGET;
}