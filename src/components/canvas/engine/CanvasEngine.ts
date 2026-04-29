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
  canvasWidth: number;
  canvasHeight: number;
  mode: 'workbench' | 'case';
  onZoneChange?: (zone: string | null) => void;
  onReadingModeChange?: (on: boolean) => void;
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
  private CANVAS_W: number;
  private CANVAS_H: number;
  private mode: 'workbench' | 'case';
  private onZoneChange: ((zone: string | null) => void) | null;

  // §3.1
  private scale = 0.5;
  private tx = 0;
  private ty = 0;
  private minScale = 0.25;
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

  // Touch §3.9
  private touchState: {
    mode: 'pinch'; startDist: number; startScale: number;
    startTX: number; startTY: number; cx: number; cy: number;
  } | null = null;

  // Help
  private helpSeen = false;

  // §3.14 — Case-study reading mode
  private readingMode = false;
  private readerWidth = 1080;
  private readerLeft = 1960;
  private readingScale = 0.55;
  private firstPanHintShown = false;
  private preJumpState: { tx: number; ty: number; scale: number; readingMode: boolean } | null = null;
  private lastReadingPos: { tx: number; ty: number; scale: number } | null = null;
  private onReadingModeChange: ((on: boolean) => void) | null = null;

  constructor(config: CanvasEngineConfig) {
    this.canvas = config.canvasEl;
    this.wrap = config.canvasWrap;
    this.minimap = config.minimap;
    this.minimapCanvas = config.minimapCanvas;
    this.minimapViewport = config.minimapViewport;
    this.zoomLabel = config.zoomLabel;
    this.zones = config.zones;
    this.zoneBounds = config.zoneBounds;
    this.CANVAS_W = config.canvasWidth;
    this.CANVAS_H = config.canvasHeight;
    this.mode = config.mode;
    this.onZoneChange = config.onZoneChange ?? null;
    this.onReadingModeChange = config.onReadingModeChange ?? null;
    this.helpSeen = sessionStorage.getItem('sivanesh.helpSeen') === '1';

    if (this.mode === 'case') {
      this.readingMode = true;
    }

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
    const canvasX = (screenX - cw - this.tx) / this.scale;
    const canvasY = (screenY - ch - this.ty) / this.scale;
    this.tx = screenX - cw - canvasX * newScale;
    this.ty = screenY - ch - canvasY * newScale;
    this.scale = newScale;
    this.apply();
  }

  // §3.10 — Flight (mode-aware: case adds Y-bias)
  private flyTo(targetCX: number, targetCY: number, targetScale: number, duration = 650): void {
    if (this.flightAnim) cancelAnimationFrame(this.flightAnim);
    this.decelerating = false;
    const startTX = this.tx; const startTY = this.ty; const startScale = this.scale;

    let yBias = 0;
    if (this.mode === 'case' && this.readingMode) {
      if (innerWidth <= 420)       yBias = innerHeight * 0.18;
      else if (innerWidth <= 640)  yBias = innerHeight * 0.14;
      else if (innerWidth <= 1100) yBias = innerHeight * 0.08;
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
      else this.flightAnim = null;
    };
    this.flightAnim = requestAnimationFrame(step);
  }

  // flyToRaw — animates to literal tx/ty/scale (no centering math)
  private flyToRaw(endTX: number, endTY: number, endScale: number, duration = 600): void {
    if (this.flightAnim) cancelAnimationFrame(this.flightAnim);
    this.decelerating = false;
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
      else this.flightAnim = null;
    };
    this.flightAnim = requestAnimationFrame(step);
  }

  // §3.10 — goToZone (workbench: viewport-aware scale)
  goToZone(name: string): void {
    const z = this.zones[name]; if (!z) return;
    if (this.mode === 'workbench') {
      const vw = innerWidth;
      let targetScale = z.scale;
      if (vw <= 520) targetScale = z.scale * 0.55;
      else if (vw <= 820) targetScale = z.scale * 0.72;
      else if (vw <= 1100) targetScale = z.scale * 0.88;
      this.flyTo(z.cx, z.cy, targetScale, 700);
    } else {
      this.flyTo(z.cx, z.cy, z.scale, 700);
    }
  }

  // Instant zone positioning — no animation
  goToZoneInstant(name: string): void {
    const z = this.zones[name]; if (!z) return;
    let targetScale = z.scale;
    if (this.mode === 'workbench') {
      const vw = innerWidth;
      if (vw <= 520) targetScale = z.scale * 0.55;
      else if (vw <= 820) targetScale = z.scale * 0.72;
      else if (vw <= 1100) targetScale = z.scale * 0.88;
    }
    this.scale = targetScale;
    this.tx = -z.cx * targetScale;
    this.ty = -z.cy * targetScale;
    this.apply();
  }

  // §3.13 — Reset (workbench)
  private resetView(): void {
    const vw = innerWidth;
    if (vw <= 520)       this.scale = 0.35;
    else if (vw <= 820)  this.scale = 0.47;
    else if (vw <= 1100) this.scale = 0.57;
    else                 this.scale = 0.65;
    this.tx = -2400 * this.scale;
    this.ty = -2000 * this.scale;
    this.apply();
  }

  private fitView(): void {
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

  // Reading mode helpers
  setReadingMode(on: boolean): void {
    if (on) {
      this.readingMode = true;
      this.computeReaderLayout();
      this.refreshZoneTargets();
      // Return to last reading position; fall back to top zone on first open
      if (this.lastReadingPos) {
        this.flyToRaw(this.lastReadingPos.tx, this.lastReadingPos.ty, this.lastReadingPos.scale);
      } else {
        this.goToZone('top');
      }
    } else {
      // Snapshot current position so re-enabling returns here
      this.lastReadingPos = { tx: this.tx, ty: this.ty, scale: this.scale };
      this.readingMode = false;
    }
    this.onReadingModeChange?.(on);
  }

  toggleReadingMode(): void { this.setReadingMode(!this.readingMode); }

  // MARGIN-REF-SPEC — jumpToArtifact (with preJumpState snapshot)
  jumpToArtifact(slug: string): void {
    const el = document.getElementById(`obj-${slug}`);
    if (!el) {
      console.warn(`[canvas] no artifact found with id="obj-${slug}"`);
      return;
    }

    // Snapshot current camera state BEFORE jumping
    this.preJumpState = {
      tx: this.tx,
      ty: this.ty,
      scale: this.scale,
      readingMode: this.readingMode,
    };

    // Exit reading mode so user sees the canvas
    this.readingMode = false;
    this.onReadingModeChange?.(false);

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

    // Show return pill
    const label = el.dataset.label || slug;
    this.showReturnPill(label);
  }

  // Restore camera to pre-jump position
  restoreFromJump(): void {
    if (!this.preJumpState) return;
    const snapshot = this.preJumpState;
    this.preJumpState = null;

    this.readingMode = snapshot.readingMode;
    if (snapshot.readingMode) {
      // Persist the restored position so future re-enables return here, not to top
      this.lastReadingPos = { tx: snapshot.tx, ty: snapshot.ty, scale: snapshot.scale };
    }

    // Fly back to exact prior camera position
    this.flyToRaw(snapshot.tx, snapshot.ty, snapshot.scale, 600);
    this.onReadingModeChange?.(this.readingMode);
  }

  private returnPillTimer = 0;

  private showReturnPill(label: string): void {
    const pill = document.getElementById('returnPill');
    const labelEl = document.getElementById('returnPillArtifact');
    if (!pill || !labelEl) return;
    labelEl.textContent = label;
    pill.classList.add('on');
    clearTimeout(this.returnPillTimer);
    this.returnPillTimer = window.setTimeout(() => this.hideReturnPill(), 10000);
  }

  hideReturnPill(): void {
    const pill = document.getElementById('returnPill');
    if (pill) pill.classList.remove('on');
    clearTimeout(this.returnPillTimer);
  }

  // §3.5 — Inertia
  private inertiaTick = (): void => {
    if (!this.decelerating) return;
    this.tx += this.vx; this.ty += this.vy;
    this.vx *= 0.92; this.vy *= 0.92;
    this.apply();
    if (Math.hypot(this.vx, this.vy) > 0.3) requestAnimationFrame(this.inertiaTick);
    else this.decelerating = false;
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
    // §3.8 — Wheel
    this.wrap.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        this.zoomAt(Math.pow(0.9985, e.deltaY), e.clientX, e.clientY);
      } else {
        this.tx -= e.deltaX; this.ty -= e.deltaY;
        this.scheduleApply();
      }
    }, { passive: false });

    // §3.5 — Pointer pan
    this.wrap.addEventListener('pointerdown', (e: PointerEvent) => {
      // Skip pan if a pinch gesture is active
      if (this.touchState) return;
      const forcePan = e.button === 1 || this.spaceHeld;
      if (!forcePan) {
        let target = e.target as HTMLElement;
        while (target && target !== this.wrap) {
          if (target.tagName === 'A' || target.classList.contains('polaroid') ||
            target.classList.contains('printout') || target.classList.contains('email') ||
            target.tagName === 'BUTTON') return;
          target = target.parentElement as HTMLElement;
        }
        if (e.button !== 0 && e.button !== undefined) return;
      } else { e.preventDefault(); }
      this.isPanning = true; this.decelerating = false;
      this.vx = 0; this.vy = 0;
      this.panStartX = e.clientX; this.panStartY = e.clientY;
      this.panStartTX = this.tx; this.panStartTY = this.ty;
      this.lastMoveX = e.clientX; this.lastMoveY = e.clientY;
      this.lastMoveTime = performance.now();
      this.wrap.classList.add('grabbing');
      this.wrap.setPointerCapture(e.pointerId);
    });

    this.wrap.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.isPanning || this.touchState) return;
      if (this.mode === 'case' && this.readingMode) {
        // Reading mode: vertical-only pan — horizontal axis locked
        this.tx = this.panStartTX;
        this.ty = this.panStartTY + (e.clientY - this.panStartY);
      } else {
        this.tx = this.panStartTX + (e.clientX - this.panStartX);
        this.ty = this.panStartTY + (e.clientY - this.panStartY);
      }
      const now = performance.now(); const dt = now - this.lastMoveTime;
      if (dt > 0) {
        this.vx = (e.clientX - this.lastMoveX) / dt * 16;
        this.vy = (e.clientY - this.lastMoveY) / dt * 16;
      }
      this.lastMoveX = e.clientX; this.lastMoveY = e.clientY; this.lastMoveTime = now;
      this.scheduleApply();
    });

    this.wrap.addEventListener('pointerup', () => {
      if (!this.isPanning) return;
      this.isPanning = false;
      this.wrap.classList.remove('grabbing');
      if (Math.hypot(this.vx, this.vy) > 2) {
        this.decelerating = true;
        requestAnimationFrame(this.inertiaTick);
      }
    });
    this.wrap.addEventListener('pointercancel', () => {
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
        case 'ArrowLeft': this.tx += 80; this.apply(); e.preventDefault(); break;
        case 'ArrowRight': this.tx -= 80; this.apply(); e.preventDefault(); break;
        case 'ArrowUp': this.ty += 80; this.apply(); e.preventDefault(); break;
        case 'ArrowDown': this.ty -= 80; this.apply(); e.preventDefault(); break;
        case 'r': case 'R':
          if (this.mode === 'case') {
            if (this.preJumpState) {
              this.restoreFromJump();
              this.hideReturnPill();
            } else {
              this.setReadingMode(true);
            }
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
        const t1 = e.touches[0], t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const newScale = clamp(this.touchState.startScale * (dist / this.touchState.startDist), this.minScale, this.maxScale);
        const cw = innerWidth / 2, ch = innerHeight / 2;
        const cx = (this.touchState.cx - cw - this.touchState.startTX) / this.touchState.startScale;
        const cy = (this.touchState.cy - ch - this.touchState.startTY) / this.touchState.startScale;
        this.tx = this.touchState.cx - cw - cx * newScale;
        this.ty = this.touchState.cy - ch - cy * newScale;
        this.scale = newScale; this.scheduleApply();
      }
    }, { passive: false });
    this.wrap.addEventListener('touchend', () => { this.touchState = null; });

    // §3.17 — Click-vs-drag
    this.wrap.addEventListener('pointerdown', (e) => { this.clickStart = { x: e.clientX, y: e.clientY }; }, true);
    this.wrap.addEventListener('click', (e) => {
      if (!this.clickStart) return;
      if (Math.hypot(e.clientX - this.clickStart.x, e.clientY - this.clickStart.y) > 6) {
        e.preventDefault(); e.stopPropagation();
      }
      this.clickStart = null;
    }, true);

    // §3.11 — Minimap click
    this.minimap.addEventListener('click', (e) => {
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
  getReadingMode(): boolean { return this.readingMode; }
}
