# PROTOTYPE-REFERENCE.md

**This is the single source of truth for the rebuild.**

Four HTML files in the handoff bundle contain the working prototype:

- `sivanesh-workbench.html` — the workbench homepage (6000×4200 canvas)
- `cockpit-canvas.html` — Case 01 (5000×6800 canvas)
- `fleet-canvas.html` — Case 02 (5000×6800 canvas)
- `asset-canvas.html` — Case 03 (5000×6800 canvas)

**Rule:** When this doc and any other doc conflict, this doc wins. When this doc and the prototype HTML conflict, **the prototype HTML wins** — this doc is an extract from it.

**How to use this doc:** Claude Code opens the referenced prototype file, finds the referenced line numbers, and copies the CSS/markup verbatim. Do not paraphrase. Do not improve. Do not consolidate style patterns across files without explicit instruction.

Every CSS block below is quoted from one of the four prototypes with line numbers. When in doubt, read the prototype.

---

## 1 · Tokens — the design system foundation

**Source: `portfolio-workbench.html` lines 14–36** (Cockpit/Fleet/Asset add `--ink-4` and `--paper`, and use `--fk` instead of `--fm2` for Kalam; see note at end).

```css
:root{
  --board:#e8e4db;
  --board-2:#ddd8cd;
  --board-shadow:rgba(40,35,25,.15);
  --ink:#1a1a1c;
  --ink-2:#4a4945;
  --ink-3:#7a7770;
  --ink-4:#a8a197;       /* present in case studies only; add to rebuild tokens */
  --red:#d8352a;
  --blue:#2b5fd8;
  --yellow:#f5c84a;
  --pink:#ff8fa3;
  --green:#4a9d5f;
  --purple:#9b7cd8;
  --marker-red:#e84a3f;
  --marker-blue:#3a7dd0;
  --marker-black:#2a2a2c;
  --tape:#f5e6a8;
  --tape-2:#d8d2c0;
  --paper:#fbfaf4;        /* case studies — the cream card background */
  --fs:'Inter',sans-serif;
  --fm:'JetBrains Mono',monospace;
  --fh:'Caveat',cursive;
  --fk:'Kalam',cursive;    /* Case studies use --fk; workbench uses --fm2 for the same font. Pick one and be consistent. Recommended: --fk. */
}
```

**Font loading (from every prototype):**
```html
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&family=Kalam:wght@300;400;700&display=swap" rel="stylesheet">
```

For the rebuild: self-host these four fonts (variable files for Inter + JetBrains Mono + Caveat; static for Kalam 400 & 700).

**Body base (from every prototype):**
```css
html,body{height:100%;overflow:hidden;overscroll-behavior:none}
body{
  background:var(--board);
  color:var(--ink);
  font-family:var(--fs);
  font-weight:400;
  font-size:14px;
  line-height:1.5;
  -webkit-font-smoothing:antialiased;
  user-select:none;
  -webkit-user-select:none;
  touch-action:none;
}
```

---

## 2 · Canvas system

**Canvas dimensions:**
- Workbench: **6000 × 4200**
- Case studies (all three): **5000 × 6800**

**Board background** (source: `portfolio-workbench.html` lines 54–62):

```css
.board-bg{
  position:fixed;inset:0;z-index:0;
  background:linear-gradient(135deg,var(--board),var(--board-2));
}
.board-bg::before{
  content:"";position:absolute;inset:0;opacity:.25;mix-blend-mode:multiply;pointer-events:none;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='2' seed='7'/><feColorMatrix values='0 0 0 0 .4  0 0 0 0 .37  0 0 0 0 .3  0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
/* NO ::after corner vignette. The prototype used to have one and it was removed. Do not add one. */
```

**Canvas wrap + canvas** (source: `portfolio-workbench.html` lines 66–83):

```css
.canvas-wrap{
  position:fixed;inset:0;z-index:1;
  cursor:grab;
  overflow:hidden;
}
.canvas-wrap.grabbing{cursor:grabbing}
.canvas-wrap.space-pan{cursor:grab}
.canvas-wrap.space-pan.grabbing{cursor:grabbing}

.canvas{
  position:absolute;top:50%;left:50%;      /* load-bearing: all engine math assumes this */
  width:6000px;height:4200px;              /* 5000×6800 on case studies */
  transform-origin:0 0;                    /* load-bearing */
  transition:none;
  will-change:transform;
  background-image:radial-gradient(circle at 1px 1px,rgba(40,35,25,.22) 1px,transparent 1px);
  background-size:28px 28px;
  background-position:0 0;
}
```

**Critical:** dot pattern is ONLY on `.canvas`, never on `.board-bg`. `top:50%; left:50%; transform-origin:0 0` is how the engine math works — canvas (0,0) is at screen center, tx/ty offset from there.

---

## 3 · Engine — pan, zoom, inertia, zones

**Source for workbench engine: `portfolio-workbench.html` lines 994–1540.**
**Source for case-study engine: `cockpit-canvas.html` lines 1075–1540** (fleet and asset are nearly identical).

The engine has two modes:
- **Workbench mode** (homepage): free pan/zoom, no reading mode, simpler clamp + zones
- **Reader mode** (case studies): `readingMode=true` by default, wheel scrolls down the reader, reading scale is responsive to viewport, reading mode exits on drag > 30px

### 3.1 — State variables (same on both)

```js
var scale = 0.5;              // workbench initial; resetView() overrides by viewport
var tx = 0, ty = 0;           // screen-pixel translation from canvas origin
var minScale = 0.2, maxScale = 2.4;
var vx = 0, vy = 0;           // inertia velocity
var decelerating = false;
```

### 3.2 — Clamp (IDENTICAL on both — flush-to-edge)

Source: `portfolio-workbench.html` lines 1019–1034.

```js
function clampTranslate(){
  var cw = CANVAS_W * scale, ch = CANVAS_H * scale;
  var vw = innerWidth, vh = innerHeight;
  if(cw <= vw){ tx = -cw/2; }
  else {
    var maxTX = -vw/2;
    var minTX = vw/2 - cw;
    tx = clamp(tx, minTX, maxTX);
  }
  if(ch <= vh){ ty = -ch/2; }
  else {
    var maxTY = -vh/2;
    var minTY = vh/2 - ch;
    ty = clamp(ty, minTY, maxTY);
  }
}
```

Do not modify this formula. The flush-to-edge invariant is that canvas edges never leave the viewport.

### 3.3 — Apply (same on both)

```js
function apply(){
  clampTranslate();
  canvas.style.transform = 'translate3d(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0) scale(' + scale.toFixed(4) + ')';
  zoomVal.textContent = Math.round(scale*100) + '%';
  updateMinimap();
  updateActiveZone();
}
```

### 3.4 — Zoom-at-cursor (same on both, derive-from-scratch math)

Source: workbench lines 1081–1094, case studies lines 1201–1211 — identical.

```js
function zoomAt(deltaScale, screenX, screenY){
  var newScale = clamp(scale * deltaScale, minScale, maxScale);
  if(newScale === scale) return;
  var cw = innerWidth/2, ch = innerHeight/2;
  var canvasX = (screenX - cw - tx) / scale;
  var canvasY = (screenY - ch - ty) / scale;
  tx = screenX - cw - canvasX * newScale;
  ty = screenY - ch - canvasY * newScale;
  scale = newScale;
  apply();
}
```

### 3.5 — Pan (pointer) with inertia (same on both)

Source: workbench lines 1104–1170 / case studies lines 1319–1413.

```js
function onPointerDown(e){
  var forcePan = (e.button === 1) || spaceHeld;
  if(!forcePan){
    // Ignore interactive elements for left-click panning
    var target = e.target;
    while(target && target !== canvasWrap){
      if(target.tagName === 'A' || target.classList.contains('polaroid') ||
         target.classList.contains('printout') || target.classList.contains('email') ||
         target.tagName === 'BUTTON') return;
      target = target.parentElement;
    }
    if(e.button !== 0 && e.button !== undefined) return;
  } else {
    e.preventDefault();
  }
  isPanning = true;
  decelerating = false;
  vx = 0; vy = 0;
  panStartX = e.clientX;  panStartY = e.clientY;
  panStartTX = tx;         panStartTY = ty;
  lastMoveX = e.clientX;   lastMoveY = e.clientY;
  lastMoveTime = performance.now();
  canvasWrap.classList.add('grabbing');
  canvasWrap.setPointerCapture(e.pointerId);
}

function onPointerMove(e){
  if(!isPanning) return;
  tx = panStartTX + (e.clientX - panStartX);
  ty = panStartTY + (e.clientY - panStartY);
  var now = performance.now(), dt = now - lastMoveTime;
  if(dt > 0){
    vx = (e.clientX - lastMoveX) / dt * 16;  // px-per-16ms normalization
    vy = (e.clientY - lastMoveY) / dt * 16;
  }
  lastMoveX = e.clientX; lastMoveY = e.clientY; lastMoveTime = now;

  // CASE STUDIES ONLY: exit reading mode on drag > 30px
  var dragDist = Math.hypot(e.clientX - panStartX, e.clientY - panStartY);
  if(dragDist > 30 && readingMode){
    readingMode = false;
    showFirstPanHint();
  }

  apply();
}

function onPointerUp(){
  if(!isPanning) return;
  isPanning = false;
  canvasWrap.classList.remove('grabbing');
  if(Math.hypot(vx, vy) > 2){
    decelerating = true;
    requestAnimationFrame(inertiaTick);
  }
}

function inertiaTick(){
  if(!decelerating) return;
  tx += vx; ty += vy;
  vx *= 0.92; vy *= 0.92;
  apply();
  if(Math.hypot(vx, vy) > 0.3) requestAnimationFrame(inertiaTick);
  else decelerating = false;
}
```

### 3.6 — Middle-click autoscroll suppression (same on both)

```js
canvasWrap.addEventListener('mousedown', function(e){
  if(e.button === 1) e.preventDefault();
});
canvasWrap.addEventListener('auxclick', function(e){
  if(e.button === 1) e.preventDefault();
});
```

### 3.7 — Spacebar pan mode (same on both)

```js
window.addEventListener('keydown', function(e){
  if(e.code === 'Space' && !spaceHeld){
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if(tag === 'INPUT' || tag === 'TEXTAREA') return;
    spaceHeld = true;
    canvasWrap.classList.add('space-pan');
    e.preventDefault();
  }
});
window.addEventListener('keyup', function(e){
  if(e.code === 'Space'){
    spaceHeld = false;
    canvasWrap.classList.remove('space-pan');
  }
});
```

### 3.8 — Wheel (DIFFERS between workbench and case study)

**Workbench (source: workbench lines 1204–1218):** pan by default, Ctrl/Cmd+wheel = zoom toward cursor.

```js
canvasWrap.addEventListener('wheel', function(e){
  e.preventDefault();
  if(e.ctrlKey || e.metaKey){
    var factor = Math.pow(0.9985, e.deltaY);
    zoomAt(factor, e.clientX, e.clientY);
  } else {
    tx -= e.deltaX;
    ty -= e.deltaY;
    apply();
  }
}, {passive: false});
```

**Case studies (source: cockpit lines 1453–1472):** same behaviour but reading-mode-aware (text hint shown, pan still works both in reading and explore modes).

```js
canvasWrap.addEventListener('wheel', function(e){
  e.preventDefault();
  if(e.ctrlKey || e.metaKey){
    zoomAt(Math.pow(0.9985, e.deltaY), e.clientX, e.clientY);
    return;
  }
  tx -= e.deltaX;
  ty -= e.deltaY;
  apply();
}, {passive: false});
```

Listener MUST be registered `{passive: false}` or `preventDefault()` is a no-op.

### 3.9 — Touch (two-finger pinch + one-finger pan) — same on both

Source: workbench lines 1220–1253 / cockpit lines 1474–1515.

```js
var touchState = null;
canvasWrap.addEventListener('touchstart', function(e){
  if(e.touches.length === 2){
    var t1 = e.touches[0], t2 = e.touches[1];
    var dx = t2.clientX - t1.clientX, dy = t2.clientY - t1.clientY;
    touchState = {
      mode:'pinch',
      startDist: Math.hypot(dx, dy),
      startScale: scale,
      startTX: tx, startTY: ty,
      cx:(t1.clientX+t2.clientX)/2, cy:(t1.clientY+t2.clientY)/2
    };
  }
}, {passive: false});

canvasWrap.addEventListener('touchmove', function(e){
  if(touchState && touchState.mode === 'pinch' && e.touches.length === 2){
    e.preventDefault();
    var t1 = e.touches[0], t2 = e.touches[1];
    var dx = t2.clientX - t1.clientX, dy = t2.clientY - t1.clientY;
    var dist = Math.hypot(dx, dy);
    var ratio = dist / touchState.startDist;
    var newScale = clamp(touchState.startScale * ratio, minScale, maxScale);
    var cw = innerWidth/2, ch = innerHeight/2;
    var canvasX = (touchState.cx - cw - touchState.startTX) / touchState.startScale;
    var canvasY = (touchState.cy - ch - touchState.startTY) / touchState.startScale;
    tx = touchState.cx - cw - canvasX * newScale;
    ty = touchState.cy - ch - canvasY * newScale;
    scale = newScale;
    apply();
  }
}, {passive: false});

canvasWrap.addEventListener('touchend', function(){ touchState = null; });
```

### 3.10 — Flight / goToZone (DIFFERS; case studies add Y-bias)

Source: workbench lines 1345–1384 / cockpit lines 1283–1312.

**Workbench:**
```js
function flyTo(targetCX, targetCY, targetScale, duration){
  duration = duration || 650;
  if(flightAnim) cancelAnimationFrame(flightAnim);
  decelerating = false;
  var startTX = tx, startTY = ty, startScale = scale;
  var endTX = -targetCX * targetScale;
  var endTY = -targetCY * targetScale;
  var t0 = performance.now();
  function step(now){
    var t = Math.min((now - t0) / duration, 1);
    var e = easeInOutCubic(t);
    tx = startTX + (endTX - startTX) * e;
    ty = startTY + (endTY - startTY) * e;
    scale = startScale + (targetScale - startScale) * e;
    apply();
    if(t < 1) flightAnim = requestAnimationFrame(step);
    else flightAnim = null;
  }
  flightAnim = requestAnimationFrame(step);
}

function goToZone(name){
  var z = zones[name]; if(!z) return;
  var vw = innerWidth;
  var targetScale = z.scale;
  if(vw <= 520) targetScale = z.scale * 0.55;
  else if(vw <= 820) targetScale = z.scale * 0.72;
  else if(vw <= 1100) targetScale = z.scale * 0.88;
  flyTo(z.cx, z.cy, targetScale, 700);
}
```

**Case studies — adds mobile Y-bias in flyTo:**
```js
function flyTo(targetCX, targetCY, targetScale, duration){
  duration = duration || 700;
  if(flightAnim) cancelAnimationFrame(flightAnim);
  var startTX = tx, startTY = ty, startScale = scale;
  var yBias = 0;
  if(readingMode){
    if(innerWidth <= 420)       yBias = innerHeight * 0.18;
    else if(innerWidth <= 640)  yBias = innerHeight * 0.14;
    else if(innerWidth <= 1100) yBias = innerHeight * 0.08;
  }
  var endTX = -targetCX * targetScale;
  var endTY = -targetCY * targetScale + yBias;
  var t0 = performance.now();
  function step(now){
    var t = Math.min((now - t0) / duration, 1);
    var e = easeInOutCubic(t);
    tx = startTX + (endTX - startTX) * e;
    ty = startTY + (endTY - startTY) * e;
    scale = startScale + (targetScale - startScale) * e;
    apply();
    if(t < 1) flightAnim = requestAnimationFrame(step);
    else flightAnim = null;
  }
  flightAnim = requestAnimationFrame(step);
}
```

### 3.11 — Minimap (same on both)

Source: workbench lines 1256–1319.

```js
function buildMinimap(){
  // IMPORTANT: defer one frame so layout is settled
  requestAnimationFrame(function(){
    minimapCanvas.innerHTML = '';
    var mw = minimap.clientWidth - 8;
    var mh = minimap.clientHeight - 8;
    var sx = mw / CANVAS_W;
    var sy = mh / CANVAS_H;
    var objects = canvas.querySelectorAll(
      '.sticky,.card,.polaroid,.printout,.masthead,.contact-card,.todo,.photo'
    );
    objects.forEach(function(el){
      var dot = document.createElement('div');
      dot.className = 'minimap-dot';
      if(el.classList.contains('polaroid') || el.classList.contains('printout')) dot.classList.add('work');
      dot.style.left = (el.offsetLeft * sx) + 'px';
      dot.style.top = (el.offsetTop * sy) + 'px';
      dot.style.width = Math.max(3, el.offsetWidth * sx) + 'px';
      dot.style.height = Math.max(3, el.offsetHeight * sy) + 'px';
      minimapCanvas.appendChild(dot);
    });
  });
}

function updateMinimap(){
  var mw = minimap.clientWidth - 8;
  var mh = minimap.clientHeight - 8;
  var sx = mw / CANVAS_W;
  var sy = mh / CANVAS_H;
  var cw = innerWidth/2, ch = innerHeight/2;
  var vx = (0 - cw - tx) / scale;
  var vy = (0 - ch - ty) / scale;
  var vw = innerWidth / scale;
  var vh = innerHeight / scale;
  minimapViewport.style.left = (vx * sx + 4) + 'px';
  minimapViewport.style.top = (vy * sy + 4) + 'px';
  minimapViewport.style.width = (vw * sx) + 'px';
  minimapViewport.style.height = (vh * sy) + 'px';
}

minimap.addEventListener('click', function(e){
  var rect = minimap.getBoundingClientRect();
  var mx = e.clientX - rect.left - 4;
  var my = e.clientY - rect.top - 4;
  var mw = minimap.clientWidth - 8;
  var mh = minimap.clientHeight - 8;
  var targetCanvasX = (mx / mw) * CANVAS_W;
  var targetCanvasY = (my / mh) * CANVAS_H;
  tx = -targetCanvasX * scale;
  ty = -targetCanvasY * scale;
  apply();
});
```

### 3.12 — Zones (differ per page)

**Workbench zones** (source: lines 1321–1338):
```js
var zones = {
  hello:   {cx: 2550, cy: 1900, scale: 0.60},
  about:   {cx: 1200, cy: 2100, scale: 0.55},
  work:    {cx: 4100, cy: 2200, scale: 0.55},
  howwork: {cx: 2050, cy: 3400, scale: 0.60},
  contact: {cx: 4300, cy: 3620, scale: 0.65}
};

var zoneBounds = {
  hello:   {x1: 1800, y1: 1400, x2: 3200, y2: 2100},
  about:   {x1:  750, y1: 1500, x2: 1700, y2: 2700},
  work:    {x1: 3400, y1: 1600, x2: 4800, y2: 2900},
  howwork: {x1: 1100, y1: 3000, x2: 3300, y2: 3800},
  contact: {x1: 3600, y1: 3200, x2: 4800, y2: 3850}
};
```

**Case study zones** (source: cockpit lines 1216–1228 — identical pattern on fleet/asset):
```js
var zones = {
  top:      {cx: 2500, cy: 1000, scale: 0.55},
  problem:  {cx: 2500, cy: 2300, scale: 0.55},
  solution: {cx: 2500, cy: 4200, scale: 0.55},
  outcome:  {cx: 2500, cy: 6200, scale: 0.55}
};
var zoneBounds = {
  top:      {x1:1000, y1:500,  x2:4000, y2:1800},
  problem:  {x1:1000, y1:1800, x2:4000, y2:3300},
  solution: {x1:1000, y1:3300, x2:4000, y2:5600},
  outcome:  {x1:1000, y1:5600, x2:4000, y2:6800}
};
```

These `cx` and `scale` values are overridden on load/resize by `computeReaderLayout()` (see §3.14).

### 3.13 — Reset / initial view (DIFFERS)

**Workbench (source: lines 1067–1079):** viewport-aware scale centred on the masthead.
```js
function resetView(){
  var vw = innerWidth;
  if(vw <= 520)       scale = 0.35;
  else if(vw <= 820)  scale = 0.47;
  else if(vw <= 1100) scale = 0.57;
  else                scale = 0.65;
  var cx = 2400, cy = 2000;
  tx = -cx * scale;
  ty = -cy * scale;
  apply();
}
```

**Case studies:** initial view is the reader `top` zone at reading scale. Invoked from boot after `computeReaderLayout()`.

### 3.14 — Reading-mode column sizing (case studies only)

Source: cockpit lines 1101–1163 — identical on fleet and asset.

```js
var readerWidth = 1080;    // canvas-px default
var readerLeft = 1960;     // canvas-px default
var readingScale = 0.55;

function computeReaderLayout(){
  var vw = innerWidth;

  // Column width buckets
  if(vw <= 420)       readerWidth = 580;
  else if(vw <= 640)  readerWidth = 720;
  else if(vw <= 1100) readerWidth = 900;
  else if(vw <= 1600) readerWidth = 1080;
  else                readerWidth = 1160;

  readerLeft = Math.round((CANVAS_W - readerWidth) / 2);

  // Reading zoom = fraction of viewport width the column should fill
  var desiredColumnDisplayPx;
  if(vw <= 420)      desiredColumnDisplayPx = vw * 0.94;
  else if(vw <= 640) desiredColumnDisplayPx = vw * 0.92;
  else               desiredColumnDisplayPx = vw * 0.82;
  readingScale = desiredColumnDisplayPx / readerWidth;
  readingScale = Math.max(0.3, Math.min(1.1, readingScale));

  // Padding + font-scale multiplier per viewport
  var pad, fsMult;
  if(vw <= 420){ pad = '32px 20px 48px';  fsMult = 1.45; }
  else if(vw <= 640){ pad = '44px 28px 64px';  fsMult = 1.3; }
  else if(vw <= 1100){ pad = '72px 52px 92px';  fsMult = 1.1; }
  else { pad = '100px 90px 120px';  fsMult = 1.0; }

  var r = document.getElementById('reader');
  if(r){
    r.style.setProperty('--reader-width', readerWidth + 'px');
    r.style.setProperty('--reader-left', readerLeft + 'px');
    r.style.setProperty('--reader-pad', pad);
    r.style.setProperty('--reader-fs', fsMult);
  }

  // Update zone targets to match new column center
  var centerX = readerLeft + readerWidth/2;
  zones.top.cx = centerX;       zones.top.scale = readingScale;
  zones.problem.cx = centerX;   zones.problem.scale = readingScale;
  zones.solution.cx = centerX;  zones.solution.scale = readingScale;
  zones.outcome.cx = centerX;   zones.outcome.scale = readingScale;

  // Reposition .artifact elements relative to column edges
  var columnLeft = readerLeft;
  var columnRight = readerLeft + readerWidth;
  var gapScale = (vw <= 640) ? 1.8 : 1.0;
  document.querySelectorAll('.artifact').forEach(function(el){
    var side = el.dataset.side;
    var gap = (parseInt(el.dataset.gap) || 60) * gapScale;
    var w = parseInt(el.dataset.width) || el.offsetWidth || 260;
    var newLeft = (side === 'left') ? (columnLeft - gap - w) : (columnRight + gap);
    el.style.left = newLeft + 'px';
  });
}
```

### 3.15 — refreshZoneTargets (case studies only — section-anchored Y positions)

Source: cockpit lines 1231–1278.

```js
function refreshZoneTargets(){
  var r = document.getElementById('reader');
  if(!r) return;
  var sections = r.querySelectorAll('.r-section');
  var readerTop = parseInt(getComputedStyle(r).top) || 600;
  var readerHeight = r.offsetHeight;

  // Ensure canvas is tall enough to hold reader + artifacts below
  var neededHeight = readerTop + readerHeight + 400;
  if(neededHeight > CANVAS_H){
    CANVAS_H = neededHeight;
    document.getElementById('canvas').style.height = CANVAS_H + 'px';
  }

  zones.top.cy = readerTop + 400;
  if(sections[1]) zones.problem.cy  = readerTop + sections[1].offsetTop + sections[1].offsetHeight/3;
  if(sections[3]) zones.solution.cy = readerTop + sections[3].offsetTop + sections[3].offsetHeight/4;
  if(sections[sections.length-2]){
    var outcomeEl = sections[sections.length-2];
    zones.outcome.cy = readerTop + outcomeEl.offsetTop + outcomeEl.offsetHeight/4;
  }

  // Update zone bounds
  zoneBounds.top.y2       = zones.problem.cy - 200;
  zoneBounds.problem.y1   = zones.problem.cy - 200;
  zoneBounds.problem.y2   = zones.solution.cy - 200;
  zoneBounds.solution.y1  = zones.solution.cy - 200;
  zoneBounds.solution.y2  = zones.outcome.cy - 200;
  zoneBounds.outcome.y1   = zones.outcome.cy - 200;
  zoneBounds.outcome.y2   = CANVAS_H;

  // Section-anchored artifact Y positioning
  document.querySelectorAll('[data-anchor]').forEach(function(el){
    var anchor = el.dataset.anchor;
    var offset = parseInt(el.dataset.anchorOffset) || 0;
    var idx = (anchor === 'last') ? sections.length - 1 : parseInt(anchor);
    if(isNaN(idx) || !sections[idx]) return;
    var sectTop = readerTop + sections[idx].offsetTop;
    el.style.top = (sectTop + offset) + 'px';
  });
}
```

### 3.16 — Keyboard (same pattern on both)

```js
document.addEventListener('keydown', function(e){
  if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  switch(e.key){
    case '0': case 'h': case 'H': goToZone('hello'); e.preventDefault(); break;  // or 'top' on cases
    case 'f': case 'F': fitView(); e.preventDefault(); break;
    case '+': case '=': zoomAt(1.25, innerWidth/2, innerHeight/2); e.preventDefault(); break;
    case '-': case '_': zoomAt(0.8, innerWidth/2, innerHeight/2); e.preventDefault(); break;
    case 'ArrowLeft':  tx += 80; apply(); e.preventDefault(); break;
    case 'ArrowRight': tx -= 80; apply(); e.preventDefault(); break;
    case 'ArrowUp':    ty += 80; apply(); e.preventDefault(); break;
    case 'ArrowDown':  ty -= 80; apply(); e.preventDefault(); break;
  }
});
```

Case studies additionally bind `'r'`/`'R'` to `setReadingMode(true)` and refly to the current-nearest section.

### 3.17 — Click-vs-drag disambiguation (workbench)

Source: workbench lines 1489–1504.

```js
var clickStart = null;
canvasWrap.addEventListener('pointerdown', function(e){
  clickStart = {x: e.clientX, y: e.clientY};
}, true);
canvasWrap.addEventListener('click', function(e){
  if(!clickStart) return;
  var dx = e.clientX - clickStart.x;
  var dy = e.clientY - clickStart.y;
  if(Math.hypot(dx, dy) > 6){
    // was a drag — suppress link click
    e.preventDefault();
    e.stopPropagation();
  }
  clickStart = null;
}, true);
```

### 3.18 — Clock (same on both)

```js
function updateClock(){
  var d = new Date();
  var t = d.toLocaleTimeString('en-GB', {
    hour:'2-digit', minute:'2-digit', hour12:false, timeZone:'Asia/Kolkata'
  });
  var el = document.getElementById('clock');
  if(el) el.textContent = t + ' IST';
}
updateClock(); setInterval(updateClock, 30000);
```

### 3.19 — Boot (workbench)

Source: lines 1506–1538.

```js
function boot(){
  buildMinimap();
  resetView();
  // Gentle attention pulse (suppressed if help was seen)
  setTimeout(function(){
    if(helpSeen) return;
    var startX = tx, startY = ty;
    var t0 = performance.now();
    function pulse(now){
      var t = Math.min((now - t0) / 1400, 1);
      var ease = Math.sin(t * Math.PI);
      tx = startX - 30 * ease;
      ty = startY + 12 * ease;
      apply();
      if(t < 1) requestAnimationFrame(pulse);
    }
    requestAnimationFrame(pulse);
  }, 1600);
}

if(document.readyState === 'complete') boot();
else window.addEventListener('load', boot);

window.addEventListener('resize', function(){
  apply();
  buildMinimap();
  updateMinimap();
});
```

### 3.20 — Boot (case studies)

Replaces `resetView()` with:
```js
function boot(){
  computeReaderLayout();
  refreshZoneTargets();
  buildMinimap();
  goToZone('top');  // flies to reader top
}
window.addEventListener('resize', function(){
  computeReaderLayout();
  refreshZoneTargets();
  apply();
  buildMinimap();
  updateMinimap();
});
```

---

## 4 · Artifact components

All CSS copied verbatim from prototype. Line numbers identify the source.

### 4.1 — Sticky note (workbench + case study variants)

**Workbench sticky** — source: `portfolio-workbench.html` lines 132–159:

```css
.sticky{
  position:absolute;
  width:260px;min-height:200px;
  padding:24px 22px 20px;
  font-family:var(--fh);font-weight:500;font-size:21px;line-height:1.35;color:var(--ink);
  background:var(--yellow);
  box-shadow:
    2px 4px 0 rgba(40,35,25,.05),
    4px 8px 16px rgba(40,35,25,.18),
    inset 0 0 40px rgba(255,255,255,.2);
  border-radius:1px;
}
.sticky::before{
  content:"";position:absolute;top:-8px;left:50%;transform:translateX(-50%) rotate(-3deg);
  width:80px;height:20px;background:var(--tape);opacity:.85;
  box-shadow:0 2px 4px rgba(40,35,25,.1);
}
.sticky-eyebrow{
  font-family:var(--fm);font-size:9px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;
  color:var(--ink-3);margin-bottom:8px;font-style:normal;
}
.sticky em{
  font-style:normal;color:var(--marker-red);font-weight:700;
}
.sticky.pink{background:var(--pink)}
.sticky.blue{background:#a8d0f0}
.sticky.green{background:#b5e0b5}
```

**Case-study sticky** — source: `cockpit-canvas.html` lines 233–253. Slightly smaller (200→180 min-height, 22px→20px font):

```css
.sticky{
  position:absolute;
  width:260px;min-height:180px;
  padding:22px 20px 18px;
  font-family:var(--fh);font-weight:500;font-size:20px;line-height:1.35;color:var(--ink);
  background:var(--yellow);
  box-shadow:2px 4px 0 rgba(40,35,25,.05),4px 8px 16px rgba(40,35,25,.18);
}
.sticky::before{  /* same tape as workbench */
  content:"";position:absolute;top:-8px;left:50%;transform:translateX(-50%) rotate(-3deg);
  width:80px;height:20px;background:var(--tape);opacity:.85;
  box-shadow:0 2px 4px rgba(40,35,25,.1);
}
.sticky.pink{background:#ff8fa3}
.sticky.blue{background:#a8d0f0}
.sticky.green{background:#b5e0b5}
.sticky-eyebrow{
  font-family:var(--fm);font-size:9px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;
  color:var(--ink-3);margin-bottom:8px;font-style:normal;
}
.sticky em{font-style:normal;color:var(--red);font-weight:700}  /* note: --red not --marker-red on case studies */
```

**Key:** `.sticky em` is **NOT italic** — it's just red+bold. This is intentional; the sticky is handwritten (Caveat), already informal.

**Inline sticky variants on workbench** (basketball orange sticky and manhwa cream sticky) use inline styles overriding background. See §7 for copy.

### 4.2 — Index Card — source: `portfolio-workbench.html` lines 162–191

```css
.card{
  position:absolute;
  width:420px;
  padding:28px 28px 24px;
  background:#fdf8ea;
  font-family:var(--fs);font-size:14px;line-height:1.55;color:var(--ink);
  box-shadow:
    1px 2px 0 rgba(40,35,25,.04),
    3px 6px 14px rgba(40,35,25,.15),
    8px 16px 32px rgba(40,35,25,.08);
  background-image:repeating-linear-gradient(to bottom,transparent 0,transparent 27px,rgba(43,95,216,.18) 27px,rgba(43,95,216,.18) 28px);
  background-position:0 54px;
}
.card::before{
  content:"";position:absolute;left:44px;top:0;bottom:0;width:1px;background:rgba(216,53,42,.35);
}
.card-title{
  font-family:var(--fh);font-weight:700;font-size:32px;line-height:1;color:var(--ink);
  margin-bottom:8px;letter-spacing:-.01em;
}
.card-sub{
  font-family:var(--fm);font-size:10px;letter-spacing:.16em;text-transform:uppercase;
  color:var(--ink-3);margin-bottom:18px;
}
.card-list{display:flex;flex-direction:column;gap:1px;margin-top:8px}
.card-list-row{
  display:flex;justify-content:space-between;padding:6px 0;font-size:13px;
  border-bottom:1px dashed rgba(40,35,25,.1);
}
.card-list-row:last-child{border-bottom:none}
.card-list-row span:first-child{color:var(--ink-2)}
.card-list-row span:last-child{color:var(--ink);font-weight:500}
.card em{font-style:italic;color:var(--marker-red);font-weight:600}
```

### 4.3 — Polaroid — source: `portfolio-workbench.html` lines 194–240

```css
.polaroid{
  position:absolute;
  width:320px;
  padding:16px 16px 60px;
  background:#fbfaf4;
  box-shadow:
    2px 3px 0 rgba(40,35,25,.05),
    5px 10px 22px rgba(40,35,25,.22),
    12px 20px 40px rgba(40,35,25,.1);
  cursor:pointer;
  transition:transform .35s cubic-bezier(.22,1,.36,1),box-shadow .35s;
  display:block;
}
.polaroid:hover{
  transform:translateY(-8px) rotate(0deg) !important;  /* nukes the instance rotation */
  box-shadow:
    2px 3px 0 rgba(40,35,25,.05),
    8px 16px 30px rgba(40,35,25,.28),
    20px 28px 60px rgba(40,35,25,.15);
  z-index:50;
}
.polaroid::before{
  content:"";position:absolute;top:-10px;left:20%;width:60px;height:22px;
  background:var(--tape);opacity:.85;transform:rotate(-6deg);
  box-shadow:0 2px 5px rgba(40,35,25,.12);
}
.polaroid::after{
  content:"";position:absolute;top:-8px;right:18%;width:50px;height:20px;
  background:var(--tape-2);opacity:.75;transform:rotate(4deg);
  box-shadow:0 2px 4px rgba(40,35,25,.1);
}
.polaroid-img{
  aspect-ratio:4/3;background:var(--board-2);
  display:flex;align-items:center;justify-content:center;
  position:relative;overflow:hidden;
  margin-bottom:14px;
}
.polaroid-img svg{width:100%;height:100%}
.polaroid-caption{
  font-family:var(--fh);font-weight:700;font-size:24px;line-height:1.1;color:var(--ink);
  text-align:center;
}
.polaroid-caption em{font-style:italic;color:var(--marker-red)}
.polaroid-meta{
  font-family:var(--fm);font-size:9px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--ink-3);text-align:center;margin-top:4px;
}
```

**Hover uses `!important` rotate(0deg)** to force the rotation away regardless of the inline per-polaroid rotation. Keep that `!important` — anything else fights the inline style.

### 4.4 — Printout (workbench + case study)

**Workbench printout** — source: lines 243–275 — has 2 tape strips and hover:
```css
.printout{
  position:absolute;
  width:460px;
  padding:12px;
  background:#fbfaf4;
  box-shadow:
    2px 3px 0 rgba(40,35,25,.05),
    5px 10px 22px rgba(40,35,25,.22);
  cursor:pointer;
  transition:transform .35s cubic-bezier(.22,1,.36,1);
}
.printout:hover{transform:rotate(0) translateY(-4px) !important;z-index:50}
.printout::before{
  content:"";position:absolute;top:-12px;left:30%;width:70px;height:24px;
  background:var(--tape);opacity:.85;transform:rotate(-4deg);
  box-shadow:0 2px 5px rgba(40,35,25,.12);
}
.printout-head{
  display:flex;justify-content:space-between;align-items:center;
  padding:4px 4px 10px;border-bottom:1px dashed rgba(40,35,25,.15);
  margin-bottom:10px;
}
.printout-dots{display:flex;gap:5px}
.printout-dots span{width:9px;height:9px;border-radius:50%;background:rgba(40,35,25,.2)}
.printout-url{font-family:var(--fm);font-size:9px;color:var(--ink-3);letter-spacing:.1em}
.printout-frame{aspect-ratio:16/10;background:var(--board);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}
.printout-frame svg{width:100%;height:100%}
.printout-label{
  margin-top:10px;font-family:var(--fh);font-weight:700;font-size:20px;color:var(--ink);
  display:flex;justify-content:space-between;align-items:baseline;
}
.printout-label em{font-style:italic;color:var(--marker-red)}
.printout-label small{font-family:var(--fm);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);font-weight:normal}
```

**Case-study printout** — source: cockpit lines 316–341. Same pattern but slightly smaller label (18px vs 20px), no hover transform (printouts are static in case studies).

### 4.5 — Marker (DIFFERS between workbench and case study)

**Workbench** — source: lines 278–289:
```css
.marker{
  position:absolute;
  font-family:var(--fh);font-weight:700;
  line-height:1.1;
  pointer-events:none;
}
.marker.sm{font-size:24px}
.marker.md{font-size:38px}
.marker.lg{font-size:54px}
.marker.red{color:var(--marker-red)}
.marker.blue{color:var(--marker-blue)}
.marker.black{color:var(--marker-black)}
```

**Case studies** — source: cockpit lines 343–348. Smaller sizes:
```css
.marker{
  position:absolute;
  font-family:var(--fh);font-weight:700;line-height:1.1;pointer-events:none;
}
.marker.sm{font-size:22px}.marker.md{font-size:34px}.marker.lg{font-size:48px}
.marker.red{color:var(--marker-red)}.marker.blue{color:var(--marker-blue)}.marker.black{color:var(--ink)}
```

Note: `.marker.black` is `--marker-black` on workbench but `--ink` on case studies. Both are dark greys.

### 4.6 — Contact card — source: `portfolio-workbench.html` lines 292–324

```css
.contact-card{
  position:absolute;
  width:380px;
  padding:32px 30px;
  background:#1a1a1c;
  color:#f5ede0;
  box-shadow:
    2px 3px 0 rgba(40,35,25,.08),
    6px 12px 28px rgba(40,35,25,.3);
  transform:rotate(2deg);
}
.contact-card::before{
  content:"";position:absolute;top:-10px;left:40%;width:70px;height:22px;
  background:var(--tape);opacity:.85;transform:rotate(3deg);
  box-shadow:0 2px 5px rgba(40,35,25,.15);
}
.contact-card h3{
  font-family:var(--fh);font-weight:700;font-size:36px;line-height:1;
  margin-bottom:14px;letter-spacing:-.02em;
}
.contact-card h3 em{font-style:italic;color:var(--marker-red)}
.contact-card p{font-size:13px;line-height:1.55;opacity:.85;margin-bottom:18px}
.contact-card .email{
  display:flex;justify-content:space-between;align-items:center;
  padding:14px 16px;background:rgba(255,240,200,.06);border:1px dashed rgba(255,240,200,.3);
  font-family:var(--fm);font-size:13px;margin-bottom:14px;
  transition:background .25s,border-color .25s;
}
.contact-card .email:hover{background:rgba(216,53,42,.12);border-color:var(--marker-red)}
.contact-card .email .arr{color:var(--marker-red);font-size:18px}
.contact-card .socials{
  display:flex;gap:18px;
  font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;opacity:.8;
}
.contact-card .socials a{
  border-bottom:1px solid rgba(255,240,200,.2);padding-bottom:2px;
  transition:color .25s,border-color .25s;
}
.contact-card .socials a:hover{color:var(--marker-red);border-color:var(--marker-red)}
```

**Key:** contact card is DARK (`#1a1a1c` bg, cream text). The email button is transparent with dashed border, not solid.

### 4.7 — Photo frame — source: `portfolio-workbench.html` lines 327–351

```css
.photo{
  position:absolute;
  width:180px;height:180px;
  padding:10px;background:#fbfaf4;
  box-shadow:
    2px 3px 0 rgba(40,35,25,.05),
    4px 8px 18px rgba(40,35,25,.22);
  transform:rotate(-4deg);     /* default tilt; override inline */
}
.photo::before{
  content:"";position:absolute;top:-12px;left:50%;transform:translateX(-50%) rotate(-3deg);
  width:80px;height:22px;background:var(--tape);opacity:.85;
  box-shadow:0 2px 4px rgba(40,35,25,.12);
}
.photo-inner{
  width:100%;height:100%;
  background:linear-gradient(135deg,#c6a87a,#8a6d4a);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--fh);font-weight:700;font-size:72px;color:#fbfaf4;
}
.photo-caption{
  position:absolute;bottom:-30px;left:0;right:0;text-align:center;
  font-family:var(--fh);font-weight:500;font-size:18px;color:var(--ink-2);
  transform:rotate(1deg);
}
```

### 4.8 — Todo list — source: `portfolio-workbench.html` lines 354–382

```css
.todo{
  position:absolute;
  width:320px;
  padding:24px 24px 20px;
  background:#fdf8ea;
  box-shadow:
    1px 2px 0 rgba(40,35,25,.04),
    3px 6px 14px rgba(40,35,25,.18);
  transform:rotate(1.5deg);
}
.todo-title{
  font-family:var(--fh);font-weight:700;font-size:28px;color:var(--ink);
  margin-bottom:4px;
}
.todo-title em{font-style:italic;color:var(--marker-red)}
.todo-sub{
  font-family:var(--fm);font-size:9px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--ink-3);margin-bottom:16px;
}
.todo-row{
  display:flex;gap:10px;align-items:baseline;
  padding:7px 0;
  font-family:var(--fm2);font-size:18px;line-height:1.3;color:var(--ink);  /* Kalam */
  border-bottom:1px dotted rgba(40,35,25,.15);
}
.todo-row:last-child{border-bottom:none}
.todo-row.done .todo-txt{
  text-decoration:line-through;
  text-decoration-color:var(--marker-red);
  text-decoration-thickness:2px;
  color:var(--ink-3);
}
.todo-check{
  flex-shrink:0;width:18px;height:18px;border:2px solid var(--ink);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--fh);color:var(--marker-red);font-size:26px;line-height:.6;font-weight:700;
}
.todo-row.done .todo-check::after{content:"✗"}   /* the signature ✗ in red Caveat, not ✓ */
```

### 4.9 — Zone label — source: `portfolio-workbench.html` lines 385–394

```css
.zone-label{
  position:absolute;
  font-family:var(--fh);font-weight:700;   /* Caveat — handwritten backdrop */
  color:rgba(40,35,25,.13);
  letter-spacing:-.03em;
  line-height:.9;
  pointer-events:none;
  user-select:none;
}
.zone-label em{font-style:italic}
```

### 4.10 — Masthead — source: `portfolio-workbench.html` lines 90–123

```css
.masthead{
  position:absolute;
  left:2100px;top:1600px;
  width:900px;
  transform:rotate(-1deg);
}
.mh-eyebrow{
  font-family:var(--fh);font-weight:500;font-size:28px;color:var(--marker-red);
  transform:rotate(-2deg);display:inline-block;margin-bottom:4px;
}
.mh-title{
  font-family:var(--fs);font-weight:700;font-size:96px;line-height:.95;letter-spacing:-.035em;
  color:var(--ink);margin-bottom:24px;
}
.mh-title em{
  font-style:italic;font-family:var(--fh);font-weight:700;font-size:1.05em;
  color:var(--marker-red);display:inline-block;transform:translateY(6px);
}
.mh-title .strike{position:relative;display:inline-block}
.mh-title .strike::after{
  content:"";position:absolute;left:-4%;right:-4%;top:48%;height:8px;
  background:var(--marker-red);transform:skewY(-3deg);opacity:.85;
  border-radius:2px;
}
.mh-sub{
  font-family:var(--fm2);font-weight:400;font-size:22px;line-height:1.45;
  color:var(--ink-2);max-width:640px;
}
.mh-sub em{
  font-style:normal;color:var(--marker-red);font-weight:700;
  background:rgba(245,200,74,.5);padding:0 4px;transform:skewX(-5deg);display:inline-block;
}
```

Markup:
```html
<div class="masthead" id="obj-masthead">
  <span class="mh-eyebrow">hey, I'm —</span>
  <h1 class="mh-title">Sivanesh <em>TV</em>,<br>a designer<br>who <span class="strike">talks</span> <em>ships.</em></h1>
  <p class="mh-sub">Product design for <em>critical operations</em> — drone autonomy, fleet tools, interfaces where a wrong tap costs more than time. Based in Pune · open to briefs.</p>
</div>
```

### 4.11 — Principle card (case studies only) — source: `cockpit-canvas.html` lines 256–285

```css
.principle{
  position:absolute;width:380px;padding:32px 32px 28px;
  background:var(--paper);
  box-shadow:3px 5px 0 rgba(40,35,25,.06), 6px 14px 28px rgba(40,35,25,.2);
  border:1px solid rgba(40,35,25,.08);
}
.principle::before{
  content:"";position:absolute;top:-12px;right:10%;
  width:90px;height:22px;background:var(--tape);opacity:.85;
  transform:rotate(3deg);
  box-shadow:0 2px 6px rgba(40,35,25,.1);
}
.principle-lbl{
  font-family:var(--fm);font-size:9px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;
  color:var(--red);margin-bottom:14px;display:flex;align-items:center;gap:8px;
}
.principle-lbl::before{content:"◆";font-size:11px}
.principle-title{
  font-family:var(--fs);font-weight:700;font-size:26px;line-height:1.15;letter-spacing:-.02em;
  color:var(--ink);margin-bottom:10px;
}
.principle-title em{font-style:italic;color:var(--red)}
.principle-body{
  font-family:var(--fs);font-size:13px;line-height:1.55;color:var(--ink-2);margin-bottom:14px;
}
.principle-body em{font-style:italic;color:var(--ink)}   /* body em is ink, not red */
.principle-attr{
  font-family:var(--fh);font-weight:600;font-size:17px;color:var(--ink-3);
  padding-top:12px;border-top:1px dashed rgba(40,35,25,.18);
}
```

Markup:
```html
<div class="principle artifact" data-anchor="2" data-anchor-offset="20" data-side="right" data-gap="80" data-width="380" style="transform:rotate(1.5deg)">
  <div class="principle-lbl">the interaction rule every tool obeys</div>
  <div class="principle-title"><em>Push</em> or <em>Overlay.</em> Every tool picks one.</div>
  <div class="principle-body">Tools that need ambient awareness...</div>
  <div class="principle-attr">— the IA of a complex cockpit</div>
</div>
```

### 4.12 — Context card (Fleet only — asset uses class but CSS missing!) — source: `fleet-canvas.html` lines 288–308

```css
.context-card{
  position:absolute;width:380px;padding:28px;
  background:#1a1a1c;color:#f5ede0;
  box-shadow:3px 5px 0 rgba(40,35,25,.1), 6px 14px 28px rgba(40,35,25,.25);
}
.context-card::before{
  content:"";position:absolute;top:-10px;left:12%;width:80px;height:20px;
  background:var(--tape);opacity:.85;transform:rotate(-3deg);
}
.context-lbl{
  font-family:var(--fm);font-size:9px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;
  color:var(--red);margin-bottom:14px;
}
.context-title{
  font-family:var(--fs);font-weight:600;font-size:19px;line-height:1.3;color:#fdf8ea;margin-bottom:12px;
}
.context-title em{font-style:italic;color:var(--red)}
.context-body{
  font-family:var(--fs);font-size:12px;line-height:1.6;color:rgba(253,248,234,.75);
}
.context-body em{color:#fdf8ea;font-style:italic}
```

**Asset prototype latent bug:** asset-canvas.html uses `class="context-card"` at line 779 but does not define the CSS. The context card on asset renders unstyled in the prototype. In the rebuild, **add this CSS to asset too** — it's the intent. The card should look the same on both.

### 4.13 — Cut card (Cockpit + Asset only) — source: `cockpit-canvas.html` lines 288–314

"What didn't ship" artifact. Paper card with a red `CUT` stamp.

```css
.cut{
  position:absolute;width:320px;padding:20px;
  background:var(--paper);
  box-shadow:2px 3px 0 rgba(40,35,25,.04), 4px 8px 18px rgba(40,35,25,.15);
  border:1px solid rgba(40,35,25,.1);
}
.cut::before{
  content:"";position:absolute;top:-8px;left:15%;width:70px;height:18px;
  background:var(--tape-2);opacity:.8;transform:rotate(-4deg);
}
.cut-hd{
  display:flex;align-items:center;gap:10px;margin-bottom:12px;
  padding-bottom:10px;border-bottom:1px dashed rgba(40,35,25,.15);
}
.cut-stamp{
  font-family:var(--fs);font-weight:700;font-size:10px;letter-spacing:.2em;text-transform:uppercase;
  color:var(--red);border:1.5px solid var(--red);padding:4px 8px;
  transform:rotate(-2deg);
}
.cut-meta{font-family:var(--fm);font-size:9px;letter-spacing:.1em;color:var(--ink-3);flex:1}
.cut-title{
  font-family:var(--fs);font-weight:600;font-size:15px;color:var(--ink);margin-bottom:6px;
}
.cut-body{
  font-family:var(--fs);font-size:12px;line-height:1.55;color:var(--ink-2);
}
.cut-body em{font-style:italic;color:var(--ink)}
```

### 4.14 — Diagram (case studies) — source: `cockpit-canvas.html` lines 350–365

```css
.diagram{
  position:absolute;padding:24px;background:var(--paper);
  box-shadow:2px 3px 0 rgba(40,35,25,.04),4px 8px 20px rgba(40,35,25,.18);
}
.diagram::before{
  content:"";position:absolute;top:-10px;left:40%;width:60px;height:20px;
  background:var(--tape);opacity:.85;transform:rotate(-3deg);
}
.diagram-title{
  font-family:var(--fh);font-weight:700;font-size:22px;color:var(--ink);
  margin-bottom:4px;
}
.diagram-sub{
  font-family:var(--fm);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);margin-bottom:16px;
}
.diagram svg{display:block}
```

---

## 5 · Reader column components (case studies only)

**Source: `cockpit-canvas.html` lines 76–227.**

### 5.1 — `.reader` (the paper sheet itself)

```css
.reader{
  position:absolute;
  left:var(--reader-left,1400px);
  top:600px;
  width:var(--reader-width,2200px);                 /* DEFAULT; overridden by JS */
  padding:var(--reader-pad,120px 160px 140px);
  font-size:calc(16px * var(--reader-fs, 1));
  background:var(--paper);
  box-shadow:
    2px 4px 0 rgba(40,35,25,.04),
    8px 16px 40px rgba(40,35,25,.18),
    20px 32px 80px rgba(40,35,25,.12);
}
.reader::before{
  content:"";position:absolute;top:-14px;left:50%;transform:translateX(-50%) rotate(-2deg);
  width:120px;height:26px;background:var(--tape);opacity:.85;
  box-shadow:0 2px 6px rgba(40,35,25,.12);
}
.reader::after{
  content:"";position:absolute;bottom:-14px;right:10%;transform:rotate(3deg);
  width:80px;height:22px;background:var(--tape-2);opacity:.85;
  box-shadow:0 2px 6px rgba(40,35,25,.1);
}
```

**Note:** the default `var(--reader-width,2200px)` is the fallback. `computeReaderLayout()` sets it to `580/720/900/1080/1160px` based on viewport. The 2200 default is only seen if JS doesn't run.

### 5.2 — `.r-back`, `.r-eyebrow`, `.r-title`, `.r-sub`

```css
.r-back{
  display:inline-flex;align-items:center;gap:8px;
  font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);
  margin-bottom:36px;transition:color .25s;
}
.r-back::before{content:"←";transition:transform .25s}
.r-back:hover{color:var(--red)}
.r-back:hover::before{transform:translateX(-3px)}

.r-eyebrow{
  font-family:var(--fh);font-weight:500;font-size:calc(24px * var(--reader-fs, 1));color:var(--red);
  transform:rotate(-1deg);display:inline-block;margin-bottom:4px;
}
.r-title{
  font-family:var(--fs);font-weight:700;font-size:calc(84px * var(--reader-fs, 1));line-height:.95;letter-spacing:-.04em;
  color:var(--ink);margin-bottom:24px;
}
.r-title em{
  font-family:var(--fh);font-weight:700;font-style:italic;color:var(--red);
  display:inline-block;transform:translateY(6px);font-size:1.05em;
}
.r-sub{
  font-family:var(--fk);font-weight:400;font-size:calc(24px * var(--reader-fs, 1));line-height:1.45;color:var(--ink-2);
  margin-bottom:40px;max-width:720px;
}
```

### 5.3 — `.r-meta`

```css
.r-meta{
  display:grid;grid-template-columns:repeat(4,1fr);gap:0;
  padding:18px 0;margin-bottom:60px;
  border-top:1px dashed rgba(40,35,25,.2);
  border-bottom:1px dashed rgba(40,35,25,.2);
}
.r-meta-item{padding:4px 16px;border-left:1px dashed rgba(40,35,25,.15)}
.r-meta-item:first-child{border-left:none;padding-left:0}
.r-meta-k{font-family:var(--fm);font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-3);margin-bottom:6px}
.r-meta-v{font-family:var(--fs);font-size:13px;color:var(--ink);font-weight:500}
```

### 5.4 — `.r-section`, `.r-section-lbl`, `.r-h2`, `.r-lead`, `.r-body`

```css
.r-section{margin-bottom:72px}
.r-section:last-child{margin-bottom:0}

.r-section-lbl{
  display:flex;align-items:center;gap:12px;
  font-family:var(--fm);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--red);
  margin-bottom:14px;
}
.r-section-lbl::before{content:"";width:20px;height:1px;background:var(--red)}
.r-section-lbl .num{color:var(--ink-3);margin-left:auto;font-size:9px}

.r-h2{
  font-family:var(--fs);font-weight:700;font-size:calc(36px * var(--reader-fs, 1));line-height:1.15;letter-spacing:-.025em;
  color:var(--ink);margin-bottom:20px;max-width:680px;
}
.r-h2 em{font-style:italic;color:var(--red);font-weight:700}

.r-lead{
  font-family:var(--fs);font-weight:400;font-size:calc(21px * var(--reader-fs, 1));line-height:1.55;color:var(--ink);
  margin-bottom:24px;max-width:680px;
}
.r-lead em{font-style:italic;color:var(--red)}

.r-body p{
  font-family:var(--fs);font-size:calc(16px * var(--reader-fs, 1));line-height:1.75;color:var(--ink-2);
  margin-bottom:18px;max-width:680px;
}
.r-body p:last-child{margin-bottom:0}
.r-body em{font-style:italic;color:var(--ink)}          /* body em = calm ink, NOT red */
.r-body strong{color:var(--ink);font-weight:600}
```

### 5.5 — `.r-callout` (yellow)

```css
.r-callout{
  margin:24px 0;padding:20px 24px;
  background:rgba(245,200,74,.18);
  border-left:3px solid var(--yellow);
  position:relative;
}
.r-callout::before{
  content:"the hard part";position:absolute;top:-9px;left:16px;
  font-family:var(--fm);font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-3);
  background:var(--paper);padding:0 8px;
}
.r-callout p{
  font-family:var(--fk);font-weight:400;font-size:17px;line-height:1.55;color:var(--ink);
  margin:0;max-width:none;
}
.r-callout p em{color:var(--red)}
```

Note the hardcoded `"the hard part"` pseudo-label. In rebuild, make it a prop/slot so different callouts can have different labels.

### 5.6 — `.r-pullquote`

```css
.r-pullquote{
  margin:40px 0;padding:24px 0;
  font-family:var(--fh);font-weight:600;font-size:calc(38px * var(--reader-fs, 1));line-height:1.15;letter-spacing:-.01em;color:var(--ink);
  border-top:1px solid rgba(40,35,25,.15);
  border-bottom:1px solid rgba(40,35,25,.15);
  max-width:680px;
}
.r-pullquote em{color:var(--red);font-style:italic}
```

### 5.7 — `.r-margin-ref`

```css
.r-margin-ref{
  display:inline-flex;align-items:center;gap:6px;
  font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--red);
  margin-top:12px;cursor:pointer;
  border-bottom:1px dashed var(--red);padding-bottom:2px;
  transition:color .25s;
}
.r-margin-ref:hover{color:var(--ink)}
```

### 5.8 — `.r-hr`

```css
.r-hr{border:none;border-top:1px dashed rgba(40,35,25,.25);margin:48px 0}
```

### 5.9 — `.r-outcome`

```css
.r-outcome{
  display:grid;grid-template-columns:1fr 1fr 1fr;gap:28px;
  margin:32px 0;padding:28px 0;
  border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);
}
.r-outcome-item{display:flex;flex-direction:column;gap:6px}
.r-outcome-n{
  font-family:var(--fh);font-weight:700;font-size:56px;line-height:.9;color:var(--red);letter-spacing:-.02em;
}
.r-outcome-l{font-family:var(--fm);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-3)}
.r-outcome-d{font-family:var(--fs);font-size:13px;line-height:1.55;color:var(--ink-2)}
```

### 5.10 — `.r-end`

```css
.r-end{
  margin-top:80px;padding-top:36px;border-top:2px solid var(--ink);
  display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:24px;
}
.r-end-note{font-family:var(--fm);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)}
.r-end-next{
  font-family:var(--fh);font-weight:700;font-size:26px;color:var(--red);
  border-bottom:2px solid var(--red);padding-bottom:4px;
  transition:transform .3s;
}
.r-end-next:hover{transform:translate(4px,-4px)}
```

### 5.11 — `.img-slot` — source: `cockpit-canvas.html` lines 430–476

The image placeholder (this is the component the src build got wrong — it's a placeholder, not an image wrapper).

```css
.img-slot{
  margin:32px 0 36px;
  position:relative;
  width:100%;
  background:var(--board-2);
  border:1.5px dashed rgba(40,35,25,.2);
  display:flex;flex-direction:column;
  overflow:hidden;
}
.img-slot.hero{aspect-ratio:16/10}
.img-slot.wide{aspect-ratio:16/9}
.img-slot.square{aspect-ratio:4/3}
.img-slot.tall{aspect-ratio:3/4;max-height:640px}
.img-slot.split{
  aspect-ratio:16/8;background:transparent;border:none;
  display:grid;grid-template-columns:1fr 1fr;gap:16px;
}
.img-slot.split .is-half{
  aspect-ratio:16/12;background:var(--board-2);
  border:1.5px dashed rgba(40,35,25,.2);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
  position:relative;padding:20px;
}

.img-slot-inner{
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  padding:32px;text-align:center;
}
.img-slot-label{
  font-family:var(--fm);font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--red);
  display:flex;align-items:center;gap:8px;
}
.img-slot-label::before{content:"◈";font-size:11px}
.img-slot-title{
  font-family:var(--fh);font-weight:700;font-size:28px;line-height:1.1;color:var(--ink-2);
}
.img-slot-desc{
  font-family:var(--fs);font-size:12px;line-height:1.55;color:var(--ink-3);max-width:360px;
}
.img-slot-dims{
  font-family:var(--fm);font-size:9px;letter-spacing:.14em;color:var(--ink-4);
  padding:4px 10px;background:rgba(40,35,25,.05);border:1px solid rgba(40,35,25,.1);
  margin-top:4px;
}
.img-slot-cap{
  padding:10px 16px;background:var(--paper);border-top:1.5px dashed rgba(40,35,25,.2);
  font-family:var(--fm);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);
  display:flex;justify-content:space-between;align-items:center;
}
.img-slot-cap span:last-child{color:var(--red)}
.img-slot.split .img-slot-title{font-size:22px}
.img-slot.split .img-slot-desc{font-size:11px}
```

Markup pattern:
```html
<figure class="img-slot hero">
  <div class="img-slot-inner">
    <div class="img-slot-label">Image slot 01 · Hero shot</div>
    <div class="img-slot-title">Full Cockpit View 2.0 interface</div>
    <div class="img-slot-desc">A clean screenshot of the live UI — map, video feed, mission panel, system controls all visible. The "this is what it is" moment.</div>
    <div class="img-slot-dims">16 : 10 · ideally 2400 × 1500 px</div>
  </div>
  <div class="img-slot-cap"><span>Cockpit View 2.0 — in-flight, live telemetry</span><span>the interface</span></div>
</figure>
```

`.img-slot.split` variant markup:
```html
<figure class="img-slot split">
  <div class="is-half">
    <div class="img-slot-label">Image slot 06a · Before</div>
    <div class="img-slot-title">v1 layout</div>
    <div class="img-slot-desc">Old Cockpit screenshot...</div>
    <div class="img-slot-dims">~1200 × 900 px</div>
  </div>
  <div class="is-half">...</div>
</figure>
```

---

## 6 · UI chrome (topbar, toolbar, minimap, help, mobile hint)

**Source: `portfolio-workbench.html` lines 400–594.** Case studies use the same chrome with minor differences (see §6.7).

### 6.1 — Topbar

```css
.topbar{
  position:fixed;top:0;left:0;right:0;z-index:30;
  display:flex;justify-content:space-between;align-items:center;
  padding:20px 28px;pointer-events:none;
}
.topbar > *{pointer-events:auto}

.tb-logo-wrap{position:relative}
.tb-logo{
  display:flex;align-items:center;gap:10px;
  font-family:var(--fs);font-weight:600;font-size:14px;color:var(--ink);
  background:rgba(232,228,219,.92);
  backdrop-filter:blur(14px);
  -webkit-backdrop-filter:blur(14px);
  padding:8px 12px 8px 10px;
  border:1px solid rgba(40,35,25,.12);
  box-shadow:0 4px 14px rgba(40,35,25,.08);
  cursor:pointer;transition:background .2s,border-color .2s;
}
.tb-logo:hover{background:rgba(232,228,219,1);border-color:rgba(40,35,25,.25)}
.tb-logo[aria-expanded="true"]{background:rgba(232,228,219,1);border-color:rgba(40,35,25,.3)}
.tb-logo[aria-expanded="true"] .menu-chev{transform:rotate(180deg)}
.tb-logo-sub{color:var(--ink-3);font-weight:400;font-size:12px}

.menu-ic{display:flex;flex-direction:column;gap:3px;width:14px}
.menu-ic span{display:block;height:1.5px;background:currentColor;border-radius:1px}
.menu-ic span:nth-child(1){width:100%}
.menu-ic span:nth-child(2){width:65%}
.menu-ic span:nth-child(3){width:80%}
.menu-chev{font-size:9px;color:currentColor;opacity:.65;transition:transform .25s;margin-left:4px}

.tb-status{
  display:flex;align-items:center;gap:14px;
  font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-2);
  background:rgba(232,228,219,.85);
  backdrop-filter:blur(10px);
  padding:10px 14px;
  border:1px solid rgba(40,35,25,.1);
}
.tb-status .avail{display:flex;align-items:center;gap:6px}
.tb-status .avail-dot{
  width:6px;height:6px;background:#4a9d5f;border-radius:50%;
  animation:pulse 2.4s infinite ease-in-out;
}
@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:.6}}
.tb-status .sep{color:rgba(40,35,25,.3)}
```

### 6.2 — Nav menu dropdown (workbench)

```css
.nav-menu{
  position:absolute;top:calc(100% + 6px);left:0;
  min-width:200px;
  background:rgba(232,228,219,.95);
  backdrop-filter:blur(14px);
  -webkit-backdrop-filter:blur(14px);
  border:1px solid rgba(40,35,25,.14);
  padding:6px;
  box-shadow:0 8px 30px rgba(40,35,25,.15), 0 2px 6px rgba(40,35,25,.08);
  opacity:0;pointer-events:none;
  transform:translateY(-4px);
  transition:opacity .2s ease, transform .2s ease;
  z-index:31;
}
.nav-menu.on{opacity:1;pointer-events:auto;transform:translateY(0)}
.nav-row{
  display:flex;align-items:center;gap:12px;width:100%;text-align:left;
  padding:10px 14px;border-radius:2px;
  font-family:var(--fs);font-size:13px;font-weight:500;color:var(--ink-2);
  transition:background .18s, color .18s;
}
.nav-row:hover{background:rgba(40,35,25,.08);color:var(--ink)}
.nav-row .nav-ic{display:inline-flex;align-items:center;justify-content:center;width:14px;color:var(--ink-3);transition:color .18s}
.nav-row:hover .nav-ic{color:var(--marker-red)}
.nav-row .nav-name{flex:1;line-height:1}
.nav-row .nav-ar{font-family:var(--fm);font-size:11px;color:var(--ink-4);transition:color .18s, transform .2s}
.nav-row:hover .nav-ar{color:var(--marker-red);transform:translate(2px,-2px)}
```

### 6.3 — Toolbar (zoom controls)

```css
.toolbar{
  position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:30;
  display:flex;align-items:center;gap:2px;
  background:rgba(232,228,219,.92);
  backdrop-filter:blur(14px);
  -webkit-backdrop-filter:blur(14px);
  border:1px solid rgba(40,35,25,.12);
  padding:6px;
  box-shadow:0 8px 30px rgba(40,35,25,.15), 0 2px 6px rgba(40,35,25,.08);
}
.tb-divider{width:1px;height:22px;background:rgba(40,35,25,.15);margin:0 4px;flex-shrink:0}
.tb-btn{
  display:flex;align-items:center;justify-content:center;
  width:36px;height:36px;
  font-family:var(--fm);font-size:13px;color:var(--ink-2);
  transition:background .2s,color .2s;
  border-radius:2px;
}
.tb-btn:hover{background:rgba(40,35,25,.08);color:var(--ink)}
.tb-btn svg{display:block}
.tb-zoom{
  font-family:var(--fm);font-size:11px;letter-spacing:.08em;color:var(--ink-2);
  padding:0 12px;min-width:58px;text-align:center;
}
```

### 6.4 — Minimap

```css
.minimap{
  position:fixed;bottom:20px;right:20px;z-index:30;
  width:160px;height:112px;
  background:rgba(232,228,219,.92);
  backdrop-filter:blur(12px);
  border:1px solid rgba(40,35,25,.15);
  box-shadow:0 4px 16px rgba(40,35,25,.12);
  overflow:hidden;
  cursor:pointer;
}
.minimap-canvas{position:absolute;inset:4px;background:transparent}
.minimap-dot{position:absolute;background:var(--ink);border-radius:1px;opacity:.55}
.minimap-dot.work{background:var(--marker-red);opacity:.75}
.minimap-dot.note{background:var(--ink-2)}
.minimap-viewport{
  position:absolute;border:1.5px solid var(--marker-red);
  background:rgba(216,53,42,.08);
  pointer-events:none;
  transition:none;
}
.minimap-label{
  position:absolute;top:4px;left:8px;
  font-family:var(--fm);font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);
  pointer-events:none;
}
```

### 6.5 — Help overlay

```css
.help{
  position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:50;
  background:#1a1a1c;color:#f5ede0;
  padding:28px 32px;
  max-width:400px;text-align:center;
  font-family:var(--fs);font-size:14px;line-height:1.5;
  box-shadow:0 20px 60px rgba(40,35,25,.4);
  opacity:0;pointer-events:none;
  transition:opacity .4s,transform .4s;
}
.help.on{opacity:1;pointer-events:auto;transform:translate(-50%,-50%) scale(1)}
.help-title{font-family:var(--fh);font-weight:700;font-size:38px;margin-bottom:10px;line-height:1}
.help-title em{font-style:italic;color:var(--marker-red)}
.help-keys{display:flex;justify-content:center;gap:10px;margin-top:16px;flex-wrap:wrap}
.help-key{
  font-family:var(--fm);font-size:11px;letter-spacing:.1em;
  padding:5px 10px;background:rgba(255,240,200,.08);border:1px solid rgba(255,240,200,.2);
  display:inline-flex;align-items:center;gap:6px;
}
.help-key kbd{font-family:var(--fm);background:rgba(255,240,200,.12);padding:2px 6px;border-radius:2px;font-size:10px}
.help-dismiss{
  margin-top:20px;font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;
  padding:10px 20px;background:var(--marker-red);color:#fff;cursor:pointer;
}
```

### 6.6 — Mobile hint + reading hint (case studies)

```css
.mobile-hint{
  display:none;
  position:fixed;bottom:90px;left:50%;transform:translateX(-50%);z-index:25;
  background:#1a1a1c;color:#f5ede0;
  padding:10px 16px;
  font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;
  box-shadow:0 4px 16px rgba(40,35,25,.25);
  white-space:nowrap;
  animation:mobFloat 2s infinite ease-in-out;
}
@keyframes mobFloat{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-6px)}}

/* Case studies only: reading-mode hint at bottom */
.reading-hint{
  position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:25;
  background:rgba(26,26,28,.92);color:#f5ede0;
  padding:8px 14px;
  font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;
  white-space:nowrap;
  opacity:0;pointer-events:none;transition:opacity .4s;
}
.reading-hint.on{opacity:.95}
.reading-hint kbd{background:rgba(255,240,200,.1);padding:2px 6px;border-radius:2px;margin:0 2px}
```

### 6.7 — Topbar (case studies — simpler, back button instead of menu)

Source: `cockpit-canvas.html` lines 1030–1046.

```html
<div class="topbar">
  <div class="tb-logo-wrap">
    <a href="sivanesh-workbench.html#work" class="tb-logo" title="Back to workbench">
      <span class="back-ic"><svg viewBox="0 0 14 14" width="12" height="12"><path d="M9 3L4 7l5 4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span>Sivanesh.tv</span>
      <span class="tb-logo-sub">← back to work</span>
    </a>
  </div>
  <div class="tb-status">
    <span class="case-lbl">CASE STUDY · 01</span>
    <span class="sep">·</span>
    <span>Cockpit View 2.0</span>
    <span class="sep">·</span>
    <span id="clock">—:— IST</span>
  </div>
</div>
```

`.back-ic` CSS (cockpit lines 396–397):
```css
.back-ic{display:inline-flex;align-items:center;justify-content:center;width:14px;color:var(--ink-2);transition:transform .2s, color .2s}
.tb-logo:hover .back-ic{transform:translateX(-2px);color:var(--red)}
```

### 6.8 — Mobile overrides (workbench) — source: lines 579–594

```css
@media(max-width:820px){
  .topbar{padding:14px 16px;flex-wrap:wrap;gap:10px}
  .tb-logo{padding:6px 10px;font-size:12px}
  .tb-logo-sub{display:none}
  .tb-status{font-size:9px;padding:8px 12px;gap:10px}
  .tb-status .avail span:not(.avail-dot){display:none}
  .nav-menu{min-width:calc(100vw - 32px);max-width:280px}
  .toolbar{bottom:12px;padding:4px;gap:1px}
  .tb-btn{width:32px;height:32px}
  .tb-zoom{padding:0 6px;min-width:46px;font-size:10px}
  .tb-divider{height:18px;margin:0 2px}
  .minimap{width:96px;height:68px;bottom:62px;right:12px}
  .mobile-hint{display:block}
  .help-title{font-size:28px}
  .help{padding:22px;max-width:88vw}
}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}
}
```

Case studies have additional mobile overrides on reader sizing (cockpit lines 547–566).

---

## 7 · Workbench composition — every artifact, exact position

Each artifact on the workbench is listed with its `left`, `top`, `transform`, dimensions, classes, and the HTML body content. **Source: `portfolio-workbench.html` lines 597–904.**

### 7.1 — Zone labels (4 decorative backdrop words)

```html
<div class="zone-label" style="left:2100px;top:1420px;font-size:72px;transform:rotate(-2deg)">— hello —</div>
<div class="zone-label" style="left:3600px;top:1440px;font-size:120px;transform:rotate(-1deg)">the <em>work</em></div>
<div class="zone-label" style="left:1200px;top:3000px;font-size:96px;transform:rotate(1deg)">how <em>I</em> work</div>
<div class="zone-label" style="left:3800px;top:3240px;font-size:96px;transform:rotate(-1deg)">say <em>hi</em></div>

<!-- The about zone's label sits inside the about cluster, not in the zone-labels group: -->
<div class="zone-label" style="left:880px;top:1520px;font-size:96px;transform:rotate(-1deg)">about <em>me</em></div>
```

### 7.2 — Masthead

Position via class: `left:2100px; top:1600px; transform:rotate(-1deg); width:900px` (baked into CSS).

```html
<div class="masthead" id="obj-masthead">
  <span class="mh-eyebrow">hey, I'm —</span>
  <h1 class="mh-title">Sivanesh <em>TV</em>,<br>a designer<br>who <span class="strike">talks</span> <em>ships.</em></h1>
  <p class="mh-sub">Product design for <em>critical operations</em> — drone autonomy, fleet tools, interfaces where a wrong tap costs more than time. Based in Pune · open to briefs.</p>
</div>
```

### 7.3 — Photo frame

```html
<div class="photo" id="obj-photo" style="left:1830px;top:1640px;transform:rotate(-5deg)">
  <div class="photo-inner">S</div>
  <div class="photo-caption">— that's me, Pune IN —</div>
</div>
```

### 7.4 — Arrow 1 (masthead → work)

```html
<svg class="arrow-1" viewBox="0 0 340 180" xmlns="http://www.w3.org/2000/svg"
     style="position:absolute;left:2900px;top:2050px;width:340px;height:180px;pointer-events:none">
  <path d="M 10 30 Q 150 10 200 90 T 320 140" stroke="#d8352a" stroke-width="3" fill="none" stroke-linecap="round"
    style="filter:url(#wobble)"/>
  <path d="M 310 135 L 325 140 L 315 152" stroke="#d8352a" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="40" y="175" font-family="Caveat" font-size="26" fill="#d8352a" font-weight="700" transform="rotate(-3 40 175)">the work →</text>
</svg>
```

### 7.5 — About zone stickies (5 total)

```html
<!-- whoIAm -->
<div class="sticky pink" id="obj-whoIAm" style="left:800px;top:1760px;transform:rotate(3deg);width:300px">
  <div class="sticky-eyebrow">— in my own words —</div>
  A product designer who cares about <em>structure</em> more than surface. Happiest when the problem is fuzzy, the stakes are real, and the answer is a rule — not a mood board.
</div>

<!-- belief -->
<div class="sticky" id="obj-belief" style="left:1280px;top:1820px;transform:rotate(-3deg);width:260px">
  <div class="sticky-eyebrow">— what I hold to —</div>
  Structure <em>before</em> style. Always. Style is how structure <em>shows itself.</em>
</div>

<!-- basketball (inline orange + brown ink) -->
<div class="sticky artifact-bball" id="obj-bball" style="left:800px;top:2100px;transform:rotate(-4deg);width:290px;background:#f28c3f">
  <div class="sticky-eyebrow" style="color:#4a2a00">— off the bench —</div>
  <div style="display:flex;align-items:flex-start;gap:12px;margin-top:4px">
    <svg width="44" height="44" viewBox="0 0 48 48" style="flex-shrink:0;margin-top:2px" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" fill="#d65f0f" stroke="#2a1400" stroke-width="2"/>
      <path d="M 24 4 Q 24 24 24 44" stroke="#2a1400" stroke-width="1.8" fill="none"/>
      <path d="M 4 24 Q 24 24 44 24" stroke="#2a1400" stroke-width="1.8" fill="none"/>
      <path d="M 10 10 Q 22 22 38 38" stroke="#2a1400" stroke-width="1.8" fill="none"/>
      <path d="M 38 10 Q 26 22 10 38" stroke="#2a1400" stroke-width="1.8" fill="none"/>
    </svg>
    <div style="font-family:var(--fh);font-weight:600;font-size:19px;line-height:1.35;color:#2a1400">
      Shooting forward / small forward. State-level in college, <em style="color:#7a1a00;font-style:italic">Tamil Nadu.</em> Still play every week.
    </div>
  </div>
</div>

<!-- manhwa (cream + purple ink) -->
<div class="sticky artifact-manhwa" id="obj-manhwa" style="left:1280px;top:2160px;transform:rotate(3deg);width:280px;background:#f5ede0;border:1px solid rgba(40,35,25,.08);box-shadow:2px 3px 0 rgba(40,35,25,.04), 4px 10px 24px rgba(40,35,25,.14)">
  <div class="sticky-eyebrow" style="color:#6a2a8a">— late nights —</div>
  <div style="display:flex;align-items:flex-start;gap:12px;margin-top:4px">
    <svg width="40" height="48" viewBox="0 0 44 52" style="flex-shrink:0;margin-top:2px" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="6" width="34" height="42" fill="#fdf8ea" stroke="#1a1a1c" stroke-width="1.8" transform="rotate(-4 19 27)"/>
      <rect x="6" y="4" width="34" height="42" fill="#fdf8ea" stroke="#1a1a1c" stroke-width="1.8"/>
      <line x1="6" y1="18" x2="40" y2="18" stroke="#1a1a1c" stroke-width="1"/>
      <line x1="22" y1="4" x2="22" y2="18" stroke="#1a1a1c" stroke-width="1"/>
      <line x1="6" y1="32" x2="40" y2="32" stroke="#1a1a1c" stroke-width="1"/>
      <circle cx="14" cy="11" r="2" fill="#d8352a"/>
      <path d="M 8 26 L 20 26 M 8 38 L 38 38 M 8 42 L 30 42" stroke="#1a1a1c" stroke-width=".8"/>
    </svg>
    <div style="font-family:var(--fh);font-weight:600;font-size:19px;line-height:1.35;color:#1a1a1c">
      Solo Leveling, Omniscient Reader, Tower of God. Nights belong to <em style="color:#6a2a8a;font-style:italic">manhwa.</em>
    </div>
  </div>
</div>

<!-- music -->
<div class="sticky green" id="obj-music" style="left:1030px;top:2440px;transform:rotate(-2deg);width:240px">
  <div class="sticky-eyebrow">— always on —</div>
  Can't get through a day without good music. Obsessed.
</div>
```

### 7.6 — How-I-work zone

```html
<!-- Index card: how I actually work -->
<div class="card" id="obj-howICard" style="left:1200px;top:3180px;transform:rotate(-1.5deg)">
  <div class="card-title">how <span style="font-style:italic;color:var(--marker-red)">I</span> actually work</div>
  <div class="card-sub">— typical week —</div>
  <div class="card-list">
    <div class="card-list-row"><span>Sit close to CS + PM</span><span>calls, transcripts</span></div>
    <div class="card-list-row"><span>Turn findings into structure</span><span>IA, flows, rules</span></div>
    <div class="card-list-row"><span>Prototype in the real tool</span><span>Figma → Lovable → code</span></div>
    <div class="card-list-row"><span>Pair with engineering</span><span>daily, ship weeks</span></div>
    <div class="card-list-row"><span>Deep work</span><span><em>10:00 – 14:00 IST</em></span></div>
    <div class="card-list-row"><span>Collab hours</span><span>15:00 – 18:00 IST</span></div>
  </div>
</div>

<!-- Todo list: what I practice -->
<div class="todo" id="obj-todo" style="left:1730px;top:3200px">
  <div class="todo-title">what I <em>practice</em></div>
  <div class="todo-sub">— the verbs —</div>
  <div class="todo-row done"><div class="todo-check"></div><div class="todo-txt">Absorb</div></div>
  <div class="todo-row done"><div class="todo-check"></div><div class="todo-txt">Structure</div></div>
  <div class="todo-row done"><div class="todo-check"></div><div class="todo-txt">Prototype</div></div>
  <div class="todo-row done"><div class="todo-check"></div><div class="todo-txt">Systematise</div></div>
  <div class="todo-row done"><div class="todo-check"></div><div class="todo-txt">Ship</div></div>
  <div class="todo-row done"><div class="todo-check"></div><div class="todo-txt">Critique</div></div>
</div>

<!-- Tools sticky -->
<div class="sticky blue" id="obj-tools" style="left:2200px;top:3230px;transform:rotate(-2deg);width:240px">
  <div class="sticky-eyebrow">— tools, apr '26 —</div>
  Figma · <em>Claude</em> · Lovable · Cursor · iA Writer · MacBook Pro M3.
</div>

<!-- What I bring (note: uses <ul> list inline) -->
<div class="sticky pink" id="obj-whatIBring" style="left:2520px;top:3190px;transform:rotate(2.5deg);width:260px">
  <div class="sticky-eyebrow">— what I bring to a team —</div>
  <ul style="padding-left:18px;margin:4px 0 0 0;font-family:var(--fh);font-weight:600;font-size:20px;line-height:1.5;color:var(--ink)">
    <li>Structural thinking <em>before</em> pixel-pushing</li>
    <li>Comfort with <em>ambiguity</em> early-stage</li>
    <li>Clean handoffs — specs, rules, edge cases</li>
    <li>Pair fluency with engineers</li>
  </ul>
</div>

<!-- Marker: tie-in -->
<div class="marker sm red" style="left:2850px;top:3460px;transform:rotate(-3deg);font-size:18px">↖ this is what<br>gets shipped</div>
```

### 7.7 — Work zone (3 polaroids + note + click marker)

```html
<!-- Polaroid 1: Cockpit -->
<a class="polaroid" id="obj-pol1" style="left:3500px;top:1700px;transform:rotate(-3deg)" href="cockpit-canvas.html" data-case>
  <div class="polaroid-img">
    <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#1a1a1c"/>
      <g stroke="#d8352a" stroke-width="1" fill="none" opacity=".7">
        <circle cx="200" cy="150" r="100"/>
        <circle cx="200" cy="150" r="70" stroke-dasharray="2 4"/>
        <circle cx="200" cy="150" r="40"/>
        <line x1="200" y1="50" x2="200" y2="250"/>
        <line x1="100" y1="150" x2="300" y2="150"/>
      </g>
      <circle cx="200" cy="150" r="6" fill="#d8352a"/>
      <g fill="#c8f560" opacity=".8">
        <rect x="20" y="20" width="60" height="12"/>
        <rect x="20" y="38" width="90" height="8"/>
        <rect x="320" y="20" width="60" height="12"/>
      </g>
      <g font-family="JetBrains Mono" font-size="8" fill="#c8f560" opacity=".6">
        <text x="30" y="270">ALT 120M · HDG 247°</text>
      </g>
    </svg>
  </div>
  <div class="polaroid-caption">Cockpit View <em>2.0</em></div>
  <div class="polaroid-meta">2024 · Drone Autonomy</div>
</a>

<!-- Polaroid 2: Fleet -->
<a class="polaroid" id="obj-pol2" style="left:3920px;top:1950px;transform:rotate(4deg)" href="fleet-canvas.html" data-case>
  <!-- polaroid-img SVG: grid of 8 drone tiles, red dots, curves between, status bar "8 ACTIVE · 13 ALERTS" -->
  <div class="polaroid-caption">Fleet <em>View</em></div>
  <div class="polaroid-meta">2024–25 · Fleet Operations</div>
</a>

<!-- Polaroid 3: Asset -->
<a class="polaroid" id="obj-pol3" style="left:3600px;top:2250px;transform:rotate(2deg)" href="asset-canvas.html" data-case>
  <!-- polaroid-img SVG: left nav rail + asset tree + map with pins + "ZONE APEX" polygon -->
  <div class="polaroid-caption">Asset <em>Management</em></div>
  <div class="polaroid-meta">2025 · Infrastructure-first module</div>
</a>

<!-- Work eyebrow sticky -->
<div class="sticky green" id="obj-workNote" style="left:4450px;top:1710px;transform:rotate(-4deg);width:220px">
  <div class="sticky-eyebrow">— 3 cases · many more shipped —</div>
  These three are <em>written up.</em> Plenty more lives inside <em>FlytBase's</em> enterprise product — happy to walk through.
</div>

<!-- Click hint -->
<div class="marker sm red" style="left:3680px;top:1620px;transform:rotate(-4deg);font-size:22px">click any to open ↓</div>
```

*(For full polaroid SVG markup see `portfolio-workbench.html` lines 747–856.)*

### 7.8 — Contact zone

```html
<!-- Contact card -->
<div class="contact-card" id="obj-contactCard" style="left:3900px;top:3420px">
  <h3>if this <em>clicked</em> — say hi.</h3>
  <p>Taking briefs in Q2 '26. Short contracts, design lead roles, advisory, pair-thinking sessions. Drop a line — I read everything.</p>
  <a href="mailto:hello@sivanesh.tv" class="email">
    <span>hello@sivanesh.tv</span>
    <span class="arr">→</span>
  </a>
  <div class="socials">
    <a href="#">LinkedIn ↗</a>
    <a href="#">Read.cv ↗</a>
    <a href="#">Twitter ↗</a>
  </div>
</div>

<!-- Availability sticky -->
<div class="sticky" id="obj-avail" style="left:4480px;top:3520px;transform:rotate(-3deg);width:220px">
  <div class="sticky-eyebrow">— availability —</div>
  Open to <em>Q2 '26</em> briefs. Pune-based, work across IST hours.
</div>

<!-- Arrow from "say hi" zone label down into the contact card -->
<svg style="position:absolute;left:3800px;top:3360px;width:140px;height:90px;pointer-events:none" viewBox="0 0 140 90">
  <path d="M 30 10 Q 25 55 100 70" stroke="#d8352a" stroke-width="3" fill="none" stroke-linecap="round" style="filter:url(#wobble)"/>
  <path d="M 92 62 L 104 72 L 92 80" stroke="#d8352a" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

<!-- Footer credit (small mono marker) -->
<div class="marker sm black" style="left:2450px;top:3850px;transform:rotate(-1deg);font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);font-weight:500">
  © 2026 Sivanesh TV · hand-built · last updated apr 2026
</div>

<!-- Shared SVG wobble filter, placed once inside .canvas -->
<svg width="0" height="0" style="position:absolute">
  <defs>
    <filter id="wobble"><feTurbulence baseFrequency=".04" numOctaves="2" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="2"/></filter>
  </defs>
</svg>
```

### 7.9 — Topbar + toolbar + minimap + help overlay + mobile hint

See §6 for CSS. Markup lives outside `.canvas-wrap` as siblings.

```html
<div class="topbar">
  <div class="tb-logo-wrap">
    <button class="tb-logo" id="menuToggle" aria-expanded="false" aria-label="Open layers panel">
      <span class="menu-ic"><span></span><span></span><span></span></span>
      <span>Sivanesh.tv</span>
      <span class="tb-logo-sub">— the workbench</span>
      <span class="menu-chev">▾</span>
    </button>
    <div class="nav-menu" id="layersPanel" role="menu">
      <!-- 5 nav rows: hello/about/work/howwork/contact -->
    </div>
  </div>
  <div class="tb-status">
    <div class="avail"><span class="avail-dot"></span><span>Taking briefs</span></div>
    <span class="sep">·</span>
    <span id="clock">—:— IST</span>
    <span class="sep">·</span>
    <span>Pune, IN</span>
  </div>
</div>

<div class="toolbar">
  <button class="tb-btn" id="btnZoomOut" title="Zoom out (−)">−</button>
  <div class="tb-zoom" id="zoomVal">100%</div>
  <button class="tb-btn" id="btnZoomIn" title="Zoom in (+)">+</button>
  <div class="tb-divider"></div>
  <button class="tb-btn" id="btnFit" title="Fit to screen (F)">...</button>
  <button class="tb-btn" id="btnReset" title="Home (H or 0)">...</button>
</div>

<div class="minimap" id="minimap" title="Click to jump">
  <div class="minimap-label">Board</div>
  <div class="minimap-canvas" id="minimapCanvas"></div>
  <div class="minimap-viewport" id="minimapViewport"></div>
</div>

<div class="mobile-hint" id="mobileHint">pinch to zoom · drag to pan</div>

<div class="help" id="help">
  <div class="help-title">this is a <em>whiteboard.</em></div>
  <p style="margin-bottom:6px">Scroll to pan around. Click any sketch, sticky, or polaroid to open the full work.</p>
  <div class="help-keys">
    <span class="help-key"><kbd>scroll</kbd> pan</span>
    <span class="help-key"><kbd>⌘</kbd> + <kbd>scroll</kbd> zoom</span>
    <span class="help-key"><kbd>space</kbd> + <kbd>drag</kbd> pan fast</span>
    <span class="help-key"><kbd>F</kbd> fit</span>
  </div>
  <button class="help-dismiss" id="helpDismiss">got it</button>
</div>
```

---

## 8 · Case study composition — the pattern

Each case study has the same skeleton. The differences are copy, specific artifacts, and a few unique elements.

### 8.1 — Reader column skeleton

```html
<article class="reader" id="reader">
  <a href="sivanesh-workbench.html" class="r-back">back to workbench</a>

  <span class="r-eyebrow">case study · 01</span>
  <h1 class="r-title">Cockpit View <em>2.0.</em></h1>
  <p class="r-sub">Redesigning the primary control interface for autonomous drone operations — from the ground up.</p>

  <div class="r-meta">
    <div class="r-meta-item"><div class="r-meta-k">Role</div><div class="r-meta-v">Lead · with Prathamesh</div></div>
    <div class="r-meta-item"><div class="r-meta-k">Year</div><div class="r-meta-v">2024</div></div>
    <div class="r-meta-item"><div class="r-meta-k">Scope</div><div class="r-meta-v">End-to-end UX · Design system</div></div>
    <div class="r-meta-item"><div class="r-meta-k">Tools</div><div class="r-meta-v">Figma · Framer · Claude Code</div></div>
  </div>

  <!-- IMAGE SLOT 01 (hero) -->
  <figure class="img-slot hero">
    <div class="img-slot-inner">
      <div class="img-slot-label">Image slot 01 · Hero shot</div>
      <div class="img-slot-title">Full Cockpit View 2.0 interface</div>
      <div class="img-slot-desc">...</div>
      <div class="img-slot-dims">16 : 10 · ideally 2400 × 1500 px</div>
    </div>
    <div class="img-slot-cap"><span>Cockpit View 2.0 — in-flight, live telemetry</span><span>the interface</span></div>
  </figure>

  <!-- § 01 Context -->
  <section class="r-section">
    <div class="r-section-lbl">Context <span class="num">§ 01</span></div>
    <h2 class="r-h2">...</h2>
    <p class="r-lead">...</p>
    <div class="r-body"><p>...</p><p>...</p></div>
  </section>

  <!-- § 02 The problem — uses pullquote as section opener -->
  <section class="r-section">
    <div class="r-section-lbl">The problem <span class="num">§ 02</span></div>
    <p class="r-pullquote">...<em>...</em></p>
    <div class="r-body"><p>...</p></div>
    <figure class="img-slot wide">...</figure>
  </section>

  <!-- §§ 03–06 Solution steps, each with h2, lead, body, optional callout, image slot -->

  <hr class="r-hr">

  <!-- § 07 Outcomes -->
  <section class="r-section">
    <div class="r-section-lbl">What happened <span class="num">§ 07</span></div>
    <h2 class="r-h2">The receipts.</h2>
    <figure class="img-slot wide">...</figure>
    <div class="r-outcome">
      <div class="r-outcome-item"><div class="r-outcome-n">Live</div><div class="r-outcome-l">Deployed</div><div class="r-outcome-d">...</div></div>
      <div class="r-outcome-item">...</div>
      <div class="r-outcome-item">...</div>
    </div>
  </section>

  <!-- § 08 Reflection -->
  <section class="r-section">
    <div class="r-section-lbl">What I took away <span class="num">§ 08</span></div>
    <div class="r-body">
      <p><strong>...</strong> ...</p>
      <p><strong>...</strong> ...</p>
    </div>
  </section>

  <div class="r-end">
    <span class="r-end-note">— end of case · § 01 / 02 —</span>
    <a href="fleet-canvas.html" class="r-end-next">Next: Fleet View ↗</a>
  </div>
</article>
```

### 8.2 — Scattered board objects (sibling elements after the reader, inside `.canvas`)

Each artifact uses `class="... artifact"` + `data-anchor` + `data-side` + `data-gap` + `data-width`. Position is computed on load.

Example (Cockpit §02):
```html
<div class="sticky pink artifact" id="obj-operator-quote"
     data-anchor="1" data-anchor-offset="40" data-side="left" data-gap="60" data-width="280"
     style="transform:rotate(-4deg);width:280px">
  <div class="sticky-eyebrow">— operator, multi-monitor setup —</div>
  "I have Cockpit in one tab, alerts in another, video feed pinned separately. <em>That's my workflow.</em>"
</div>
```

**`data-anchor` values:**
- `"0"` — hero / pre-§01 area
- `"1"` — § 01 (sections are zero-indexed, but hero counts as 0 → § 01 = index 1, § 02 = index 2, etc.)
- ...through...
- `"last"` — the final `.r-section`

The engine in `refreshZoneTargets()` iterates `.r-section` NodeList; the hero `<figure>` and pre-meta elements are not `.r-section` and don't count. See cockpit lines 1268–1277.

**Wayfinding markers** (every case study has these at data-anchor="0"):
```html
<div class="marker md red artifact" data-anchor="0" data-anchor-offset="-80" data-side="left" data-gap="60" data-width="200" style="transform:rotate(-8deg)">↓ read straight through</div>
<div class="marker sm black artifact" data-anchor="0" data-anchor-offset="-40" data-side="right" data-gap="40" data-width="180" style="transform:rotate(4deg);font-size:18px">drag around to<br>explore →</div>
```

---

## 9 · Case study copy — full text

All copy below is verbatim from the prototype. `<em>` = red italic (reader column) / red bold non-italic (sticky). `<strong>` = bold.

### 9.1 — Cockpit (source: `cockpit-canvas.html` lines 601–810)

**Hero:**
- Eyebrow: `case study · 01`
- Title: `Cockpit View <em>2.0.</em>`
- Sub: `Redesigning the primary control interface for autonomous drone operations — from the ground up.`

**Meta:**
| Role | Year | Scope | Tools |
|---|---|---|---|
| Lead · with Prathamesh | 2024 | End-to-end UX · Design system | Figma · Framer · Claude Code |

**§ 01 Context** — `h2`: `Cockpit View is the <em>primary interface</em> operators live in all day.`
Lead: `It runs entirely in a browser — no native app, no dedicated hardware — and it has to perform like both a map and a command centre simultaneously. When we inherited the design, it worked. But "working" and "trustworthy" aren't the same thing at this scale.`
Body: 2 paragraphs covering operator workflow and the 1-to-many-drone scaling pressure.

**§ 02 The problem** — pullquote: `The interface was working. The <em>operators</em> were doing the work it should have been doing.`
Body: 2 paragraphs covering compensation behavior and what to change first.
Callout: `Information architecture is the spine. Before we could fix any screen, we had to decide where everything should <em>live</em>, and why. That became the first of four structural rewrites.`
Margin ref: `↗ see the alert-system redesign`

**§ 03 Step one** (IA) — h2: `Before designing anything, decide where everything <em>lives</em> — and why.`

**§ 04 Step two** (Alerts) — h2: `If the alerts panel is empty, <em>that</em> should feel like good news.`

**§ 05 Step three** (Feedback) — h2: `One question per system. <em>Three questions</em> total.`

**§ 06 Step four** (Layout) — h2: `A layout that earns operator trust by <em>never</em> surprising them.`

**§ 07 What happened** — h2: `The receipts.`
Outcomes:
- `Live` / Deployed / Cockpit View 2.0 shipped as the primary interface across FlytBase enterprise deployments.
- `3×` / Fewer support calls / About alert ambiguity and layout confusion, based on CS's tracking over 2024 Q4.
- `1→N` / Scaled / The layout and IA foundations carried over directly into Fleet View — the next case.

**§ 08 What I took away** — three bolded takeaways:
- **Structural rewrites need a rule, not a vision.** "Everything has one bucket" survived every design review. A mood board wouldn't have.
- **Operators design the interface with you.** Shadowing CS calls and reading transcripts isn't a substitute for user research — it's where most of the real insight came from. The people closest to the user knew the answer; I just had to listen.
- **Boring is a feature.** In critical-ops interfaces, "surprising" is almost always bad. The best thing you can do for the operator is build an interface they can forget about.

**End:** `— end of case · § 01 / 02 —` · next: Fleet View ↗

**For full body text of each section:** read `cockpit-canvas.html` lines 627–805.

**For all canvas artifacts with positions:** read `cockpit-canvas.html` lines 815–1023. Summary of artifact list:
- §00 wayfinding markers: 2 (left "↓ read straight through", right "drag around to explore →")
- §02: 2 stickies (pink operator-quote, default multi-tool)
- §03: 1 principle ("Push or Overlay") + 1 diagram (panel hierarchy)
- §04: 1 diagram (alert severities) — see lines 895–921 for SVG
- §04: 1 sticky (alert-restraint)
- §05: 1 blue sticky (Robin AI)
- §06: 2 printouts (before/after) + 1 green sticky (layout-callout)
- §07: 1 blue sticky (receipt)
- §last (reflection): 1 cut card + 1 green sticky

### 9.2 — Fleet (source: `fleet-canvas.html`)

**Meta:** Role: Co-designer · with Arpita · Year: 2024–25 · Scope: System architecture · Interaction design · Tools: Figma · Claude

**Sections:**
- § 01 The project — h2: `Fleet View is the <em>command environment</em> for operators running many drones at once.`
- § 02 The challenge — pullquote: `Two different people. Completely different needs. One interface that couldn't afford to <em>fail either of them.</em>` (NO h2 above it — the pullquote IS the section content's opener)
- § 03 The central decision — h2: `Group, don't <em>filter.</em>`
- § 04 Layer 0 / Personas — mixed content
- § 05+ Solution deepening
- § 07 Outcomes with receipts
- § 08 Reflection

**Unique artifacts:** Context card (CAA regulatory quote, dark), Principle card ("Grouping, not filtering"), Layer 0 diagram (four-panel grid).

Read `fleet-canvas.html` body for the complete content.

### 9.3 — Asset (source: `asset-canvas.html`)

**Meta:** Role: Lead Product Designer · Reports by Arpita · Year: 2025 · Scope: IA · Module design · Data model · Tools: Figma · Lovable · Claude Code

**Sections:**
- § 01 Context — h2: `FlytBase had always been <em>flight-first.</em> This module wasn't.`
- § 02 The problem — pullquote: `You could fly missions. You couldn't track <em>places.</em>`
- § 03 The shift — h2: `Track the thing. <em>Not the flight.</em>`
- § 04 Templatization
- § 05 The module (five pages)
- § 06 What shipped
- § 07 Reflection

**Unique artifacts:** Context card (45 wellheads), Principle card (asset-first shift), Printout (five-page nav), Cut card, multiple green receipt stickies.

Read `asset-canvas.html` body for the complete content.

---

## 10 · Known prototype quirks / intentional behaviors

1. **Canvas dot pattern beats with dot-alignment at certain zoom levels** — acceptable; don't fight it.
2. **`.sticky em` is NOT italic** on workbench or case studies (Caveat is already informal).
3. **`.r-body em` uses ink color, not red** — intentional; body prose emphasis stays calm.
4. **Principle title uses Inter (not Caveat) at 26px.** Body em inside it uses ink (not red). These are intentional.
5. **Contact card is dark.** Workbench climax.
6. **Photo frame is square 180×180 with warm-tan gradient** (`#c6a87a → #8a6d4a`) — NOT grey.
7. **Zone labels use Caveat** (handwritten), not Inter.
8. **Todo checkmark is "✗" in red Caveat**, not "✓".
9. **Polaroid hover uses `!important`** to nuke instance rotation — keep it.
10. **Marker sizes differ between workbench (24/38/54) and case studies (22/34/48).**
11. **The help overlay uses sessionStorage key `wb-help-seen`** for one-shot display. Case studies use `cockpit-pan-seen` etc.
12. **Asset prototype latent bug:** `.context-card` class used but CSS missing. In rebuild, add Fleet's `.context-card` CSS to asset too.
13. **`.r-callout::before` has hardcoded "the hard part" label** — make this a prop in the rebuild.
14. **Canvas height can grow dynamically** (`refreshZoneTargets` extends `CANVAS_H` to fit reader + 400px). Honor this.
15. **Reader default width of 2200px is a fallback** — only seen if JS doesn't run. Real widths are 580/720/900/1080/1160.

---

## 11 · What the rebuild SHOULD do differently (cleanup, not change)

These are places where the prototype is messy-HTML-but-works. Rebuild into components:

1. **Inline styles on stickies for positioning:** workbench has 30+ inline `style="left:X;top:Y;transform:rotate(Ndeg)"`. Move to a data file (`workbench.ts`) with `{id, component, pos:{x,y}, rotation, props}` and map.
2. **Case study artifacts:** keep `data-anchor` / `data-side` / `data-gap` / `data-width` system — it's correct — but make the emission of these attributes a component concern, not hand-written HTML.
3. **Inline `.sticky` background overrides** (basketball orange, manhwa cream): keep the pattern but add proper variants `orange`, `cream` to the Sticky component.
4. **Inline `<ul>` inside what-I-bring sticky:** standard sticky content slot; support a list variant.
5. **Duplicated CSS across four prototype files** — deduplicate into one token sheet + one component sheet shared by all pages.
6. **SVG wobble filter appears inside canvas:** move to a shared `BaseLayout` or equivalent root SVG, include once per page.

**DO NOT "improve" these while rebuilding:**
- Tokens (copy verbatim)
- Component CSS values (copy verbatim)
- Canvas engine math (copy verbatim)
- Artifact positions + rotations on workbench (copy verbatim — these were hand-tuned)
- `data-anchor` / `data-side` values on case study artifacts (copy verbatim)
- All copy text (copy verbatim)
