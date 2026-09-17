import { create } from 'zustand';

interface TourState {
  active: boolean;
  stepIndex: number;
  start: () => void;
  next: () => void;
  back: () => void;
  end: () => void;
}

const SEEN_KEY = 'healthify_tour_seen';

export const useTourStore = create<TourState>((set) => ({
  active: false,
  stepIndex: 0,

  start: () => set({ active: true, stepIndex: 0 }),
  next: () => set((s) => ({ stepIndex: s.stepIndex + 1 })),
  back: () => set((s) => ({ stepIndex: Math.max(0, s.stepIndex - 1) })),
  end: () => {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // storage unavailable (private mode etc.) — the tour just won't stay "seen"
    }
    set({ active: false, stepIndex: 0 });
  },
}));

export function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

if (import.meta.env.DEV) {
  (window as unknown as { __tour: typeof useTourStore }).__tour = useTourStore;
}
