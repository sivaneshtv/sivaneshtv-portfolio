# 06 · Known Gotchas

**Purpose:** Every bug we hit during prototyping, with the diagnosis and fix. Read this before implementing the canvas engine. If you skip it, you will re-discover these bugs in the same order.

**Format:** each gotcha has (1) symptom — what looked wrong, (2) root cause — what was actually happening, (3) the fix, (4) a test you can run to verify it stays fixed.

---

## G1 · The double-dot-pattern moiré

### Symptom
At normal zoom levels, the dot grid on the canvas looked unstable — shimmering, doubled, inconsistent spacing depending on where you panned. At extreme zooms it visibly showed two separate dot patterns at different scales.

### Root cause
Both `.board-bg` (the fixed viewport background) AND `.canvas` (the pannable surface) had dot patterns via `background-image: radial-gradient(...)`. The `.canvas` dots scale with the canvas transform; the `.board-bg` dots don't. At 100% zoom they *roughly* aligned by accident — at any other zoom they beat against each other and produced moiré.

### Fix
Dot pattern lives **only on `.canvas`**. The `.board-bg` is a plain gradient, nothing else.

```css
/* WRONG — two dot patterns fighting each other */
.board-bg {
  background-image:
    radial-gradient(circle at 1px 1px, rgba(40,35,25,.18) 1px, transparent 1px),
    linear-gradient(135deg, var(--board), var(--board-2));
  background-size: 28px 28px, 100% 100%;
}
.canvas {
  background-image: radial-gradient(circle at 1px 1px, rgba(40,35,25,.22) 1px, transparent 1px);
  background-size: 28px 28px;
}

/* RIGHT — only canvas has the pattern; it scales with zoom */
.board-bg {
  background: linear-gradient(135deg, var(--board), var(--board-2));
}
.canvas {
  background-image: radial-gradient(circle at 1px 1px, rgba(40,35,25,.22) 1px, transparent 1px);
  background-size: 28px 28px;
}
```

### Test
At 40%, 65%, 100%, 150% zoom, the dot spacing should remain visibly consistent (respectively 11.2px, 18.2px, 28px, 42px on screen). No competing pattern.

---

## G2 · The corner vignette that looked like "missing dots"

### Symptom
Sivanesh reported: "the pattern design does not stretch to all the corners of the canvas." The four corners of the viewport looked darkened and empty — like the dots vanished near the edges.

### Root cause
The `.board-bg::after` pseudo-element had a `radial-gradient(ellipse 110% 90% at 50% 50%, transparent 40%, rgba(40,35,25,.18) 100%)` — a decorative vignette darkening the viewport corners. It made the dots appear absent there, even though they weren't.

### Fix
Delete the vignette. The gradient background is sufficient atmosphere; the vignette adds nothing and actively misleads.

```css
/* WRONG — darkens corners, misleads */
.board-bg::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 110% 90% at 50% 50%, transparent 40%, rgba(40,35,25,.18) 100%);
}

/* RIGHT — no ::after on board-bg at all */
```

### Test
At every zoom level, the dot pattern should read uniformly across the viewport from corner to corner. Quick visual test: corners should look the same brightness as the center.

---

## G3 · Clamp that prevents reaching canvas corners

### Symptom
User clicks the bottom-right of the minimap to jump there. Camera jumps partway but doesn't reach the bottom-right corner. Or: panning to the extreme right/bottom, the camera hits a wall before the canvas edge is visible.

### Root cause (v1, too restrictive)
We used a "65% of canvas must stay visible" clamp:

```typescript
var maxTX = vw * 0.35;           // tx ≤ vw*0.35
var minTX = -cw + vw * 0.65;     // tx ≥ -cw + vw*0.65
```

This meant: for the canvas right edge to reach viewport right, we'd need `tx + cw = vw*0.65`, i.e. only the leftmost 65% visible. Beyond that, clamp pulled back. Bottom-right corner could never be centered, and even minimap clicks got yanked halfway back.

### Wrong fix v2 (too permissive)

We tried allowing 10% overhang beyond canvas edges:

```typescript
var maxTX = vw * 0.1;
var minTX = -cw - vw * 0.1;
```

This let users see "empty void" beyond the dot grid — 10% of viewport width showing plain gradient without dots. Looked broken.

### Fix (v3, flush-to-edge)

```typescript
function clampTranslate(): void {
  const cw = CANVAS_W * scale;
  const ch = CANVAS_H * scale;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (cw <= vw) { tx = -cw / 2; }
  else {
    // maxTX (rightmost pan): canvas left edge at viewport left edge
    //   viewport-x of canvas left edge = vw/2 + tx = 0  →  tx = -vw/2
    const maxTX = -vw / 2;
    // minTX (leftmost pan): canvas right edge at viewport right edge
    //   viewport-x of canvas right edge = vw/2 + tx + cw = vw  →  tx = vw/2 - cw
    const minTX = vw / 2 - cw;
    tx = clamp(tx, minTX, maxTX);
  }
  // Same pattern for ty
}
```

**Why this works:**
- Canvas edges never leave viewport (so no void)
- All four corners reachable (clicking bottom-right minimap lands exactly with canvas bottom-right at viewport bottom-right)
- Reasoning is symmetric and the math is derivable from first principles

### Test
Minimap click to any corner should land with that canvas corner flush against the corresponding viewport corner. Pan to the extreme right: canvas right edge should touch viewport right edge, no overshoot, no undershoot.

Key derivation: since canvas is positioned `top: 50%; left: 50%`, canvas (0,0) is at screen center. The canvas left edge on screen is at `vw/2 + tx`. To put canvas left flush with screen left: `vw/2 + tx = 0`, i.e. `tx = -vw/2`.

---

## G4 · Minimap dots don't match actual positions

### Symptom
The minimap dots showed a layout that didn't correspond to where artifacts actually appeared on the canvas. Especially after repositioning artifacts, the minimap looked stale.

### Root cause (there were two)

**Cause A:** `buildMinimap()` was called synchronously at script load. But `offsetLeft` / `offsetTop` return 0 until CSS is applied and fonts load. Some artifacts reported wrong positions.

**Cause B:** The CSS had `.minimap-dot.work { width: 14px; height: 9px; }` — a hardcoded size override. The JS correctly calculated size from `el.offsetWidth * sx`, but if that value was smaller than 14px, the CSS override made it bigger anyway.

### Fix

```typescript
function buildMinimap(): void {
  // Defer one frame so layout is settled
  requestAnimationFrame(() => {
    minimapCanvas.innerHTML = '';
    const mw = minimap.clientWidth - 8;
    const mh = minimap.clientHeight - 8;
    const sx = mw / CANVAS_W;
    const sy = mh / CANVAS_H;

    const objects = canvas.querySelectorAll(
      '.sticky, .card, .polaroid, .printout, .masthead, .contact-card, .todo, .photo'
    );

    objects.forEach((el: HTMLElement) => {
      const dot = document.createElement('div');
      dot.className = 'minimap-dot';
      if (el.classList.contains('polaroid') || el.classList.contains('printout')) {
        dot.classList.add('work');
      }
      dot.style.left = `${el.offsetLeft * sx}px`;
      dot.style.top = `${el.offsetTop * sy}px`;
      dot.style.width = `${Math.max(3, el.offsetWidth * sx)}px`;
      dot.style.height = `${Math.max(3, el.offsetHeight * sy)}px`;
      minimapCanvas.appendChild(dot);
    });
  });
}
```

CSS — remove hardcoded dimensions:

```css
/* WRONG */
.minimap-dot.work { background: var(--marker-red); width: 14px; height: 9px; }

/* RIGHT — JS sets the dimensions */
.minimap-dot.work { background: var(--marker-red); opacity: 0.75; }
```

### Test
Move an artifact to a new canvas position. Reload. Minimap should show the dot in the proportionally-correct location. Pan the viewport around; the minimap viewport indicator should accurately show what region is visible.

---

## G5 · Browser middle-click autoscroll icon interrupts pan

### Symptom
Middle-clicking to pan instead shows the browser's native "autoscroll" crosshair cursor. The pan never starts properly.

### Root cause
Most browsers on Windows and Linux interpret middle-click as "start autoscroll mode." To override, the browser's default must be prevented on `mousedown` with `button === 1`.

### Fix
```typescript
canvasWrap.addEventListener('mousedown', (e: MouseEvent) => {
  if (e.button === 1) e.preventDefault();
});
canvasWrap.addEventListener('auxclick', (e: MouseEvent) => {
  if (e.button === 1) e.preventDefault();
});
```

Both handlers are needed — `mousedown` suppresses the autoscroll trigger, `auxclick` suppresses the bonus click event that fires on button release.

### Test
Click and drag with middle mouse button anywhere on the canvas. The autoscroll crosshair cursor should never appear; the grabbing cursor should engage immediately.

---

## G6 · Spacebar pan hijacks space key in form inputs

### Symptom
User tries to type a space in an input field (email, search, etc.). The page grabs the space key, activates "pan mode" instead.

### Root cause
Blanket `keydown` listener for `Space` without checking the focused element.

### Fix
```typescript
window.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.code === 'Space' && !spaceHeld) {
    const tag = (document.activeElement?.tagName || '').toUpperCase();
    // Don't hijack space when user is typing
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    // Also skip if active element is contentEditable
    if ((document.activeElement as HTMLElement)?.isContentEditable) return;

    spaceHeld = true;
    canvasWrap.classList.add('space-pan');
    e.preventDefault();
  }
});
```

### Test
Focus an input field, type a sentence with spaces. Spaces type normally. Unfocus the input, press and hold space — pan mode engages with grab cursor.

---

## G7 · Wheel events need `passive: false` or preventDefault is silently ignored

### Symptom
Wheel-to-pan works, but the page ALSO scrolls in the background. The wheel event's `preventDefault()` call silently does nothing.

### Root cause
In modern browsers, wheel event listeners are passive by default. `preventDefault()` in a passive listener is a no-op (with a warning in devtools).

### Fix
Register the wheel listener with `passive: false` explicitly:

```typescript
canvasWrap.addEventListener('wheel', handleWheel, { passive: false });
```

Inside `handleWheel`, `e.preventDefault()` now works.

### Test
Scroll the wheel or swipe on trackpad over the canvas. The page body should NOT scroll; the canvas should pan.

---

## G8 · Reading-mode content lands too low on mobile

### Symptom
On mobile (≤ 640px viewports), when the camera "flies to" a section in reading mode, the section's content appears in the bottom half of the screen. Looks like the camera missed.

### Root cause
Centering a section's Y-coordinate at viewport center puts content at geometric center — but eye travel on mobile rests slightly above center. Text centered at vh/2 reads as "too low."

### Fix
Apply a Y-bias to the target translation in `flyTo`:

```typescript
let yBias = 0;
if (readingMode) {
  if      (innerWidth <= 420)  yBias = innerHeight * 0.18;
  else if (innerWidth <= 640)  yBias = innerHeight * 0.14;
  else if (innerWidth <= 1100) yBias = innerHeight * 0.08;
  // desktop: no bias needed; screen is tall enough
}

const endTX = -targetCX * targetScale;
const endTY = -targetCY * targetScale + yBias;
```

The bias shifts the target position up (increases ty value), which makes the section sit above geometric center — the visual sweet spot.

### Test
Open a case study on mobile. Scroll to trigger a section change. The section's title + lead paragraph should land in the upper half of the viewport, not the middle.

---

## G9 · Reading-mode column fill feels wrong at narrow widths

### Symptom
On mobile, the reader column (nominal width 720px) ends up either (a) too tiny to read or (b) cut off at the edges, depending on scale.

### Root cause
A fixed reading-mode scale doesn't adapt well to viewport width. We need to compute a scale such that the column fills a target percentage of the viewport.

### Fix
Compute the reading scale from viewport width:

```typescript
function computeReadingScale(): number {
  const vw = window.innerWidth;
  const readerWidth = 720;

  let desiredColumnDisplayPx: number;
  if      (vw <= 420)  desiredColumnDisplayPx = vw * 0.94;  // almost full width
  else if (vw <= 640)  desiredColumnDisplayPx = vw * 0.92;
  else                 desiredColumnDisplayPx = vw * 0.82;

  return clamp(desiredColumnDisplayPx / readerWidth, 0.3, 1.1);
}
```

Recompute on resize.

### Test
Open a case study on a 375px phone: column should fill ~94% of screen width. On a 1280px laptop: column should fill ~82% of screen width. Resizing the browser should smoothly adjust.

---

## G10 · Polaroid click gets swallowed by pan-drag handler

### Symptom
User clicks a polaroid on the workbench to open a case study. Instead of navigating, the canvas starts a micro-pan. Click is lost.

### Root cause
The pan handler fires on `pointerdown` anywhere on the canvas. It treats any downpress as a potential drag-start — consuming the event before the polaroid's click fires.

### Fix
Bail out of the pan handler when `pointerdown` lands on an interactive element (link, button, polaroid, etc.):

```typescript
canvasWrap.addEventListener('pointerdown', (e: PointerEvent) => {
  const forcePan = (e.button === 1) || spaceHeld;

  if (!forcePan) {
    let target = e.target as HTMLElement;
    while (target && target !== canvasWrap) {
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.classList.contains('polaroid') ||
        target.classList.contains('printout') ||
        target.classList.contains('email')
      ) {
        return; // let the default click bubble through
      }
      target = target.parentElement as HTMLElement;
    }
    if (e.button !== 0) return; // ignore right-click etc.
  } else {
    e.preventDefault(); // suppress middle-click autoscroll
  }

  // ... set up pan state
});
```

Middle-click and spacebar bypass the bail logic (`forcePan = true`), so users can still pan over polaroids with those modes when they need to.

### Test
Click a polaroid. Should navigate to the case study. Middle-click-drag or space-drag over a polaroid: should pan the canvas.

---

## G11 · Reading-mode drag should exit reading mode

### Symptom
User is in reading mode on a case study. They drag to pan around, expecting to "explore." Instead the camera snaps back to the next section on scroll, fighting their pan.

### Root cause
Reading mode dominated all input by default. No way for user to opt into explore mode without clicking a toolbar button.

### Fix
Detect significant drag in the pointer handler and exit reading mode:

```typescript
canvasWrap.addEventListener('pointermove', (e: PointerEvent) => {
  if (!isPanning) return;
  tx = panStartTX + (e.clientX - panStartX);
  ty = panStartTY + (e.clientY - panStartY);

  // Drag > 30px exits reading mode automatically
  const dragDist = Math.hypot(e.clientX - panStartX, e.clientY - panStartY);
  if (dragDist > 30 && readingMode) {
    readingMode = false;
    maybeShowFirstPanHint();
  }

  apply();
});
```

30px is the magic number — enough to distinguish intentional drag from accidental pointer movement on a touchscreen.

### Test
Open a case study. Drag to pan 50px in any direction. Reading mode should now be OFF; the scroll-pan continues to move the canvas freely. A small-drag click (< 30px) should not exit reading mode.

---

## G12 · Zoom-toward-cursor math drifts on repeated zooms

### Symptom
Zooming repeatedly at the same cursor position slowly drifts the canvas — the point under the cursor stops being the same after 5-6 zoom ticks.

### Root cause
Floating-point accumulation in the zoom math. Each zoom tick has a tiny rounding error; they compound.

### Fix
The correct math (recomputes canvas point from scratch each tick, no accumulation):

```typescript
function zoomAt(factor: number, screenX: number, screenY: number): void {
  const newScale = clamp(scale * factor, 0.25, 2.0);
  if (newScale === scale) return;

  // Canvas coords of the cursor point, AT CURRENT scale
  const cx = (screenX - innerWidth/2  - tx) / scale;
  const cy = (screenY - innerHeight/2 - ty) / scale;

  scale = newScale;

  // Re-derive tx/ty so the same canvas point sits under the cursor
  tx = screenX - innerWidth/2  - cx * scale;
  ty = screenY - innerHeight/2 - cy * scale;

  apply();
}
```

Key: compute `cx, cy` BEFORE changing scale; then set `tx, ty` directly from the new scale. Don't do `tx += delta` — that accumulates error.

### Test
Zoom in 10 times at the exact same cursor position. The point under the cursor should remain at the cursor within ~1px. Zoom out 10 times. Same behavior.

---

## G13 · CSS variables inside inline `style` attributes don't cascade

### Symptom
You set a custom rotation on a polaroid via `style="--rotation: 4deg"` and expect `.polaroid:hover { transform: translateY(-4px) rotate(var(--rotation, 0deg)); }` to use it. Instead, nothing happens on hover, or the element snaps to 0deg.

### Root cause
CSS custom properties ARE inheritable and DO work from inline styles — but the pitfall is that the inline `transform: rotate(4deg)` on the element itself directly sets the transform, and the hover rule must read the variable, not the element's current transform.

### Fix pattern
Set rotation as a custom property, not a direct transform, on the element:

```html
<!-- WRONG -->
<a class="polaroid" style="transform: rotate(4deg)"></a>
<!-- hover rule can't animate from this to a modified rotate because both compete -->

<!-- RIGHT -->
<a class="polaroid" style="--rotation: 4deg"></a>
```

```css
.polaroid {
  transform: rotate(var(--rotation, 0deg));
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}

.polaroid:hover {
  transform: translateY(-4px) rotate(calc(var(--rotation, 0deg) * 0.7));
  /* reduces rotation toward 0 and lifts — "picking it up to look" */
}
```

### Test
A polaroid with `style="--rotation: 4deg"` renders rotated 4°. On hover, it lifts up 4px AND rotates to ~2.8° (toward 0). Smooth transition between states.

---

## G14 · Inertia decay feels wrong

### Symptom
After releasing a pan-drag, the camera slides to a stop but either (a) snaps too abruptly, (b) drifts forever and feels uncontrollable, or (c) has a visible jerk at the moment of release.

### Root cause
Wrong decay factor, or velocity computed naively without time normalisation.

### Fix
Decay factor: **0.92** per frame. Velocity tracked in pixels-per-16ms (normalised to 60fps):

```typescript
// In pointermove
const now = performance.now();
const dt = now - lastMoveTime;
if (dt > 0) {
  vx = (e.clientX - lastMoveX) / dt * 16;  // pixels per 16ms frame
  vy = (e.clientY - lastMoveY) / dt * 16;
}

// In pointerup — start inertia if velocity > threshold
if (Math.hypot(vx, vy) > 2) {
  decelerating = true;
  requestAnimationFrame(inertiaTick);
}

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

Constants that matter:
- **0.92 decay** — slower (0.97) feels floaty, faster (0.85) feels abrupt
- **2px threshold for starting inertia** — below this, user's release was deliberate, no need for inertia
- **0.3px threshold for stopping** — below this, can't see the movement, stop the rAF loop

### Test
Quick flick-pan and release: canvas should continue sliding for ~500ms then stop naturally. Slow drag and release: no inertia, snap to rest. Neither should feel abrupt or overlong.

---

## G15 · Canvas CSS positioning `top:50%` is load-bearing

### Symptom
After a refactor ("let's just set `top:0; left:0`"), all zoom-toward-cursor math broke. Panning still worked, but zoom anchoring went wrong.

### Root cause
The entire coordinate math — everywhere — assumes the canvas is positioned with its (0,0) corner at screen center. `top: 50%; left: 50%` combined with `transform-origin: 0 0` makes this true.

If you move the canvas to `top: 0; left: 0`, the canvas (0,0) is now at screen (0,0), and every formula that uses `vw/2` and `vh/2` as reference points is wrong.

### Fix
**Do not change the CSS positioning of `.canvas`.** These three rules are load-bearing:

```css
.canvas {
  position: absolute;
  top: 50%;              /* DO NOT CHANGE */
  left: 50%;             /* DO NOT CHANGE */
  transform-origin: 0 0; /* DO NOT CHANGE */
  width: 6000px;
  height: 4200px;
  /* ... */
}
```

If you must change the positioning, you must also rederive every formula in `02-interaction-spec.md` that uses `vw/2` or `vh/2`.

### Test
Run the zoom-toward-cursor test (G12): zoom 10 times at the same point, verify the point stays under the cursor.

---

## G16 · Section-anchored artifacts misposition on first paint

### Symptom
In a case study, artifacts anchored to section indices (via `data-anchor="2"`) appear in the wrong place on first paint. On resize they jump to correct positions.

### Root cause
The anchor refresh function reads `section.offsetTop` — which requires layout to have completed, and fonts/images to have loaded (or at least reserved space). On first paint, these aren't settled yet.

### Fix
Run the anchor refresh function in two places:

```typescript
// After initial paint, once layout is settled
window.addEventListener('load', refreshAnchorTargets);

// On every resize
let resizeTimer: number | null = null;
window.addEventListener('resize', () => {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(refreshAnchorTargets, 150);
});

// Also: after fonts load (visible wait can reposition sections)
if ('fonts' in document) {
  document.fonts.ready.then(refreshAnchorTargets);
}
```

### Test
Open a case study on a slow connection (throttle to Slow 3G). During page load, artifacts might appear briefly at (0,0); after layout settles, they snap to correct positions. No "forever stuck at 0,0" state.

---

## G17 · `prefers-reduced-motion` edge cases

### Symptom
User has reduced-motion preference enabled. Zone flight animations play anyway. Or: direct pan gets disabled along with animations, leaving the user unable to move the camera at all.

### Root cause
Blanket disabling of animations removes ALL motion, including user-driven pans which aren't animation — they're direct input.

### Fix
Be selective:

```typescript
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Skip animated zone flights — jump to target instantly
function flyTo(targetCX: number, targetCY: number, targetScale: number): void {
  if (reduceMotion) {
    tx = -targetCX * targetScale;
    ty = -targetCY * targetScale;
    scale = targetScale;
    apply();
    return;
  }
  // ... animated version
}

// Skip inertia after drag — drag itself still works
function inertiaTick(): void {
  if (reduceMotion) { decelerating = false; return; }
  // ... standard inertia
}

// Listen for preference changes live
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
  // update `reduceMotion` flag and UI affordances
});
```

CSS — disable transition animations but keep pan transforms:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
  .polaroid:hover { transform: none !important; }
}
```

### Test
Enable "reduced motion" in OS settings. Reload page. Zone flights should jump instantly. Hover lifts should disable. Direct pan should still work smoothly.

---

## G18 · Fonts flash swap jolts layout

### Symptom
Page loads with fallback fonts. When custom fonts load, every artifact shifts position slightly. Minimap dots look wrong. Anchor-positioned artifacts drift.

### Root cause
`font-display: swap` — fonts swap in when ready, and different font metrics cause slight layout changes. If `buildMinimap` or `refreshAnchorTargets` ran before the swap, positions are based on fallback metrics.

### Fix

1. **Self-host fonts** (see doc 03) — avoids cross-origin delays.
2. **Preload critical fonts** in `<head>`:
   ```html
   <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossorigin>
   ```
3. **Re-run position-dependent initialisers after font load:**
   ```typescript
   document.fonts?.ready.then(() => {
     buildMinimap();
     refreshAnchorTargets();
   });
   ```
4. **Use `font-display: swap` strategically** — swap is fine for headings and sticky text, but for layout-critical elements (the `.reader` column where anchor offsets depend on text flow), consider `font-display: optional` to avoid mid-load swaps.

### Test
Refresh with cache disabled. The first paint should either (a) render in fallback fonts with correct positions, then swap to web fonts and re-layout, OR (b) render in web fonts after a brief pause. No "stuff in wrong positions" state.

---

## G19 · Mobile viewport unit weirdness (100vh vs dvh)

### Symptom
On iOS Safari, the bottom of the canvas wrap gets hidden behind the URL bar. Or the height jumps awkwardly when the URL bar shows/hides.

### Root cause
`100vh` on iOS means "viewport height with URL bar hidden." With the URL bar showing, the actual visible area is smaller — content extends below the screen.

### Fix
Use `100dvh` (dynamic viewport height) instead of `100vh` for the canvas wrap and any fullscreen elements:

```css
.canvas-wrap {
  position: fixed;
  inset: 0;
  height: 100dvh;         /* dynamic — adjusts with URL bar */
  /* fallback for browsers without dvh */
  height: 100vh;
  height: 100dvh;
  z-index: 1;
  overflow: hidden;
}
```

For viewport height calculations in JS, use `window.innerHeight` (already reflects visible area correctly on modern browsers).

### Test
Open on iOS Safari. Scroll. URL bar shows and hides. The canvas wrap should fully fill the visible area at all times, no white strip at the bottom.

---

## G20 · Astro island hydration on a pure DOM engine

### Symptom
(If you go with Astro) The canvas engine needs to mount on the client, but the rest of the page is static HTML. How do you mount vanilla-TS code without wrapping it in a React/Vue island?

### Fix
Use Astro's `client:only` directive with a vanilla JS island:

```astro
---
// src/pages/index.astro
---
<WorkbenchLayout>
  <div class="canvas-wrap" data-canvas-wrap>
    <div class="canvas" data-canvas>
      <!-- ... workbench objects rendered here ... -->
    </div>
  </div>
  <!-- toolbar, minimap, topbar, etc. -->
</WorkbenchLayout>

<script>
  import { CanvasEngine } from '../components/canvas/engine/CanvasEngine';
  // Runs as a module; Astro hoists it to the bottom of body
  const engine = new CanvasEngine({
    canvasEl: document.querySelector('[data-canvas]') as HTMLElement,
    canvasWrap: document.querySelector('[data-canvas-wrap]') as HTMLElement,
    // ... etc
  });
  (window as any).__canvas = engine;
</script>
```

No need for `client:only` directive — Astro processes `<script>` tags inside pages natively, producing an ES module that runs on the client.

For components that need interactive logic (like the topbar menu toggle), use inline scripts in the component:

```astro
---
// src/components/canvas/Topbar.astro
---
<div class="topbar">
  <button data-menu-toggle>menu</button>
  <!-- ... -->
</div>

<script>
  const btn = document.querySelector('[data-menu-toggle]');
  btn?.addEventListener('click', () => { /* ... */ });
</script>
```

### Test
Build and inspect the bundle: JS should be ~10-15KB gzipped. The engine file should be loaded as a module, not wrapped in a framework runtime.

---

## G21 · Copy-paste drift: the "em should be red italic" rule

### Symptom
`<em>` elements in some places render red italic (intended); in other places they render default italic from the browser (black); in other places they're red but not italic.

### Root cause
The rule "em = red italic" is implemented in multiple component-scoped CSS blocks with slight variations:

```css
.sticky em { font-style: normal; color: var(--marker-red); font-weight: 700; }
.card em { font-style: italic; color: var(--marker-red); font-weight: 600; }
.principle-title em { font-style: italic; color: var(--marker-red); }
.r-h2 em { font-style: italic; color: var(--red); font-weight: 700; }
```

Note `font-style: normal` on `.sticky em` (handwritten Caveat already reads italic-like), vs `italic` elsewhere. Note weight varies. Note `--red` vs `--marker-red` — different hues.

These differences are INTENTIONAL but easy to accidentally unify during a refactor, which makes the voice feel flatter.

### Fix
Keep the differences. Document them:

- **`.sticky em`** — no italic (the sticky IS handwritten), red, bold 700
- **`.card em`** — italic (the card is "typed"), red, medium 600
- **`.principle-title em`** — italic, red. Bold is inherited.
- **Reader headings `.r-h2 em`** — italic, red, bold 700
- **Body prose `.r-body em`** — italic, red, weight 600

The rule: **em is always red; italic vs non-italic depends on whether the type family is already italic-adjacent.** Caveat is handwritten and already informal, so non-italic em still reads as emphasis. Inter is upright, so italic em is needed.

### Test
Visual regression test on a reference page showing every em-in-context. If the stickies' em-words ever render italic, you've drifted.

---

## G22 · Canvas width in pixels is NOT a multiple of dot spacing

### Symptom (minor, cosmetic)
At some zoom levels, the rightmost column or bottom row of dots is partially cut off — visible as a faint seam 7-10px from the canvas edge.

### Root cause
Canvas dimensions 6000×4200. Dot pattern `28px 28px`. 6000 / 28 = 214.28 (not integer). The last dot in a row is at x = 214 × 28 = 5992px. There are 8px without a dot between x=5992 and x=6000.

### Fix (optional — only if visible)
Make canvas dimensions multiples of 28:

- `CANVAS_W = 5992` (214 × 28) — slightly narrower, or
- `CANVAS_W = 6020` (215 × 28) — slightly wider

Pick whichever doesn't force content repositioning. Update `CANVAS_W` constant AND the CSS `width: ...px`.

Alternatively: shift the dot grid to center the pattern:

```css
.canvas {
  background-image: radial-gradient(circle at 1px 1px, rgba(40,35,25,.22) 1px, transparent 1px);
  background-size: 28px 28px;
  background-position: 4px 0;  /* offset so seam is hidden under left edge */
}
```

In practice this is minor and rarely noticed; fix only if visually distracting.

### Test
Pan to the right/bottom edge of the canvas. Last column/row of dots should render without a visible seam.

---

## Critical invariants (checklist)

Before shipping, verify these still hold:

1. ✅ Dot pattern only on `.canvas`, never on `.board-bg`
2. ✅ No corner vignette on `.board-bg::after`
3. ✅ Clamp math uses `maxTX = -vw/2`, `minTX = vw/2 - cw` (flush to viewport edges)
4. ✅ `buildMinimap` deferred via `requestAnimationFrame`
5. ✅ No hardcoded `width`/`height` on `.minimap-dot.work`
6. ✅ `mousedown`+`auxclick` suppression for middle-click autoscroll
7. ✅ Spacebar pan bails on input/textarea/contentEditable focus
8. ✅ Wheel listener registered with `{ passive: false }`
9. ✅ Reading-mode Y-bias applied in `flyTo` on mobile
10. ✅ Polaroid click bypasses pan-drag via target-element check
11. ✅ Reading-mode exits on drag > 30px
12. ✅ Zoom-at-cursor uses derive-from-scratch math, no accumulation
13. ✅ Canvas CSS `top: 50%; left: 50%; transform-origin: 0 0` intact
14. ✅ Anchor refresh runs on load + resize + fonts.ready
15. ✅ `prefers-reduced-motion` skips animated flyTo but keeps direct pan
16. ✅ Fonts self-hosted with preload on critical families
17. ✅ Mobile uses `100dvh` not `100vh` for canvas wrap
18. ✅ Em styling varies intentionally by component class
