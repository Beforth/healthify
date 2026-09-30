import { useGLTF } from '@react-three/drei';

export interface PreloadProgress {
  loaded: number;
  total: number;
  percentage: number;
  label: string;
}

// Only preload 4 essential models so loading completes in under 1 second!
// Note: Donut, Mango, Apple, Egg, Carrot are built with procedural 3D math (0 KB to download!).
export const PRIORITY_MODELS = [
  { id: 'chocolate-bar', name: 'Chocolate Bar', url: 'models/chocolate.glb', emoji: '🍫', action: 'Unwrapping chocolate...' },
  { id: 'pineapple', name: 'Pineapple', url: 'models/pineapple.glb', emoji: '🍍', action: 'Slicing pineapple...' },
  { id: 'sweet-potato', name: 'Sweet Potato', url: 'models/sweet-potato.glb', emoji: '🍠', action: 'Roasting sweet potato...' },
  { id: 'burger', name: 'Burger', url: 'models/burger.glb', emoji: '🍔', action: 'Grilling 3D burger...' },
];

export const REMAINING_MODELS = [
  'models/cream_biscuit.glb',
  'models/broccoli.glb',
  'models/peanut.glb',
  'models/soft-drink.glb',
  'models/potato-chips.glb',
  'models/sweet corn.glb',
  'models/milk.glb',
  'models/hot-dog.glb',
  'models/waffles.glb',
  'models/pan-cake.glb',
  'models/cupcake.glb',
  'models/candy.glb',
  'models/bubble-tea.glb',
  'models/spinach.glb',
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
      return new Promise((resolve) => {
        const check = () => {
          if (this.ready) resolve();
          else setTimeout(check, 80);
        };
        check();
      });
    }

    this.preloading = true;
    const total = PRIORITY_MODELS.length;
    let loaded = 0;

    // Load all 4 in parallel for maximum speed
    const concurrency = 4;
    const queue = [...PRIORITY_MODELS];

    // Safety timeout: Never make the user wait more than 1.4 seconds even on slow networks
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        this.ready = true;
        this.preloading = false;
        this.startBackgroundPreloading();
        resolve();
      }, 1400);
    });

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
          // Continue gracefully
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

    const loadPromise = Promise.all(
      Array.from({ length: concurrency }, () => worker()),
    ).then(() => {
      this.notify({
        loaded: total,
        total,
        percentage: 100,
        label: '✨ Ready to play!',
      });
      this.ready = true;
      this.preloading = false;
      this.startBackgroundPreloading();
    });

    await Promise.race([loadPromise, timeoutPromise]);
  }

  startBackgroundPreloading(): void {
    if (this.backgroundStarted) return;
    this.backgroundStarted = true;

    // Background streaming starts after 800ms
    setTimeout(() => {
      this.loadRemainingQueue();
    }, 800);
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

      // Smooth 250ms spacing between background downloads
      setTimeout(processNext, 250);
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => processNext());
    } else {
      setTimeout(processNext, 300);
    }
  }
}

export const modelPreloader = new ModelPreloader();
