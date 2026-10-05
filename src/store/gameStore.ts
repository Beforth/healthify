import { create } from 'zustand';
import type { FoodCategory, QuizTopic } from '../data/nutritionData';

export type GameStep = 'choose-topic' | 'cut' | 'microscope' | 'quiz' | 'result';

interface GameState {
  selectedCategory: FoodCategory | null;
  /** Category of the most recently submitted answer, not the last food opened. */
  lastCategoryPlayed: FoodCategory | null;
  selectedTopic: QuizTopic | null;
  gameStep: GameStep;
  lastAnswerCorrect: boolean | null;

  selectFood: (foodId: string, category: FoodCategory) => void;
  selectTopic: (topic: QuizTopic) => void;
  advanceStep: (step: GameStep) => void;
  answerQuiz: (correct: boolean) => void;
  resetForNextFood: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  selectedCategory: null,
  lastCategoryPlayed: null,
  selectedTopic: null,
  gameStep: 'choose-topic',
  lastAnswerCorrect: null,

  selectFood: (_foodId, category) =>
    set({
      selectedCategory: category,
      gameStep: 'choose-topic',
      selectedTopic: null,
      lastAnswerCorrect: null,
    }),

  selectTopic: (topic) => set({ selectedTopic: topic, gameStep: 'cut' }),

  advanceStep: (step) => set({ gameStep: step }),

  answerQuiz: (correct) => set((state) => ({
    lastCategoryPlayed: state.selectedCategory ?? state.lastCategoryPlayed,
    lastAnswerCorrect: correct,
    gameStep: 'result',
  })),


  resetForNextFood: () =>
    set({
      selectedCategory: null,
      selectedTopic: null,
      gameStep: 'choose-topic',
      lastAnswerCorrect: null,
    }),
}));

/** Alternate only after an answer is submitted, whether correct or incorrect. */
export function nextRequiredCategory(last: FoodCategory | null): FoodCategory | null {
  if (last === null) return null;
  return last === 'healthy' ? 'junk' : 'healthy';
}

if (import.meta.env?.DEV) {
  (window as unknown as { __game: typeof useGameStore }).__game = useGameStore;
}
