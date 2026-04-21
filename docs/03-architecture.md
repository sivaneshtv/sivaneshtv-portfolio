# 03 · Architecture

**Purpose:** How to structure the project. File layout, stack recommendations, component boundaries, state model, routing, build/deploy.

**Philosophy:** Simple and boring wins. This is a small portfolio with 4 pages and shared interactive canvas. Resist the urge to over-engineer. The goal is a project where adding a case study takes one file and tweaking copy takes one edit.

---

## 1. Recommended stack

### Astro + TypeScript + CSS variables

**Why Astro:**
- Perfect for content-heavy multi-page sites with islands of interactivity
- Ships the smallest possible JS by default — the canvas engine can be a single client-side island
- MDX support first-class — case study prose as markdown with component embeds
- Zero config for SSG, great DX
- Built-in image optimization, view transitions API support

**Why vanilla TypeScript for the canvas engine:**
- The interactions are pure DOM/math — no reactivity needed
- React or Svelte overhead is pure tax for this workload
- TypeScript gives safety without runtime cost
- Can live as a single `CanvasEngine` class mounted as an Astro client:only island

**Why CSS variables over Tailwind:**
- The design has ~20 canonical colors and a small type/space scale — perfect for custom properties
- Tailwind's atomic classes fight the "paper-texture + shadow-stack" aesthetic (every sticky has 3 shadows + noise + rotation — verbose in atomic)
- Authoring stickies in component SFCs with scoped CSS is cleaner
- If you prefer Tailwind: fine, just map the CSS variables into `tailwind.config.js` and document it

### Alternatives briefly considered

- **Next.js** — overkill for a static portfolio. React overhead unnecessary. Use if you want to later integrate a CMS or auth.
- **SvelteKit** — great DX but the canvas engine doesn't need reactivity.
- **Raw Vite + vanilla** — minimal bundle but you'd reinvent Astro's MDX + routing. Don't.

**Final choice: Astro 4.x + TypeScript + raw CSS (with optional Tailwind overlay).**

---

## 2. Project structure

```
sivaneshtv-portfolio/
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── public/
│   ├── favicon.svg
│   ├── og-image.png                  # social preview
│   ├── fonts/                         # self-hosted font files (see §5)
│   │   ├── Inter-Variable.woff2
│   │   ├── JetBrainsMono-Variable.woff2
│   │   ├── Caveat-Variable.woff2
│   │   ├── Kalam-Regular.woff2
│   │   └── Kalam-Bold.woff2
│   └── images/
│       ├── cockpit/
│       ├── fleet/
│       ├── asset/
│       └── profile/                   # your headshot, etc.
├── src/
│   ├── content/
│   │   ├── config.ts                  # content collections schema
│   │   └── cases/
│   │       ├── cockpit.mdx
│   │       ├── fleet.mdx
│   │       └── asset.mdx
│   ├── data/
│   │   ├── workbench.ts               # workbench artifact positions + content
│   │   ├── zones.ts                   # zone definitions (shared type)
│   │   └── meta.ts                    # site meta (name, tagline, socials)
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── CanvasStage.astro      # the <div class="canvas-wrap"><div class="canvas"> wrapper
│   │   │   ├── Minimap.astro
│   │   │   ├── Toolbar.astro          # zoom in/out, fit, reading mode
│   │   │   ├── Topbar.astro           # logo + case label + clock
│   │   │   ├── HelpOverlay.astro      # one-time onboarding
│   │   │   └── engine/
│   │   │       ├── CanvasEngine.ts    # the main class (pan/zoom/clamp/minimap)
│   │   │       ├── types.ts           # Zone, ZoneBounds, PanState
│   │   │       └── mount.ts           # exposes window.__canvas for boot
│   │   ├── artifacts/
│   │   │   ├── Sticky.astro           # props: variant, width, rotation, eyebrow
│   │   │   ├── IndexCard.astro        # the card with ruled lines + red margin
│   │   │   ├── PrincipleCard.astro
│   │   │   ├── ContextCard.astro
│   │   │   ├── Polaroid.astro         # props: href, caption, meta, image/svg slot
│   │   │   ├── Printout.astro         # browser-chrome framed screenshot
│   │   │   ├── Diagram.astro          # title + sub + svg slot
│   │   │   ├── CutCard.astro          # "Cut — didn't ship" stamped card
│   │   │   ├── Marker.astro           # handwritten annotation
│   │   │   ├── ZoneLabel.astro        # big faded backdrop word
│   │   │   ├── ArrowDoodle.astro      # hand-drawn SVG arrow with optional label
│   │   │   ├── TodoList.astro         # the "what I practice" checklist card
│   │   │   ├── ContactCard.astro
│   │   │   └── Masthead.astro         # hero title + sub on the homepage
│   │   ├── icons/
│   │   │   ├── Basketball.astro       # inline SVG for basketball sticky
│   │   │   └── Manhwa.astro           # inline SVG for manhwa sticky
│   │   └── reader/
│   │       ├── ReaderColumn.astro     # the case-study reader wrapper
│   │       ├── SectionHeading.astro   # r-section-lbl + h2 + lead
│   │       ├── PullQuote.astro
│   │       ├── Callout.astro
│   │       ├── ImageSlot.astro        # hero / wide / split / square
│   │       ├── OutcomeGrid.astro      # the 3-column receipts
│   │       └── MetaRow.astro          # role/year/scope/tools
│   ├── layouts/
│   │   ├── BaseLayout.astro           # <html><head><body> + fonts + fallbacks
│   │   ├── WorkbenchLayout.astro      # board-bg + canvas-wrap wrapper for home
│   │   └── CaseLayout.astro           # board-bg + canvas-wrap wrapper for cases
│   ├── pages/
│   │   ├── index.astro                # the workbench homepage
│   │   ├── cockpit.astro              # loads cases/cockpit.mdx into CaseLayout
│   │   ├── fleet.astro
│   │   ├── asset.astro
│   │   └── [...case].astro            # optional dynamic route
│   └── styles/
│       ├── tokens.css                 # :root CSS variables (the design system)
│       ├── base.css                   # reset + base + @font-face
│       ├── artifacts.css              # shared artifact styling
│       ├── reader.css                 # reader-column specific styling
│       └── canvas.css                 # .board-bg, .canvas-wrap, .canvas, minimap
└── README.md
```

### Notes

- **Content collections** (`src/content/cases/*.mdx`) is Astro's typed content system. Each case study is an MDX file with frontmatter (role, year, scope, tools, etc.) and prose + embedded artifact components.
- **`src/data/`** is for structured data that isn't prose — artifact positions on the workbench, zone definitions, site metadata.
- **`components/canvas/engine/`** is the only place the canvas engine code lives. Imported once in the page, mounted client-side via `client:only="vanilla"` or similar.
- **Layouts are just wrappers.** They set up `<BaseLayout>` + `<canvas-wrap>` + optional chrome (minimap, toolbar). The actual content goes in page children.

---

## 3. Content model

### Case study (MDX file)

```mdx
---
slug: cockpit
title: Cockpit View 2.0
subtitle: Redesigning the primary control interface for autonomous drone operations — from the ground up.
order: 1
year: 2024
role: Lead · with Prathamesh
scope: End-to-end UX · Design system
tools: Figma · Claude · Lovable
status: shipped
---

import Sticky from '../../components/artifacts/Sticky.astro';
import PrincipleCard from '../../components/artifacts/PrincipleCard.astro';
import Diagram from '../../components/artifacts/Diagram.astro';
import Printout from '../../components/artifacts/Printout.astro';
import SectionHeading from '../../components/reader/SectionHeading.astro';
import PullQuote from '../../components/reader/PullQuote.astro';
import ImageSlot from '../../components/reader/ImageSlot.astro';

<SectionHeading eyebrow="Context" num="§ 01">
  Cockpit View is the *primary interface* operators live in all day.
</SectionHeading>

It runs entirely in a browser — no native app, no dedicated hardware — and it has to perform like both a map and a command centre simultaneously...

<Sticky variant="pink" anchor={1} offset={40} side="left" rotation={-4}>
  <slot name="eyebrow">— operator, multi-monitor setup —</slot>
  "I have Cockpit in one tab, alerts in another, video feed pinned separately. *That's my workflow.*"
</Sticky>

<PrincipleCard anchor={2} offset={20} side="right" rotation={1.5}>
  <slot name="label">the interaction rule every tool obeys</slot>
  <slot name="title">*Push* or *Overlay.* Every tool picks one.</slot>
  <slot name="body">Tools that need ambient awareness push the body...</slot>
  <slot name="attr">— the IA of a complex cockpit</slot>
</PrincipleCard>
```

### Why MDX

Prose + component embeds. The reader column stays as readable markdown. Artifacts get positioned via props — no hand-coded `style="left:Xpx; top:Ypx"` strings anywhere. The artifact positioning is handled declaratively via `anchor` + `offset` + `side` props (see §4).

### The workbench page

Not an MDX file — it's a small Astro page composing artifacts with explicit positions (since the workbench layout is a fixed composition, not a scrolling article). Positions live in `src/data/workbench.ts`:

```typescript
// src/data/workbench.ts
export const workbenchObjects = [
  {
    type: 'masthead',
    pos: { x: 2100, y: 1600 },
    rotation: -1,
    content: { eyebrow: "hey, I'm —", title: "Sivanesh TV,\na designer\nwho talks ships.", sub: "Product design for critical operations..." }
  },
  {
    type: 'sticky',
    id: 'whoIAm',
    variant: 'pink',
    pos: { x: 800, y: 1760 },
    rotation: 3,
    width: 300,
    eyebrow: '— in my own words —',
    body: 'A product designer who cares about structure more than surface...'
  },
  // ... etc
];

export const workbenchZones = {
  hello:   { cx: 2550, cy: 1900, scale: 0.60 },
  about:   { cx: 1200, cy: 2100, scale: 0.55 },
  // ...
};
```

Then `src/pages/index.astro` maps over `workbenchObjects` and renders each via the correct artifact component.

---

## 4. Artifact positioning: two strategies

The prototype uses hand-coded `style="left:Xpx; top:Ypx"` on every artifact. This is fragile. Use the following instead:

### Workbench (fixed composition)

Positions are explicit in `src/data/workbench.ts` (as above). The page renders each artifact with `style={transform: translate(${pos.x}px, ${pos.y}px) rotate(${rotation}deg)}`. Editing = one file.

### Case studies (anchored to sections)

Case study artifacts anchor to sections in the reader column. This lets you write the article in order and have artifacts auto-position alongside the relevant section.

**The anchor system:**

```typescript
interface ArtifactAnchorProps {
  anchor: number;        // section index (0 = hero, 1 = §01, 2 = §02, ...)
  offset?: number;       // pixels below the section's top; negative = above
  side: 'left' | 'right'; // which side of the reader column
  gap?: number;          // pixels between reader column and artifact (default 60)
  width?: number;        // artifact width
}
```

On page hydration, after reader column renders:

```typescript
function refreshAnchorTargets(): void {
  const sections = document.querySelectorAll('.reader [data-section-index]');
  const sectionTops = Array.from(sections).map(s => (s as HTMLElement).offsetTop);

  document.querySelectorAll('[data-anchor]').forEach((el: HTMLElement) => {
    const anchor = parseInt(el.dataset.anchor!);
    const offset = parseInt(el.dataset.anchorOffset || '0');
    const side = el.dataset.side;
    const gap = parseInt(el.dataset.gap || '60');
    const width = parseInt(el.dataset.width || el.offsetWidth.toString());

    const readerRect = document.querySelector('.reader')!.getBoundingClientRect();
    const readerLeft = (document.querySelector('.reader') as HTMLElement).offsetLeft;
    const readerRight = readerLeft + readerRect.width;

    let x: number;
    if (side === 'left') {
      x = readerLeft - gap - width;
    } else {
      x = readerRight + gap;
    }
    const y = (sectionTops[anchor] ?? 0) + offset;

    el.style.transform = `translate(${x}px, ${y}px) rotate(${el.dataset.rotation || 0}deg)`;
  });
}
```

Run this:
- Once on boot (after layout)
- On window resize
- On content hydration if MDX loads async

This means adding an artifact to a case = just adding a component with `anchor={3} offset={40} side="right"` — no coordinate math. The engine handles positioning.

---

## 5. Fonts

### Self-host via woff2

Don't use Google Fonts CDN. Performance penalty from cross-origin + render-blocking is real. Download once, host in `public/fonts/`, declare via `@font-face`:

```css
/* src/styles/base.css */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/JetBrainsMono-Variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Caveat';
  src: url('/fonts/Caveat-Variable.woff2') format('woff2-variations');
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Kalam';
  src: url('/fonts/Kalam-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Kalam';
  src: url('/fonts/Kalam-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

### Font preloading

Preload the two most-critical fonts (Inter and JetBrains Mono) in the `<head>`:

```html
<link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/JetBrainsMono-Variable.woff2" as="font" type="font/woff2" crossorigin />
```

Caveat and Kalam load via font-display: swap.

### Font file sources

- Inter: https://github.com/rsms/inter (variable)
- JetBrains Mono: https://www.jetbrains.com/lp/mono/ (variable)
- Caveat: https://fonts.google.com/specimen/Caveat (variable — download from gfonts)
- Kalam: https://fonts.google.com/specimen/Kalam (weights 400 & 700)

All open-source, free to self-host.

---

## 6. Responsive design

### Breakpoints

Use these throughout the CSS:

```css
/* src/styles/tokens.css */
:root {
  --bp-mobile:      420px;   /* phones */
  --bp-mobile-lg:   640px;   /* large phones / small tablets portrait */
  --bp-tablet:      900px;   /* tablets */
  --bp-laptop:      1100px;  /* small laptops */
  --bp-desktop:     1440px;  /* desktops */
}
```

### Key mobile adaptations

1. **Canvas unchanged** — the canvas is still 6000×4200 / 5000×6800. What changes is how the user navigates it: default zoom is lower on mobile, reading-mode column fills 94% of viewport, etc.

2. **Reading mode Y-bias** — see `02-interaction-spec.md` §11. Mobile needs content to sit above optical center.

3. **Help overlay copy differs on touch devices** — say "pinch to zoom · drag to pan" instead of "Cmd+scroll to zoom".

4. **Toolbar compacts on mobile** — hide zoom %, keep icon buttons only. Minimap shrinks from 160×112 to 96×68.

5. **Topbar compacts** — collapse "— the workbench" subtitle on < 640px. Case-study topbar keeps the back-arrow + case label; drops the clock.

6. **Case study reader**: column width fluid via clamp(580px, 82vw, 720px). Padding on the column scales down on mobile (reduce from 80px to 40px at small viewports).

### Mobile-only UI additions

Add a **mobile hint** that appears the first time a touch is detected:

```html
<div class="mobile-hint" aria-live="polite">pinch to zoom · drag to pan</div>
```

Fade in after 800ms, fade out after 4s. Only show once per session.

---

## 7. Performance

### Budgets

- **Total JS on workbench page:** < 15 KB compressed
- **Total CSS:** < 20 KB compressed
- **LCP on 3G mobile:** < 2.5s
- **TBT:** < 100ms
- **FID:** < 50ms

### Techniques

1. **Astro's default SSG** — pages prerendered, ship HTML.
2. **Canvas engine as `client:only`** — the single JS payload.
3. **No client-side router** — multi-page navigation via hard page loads (but optionally enable View Transitions API for smooth fades between pages).
4. **Inline critical CSS** into the `<head>` for each page. Astro does this for scoped styles.
5. **Image optimization** — use Astro's `<Image>` component for all screenshots. AVIF + WebP fallback + lazy-load.
6. **Font subsetting** — if bundle size is tight, subset Caveat and Kalam to Latin only. Save ~40 KB per font.
7. **Cache headers**: fonts 1 year, HTML 1 hour, CSS/JS 1 day (content-hashed names from Astro).

---

## 8. Accessibility

### Hard requirements

- **Every case study must be readable as a linear article** via keyboard + screen reader. The canvas is enhancement, not prerequisite.
- **Keyboard-only users** can navigate: Tab through the reader column, Tab through the topbar (nav, back button), access the toolbar, access polaroid links.
- **Focus indicators** on all interactive elements. Custom styling is fine but visible contrast ratio ≥ 3:1.
- **Color contrast** — all text ≥ 4.5:1 (AA). Display text (≥ 24px or ≥ 19px bold) can be ≥ 3:1.
- **Alt text on all images** — polaroid thumbnail descriptions, case study screenshots, icons.
- **aria-labels** on icon buttons (zoom in/out, fit, reading mode).
- **Reduced motion respected** — see interaction spec.
- **Semantic HTML** in the reader: `<article>` wrapping, `<section>` per section with `<h2>`, `<figure>` for image slots.

### Screen reader hints

Add a `<nav aria-label="Page sections">` as a first child of the reader column with skip links to each section. Visually hidden but accessible:

```html
<nav aria-label="Page sections" class="sr-only">
  <a href="#section-01">Context</a>
  <a href="#section-02">The problem</a>
  <!-- ... -->
</nav>
```

### Canvas role

The canvas is decorative / enhancement. Set `aria-hidden="true"` on the canvas wrapper IF all content is also present in the reader column and the linear fallback is complete. If not, the canvas must be accessible too.

For the workbench (homepage), the canvas IS the content. Provide an alternate accessible view: a plain linear HTML with sections that is displayed to screen readers (`class="sr-only"` for sighted users).

---

## 9. SEO

- Per-page `<title>` and `<meta description>` from frontmatter
- Open Graph + Twitter meta
- `og:image` per page (generate case study OG images via Astro's image generation)
- Structured data: `schema.org/Person` on homepage, `schema.org/CreativeWork` per case
- Sitemap auto-generated via `@astrojs/sitemap`
- Robots.txt allowing all, sitemap reference

---

## 10. Deployment

### Recommended

- **Host**: Vercel or Netlify or Cloudflare Pages. All support Astro natively.
- **Custom domain**: `sivanesh.tv` or similar.
- **HTTPS**: automatic.
- **Analytics**: Plausible (preferred for privacy) or Vercel Analytics.
- **Build command**: `npm run build`
- **Output dir**: `dist/`

### CI

Minimal GitHub Actions workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push: { branches: [main] }
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - run: npm run test        # type-check + any unit tests
      # Vercel/Netlify handle deployment on push to main
```

---

## 11. Testing

### Don't over-test. Do test:

- **Type-check** on CI: `tsc --noEmit`
- **Canvas engine unit tests** — the math is pure, test `clampTranslate`, `zoomAt`, screen-to-canvas conversion with known inputs. Use Vitest.
- **A11y audit** via axe-core or Playwright + axe on every page. Block PR on regressions.
- **Visual regression** (optional) — Playwright screenshots per breakpoint. Useful if the design is stable; skip during active iteration.

### Skip:

- E2E clicking through polaroids etc. Slow, low-value.
- Unit tests on every component.

---

## 12. Development workflow

```bash
# Install
npm create astro@latest
# Choose: Empty template, TypeScript strict

# Add MDX support
npx astro add mdx

# Add image optimization
npx astro add image

# Add sitemap
npx astro add sitemap

# Dev
npm run dev     # starts on localhost:4321

# Type-check
npm run check

# Build
npm run build

# Preview production build
npm run preview
```

---

## 13. State model

Strictly local. No global state manager needed.

### Canvas state (per-page)

Owned by `CanvasEngine`. Not exposed to components. Components dispatch actions via the engine:

```typescript
// Somewhere in a component that mounts the canvas
import { CanvasEngine } from './engine/CanvasEngine';

const engine = new CanvasEngine({
  canvasEl: document.querySelector('.canvas')!,
  canvasWrap: document.querySelector('.canvas-wrap')!,
  minimap: document.querySelector('.minimap')!,
  minimapCanvas: document.querySelector('.minimap-canvas')!,
  minimapViewport: document.querySelector('.minimap-viewport')!,
  zones: workbenchZones,
  zoneBounds: workbenchZoneBounds,
  canvasWidth: 6000,
  canvasHeight: 4200,
  readingMode: false, // homepage: false, cases: true
});

// Expose for dev tools and shortcut handlers
if (typeof window !== 'undefined') {
  (window as any).__canvas = engine;
}

// Nav button clicks
document.querySelectorAll('[data-zone]').forEach(btn => {
  btn.addEventListener('click', () => {
    engine.goToZone(btn.dataset.zone!);
  });
});
```

### UI state

- **Help overlay shown?** sessionStorage `sivanesh.helpSeen`
- **Nav menu open?** local component state (Astro's `transition:persist` or vanilla `.classList.toggle`)
- **Reading mode on?** instance state on `CanvasEngine`, no external sync needed

No global store. No Redux. No context providers. Small site, local state.

---

## 14. What NOT to do

- ❌ Don't use React/Vue/Svelte for the canvas. Vanilla TS is cleaner.
- ❌ Don't use a client-side router. Astro's MPA mode is faster and simpler.
- ❌ Don't import heavy animation libraries (Framer Motion, GSAP). The canvas uses rAF + CSS transforms; that's enough.
- ❌ Don't put analytics or A/B testing in v1. Ship first.
- ❌ Don't CDN-load Google Fonts. Self-host.
- ❌ Don't reproduce the prototype's single-file-HTML structure.
- ❌ Don't reproduce the prototype's hand-placed absolute positions in JSX. Use the workbench data file OR the section-anchor system.

---

## 15. Open technical decisions flagged for you

1. **Do we need View Transitions API for page-to-page fades?** Nice polish but adds complexity. Defer unless cheap to add.
2. **Do we provide a `?linear=1` query param** that shows the plain linear article view instead of the canvas? Good accessibility win but non-trivial. Probably yes for case studies.
3. **Do polaroids on the workbench link via a full page navigation or open in an overlay?** Prototype does full page navigation. Overlay would be flashier but harder to SSR. Recommend: full page, with View Transitions for polish.
4. **Do we persist the user's pan/zoom position on page reload?** Probably no — the help overlay already covers re-onboarding. Skip.
