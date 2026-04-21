# Rebuild prompt — grounded in the prototype HTML

**Read this entire document before starting any work.**

---

## The ground rule

The four HTML files — `portfolio-workbench.html`, `cockpit-canvas.html`, `fleet-canvas.html`, `asset-canvas.html` — **are the source of truth.** When anything about the rebuild is uncertain, the answer is in those files.

`PROTOTYPE-REFERENCE.md` is a structured extract from those files with line numbers and copy-paste-ready CSS/markup blocks. Use it as your index.

`DECISIONS.md` contains locked-in answers for everything the prototype HTML can't tell you on its own — font hosting, social URLs, the email display-vs-link mismatch, placeholder policy. **Read it before Phase 1.**

Supporting docs (`00`–`06`, `README.md`) exist for context and rationale. **If these docs conflict with the prototype HTML, the prototype wins.** If these docs conflict with `PROTOTYPE-REFERENCE.md`, `PROTOTYPE-REFERENCE.md` wins (because it's a direct extract).

When in doubt: open the prototype HTML file, find the referenced class or line, copy it verbatim. Do not paraphrase. Do not improve. Do not consolidate across files unless Phase 1 explicitly says so.

---

## How this rebuild is structured

**Seven phases.** Each phase has:
- **Deliverable** — what you produce
- **Source** — exact file(s) and line ranges to read
- **Gate** — what "done" looks like, verified against the prototype in a browser
- **Don't touch** — scope fence to prevent scope creep

**Rule between phases:** After each phase, post a one-line status update. WAIT for the human to confirm before starting the next phase. Do not chain phases. This is a rebuild we got wrong once by moving too fast.

**Side-by-side verification is the gate.** For every gate, open the running build in one browser tab and the corresponding prototype HTML in another. They should look and feel identical at desktop size. If they don't, the phase isn't done.

---

## Phase 1 — Scaffold + tokens + fonts + base CSS

### Deliverable
A running Astro project with:
- Design tokens in `src/styles/tokens.css` — copy-paste from `PROTOTYPE-REFERENCE.md` §1
- Base CSS in `src/styles/base.css` — the reset and `body` from `PROTOTYPE-REFERENCE.md` §1
- Canvas CSS in `src/styles/canvas.css` — `.board-bg`, `.canvas-wrap`, `.canvas` from §2
- Four fonts self-hosted in `public/fonts/` — Inter (variable), JetBrains Mono (variable), Caveat (variable), Kalam (400 + 700). Load via `@font-face` in `base.css` with `font-display: swap`. Preload Inter + JetBrains Mono in `<head>`.
- A `src/pages/index.astro` with nothing but `<div class="board-bg"></div>` + `<div class="canvas-wrap"><div class="canvas" style="width:6000px;height:4200px"></div></div>`. No artifacts yet.
- A `BaseLayout.astro` that includes the SVG wobble filter once at body root:
  ```html
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <defs>
      <filter id="wobble"><feTurbulence baseFrequency=".04" numOctaves="2" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="2"/></filter>
    </defs>
  </svg>
  ```

### Source
- `PROTOTYPE-REFERENCE.md` §1 and §2
- `portfolio-workbench.html` lines 14–83 for exact CSS

### Gate
Open `http://localhost:4321` next to `portfolio-workbench.html` opened from the filesystem.
- The empty board should look identical: same beige gradient, same subtle noise, NO corner vignette, NO dot pattern.
- Verify fonts loaded (open devtools → Network → filter fonts; four `.woff2` requests, all 200).
- Verify no console errors.

### Don't touch
- Do not build any components yet.
- Do not add the engine JS yet.
- Do not try to make the canvas pan or zoom.
- Do not add UI chrome (topbar, toolbar, minimap) yet.

---

## Phase 2 — Component showcase page

### Deliverable
A page at `src/pages/showcase.astro` (will be deleted before prod ship) that renders every artifact component once, in a vertical stack, at its natural size, on a plain cream background. **This is your visual contract against the prototype before you start composing pages.**

Components to build:
- `src/components/artifacts/Sticky.astro` — props: `variant='yellow'|'pink'|'blue'|'green'|'orange'|'cream'`, `width`, `rotation`, `eyebrow`, `eyebrowColor`. Copy CSS from `PROTOTYPE-REFERENCE.md` §4.1 (workbench variant for the `showcase`; the smaller case-study variant comes later).
- `src/components/artifacts/IndexCard.astro` — props: `width`, `rotation`, `title`, `sub`, `rows`. CSS from §4.2.
- `src/components/artifacts/Polaroid.astro` — props: `href`, `caption`, `meta`, `rotation`. CSS from §4.3.
- `src/components/artifacts/Printout.astro` — props: `width`, `rotation`, `url`, `label`, `labelMeta`. CSS from §4.4 (workbench variant).
- `src/components/artifacts/Marker.astro` — props: `size='sm'|'md'|'lg'`, `variant='red'|'blue'|'black'`, `rotation`. CSS from §4.5 (workbench variant).
- `src/components/artifacts/ContactCard.astro` — props: `title` (html), `body`, `email`, `socials: {label, url}[]`. CSS from §4.6.
- `src/components/artifacts/PhotoFrame.astro` — props: `caption`, `rotation`, `char='S'` (for the placeholder gradient letter). CSS from §4.7.
- `src/components/artifacts/TodoList.astro` — props: `title` (html), `sub`, `items: {text, done}[]`. CSS from §4.8.
- `src/components/artifacts/ZoneLabel.astro` — props: `size`, `rotation`, slot for text with `<em>`. CSS from §4.9.
- `src/components/artifacts/Masthead.astro` — props: `eyebrow`, `title` (html, supports `<strike>`), `sub` (html). CSS from §4.10.

Each component is an `.astro` file. Scoped styles per component. Use `set:html` for any prop that can contain `<em>` / `<strike>` / `<br>`.

Do NOT build `PrincipleCard`, `ContextCard`, `CutCard`, `Diagram`, reader column components, or `ArrowDoodle` yet — those are Phase 5.

### Source
- `PROTOTYPE-REFERENCE.md` §4 sections 4.1–4.10
- Prototype file `portfolio-workbench.html` for exact CSS and markup examples

### Gate
Open `/showcase` next to the workbench prototype.

Visual check each component:
- **Sticky** — tape strip visible at top center, `em` renders red+bold NON-italic, shadow has three layers, border-radius 1px.
- **IndexCard** — has faint blue ruled lines, red 1px margin line at `left:44px`, `em` renders red italic bold.
- **Polaroid** — two tape strips (yellow top-left, beige top-right), 4:3 image slot dark grey background, caption big Caveat.
- **Printout** — tape strip top-left, three grey dots top, dashed border below header, frame 16:10 dark.
- **Marker** — correct three sizes (24/38/54px), weight 700, no pointer events.
- **ContactCard** — **DARK** bg `#1a1a1c`, cream text, tape strip, email button transparent with dashed border.
- **PhotoFrame** — 180×180 square, warm-tan gradient, Caveat letter, tape strip top-center, caption `absolute bottom:-30px` in Caveat 18px rotated +1deg.
- **TodoList** — rows in Kalam 18px, dotted bottom border, checkbox has "✗" in red Caveat when done (NOT ✓ in filled box).
- **ZoneLabel** — Caveat, `.13` opacity, `.9` line-height, `<em>` just italic (no separate color).
- **Masthead** — red slash through the `.strike` word, `em` is huge handwritten red with `translateY(6px)`, `.mh-sub em` has a yellow highlight with `skewX(-5deg)`.

Every value above has a source in the prototype HTML. If any component doesn't match, find the class in the prototype, copy the CSS verbatim, and re-check.

### Don't touch
- No engine code yet.
- No layout/composition yet.
- Don't skip the Masthead red-slash — it's a common failure mode (scoped-CSS bug: `.strike::after` must NOT be inside `:global()` wrapping `::after`; write as `.mh-title :global(.strike)::after`).

---

## Phase 3 — The canvas engine (workbench version)

### Deliverable
`src/components/canvas/engine/CanvasEngine.ts` — vanilla TypeScript class.

Configuration shape:
```typescript
interface CanvasEngineConfig {
  canvasEl: HTMLElement;
  canvasWrap: HTMLElement;
  minimap: HTMLElement;
  minimapCanvas: HTMLElement;
  minimapViewport: HTMLElement;
  zoomLabel: HTMLElement;
  zones: Record<string, {cx: number; cy: number; scale: number}>;
  zoneBounds: Record<string, {x1: number; y1: number; x2: number; y2: number}>;
  canvasWidth: number;
  canvasHeight: number;
  mode: 'workbench' | 'case';  // affects wheel behaviour, boot, and adds reading-mode state for 'case'
}
```

The engine class wires every handler from `PROTOTYPE-REFERENCE.md` §3. For this phase, build ONLY `mode: 'workbench'`. The `'case'` mode is Phase 6.

Build step-by-step, verifying each against the prototype file:
1. **State + clamp + apply** (§3.1, §3.2, §3.3)
2. **zoomAt** (§3.4) — verify: Cmd+scroll over workbench, cursor point stays fixed
3. **Pan with pointer + inertia** (§3.5) — verify: click and drag, flick release produces smooth coast
4. **Middle-click suppression** (§3.6) — verify: middle-click drag pans, no autoscroll crosshair
5. **Spacebar pan** (§3.7) — verify: hold space, cursor becomes grab, pans over any element
6. **Wheel pan/zoom** (§3.8, workbench variant) — verify: scroll pans, Cmd+scroll zooms
7. **Touch pinch/pan** (§3.9) — verify on phone if possible; skip if no device access
8. **buildMinimap + updateMinimap + minimap click-to-jump** (§3.11) — verify: dots appear once first artifacts land in Phase 4
9. **flyTo + goToZone** (§3.10, workbench variant) — verify against keyboard shortcut H
10. **Keyboard shortcuts** (§3.16)
11. **Click-vs-drag suppression** (§3.17) — verify: drag over a polaroid doesn't fire its click
12. **Clock** (§3.18)
13. **Boot + resize** (§3.19)

Mount the engine from `src/pages/index.astro` via a client `<script>`. Use a global script (not a framework island — the engine is vanilla).

### Source
- `PROTOTYPE-REFERENCE.md` §3 (every formula + constant)
- `portfolio-workbench.html` lines 994–1540 for the reference JS

### Gate
`src/pages/index.astro` still only has a bare canvas + the engine mounted. You need a few minimum elements to verify:
- UI chrome (topbar, toolbar, minimap, help, mobile-hint) — markup copied verbatim from `PROTOTYPE-REFERENCE.md` §6.1–§6.6 + §7.9. Style from §6.
- One `.masthead` placeholder at `left:2100px;top:1600px` so you have something to pan toward.

With that, the 18 engine invariants from `06-known-gotchas.md` (all still correct) should pass. In particular:
- Canvas corners reach the viewport corners on minimap click
- Zoom with Cmd+scroll preserves the point under cursor across 10 repeated zooms
- Middle-click doesn't trigger autoscroll
- Spacebar doesn't hijack input/textarea focus
- Reading mode (not applicable here — Phase 6)
- Inertia decays smoothly and stops
- No dot pattern on `.board-bg`
- Canvas CSS `top:50%; left:50%; transform-origin:0 0` intact

### Don't touch
- No reading mode yet
- No responsive reader logic yet
- No artifacts beyond the one placeholder masthead
- No case study pages yet

---

## Phase 4 — Workbench composition

### Deliverable
`src/data/workbench.ts` with the full list of workbench artifacts, their positions, and their props. One data file, no hand-coded HTML positions.

`src/pages/index.astro` imports from `workbench.ts` and maps over the array, rendering each artifact via the matching Phase-2 component.

Data shape:
```typescript
type WorkbenchArtifact =
  | { type: 'zoneLabel'; pos: {x,y}; size: number; rotation: number; text: string }
  | { type: 'masthead'; pos: {x,y}; rotation: number; props: {eyebrow, title, sub} }
  | { type: 'photo'; pos: {x,y}; rotation: number; props: {caption, char?} }
  | { type: 'sticky'; pos: {x,y}; rotation: number; width: number;
      variant: 'yellow'|'pink'|'blue'|'green'; props: {eyebrow, body, em?} }
  | { type: 'stickyInline'; pos: {x,y}; rotation: number; width: number;
      inlineStyle: string; props: {eyebrow, eyebrowColor, body (html)} }  // for basketball / manhwa
  | { type: 'card'; pos: {x,y}; rotation: number; props: {title, sub, rows} }
  | { type: 'todo'; pos: {x,y}; rotation: number; props: {title, sub, items} }
  | { type: 'polaroid'; pos: {x,y}; rotation: number; href: string;
      props: {caption, meta, svg (inline)} }
  | { type: 'marker'; pos: {x,y}; rotation: number;
      size: 'sm'|'md'|'lg'; variant: 'red'|'blue'|'black';
      text: string (html); inlineStyle?: string }
  | { type: 'contact'; pos: {x,y}; props: {title, body, email, socials} }
  | { type: 'arrow'; pos: {x,y}; width: number; height: number;
      viewBox: string; svg: string /* inline SVG path + text */ };
```

Populate it from `PROTOTYPE-REFERENCE.md` §7 verbatim. Every `left:Xpx; top:Ypx; transform:rotate(Ndeg)` on the prototype becomes `pos: {x:X, y:Y}, rotation: N` in the data file.

Basketball and manhwa stickies use `type: 'stickyInline'` because their backgrounds/eyebrow-colors are inline-styled; pass those as explicit props rather than adding new Sticky variants (keep Phase 2 component surface small).

### Source
- `PROTOTYPE-REFERENCE.md` §7 (every artifact with position, rotation, dimensions, copy)
- `portfolio-workbench.html` lines 597–904 for the full markup

### Gate
Open `/` next to the workbench prototype. They should match:
- **Overall layout** — when both are at the same zoom and centered on the masthead, the composition should be indistinguishable
- **Zone labels** in the right positions with correct rotations
- **Masthead** red slash through "talks" visible
- **Photo frame** tilted -5deg, warm-tan gradient, "S" visible, tape strip top-center, caption below
- **5 about stickies** in the correct positions — pink whoIAm, yellow belief, orange basketball (with basketball SVG), cream manhwa (with manhwa SVG), small green music
- **3 polaroids in the work zone**, clickable (navigate to case pages — but those 404 for now, fine)
- **"click any to open ↓"** marker above polaroids
- **Green work-note sticky** to the right of polaroids
- **How-I-work zone**: IndexCard, TodoList with ✗ checkmarks, blue tools sticky, pink what-I-bring with bulleted list, small "↖ this is what gets shipped" marker
- **"say hi" zone**: dark contact card tilted +2deg with email button, availability sticky, curled arrow from zone label. **Contact card props (email + socials) come from `DECISIONS.md` §3 and §4 — not the prototype placeholders.** The display text is `hello@sivanesh.tv` but the mailto link is `sssiva.1999@gmail.com` (intentional mismatch, do not "fix").
- **Footer credit marker** in mono
- **Minimap dots** match artifact positions
- **Zone menu (top-left)** navigates correctly with `goToZone` flights

### Don't touch
- No case study pages yet
- Don't deviate from the exact positions in the prototype
- Don't try to improve the composition — this is a copy job

---

## Phase 5 — Case study components

### Deliverable
Build the remaining artifact components needed for case studies. Each as `.astro` file with scoped styles, CSS copied verbatim from `PROTOTYPE-REFERENCE.md`.

Canvas artifacts:
- `src/components/artifacts/PrincipleCard.astro` — props: `label`, `title` (html), `body` (html), `attr`. CSS from §4.11.
- `src/components/artifacts/ContextCard.astro` — props: `label`, `title` (html), `body` (html). CSS from §4.12.
- `src/components/artifacts/CutCard.astro` — props: `meta`, `title`, `body` (html). CSS from §4.13.
- `src/components/artifacts/Diagram.astro` — props: `title` (html), `sub`, default slot for SVG. CSS from §4.14.

Reader column components:
- `src/components/reader/ReaderColumn.astro` — wrapper. Uses CSS vars `--reader-left`, `--reader-width`, `--reader-pad`, `--reader-fs` (set by engine at runtime). Fixed CSS from §5.1.
- `src/components/reader/Back.astro` — `<a class="r-back">` (§5.2). Props: `href`, text default "back to workbench"
- `src/components/reader/Hero.astro` — renders `.r-eyebrow` + `.r-title` + `.r-sub`. Props: `eyebrow`, `title` (html), `sub` (html). CSS from §5.2.
- `src/components/reader/MetaRow.astro` — props: `items: {k, v}[]`. CSS from §5.3.
- `src/components/reader/Section.astro` — wrapper `<section class="r-section">`. Slot for content.
- `src/components/reader/SectionLabel.astro` — renders `.r-section-lbl` + `.num`. Props: `text`, `num`. CSS from §5.4.
- `src/components/reader/H2.astro` — `<h2 class="r-h2">`. Slot with html. CSS from §5.4.
- `src/components/reader/Lead.astro` — `<p class="r-lead">`. Slot with html. CSS from §5.4.
- `src/components/reader/Body.astro` — `<div class="r-body">`. Slot for `<p>`s. CSS from §5.4.
- `src/components/reader/Callout.astro` — props: `label` (default "the hard part"), slot for `<p>` content. CSS from §5.5.
- `src/components/reader/PullQuote.astro` — `<p class="r-pullquote">`. Slot with html. CSS from §5.6.
- `src/components/reader/MarginRef.astro` — props: `href` or `data-jump`, slot. CSS from §5.7.
- `src/components/reader/Hr.astro` — `<hr class="r-hr">`. CSS from §5.8.
- `src/components/reader/Outcome.astro` — props: `items: {n, l, d}[]`. CSS from §5.9.
- `src/components/reader/EndRow.astro` — props: `note`, `nextLabel`, `nextHref`. CSS from §5.10.
- `src/components/reader/ImgSlot.astro` — **this is the tricky one**. It IS the placeholder. Props: `variant='hero'|'wide'|'square'|'tall'|'split'`, `label`, `title`, `desc`, `dims`, `cap` (left), `capMeta` (right), `src?` (optional — if provided, render an `<img>` inside `.img-slot-inner` instead of the placeholder text). For `split`, pass `halves: [{label, title, desc, dims}, {label, title, desc, dims}]`. CSS from §5.11.

Case-study variant overrides:
- Sticky on case studies is slightly smaller. Add a `compact` prop to `Sticky.astro` that switches CSS to the case-study values (§4.1, smaller variant).
- Marker on case studies has smaller sizes. Add a `compact` prop.
- Printout on case studies has no hover and smaller label. Add a `compact` prop.
- OR: export two wrapper components (`StickyCompact`, `MarkerCompact`) if the if/else pollutes Phase 2 components. Your call — smaller diff wins.

### Source
- `PROTOTYPE-REFERENCE.md` §4.11–§4.14 and all of §5
- `cockpit-canvas.html` for reference markup

### Gate
Extend the `/showcase` page (or add `/showcase-case` if cleaner) to render every new component. Visual check:
- **PrincipleCard** — paper bg, subtle 1px grey border, tape strip top-right, `◆` prefix on label, title in Inter 26px, body em in ink (not red), attribution in Caveat bottom-padded with dashed top border.
- **ContextCard** — DARK bg `#1a1a1c`, cream text, tape strip top-left, red label, title 19px Inter.
- **CutCard** — paper bg, red `Cut` stamp rotated -2deg, dashed divider below header.
- **Diagram** — paper bg, tape strip, handwritten title in Caveat.
- **Reader components** — visible in a narrow paper card placeholder to mimic the reader column. Verify r-h2 em is red italic, r-body p em is ink italic (calm), callout has yellow-tinted bg and "the hard part" label on the border.
- **ImgSlot** — dashed-border placeholder with label, title, desc, dims; caption row at the bottom. Variants hero/wide/square render at correct aspect ratios.

### Don't touch
- Don't compose case pages yet
- Don't build the case-study version of the engine yet

---

## Phase 6 — Canvas engine case-study mode

### Deliverable
Extend `CanvasEngine.ts` with `mode: 'case'` support, adding:
- `readingMode: boolean` state, default `true` on mount
- `readerWidth`, `readerLeft`, `readingScale` instance vars, plus `computeReaderLayout()` (§3.14)
- `refreshZoneTargets()` (§3.15)
- Reading-mode Y-bias in `flyTo` (§3.10 case variant)
- Reading-mode exit on drag > 30px in `onPointerMove` (§3.5)
- `setReadingMode()` and `showFirstPanHint()` helpers
- `r`/`R` keyboard shortcut to re-enter reading mode
- Boot for case: `computeReaderLayout()` → `refreshZoneTargets()` → `buildMinimap()` → `goToZone('top')`
- Resize: recompute layout + zones + minimap

Case study topbar + reading hint as chrome:
- `src/components/canvas/CaseTopbar.astro` — markup from §6.7 ("← back to work" + case label + clock)
- `src/components/canvas/ReadingHint.astro` — markup and CSS from §6.6

New layout:
- `src/layouts/CaseLayout.astro` — wraps a case study with `BaseLayout`, adds `.board-bg`, `.canvas-wrap` + `.canvas` (5000×6800 canvas), `CaseTopbar`, toolbar (same as workbench), `Minimap`, `ReadingHint`, `MobileHint`.
- Takes slots: `reader` (the `<article class="reader">` content) and `artifacts` (the `.artifact` siblings inside `.canvas`).

### Source
- `PROTOTYPE-REFERENCE.md` §3.14, §3.15, §3.10 (case variant), §3.20, §6.7, §6.6
- `cockpit-canvas.html` lines 1075–1540 for reference JS

### Gate
No case pages exist yet — build a stub `/cockpit-stub.astro` with just the reader column wrapper (empty content) + one sticky artifact with `data-anchor="0"` to verify:
- Reader sits at `top:600px`, width responds to viewport bucket (check at 400px, 700px, 1200px, 1800px widths)
- Padding and `--reader-fs` multiplier change with viewport
- The artifact's `left` gets computed relative to the reader column edges
- Initial view is at reading scale centered on the reader top
- Wheel scroll pans DOWN through the reader
- Drag > 30px exits reading mode and shows the hint
- Press `r` to re-enter reading mode
- Cmd+scroll still zooms
- Section anchoring works: add a placeholder `.r-section` below, give an artifact `data-anchor="1"`, verify its `top` gets set to that section's offset

### Don't touch
- Don't write the full case study content yet
- Don't compose cockpit/fleet/asset pages yet

---

## Phase 7 — Case study pages

### Deliverable
Three pages: `src/pages/cockpit.astro`, `src/pages/fleet.astro`, `src/pages/asset.astro`.

Each page:
1. Imports `CaseLayout` from Phase 6
2. Puts the reader content in the `reader` slot — section-by-section, verbatim from the prototype HTML
3. Puts canvas artifacts in the `artifacts` slot — same `data-anchor` / `data-side` / `data-gap` / `data-width` values as the prototype, wired through component props

Cockpit first. Once it matches, Fleet. Then Asset.

For each page:
- **Read the prototype file top to bottom** (cockpit-canvas.html lines 599–1023 for reader + artifacts; same pattern for fleet/asset)
- **Copy the reader content** into the `reader` slot, replacing HTML tags with Phase 5 reader components. Every paragraph, pullquote, lead, body, callout, outcome item — verbatim. Including the image slots (as placeholders with the exact label/title/desc/dims/cap/capMeta from the prototype).
- **Copy the artifact list** into the `artifacts` slot. Each `<div class="... artifact" data-anchor="N" ...>` becomes a component instance with the same `data-anchor` / `data-side` / `data-gap` / `data-width` / `rotation` / `width` attributes.
- **Inline SVG content** in diagrams, printouts, and polaroids is copied verbatim as a raw slot.

Asset fix: also apply the `.context-card` CSS from Phase 5 to Asset (latent bug in prototype — §10 item 12).

### Source
- `cockpit-canvas.html`, `fleet-canvas.html`, `asset-canvas.html` — full body of each
- `PROTOTYPE-REFERENCE.md` §8 (skeleton) and §9 (copy summary)

### Gate
For each case page, open the running `/cockpit` (etc.) side-by-side with the prototype HTML. They should match:
- **Hero, meta, hero image slot** in the same position
- **Each section** (§01, §02, ...) has the same header text, same h2 or pullquote, same lead, same body paragraphs, same callout label, same image slots
- **Every canvas artifact** appears next to the correct section, at the correct side, with the correct rotation
- **Scroll behaviour** — wheel scrolls down the reader smoothly
- **Section snapping via `'r'` key** returns to the nearest top of section
- **Outcome grid** renders with Caveat numbers, ink-bordered top/bottom
- **End row** has the correct next-case link ("Next: Fleet View ↗" on cockpit; "Next: Asset Management ↗" on fleet; "Back to the workbench ↗" or similar on asset)

### Don't touch
- Don't try to add real images — placeholders are the correct state
- Don't rewrite the prose — copy exactly

---

## Final phase — Responsive / a11y / polish

After Phase 7 is visually correct:
1. **Verify all mobile breakpoints** against the prototype mobile CSS (workbench `@media(max-width:820px)`, case-study `@media(max-width:640px)`)
2. **a11y pass** — keyboard-navigable, skip links, alt text on all polaroid/image SVGs, `aria-hidden` on decorative elements (zone labels, arrows, wobble filter), reduced-motion honored
3. **Deployment prep** — build, preview, Lighthouse check, deploy to Vercel/Netlify

Not scoped here. Do it as a separate pass once the rebuild is visually correct at every phase gate.

---

## Things that will go wrong (preempt them)

1. **You'll be tempted to paraphrase a CSS value** because it looks "cleaner" or "more consistent." Don't. The prototype values were hand-tuned. Every line of CSS in `PROTOTYPE-REFERENCE.md` was copied from the prototype for a reason.

2. **You'll find a CSS inconsistency between prototype files** (e.g., `.sticky em` uses `--marker-red` on workbench but `--red` on case studies — they're different hues). Preserve it. Ask the human only if it blocks progress.

3. **You'll want to add a new component variant "while you're there."** Don't. Stay in scope. Add a TODO and finish the phase.

4. **Astro scoped CSS + pseudo-element bug** — writing `.mh-title :global(.strike::after)` does NOT work. Write `.mh-title :global(.strike)::after`. This tripped us last build.

5. **`:global()` inside scoped styles** — needed whenever you use `set:html` for content that has class hooks (`.strike`, `<em>`, etc.). Scoped CSS can't see dynamically-inserted tags unless you wrap selectors in `:global()`.

6. **Missing `--paper` token** — add it to tokens. `var(--paper) = #fbfaf4`. Used by case-study paper artifacts (reader, principle, cut, diagram). Workbench uses hardcoded `#fdf8ea`/`#fbfaf4` in places — don't touch that difference, it exists in the prototype too.

7. **Inline SVG fonts inside `<text font-family="var(--fh)">` DO NOT resolve CSS variables.** Use the literal font name: `font-family="Caveat"`.

8. **The SVG wobble filter needs to live once per page** at the document root, referenced by all arrows/doodles via `filter:url(#wobble)`. If you scope it inside a component that renders multiple times, you get duplicate `id="wobble"` and conflicts.

9. **Workbench `readerWidth` default in reader CSS is 2200px — that's a pre-JS fallback.** Actual widths are 580/720/900/1080/1160 based on viewport. Don't hardcode 2200.

10. **`img-slot` is a placeholder, not an image wrapper.** When `src` is empty, render the dashed placeholder with label/title/desc/dims inside. Only when `src` is passed should it render an `<img>`.

---

## Decision log — keep this updated

**Before you start: read `DECISIONS.md`.** All the product decisions (fonts, social URLs, email, placeholders, polaroid order) are locked. Do not re-ask. Do not decide silently.

When something non-obvious comes up during the build that isn't covered by `DECISIONS.md`, add a line here. Example:
```
Phase 2 · 2026-04-21 · Made Sticky orange and cream into separate variants rather than using inlineStyle, because basketball/manhwa backgrounds are used twice each and deserve named variants. Reversible.
```

If you hit something not in `DECISIONS.md` that the human needs to decide, stop, add it to your phase status line, and wait for an answer. Don't guess.

---

## One-line-status contract

After each phase, post this format:

```
PHASE N DONE. Gate status: [PASS/PARTIAL/BLOCKED].
Link: http://localhost:4321/<relevant-page>
Notes: [one line of anything unusual]
Waiting for: [your go-ahead to start Phase N+1 / specific human decision needed]
```

Do not start the next phase without the go-ahead.
