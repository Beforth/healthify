import type { ComponentType, MutableRefObject } from 'react';
import DonutModel from './DonutModel';
import ChocolateBarModel from './ChocolateBarModel';
import MangoModel from './MangoModel';
import AppleModel from './AppleModel';
import DonutCrossSection3D from './DonutCrossSection3D';
import ChocolateBarCrossSection3D from './ChocolateBarCrossSection3D';
import MangoCrossSection3D from './MangoCrossSection3D';
import AppleCrossSection3D from './AppleCrossSection3D';

export const FOOD_MODELS: Record<
  string,
  ComponentType<{ cutProgressRef: MutableRefObject<number>; cutAngle?: number }>
> = {
  donut: DonutModel,
  'chocolate-bar': ChocolateBarModel,
  mango: MangoModel,
  apple: AppleModel,
};

export const FOOD_CROSS_SECTIONS: Record<string, ComponentType> = {
  donut: DonutCrossSection3D,
  'chocolate-bar': ChocolateBarCrossSection3D,
  mango: MangoCrossSection3D,
  apple: AppleCrossSection3D,
};
