import * as THREE from 'three';
import { OrbitControls, RGBELoader } from 'three-stdlib';
import { PreviewBuilder, type PreviewResource } from './previewResources';
import { PreviewCache } from './previewCache';
import { PREVIEW_SCANS } from './foodRegistry';
import { isTouchOnly } from '../../lib/touch';

const MAX_MODELS = 256;
const MAX_BYTES = 1024 * 1024 * 1024; // Generous budget so no model is ever evicted or rejected
const MAX_POSTERS = 64;
const RENDER_SIZE = 240;
/** Visible cards run up to 4 parallel GLTF builds with top priority.
 *  Idle warmup runs at most 1 at a time and yields to any visible builds. */
const MAX_VISIBLE_CONCURRENT = 4;
const MAX_WARMUP_CONCURRENT = 1;
const ENVIRONMENT = 'https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/lebombo_1k.hdr';

let isUserScrolling = false;
let scrollEndTimer = 0;
if (typeof window !== 'undefined') {
  const onScroll = () => {
    isUserScrolling = true;
    clearTimeout(scrollEndTimer);
    scrollEndTimer = window.setTimeout(() => {
      isUserScrolling = false;
      renderer?.wake();
    }, 150);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('touchmove', onScroll, { passive: true });
}

interface View {
  id: string;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  scale: number;
  visible: boolean;
  ready: () => void;
  painted: boolean;
  needsRender: boolean;
}

/** One small, persistent WebGL renderer feeds ordinary 2D canvas presentation
 * surfaces. This keeps CSS clipping, card opacity, overlays and scrolling correct
 * without a full-window WebGL overlay. Models/textures stay on the SAME GPU
 * context across pagination and routes; only dirty/visible surfaces are drawn
 * on demand. Idle CPU and GPU usage drop to zero.
 *
 * GLB models are built up to MAX_GLTF_CONCURRENT at a time (pure network I/O).
 * Procedural models serialize through a single Fiber root. Warmup runs via
 * requestIdleCallback and always yields to visible-card builds. */
class PreviewRenderer {
  private gl = new THREE.WebGLRenderer({ alpha: true, antialias: false });
  private builder = new PreviewBuilder(this.gl);
  private cache = new PreviewCache<PreviewResource>(MAX_MODELS, MAX_BYTES);
  private posters = new Map<string, { canvas: HTMLCanvasElement; camera: THREE.Vector3 }>();
  private views = new Set<View>();
  private scene = new THREE.Scene();
  private holder = new THREE.Group();
  private observer: IntersectionObserver;
  private frame = 0;
  /** Tracks IDs of all in-flight builds (visible + warmup) so nothing is built twice. */
  private buildingIds = new Set<string>();
  /** Fiber root lock — only one procedural build at a time. */
  private buildingProcedural = false;
  /** Active visible GLTF builds (top priority). */
  private visibleBuildCount = 0;
  /** Active background warmup GLTF builds (yields to visible). */
  private warmupBuildCount = 0;
  private lost = false;
  private disposed = false;
  private failed = new Set<string>();
  private environment?: THREE.WebGLRenderTarget;
  private stats = { contextCreations: 1, contextLosses: 0, builds: 0, cacheHits: 0,
    draws: 0, frames: 0, failures: 0, buildMs: [] as { id: string; ms: number }[], attachMs: [] as number[] };
  /** Ordered list of food IDs to build into cache ahead of time during browser idle periods. */
  private warmupQueue: string[] = [];

  constructor() {
    this.gl.setClearColor(0x000000, 0);
    this.gl.setPixelRatio(1);
    this.gl.setSize(RENDER_SIZE, RENDER_SIZE, false);
    this.gl.toneMapping = THREE.ACESFilmicToneMapping;
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.35);
    key.position.set(3.2, 4.8, 3.5);
    const fill = new THREE.DirectionalLight('#cfe8ff', 0.45);
    fill.position.set(-3.5, 1.5, -2);
    this.scene.add(key, fill, this.holder);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16 }));
    shadow.position.y = -1.3;
    shadow.rotation.x = -Math.PI / 2;
    this.scene.add(shadow);
    this.observer = new IntersectionObserver((entries) => {
      let newlyVisible = false;
      for (const entry of entries) {
        for (const view of this.views) {
          if (view.canvas === entry.target) {
            const wasVisible = view.visible;
            view.visible = entry.isIntersecting;
            if (!wasVisible && view.visible && !view.painted) {
              view.needsRender = true;
              newlyVisible = true;
            }
          }
        }
      }
      if (newlyVisible || this.visibleViews().some((v) => v.needsRender)) {
        this.wake();
      } else if (!this.visibleViews().length) {
        this.stop();
      }
    });
    document.addEventListener('visibilitychange', this.visibilityChanged);
    window.addEventListener('pagehide', this.pageHidden);
    this.gl.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.lost = true;
      this.stats.contextLosses++;
      this.stop();
    });
    this.gl.domElement.addEventListener('webglcontextrestored', () => {
      this.lost = false;
      for (const view of this.views) view.needsRender = true;
      this.wake();
    });
    void new RGBELoader().loadAsync(ENVIRONMENT).then((hdr) => {
      if (this.disposed) { hdr.dispose(); return; }
      const generator = new THREE.PMREMGenerator(this.gl);
      this.environment = generator.fromEquirectangular(hdr);
      this.scene.environment = this.environment.texture;
      this.scene.environmentIntensity = 0.85;
      hdr.dispose();
      generator.dispose();
      for (const view of this.views) view.needsRender = true;
      this.wake();
    }).catch(() => { /* Direct lighting is the offline fallback. */ });
  }

  private visibilityChanged = () => {
    if (document.hidden) {
      this.stop();
    } else {
      for (const view of this.views) view.needsRender = true;
      this.wake();
    }
  };
  private pageHidden = (event: PageTransitionEvent) => { if (!event.persisted) this.dispose(); };
  private stop() { cancelAnimationFrame(this.frame); this.frame = 0; }
  private visibleViews() { return [...this.views].filter((view) => view.visible && view.canvas.isConnected); }
  private hasPendingVisible() {
    return this.visibleViews().some((v) => !this.cache.has(v.id) && !this.failed.has(v.id) && !this.buildingIds.has(v.id));
  }
  private isScan(id: string) { return Boolean(PREVIEW_SCANS[id]); }

  attach(id: string, canvas: HTMLCanvasElement, scale: number, ready: () => void) {
    const start = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixels = Math.min(RENDER_SIZE, Math.round((canvas.clientWidth || 100) * dpr));
    canvas.width = canvas.height = pixels || RENDER_SIZE;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return () => {};
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    camera.position.set(0, 1.25, 5.6);
    const poster = this.posters.get(id);
    if (poster) camera.position.copy(poster.camera);
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0.35, 0);
    controls.enablePan = false;
    controls.minDistance = 2.8;
    controls.maxDistance = 6;
    controls.minPolarAngle = Math.PI / 3.2;
    controls.maxPolarAngle = Math.PI / 1.6;
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 1.4;
    controls.update();
    // A thumbnail inside a scrolling list must not own the finger. OrbitControls claims every
    // touch on its canvas, so on touch/mobile devices it is switched off and vertical panning is preserved.
    controls.enableZoom = false;
    const isTouch = isTouchOnly() || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 768);
    if (isTouch) {
      controls.enabled = false;
    }
    canvas.style.touchAction = 'pan-y';

    const rect = canvas.getBoundingClientRect();
    const view: View = {
      id,
      canvas,
      context,
      camera,
      controls,
      scale,
      ready,
      painted: false,
      needsRender: true,
      visible: rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth,
    };

    controls.addEventListener('start', () => { this.wake(); });
    controls.addEventListener('change', () => { view.needsRender = true; this.wake(); });

    this.views.add(view);
    this.observer.observe(canvas);
    if (poster) {
      context.drawImage(poster.canvas, 0, 0, canvas.width, canvas.height);
      ready();
    }
    const resource = this.cache.get(id);
    if (resource) {
      this.stats.cacheHits++;
      if (!this.lost && view.visible && !document.hidden) {
        this.draw(view, resource);
        view.needsRender = false;
      }
    }
    this.stats.attachMs.push(performance.now() - start);
    if (this.stats.attachMs.length > 32) this.stats.attachMs.shift();
    this.wake();
    return () => {
      if (view.painted) this.savePoster(view);
      this.observer.unobserve(canvas);
      this.views.delete(view);
      controls.dispose();
      if (!this.visibleViews().length) this.stop();
    };
  }

  private draw(view: View, resource: PreviewResource) {
    const w = view.canvas.width;
    const h = view.canvas.height;
    if (!w || !h) return;

    this.holder.clear();
    this.holder.scale.setScalar(view.scale);
    this.holder.add(resource.object);

    this.gl.render(this.scene, view.camera);

    view.context.clearRect(0, 0, w, h);
    view.context.drawImage(this.gl.domElement, 0, 0, w, h);

    view.painted = true;
    view.ready();
    this.stats.draws++;
  }

  private savePoster(view: View) {
    let poster = this.posters.get(view.id)?.canvas;
    if (!poster) {
      poster = document.createElement('canvas');
      poster.width = poster.height = 128;
    }
    poster.getContext('2d')!.clearRect(0, 0, 128, 128);
    poster.getContext('2d')!.drawImage(view.canvas, 0, 0, 128, 128);
    this.posters.delete(view.id);
    this.posters.set(view.id, { canvas: poster, camera: view.camera.position.clone() });
    if (this.posters.size > MAX_POSTERS) this.posters.delete(this.posters.keys().next().value!);
  }

  private buildTimer = 0;

  wake() {
    if (this.disposed || this.lost || document.hidden || !this.visibleViews().length) return;
    if (!this.frame) this.frame = requestAnimationFrame(this.tick);

    // Debounce builds off the scroll path so swiping is 100% smooth and hitch-free
    clearTimeout(this.buildTimer);
    if (isUserScrolling) {
      this.buildTimer = setTimeout(() => this.wake(), 180) as unknown as number;
      return;
    }
    const win = typeof window !== 'undefined' ? (window as unknown as { requestIdleCallback?: (cb: () => void) => void }) : {};
    if (typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(() => {
        if (!isUserScrolling && !this.disposed) this.buildNext();
      });
    } else {
      this.buildTimer = setTimeout(() => {
        if (!isUserScrolling && !this.disposed) this.buildNext();
      }, 80) as unknown as number;
    }
  }

  /** Start builds for all visible uncached views, giving them top priority.
   *  GLB models run up to MAX_VISIBLE_CONCURRENT in parallel.
   *  Procedural models serialize through the shared Fiber root. */
  private buildNext() {
    if (this.disposed || this.lost || document.hidden || isUserScrolling) return;
    for (const view of this.visibleViews()) {
      if (this.cache.has(view.id) || this.failed.has(view.id) || this.buildingIds.has(view.id)) continue;
      const scan = this.isScan(view.id);
      if (scan && this.visibleBuildCount >= MAX_VISIBLE_CONCURRENT) continue;
      if (!scan && this.buildingProcedural) continue;
      void this.buildOneVisible(view, scan);
      if (!scan) break;
    }
  }

  private async buildOneVisible(view: View, scan: boolean) {
    this.buildingIds.add(view.id);
    if (scan) this.visibleBuildCount++;
    else this.buildingProcedural = true;

    // Yield once so navigation/search can commit and stale views can detach.
    await new Promise<void>((r) => setTimeout(r, 0));

    if (this.disposed || !this.visibleViews().some((v) => v.id === view.id) || document.hidden) {
      this.buildingIds.delete(view.id);
      if (scan) this.visibleBuildCount--; else this.buildingProcedural = false;
      this.wake();
      return;
    }

    const start = performance.now();
    try {
      const resource = await this.builder.build(view.id);
      this.stats.builds++;
      this.stats.buildMs.push({ id: view.id, ms: performance.now() - start });
      if (this.stats.buildMs.length > 32) this.stats.buildMs.shift();
      if (this.disposed) {
        resource.dispose();
      } else {
        this.cache.add(view.id, resource, new Set(this.visibleViews().map((v) => v.id)));
        this.draw(view, resource);
        view.needsRender = false;
      }
    } catch (error) {
      this.failed.add(view.id);
      this.stats.failures++;
      console.warn(`Food preview unavailable: ${view.id}`, error);
    } finally {
      this.buildingIds.delete(view.id);
      if (scan) this.visibleBuildCount--; else this.buildingProcedural = false;
      // Restart buildNext in case more visible views are waiting.
      this.wake();
    }
  }

  /** Pre-build model resources for a prioritized list of food IDs during idle time.
   *  Visible cards always have priority — warmup only uses spare capacity. */
  warmCache(ids: string[]) {
    for (const id of ids) {
      if (!this.cache.has(id) && !this.failed.has(id) && !this.warmupQueue.includes(id)) {
        this.warmupQueue.push(id);
      }
    }
    this.scheduleWarmup();
  }

  private scheduleWarmup() {
    if (this.warmupQueue.length === 0 || this.disposed) return;
    const run = (deadline?: IdleDeadline) => {
      if (this.disposed) return;
      if (isUserScrolling) {
        setTimeout(() => this.scheduleWarmup(), 400);
        return;
      }
      if (deadline && deadline.timeRemaining() < 25 && !deadline.didTimeout) {
        if ('requestIdleCallback' in window) (window as Window).requestIdleCallback(run);
        return;
      }
      this.drainWarmupQueue();
    };
    if ('requestIdleCallback' in window) {
      // No timeout parameter — never force execution while the user is busy scrolling
      (window as Window).requestIdleCallback(run);
    } else {
      setTimeout(() => this.drainWarmupQueue(), 1200);
    }
  }

  private drainWarmupQueue() {
    // If user is scrolling, visible cards are waiting, or user is in active gameplay, don't warm up
    if (isUserScrolling || this.hasPendingVisible() || (typeof window !== 'undefined' && window.location.pathname.startsWith('/play'))) {
      return;
    }
    // Remove anything already cached or in flight.
    while (this.warmupQueue.length > 0) {
      const id = this.warmupQueue[0];
      if (!this.cache.has(id) && !this.failed.has(id) && !this.buildingIds.has(id)) break;
      this.warmupQueue.shift();
    }
    if (!this.warmupQueue.length || this.disposed || this.warmupBuildCount >= MAX_WARMUP_CONCURRENT) return;

    // Fire warmup builds using spare capacity without competing with visible views
    for (const id of [...this.warmupQueue]) {
      if (!this.cache.has(id) && !this.failed.has(id) && !this.buildingIds.has(id)) {
        const scan = this.isScan(id);
        if (scan && this.warmupBuildCount < MAX_WARMUP_CONCURRENT) {
          this.warmupQueue.splice(this.warmupQueue.indexOf(id), 1);
          void this.buildOneWarmup(id, scan);
          break;
        } else if (!scan && !this.buildingProcedural) {
          this.warmupQueue.splice(this.warmupQueue.indexOf(id), 1);
          void this.buildOneWarmup(id, scan);
          break; // one procedural at a time
        }
      }
    }
  }

  private async buildOneWarmup(id: string, scan: boolean) {
    this.buildingIds.add(id);
    if (scan) this.warmupBuildCount++;
    else this.buildingProcedural = true;
    try {
      const resource = await this.builder.build(id);
      if (this.disposed) {
        resource.dispose();
      } else {
        this.cache.add(id, resource, new Set(this.visibleViews().map((v) => v.id)));
        // If a view just attached while we were building, paint it immediately.
        for (const v of this.visibleViews()) {
          if (v.id === id && !v.painted) {
            const res = this.cache.get(id);
            if (res && !this.lost && !document.hidden) { this.draw(v, res); v.needsRender = false; }
          }
        }
      }
    } catch {
      this.failed.add(id);
    } finally {
      this.buildingIds.delete(id);
      if (scan) this.warmupBuildCount--; else this.buildingProcedural = false;
      // Visible cards get priority on the next wake; then continue warmup.
      this.wake();
      if (this.warmupQueue.length > 0) this.scheduleWarmup();
    }
  }

  private tick = () => {
    this.frame = 0;
    if (this.disposed || this.lost || document.hidden) return;
    const views = this.visibleViews();
    if (!views.length) return;

    let anyMoving = false;
    for (const view of views) {
      const resource = this.cache.get(view.id);
      if (!resource) continue;

      const prevX = view.camera.position.x;
      const prevY = view.camera.position.y;
      const prevZ = view.camera.position.z;

      view.controls.update();

      const dx = view.camera.position.x - prevX;
      const dy = view.camera.position.y - prevY;
      const dz = view.camera.position.z - prevZ;
      const moved = dx * dx + dy * dy + dz * dz > 0.000001;

      if (moved) { view.needsRender = true; anyMoving = true; }
      if (view.needsRender) { this.draw(view, resource); view.needsRender = false; }
    }
    this.stats.frames++;

    if (anyMoving || views.some((view) => view.needsRender && this.cache.has(view.id))) {
      this.frame = requestAnimationFrame(this.tick);
    }
  };

  diagnostics() {
    return { ...this.stats, cachedModels: this.cache.size, estimatedResourceBytes: this.cache.bytes,
      maxModels: MAX_MODELS, maxResourceBytes: MAX_BYTES, posters: this.posters.size,
      posterBytes: this.posters.size * 128 * 128 * 4, attachedViews: this.views.size,
      visibleViews: this.visibleViews().length, loopRunning: Boolean(this.frame),
      visibleBuilds: this.visibleBuildCount, warmupBuilds: this.warmupBuildCount,
      buildingProcedural: this.buildingProcedural,
      inFlight: this.buildingIds.size,
      gpu: { ...this.gl.info.memory }, programs: this.gl.info.programs?.length ?? 0 };
  }

  dispose() {
    this.disposed = true;
    this.stop();
    this.observer.disconnect();
    document.removeEventListener('visibilitychange', this.visibilityChanged);
    window.removeEventListener('pagehide', this.pageHidden);
    this.views.forEach((view) => view.controls.dispose());
    this.views.clear();
    this.cache.clear();
    this.posters.clear();
    this.builder.dispose();
    this.environment?.dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
    this.gl.dispose();
  }
}

let renderer: PreviewRenderer | undefined;

export function attachPreview(id: string, canvas: HTMLCanvasElement, scale: number, ready: () => void) {
  renderer ??= new PreviewRenderer(); // Never initialized by landing, tutorial, or module import.
  return renderer.attach(id, canvas, scale, ready);
}

/** Queue food IDs to be built into the preview cache during browser idle time,
 *  page-by-page so page 1 is always ready first. Safe to call before any canvas
 *  has ever been attached — the renderer is created lazily on first real use. */
export function warmPreviewCache(ids: string[]) {
  renderer ??= new PreviewRenderer();
  renderer.warmCache(ids);
}

export function isScrolling(): boolean {
  return isUserScrolling;
}

// Opt-in production diagnostics; no counters or geometry references enter React state.
if (import.meta.env.DEV || new URLSearchParams(location.search).has('previewStats')) {
  Object.assign(window, { __foodPreviewStats: () => renderer?.diagnostics() ?? { contextCreations: 0 } });
}
if (import.meta.hot) import.meta.hot.dispose(() => { renderer?.dispose(); renderer = undefined; });

