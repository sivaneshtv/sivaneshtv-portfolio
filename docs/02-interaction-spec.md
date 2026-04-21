# 02 · Interaction Spec

**Purpose:** Every input → output rule for the canvas engine, with the precise math, constraints, and edge cases. This is the most technically specific doc. Follow it or justify why not.

**Why this matters:** The interaction model took many iterations to get right. The math below is not the first thing that comes to mind — it's the thing that works after eliminating what doesn't. If you re-derive from scratch you will rediscover the same bugs.

---

## 1. The canvas model

### DOM structure

```
<body>
  <div class="board-bg">           <!-- warm beige gradient + noise overlay, z-index: 0 -->
  <div class="canvas-wrap">        <!-- viewport, fixed, inset:0, overflow:hidden, z-index: 1 -->
    <div class="canvas">            <!-- transformable surface, 6000×4200 (workbench) or 5000×6800 (cases) -->
      <!-- all pinned artifacts live inside .canvas with absolute positioning -->
    </div>
  </div>
  <div class="topbar">             <!-- z-index: 20, fixed UI chrome -->
  <div class="toolbar">            <!-- z-index: 20, fixed UI chrome -->
  <div class="minimap">            <!-- z-index: 30, fixed UI chrome -->
</body>
```

### The critical CSS positioning

```css
.canvas {
  position: absolute;
  top: 50%;           /* 50% !important — sets the origin */
  left: 50%;          /* 50% !important — sets the origin */
  width:  6000px;     /* CANVAS_W constant */
  height: 4200px;     /* CANVAS_H constant */
  transform-origin: 0 0;  /* NOT default center — transforms from top-left */
  transition: none;
  will-change: transform;
}
```

**Why `top:50%; left:50%; transform-origin: 0 0`?**

Because we translate the canvas by `(tx, ty)` and scale by `scale`. With `transform-origin: 0 0`, the transform scales/translates from the canvas's own top-left corner. Combined with `top:50%; left:50%`, the canvas's (0,0) corner starts at screen center. Then:

- `tx = 0, ty = 0, scale = 1` → canvas (0,0) at screen center
- `tx = -cx*scale, ty = -cy*scale` → canvas (cx,cy) at screen center
- Scaling happens around canvas (0,0), not screen center — which is what we want for zoom-toward-cursor to work.

**Do not change this setup.** It's the foundation for every coordinate calculation.

### Coordinate transforms

A point `(cx, cy)` in canvas space appears at screen position:

```
screenX = viewportWidth/2  + tx + cx * scale
screenY = viewportHeight/2 + ty + cy * scale
```

To **put canvas point `(cx, cy)` at screen center**:
```
tx = -cx * scale
ty = -cy * scale
```

To **convert a screen point `(sx, sy)` to canvas coords** (needed for zoom-toward-cursor):
```
cx = (sx - viewportWidth/2  - tx) / scale
cy = (sy - viewportHeight/2 - ty) / scale
```

---

## 2. State

The canvas engine holds three pieces of pan/zoom state:

```typescript
let tx: number = 0;      // translation X (screen pixels)
let ty: number = 0;      // translation Y (screen pixels)
let scale: number = 0.5; // current zoom factor, typically 0.3–1.2
```

Plus a few transient flags:

```typescript
let isPanning: boolean = false;       // true during a drag
let spaceHeld: boolean = false;       // true while spacebar is down (for pan-anywhere mode)
let readingMode: boolean = true;      // case studies only; controls camera behavior on scroll
let flightAnim: number | null = null; // requestAnimationFrame ID for active zone flight
let decelerating: boolean = false;    // true during post-drag inertia
let vx: number = 0, vy: number = 0;   // drag velocity, for inertia
```

**State invariants:**
- `scale ∈ [0.25, 2.0]` — hard clamp. Below 0.25 the canvas becomes unreadable; above 2.0 the content pixelates and users can't find the zoom-out anyway.
- `tx, ty` always post-clamp. Never let state hold out-of-bounds values — clamp on every mutation.

---

## 3. The clamp function (critical)

This governs what regions of the canvas are navigable. It took several iterations to get right. **Current correct implementation:**

```typescript
function clampTranslate(): void {
  const cw = CANVAS_W * scale;  // canvas visual width at current zoom
  const ch = CANVAS_H * scale;  // canvas visual height at current zoom
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // If canvas is smaller than viewport (unusual — only at very low zoom on big screens)
  // just center it with no pan allowed.
  if (cw <= vw) {
    tx = -cw / 2;
  } else {
    // At max tx (canvas pushed right on screen): canvas left edge flush to viewport left edge.
    //   canvas left edge on screen = vw/2 + tx = 0  →  tx = -vw/2
    const maxTX = -vw / 2;
    // At min tx (canvas pushed left): canvas right edge flush to viewport right edge.
    //   canvas right edge on screen = vw/2 + tx + cw = vw  →  tx = vw/2 - cw
    const minTX = vw / 2 - cw;
    tx = clamp(tx, minTX, maxTX);
  }

  if (ch <= vh) {
    ty = -ch / 2;
  } else {
    const maxTY = -vh / 2;
    const minTY = vh / 2 - ch;
    ty = clamp(ty, minTY, maxTY);
  }
}
```

**Intent:** Canvas edges are allowed to pan all the way to viewport edges, but **never beyond**. You can never see "empty void past the canvas." All four corners of the canvas are reachable via pan AND minimap click.

### Why NOT permissive clamps we tried earlier

We tried `minTX = -cw - vw*0.1` (letting canvas pan 10% beyond viewport edge). This seemed nice but caused: users saw the dot grid stop abruptly with empty gradient beyond it → looked like a bug. The flush-to-edge clamp is correct.

### Why NOT restrictive clamps we tried earlier

We tried `minTX = -cw + vw*0.65` (requiring 65% of canvas always visible). This caused: minimap click to bottom-right got yanked back partway → user couldn't reach corners. The flush-to-edge clamp fixes this too.

---

## 4. The `apply()` function

Every mutation to `tx`, `ty`, or `scale` must flow through `apply()`:

```typescript
function apply(): void {
  clampTranslate();
  canvas.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
  updateMinimap();
  updateActiveZone();  // optional: highlights the current zone in nav
  zoomValueLabel.textContent = `${Math.round(scale * 100)}%`;
}
```

- Use `translate3d` (not `translate`) to force GPU compositing. Critical for pan/zoom smoothness.
- `.toFixed(2)` on translations and `.toFixed(4)` on scale prevents sub-pixel jitter at rest.
- `clampTranslate` always runs first so out-of-range writes can't leak through.

---

## 5. Wheel event — the pan-first handler

This is THE central interaction. Everything hinges on getting this right.

```typescript
canvasWrap.addEventListener('wheel', (e: WheelEvent) => {
  e.preventDefault();  // always — otherwise the page scrolls

  // Cmd/Ctrl + wheel OR trackpad pinch → zoom toward cursor
  // (pinch-trackpad gestures fire wheel with ctrlKey=true in all modern browsers)
  if (e.ctrlKey || e.metaKey) {
    const factor = Math.pow(0.9985, e.deltaY);
    zoomAt(factor, e.clientX, e.clientY);
    return;
  }

  // Plain wheel / two-finger trackpad swipe → pan
  // Both deltaX and deltaY respected for horizontal + vertical panning
  if (readingMode) {
    // Reading mode: scroll pans the reader column (typically vertical; horizontal ignored visually
    // but still translates so users don't feel locked)
    tx -= e.deltaX;
    ty -= e.deltaY;
  } else {
    // Explore mode: pan the board freely
    tx -= e.deltaX;
    ty -= e.deltaY;
  }
  apply();
}, { passive: false });  // passive:false is required for preventDefault()
```

### The zoom function

```typescript
function zoomAt(factor: number, screenX: number, screenY: number): void {
  const newScale = clamp(scale * factor, 0.25, 2.0);
  if (newScale === scale) return;

  // Convert screen point to canvas coords BEFORE the scale change
  const cx = (screenX - innerWidth/2  - tx) / scale;
  const cy = (screenY - innerHeight/2 - ty) / scale;

  // Apply the scale
  scale = newScale;

  // Now adjust tx/ty so the SAME canvas point stays under the cursor
  tx = screenX - innerWidth/2  - cx * scale;
  ty = screenY - innerHeight/2 - cy * scale;

  apply();
}
```

This is standard zoom-toward-cursor math. The constant `0.9985` gives a comfortable zoom speed; smaller number = faster zoom per wheel tick.

---

## 6. Pointer event — pan via drag

```typescript
let panStartX = 0, panStartY = 0, panStartTX = 0, panStartTY = 0;
let lastMoveX = 0, lastMoveY = 0, lastMoveTime = 0;

canvasWrap.addEventListener('pointerdown', (e: PointerEvent) => {
  // Middle mouse button (button === 1) or spacebar-held → pan ANYWHERE, even over interactives
  const forcePan = (e.button === 1) || spaceHeld;

  if (!forcePan) {
    // Left-click pan: bail if click landed on a link, button, or clickable artifact
    let target = e.target as HTMLElement;
    while (target && target !== canvasWrap) {
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.classList.contains('polaroid') ||
        target.classList.contains('printout') ||
        target.classList.contains('email')
      ) {
        return;  // let the click through
      }
      target = target.parentElement as HTMLElement;
    }
    if (e.button !== 0 && e.button !== undefined) return;  // ignore right-click, etc
  } else {
    e.preventDefault();  // suppress browser middle-click autoscroll icon
  }

  isPanning = true;
  decelerating = false;
  vx = 0; vy = 0;
  panStartX = e.clientX;
  panStartY = e.clientY;
  panStartTX = tx;
  panStartTY = ty;
  lastMoveX = e.clientX;
  lastMoveY = e.clientY;
  lastMoveTime = performance.now();
  canvasWrap.classList.add('grabbing');
  canvasWrap.setPointerCapture(e.pointerId);
});

canvasWrap.addEventListener('pointermove', (e: PointerEvent) => {
  if (!isPanning) return;
  tx = panStartTX + (e.clientX - panStartX);
  ty = panStartTY + (e.clientY - panStartY);

  // Track velocity for inertia
  const now = performance.now();
  const dt = now - lastMoveTime;
  if (dt > 0) {
    vx = (e.clientX - lastMoveX) / dt * 16;  // scale to ~60fps-normalized pixels/frame
    vy = (e.clientY - lastMoveY) / dt * 16;
  }
  lastMoveX = e.clientX;
  lastMoveY = e.clientY;
  lastMoveTime = now;

  // If significant drag in reading mode, exit reading mode (the user wants to explore)
  const dragDist = Math.hypot(e.clientX - panStartX, e.clientY - panStartY);
  if (dragDist > 30 && readingMode) {
    readingMode = false;
    showFirstPanHint?.();
  }

  apply();
});

canvasWrap.addEventListener('pointerup', (e: PointerEvent) => {
  if (!isPanning) return;
  isPanning = false;
  canvasWrap.classList.remove('grabbing');
  // Start inertia if velocity is meaningful
  if (Math.hypot(vx, vy) > 2) {
    decelerating = true;
    requestAnimationFrame(inertiaTick);
  }
});

canvasWrap.addEventListener('pointercancel', () => {
  isPanning = false;
  canvasWrap.classList.remove('grabbing');
});

function inertiaTick(): void {
  if (!decelerating) return;
  tx += vx;
  ty += vy;
  vx *= 0.92;
  vy *= 0.92;
  apply();
  if (Math.hypot(vx, vy) > 0.3) {
    requestAnimationFrame(inertiaTick);
  } else {
    decelerating = false;
  }
}
```

### Browser middle-click autoscroll suppression

Middle-click on a page normally shows the browser's "autoscroll" icon (the crosshair cursor). Suppress it:

```typescript
canvasWrap.addEventListener('mousedown', (e) => {
  if (e.button === 1) e.preventDefault();
});
canvasWrap.addEventListener('auxclick', (e) => {
  if (e.button === 1) e.preventDefault();
});
```

---

## 7. Spacebar-held pan

Holding space and dragging = pan anywhere, same as middle-click. Cursor should show `grab`.

```typescript
window.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.code === 'Space' && !spaceHeld) {
    const tag = (document.activeElement?.tagName || '').toUpperCase();
    // Don't hijack space when user is typing in a text input
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    spaceHeld = true;
    canvasWrap.classList.add('space-pan');
    e.preventDefault();  // prevent page scroll or button activation
  }
});

window.addEventListener('keyup', (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    spaceHeld = false;
    canvasWrap.classList.remove('space-pan');
  }
});
```

CSS cursor rules:

```css
.canvas-wrap { cursor: grab; }
.canvas-wrap.grabbing { cursor: grabbing; }
.canvas-wrap.space-pan { cursor: grab; }
.canvas-wrap.space-pan.grabbing { cursor: grabbing; }
```

---

## 8. Touch events — pinch + drag (mobile)

```typescript
let touchState: null | {
  mode: 'pinch' | 'pan';
  startDist?: number;
  startScale?: number;
  startTX: number;
  startTY: number;
  cx?: number;
  cy?: number;
  startX?: number;
  startY?: number;
} = null;

canvasWrap.addEventListener('touchstart', (e: TouchEvent) => {
  if (e.touches.length === 2) {
    const [t1, t2] = [e.touches[0], e.touches[1]];
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    touchState = {
      mode: 'pinch',
      startDist: Math.hypot(dx, dy),
      startScale: scale,
      startTX: tx,
      startTY: ty,
      cx: (t1.clientX + t2.clientX) / 2,
      cy: (t1.clientY + t2.clientY) / 2
    };
  } else if (e.touches.length === 1) {
    const t = e.touches[0];
    touchState = {
      mode: 'pan',
      startTX: tx,
      startTY: ty,
      startX: t.clientX,
      startY: t.clientY
    };
  }
}, { passive: false });

canvasWrap.addEventListener('touchmove', (e: TouchEvent) => {
  if (!touchState) return;
  e.preventDefault();

  if (touchState.mode === 'pinch' && e.touches.length === 2) {
    const [t1, t2] = [e.touches[0], e.touches[1]];
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    const dist = Math.hypot(dx, dy);
    const factor = dist / touchState.startDist!;
    const newScale = clamp(touchState.startScale! * factor, 0.25, 2.0);
    // Pinch zooms toward the midpoint of the two fingers
    zoomAtSpecific(newScale, touchState.cx!, touchState.cy!, touchState.startScale!, touchState.startTX, touchState.startTY);
  } else if (touchState.mode === 'pan' && e.touches.length === 1) {
    const t = e.touches[0];
    tx = touchState.startTX + (t.clientX - touchState.startX!);
    ty = touchState.startTY + (t.clientY - touchState.startY!);
    apply();
  }
}, { passive: false });

canvasWrap.addEventListener('touchend', () => { touchState = null; });
canvasWrap.addEventListener('touchcancel', () => { touchState = null; });
```

---

## 9. Minimap

A scaled representation of the canvas with a viewport indicator and clickable jump targets.

### Building the minimap (once on boot, re-run on resize)

```typescript
function buildMinimap(): void {
  // Defer one frame — layout must be settled (fonts, CSS applied) for offsetLeft/offsetTop to be correct
  requestAnimationFrame(() => {
    minimapCanvas.innerHTML = '';
    const mw = minimap.clientWidth - 8;   // minus padding
    const mh = minimap.clientHeight - 8;
    const sx = mw / CANVAS_W;  // scale factor, x
    const sy = mh / CANVAS_H;  // scale factor, y

    const objects = canvas.querySelectorAll(
      '.sticky, .card, .polaroid, .printout, .masthead, .contact-card, .todo, .photo'
    );

    objects.forEach((el: HTMLElement) => {
      const left = el.offsetLeft;
      const top = el.offsetTop;
      const w = el.offsetWidth  || 200;
      const h = el.offsetHeight || 200;

      const dot = document.createElement('div');
      dot.className = 'minimap-dot';
      if (el.classList.contains('polaroid') || el.classList.contains('printout')) {
        dot.classList.add('work');
      }
      dot.style.left   = `${left * sx}px`;
      dot.style.top    = `${top * sy}px`;
      dot.style.width  = `${Math.max(3, w * sx)}px`;
      dot.style.height = `${Math.max(3, h * sy)}px`;
      minimapCanvas.appendChild(dot);
    });
  });
}
```

**Why the rAF defer?** If you call `buildMinimap()` before layout settles (e.g. synchronously on script load), `offsetLeft` can be 0 or wrong. Wrap in `requestAnimationFrame` to ensure layout is final.

**Don't** hardcode sizes on `.minimap-dot.work` (e.g. `width: 14px`); let the JS compute from actual dimensions. We made this mistake; polaroids all rendered at 14px in the minimap regardless of actual size.

### Updating the viewport indicator (on every `apply()`)

```typescript
function updateMinimap(): void {
  const mw = minimap.clientWidth - 8;
  const mh = minimap.clientHeight - 8;
  const sx = mw / CANVAS_W;
  const sy = mh / CANVAS_H;

  // Current visible region in canvas coords:
  //   canvas-x = (screen-x - viewport-center-x - tx) / scale
  //   at screen-x = 0: canvas-x = (-viewport-width/2 - tx) / scale
  const canvasLeft = (-innerWidth/2 - tx) / scale;
  const canvasTop  = (-innerHeight/2 - ty) / scale;
  const canvasVisibleW = innerWidth  / scale;
  const canvasVisibleH = innerHeight / scale;

  minimapViewport.style.left   = `${canvasLeft * sx + 4}px`;
  minimapViewport.style.top    = `${canvasTop  * sy + 4}px`;
  minimapViewport.style.width  = `${canvasVisibleW * sx}px`;
  minimapViewport.style.height = `${canvasVisibleH * sy}px`;
}
```

### Minimap click → jump

```typescript
minimap.addEventListener('click', (e: MouseEvent) => {
  const rect = minimap.getBoundingClientRect();
  const mx = e.clientX - rect.left - 4;  // minus padding
  const my = e.clientY - rect.top - 4;
  const mw = minimap.clientWidth - 8;
  const mh = minimap.clientHeight - 8;

  const targetCanvasX = (mx / mw) * CANVAS_W;
  const targetCanvasY = (my / mh) * CANVAS_H;

  // Put the clicked canvas point at screen center
  tx = -targetCanvasX * scale;
  ty = -targetCanvasY * scale;
  apply();  // clampTranslate will pull back to valid range if near an edge
});
```

---

## 10. Zones and zone flights

**Zones** are named camera targets with a point and a scale. Typically one per section on the page.

```typescript
interface Zone {
  cx: number;       // canvas-space center x
  cy: number;       // canvas-space center y
  scale: number;    // desired zoom level
}

const zones: Record<string, Zone> = {
  hello:   { cx: 2550, cy: 1900, scale: 0.60 },
  about:   { cx: 1200, cy: 2100, scale: 0.55 },
  work:    { cx: 4100, cy: 2200, scale: 0.55 },
  howwork: { cx: 2050, cy: 3400, scale: 0.60 },
  contact: { cx: 4300, cy: 3620, scale: 0.65 },
};
```

**Zone bounds** are rectangles in canvas space used for live detection — highlighting the current zone in the nav as the user pans through it.

```typescript
interface ZoneBounds {
  x1: number; y1: number; x2: number; y2: number;
}

const zoneBounds: Record<string, ZoneBounds> = {
  hello:   { x1: 1800, y1: 1400, x2: 3200, y2: 2100 },
  about:   { x1:  750, y1: 1500, x2: 1700, y2: 2700 },
  work:    { x1: 3400, y1: 1600, x2: 4800, y2: 2900 },
  howwork: { x1: 1100, y1: 3000, x2: 3300, y2: 3800 },
  contact: { x1: 3600, y1: 3200, x2: 4800, y2: 3850 },
};
```

### Zone flight animation

```typescript
function flyTo(targetCX: number, targetCY: number, targetScale: number, duration = 700): void {
  if (flightAnim) cancelAnimationFrame(flightAnim);
  decelerating = false;

  const startTX = tx, startTY = ty, startScale = scale;
  const endTX = -targetCX * targetScale;
  const endTY = -targetCY * targetScale;
  const t0 = performance.now();

  function step(now: number) {
    const t = Math.min((now - t0) / duration, 1);
    const e = easeInOutCubic(t);
    tx = startTX + (endTX - startTX) * e;
    ty = startTY + (endTY - startTY) * e;
    scale = startScale + (targetScale - startScale) * e;
    apply();
    if (t < 1) {
      flightAnim = requestAnimationFrame(step);
    } else {
      flightAnim = null;
    }
  }

  flightAnim = requestAnimationFrame(step);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function goToZone(name: string): void {
  const z = zones[name];
  if (!z) return;
  flyTo(z.cx, z.cy, z.scale, 700);
}
```

### Live zone detection

On every `apply()`, check which zone's bounds contain the current viewport center:

```typescript
function updateActiveZone(): void {
  // Viewport center in canvas coords
  const vcx = -tx / scale;
  const vcy = -ty / scale;

  for (const name in zoneBounds) {
    const b = zoneBounds[name];
    if (vcx >= b.x1 && vcx <= b.x2 && vcy >= b.y1 && vcy <= b.y2) {
      highlightNavZone(name);
      return;
    }
  }
  highlightNavZone(null);
}
```

---

## 11. Reading mode (case studies only)

Case studies open in **reading mode**: the camera auto-centers on the reader column at a comfortable zoom. Wheel scroll pans vertically down the column. Dragging exits reading mode (the user wants to explore).

```typescript
let readingMode: boolean = true;  // default on for case studies
let readingScale: number = 0.55;  // computed from viewport — see below
```

### Computing the reading scale (responsive)

The reader column has a fixed width (say 720px). We want it to fill ~82% of desktop viewport, ~92% tablet, ~94% mobile.

```typescript
function computeReadingScale(): number {
  const vw = innerWidth;
  const readerWidth = 720;  // or whatever the reader column width is

  let desiredColumnDisplayPx: number;
  if (vw <= 420)      desiredColumnDisplayPx = vw * 0.94;  // small mobile
  else if (vw <= 640) desiredColumnDisplayPx = vw * 0.92;  // large mobile / small tablet
  else                desiredColumnDisplayPx = vw * 0.82;  // tablet / desktop

  let s = desiredColumnDisplayPx / readerWidth;
  s = clamp(s, 0.3, 1.1);
  return s;
}
```

### Mobile reading Y-bias (important)

On mobile, if you center a section's Y in the viewport, the reading content ends up visually BELOW the middle of the screen because eyes naturally rest slightly above center. Compensate:

```typescript
function flyTo(targetCX: number, targetCY: number, targetScale: number, duration = 700): void {
  // ... standard setup ...

  // Reading-mode Y bias: shift the camera so content lands above geometric center on mobile
  let yBias = 0;
  if (readingMode) {
    if (innerWidth <= 420)      yBias = innerHeight * 0.18;
    else if (innerWidth <= 640) yBias = innerHeight * 0.14;
    else if (innerWidth <= 1100) yBias = innerHeight * 0.08;
  }

  const endTX = -targetCX * targetScale;
  const endTY = -targetCY * targetScale + yBias;

  // ... rest of animation
}
```

---

## 12. Onboarding and help

Show a one-time help overlay on first visit:

```typescript
const HELP_KEY = 'sivanesh.helpSeen';
const helpSeen = sessionStorage.getItem(HELP_KEY) === '1';

if (!helpSeen) {
  showHelpOverlay();  // with dismiss button
  // On dismiss: sessionStorage.setItem(HELP_KEY, '1');
}
```

**Help overlay content (workbench):**
> *"This is a whiteboard."*
> *Scroll to pan around. Click any sketch, sticky, or polaroid to open the full work.*
>
> `scroll` pan · `⌘` + `scroll` zoom · `space` + `drag` pan fast · `F` fit
>
> [got it]

Use `sessionStorage` not `localStorage` so returning-after-weeks visitors get a fresh reminder. Set `helpSeen=1` on dismiss.

---

## 13. Keyboard shortcuts

| Key | Action |
|---|---|
| `F` | Fit entire canvas to viewport (compute scale and center) |
| `R` | Enter/exit reading mode (case studies) |
| `0` | Reset to default view (home/zone:hello) |
| `Escape` | Dismiss help overlay if open; else exit reading mode |
| `Space` (hold) | Pan-anywhere mode (cursor becomes grab) |
| `Cmd/Ctrl + scroll` | Zoom (in wheel handler) |
| Arrow keys | (optional, lower priority) pan by a fixed step |

---

## 14. Performance rules

- **GPU compositing.** Use `translate3d` (not `translate`) and set `will-change: transform` on `.canvas`.
- **No layout thrashing.** Don't read `offsetLeft` / `offsetTop` / `getBoundingClientRect` in the same frame as a transform write. Read once on boot (minimap build) and on resize.
- **Throttle nothing on pan.** Pan should run at 60fps. Measure: mutation to `.canvas.style.transform` is the cheapest DOM update available; no throttling needed.
- **Throttle resize.** Wrap `window.resize` listeners in a 150ms debounce.
- **Inertia decay 0.92.** Lower values (0.85) feel abrupt; higher (0.97) feels floaty. 0.92 is the sweet spot we landed on.

---

## 15. `prefers-reduced-motion`

Detect and respect:

```typescript
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// In flyTo: if reduceMotion, skip animation — just set final values
function flyTo(targetCX: number, targetCY: number, targetScale: number, duration = 700): void {
  if (reduceMotion) {
    tx = -targetCX * targetScale;
    ty = -targetCY * targetScale;
    scale = targetScale;
    apply();
    return;
  }
  // ... animated version
}

// Skip inertia
function inertiaTick(): void {
  if (reduceMotion) { decelerating = false; return; }
  // ... standard inertia
}
```

Pan-via-drag still works (direct input, not animation). Wheel-pan still works. Hover lifts get disabled via CSS:

```css
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
  .polaroid:hover { transform: none !important; }
}
```

---

## 16. Summary of invariants (check your implementation against these)

1. ✅ `scale ∈ [0.25, 2.0]` always
2. ✅ `tx`, `ty` always post-clamp after any mutation
3. ✅ `apply()` is the only place that writes `canvas.style.transform`
4. ✅ Plain wheel = pan (both axes); Cmd/Ctrl wheel = zoom
5. ✅ Middle-click drag = pan (with autoscroll suppressed)
6. ✅ Space + drag = pan, grab cursor while held
7. ✅ Reading mode exits on drag > 30px
8. ✅ Minimap built via requestAnimationFrame after layout
9. ✅ Canvas clamps flush to viewport edges — no beyond-canvas void
10. ✅ `prefers-reduced-motion` respected on flyTo and inertia
11. ✅ Touch pinch zooms toward finger midpoint
12. ✅ Zoom toward cursor preserves point-under-cursor
