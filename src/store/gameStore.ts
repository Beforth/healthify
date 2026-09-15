import { create } from 'zustand';
import type { FoodCategory, QuizTopic } from '../data/nutritionData';

export type GameStep = 'choose-topic' | 'cut' | 'microscope' | 'quiz' | 'result';

interface GameState {
  score: number;
  lastCategoryPlayed: FoodCategory | null;
  selectedTopic: QuizTopic | null;
  gameStep: GameStep;
  lastAnswerCorrect: boolean | null;

  selectFood: (foodId: string, category: FoodCategory) => void;
  selectTopic: (topic: QuizTopic) => void;
  advanceStep: (step: GameStep) => void;
  answerQuiz: (correct: boolean) => void;
  addPoints: (points: number) => void;
  resetForNextFood: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  score: 0,
  lastCategoryPlayed: null,
  selectedTopic: null,
  gameStep: 'choose-topic',
  lastAnswerCorrect: null,

  selectFood: (_foodId, category) =>
    set({
      lastCategoryPlayed: category,
      gameStep: 'choose-topic',
      selectedTopic: null,
      lastAnswerCorrect: null,
    }),

  selectTopic: (topic) => set({ selectedTopic: topic, gameStep: 'cut' }),

  advanceStep: (step) => set({ gameStep: step }),

  answerQuiz: (correct) => set({ lastAnswerCorrect: correct, gameStep: 'result' }),

  addPoints: (points) => set((s) => ({ score: s.score + points })),

  resetForNextFood: () =>
    set({
      selectedTopic: null,
      gameStep: 'choose-topic',
      lastAnswerCorrect: null,
    }),
}));

/** Given the last category played, which category should be offered next (alternation rule). */
export function nextRequiredCategory(last: FoodCategory | null): FoodCategory | null {
  if (last === null) return null;
  return last === 'healthy' ? 'junk' : 'healthy';
}

if (import.meta.env.DEV) {
  (window as unknown as { __game: typeof useGameStore }).__game = useGameStore;
}
