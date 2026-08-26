/**
 * CanvasEngine — verbatim from PROTOTYPE-REFERENCE.md §3.
 * Supports both workbench and case-study modes.
 */

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Case-study view states.
 *   reading — the default: camera locked to the reader column.
 *   aside   — the page drove the camera to an artifact (margin-ref jump). It owes
 *             the visitor a return, and the padlock stays as it was: they did not
 *             unlock anything.
 *   roam    — the visitor took the wheel (padlock, L, or moving the board during an
 *             aside). Free camera; the way back is still one click.
 */
export type ViewState = 'reading' | 'aside' | 'roam';

export interface Zone { cx: number; cy: number; scale: number }
export interface ZoneBounds { x1: number; y1: number; x2: number; y2: number }

export interface CanvasEngineConfig {
  canvasEl: HTMLElement;
  canvasWrap: HTMLElement;
  minimap: HTMLElement;
  minimapCanvas: HTMLElement;
  minimapViewport: HTMLElement;
  zoomLabel: HTMLElement;
  zones: Record<string, Zone>;
  zoneBounds: Record<string, ZoneBounds>;
  /** Absolute-scale zone overrides for ≤520 px screens. */
  mobileZones?: Record<string, Zone>;
  canvasWidth: number;
  canvasHeight: number;
  mode: 'workbench' | 'case';
  onZoneChange?: (zone: string | null) => void;
  onViewStateChange?: (state: ViewState) => void;
}

export class CanvasEngine {
  private canvas: HTMLElement;
  private wrap: HTMLElement;
  private minimap: HTMLElement;
  private minimapCanvas: HTMLElement;
  private minimapViewport: HTMLElement;
  private zoomLabel: HTMLElement;
  private zones: Record<string, Zone>;
  private zoneBounds: Record<string, ZoneBounds>;
  private mobileZones: Record<string, Zone> = {};
  private CANVAS_W: number;
  private CANVAS_H: number;
  private mode: 'workbench' | 'case';
  private onZoneChange: ((zone: string | null) => void) | null;

  // §3.1
  private scale = 0.5;
  private tx = 0;
  private ty = 0;
  private minScale = 0.22;
  private maxScale = 2.4;
  private vx = 0;
  private vy = 0;
  private decelerating = false;
  private isPanning = false;
  private spaceHeld = false;
  private flightAnim: number | null = null;
  private currentZone: string | null = null;

  // rAF-throttled apply state
  private rafScheduled = false;
  private mmW = 0;
  private mmH = 0;

  // Minimap viewport cached size — avoids layout-property writes during pan
  private mmVpW = -1;
  private mmVpH = -1;
  // Cached zoom label value — avoids toolbar texture re-upload during pan
  private lastZoomPct = -1;

  // Drag tracking
  private panStartX = 0; private panStartY = 0;
  private panStartTX = 0; private panStartTY = 0;
  private lastMoveX = 0; private lastMoveY = 0;
  private lastMoveTime = 0;

  // Click-vs-drag §3.17
  private clickStart: { x: number; y: number } | null = null;
  /** Movement (px) that turns a press into a drag — shared by capture and click suppression */
  private static readonly DRAG_THRESHOLD = 6;
  private activePointerId: number | null = null;
  private pointerCaptured = false;

  // Touch §3.9
  private touchState: {
    mode: 'pinch'; startDist: number; startScale: number;
    startTX: number; startTY: number; cx: number; cy: number;
  } | null = null;

  // Help
  private helpSeen = false;

  // §3.14 — Case-study free roam.
  // Locked (freeRoam === false) is the default: the reader viewport IS the page.
  // Unlocking hands over the whole canvas; locking flies back to the unlock point.
  private freeRoam = false;
  /** True between a margin-ref jump and the visitor either returning or taking over. */
  private aside = false;
  private readerWidth = 1080;
  private readerLeft = 1960;
  private readingScale = 0.55;
  private preJumpState: { tx: number; ty: number; scale: number; freeRoam: boolean } | null = null;
  /** Camera captured the moment free roam was unlocked — locking returns here. */
  private lockedPos: { tx: number; ty: number; scale: number } | null = null;
  /** Keeps a jump on target while reader images finish loading and shift the layout. */
  private jumpPin: ResizeObserver | null = null;
  private jumpPinTimer = 0;

  // Dynamic will-change management — enables GPU layer during animation,
  // removes it at rest so canvas rasterises at device pixel resolution (crisp text)
  private willChangeTimer = 0;
  private activateWillChange(): void {
    clearTimeout(this.willChangeTimer);
    this.canvas.style.willChange = 'transform';
  }
  private deactivateWillChange(delay = 400): void {
    clearTimeout(this.willChangeTimer);
    this.willChangeTimer = window.setTimeout(() => {
      this.canvas.style.willChange = 'auto';
    }, delay);
  }
  private onViewStateChange: ((state: ViewState) => void) | null = null;

  constructor(config: CanvasEngineConfig) {
    this.canvas = config.canvasEl;
    this.wrap = config.canvasWrap;
    this.minimap = config.minimap;
    this.minimapCanvas = config.minimapCanvas;
    this.minimapViewport = config.minimapViewport;
    this.zoomLabel = config.zoomLabel;
    this.zones = config.zones;
    this.zoneBounds = config.zoneBounds;
    this.mobileZones = config.mobileZones ?? {};
    this.CANVAS_W = config.canvasWidth;
    this.CANVAS_H = config.canvasHeight;
    this.mode = config.mode;
    this.onZoneChange = config.onZoneChange ?? null;
    this.onViewStateChange = config.onViewStateChange ?? null;
    this.helpSeen = sessionStorage.getItem('sivanesh.helpSeen') === '1';

    // Case pages boot locked (freeRoam === false) — no flag to set.

    this.bindEvents();
    this.boot();
  }

  // §3.2
  private clampTranslate(): void {
    const cw = this.CANVAS_W * this.scale;
    const ch = this.CANVAS_H * this.scale;
    const vw = innerWidth; const vh = innerHeight;
    if (cw <= vw) this.tx = -cw / 2;
    else { this.tx = clamp(this.tx, vw / 2 - cw, -vw / 2); }
    if (ch <= vh) this.ty = -ch / 2;
    else { this.ty = clamp(this.ty, vh / 2 - ch, -vh / 2); }
  }

  // §3.3
  private apply(): void {
    this.clampTranslate();
    this.canvas.style.transform =
      `translate3d(${this.tx.toFixed(2)}px,${this.ty.toFixed(2)}px,0) scale(${this.scale.toFixed(4)})`;
    // Guard: skip textContent write during pan (value unchanged = toolbar GPU re-upload avoided)
    const pct = Math.round(this.scale * 100);
    if (pct !== this.lastZoomPct) {
      this.lastZoomPct = pct;
      this.zoomLabel.textContent = pct + '%';
    }
    this.updateMinimap();
    this.updateActiveZone();
  }

  // Batches DOM writes to one per animation frame — eliminates forced layout during pan
  private scheduleApply(): void {
    if (this.rafScheduled) return;
    this.rafScheduled = true;
    requestAnimationFrame(() => {
      this.rafScheduled = false;
      this.apply();
    });
  }

  // §3.4
  private zoomAt(deltaScale: number, screenX: number, screenY: number): void {
    const newScale = clamp(this.scale * deltaScale, this.minScale, this.maxScale);
    if (newScale === this.scale) return;
    const cw = innerWidth / 2; const ch = innerHeight / 2;
    // Locked view: anchor zoom to viewport center so the reading column
    // never shifts left/right — zoom always feels "in place"
    const anchorX = this.cameraLocked ? cw : screenX;
    const anchorY = this.cameraLocked ? ch : screenY;
    const canvasX = (anchorX - cw - this.tx) / this.scale;
    const canvasY = (anchorY - ch - this.ty) / this.scale;
    this.tx = anchorX - cw - canvasX * newScale;
    this.ty = anchorY - ch - canvasY * newScale;
    this.scale = newScale;
    this.apply();
  }

  // §3.10 — Flight (mode-aware: case adds Y-bias)
  private flyTo(targetCX: number, targetCY: number, targetScale: number, duration = 650): void {
    if (this.flightAnim) cancelAnimationFrame(this.flightAnim);
    this.decelerating = false;
    this.activateWillChange();
    const startTX = this.tx; const startTY = this.ty; const startScale = this.scale;

    let yBias = 0;
    if (this.cameraLocked) {
      if (innerWidth <= 420)       yBias = innerHeight * 0.18;
      else if (innerWidth <= 640)  yBias = innerHeight * 0.14;
      else if (innerWidth <= 1100) yBias = innerHeight * 0.08;
    } else if (this.mode === 'workbench') {
      // Push zone content below the topbar (~64px) so it lands in the usable viewport
      yBias = 40;
    }

    const endTX = -targetCX * targetScale;
    const endTY = -targetCY * targetScale + yBias;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - t0) / duration, 1);
      const e = easeInOutCubic(t);
      this.tx = startTX + (endTX - startTX) * e;
      this.ty = startTY + (endTY - startTY) * e;
      this.scale = startScale + (targetScale - startScale) * e;
      this.apply();
      if (t < 1) this.flightAnim = requestAnimationFrame(step);
      else { this.flightAnim = null; this.deactivateWillChange(); }
    };
    this.flightAnim = requestAnimationFrame(step);
  }

  // flyToRaw — animates to literal tx/ty/scale (no centering math)
  private flyToRaw(endTX: number, endTY: number, endScale: number, duration = 600): void {
    if (this.flightAnim) cancelAnimationFrame(this.flightAnim);
    this.decelerating = false;
    this.activateWillChange();
    const startTX = this.tx; const startTY = this.ty; const startScale = this.scale;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - t0) / duration, 1);
      const e = easeInOutCubic(t);
      this.tx = startTX + (endTX - startTX) * e;
      this.ty = startTY + (endTY - startTY) * e;
      this.scale = startScale + (endScale - startScale) * e;
      this.apply();
      if (t < 1) this.flightAnim = requestAnimationFrame(step);
      else { this.flightAnim = null; this.deactivateWillChange(); }
    };
    this.flightAnim = requestAnimationFrame(step);
  }

  // §3.10 — goToZone (workbench: viewport-aware scale)
  goToZone(name: string): void {
    const z = this.zones[name]; if (!z) return;
    if (this.mode === 'workbench') {
      const vw = innerWidth;
      // ≤520px: use absolute mobile overrides so each zone has its own tuned scale/cx/cy
      if (vw <= 520) {
        const mz = this.mobileZones[name];
        if (mz) { this.flyTo(mz.cx, mz.cy, mz.scale, 700); return; }
      }
      let targetScale = z.scale;
      if (vw <= 820) targetScale = z.scale * 0.72;
      else if (vw <= 1100) targetScale = z.scale * 0.88;
      this.flyTo(z.cx, z.cy, targetScale, 700);
    } else {
      this.flyTo(z.cx, z.cy, z.scale, 700);
    }
  }

  // Instant zone positioning — no animation
  goToZoneInstant(name: string): void {
    const z = this.zones[name]; if (!z) return;
    const yBias = this.mode === 'workbench' ? 40 : 0;
    if (this.mode === 'workbench') {
      const vw = innerWidth;
      // ≤520px: use absolute mobile overrides
      if (vw <= 520) {
        const mz = this.mobileZones[name];
        if (mz) {
          this.scale = mz.scale;
          this.tx = -mz.cx * mz.scale;
          this.ty = -mz.cy * mz.scale + yBias;
          this.apply(); return;
        }
      }
      let targetScale = z.scale;
      if (vw <= 820) targetScale = z.scale * 0.72;
      else if (vw <= 1100) targetScale = z.scale * 0.88;
      this.scale = targetScale;
      this.tx = -z.cx * targetScale;
      this.ty = -z.cy * targetScale + yBias;
    } else {
      this.scale = z.scale;
      this.tx = -z.cx * z.scale;
      this.ty = -z.cy * z.scale + yBias;
    }
    this.apply();
  }

  // §3.13 — Reset (workbench) — delegates to hello zone so landing = zone redirect
  private resetView(): void {
    this.goToZoneInstant('hello');
  }

  private fitView(): void {
    // Fitting the whole board is the opposite of reading one column — take the wheel
    this.takeTheWheel();
    // Always do a true fit — Home (btnReset) handles the hello-zone redirect.
    const s = Math.min(innerWidth / this.CANVAS_W, innerHeight / this.CANVAS_H) * 0.92;
    this.flyTo(this.CANVAS_W / 2, this.CANVAS_H / 2, clamp(s, this.minScale, this.maxScale));
  }

  // §3.14 — computeReaderLayout (case studies only)
  private computeReaderLayout(): void {
    const vw = innerWidth;
    if (vw <= 420)       this.readerWidth = 580;
    else if (vw <= 640)  this.readerWidth = 720;
    else if (vw <= 1100) this.readerWidth = 900;
    else if (vw <= 1600) this.readerWidth = 1080;
    else                 this.readerWidth = 1160;

    this.readerLeft = Math.round((this.CANVAS_W - this.readerWidth) / 2);

    let desiredColumnDisplayPx: number;
    if (vw <= 420)       desiredColumnDisplayPx = vw * 0.94;
    else if (vw <= 640)  desiredColumnDisplayPx = vw * 0.92;
    else                 desiredColumnDisplayPx = vw * 0.82;
    this.readingScale = clamp(desiredColumnDisplayPx / this.readerWidth, 0.3, 1.1);

    let pad: string; let fsMult: number;
    if (vw <= 420)       { pad = '32px 20px 48px';  fsMult = 1.45; }
    else if (vw <= 640)  { pad = '44px 28px 64px';  fsMult = 1.3; }
    else if (vw <= 1100) { pad = '72px 52px 92px';  fsMult = 1.1; }
    else                 { pad = '100px 90px 120px'; fsMult = 1.0; }

    const r = document.getElementById('reader');
    if (r) {
      r.style.setProperty('--reader-width', this.readerWidth + 'px');
      r.style.setProperty('--reader-left', this.readerLeft + 'px');
      r.style.setProperty('--reader-pad', pad);
      r.style.setProperty('--reader-fs', String(fsMult));
    }

    // Update zone targets to match new column center
    const centerX = this.readerLeft + this.readerWidth / 2;
    for (const name in this.zones) {
      this.zones[name].cx = centerX;
      this.zones[name].scale = this.readingScale;
    }

    // Reposition .artifact elements relative to column edges
    const columnLeft = this.readerLeft;
    const columnRight = this.readerLeft + this.readerWidth;
    const gapScale = (vw <= 640) ? 1.8 : 1.0;
    document.querySelectorAll<HTMLElement>('.artifact').forEach((el) => {
      const side = el.dataset.side;
      const gap = (parseInt(el.dataset.gap || '60')) * gapScale;
      const w = parseInt(el.dataset.width || '') || el.offsetWidth || 260;
      const newLeft = (side === 'left') ? (columnLeft - gap - w) : (columnRight + gap);
      el.style.left = newLeft + 'px';
    });
  }

  // §3.15 — refreshZoneTargets (case studies only)
  private refreshZoneTargets(): void {
    const r = document.getElementById('reader');
    if (!r) return;
    const sections = r.querySelectorAll<HTMLElement>('.r-section');
    const readerTop = parseInt(getComputedStyle(r).top) || 600;
    const readerHeight = r.offsetHeight;

    // Ensure canvas is tall enough
    const neededHeight = readerTop + readerHeight + 400;
    if (neededHeight > this.CANVAS_H) {
      this.CANVAS_H = neededHeight;
      this.canvas.style.height = this.CANVAS_H + 'px';
    }

    this.zones.top.cy = readerTop + 400;
    if (sections[1]) this.zones.problem.cy = readerTop + sections[1].offsetTop + sections[1].offsetHeight / 3;
    if (sections[3]) this.zones.solution.cy = readerTop + sections[3].offsetTop + sections[3].offsetHeight / 4;
    if (sections[sections.length - 2]) {
      const outcomeEl = sections[sections.length - 2];
      this.zones.outcome.cy = readerTop + outcomeEl.offsetTop + outcomeEl.offsetHeight / 4;
    }

    // Update zone bounds
    if (this.zones.problem) {
      this.zoneBounds.top.y2 = this.zones.problem.cy - 200;
      this.zoneBounds.problem.y1 = this.zones.problem.cy - 200;
    }
    if (this.zones.solution) {
      this.zoneBounds.problem.y2 = this.zones.solution.cy - 200;
      this.zoneBounds.solution.y1 = this.zones.solution.cy - 200;
    }
    if (this.zones.outcome) {
      this.zoneBounds.solution.y2 = this.zones.outcome.cy - 200;
      this.zoneBounds.outcome.y1 = this.zones.outcome.cy - 200;
      this.zoneBounds.outcome.y2 = this.CANVAS_H;
    }

    // Section-anchored artifact Y positioning
    document.querySelectorAll<HTMLElement>('[data-anchor]').forEach((el) => {
      const anchor = el.dataset.anchor!;
      const offset = parseInt(el.dataset.anchorOffset || '0');
      const idx = (anchor === 'last') ? sections.length - 1 : parseInt(anchor);
      if (isNaN(idx) || !sections[idx]) return;
      const sectTop = readerTop + sections[idx].offsetTop;
      el.style.top = (sectTop + offset) + 'px';
    });
  }

  /** Reading is the only state whose camera is constrained to the column. */
  private get cameraLocked(): boolean {
    return this.mode === 'case' && !this.freeRoam && !this.aside;
  }

  getViewState(): ViewState {
    if (this.freeRoam) return 'roam';
    if (this.aside) return 'aside';
    return 'reading';
  }

  private emitViewState(): void {
    this.onViewStateChange?.(this.getViewState());
  }

  setFreeRoam(on: boolean): void {
    if (on) {
      // Unlocking out of an aside is a promotion, not a fresh unlock: the return
      // anchor must stay the reading spot, not wherever the jump parked us.
      if (this.aside) { this.promoteAside(); return; }
      // Snapshot the reading camera BEFORE anything moves — returning flies back here
      this.lockedPos = { tx: this.tx, ty: this.ty, scale: this.scale };
      this.freeRoam = true;
      // Fire immediately, before compute/fly, so the UI can never miss a transition
      this.emitViewState();
    } else {
      this.backToReading();
    }
  }

  toggleFreeRoam(): void { this.setFreeRoam(this.getViewState() === 'reading'); }

  /**
   * The single exit, shared by the pill, the padlock, Escape and R. Returns to the
   * exact camera the visitor left the reading at — whether they got away via a
   * margin-ref jump or by unlocking the board themselves.
   */
  backToReading(): void {
    this.stopJumpPin();
    if (this.preJumpState) { this.restoreFromJump(); return; }
    if (this.getViewState() === 'reading') return;

    this.freeRoam = false;
    this.aside = false;
    this.emitViewState();
    // Viewport may have changed while roaming — recompute before flying back
    this.computeReaderLayout();
    this.refreshZoneTargets();
    if (this.lockedPos) {
      this.flyToRaw(this.lockedPos.tx, this.lockedPos.ty, this.lockedPos.scale);
    } else {
      this.goToZone('top');
    }
  }

  /**
   * The visitor moved the board during an aside — that is them taking the wheel, so
   * the state becomes an honest free roam and the padlock finally flips. The return
   * anchor is untouched, so the way back still leads to the reading.
   */
  /**
   * For deliberate go-elsewhere controls (Fit, the minimap): they cannot honour a
   * lock whose whole point is staying on the column, so they unlock properly —
   * padlock lights, pill appears — instead of leaving the camera off-column while
   * the interface still claims to be locked. lockedPos captures the reading spot,
   * so the way back is one click.
   */
  private takeTheWheel(): void {
    if (this.mode !== 'case' || this.freeRoam) return;
    if (this.aside) { this.promoteAside(); return; }
    this.setFreeRoam(true);
  }

  private promoteAside(): void {
    if (!this.aside) return;
    this.stopJumpPin();
    this.aside = false;
    this.freeRoam = true;
    this.preJumpState = null;   // the exact-restore snapshot is superseded by lockedPos
    this.emitViewState();
  }

  // MARGIN-REF-SPEC — jumpToArtifact (with preJumpState snapshot)
  jumpToArtifact(slug: string): void {
    const el = document.getElementById(`obj-${slug}`);
    if (!el) {
      console.warn(`[canvas] no artifact found with id="obj-${slug}"`);
      return;
    }

    // Artifacts are anchored to reader sections, which shift as images and fonts
    // settle. Re-measure before reading offsets or the flight targets a stale
    // position and lands hundreds of px off — worst on the first jump after load.
    this.computeReaderLayout();
    this.refreshZoneTargets();

    // Snapshot current camera state BEFORE jumping
    this.preJumpState = {
      tx: this.tx,
      ty: this.ty,
      scale: this.scale,
      freeRoam: this.freeRoam,
    };

    // A jump is a detour the page drove, not an unlock the visitor asked for.
    // Remember the reading spot so the way back always leads there.
    if (!this.freeRoam) {
      this.lockedPos = { tx: this.tx, ty: this.ty, scale: this.scale };
    }
    this.aside = true;
    this.emitViewState();

    // Compute artifact center in canvas coords
    const targetCX = el.offsetLeft + el.offsetWidth / 2;
    const targetCY = el.offsetTop + el.offsetHeight / 2;

    // Viewport-aware zoom
    const vw = innerWidth;
    let targetScale: number;
    if (vw <= 420)       targetScale = 0.55;
    else if (vw <= 640)  targetScale = 0.65;
    else if (vw <= 1100) targetScale = 0.75;
    else                 targetScale = 0.85;

    this.flyTo(targetCX, targetCY, targetScale, 800);

    // Pulse the artifact
    el.classList.add('artifact-pulse');
    setTimeout(() => el.classList.remove('artifact-pulse'), 1400);

    // Reader images finish loading after the flight begins, pushing sections (and
    // the artifact with them) down the canvas. Track the artifact until it settles,
    // otherwise the camera lands where the artifact used to be.
    this.startJumpPin(el, targetScale);
  }

  private startJumpPin(el: HTMLElement, targetScale: number): void {
    this.stopJumpPin();
    const reader = document.getElementById('reader');
    if (!reader || typeof ResizeObserver === 'undefined') return;

    this.jumpPin = new ResizeObserver(() => {
      this.refreshZoneTargets();
      const endTX = -(el.offsetLeft + el.offsetWidth / 2) * targetScale;
      const endTY = -(el.offsetTop + el.offsetHeight / 2) * targetScale;
      if (Math.abs(endTX - this.tx) < 1 && Math.abs(endTY - this.ty) < 1) return;
      if (this.flightAnim) { cancelAnimationFrame(this.flightAnim); this.flightAnim = null; }
      this.flyToRaw(endTX, endTY, targetScale, 300);
    });
    this.jumpPin.observe(reader);
    // Layout settles within a second or two; never hold the camera longer than that
    clearTimeout(this.jumpPinTimer);
    this.jumpPinTimer = window.setTimeout(() => this.stopJumpPin(), 2500);
  }

  /** Release the camera — called when layout settles or the user takes over. */
  private stopJumpPin(): void {
    clearTimeout(this.jumpPinTimer);
    this.jumpPin?.disconnect();
    this.jumpPin = null;
  }

  // Restore camera to pre-jump position
  restoreFromJump(): void {
    this.stopJumpPin();
    if (!this.preJumpState) return;
    const snapshot = this.preJumpState;
    this.preJumpState = null;

    this.aside = false;
    this.freeRoam = snapshot.freeRoam;
    if (!snapshot.freeRoam) {
      // Returning to the reading — that position becomes the new return anchor
      this.lockedPos = { tx: snapshot.tx, ty: snapshot.ty, scale: snapshot.scale };
    }

    // Fly back to exact prior camera position
    this.flyToRaw(snapshot.tx, snapshot.ty, snapshot.scale, 600);
    this.emitViewState();
  }

  /** Absolute canvas coordinates of an element, across nested offset parents. */
  private canvasCoords(el: HTMLElement): { x: number; y: number } {
    let x = 0, y = 0;
    let node: HTMLElement | null = el;
    while (node && node !== this.canvas) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    return { x, y };
  }

  /** Bring a newly focused canvas element into view, honouring the current lock. */
  private revealFocused(el: HTMLElement | null): void {
    if (!el || !this.canvas.contains(el)) return;
    // A flight is already taking the camera somewhere deliberate (a jump, or the
    // return that just restored focus). Revealing on top of it would hijack that
    // destination — the flight lands where the element will be visible anyway.
    if (this.flightAnim !== null) return;
    const r = el.getBoundingClientRect();
    const margin = 80;
    const visible = r.top >= margin && r.bottom <= innerHeight - margin &&
      r.left >= margin && r.right <= innerWidth - margin;
    if (visible) return;

    const { x, y } = this.canvasCoords(el);
    const cy = (y + el.offsetHeight / 2) * this.scale;
    const cx = (x + el.offsetWidth / 2) * this.scale;
    // Reading keeps the column centred, so only the vertical axis may move
    this.flyToRaw(this.cameraLocked ? this.tx : -cx, -cy, this.scale, 400);
  }

  private capturePointer(): void {
    if (this.activePointerId === null || this.pointerCaptured) return;
    try { this.wrap.setPointerCapture(this.activePointerId); this.pointerCaptured = true; } catch { /* pointer already gone */ }
  }

  private releasePointer(): void {
    this.activePointerId = null;
    this.pointerCaptured = false;
  }

  // §3.5 — Inertia
  private inertiaTick = (): void => {
    if (!this.decelerating) return;
    // Locked view: zero out horizontal velocity so inertia can't drift X
    if (this.cameraLocked) this.vx = 0;
    this.tx += this.vx; this.ty += this.vy;
    this.vx *= 0.92; this.vy *= 0.92;
    this.apply();
    if (Math.hypot(this.vx, this.vy) > 0.3) requestAnimationFrame(this.inertiaTick);
    else {
      this.decelerating = false;
      this.deactivateWillChange();
    }
  };

  // Zone detection
  private updateActiveZone(): void {
    const vcx = -this.tx / this.scale;
    const vcy = -this.ty / this.scale;
    for (const name in this.zoneBounds) {
      const b = this.zoneBounds[name];
      if (vcx >= b.x1 && vcx <= b.x2 && vcy >= b.y1 && vcy <= b.y2) {
        if (this.currentZone !== name) { this.currentZone = name; this.onZoneChange?.(name); }
        return;
      }
    }
    if (this.currentZone !== null) { this.currentZone = null; this.onZoneChange?.(null); }
  }

  // §3.11 — Minimap
  private buildMinimap(): void {
    requestAnimationFrame(() => {
      this.mmW = this.minimap.clientWidth - 8;
      this.mmH = this.minimap.clientHeight - 8;
      this.minimapCanvas.innerHTML = '';
      const mw = this.mmW;
      const mh = this.mmH;
      const sx = mw / this.CANVAS_W;
      const sy = mh / this.CANVAS_H;
      const sel = this.mode === 'case'
        ? '.sticky,.principle,.context-card,.cut,.diagram,.printout,.reader'
        : '.sticky,.card,.polaroid,.printout,.masthead,.contact-card,.todo,.photo';
      this.canvas.querySelectorAll(sel).forEach((el) => {
        const h = el as HTMLElement;
        const dot = document.createElement('div');
        dot.className = 'minimap-dot';
        if (h.classList.contains('polaroid') || h.classList.contains('printout') || h.classList.contains('reader'))
          dot.classList.add('work');
        dot.style.left = (h.offsetLeft * sx) + 'px';
        dot.style.top = (h.offsetTop * sy) + 'px';
        dot.style.width = Math.max(3, h.offsetWidth * sx) + 'px';
        dot.style.height = Math.max(3, h.offsetHeight * sy) + 'px';
        this.minimapCanvas.appendChild(dot);
      });
    });
  }

  private updateMinimap(): void {
    const mw = this.mmW; const mh = this.mmH;
    if (!mw || !mh) return;
    const sx = mw / this.CANVAS_W; const sy = mh / this.CANVAS_H;
    const cw = innerWidth / 2; const ch = innerHeight / 2;
    const vx = (0 - cw - this.tx) / this.scale;
    const vy = (0 - ch - this.ty) / this.scale;
    const vw = innerWidth / this.scale; const vh = innerHeight / this.scale;

    // Position via transform (compositor-only) — eliminates layout trigger and GPU texture
    // re-upload on every pan frame. left:0;top:0 set in CSS as anchor.
    const vpX = vx * sx + 4;
    const vpY = vy * sy + 4;
    this.minimapViewport.style.transform = `translate(${vpX.toFixed(1)}px,${vpY.toFixed(1)}px)`;

    // Size only changes during zoom, not pan — guard to skip redundant layout writes
    const vpW = vw * sx;
    const vpH = vh * sy;
    if (Math.abs(vpW - this.mmVpW) > 0.5 || Math.abs(vpH - this.mmVpH) > 0.5) {
      this.mmVpW = vpW;
      this.mmVpH = vpH;
      this.minimapViewport.style.width = vpW.toFixed(1) + 'px';
      this.minimapViewport.style.height = vpH.toFixed(1) + 'px';
    }
  }

  // §3.18 — Clock
  private updateClock(): void {
    const d = new Date();
    const t = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
    const el = document.getElementById('clock');
    if (el) el.textContent = t + ' IST';
  }

  // Boot
  private boot(): void {
    this.updateClock();
    setInterval(() => this.updateClock(), 30000);

    if (this.mode === 'workbench') {
      // §3.19
      this.buildMinimap();
      this.resetView();
      if (!this.helpSeen) {
        setTimeout(() => {
          if (this.helpSeen) return;
          const startX = this.tx; const startY = this.ty; const t0 = performance.now();
          const pulse = (now: number) => {
            const t = Math.min((now - t0) / 1400, 1);
            const ease = Math.sin(t * Math.PI);
            this.tx = startX - 30 * ease; this.ty = startY + 12 * ease;
            this.apply();
            if (t < 1) requestAnimationFrame(pulse);
          };
          requestAnimationFrame(pulse);
        }, 1600);
      }
    } else {
      // §3.20 — Case boot (instant — no pan animation)
      this.computeReaderLayout();
      this.refreshZoneTargets();
      this.buildMinimap();
      this.goToZoneInstant('top');

      // Re-measure after images load (they change reader height)
      window.addEventListener('load', () => {
        this.refreshZoneTargets();
        this.buildMinimap();
      });
      // Also watch individual images inside the reader
      document.querySelectorAll('#reader img').forEach((img) => {
        if (!(img as HTMLImageElement).complete) {
          img.addEventListener('load', () => {
            this.refreshZoneTargets();
            this.buildMinimap();
          }, { once: true });
        }
      });
    }

    window.addEventListener('resize', () => {
      if (this.mode === 'case') {
        this.computeReaderLayout();
        this.refreshZoneTargets();
      }
      this.preJumpState = null;
      this.mmW = this.minimap.clientWidth - 8;
      this.mmH = this.minimap.clientHeight - 8;
      this.apply();
      this.buildMinimap();
      this.updateMinimap();
    });
  }

  // ── Event binding ────────────────────────────────────
  private bindEvents(): void {
    // Native HTML5 drag (images, links) hijacks the pointer mid-pan — suppress it.
    // CSS -webkit-user-drag covers Chrome/Safari; this covers Firefox.
    this.wrap.addEventListener('dragstart', (e) => e.preventDefault());

    // The wrap is overflow:hidden, but hidden boxes are still programmatically
    // scrollable — and the browser scrolls one to reveal a focused descendant.
    // Since the canvas moves by transform, not layout, a link that is visually
    // centred can sit thousands of px outside the wrap's layout box: focusing it
    // scrolls the wrap and silently displaces the entire board. Pin it at 0.
    const pinScroll = () => {
      if (this.wrap.scrollTop !== 0) this.wrap.scrollTop = 0;
      if (this.wrap.scrollLeft !== 0) this.wrap.scrollLeft = 0;
    };
    this.wrap.addEventListener('scroll', pinScroll, { passive: true });
    this.wrap.addEventListener('focusin', (e) => {
      pinScroll();
      // Blocking the browser's scroll-into-view would strand keyboard users on
      // elements the camera isn't showing. On a canvas, revealing means moving
      // the camera — this is the equivalent of the scroll we just refused.
      this.revealFocused(e.target as HTMLElement);
    });

    // Mobile: blur focused element on touchend so buttons don't stay in pressed state
    document.addEventListener('touchend', () => {
      const el = document.activeElement;
      if (el instanceof HTMLElement) el.blur();
    }, { passive: true });

    // §3.8 — Wheel
    this.wrap.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      this.stopJumpPin();
      this.promoteAside();
      this.activateWillChange();
      this.deactivateWillChange(300);
      if (e.ctrlKey || e.metaKey) {
        this.zoomAt(Math.pow(0.9985, e.deltaY), e.clientX, e.clientY);
      } else {
        // Locked view: horizontal wheel/trackpad scroll is ignored
        if (!this.cameraLocked) this.tx -= e.deltaX;
        this.ty -= e.deltaY;
        this.scheduleApply();
      }
    }, { passive: false });

    // §3.5 — Pointer pan
    this.wrap.addEventListener('pointerdown', (e: PointerEvent) => {
      // Skip pan if a pinch gesture is active
      if (this.touchState) return;
      const forcePan = e.button === 1 || this.spaceHeld;
      if (!forcePan) {
        // Only real form controls block a pan start. Links, polaroids, printouts and
        // images pan freely — §3.17 click-vs-drag suppression protects their clicks.
        let target = e.target as HTMLElement;
        while (target && target !== this.wrap) {
          const tag = target.tagName;
          if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
            target.hasAttribute?.('data-no-pan')) return;
          target = target.parentElement as HTMLElement;
        }
        if (e.button !== 0 && e.button !== undefined) return;
      } else { e.preventDefault(); }
      this.stopJumpPin();
      this.isPanning = true; this.decelerating = false;
      this.activateWillChange();
      this.vx = 0; this.vy = 0;
      this.panStartX = e.clientX; this.panStartY = e.clientY;
      this.panStartTX = this.tx; this.panStartTY = this.ty;
      this.lastMoveX = e.clientX; this.lastMoveY = e.clientY;
      this.lastMoveTime = performance.now();
      this.wrap.classList.add('grabbing');
      // Capture is deferred until the press becomes a drag. Taking it here would
      // retarget the click (and mouseup) to the wrap, so links, polaroids and
      // margin-refs would never receive their own click. See G10.
      this.activePointerId = e.pointerId;
      this.pointerCaptured = false;
      if (forcePan) this.capturePointer();
    });

    this.wrap.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.isPanning || this.touchState) return;
      // Once it's unmistakably a drag, take the pointer so the pan survives the
      // cursor leaving the window. By now the click is already forfeit anyway.
      if (!this.pointerCaptured &&
        Math.hypot(e.clientX - this.panStartX, e.clientY - this.panStartY) > CanvasEngine.DRAG_THRESHOLD) {
        this.capturePointer();
        // Moving the board during an aside IS taking the wheel
        this.promoteAside();
      }
      if (this.cameraLocked) {
        // Locked view: vertical-only pan — horizontal axis locked
        this.tx = this.panStartTX;
        this.ty = this.panStartTY + (e.clientY - this.panStartY);
      } else {
        this.tx = this.panStartTX + (e.clientX - this.panStartX);
        this.ty = this.panStartTY + (e.clientY - this.panStartY);
      }
      const now = performance.now(); const dt = now - this.lastMoveTime;
      if (dt >= 8) {
        // Raw instantaneous velocity (px/frame at 60fps)
        const rawVx = (e.clientX - this.lastMoveX) / dt * 16;
        const rawVy = (e.clientY - this.lastMoveY) / dt * 16;
        // Clamp raw to prevent spikes from tiny-dt events, then blend with EMA
        const MAX_RAW = 80;
        const cRx = clamp(rawVx, -MAX_RAW, MAX_RAW);
        const cRy = clamp(rawVy, -MAX_RAW, MAX_RAW);
        this.vx = this.vx * 0.25 + cRx * 0.75;
        this.vy = this.vy * 0.25 + cRy * 0.75;
        // Hard cap on smoothed velocity
        const MAX_V = 50;
        this.vx = clamp(this.vx, -MAX_V, MAX_V);
        this.vy = clamp(this.vy, -MAX_V, MAX_V);
        this.lastMoveX = e.clientX; this.lastMoveY = e.clientY; this.lastMoveTime = now;
      }
      this.scheduleApply();
    });

    this.wrap.addEventListener('pointerup', () => {
      this.releasePointer();
      if (!this.isPanning) return;
      this.isPanning = false;
      this.wrap.classList.remove('grabbing');
      // If the pointer was stationary for >80ms before release, the stored
      // velocity is stale — user was decelerating. Zero it to prevent phantom launch.
      if (performance.now() - this.lastMoveTime > 80) { this.vx = 0; this.vy = 0; }
      if (Math.hypot(this.vx, this.vy) > 2) {
        this.decelerating = true;
        requestAnimationFrame(this.inertiaTick);
      } else {
        this.deactivateWillChange();
      }
    });
    this.wrap.addEventListener('pointercancel', () => {
      this.releasePointer();
      this.isPanning = false; this.wrap.classList.remove('grabbing');
    });

    // §3.6 — Middle-click
    this.wrap.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); });
    this.wrap.addEventListener('auxclick', (e) => { if (e.button === 1) e.preventDefault(); });

    // §3.7 — Spacebar
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !this.spaceHeld) {
        const tag = (document.activeElement?.tagName || '').toUpperCase();
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        this.spaceHeld = true; this.wrap.classList.add('space-pan'); e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') { this.spaceHeld = false; this.wrap.classList.remove('space-pan'); }
    });

    // §3.16 — Keyboard
    document.addEventListener('keydown', (e) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      switch (e.key) {
        case '0': case 'h': case 'H':
          this.goToZone(this.mode === 'case' ? 'top' : 'hello'); e.preventDefault(); break;
        case 'f': case 'F': this.fitView(); e.preventDefault(); break;
        case '+': case '=': this.zoomAt(1.25, innerWidth / 2, innerHeight / 2); e.preventDefault(); break;
        case '-': case '_': this.zoomAt(0.8, innerWidth / 2, innerHeight / 2); e.preventDefault(); break;
        // Horizontal arrows are ignored while locked — the same answer a horizontal
        // drag or wheel gets. A key should never reach past a constraint the pointer
        // respects.
        case 'ArrowLeft':
          if (!this.cameraLocked) { this.tx += 80; this.apply(); }
          e.preventDefault(); break;
        case 'ArrowRight':
          if (!this.cameraLocked) { this.tx -= 80; this.apply(); }
          e.preventDefault(); break;
        case 'ArrowUp': this.ty += 80; this.apply(); e.preventDefault(); break;
        case 'ArrowDown': this.ty -= 80; this.apply(); e.preventDefault(); break;
        case 'l': case 'L':
          if (this.mode === 'case') { this.toggleFreeRoam(); e.preventDefault(); }
          break;
        case 'Escape':
        case 'r': case 'R':
          // Back to reading — Escape is the natural key, R kept for muscle memory
          if (this.mode === 'case' && this.getViewState() !== 'reading') {
            this.backToReading();
            e.preventDefault();
          }
          break;
      }
    });

    // §3.9 — Touch
    this.wrap.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault(); // stop iOS native pinch-zoom from firing alongside our handler
        // Cancel any active pointer pan so it doesn't fight with pinch
        this.isPanning = false;
        this.wrap.classList.remove('grabbing');
        const t1 = e.touches[0], t2 = e.touches[1];
        const dx = t2.clientX - t1.clientX, dy = t2.clientY - t1.clientY;
        this.touchState = {
          mode: 'pinch', startDist: Math.hypot(dx, dy), startScale: this.scale,
          startTX: this.tx, startTY: this.ty,
          cx: (t1.clientX + t2.clientX) / 2, cy: (t1.clientY + t2.clientY) / 2,
        };
      }
    }, { passive: false });
    this.wrap.addEventListener('touchmove', (e) => {
      if (this.touchState && this.touchState.mode === 'pinch' && e.touches.length === 2) {
        e.preventDefault();
        this.activateWillChange();
        const t1 = e.touches[0], t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const newScale = clamp(this.touchState.startScale * (dist / this.touchState.startDist), this.minScale, this.maxScale);
        const cw = innerWidth / 2, ch = innerHeight / 2;
        // Locked view: anchor pinch zoom to viewport center (= reading column center)
        // so the column never shifts sideways during pinch — matches zoomAt() behaviour
        const anchorX = this.cameraLocked ? cw : this.touchState.cx;
        const anchorY = this.cameraLocked ? ch : this.touchState.cy;
        const cx = (anchorX - cw - this.touchState.startTX) / this.touchState.startScale;
        const cy = (anchorY - ch - this.touchState.startTY) / this.touchState.startScale;
        this.tx = anchorX - cw - cx * newScale;
        this.ty = anchorY - ch - cy * newScale;
        this.scale = newScale; this.scheduleApply();
      }
    }, { passive: false });
    this.wrap.addEventListener('touchend', () => { this.touchState = null; this.deactivateWillChange(); });

    // §3.17 — Click-vs-drag
    this.wrap.addEventListener('pointerdown', (e) => { this.clickStart = { x: e.clientX, y: e.clientY }; }, true);
    this.wrap.addEventListener('click', (e) => {
      if (!this.clickStart) return;
      if (Math.hypot(e.clientX - this.clickStart.x, e.clientY - this.clickStart.y) > CanvasEngine.DRAG_THRESHOLD) {
        e.preventDefault(); e.stopPropagation();
      }
      this.clickStart = null;
    }, true);

    // §3.11 — Minimap click
    this.minimap.addEventListener('click', (e) => {
      this.takeTheWheel();
      const rect = this.minimap.getBoundingClientRect();
      const mx = e.clientX - rect.left - 4; const my = e.clientY - rect.top - 4;
      const mw = this.minimap.clientWidth - 8; const mh = this.minimap.clientHeight - 8;
      this.tx = -((mx / mw) * this.CANVAS_W) * this.scale;
      this.ty = -((my / mh) * this.CANVAS_H) * this.scale;
      this.apply();
    });
  }

  // Public API
  zoomIn(): void { this.zoomAt(1.25, innerWidth / 2, innerHeight / 2); }
  zoomOut(): void { this.zoomAt(0.8, innerWidth / 2, innerHeight / 2); }
  fit(): void { this.fitView(); }
  reset(): void { this.mode === 'workbench' ? this.resetView() : this.goToZone('top'); }
  rebuild(): void { this.buildMinimap(); }
  dismissHelp(): void { this.helpSeen = true; sessionStorage.setItem('sivanesh.helpSeen', '1'); }
  getFreeRoam(): boolean { return this.freeRoam; }
  isAway(): boolean { return this.getViewState() !== 'reading'; }
}
