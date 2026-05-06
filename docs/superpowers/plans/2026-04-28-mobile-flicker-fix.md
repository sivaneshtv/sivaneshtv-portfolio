# Mobile Flicker Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate flickering of fixed-position overlay UI (topbar, toolbar, minimap) on mobile when panning the canvas at low zoom levels.

**Architecture:** Three root causes must be fixed together — (1) iOS native viewport zoom interfering with our canvas zoom via missing `maximum-scale=1` in the viewport meta, (2) `.canvas-wrap` sharing a compositor group with the fixed chrome because it has no own GPU layer, causing canvas repaints to invalidate chrome elements, and (3) `backdrop-filter: blur()` on chrome elements forcing per-frame backdrop resampling whenever the canvas moves. Each fix is necessary; none alone is sufficient.

**Tech Stack:** Astro (SSG), TypeScript (CanvasEngine), CSS (canvas.css, component `<style is:global>` blocks)

---

### Task 1: Block native iOS viewport zoom

**Files:**
- Modify: `src/layouts/BaseLayout.astro:21`

Without `maximum-scale=1`, iOS Safari can trigger its own viewport-level pinch zoom simultaneously with our `touchstart` canvas handler. When native viewport zoom is active, `position: fixed` elements are positioned relative to the layout viewport (not the visual viewport), causing them to visually jump. Additionally, even a 1% native zoom that snaps back creates a one-frame flash on all fixed elements.

- [ ] **Step 1: Update viewport meta**

In `src/layouts/BaseLayout.astro`, change line 21 from:
```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```
to:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
```

- [ ] **Step 2: Block multi-touch native zoom in CanvasEngine**

In `src/components/canvas/engine/CanvasEngine.ts`, the `touchstart` handler (currently around line 690) does not call `e.preventDefault()`. iOS still intercepts the initial frame of a 2-finger pinch for native zoom before our handler runs. Add the call:

Current:
```typescript
    this.wrap.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        // Cancel any active pointer pan so it doesn't fight with pinch
        this.isPanning = false;
        this.wrap.classList.remove('grabbing');
        const t1 = e.touches[0], t2 = e.touches[1];
```

Replace with:
```typescript
    this.wrap.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault(); // stop iOS native pinch-zoom from firing alongside our handler
        // Cancel any active pointer pan so it doesn't fight with pinch
        this.isPanning = false;
        this.wrap.classList.remove('grabbing');
        const t1 = e.touches[0], t2 = e.touches[1];
```

- [ ] **Step 3: Verify the handler is still `{ passive: false }`**

Scroll to the end of the `touchstart` binding. Confirm it reads:
```typescript
    }, { passive: false });
```
`e.preventDefault()` only works when the listener is not passive. If it already says `{ passive: false }`, no change needed.

- [ ] **Step 4: Commit**
```bash
git add src/layouts/BaseLayout.astro src/components/canvas/engine/CanvasEngine.ts
git commit -m "fix: block native iOS viewport zoom during canvas pinch"
```

---

### Task 2: Isolate .canvas-wrap to its own GPU compositor layer

**Files:**
- Modify: `src/styles/canvas.css:13-17`

`.canvas-wrap` is `position: fixed; overflow: hidden` with no explicit transform. Its child `.canvas` has `will-change: transform` (own GPU layer). Without its own layer, `.canvas-wrap` shares the browser's "fixed position compositor group" with the chrome elements (topbar, toolbar, minimap). When `.canvas` updates its transform, the compositor must recomposite the entire fixed group — this is what causes the chrome to flash.

Adding `transform: translateZ(0)` to `.canvas-wrap` promotes it to an isolated GPU layer. Canvas repaints stay inside that layer; the chrome elements' layers are never touched.

- [ ] **Step 1: Add layer-promotion transform to `.canvas-wrap`**

In `src/styles/canvas.css`, the `.canvas-wrap` rule currently reads:
```css
.canvas-wrap{
  position:fixed;inset:0;z-index:1;
  cursor:grab;
  overflow:hidden;
}
```

Change to:
```css
.canvas-wrap{
  position:fixed;inset:0;z-index:1;
  cursor:grab;
  overflow:hidden;
  -webkit-transform:translateZ(0);
  transform:translateZ(0);
}
```

- [ ] **Step 2: Commit**
```bash
git add src/styles/canvas.css
git commit -m "fix: promote canvas-wrap to isolated GPU layer"
```

---

### Task 3: Remove backdrop-filter and promote fixed chrome — CaseLayout

**Files:**
- Modify: `src/layouts/CaseLayout.astro` (the `<style is:global>` block, lines 70–152)

`backdrop-filter: blur()` on `.tb-logo`, `.toolbar`, and `.minimap` requires the browser to capture everything below the element, apply Gaussian blur, and use the result as the element's background — on every frame the canvas moves. Even with proper layer isolation (Task 2), backdrop-filter must read cross-layer, defeating the isolation. Removing it eliminates per-frame resampling. Opacity is bumped from `.92` to `.97` to compensate visually. GPU layer promotion (`will-change`, `backface-visibility`) is added to all fixed chrome so they each own their compositor slot.

- [ ] **Step 1: Fix `.topbar`** — add GPU promotion (it already has `translateZ(0)`)

Current:
```css
  .topbar{position:fixed;top:0;left:0;right:0;z-index:30;display:flex;justify-content:space-between;align-items:center;padding:20px 28px;pointer-events:none;-webkit-transform:translateZ(0);transform:translateZ(0)}
```
Replace with:
```css
  .topbar{position:fixed;top:0;left:0;right:0;z-index:30;display:flex;justify-content:space-between;align-items:center;padding:20px 28px;pointer-events:none;-webkit-transform:translateZ(0);transform:translateZ(0);will-change:transform;backface-visibility:hidden;-webkit-backface-visibility:hidden}
```

- [ ] **Step 2: Fix `.tb-logo`** — remove backdrop-filter, bump opacity

Current:
```css
  .tb-logo{display:flex;align-items:center;gap:10px;font-family:var(--fs);font-weight:600;font-size:14px;color:var(--ink);background:rgba(232,228,219,.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);padding:8px 12px 8px 10px;border:1px solid rgba(40,35,25,.12);box-shadow:0 4px 14px rgba(40,35,25,.08);cursor:pointer;transition:background .2s,border-color .2s;text-decoration:none}
```
Replace with:
```css
  .tb-logo{display:flex;align-items:center;gap:10px;font-family:var(--fs);font-weight:600;font-size:14px;color:var(--ink);background:rgba(232,228,219,.97);padding:8px 12px 8px 10px;border:1px solid rgba(40,35,25,.12);box-shadow:0 4px 14px rgba(40,35,25,.08);cursor:pointer;transition:background .2s,border-color .2s;text-decoration:none}
```

- [ ] **Step 3: Fix `.toolbar`** — remove backdrop-filter, bump opacity, add GPU promotion

Current:
```css
  .toolbar{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateZ(0);-webkit-transform:translateX(-50%) translateZ(0);z-index:30;display:flex;align-items:center;gap:2px;background:rgba(232,228,219,.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(40,35,25,.12);padding:6px;box-shadow:0 8px 30px rgba(40,35,25,.15),0 2px 6px rgba(40,35,25,.08)}
```
Replace with:
```css
  .toolbar{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateZ(0);-webkit-transform:translateX(-50%) translateZ(0);z-index:30;display:flex;align-items:center;gap:2px;background:rgba(232,228,219,.97);border:1px solid rgba(40,35,25,.12);padding:6px;box-shadow:0 8px 30px rgba(40,35,25,.15),0 2px 6px rgba(40,35,25,.08);will-change:transform;backface-visibility:hidden;-webkit-backface-visibility:hidden}
```

- [ ] **Step 4: Fix `.minimap`** — remove backdrop-filter, bump opacity, add GPU promotion

Current:
```css
  .minimap{position:fixed;bottom:20px;right:20px;z-index:30;width:160px;height:112px;background:rgba(232,228,219,.92);backdrop-filter:blur(12px);border:1px solid rgba(40,35,25,.15);box-shadow:0 4px 16px rgba(40,35,25,.12);overflow:hidden;cursor:pointer;-webkit-transform:translateZ(0);transform:translateZ(0)}
```
Replace with:
```css
  .minimap{position:fixed;bottom:20px;right:20px;z-index:30;width:160px;height:112px;background:rgba(232,228,219,.97);border:1px solid rgba(40,35,25,.15);box-shadow:0 4px 16px rgba(40,35,25,.12);overflow:hidden;cursor:pointer;-webkit-transform:translateZ(0);transform:translateZ(0);will-change:transform;backface-visibility:hidden;-webkit-backface-visibility:hidden}
```

- [ ] **Step 5: Fix `.mobile-hint`** — add GPU promotion

Current:
```css
  .mobile-hint{display:none;position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:25;background:#1a1a1c;color:#f5ede0;padding:10px 16px;font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;box-shadow:0 4px 16px rgba(40,35,25,.25);white-space:nowrap;opacity:0;transition:opacity .4s ease;pointer-events:none}
```
Replace with:
```css
  .mobile-hint{display:none;position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:25;background:#1a1a1c;color:#f5ede0;padding:10px 16px;font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;box-shadow:0 4px 16px rgba(40,35,25,.25);white-space:nowrap;opacity:0;transition:opacity .4s ease;pointer-events:none;will-change:transform;backface-visibility:hidden;-webkit-backface-visibility:hidden}
```

- [ ] **Step 6: Fix `.return-pill`** — add GPU promotion

Current (lines 122–132):
```css
  .return-pill{
    position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(8px);z-index:40;
```
Replace with:
```css
  .return-pill{
    position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(8px);z-index:40;
    will-change:transform;backface-visibility:hidden;-webkit-backface-visibility:hidden;
```

- [ ] **Step 7: Commit**
```bash
git add src/layouts/CaseLayout.astro
git commit -m "fix: remove backdrop-filter and promote chrome layers in CaseLayout"
```

---

### Task 4: Remove backdrop-filter and promote fixed chrome — index.astro

**Files:**
- Modify: `src/pages/index.astro` (the `<style is:global>` block, lines 282–350)

Same problem as Task 3 — the workbench page has the same chrome. Identical treatment.

- [ ] **Step 1: Fix `.topbar`** — add GPU promotion (no translateZ on this one currently)

Current:
```css
  .topbar{position:fixed;top:0;left:0;right:0;z-index:30;display:flex;justify-content:space-between;align-items:center;padding:20px 28px;pointer-events:none}
```
Replace with:
```css
  .topbar{position:fixed;top:0;left:0;right:0;z-index:30;display:flex;justify-content:space-between;align-items:center;padding:20px 28px;pointer-events:none;-webkit-transform:translateZ(0);transform:translateZ(0);will-change:transform;backface-visibility:hidden;-webkit-backface-visibility:hidden}
```

- [ ] **Step 2: Fix `.tb-logo`** — remove backdrop-filter, bump opacity

Current:
```css
  .tb-logo{display:flex;align-items:center;gap:10px;font-family:var(--fs);font-weight:600;font-size:14px;color:var(--ink);background:rgba(232,228,219,.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);padding:8px 12px 8px 10px;border:1px solid rgba(40,35,25,.12);box-shadow:0 4px 14px rgba(40,35,25,.08);cursor:pointer;transition:background .2s,border-color .2s}
```
Replace with:
```css
  .tb-logo{display:flex;align-items:center;gap:10px;font-family:var(--fs);font-weight:600;font-size:14px;color:var(--ink);background:rgba(232,228,219,.97);padding:8px 12px 8px 10px;border:1px solid rgba(40,35,25,.12);box-shadow:0 4px 14px rgba(40,35,25,.08);cursor:pointer;transition:background .2s,border-color .2s}
```

- [ ] **Step 3: Fix `.tb-status`** — remove backdrop-filter, bump opacity

Current:
```css
  .tb-status{display:flex;align-items:center;gap:14px;font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-2);background:rgba(232,228,219,.85);backdrop-filter:blur(10px);padding:10px 14px;border:1px solid rgba(40,35,25,.1)}
```
Replace with:
```css
  .tb-status{display:flex;align-items:center;gap:14px;font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-2);background:rgba(232,228,219,.97);padding:10px 14px;border:1px solid rgba(40,35,25,.1)}
```

- [ ] **Step 4: Fix `.nav-menu`** — remove backdrop-filter, bump opacity

Current:
```css
  .nav-menu{position:absolute;top:calc(100% + 6px);left:0;min-width:200px;background:rgba(232,228,219,.95);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(40,35,25,.14);padding:6px;box-shadow:0 8px 30px rgba(40,35,25,.15),0 2px 6px rgba(40,35,25,.08);opacity:0;pointer-events:none;transform:translateY(-4px);transition:opacity .2s ease,transform .2s ease;z-index:31}
```
Replace with:
```css
  .nav-menu{position:absolute;top:calc(100% + 6px);left:0;min-width:200px;background:rgba(232,228,219,.97);border:1px solid rgba(40,35,25,.14);padding:6px;box-shadow:0 8px 30px rgba(40,35,25,.15),0 2px 6px rgba(40,35,25,.08);opacity:0;pointer-events:none;transform:translateY(-4px);transition:opacity .2s ease,transform .2s ease;z-index:31}
```

- [ ] **Step 5: Fix `.toolbar`** — remove backdrop-filter, bump opacity, add GPU promotion

Current:
```css
  .toolbar{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:30;display:flex;align-items:center;gap:2px;background:rgba(232,228,219,.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(40,35,25,.12);padding:6px;box-shadow:0 8px 30px rgba(40,35,25,.15),0 2px 6px rgba(40,35,25,.08);-webkit-transform:translateX(-50%) translateZ(0);transform:translateX(-50%) translateZ(0)}
```
Replace with:
```css
  .toolbar{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:30;display:flex;align-items:center;gap:2px;background:rgba(232,228,219,.97);border:1px solid rgba(40,35,25,.12);padding:6px;box-shadow:0 8px 30px rgba(40,35,25,.15),0 2px 6px rgba(40,35,25,.08);-webkit-transform:translateX(-50%) translateZ(0);transform:translateX(-50%) translateZ(0);will-change:transform;backface-visibility:hidden;-webkit-backface-visibility:hidden}
```

- [ ] **Step 6: Fix `.minimap`** — remove backdrop-filter, bump opacity, add GPU promotion

Current:
```css
  .minimap{position:fixed;bottom:20px;right:20px;z-index:30;width:160px;height:112px;background:rgba(232,228,219,.92);backdrop-filter:blur(12px);border:1px solid rgba(40,35,25,.15);box-shadow:0 4px 16px rgba(40,35,25,.12);overflow:hidden;cursor:pointer;-webkit-transform:translateZ(0);transform:translateZ(0)}
```
Replace with:
```css
  .minimap{position:fixed;bottom:20px;right:20px;z-index:30;width:160px;height:112px;background:rgba(232,228,219,.97);border:1px solid rgba(40,35,25,.15);box-shadow:0 4px 16px rgba(40,35,25,.12);overflow:hidden;cursor:pointer;-webkit-transform:translateZ(0);transform:translateZ(0);will-change:transform;backface-visibility:hidden;-webkit-backface-visibility:hidden}
```

- [ ] **Step 7: Fix `.mobile-hint`** — add GPU promotion

Current:
```css
  .mobile-hint{display:none;position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:25;background:#1a1a1c;color:#f5ede0;padding:10px 16px;font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;box-shadow:0 4px 16px rgba(40,35,25,.25);white-space:nowrap;opacity:0;transition:opacity .4s ease;pointer-events:none}
```
Replace with:
```css
  .mobile-hint{display:none;position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:25;background:#1a1a1c;color:#f5ede0;padding:10px 16px;font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;box-shadow:0 4px 16px rgba(40,35,25,.25);white-space:nowrap;opacity:0;transition:opacity .4s ease;pointer-events:none;will-change:transform;backface-visibility:hidden;-webkit-backface-visibility:hidden}
```

- [ ] **Step 8: Commit**
```bash
git add src/pages/index.astro
git commit -m "fix: remove backdrop-filter and promote chrome layers in index"
```

---

### Task 5: Update dark-theme overrides in canvas.css

**Files:**
- Modify: `src/styles/canvas.css` (lines 147, 153, 158, 167)

The dark-theme rules override `background` on `.tb-logo`, `.toolbar`, `.minimap`, and `.tb-status`. They must match the opacity bump (`.92`→`.97`) otherwise the light-theme change has no effect when dark mode is active.

- [ ] **Step 1: Bump `.tb-logo` dark opacity**

Current (line 147):
```css
[data-theme="dark"] .tb-logo{background:rgba(30,30,32,.92);border-color:rgba(255,255,255,.08);color:var(--ink)}
```
Replace with:
```css
[data-theme="dark"] .tb-logo{background:rgba(30,30,32,.97);border-color:rgba(255,255,255,.08);color:var(--ink)}
```

- [ ] **Step 2: Bump `.toolbar` dark opacity**

Current (line 153):
```css
[data-theme="dark"] .toolbar{background:rgba(30,30,32,.92);border-color:rgba(255,255,255,.08);box-shadow:0 8px 30px rgba(0,0,0,.4)}
```
Replace with:
```css
[data-theme="dark"] .toolbar{background:rgba(30,30,32,.97);border-color:rgba(255,255,255,.08);box-shadow:0 8px 30px rgba(0,0,0,.4)}
```

- [ ] **Step 3: Bump `.minimap` dark opacity**

Current (line 158):
```css
[data-theme="dark"] .minimap{background:rgba(30,30,32,.92);border-color:rgba(255,255,255,.08);box-shadow:0 4px 16px rgba(0,0,0,.3)}
```
Replace with:
```css
[data-theme="dark"] .minimap{background:rgba(30,30,32,.97);border-color:rgba(255,255,255,.08);box-shadow:0 4px 16px rgba(0,0,0,.3)}
```

- [ ] **Step 4: Bump `.tb-status` dark opacity**

Current (line 167):
```css
[data-theme="dark"] .tb-status{background:rgba(30,30,32,.85) !important;border-color:rgba(255,255,255,.06) !important;color:var(--ink-2)}
```
Replace with:
```css
[data-theme="dark"] .tb-status{background:rgba(30,30,32,.97) !important;border-color:rgba(255,255,255,.06) !important;color:var(--ink-2)}
```

- [ ] **Step 5: Commit**
```bash
git add src/styles/canvas.css
git commit -m "fix: sync dark-theme chrome backgrounds with opacity bump"
```

---

### Task 6: Merge and push

- [ ] **Step 1: Merge portfolio-fixes to main and push**
```bash
git checkout main
git merge portfolio-fixes
git push origin main
```
