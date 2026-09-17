import { create } from 'zustand';

interface ReviewState {
  questionsAnswered: number;
  showModal: boolean;
  recordAnswer: () => void;
  dismiss: () => void;
}

const PROMPTED_KEY = 'healthify_review_prompted';

function hasBeenPrompted(): boolean {
  try {
    return localStorage.getItem(PROMPTED_KEY) === '1';
  } catch {
    return true;
  }
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  questionsAnswered: 0,
  showModal: false,

  recordAnswer: () => {
    const count = get().questionsAnswered + 1;
    const justHitThree = count === 3 && !hasBeenPrompted();
    set({ questionsAnswered: count, showModal: get().showModal || justHitThree });
  },

  dismiss: () => {
    try {
      localStorage.setItem(PROMPTED_KEY, '1');
    } catch {
      // storage unavailable — the modal just won't remember it was shown
    }
    set({ showModal: false });
  },
}));

if (import.meta.env.DEV) {
  (window as unknown as { __review: typeof useReviewStore }).__review = useReviewStore;
}
