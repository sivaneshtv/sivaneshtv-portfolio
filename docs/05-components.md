# 05 · Components — The Artifact Palette

**Purpose:** Every reusable artifact that lives on the canvas or in the reader column. Props, variants, CSS reference values, and clear "when to use this vs that" semantics.

**Style:** Each component section has: (1) what it is, (2) when to use, (3) when NOT to use, (4) props, (5) example usage, (6) CSS reference with exact values from the prototype, (7) any gotchas.

**Convention:** All components are Astro `.astro` SFCs with scoped styles. Shared styles live in `src/styles/artifacts.css`.

---

## A. Core canvas artifacts (pinned to board)

### 1. Sticky

**What:** A square-ish paper note pinned to the board. The most versatile artifact. Has colored variants, optional tape, handwritten body copy, an eyebrow label in mono.

**When to use:**
- Quotes from users ("the question that doesn't have an answer")
- Observations and notes
- Personal voice bits (the About zone stickies)
- Receipts (small outcome callouts: "M1 live · 1000+ assets")
- Principles in miniature (if it doesn't need the full Principle Card weight)

**When NOT to use:**
- As a heading for a zone — use `ZoneLabel` instead
- For long prose (>60 words) — use `IndexCard` or move to reader column
- For structural rules the whole case hinges on — that's `PrincipleCard` territory

#### Props

```typescript
interface StickyProps {
  variant?: 'yellow' | 'pink' | 'blue' | 'green' | 'orange';  // default: 'yellow'
  width?: number;        // default: 260
  rotation?: number;     // degrees, typically -4 to +4; default: 0 (but vary per instance)
  tape?: boolean;        // default: false (add tape strip at top)
  eyebrow?: string;      // optional label above body
  // Positioning — use one of:
  pos?: { x: number; y: number };                     // workbench — explicit
  anchor?: number; offset?: number; side?: 'left'|'right'; gap?: number;  // case study — section-anchored
}
```

#### Example usage

```astro
---
// Workbench position-based
<Sticky variant="pink" pos={{x: 800, y: 1810}} rotation={3} width={300} eyebrow="— in my own words —">
  A product designer who cares about <em>structure</em> more than surface. Happiest when the problem is fuzzy, the stakes are real, and the answer is a rule — not a mood board.
</Sticky>

// Case study anchor-based
<Sticky variant="pink" anchor={1} offset={40} side="left" gap={60} rotation={-4} width={300} eyebrow="— the question that doesn't have an answer —">
  <em>"When was wellhead NC-0217 last inspected?"</em><br /><br />She gets asked this every week. She spends thirty minutes every week finding out.
</Sticky>
```

#### CSS reference

```css
.sticky {
  position: absolute;
  min-height: 200px;
  padding: 24px 22px 20px;
  font-family: var(--fh);              /* Caveat */
  font-weight: 500;
  font-size: 21px;
  line-height: 1.35;
  color: var(--ink);
  background: var(--yellow);           /* default */
  border-radius: 1px;                  /* almost square */
  box-shadow:
    2px 4px 0 rgba(40, 35, 25, 0.05),
    4px 8px 16px rgba(40, 35, 25, 0.18),
    inset 0 0 40px rgba(255, 255, 255, 0.2);  /* subtle inner lift */
}

.sticky-eyebrow {
  font-family: var(--fm);              /* JetBrains Mono */
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 8px;
}

.sticky em {
  font-style: normal;
  color: var(--marker-red);
  font-weight: 700;
}

/* Optional tape */
.sticky.taped::before {
  content: "";
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%) rotate(-3deg);
  width: 80px;
  height: 20px;
  background: var(--tape);
  opacity: 0.85;
  box-shadow: 0 2px 4px rgba(40, 35, 25, 0.1);
}

/* Variants */
.sticky.pink   { background: var(--pink); }    /* #ff8fa3 */
.sticky.blue   { background: #a8d0f0; }         /* note: lighter than --blue for paper legibility */
.sticky.green  { background: #b5e0b5; }         /* ditto */
.sticky.orange { background: #f28c3f; color: #2a1400; }  /* custom — used for basketball */
```

#### Gotchas

- **em treatment is the signature style** — red italic-looking but normal style, font-weight 700. Do not break this.
- **Blue sticky uses #a8d0f0, not --blue.** The saturated `--blue` (#2b5fd8) is for ink/accent text, not backgrounds. Paper backgrounds are lighter tints.
- **Orange sticky darkens text.** Use `color: #2a1400` for the basketball sticky body — plain `--ink` fails contrast on orange.
- **Min-height 200px** means very short stickies still have presence. Don't remove.

---

### 2. IndexCard

**What:** A cream-paper card with faint blue ruled lines and a red vertical margin line (like a real index card). Fixed width 420px. Used for structured content: title + sub + list-rows.

**When to use:**
- The "How I actually work" card on the workbench (title + typical-week list)
- A case study hero/context card if you want structured life-stats or a mini-table
- Any place you'd otherwise reach for a real `<table>` on a small card

**When NOT to use:**
- For flowing prose (stickies or reader column work better)
- As a heading — the card IS the content

#### Props

```typescript
interface IndexCardProps {
  width?: number;         // default 420, rarely changed
  rotation?: number;      // typically -2 to +2
  title: string;          // the main card title (supports em markup)
  sub?: string;           // the "— typical week —" kind of label
  rows?: Array<{ label: string; value: string }>;  // optional list
  // Positioning as above
}
```

#### Example usage

```astro
<IndexCard pos={{x: 1300, y: 3230}} rotation={-1.5}
  title="how <em>I</em> actually work"
  sub="— typical week —"
  rows={[
    { label: "Sit close to CS + PM", value: "calls, transcripts" },
    { label: "Turn findings into structure", value: "IA, flows, rules" },
    { label: "Prototype in the real tool", value: "Figma → Lovable → code" },
    { label: "Pair with engineering", value: "daily, ship weeks" },
    { label: "Deep work", value: "<em>10:00 – 14:00 IST</em>" },
    { label: "Collab hours", value: "15:00 – 18:00 IST" },
  ]}
/>
```

#### CSS reference

```css
.card {
  position: absolute;
  width: 420px;
  padding: 28px 28px 24px;
  background: #fdf8ea;                    /* cream paper */
  font-family: var(--fs);
  font-size: 14px;
  line-height: 1.55;
  color: var(--ink);
  box-shadow:
    1px 2px 0 rgba(40, 35, 25, 0.04),
    3px 6px 14px rgba(40, 35, 25, 0.15),
    8px 16px 32px rgba(40, 35, 25, 0.08);

  /* Ruled lines — every 28px */
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 27px,
    rgba(43, 95, 216, 0.18) 27px,    /* faint blue line */
    rgba(43, 95, 216, 0.18) 28px
  );
  background-position: 0 54px;        /* offset so first line lands under the heading */
}

.card::before {
  content: "";
  position: absolute;
  left: 44px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(216, 53, 42, 0.35);  /* faint red margin line */
}

.card-title {
  font-family: var(--fh);             /* Caveat */
  font-weight: 700;
  font-size: 32px;
  line-height: 1;
  color: var(--ink);
  margin-bottom: 8px;
  letter-spacing: -0.01em;
}

.card-sub {
  font-family: var(--fm);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 18px;
}

.card-list { display: flex; flex-direction: column; gap: 1px; margin-top: 8px; }
.card-list-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px dashed rgba(40, 35, 25, 0.1);
}
.card-list-row:last-child { border-bottom: none; }
.card-list-row span:first-child  { color: var(--ink-2); }
.card-list-row span:last-child   { color: var(--ink); font-weight: 500; }

.card em { font-style: italic; color: var(--marker-red); font-weight: 600; }
```

#### Gotchas

- **The red margin line** is the visual signature. Don't drop it.
- **Ruled lines every 28px** — matches the canvas dot grid spacing. Don't change.
- **em inside `.card` is italic** (unlike in `.sticky` where em is not italic). Different register — the card is "printed," the sticky is "handwritten."

---

### 3. PrincipleCard

**What:** The signature rule that anchors a case study. Paper card, larger than a sticky, with a big Caveat title and red hand-drawn border. These are the quotes that a reader should remember.

**When to use:**
- Each case study has 1–3 principle cards marking key structural decisions
- Examples: *"Push or Overlay"* (Cockpit), *"Grouping, not filtering"* (Fleet), *"Everything else FlytBase had built was about the flight. This one was about the asset."* (Asset)

**When NOT to use:**
- For minor observations — use a sticky
- On the workbench — principle cards belong in case studies

#### Props

```typescript
interface PrincipleCardProps {
  width?: number;            // default 420
  rotation?: number;
  label: string;             // the small label above ("— the interaction rule every tool obeys —")
  title: string;             // the big declaration, supports em
  body?: string;             // optional elaboration paragraph
  attribution?: string;      // optional signature below ("— the IA of a complex cockpit")
  anchor, offset, side, gap // case study positioning
}
```

#### Example usage

```astro
<PrincipleCard
  anchor={2} offset={20} side="right" gap={60}
  rotation={1.5}
  width={420}
  label="the interaction rule every tool obeys"
  title="<em>Push</em> or <em>Overlay.</em> Every tool picks one."
  body="Tools that need ambient awareness push the body to make room (flight plan, pilot list). Tools that need focused attention overlay with scrim and dismiss on outside click (checklist, alert detail)."
  attribution="— the IA of a complex cockpit"
/>
```

#### CSS reference

```css
.principle-card {
  position: absolute;
  padding: 32px 28px 28px;
  background: #fdf8ea;
  border: 2px solid var(--marker-red);
  border-radius: 2px;
  box-shadow:
    2px 4px 0 rgba(40, 35, 25, 0.06),
    6px 12px 24px rgba(40, 35, 25, 0.18);
  /* Slight paper rotation is applied via transform in JS */
}

.principle-label {
  font-family: var(--fm);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--marker-red);
  margin-bottom: 12px;
}

.principle-title {
  font-family: var(--fh);
  font-weight: 700;
  font-size: 40px;
  line-height: 1.05;
  color: var(--ink);
  margin-bottom: 16px;
}

.principle-title em {
  font-style: italic;
  color: var(--marker-red);
}

.principle-body {
  font-family: var(--fs);
  font-size: 15px;
  line-height: 1.55;
  color: var(--ink-2);
  margin-bottom: 16px;
}

.principle-attr {
  font-family: var(--fm);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-3);
  font-style: italic;
}
```

#### Gotchas

- **The red border** is what signals "this is a rule." Don't swap to another color.
- **Title at 40px** — big, commanding. Don't downscale for less-important principles; if it's a less-important principle, make it a sticky.

---

### 4. ContextCard

**What:** Dark-paper card. Cream text on near-black background. Gravitas.

**When to use:**
- Framing serious operational or regulatory context at the top of a case
- Examples: *"45 wellheads. 15 square miles. One Operations Manager."* in Asset. The *"CAA one-to-many waivers"* context in Fleet.
- One per case, in §01 typically. More than one gets heavy.

**When NOT to use:**
- For anything personal or lighter — use a sticky
- For rules — use a PrincipleCard

#### Props

```typescript
interface ContextCardProps {
  width?: number;            // default 380
  rotation?: number;
  label: string;             // small label at top ("— the operational reality —")
  title: string;             // the main statement, supports em
  body?: string;             // elaboration
  anchor, offset, side, gap
}
```

#### CSS reference

```css
.context-card {
  position: absolute;
  padding: 28px 28px 24px;
  background: #2a2a2c;
  color: #f5ede0;
  border: 1px solid rgba(245, 237, 224, 0.1);
  box-shadow:
    2px 4px 0 rgba(0, 0, 0, 0.15),
    6px 12px 24px rgba(40, 35, 25, 0.3);
}

.context-lbl {
  font-family: var(--fm);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(245, 237, 224, 0.6);
  margin-bottom: 12px;
}

.context-title {
  font-family: var(--fs);
  font-weight: 600;
  font-size: 24px;
  line-height: 1.2;
  color: #f5ede0;
  margin-bottom: 12px;
  letter-spacing: -0.01em;
}

.context-title em {
  font-style: italic;
  color: var(--marker-red);
  font-weight: 700;
}

.context-body {
  font-family: var(--fs);
  font-size: 13px;
  line-height: 1.55;
  color: rgba(245, 237, 224, 0.75);
}
```

#### Gotchas

- The dark card is a **tonal counterpoint** — it only works because the rest is bright paper. If you find yourself using it more than once per case, you're overusing it.
- **The label text is cream at 60% opacity**, not a different color. Uniformity matters.

---

### 5. Polaroid

**What:** A rectangular white paper frame with a photo area at top and a caption area at bottom. Signature "holds an image." On the workbench, each polaroid is a CLICKABLE LINK to a case study.

**When to use:**
- The work-index on the workbench — one polaroid per case study
- Anywhere you want "here's what the thing looked like" with a light, personal frame

**When NOT to use:**
- For system screenshots with browser chrome — use `Printout` instead
- For non-photographic content — use `Diagram` or `Sticky`

#### Props

```typescript
interface PolaroidProps {
  href?: string;            // if set, the polaroid is an <a> tag linking to this URL
  imageSrc?: string;        // the photo area src; use slot for SVG
  caption: string;          // "Cockpit View 2.0" — supports em
  meta?: string;            // "2024 · Drone Autonomy"
  rotation?: number;
  pos?: { x: number; y: number };
}
```

#### Example usage

```astro
<Polaroid
  href="/cockpit"
  pos={{x: 3500, y: 1700}}
  rotation={-3}
  caption="Cockpit View <em>2.0</em>"
  meta="2024 · Drone Autonomy"
>
  <!-- Slot: SVG illustration of a radar/HUD -->
  <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="300" fill="#1a1a1c"/>
    <!-- ... -->
  </svg>
</Polaroid>
```

#### CSS reference

```css
.polaroid {
  position: absolute;
  display: block;
  width: 260px;
  padding: 12px 12px 48px;              /* bottom padding for caption */
  background: #fdf8ea;
  box-shadow:
    2px 4px 0 rgba(40, 35, 25, 0.05),
    6px 12px 24px rgba(40, 35, 25, 0.16);
  text-decoration: none;
  color: inherit;
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
  cursor: pointer;
}

.polaroid:hover {
  transform: translateY(-4px) rotate(var(--rotation, 0deg));  /* reduces rotation toward 0 */
  box-shadow:
    3px 5px 0 rgba(40, 35, 25, 0.06),
    10px 20px 40px rgba(40, 35, 25, 0.22);
}

.polaroid-img {
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #1a1a1c;
  margin-bottom: 14px;
}

.polaroid-img svg,
.polaroid-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.polaroid-caption {
  font-family: var(--fh);
  font-size: 22px;
  font-weight: 600;
  color: var(--ink);
  text-align: center;
  line-height: 1.2;
  padding: 0 8px;
}

.polaroid-caption em {
  color: var(--marker-red);
  font-style: italic;
}

.polaroid-meta {
  font-family: var(--fm);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-3);
  text-align: center;
  margin-top: 4px;
}
```

#### Gotchas

- **Click handler bypass:** Because the canvas wrap has a pointer handler that might bail on drag, make sure the polaroid receives clicks. The engine's drag-bail logic (see `02-interaction-spec.md` §6) already handles this — polaroid has `class="polaroid"` which is in the bail list.
- **Hover lift reduces rotation:** The polaroid's default rotation should decrease toward 0 on hover ("picking it up to look"). This is a subtle but important signal.
- **Caption sits in the bottom white strip**, not on the photo. Don't change this — it's the polaroid convention.

---

### 6. Printout

**What:** A paper artifact simulating a browser-window screenshot. Has a "chrome" at the top (three dots + URL bar) then the actual screenshot below.

**When to use:**
- Real product screenshots in case studies
- Anything that is "the actual UI" — distinct from hand-drawn diagrams

**When NOT to use:**
- For hand-drawn exploration — use `Diagram`
- For personal photos — use `Polaroid`

#### Props

```typescript
interface PrintoutProps {
  url?: string;             // the fake URL bar text
  sectionRef?: string;      // "§ 01" label in the URL bar
  width?: number;           // default 580
  rotation?: number;
  imageSrc?: string;
  label?: string;           // caption below the printout
  labelMeta?: string;       // small meta ("screenshot, v2.0 beta")
  anchor, offset, side, gap
}
```

#### CSS reference

```css
.printout {
  position: absolute;
  background: #fdf8ea;
  padding: 0 0 18px;
  box-shadow:
    2px 4px 0 rgba(40, 35, 25, 0.05),
    6px 12px 24px rgba(40, 35, 25, 0.16);
}

.printout-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(40, 35, 25, 0.04);
  border-bottom: 1px solid rgba(40, 35, 25, 0.08);
}

.printout-dots {
  display: flex;
  gap: 6px;
}
.printout-dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.printout-dots span:nth-child(1) { background: #fb605a; }
.printout-dots span:nth-child(2) { background: #fdbe40; }
.printout-dots span:nth-child(3) { background: #35cd4a; }

.printout-url {
  flex: 1;
  font-family: var(--fm);
  font-size: 11px;
  color: var(--ink-3);
  padding: 4px 10px;
  background: var(--board);
  border-radius: 3px;
  letter-spacing: 0.05em;
}

.printout-frame {
  background: #fdf8ea;
  padding: 4px;
}
.printout-frame svg,
.printout-frame img {
  width: 100%;
  display: block;
}

.printout-label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 12px 16px 0;
  font-family: var(--fh);
  font-size: 18px;
  color: var(--ink);
}

.printout-label em {
  color: var(--marker-red);
  font-style: italic;
}

.printout-label small {
  font-family: var(--fm);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-3);
}
```

---

### 7. Diagram

**What:** A white paper artifact with a handwritten title + mono sub + an SVG visualization. For hand-drawn IA, flow, hierarchy, shift diagrams.

**When to use:**
- Illustrating structure (the 4 Layer 0 components in Fleet; the flight-first vs asset-first shift diagram in Asset; the push-vs-overlay IA in Cockpit)
- Any time the point is visual logic, not a screenshot

**When NOT to use:**
- For real UI — that's `Printout`
- For trivial annotations — that's `Marker` or a sticky

#### Props

```typescript
interface DiagramProps {
  title: string;
  sub?: string;
  rotation?: number;
  width?: number;         // default 480
  anchor, offset, side, gap
  // Children: the SVG visualization itself via slot
}
```

#### CSS reference

```css
.diagram {
  position: absolute;
  padding: 20px 20px 16px;
  background: #fdf8ea;
  box-shadow:
    2px 4px 0 rgba(40, 35, 25, 0.05),
    6px 12px 24px rgba(40, 35, 25, 0.16);
}

.diagram-title {
  font-family: var(--fh);
  font-weight: 700;
  font-size: 22px;
  color: var(--ink);
  margin-bottom: 2px;
  line-height: 1.1;
}

.diagram-title em { color: var(--marker-red); font-style: italic; }

.diagram-sub {
  font-family: var(--fm);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 12px;
}

.diagram-svg {
  background: transparent;
  width: 100%;
  height: auto;
  display: block;
}
```

#### Gotchas

- **Palette discipline in the SVG:** Use only the ink colors (`#1a1a1c`, `#4a4945`, `#7a7770`) plus `--marker-red` and `--marker-blue`. Limit green/yellow/purple to special state indicators. Over-colored diagrams look cartoonish.
- **SVG text uses Caveat or JetBrains Mono**, not Inter. Caveat for concept labels; mono for coordinates, IDs, technical annotations.

---

### 8. Marker (handwritten annotation)

**What:** Pure handwritten text on the board. No paper. Rotated to look hand-scribbled. Used for arrows, tiny annotations, directional hints.

**When to use:**
- "↓ who I actually am" kind of annotations
- "click any to open ↓" hint
- "↖ this is what gets shipped"
- "drag around to explore →" onboarding cues

**When NOT to use:**
- For anything longer than ~6 words — use a sticky
- For structural statements — use a PrincipleCard
- If it needs to be read by a screen reader (put in an accessible `aria-live` region instead)

#### Props

```typescript
interface MarkerProps {
  variant?: 'red' | 'blue' | 'black';   // default 'red'
  size?: 'sm' | 'md' | 'lg';            // default 'md'
  rotation?: number;                     // often bigger than other artifacts: -12 to +12
  pos?: { x: number; y: number };
  anchor, offset, side, gap, width
}
```

#### CSS reference

```css
.marker {
  position: absolute;
  font-family: var(--fh);
  font-weight: 600;
  line-height: 1.2;
  color: var(--marker-red);
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
}

.marker.sm { font-size: 16px; }
.marker.md { font-size: 22px; }
.marker.lg { font-size: 28px; }

.marker.red   { color: var(--marker-red); }
.marker.blue  { color: var(--marker-blue); }
.marker.black { color: var(--marker-black); }
```

#### Gotchas

- **`pointer-events: none`** — markers should never intercept pan drags. They're decorative.
- **Rotations go wider:** markers can rotate ±12° (vs artifacts at ±4°). They're sketchy hand-scribbles, they should feel loose.

---

### 9. ZoneLabel

**What:** A huge faded word that sits as a backdrop for a zone. "— hello —", "the work", "how I work", "say hi". At 12% opacity in ink color — it reads as texture, not content.

**When to use:**
- Each zone on the workbench has one
- As a backdrop header for a section you want named but without a real heading element

**When NOT to use:**
- For real page-level headings (those should be semantic `<h1>`, `<h2>`)
- If the zone is tight for space — the label is decorative, drop it before dropping content

#### Props

```typescript
interface ZoneLabelProps {
  pos: { x: number; y: number };
  size?: number;          // default 96
  rotation?: number;      // typically -2 to +2
  children: any;          // text content, may contain <em>
}
```

#### CSS reference

```css
.zone-label {
  position: absolute;
  font-family: var(--fs);
  font-weight: 700;
  font-size: 96px;         /* overridable inline */
  letter-spacing: -0.02em;
  color: rgba(40, 35, 25, 0.12);   /* faded */
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
}

.zone-label em {
  font-style: italic;
  color: rgba(216, 53, 42, 0.18);  /* faded red for emphasis word */
}
```

#### Gotchas

- **Opacity is deliberate and critical** — 12% on ink, 18% on red. Any darker and the label competes with content.
- **Not a heading semantically.** Never use as a real `<h1>`/`<h2>`. If you need a real heading, add a separate heading with `class="sr-only"`.

---

### 10. ArrowDoodle

**What:** A hand-drawn SVG arrow connecting two points. Curves, slight wobble filter, a small arrowhead. Optional handwritten text label adjacent to (not on) the path.

**When to use:**
- "the work →" arrow from masthead pointing at polaroids
- "say hi →" arrow from section label pointing at contact card
- Connecting a principle card to the diagram it describes
- Linking a pull-quote to the person who said it (on case studies)

**When NOT to use:**
- To "decorate." Arrows that don't connect two meaningful things look cheap. Every arrow should have a semantic "from X to Y" claim.

#### Props

```typescript
interface ArrowDoodleProps {
  pos: { x: number; y: number };  // top-left of the SVG viewport
  width: number;
  height: number;
  path: string;                    // SVG path "M x1 y1 Q cx cy x2 y2"
  label?: string;                  // optional handwritten text
  labelPos?: { x: number; y: number; rotation?: number };  // position of label relative to SVG
  color?: 'red' | 'blue' | 'black';
  wobble?: boolean;                // apply turbulence filter for hand-drawn feel
}
```

#### CSS reference & SVG pattern

```css
.arrow-doodle {
  position: absolute;
  pointer-events: none;
}
```

```astro
<svg class="arrow-doodle" viewBox={`0 0 ${width} ${height}`} style={`left:${pos.x}px; top:${pos.y}px; width:${width}px; height:${height}px`}>
  <path d={path} stroke={strokeColor} stroke-width="3" fill="none" stroke-linecap="round"
        style={wobble ? 'filter: url(#wobble)' : ''} />
  <!-- Arrowhead -->
  <path d={arrowheadPath} stroke={strokeColor} stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />
  {label && (
    <text x={labelPos.x} y={labelPos.y}
          font-family="var(--fh)" font-size="22" fill={strokeColor} font-weight="700"
          transform={`rotate(${labelPos.rotation || 0} ${labelPos.x} ${labelPos.y})`}>
      {label}
    </text>
  )}
</svg>
```

The wobble filter — include once on the page:

```html
<svg width="0" height="0" style="position:absolute">
  <defs>
    <filter id="wobble">
      <feTurbulence baseFrequency=".04" numOctaves="2" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2"/>
    </filter>
  </defs>
</svg>
```

#### Gotchas

- **Label position:** the text label MUST sit OFF the arrow path, not on it. Put it above or beside the curve, not crossing it.
- **Only ONE label per arrow.** If you need two bits of text, use two arrows.

---

### 11. TodoList

**What:** A checklist-style artifact — the one on the workbench showing "what I practice" (absorb / structure / prototype / systematise / ship / critique). White paper with ruled lines, checkbox marks, handwritten text.

**When to use:**
- On the workbench how-I-work zone — one of these
- Anywhere you want an explicit ordered list of verbs/actions with a playful checklist metaphor

**When NOT to use:**
- For every list — reader column lists stay plain
- If there's no natural "done" semantic — don't check things that aren't checked

#### Props

```typescript
interface TodoListProps {
  title: string;
  sub?: string;
  items: Array<{ text: string; done?: boolean }>;
  pos?: { x: number; y: number };
  rotation?: number;
  width?: number;       // default 340
}
```

#### CSS reference

```css
.todo {
  position: absolute;
  width: 340px;
  padding: 24px 22px 20px;
  background: #fdf8ea;
  box-shadow:
    2px 4px 0 rgba(40, 35, 25, 0.05),
    6px 12px 24px rgba(40, 35, 25, 0.16);
  transform: rotate(var(--rotation, 0deg));
}

.todo-title {
  font-family: var(--fh);
  font-weight: 700;
  font-size: 26px;
  color: var(--ink);
  margin-bottom: 2px;
}

.todo-title em { color: var(--marker-red); font-style: italic; }

.todo-sub {
  font-family: var(--fm);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 12px;
}

.todo-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  font-family: var(--fh);
  font-size: 20px;
  font-weight: 500;
  color: var(--ink);
}

.todo-check {
  width: 18px;
  height: 18px;
  border: 2px solid var(--ink-2);
  border-radius: 2px;
  flex-shrink: 0;
}

.todo-row.done .todo-check {
  background: var(--ink-2);
  position: relative;
}
.todo-row.done .todo-check::after {
  content: "✓";
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #fdf8ea;
  font-size: 14px;
  font-weight: 700;
}

.todo-row.done .todo-txt {
  text-decoration: line-through;
  text-decoration-color: var(--marker-red);
  text-decoration-thickness: 2px;
  color: var(--ink-2);
}
```

---

### 12. ContactCard

**What:** A larger artifact for the contact zone. Contains a headline, a short paragraph, a large email link, and social links in a row. The visual climax of the page.

**When to use:**
- Once on the workbench (the "say hi" zone)

**When NOT to use:**
- On case studies — those have a small CTA footer instead

#### Props

```typescript
interface ContactCardProps {
  title: string;                  // "if this <em>clicked</em> — say hi."
  body: string;                   // the short pitch paragraph
  email: string;
  socials: Array<{ label: string; url: string }>;
  pos?: { x: number; y: number };
}
```

#### CSS reference

```css
.contact-card {
  position: absolute;
  width: 420px;
  padding: 36px 36px 28px;
  background: #fdf8ea;
  border: 1px solid rgba(40, 35, 25, 0.12);
  box-shadow:
    2px 4px 0 rgba(40, 35, 25, 0.05),
    8px 16px 32px rgba(40, 35, 25, 0.2);
}

.contact-card h3 {
  font-family: var(--fh);
  font-weight: 700;
  font-size: 36px;
  line-height: 1.05;
  color: var(--ink);
  margin-bottom: 14px;
}

.contact-card h3 em { color: var(--marker-red); font-style: italic; }

.contact-card p {
  font-family: var(--fs);
  font-size: 15px;
  line-height: 1.55;
  color: var(--ink-2);
  margin-bottom: 20px;
}

.contact-card .email {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: var(--ink);
  color: #fdf8ea;
  font-family: var(--fm);
  font-size: 14px;
  letter-spacing: 0.08em;
  text-decoration: none;
  transition: background 200ms, transform 200ms;
}

.contact-card .email:hover {
  background: var(--marker-red);
  transform: translateY(-1px);
}

.contact-card .email .arr {
  font-family: var(--fs);
  font-size: 20px;
}

.contact-card .socials {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  font-family: var(--fm);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.contact-card .socials a {
  color: var(--ink-2);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 200ms, color 200ms;
}

.contact-card .socials a:hover {
  color: var(--ink);
  border-bottom-color: var(--ink);
}
```

---

### 13. Masthead

**What:** The hero block on the workbench. Eyebrow + big title + sub-headline. Not a sticky, not a card — just typography.

**When to use:**
- Once per page on the homepage / workbench

#### Props

```typescript
interface MastheadProps {
  eyebrow: string;              // "hey, I'm —"
  title: string;                // "Sivanesh TV, a designer who <strike>talks</strike> ships."
  sub: string;                  // the tagline
  pos?: { x: number; y: number };
}
```

#### CSS reference

```css
.masthead {
  position: absolute;
  width: 900px;
  transform: rotate(-1deg);
}

.mh-eyebrow {
  font-family: var(--fh);
  font-weight: 500;
  font-size: 28px;
  color: var(--marker-red);
  transform: rotate(-2deg);
  display: inline-block;
  margin-bottom: 4px;
}

.mh-title {
  font-family: var(--fs);
  font-weight: 700;
  font-size: 96px;
  line-height: 0.95;
  letter-spacing: -0.035em;
  color: var(--ink);
  margin-bottom: 24px;
}

.mh-title em {
  font-style: italic;
  font-family: var(--fh);
  font-weight: 700;
  font-size: 1.05em;
  color: var(--marker-red);
  display: inline-block;
  transform: translateY(6px);
}

.mh-title .strike {
  position: relative;
  display: inline-block;
}

.mh-title .strike::after {
  content: "";
  position: absolute;
  left: -4%;
  right: -4%;
  top: 48%;
  height: 8px;
  background: var(--marker-red);
  transform: skewY(-3deg);
  opacity: 0.85;
  border-radius: 2px;
}

.mh-sub {
  font-family: var(--fm2);      /* Kalam */
  font-weight: 400;
  font-size: 22px;
  line-height: 1.45;
  color: var(--ink-2);
  max-width: 640px;
}

.mh-sub em {
  font-style: normal;
  color: var(--marker-red);
  font-weight: 700;
  background: rgba(245, 200, 74, 0.5);  /* yellow highlight tint */
  padding: 0 4px;
  transform: skewX(-5deg);
  display: inline-block;
}
```

---

### 14. PhotoFrame

**What:** A small square photo with a paper frame + caption. The "that's me, Pune IN" artifact.

#### CSS reference

```css
.photo {
  position: absolute;
  width: 200px;
  padding: 8px 8px 32px;
  background: #fdf8ea;
  box-shadow:
    2px 4px 0 rgba(40, 35, 25, 0.06),
    6px 12px 20px rgba(40, 35, 25, 0.18);
}

.photo-inner {
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(135deg, #4a4945, #2a2a2c);
  color: #f5ede0;
  display: grid;
  place-items: center;
  font-family: var(--fs);
  font-weight: 700;
  font-size: 80px;
  letter-spacing: -0.05em;
}

.photo-caption {
  text-align: center;
  margin-top: 10px;
  font-family: var(--fm);
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-3);
}
```

(When a real photo ships, replace the `.photo-inner` gradient+letter with an `<img>`.)

---

## B. Illustration stickies (specialized)

### 15. Basketball sticky

A specialized sticky variant with an inline SVG basketball illustration and orange background. See prototype for the exact SVG.

```astro
<Sticky variant="orange" pos={{x: 800, y: 2150}} rotation={-4} width={290} eyebrow="— off the bench —">
  <div class="sticky-with-icon">
    <svg width="44" height="44" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="20" fill="#d65f0f" stroke="#2a1400" stroke-width="2"/>
      <path d="M 24 4 Q 24 24 24 44" stroke="#2a1400" stroke-width="1.8" fill="none"/>
      <path d="M 4 24 Q 24 24 44 24" stroke="#2a1400" stroke-width="1.8" fill="none"/>
      <path d="M 10 10 Q 22 22 38 38" stroke="#2a1400" stroke-width="1.8" fill="none"/>
      <path d="M 38 10 Q 26 22 10 38" stroke="#2a1400" stroke-width="1.8" fill="none"/>
    </svg>
    <div>Shooting forward / small forward. State-level in college, <em>Tamil Nadu.</em> Still play every week.</div>
  </div>
</Sticky>
```

### 16. Manhwa sticky

Specialized sticky with two-comic-panels SVG. See prototype.

```astro
<Sticky variant="cream" pos={{x: 1280, y: 2210}} rotation={3} width={280}
        eyebrow="— late nights —" eyebrowColor="purple">
  <div class="sticky-with-icon">
    <svg width="40" height="48" viewBox="0 0 44 52">
      <!-- Two overlapping comic panels, see prototype -->
    </svg>
    <div>Solo Leveling, Omniscient Reader, Tower of God. Nights belong to <em class="purple">manhwa.</em></div>
  </div>
</Sticky>
```

Shared CSS for icon-stickies:

```css
.sticky-with-icon {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 4px;
}

.sticky-with-icon svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.sticky-with-icon > div {
  font-family: var(--fh);
  font-weight: 600;
  font-size: 19px;
  line-height: 1.35;
}
```

---

## C. Reader-column components (case studies only)

### 17. SectionHeading

**What:** The standard heading at the top of each case study section. Eyebrow + section number + headline + lead sentence.

#### Props

```typescript
interface SectionHeadingProps {
  eyebrow: string;           // "Context"
  num: string;               // "§ 01"
  children: any;             // the headline text
  lead?: string;             // optional lead paragraph
}
```

#### CSS reference

```css
.reader .r-section-lbl {
  font-family: var(--fm);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-top: 120px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.reader .r-section-lbl::after {
  content: "";
  flex: 1;
  height: 1px;
  background: rgba(40, 35, 25, 0.15);
}

.reader h2 {
  font-family: var(--fs);
  font-weight: 700;
  font-size: 36px;
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: var(--ink);
  margin-bottom: 24px;
}

.reader .r-lead {
  font-family: var(--fs);
  font-weight: 400;
  font-size: 20px;
  line-height: 1.55;
  color: var(--ink-2);
  margin-bottom: 32px;
}

.reader h2 em,
.reader .r-lead em {
  font-style: italic;
  color: var(--marker-red);
  font-weight: 600;
}
```

### 18. PullQuote

```astro
<PullQuote cite="Pilot, Cockpit beta">
  "The moment I needed the alert expanded, the panel was already full of something else."
</PullQuote>
```

```css
.reader .r-pullquote {
  font-family: var(--fm2);   /* Kalam */
  font-weight: 700;
  font-size: 28px;
  line-height: 1.3;
  color: var(--ink);
  padding: 24px 0 24px 24px;
  border-left: 4px solid var(--marker-red);
  margin: 32px 0;
}

.reader .r-pullquote cite {
  display: block;
  font-family: var(--fm);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-top: 12px;
  font-style: normal;
}
```

### 19. Callout

A mini-paragraph with a left-border accent. For asides.

```css
.reader .r-callout {
  background: #fdf8ea;
  border-left: 3px solid var(--marker-red);
  padding: 16px 20px;
  margin: 24px 0;
  font-family: var(--fs);
  font-size: 16px;
  line-height: 1.55;
  color: var(--ink-2);
}
```

### 20. ImageSlot

A standardized image block inside the reader with caption. Supports variants: hero, wide, split, square.

```astro
<ImageSlot variant="wide" src="/images/cockpit/push-overlay.png" alt="..." caption="Push vs Overlay IA at work"/>
```

```css
.reader .r-image-slot {
  margin: 40px 0;
}

.reader .r-image-slot img,
.reader .r-image-slot svg {
  width: 100%;
  display: block;
  border: 1px solid rgba(40, 35, 25, 0.1);
  box-shadow: 0 4px 16px rgba(40, 35, 25, 0.1);
}

.reader .r-image-slot.hero img  { aspect-ratio: 16/9; object-fit: cover; }
.reader .r-image-slot.wide img  { aspect-ratio: 16/10; object-fit: cover; }
.reader .r-image-slot.split     { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.reader .r-image-slot.square img{ aspect-ratio: 1; object-fit: cover; }

.reader .r-image-slot figcaption {
  font-family: var(--fm);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-top: 10px;
}
```

### 21. OutcomeGrid

A 3-column "receipts" grid at the end of a case study.

```astro
<OutcomeGrid>
  <Outcome num="42%" label="lower error rate" desc="Alert acknowledgement time..."/>
  <Outcome num="3×" label="faster setup" desc="Profile templates..."/>
  <Outcome num="M1" label="shipped" desc="Five pages live in enterprise..."/>
</OutcomeGrid>
```

```css
.reader .r-outcomes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin: 48px 0;
}

.reader .r-outcome {
  background: #fdf8ea;
  padding: 28px 20px 24px;
  border-top: 3px solid var(--marker-red);
}

.reader .r-outcome-n {
  font-family: var(--fs);
  font-weight: 700;
  font-size: 48px;
  line-height: 1;
  color: var(--ink);
  letter-spacing: -0.03em;
}

.reader .r-outcome-l {
  font-family: var(--fm);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--marker-red);
  margin: 10px 0 8px;
}

.reader .r-outcome-d {
  font-family: var(--fs);
  font-size: 13px;
  line-height: 1.5;
  color: var(--ink-2);
}

/* Mobile: single column */
@media (max-width: 640px) {
  .reader .r-outcomes { grid-template-columns: 1fr; }
}
```

### 22. MetaRow

The role/year/scope/tools line at the top of a case study.

```astro
<MetaRow>
  <Meta label="Role" value="Lead · with Prathamesh"/>
  <Meta label="Year" value="2024"/>
  <Meta label="Scope" value="End-to-end UX · Design system"/>
  <Meta label="Tools" value="Figma · Claude · Lovable"/>
</MetaRow>
```

```css
.reader .r-meta {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 24px 0;
  border-top: 1px solid rgba(40, 35, 25, 0.15);
  border-bottom: 1px solid rgba(40, 35, 25, 0.15);
  margin: 32px 0;
}

.reader .r-meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reader .r-meta-lbl {
  font-family: var(--fm);
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.reader .r-meta-val {
  font-family: var(--fs);
  font-size: 14px;
  color: var(--ink);
  font-weight: 500;
}

@media (max-width: 640px) {
  .reader .r-meta { grid-template-columns: 1fr 1fr; }
}
```

---

## D. Component-use decision matrix

When you're unsure which artifact to reach for, use this:

| You want to show... | Use |
|---|---|
| A short observation or note | Sticky |
| A quote from a user/stakeholder | Sticky (pink variant) |
| An outcome/receipt/state | Sticky (green variant) |
| Personal/off-hours content | Sticky (variant-specific, with optional inline SVG) |
| A principle or rule | PrincipleCard |
| Operational/regulatory context framing | ContextCard |
| A clickable link to another page | Polaroid |
| A real product screenshot | Printout |
| A hand-drawn IA/flow/diagram | Diagram |
| A handwritten annotation | Marker |
| A structured mini-table | IndexCard |
| A checklist | TodoList |
| A zone backdrop | ZoneLabel |
| A connecting arrow between two artifacts | ArrowDoodle |
| A figure inside the reader | ImageSlot |
| Numeric outcomes at end of case | OutcomeGrid |
| Case study header metadata | MetaRow |
