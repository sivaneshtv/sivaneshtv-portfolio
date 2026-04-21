# 01 · Design Language

**Purpose:** The visual DNA of the portfolio. Every font, color, shadow, radius, spacing — both the exact values used in the prototype AND the intent behind them, so you can reproduce faithfully or improve thoughtfully.

**Rule of thumb:** Exact values ship unless you have a clear rationale to deviate. If you improve (tighter contrast, better scale, cleaner type rhythm), note it in the code with a comment so future edits don't un-improve it.

---

## The governing aesthetic

**Paper on a desk, not screen on a screen.** The site looks like a designer's whiteboard — cream paper, warm beige background, handwritten marker accents, pinned artifacts with small shadows suggesting they sit on a surface. Nothing is flat in the Material Design sense; everything has slight shadow, slight rotation, slight texture.

But it's **not skeuomorphic in the bad way.** There are no fake leather stitches or faux wood. The paper textures are restrained (subtle noise overlay). The handwriting fonts are used specifically for things a person would actually handwrite (section labels, annotations, emotional beats). Body copy stays clean and digital.

**Intent over imitation.** If a color or shadow isn't pulling its weight, drop it. Don't add more "paper-y" flourish to compensate for weak content.

---

## Color system

### CSS custom properties (exact values from prototype)

```css
:root {
  /* Board — the whiteboard background */
  --board:         #e8e4db;  /* warm beige, primary canvas surface */
  --board-2:       #ddd8cd;  /* slightly darker beige, used in 135deg gradient with --board */
  --board-shadow:  rgba(40, 35, 25, 0.15);

  /* Ink — primary text colors, in three weights */
  --ink:    #1a1a1c;  /* primary — near-black, body text */
  --ink-2:  #4a4945;  /* secondary — for sub-headings, meta */
  --ink-3:  #7a7770;  /* tertiary — for eyebrow labels, deprecated info */

  /* Paper-sticky accent colors */
  --red:    #d8352a;  /* brand red — accent, principle cards, critical stamps */
  --blue:   #2b5fd8;  /* marker blue — secondary accents, info callouts */
  --yellow: #f5c84a;  /* yellow sticky background */
  --pink:   #ff8fa3;  /* pink sticky background */
  --green:  #4a9d5f;  /* green sticky background / "all nominal" states */
  --purple: #9b7cd8;  /* reserved for manhwa/evening motif */

  /* Marker colors (handwritten annotation text) */
  --marker-red:   #e84a3f;  /* slightly warmer than brand red, for "handwritten" marks */
  --marker-blue:  #3a7dd0;
  --marker-black: #2a2a2c;

  /* Tape — the strips that "hold" paper artifacts */
  --tape:    #f5e6a8;  /* yellowish masking-tape tone */
  --tape-2:  #d8d2c0;  /* greyish alternate */
}
```

### Semantic color rules

- **Body background.** Always `--board` with the `135deg, --board, --board-2` linear gradient overlaid. No flat color anywhere for board surfaces.
- **Primary text.** `--ink` on any paper surface. Never pure black (`#000`).
- **Eyebrow labels / meta / sub-headings.** `--ink-3` for tertiary info, `--ink-2` for sub-headings.
- **Brand accent (the red).** `--red` is the canonical accent. Use for:
  - Principle card borders and stamps
  - The italic ship-action treatment ("talks *ships*")
  - "CASE STUDY · 0X" labels
  - Important numbered callouts
  - `.strike` text (handwritten strike-through)
  - Cut-stamp on deferred features
- **Marker-red for handwritten marks.** When text is in Caveat/Kalam font (handwritten feel), use `--marker-red` not `--red`. The slightly warmer tone reads more like actual marker on paper.
- **Blue.** Secondary marker ink. Reserve for small annotations that don't need to compete with the red. Info/neutral callouts.
- **Sticky backgrounds.** Pink, yellow, blue, green — each associated with different emotional registers:
  - Yellow: the default warm memo (classic post-it)
  - Pink: quotes, evidence, things said by others
  - Blue: information, tools, meta-notes, easter-egg details
  - Green: receipts, outcomes, "all nominal" status, reflection
- **Basketball sticky.** Custom orange `#f28c3f` with deep brown text `#2a1400` — stands out visually as a personal/off-hours note.

### Accessibility notes

- All ink colors tested against paper backgrounds. `--ink` on `--board` hits 13:1 contrast — safe for all body copy.
- `--ink-3` (#7a7770) on `--board` is ~4.6:1 — passes AA for normal text but feels deliberately tertiary. Use only for eyebrow labels and metadata.
- `--red` (#d8352a) on `--board` is 4.5:1 — passes AA but marginal. Avoid using for long-form body text; fine for headings, accents, and single words.
- **Never put red text on pink stickies** (contrast fails). For pink stickies, use `--ink` for body and `--red` (or `--ink`) for the `em` accent, sparingly.

---

## Typography

### Font stack

Four families, each with a specific job:

```css
--fs:   'Inter', sans-serif;           /* Sans — body copy, most UI text */
--fm:   'JetBrains Mono', monospace;   /* Mono — labels, metadata, code, timestamps */
--fh:   'Caveat', cursive;             /* Handwriting — marker annotations, stickies */
--fm2:  'Kalam', cursive;              /* Handwriting alt — subheadings, pull-quotes */
```

### Where each font goes

**Inter (`--fs`)** — the workhorse. Use for:
- Body copy in the reader column of case studies
- Meta rows (role, year, scope, tools)
- Structural labels that need legibility at size

**JetBrains Mono (`--fm`)** — the machine. Use for:
- Toolbar elements ("CASE STUDY · 01", zoom %)
- Eyebrow labels on stickies and cards (`— in my own words —`)
- Timestamps and version stamps
- Diagram labels where precision matters (coordinate readouts, technical annotations)
- Font-size:10–12px · letter-spacing:.12–.18em · text-transform:uppercase

**Caveat (`--fh`)** — the handwriting. Use for:
- Sticky note body text (this is the "informal human voice")
- Marker annotations ("↓ who I actually am", "click any to open ↓")
- Principle card titles (the big signature declaration)
- Any time the designer would literally write it in marker

**Kalam (`--fm2`)** — the secondary handwriting, rounder and more "informal ink-pen" than Caveat. Use for:
- Hero sub-headline (the main tagline under the title)
- Pull-quotes in case studies
- Anywhere you want handwritten-but-not-quite-sketchy

### Type scale (reference values)

Read these as recipes, not rules. Use fluid sizing at build time (clamp() or similar).

| Element | Font | Size | Weight | Line-height | Notes |
|---|---|---|---|---|---|
| Masthead title (h1) | Inter | 96px | 700 | 0.95 | -0.035em letter-spacing |
| Case study title (h1) | Fraunces or serif | 88px | 700 | 0.95 | -0.02em letter-spacing |
| Masthead sub | Kalam | 22px | 400 | 1.45 | max-width 640px |
| Case study h2 | Inter | 36px | 700 | 1.1 | Part of reader column |
| Case study h3 | Inter | 22px | 600 | 1.3 | Section eyebrow-style headings |
| Body copy (reader) | Inter | 18px | 400 | 1.65 | 65–70ch measure |
| Principle card title | Caveat | 32–40px | 700 | 1.1 | Big enough to feel like a real statement |
| Sticky body | Caveat | 20–24px | 500 | 1.35 | Informal, legible |
| Eyebrow label | JetBrains Mono | 10–11px | 500 | 1 | tracked 0.14–0.18em, uppercase |
| Marker text | Caveat | 18–26px | 600 | 1.2 | Use with slight rotation |
| Zone label (bg) | Fraunces+Caveat | 96–120px | 500 | 1 | Faded at 12% opacity, rotated -2° to +2° |
| Meta row | JetBrains Mono | 11–12px | 400 | 1 | For "ROLE · YEAR · SCOPE · TOOLS" |
| Minimap label | JetBrains Mono | 8–9px | 500 | 1 | tracked 0.14em |

### Responsive type

All sizes scale fluidly. On mobile:
- Masthead title drops to ~56–64px
- Case study title drops to ~44–56px
- Body copy stays at 16–17px (readability floor)
- Eyebrows and metadata stay legible at 9–10px

Use `clamp()` with sensible min/max. Test on 375px-wide viewports.

---

## Spacing

Spacing follows a **multiplicative scale** loosely based on 4px steps:

```
4px · 8px · 12px · 16px · 24px · 32px · 48px · 64px · 96px · 128px · 200px · 300px · 500px
```

**Rules for canvas composition:**

- Artifacts within a cluster: 20–60px between them, often overlapping by 8–20px at corners for "whiteboard feel"
- Rows within a cluster: 120–200px apart vertically
- Between zones (About ↔ How-I-work, Hello ↔ Work): **400–600px whitespace moat.** This is sacred — don't crowd.
- Canvas padding from edge: minimum 500px from any edge to any artifact

**Rules for reader column (case studies):**

- Section spacing: 80–120px vertical between sections
- Paragraph spacing: 16–24px
- Image slot to next paragraph: 40–60px
- Reader column max-width: 720px (line length ~65ch)

---

## Shadows

Shadows simulate paper on a surface — they should be **soft, warm-tinted, and small.** Never drop a hard black shadow; it kills the paper feel.

Standard shadow stacks (compose these as needed):

```css
/* Sticky-note shadow — small, close, warm tint */
box-shadow:
  2px 3px 0 rgba(40, 35, 25, 0.04),
  4px 10px 24px rgba(40, 35, 25, 0.14);

/* Card shadow — slightly heavier, anchors the card to the surface */
box-shadow:
  1px 2px 0 rgba(40, 35, 25, 0.04),
  3px 6px 14px rgba(40, 35, 25, 0.15),
  8px 16px 32px rgba(40, 35, 25, 0.08);

/* Polaroid shadow — asymmetric, suggests the polaroid is tipped */
box-shadow:
  2px 4px 0 rgba(40, 35, 25, 0.05),
  6px 12px 24px rgba(40, 35, 25, 0.16);

/* Hover lift */
transform: translateY(-2px) rotate(var(--rotation));
box-shadow:
  3px 5px 0 rgba(40, 35, 25, 0.06),
  6px 14px 32px rgba(40, 35, 25, 0.20),
  12px 24px 48px rgba(40, 35, 25, 0.10);
```

**Rules:**
- Use multi-layer shadows (two or three `box-shadow` values comma-separated), not single `box-shadow`. Single shadows look flat and digital.
- Tint the rgba with the warm ink color `rgba(40, 35, 25, X)` not pure black `rgba(0, 0, 0, X)`. Warmer = paper.
- Keep shadow distance short (`y` offset rarely exceeds 16px) — artifacts sit on the surface, don't float far above it.

---

## Rotation, skew, and "whiteboard feel"

Every sticky, card, polaroid, and marker has a **slight rotation** (between -4° and +4°, usually -3 to +3). This is deliberate. It signals hand-placement.

**Rules:**
- No artifact at 0° unless intentional (the masthead masthead title is ~-1°; fine).
- Rotations should vary across a cluster — not all the same direction. If three stickies are clustered, do something like -3° / +2° / -4°.
- Marker annotations can go wider (-12° to +12°) because they read as truly-handwritten scribbles.
- Hover states should **reduce** rotation slightly toward 0 (like you're picking the sticky up to look at it more carefully) AND lift via translateY.

**Skew:** Use very rarely. The `.strike` text treatment uses `skewY(-3deg)` for the strikethrough bar; that's fine. Don't skew whole elements.

---

## Textures and overlays

### Board texture

The whiteboard background gets a **subtle noise overlay** via SVG filter — this keeps it from looking like a flat rectangle. Exact filter:

```css
.board-bg::before {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0.25;
  mix-blend-mode: multiply;
  pointer-events: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='2' seed='7'/><feColorMatrix values='0 0 0 0 .4  0 0 0 0 .37  0 0 0 0 .3  0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
```

Keep `opacity: 0.25` with `mix-blend-mode: multiply`. Higher opacity makes it look dirty. Lower loses the texture.

### The dot grid (canvas pattern)

The infinite canvas has a **dot grid at 28px intervals**:

```css
.canvas {
  background-image:
    radial-gradient(circle at 1px 1px, rgba(40, 35, 25, 0.22) 1px, transparent 1px);
  background-size: 28px 28px;
}
```

**Critical rules about the dot grid:**

- The dot grid lives **only on `.canvas`** — the transformable surface. Never put a dot pattern on `.board-bg` too (this was a regression we fixed: two dot patterns at different scales made a moiré).
- The canvas scales with pan/zoom — so do the dots, naturally. At zoom 0.5 the visible dots are 14px apart; at zoom 2 they're 56px. That's correct.
- 28px is chosen because it's a comfortable density at 100% zoom and still visible at 30% zoom without being aggressive.

### The corner vignette — REMOVED

**Do not add back** the `radial-gradient(ellipse 110% 90% at 50% 50%, transparent 40%, rgba(40,35,25,.18) 100%)` on `.board-bg::after`. We had it and removed it — it darkened the corners of the viewport and made it look like the dot grid "didn't reach the corners." The paper surface should be uniform across the viewport.

### Tape

Artifacts can optionally have a "tape strip" at the top — a small yellow or grey rectangle at the top edge that suggests the paper was taped to the board. Use sparingly (maybe 1 in 4 stickies has tape). Implementation:

```css
.sticky.taped::before {
  content: "";
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%) rotate(-2deg);
  width: 64px;
  height: 16px;
  background: var(--tape);
  opacity: 0.85;
  box-shadow: 0 1px 2px rgba(40, 35, 25, 0.12);
}
```

---

## Component aesthetic specifications

Detailed component specs live in `05-components.md`. Here's the aesthetic summary:

- **Sticky notes.** Square-ish paper. Background color per variant (yellow / pink / blue / green / orange). 4px border-radius. Multi-layer shadow. Slight rotation. Eyebrow label in mono at top. Body in Caveat. 260–310px wide typically.
- **Index cards (`.card`).** Cream paper `#fdf8ea` with faint ruled lines (repeating linear-gradient for lines every 28px) and a red vertical margin line 44px from the left. Padding 28px. Used for structured lists: how-I-work, about title heading.
- **Principle cards.** Paper like sticky but larger. Red hand-drawn border. Big Caveat title (40px). Smaller sub in mono. Body in Inter. These are the signature "rule" statements in each case study.
- **Context cards.** Dark paper (dark-grey `#2a2a2c`), cream text. Used for framing serious context (regulation, operational scale). Feels "different" in the right way — acknowledges the gravity.
- **Polaroids.** White paper frame with generous bottom padding for caption. Square-ish photo area. Caveat caption. Slight rotation. Hover: lifts slightly with deeper shadow. Clickable → case study.
- **Printouts.** "Browser window" chrome at top (three colored dots, URL-bar stub), then a content area with an image or SVG. Used for before/after screenshots and real-UI references.
- **Diagrams.** White paper with Caveat title + JetBrains Mono sub. Contains SVG visualization (IA, flow, hierarchy). The SVG uses a limited color palette: ink, red, occasional yellow/green/blue accents.
- **Markers.** Pure handwritten text, no paper. Color is one of marker-red / marker-blue / marker-black. Rotated significantly (up to ±12°). Used for annotations like "↓ read this" or "click any to open ↓".
- **Photo frame.** Circular or square framed photo. Thick cream paper border. Caption in mono or Caveat below.
- **Zone labels.** Huge faded backdrop words (96–120px, 12% opacity in ink color). Behind everything else in the zone. Decorative header-as-backdrop.

---

## Animation and motion

Less, but deliberate.

- **Pan inertia** on drag release: 0.92 decay factor per frame, stop when |velocity| < 0.3.
- **Zone flight** easing: `easeInOutCubic`, duration 700ms.
- **Polaroid hover**: 200ms ease-out lift.
- **Help overlay fade-in**: 400ms ease-out, initial opacity 0 → 1.
- **Reading mode transition** (enter/exit): 700ms zone-flight using the same easing.
- **Respect `prefers-reduced-motion`**: disable all non-essential motion (pan inertia can stay for direct input; zone flight becomes an instant jump; hover animations disable).

---

## Do / Don't summary

✓ **Do**
- Use the four-font stack as specified: Inter / JetBrains Mono / Caveat / Kalam
- Keep shadows multi-layer and warm-tinted
- Vary rotations across clustered artifacts
- Keep dot grid on canvas only
- Keep red as the accent, not overused
- Vary sticky backgrounds for emotional register

✗ **Don't**
- Use pure black or pure white anywhere
- Use flat single-layer shadows
- Zero-rotate all artifacts
- Add dot patterns beyond the canvas
- Use Caveat for body copy (unreadable at length)
- Bring back the corner vignette
- Skeuomorph past "paper on surface" (no fake stitching, fake staples, fake wood)
