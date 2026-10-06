import type { FoodItem } from '../data/nutritionData';

export interface EnergyPoint {
  minute: number;
  energy: number;
}

/** First number in a value like "≈20–25 g" — the middle of a range. Anything measured in
 *  mg / µg is not a macro, so it counts as nothing here. */
function grams(food: FoodItem, label: RegExp): number {
  const fact = food.nutrition.find((n) => label.test(n.label));
  if (!fact || /mg|µg|mcg/i.test(fact.value)) return 0;
  const nums = (fact.value.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  if (nums.length === 0) return 0;
  return /[–-]/.test(fact.value) && nums.length > 1 ? (nums[0] + nums[1]) / 2 : nums[0];
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * An energy curve for the hour after eating this particular food.
 *
 * Every food used to draw one of two canned shapes. This builds the shape from the
 * food's own numbers: sugar and carbs make a quick spike, fibre and protein flatten
 * it into a slow climb, and fat delays and widens the peak. A donut therefore spikes
 * and crashes hard, while a lentil bowl rises slowly and stays up.
 */
export function energyCurve(food: FoodItem): EnergyPoint[] {
  const sugar = grams(food, /sugar/i);
  const carbs = grams(food, /carbohydrate/i);
  const fibre = grams(food, /fib(re|er)/i);
  const protein = grams(food, /protein/i);
  const fat = grams(food, /fat/i);

  // 0 = slow burn, 1 = rush and crash
  const raw = clamp((sugar * 1.0 + carbs * 0.25) / (6 + fibre * 2.2 + protein * 0.8), 0, 1);
  // sugar that arrives inside a whole fruit or vegetable is wrapped in fibre and water, so a
  // healthy food only ever rises gently; a treat always has some rush in it
  const rush = food.category === 'healthy' ? raw * 0.45 : Math.max(raw, 0.6);
  const sustain = clamp(24 + fibre * 4 + protein * 1.6 + fat * 0.6, 28, 82);
  const peakAt = clamp(14 + fat * 0.7, 14, 30);
  const width = clamp(6.5 + fat * 0.35, 6.5, 13);
  const amp = 58 + 30 * rush;

  const points: EnergyPoint[] = [];
  for (let minute = 0; minute <= 60; minute += 5) {
    const spike = Math.exp(-(((minute - peakAt) / width) ** 2));
    const climb = 1 / (1 + Math.exp(-(minute - 22) / 6));
    const energy =
      12 +
      rush * amp * spike +
      rush * 0.22 * sustain * climb +
      (1 - rush) * (sustain - 12) * climb;
    points.push({ minute, energy: Math.round(clamp(energy, 6, 100)) });
  }
  return points;
}

/** True when the curve really does end well below where it peaked. */
export function crashes(points: EnergyPoint[]): boolean {
  const peak = Math.max(...points.map((p) => p.energy));
  return points[points.length - 1].energy < peak * 0.55;
}
