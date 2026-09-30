import * as THREE from 'three';
import { OrbitControls, RGBELoader } from 'three-stdlib';
import { PreviewBuilder, type PreviewResource } from './previewResources';
import { PreviewCache } from './previewCache';

const MAX_MODELS = 256;
const MAX_BYTES = 1024 * 1024 * 1024; // Generous budget so no model is ever evicted or rejected
const MAX_POSTERS = 64;
const FPS = 30;
const RENDER_SIZE = 240;
const ENVIRONMENT = 'https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/lebombo_1k.hdr';

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
}

/** One small, persistent WebGL renderer feeds ordinary 2D canvas presentation
 * surfaces. This keeps CSS clipping, card opacity, overlays and scrolling correct
 * without a full-window WebGL overlay. Models/textures stay on the SAME GPU
 * context across pagination and routes; only visible surfaces are drawn at 30fps.
 * No readPixels, data URLs, hidden per-card WebGL contexts or hidden model loops. */
class PreviewRenderer {
  private gl = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  private builder = new PreviewBuilder(this.gl);
  private cache = new PreviewCache<PreviewResource>(MAX_MODELS, MAX_BYTES);
  private posters = new Map<string, { canvas: HTMLCanvasElement; camera: THREE.Vector3 }>();
  private views = new Set<View>();
  private scene = new THREE.Scene();
  private holder = new THREE.Group();
  private observer: IntersectionObserver;
  private frame = 0;
  private previousTime = 0;
  private building = false;
  private lost = false;
  private disposed = false;
  private failed = new Set<string>();
  private environment?: THREE.WebGLRenderTarget;
  private stats = { contextCreations: 1, contextLosses: 0, builds: 0, cacheHits: 0,
    draws: 0, frames: 0, failures: 0, buildMs: [] as { id: string; ms: number }[], attachMs: [] as number[] };

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
      for (const entry of entries) for (const view of this.views) {
        if (view.canvas === entry.target) view.visible = entry.isIntersecting;
      }
      this.wake();
    });
    document.addEventListener('visibilitychange', this.visibilityChanged);
    window.addEventListener('pagehide', this.pageHidden);
    this.gl.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.lost = true;
      this.stats.contextLosses++;
      this.stop(); // Cards retain their last presentation while the GPU recovers.
    });
    this.gl.domElement.addEventListener('webglcontextrestored', () => {
      this.lost = false;
      this.wake();
    });
    // Same environment as FoodCanvas, once per renderer; lighting still works
    // offline, and a slow HDR never blocks the first visible food.
    void new RGBELoader().loadAsync(ENVIRONMENT).then((hdr) => {
      if (this.disposed) { hdr.dispose(); return; }
      const generator = new THREE.PMREMGenerator(this.gl);
      this.environment = generator.fromEquirectangular(hdr);
      this.scene.environment = this.environment.texture;
      this.scene.environmentIntensity = 0.85;
      hdr.dispose();
      generator.dispose();
      this.wake();
    }).catch(() => { /* Direct lighting is the offline fallback. */ });
  }

  private visibilityChanged = () => { if (document.hidden) this.stop(); else this.wake(); };
  private pageHidden = (event: PageTransitionEvent) => { if (!event.persisted) this.dispose(); };
  private stop() { cancelAnimationFrame(this.frame); this.frame = 0; this.previousTime = 0; }
  private visibleViews() { return [...this.views].filter((view) => view.visible && view.canvas.isConnected); }

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
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.4;
    controls.update();
    controls.addEventListener('start', () => { controls.autoRotate = false; });
    controls.addEventListener('end', () => { controls.autoRotate = true; });
    const rect = canvas.getBoundingClientRect();
    const view: View = { id, canvas, context, camera, controls, scale, ready, painted: false,
      visible: rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth };
    this.views.add(view);
    this.observer.observe(canvas);
    if (poster) {
      context.drawImage(poster.canvas, 0, 0, canvas.width, canvas.height);
      ready();
    }
    const resource = this.cache.get(id);
    if (resource) {
      this.stats.cacheHits++;
      // Returning cards paint during their layout effect, before the browser
      // presents them. They never wait for loading, React mounting, or a fade-in.
      if (!this.lost && view.visible && !document.hidden) this.draw(view, resource);
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

  private wake() {
    if (this.disposed || this.lost || document.hidden || !this.visibleViews().length) return;
    if (!this.frame) this.frame = requestAnimationFrame(this.tick);
    if (!this.building) void this.buildNext();
  }

  private tick = (time: number) => {
    this.frame = 0;
    if (this.disposed || this.lost || document.hidden) return;
    const views = this.visibleViews();
    if (!views.length) { this.previousTime = 0; return; }
    const elapsed = time - this.previousTime;
    if (elapsed >= 1000 / FPS) {
      this.previousTime = time - (elapsed % (1000 / FPS));
      for (const view of views) {
        const resource = this.cache.get(view.id);
        if (!resource) continue;
        view.controls.update();
        this.draw(view, resource);
      }
      this.stats.frames++;
    }
    // Pending downloads wake us when ready. All-fallback pages need no RAF loop.
    if (views.some((view) => this.cache.has(view.id))) this.frame = requestAnimationFrame(this.tick);
  };

  private async buildNext() {
    const next = this.visibleViews().find((view) => !this.cache.has(view.id) && !this.failed.has(view.id));
    if (!next || this.disposed || this.lost || document.hidden) return;
    this.building = true;
    // Yield between jobs so navigation/search can commit and cancel stale work.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    if (!this.visibleViews().some((view) => view.id === next.id) || document.hidden) {
      this.building = false;
      this.wake();
      return;
    }
    const start = performance.now();
    try {
      const resource = await this.builder.build(next.id);
      this.stats.builds++;
      this.stats.buildMs.push({ id: next.id, ms: performance.now() - start });
      if (this.stats.buildMs.length > 32) this.stats.buildMs.shift();
      if (this.disposed) {
        resource.dispose();
      } else {
        this.cache.add(next.id, resource, new Set(this.visibleViews().map((view) => view.id)));
        this.draw(next, resource);
      }
    } catch (error) {
      this.failed.add(next.id);
      this.stats.failures++;
      console.warn(`Food preview unavailable: ${next.id}`, error);
    } finally {
      this.building = false;
      this.wake();
    }
  }

  diagnostics() {
    return { ...this.stats, cachedModels: this.cache.size, estimatedResourceBytes: this.cache.bytes,
      maxModels: MAX_MODELS, maxResourceBytes: MAX_BYTES, posters: this.posters.size,
      posterBytes: this.posters.size * 128 * 128 * 4, attachedViews: this.views.size,
      visibleViews: this.visibleViews().length, loopRunning: Boolean(this.frame), building: this.building,
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

// Opt-in production diagnostics; no counters or geometry references enter React state.
if (import.meta.env.DEV || new URLSearchParams(location.search).has('previewStats')) {
  Object.assign(window, { __foodPreviewStats: () => renderer?.diagnostics() ?? { contextCreations: 0 } });
}
if (import.meta.hot) import.meta.hot.dispose(() => { renderer?.dispose(); renderer = undefined; });
