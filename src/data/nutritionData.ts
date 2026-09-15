export type FoodCategory = 'healthy' | 'junk';
export type QuizTopic = 'fat' | 'sugar' | 'calories' | 'vitamins';

export interface IngredientLine {
  name: string;
  amount: string;
}

export interface NutritionFact {
  label: string;
  value: string;
}

export interface QuizQuestion {
  topic: QuizTopic;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  servingSize: string;
  /** true for foods with no entry in the client's source sheet (Question set 1.pdf).
   *  Their numbers are researched stand-ins, not client-supplied data. */
  isPlaceholder?: boolean;
  ingredients: IngredientLine[];
  nutrition: NutritionFact[];
  quiz: QuizQuestion[];
}

/**
 * Every figure below is taken from the client's "Question set 1.pdf" sheet, which
 * lists each food's real composition. Each quiz question pairs the true value with
 * one plainly wrong value, so a child picks between them.
 * Mango is the one exception — it is not on that sheet (see isPlaceholder).
 */
export const FOODS: FoodItem[] = [
  {
    id: 'donut',
    name: 'Donut',
    category: 'junk',
    servingSize: '60 g',
    ingredients: [
      { name: 'Refined flour (maida)', amount: '24 g' },
      { name: 'Sugar', amount: '9 g' },
      { name: 'Fats (butter)', amount: '6 g' },
      { name: 'Milk', amount: '6 g' },
      { name: 'Icing', amount: '4.8 g' },
      { name: 'Yeast', amount: '1.2 g' },
      { name: 'Sprinkles', amount: '1.2 g' },
    ],
    nutrition: [
      { label: 'Energy', value: '≈235 kcal' },
      { label: 'Carbohydrates', value: '≈32 g' },
      { label: 'Total Sugars', value: '≈15 g' },
      { label: 'Total Fat', value: '≈9 g' },
      { label: 'Protein', value: '≈4 g' },
      { label: 'Fiber', value: '≈1 g' },
      { label: 'Sodium', value: '≈300 mg' },
    ],
    quiz: [
      {
        topic: 'sugar',
        question: 'How much sugar is packed into one donut (60 g)?',
        options: ['9 g', '25 g'],
        correctIndex: 0,
        explanation: 'A donut has about 9 g of sugar — roughly 2 teaspoons, all by itself.',
      },
      {
        topic: 'fat',
        question: 'How much fat (butter) goes into one donut?',
        options: ['6 g', '20 g'],
        correctIndex: 0,
        explanation: 'About 6 g of butter fat — plus more oil soaked up while it fries.',
      },
      {
        topic: 'calories',
        question: 'Most of a donut is refined flour (maida). How much is in one donut?',
        options: ['24 g', '50 g'],
        correctIndex: 0,
        explanation: '24 g of refined flour. It has had the fibre stripped out, so it turns into sugar in your body very fast.',
      },
    ],
  },
  {
    id: 'chocolate-bar',
    name: 'Chocolate Bar',
    category: 'junk',
    servingSize: '100 g',
    ingredients: [
      { name: 'Sugar', amount: '40 g' },
      { name: 'Cocoa powder', amount: '20 g' },
      { name: 'Cocoa butter', amount: '18 g' },
      { name: 'Milk solids', amount: '10 g' },
      { name: 'Emulsifier', amount: '2 g' },
      { name: 'Flavor & additives', amount: '0.5 g' },
    ],
    nutrition: [
      { label: 'Energy', value: '≈535 kcal' },
      { label: 'Carbohydrates', value: '≈56 g' },
      { label: 'Total Sugars', value: '≈42 g' },
      { label: 'Total Fat', value: '≈32 g' },
      { label: 'Saturated Fat', value: '≈19 g' },
      { label: 'Protein', value: '≈8 g' },
      { label: 'Fiber', value: '≈4 g' },
    ],
    quiz: [
      {
        topic: 'sugar',
        question: 'How much sugar is hiding in a 100 g chocolate bar?',
        options: ['40 g', '12 g'],
        correctIndex: 0,
        explanation: '40 g — that is almost half the bar made of pure sugar!',
      },
      {
        topic: 'fat',
        question: 'How much saturated fat is in a 100 g chocolate bar?',
        options: ['19 g', '4 g'],
        correctIndex: 0,
        explanation: '19 g of saturated fat — the kind your heart wants you to go easy on.',
      },
      {
        topic: 'calories',
        question: 'Cocoa butter is the fat that makes chocolate melt. How much is in the bar?',
        options: ['18 g', '3 g'],
        correctIndex: 0,
        explanation: '18 g of cocoa butter. Fat carries the most energy of anything you eat, so this is why a small bar has so many calories.',
      },
    ],
  },
  {
    id: 'mango',
    name: 'Mango',
    category: 'healthy',
    servingSize: '165 g (1 cup, sliced)',
    isPlaceholder: true,
    ingredients: [
      { name: 'Carbohydrates', amount: '≈25 g' },
      { name: 'Natural sugars', amount: '≈23 g' },
      { name: 'Dietary fibre', amount: '≈2.6 g' },
      { name: 'Vitamin C', amount: '≈60 mg' },
      { name: 'Potassium', amount: '≈257 mg' },
    ],
    nutrition: [
      { label: 'Energy', value: '≈99 kcal' },
      { label: 'Carbohydrates', value: '≈25 g' },
      { label: 'Natural Sugars', value: '≈23 g' },
      { label: 'Dietary Fibre', value: '≈2.6 g' },
      { label: 'Vitamin C', value: '≈60 mg' },
      { label: 'Potassium', value: '≈257 mg' },
    ],
    quiz: [
      {
        topic: 'vitamins',
        question: 'Mango is bursting with which vitamin?',
        options: ['Vitamin C', 'Vitamin K'],
        correctIndex: 0,
        explanation: '≈60mg of Vitamin C — even more than an apple!',
      },
      {
        topic: 'sugar',
        question: 'About how much natural sugar is in a cup of mango?',
        options: ['≈23 g', '≈60 g'],
        correctIndex: 0,
        explanation: '≈23g of natural sugar, along with fibre and vitamins.',
      },
      {
        topic: 'calories',
        question: 'How many calories are in a cup of mango?',
        options: ['≈99 kcal', '≈300 kcal'],
        correctIndex: 0,
        explanation: '≈99 kcal for a full cup of sweet mango.',
      },
    ],
  },
  {
    id: 'apple',
    name: 'Apple',
    category: 'healthy',
    servingSize: '1 apple (180 g)',
    ingredients: [
      { name: 'Fresh apple flesh & skin', amount: '180 g' },
      { name: 'Dietary fibre (pectin)', amount: '4.5 g' },
      { name: 'Natural fruit sugars (fructose)', amount: '19 g' },
      { name: 'Water content', amount: '156 g' },
    ],
    nutrition: [
      { label: 'Energy', value: '≈95 kcal' },
      { label: 'Carbohydrates', value: '≈25 g' },
      { label: 'Natural Sugars', value: '≈19 g' },
      { label: 'Dietary Fibre', value: '≈4.5 g' },
      { label: 'Vitamin C', value: '≈8 mg' },
      { label: 'Potassium', value: '≈195 mg' },
    ],
    quiz: [
      {
        topic: 'sugar',
        question: 'How much natural sugar is in one apple (180 g)?',
        options: ['19 g', '45 g'],
        correctIndex: 0,
        explanation: '19 g — sweet, but it arrives wrapped in 4.5 g of fibre, so your body takes it in slowly.',
      },
      {
        topic: 'vitamins',
        question: 'How much Vitamin C does one apple give you?',
        options: ['8 mg', '80 mg'],
        correctIndex: 0,
        explanation: '8 mg of Vitamin C, plus 195 mg of potassium to keep your muscles happy.',
      },
      {
        topic: 'calories',
        question: 'How much energy is in one whole apple?',
        options: ['95 kcal', '300 kcal'],
        correctIndex: 0,
        explanation: 'Only 95 kcal for a whole apple — and the fibre keeps you full for ages.',
      },
    ],
  },
];

export function getFoodById(id: string): FoodItem | undefined {
  return FOODS.find((f) => f.id === id);
}
