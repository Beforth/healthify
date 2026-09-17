export interface TourStep {
  /** Route this step lives on — the tour navigates here automatically. */
  path: string;
  /** data-tour value of the element to spotlight, or null for a centered message. */
  target: string | null;
  title: string;
  text: string;
  placement: 'top' | 'bottom' | 'center';
}

export const TOUR_STEPS: TourStep[] = [
  {
    path: '/',
    target: 'menu-button',
    title: 'The menu',
    text: 'Tap here anytime for About, Terms, and Contact info.',
    placement: 'bottom',
  },
  {
    path: '/',
    target: 'play-button',
    title: "Let's play!",
    text: 'Tap this to start your food adventure.',
    placement: 'top',
  },
  {
    path: '/learn',
    target: 'feature-grid',
    title: 'What you can do',
    text: "Here's a quick look at what Healthify is all about.",
    placement: 'bottom',
  },
  {
    path: '/learn',
    target: 'show-me-how-button',
    title: 'How to play',
    text: 'This next screen walks you through cutting food open and inspecting it, step by step.',
    placement: 'top',
  },
  {
    path: '/tutorial',
    target: null,
    title: 'Follow along',
    text: 'Use Next to move through the steps at your own pace, whenever you like.',
    placement: 'center',
  },
  {
    path: '/foods',
    target: 'food-search',
    title: 'Search',
    text: 'Looking for something specific? Search for it here.',
    placement: 'bottom',
  },
  {
    path: '/foods',
    target: 'food-card-0',
    title: 'Pick a food',
    text: 'Tap any food card to start exploring it in 3D!',
    placement: 'top',
  },
];
