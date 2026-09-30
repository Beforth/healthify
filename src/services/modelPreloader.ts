import { useGLTF } from '@react-three/drei';
import { FOODS } from '../data/nutritionData';
import { FOOD_MODELS, PREVIEW_SCANS, preloadForGame } from '../game/food3d/foodRegistry';
import { warmPreviewCache } from '../game/food3d/PreviewRenderer';

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

/** Food IDs from FOODS[], in page order, that have a 3D preview (model or scan). */
function foodIdsWithPreviews(): string[] {
  return FOODS
    .map((f) => f.id)
    .filter((id) => Boolean(FOOD_MODELS[id] ?? PREVIEW_SCANS[id]));
}

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

    const ids = foodIdsWithPreviews();

    // 1. Warm the thumbnail PreviewCache (builds Three.js geometry for the picker cards).
    warmPreviewCache(ids);

    // 2. Also warm drei's useGLTF Suspense cache, page-by-page via idle callbacks.
    //    When the game screen mounts, useGLTF() reads from cache synchronously
    //    so the model paints on the very first frame.
    //    8 foods per idle slot matches the picker page size.
    const PAGE = 8;
    let offset = 0;
    const scheduleNext = () => {
      if (offset >= ids.length) return;
      const batch = ids.slice(offset, offset + PAGE);
      offset += PAGE;
      const cb = () => {
        batch.forEach((id) => preloadForGame(id));
        scheduleNext();
      };
      if ('requestIdleCallback' in window) {
        (window as Window).requestIdleCallback(cb, { timeout: 5000 });
      } else {
        setTimeout(cb, 500);
      }
    };
    scheduleNext();
  }
}

export const modelPreloader = new ModelPreloader();
