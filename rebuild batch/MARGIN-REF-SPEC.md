# Margin-ref cross-links — adds to Phases 5, 6, 7

**Purpose:** Wire the `r-margin-ref` links inside the reader so clicking them flies the camera to the corresponding canvas artifact. The prototype has these links styled but NOT functional — the behavior was never implemented.

**Priority:** Amendment to `REBUILD-PROMPT.md`. Read this after `REBUILD-PROMPT.md` and before starting Phase 5.

---

## The problem

In each case study, the reader column contains inline references like:

- `↗ see the alert-system redesign`
- `↗ see the IA diagram`
- `↗ see the pilot persona`
- `↗ see the grouping architecture`

These currently render as styled `<a class="r-margin-ref" data-jump="target-id">` but clicking them does nothing. The engine has no `data-jump` handler.

Additionally, the existing `data-jump` values in the prototype HTML don't all map cleanly to artifact IDs (some are missing, some are ambiguous, some are incomplete — Sivanesh missed wiring several refs that should exist).

---

## What to build

### 1 · Artifact IDs on the canvas

Every artifact on a case study page (Cockpit, Fleet, Asset) needs a stable, unique ID on its DOM root element. In the existing prototype these are `id="obj-<slug>"` — preserve that naming. Every canvas artifact component in Phase 5 should accept an `id` prop and emit it on the root element.

### 2 · `data-jump` attribute on `r-margin-ref` points to an artifact ID

A link like `<a class="r-margin-ref" data-jump="ia-diagram">` should jump the camera to the artifact whose `id="obj-ia-diagram"`. Note the automatic `obj-` prefix — the jump target is the slug; the ID on the artifact includes the prefix.

This convention keeps the margin-ref markup clean (just the slug) and the artifact IDs unambiguous in the DOM.

### 3 · Engine method: `jumpToArtifact(slug)`

Add to `CanvasEngine.ts` (case mode):

```typescript
jumpToArtifact(slug: string): void {
  const el = document.getElementById(`obj-${slug}`);
  if (!el) {
    console.warn(`[canvas] no artifact found with id="obj-${slug}"`);
    return;
  }

  // Exit reading mode so user sees the canvas behavior
  this.readingMode = false;

  // Compute the artifact's center in canvas coordinates
  const targetCX = el.offsetLeft + el.offsetWidth / 2;
  const targetCY = el.offsetTop + el.offsetHeight / 2;

  // Zoom level: close enough to read the artifact clearly but not so close it fills the screen
  // 0.85 feels right on desktop; scale down on mobile for context
  const vw = innerWidth;
  let targetScale: number;
  if (vw <= 420)       targetScale = 0.55;
  else if (vw <= 640)  targetScale = 0.65;
  else if (vw <= 1100) targetScale = 0.75;
  else                 targetScale = 0.85;

  this.flyTo(targetCX, targetCY, targetScale, 800);

  // Brief visual pulse on the target artifact so user knows where they landed
  el.classList.add('artifact-pulse');
  setTimeout(() => el.classList.remove('artifact-pulse'), 1400);
}
```

CSS for the pulse (add to `canvas.css` or equivalent):
```css
.artifact-pulse {
  animation: artifactPulse 1.4s ease-out;
}
@keyframes artifactPulse {
  0%   { filter: drop-shadow(0 0 0 rgba(216,53,42,0)); }
  30%  { filter: drop-shadow(0 0 24px rgba(216,53,42,.55)); }
  100% { filter: drop-shadow(0 0 0 rgba(216,53,42,0)); }
}
```

### 4 · Wire margin-refs to call `jumpToArtifact`

After reader content mounts (in `CaseLayout.astro` or a shared init script):

```js
document.querySelectorAll('.r-margin-ref[data-jump]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const slug = link.dataset.jump;
    if (!slug) return;
    window.__canvasEngine?.jumpToArtifact(slug);
  });
});
```

Expose the engine instance on `window.__canvasEngine` in the case-mode boot so the click handler can reach it. (Cleaner than firing a custom event; simpler than a pub/sub.)

### 5 · Back button to return to reading

After jumping to an artifact, user needs a way back. Two options, build both:

**A. Keyboard:** `r` or `R` re-enters reading mode and flies back to the reader's current section. Already specified in `REBUILD-PROMPT.md` Phase 6 — just verify it works after a jump.

**B. Toast hint:** When `jumpToArtifact` fires, show a brief toast (reuse the `.reading-hint` styling from `PROTOTYPE-REFERENCE.md` §6.6):

```
Viewing: <artifact label> · press R to return to reading
```

Artifact label comes from a new `data-label` attribute on each artifact. More on that below.

---

## The authoritative mapping table

This is the **source of truth** for every case-study cross-link. Where the prototype has a `data-jump` value that doesn't match an artifact ID, the table below corrects it. Where the prototype is missing a ref that should exist based on content, the table adds it.

**Rule for Claude Code:** Use this table. Not the prototype's `data-jump` values. Where a ref exists in the prototype but points to a different slug, follow this table's slug.

### Cockpit (`cockpit-canvas.html`)

| Ref text (from reader) | Section | `data-jump` slug | Target artifact `id` | Notes |
|---|---|---|---|---|
| ↗ see the operator quote | § 02 | `operator-quote` | `obj-operator-quote` | ADD — missing from prototype; lives after "Every feature added a panel" in §02 body |
| ↗ see the IA diagram | § 03 | `panel-hierarchy` | `obj-panel-hierarchy` | FIX — prototype uses `ia-diagram` (no match); correct target is the panel-hierarchy diagram |
| ↗ see the push-or-overlay rule | § 03 | `push-overlay` | `obj-push-overlay` | ADD — missing from prototype; lives in §03 body after introducing the push/overlay concept |
| ↗ see the alert severity diagram | § 04 | `alerts` | `obj-alerts` | EXISTING — matches |
| ↗ see the alert-system redesign | § 02 | `alerts` | `obj-alerts` | EXISTING — matches (yes, two different §s link to same artifact, that's fine) |
| ↗ see the restraint sticky | § 04 | `alert-restraint` | `obj-alert-restraint` | ADD — missing, reinforces the §04 callout |
| ↗ see Robin AI | § 05 | `robin` | `obj-robin` | ADD — missing from prototype |
| ↗ before / after | § 06 | `before` | `obj-before` | ADD — missing; compare to after-variant via another ref |
| ↗ after the redesign | § 06 | `after` | `obj-after` | ADD — missing |
| ↗ what got cut | § 08 | `cut` | `obj-cut` | ADD — missing; links the reflection to the cut card |

### Fleet (`fleet-canvas.html`)

| Ref text | Section | `data-jump` slug | Target artifact `id` | Notes |
|---|---|---|---|---|
| ↗ see the CAA context | § 01 | `caa-context` | `obj-caa-context` | ADD — missing from prototype; anchors the regulatory stakes |
| ↗ see the pilot persona | § 02 | `persona-pilot` | `obj-persona-pilot` | EXISTING — matches |
| ↗ see the supervisor persona | § 02 | `persona-supervisor` | `obj-persona-supervisor` | ADD — missing; pairs with pilot ref |
| ↗ see the grouping architecture | § 03 | `grouping` | `obj-grouping` | FIX — prototype uses `grouping-diagram` (no match); artifact id is `obj-grouping` |
| ↗ see the group-not-filter principle | § 03 | `group-not-filter` | `obj-group-not-filter` | ADD — missing |
| ↗ see the four-panel layout | § 04 | `four-panel` | `obj-four-panel` | ADD — missing |
| ↗ see the alarm dispatch flow | § 05 | `alarm-flow` | `obj-alarm-flow` | EXISTING — matches |
| ↗ see the reflection | § 08 | `reflection` | `obj-reflection` | ADD — missing |

### Asset (`asset-canvas.html`)

| Ref text | Section | `data-jump` slug | Target artifact `id` | Notes |
|---|---|---|---|---|
| ↗ see the operational context | § 01 | `scale-context` | `obj-scale-context` | ADD — missing; anchors the 45-wellheads reality |
| ↗ see Sarah's situation | § 01 | `sarah-quote` | `obj-sarah-quote` | ADD — missing; if Sarah quote artifact exists (verify in prototype) |
| ↗ see the missing abstraction | § 02 | `missing-abstraction` | `obj-missing-abstraction` | ADD — missing |
| ↗ see the shift principle | § 03 | `shift-principle` | `obj-shift-principle` | FIX — prototype uses `principle` (ambiguous — there are two principle cards); correct target is the §03 shift principle |
| ↗ see the shift diagram | § 03 | `shift-diagram` | `obj-shift-diagram` | ADD — missing |
| ↗ see the template principle | § 04 | `template-principle` | `obj-template-principle` | ADD — missing; second principle card in asset |
| ↗ see the profile types | § 04 | `profile-types` | `obj-profile-types` | ADD — missing |
| ↗ see the five-pages printout | § 05 | `five-pages` | `obj-five-pages` | ADD — missing; anchors the module overview |
| ↗ see the navigation schema | § 05 | `nav-schema` | `obj-nav-schema` | ADD — missing |
| ↗ see downstream impact | § 06 | `downstream` | `obj-downstream` | ADD — missing |
| ↗ see what's next for Arpita | § 07 | `arpita-reports` | `obj-arpita-reports` | ADD — missing |

---

## Each artifact gets a `data-label` for the toast

Every canvas artifact on a case study should render with a `data-label` attribute whose value is a human-readable name. Used by the toast hint when jumping.

Example:
```html
<div class="principle artifact"
     id="obj-push-overlay"
     data-label="Push or Overlay — the interaction rule"
     data-anchor="2" data-anchor-offset="20" ...>
```

The `jumpToArtifact` toast reads this attribute:
```js
const label = el.dataset.label || el.id.replace(/^obj-/, '');
showToast(`Viewing: ${label} · press R to return to reading`);
```

If `data-label` is missing, fall back to the slug — but aim to populate `data-label` for every artifact.

---

## Audit step — do this BEFORE implementing

The mapping table above is my best reconstruction based on the prototype content. Before wiring, Claude Code should audit:

1. **Read each case study prototype's reader column top to bottom.** For every paragraph / callout / body block, note whether there's a canvas artifact that the reader text refers to implicitly (e.g., "the operator told us X" when there's an operator-quote sticky on the canvas).

2. **For each implicit reference, determine whether it warrants a margin-ref.** Heuristic: if the reader prose describes something that an artifact visualizes or quotes, add a margin-ref. If the reader prose is general prose without a visual counterpart, skip.

3. **Post the audited list back to Sivanesh before wiring.** Format:
   ```
   Cockpit § 02 — "Every feature added a panel" → suggests ADD ref to obj-operator-quote
   Cockpit § 03 — body mentions IA buckets → PROTOTYPE has ref with wrong target; FIX to obj-panel-hierarchy
   ... etc
   ```
   Then Sivanesh confirms and you wire them.

This audit prevents over-linking (every paragraph doesn't need a ref) and under-linking (which is what the prototype currently has).

---

## Where this slots into REBUILD-PROMPT.md

**Phase 5** — add these requirements:
- Every canvas artifact component emits an `id` prop on its root (format `obj-<slug>`)
- Every canvas artifact component accepts a `label` prop and emits `data-label="<label>"` on root
- `MarginRef.astro` component accepts a `jump` prop and emits `data-jump="<slug>"`

**Phase 6** — add the `jumpToArtifact` method to the engine, the pulse CSS, and the margin-ref click wiring in `CaseLayout.astro`.

**Phase 7** — before coding each case page, do the audit step. Post the audited mapping for approval. Then populate:
- Every reader section with the audited margin-refs (using the table above as a starting point)
- Every canvas artifact with `id` and `data-label` props

---

## Gate for this feature (add to Phase 7 gate)

For each case page:
1. Click every `r-margin-ref` link — camera flies to the correct artifact, artifact pulses briefly, toast hint appears
2. Press `r` after landing — camera returns to the reading position near the section the ref was in
3. Verify no `[canvas] no artifact found` warnings in console — every `data-jump` slug resolves
4. Responsive check: on mobile, `jumpToArtifact` uses the smaller `targetScale` and the Y-bias still applies

If any ref fails to resolve or lands in the wrong place, the gate fails. Don't ship Phase 7 with broken margin-refs.
