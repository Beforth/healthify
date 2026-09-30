import { useGLTF } from '@react-three/drei';

export interface PreloadProgress {
  loaded: number;
  total: number;
  percentage: number;
  label: string;
}

export const PRIORITY_MODELS = [
  { id: 'chocolate-bar', name: 'Chocolate Bar', url: 'models/chocolate.glb', emoji: '🍫', action: 'Unwrapping rich chocolate...' },
  { id: 'pineapple', name: 'Pineapple', url: 'models/pineapple.glb', emoji: '🍍', action: 'Slicing tropical pineapple...' },
  { id: 'sweet-potato', name: 'Sweet Potato', url: 'models/sweet-potato.glb', emoji: '🍠', action: 'Roasting sweet potatoes...' },
  { id: 'cream-biscuits', name: 'Cream Biscuits', url: 'models/cream_biscuit.glb', emoji: '🍪', action: 'Stacking crispy cream biscuits...' },
  { id: 'broccoli', name: 'Broccoli', url: 'models/broccoli.glb', emoji: '🥦', action: 'Washing fresh green broccoli...' },
  { id: 'peanuts', name: 'Peanuts', url: 'models/peanut.glb', emoji: '🥜', action: 'Shelling crunchy peanuts...' },
  { id: 'soft-drink', name: 'Soft Drink', url: 'models/soft-drink.glb', emoji: '🥤', action: 'Chilling fizzy refreshments...' },
  { id: 'potato-chips', name: 'Potato Chips', url: 'models/potato-chips.glb', emoji: '🥔', action: 'Crisping golden potato chips...' },
  { id: 'corn', name: 'Sweet Corn', url: 'models/sweet corn.glb', emoji: '🌽', action: 'Steaming sweet juicy corn...' },
  { id: 'burger', name: 'Burger', url: 'models/burger.glb', emoji: '🍔', action: 'Grilling delicious 3D burger patties...' },
  { id: 'milk', name: 'Milk Carton', url: 'models/milk.glb', emoji: '🥛', action: 'Pouring chilled farm-fresh milk...' },
  { id: 'hot-dog', name: 'Hot Dog', url: 'models/hot-dog.glb', emoji: '🌭', action: 'Toasting fluffy hot dog buns...' },
  { id: 'waffle', name: 'Belgian Waffle', url: 'models/waffles.glb', emoji: '🧇', action: 'Baking crispy golden waffles...' },
  { id: 'pancakes', name: 'Pancakes', url: 'models/pan-cake.glb', emoji: '🥞', action: 'Flipping warm fluffy pancakes...' },
  { id: 'cupcake', name: 'Cupcake', url: 'models/cupcake.glb', emoji: '🧁', action: 'Swirling sweet frosting on cupcakes...' },
  { id: 'candy', name: 'Candy', url: 'models/candy.glb', emoji: '🍬', action: 'Wrapping colorful fruit candies...' },
  { id: 'bubble-tea', name: 'Bubble Tea', url: 'models/bubble-tea.glb', emoji: '🧋', action: 'Brewing tapioca pearl bubble tea...' },
  { id: 'spinach', name: 'Spinach', url: 'models/spinach.glb', emoji: '🥬', action: 'Rinsing tender baby spinach...' },
];

export const REMAINING_MODELS = [
  'models/cabbage.glb',
  'models/oats.glb',
  'models/walnuts.glb',
  'models/amla.glb',
  'models/bajra.glb',
  'models/beetroot.glb',
  'models/bhindi.glb',
  'models/black-gram.glb',
  'models/bottel gourd.glb',
  'models/bread.glb',
  'models/brown-rice.glb',
  'models/cake.glb',
  'models/capsicum.glb',
  'models/cauliflower.glb',
  'models/chana-daal.glb',
  'models/cheese-fries.glb',
  'models/cucumber.glb',
  'models/curd.glb',
  'models/drumstick.glb',
  'models/garlic.glb',
  'models/green-beans.glb',
  'models/green-gram.glb',
  'models/green-peas.glb',
  'models/guava.glb',
  'models/ice-creame.glb',
  'models/kidney_beans.glb',
  'models/kiwi.glb',
  'models/lollipop.glb',
  'models/masoor-daal.glb',
  'models/onion.glb',
  'models/orange.glb',
  'models/papaaya.glb',
  'models/pasta.glb',
  'models/pomegranate.glb',
  'models/pumpckin.glb',
  'models/radish.glb',
  'models/ragi.glb',
  'models/soyabean.glb',
  'models/sweet-lime.glb',
  'models/taco.glb',
  'models/tomato.glb',
  'models/toor-daal.glb',
  'models/watermelon.glb',
];

class ModelPreloader {
  private ready = false;
  private preloading = false;
  private backgroundStarted = false;
  private listeners = new Set<(progress: PreloadProgress) => void>();

  isReady(): boolean {
    return this.ready;
  }

  onProgress(listener: (progress: PreloadProgress) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(progress: PreloadProgress) {
    this.listeners.forEach((fn) => fn(progress));
  }

  async loadInitialBatch(): Promise<void> {
    if (this.ready) return;
    if (this.preloading) {
      // Wait for existing run to complete
      return new Promise((resolve) => {
        const check = () => {
          if (this.ready) resolve();
          else setTimeout(check, 100);
        };
        check();
      });
    }

    this.preloading = true;
    const total = PRIORITY_MODELS.length;
    let loaded = 0;

    // Concurrency limit of 3 to avoid network contention on mobile
    const concurrency = 3;
    const queue = [...PRIORITY_MODELS];

    const worker = async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;

        this.notify({
          loaded,
          total,
          percentage: Math.round((loaded / total) * 100),
          label: `${item.emoji} ${item.action}`,
        });

        try {
          const fullUrl = `${import.meta.env.BASE_URL}${item.url}`;
          useGLTF.preload(fullUrl);
          const res = await fetch(fullUrl);
          if (res.ok) await res.blob();
        } catch {
          // Continue gracefully on network hiccups
        }

        loaded++;
        this.notify({
          loaded,
          total,
          percentage: Math.round((loaded / total) * 100),
          label: `${item.emoji} ${item.action}`,
        });
      }
    };

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    this.notify({
      loaded: total,
      total,
      percentage: 100,
      label: '✨ Everything is set! Let\'s cook and learn!',
    });

    this.ready = true;
    this.preloading = false;

    // Start background loading of remaining models quietly
    this.startBackgroundPreloading();
  }

  startBackgroundPreloading(): void {
    if (this.backgroundStarted) return;
    this.backgroundStarted = true;

    // Wait 1.5 seconds after initial screen loads so user gets silky smooth interactions
    setTimeout(() => {
      this.loadRemainingQueue();
    }, 1500);
  }

  private async loadRemainingQueue(): Promise<void> {
    const queue = [...REMAINING_MODELS];

    const processNext = async () => {
      if (queue.length === 0) return;
      const url = queue.shift()!;
      try {
        const fullUrl = `${import.meta.env.BASE_URL}${url}`;
        useGLTF.preload(fullUrl);
        const res = await fetch(fullUrl);
        if (res.ok) await res.blob();
      } catch {
        // Silent ignore
      }

      // 400ms pause between background items so network stays completely free for user actions
      setTimeout(processNext, 400);
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => processNext());
    } else {
      setTimeout(processNext, 500);
    }
  }
}

export const modelPreloader = new ModelPreloader();
