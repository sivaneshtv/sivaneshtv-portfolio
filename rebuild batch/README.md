# Sivanesh TV — portfolio rebuild bundle

This folder is a rebuild handoff. The goal is a pan/zoom whiteboard portfolio for Sivanesh TV — product designer, Pune — with three case studies on their own canvases.

The previous rebuild attempt drifted from the prototype. This bundle corrects that by treating the **prototype HTML files as the source of truth** and grounding the new docs in them.

---

## Priority order — read this first

When any question comes up, consult these in order. Higher wins.

1. **`portfolio-workbench.html` · `cockpit-canvas.html` · `fleet-canvas.html` · `asset-canvas.html`** — the prototype. These are the truth.
2. **`PROTOTYPE-REFERENCE.md`** — a verbatim extract from the four prototypes, with line-number citations. Your index into the HTML.
3. **`REBUILD-PROMPT.md`** — the 7-phase rebuild plan, grounded in the above.
4. **`DECISIONS.md`** — locked-in answers to what would otherwise be open questions (fonts, social URLs, email, image placeholders). Read before Phase 1.
5. **`PATCH-LIST.md`** — status of the older docs; which have drift, which to trust.
6. **Older docs (`00`–`06`)** — context and rationale. Do not copy CSS or behaviors from these without checking against the prototype.

If #1–#3 conflict: prototype wins. If #4–#5 conflict with #1–#3: trust #1–#3.

---

## File map

### Truth
- `portfolio-workbench.html` — the workbench homepage prototype (6000×4200 canvas)
- `cockpit-canvas.html` — Case 01 prototype (5000×6800 canvas)
- `fleet-canvas.html` — Case 02 prototype
- `asset-canvas.html` — Case 03 prototype

### New (use these)
- `PROTOTYPE-REFERENCE.md` — the authoritative extract. 11 sections:
  1. Tokens (colors, fonts, spacing)
  2. Canvas system (board bg, canvas dimensions, positioning invariants)
  3. Engine (pan, zoom, inertia, zones, reading mode, flight, minimap — with exact formulas)
  4. Artifact components (Sticky, Card, Polaroid, Printout, Marker, Contact, Photo, Todo, ZoneLabel, Masthead, Principle, ContextCard, CutCard, Diagram)
  5. Reader column components (Reader wrapper, Back, Hero, Meta, Section, H2, Lead, Body, Callout, PullQuote, MarginRef, Hr, Outcome, EndRow, ImgSlot)
  6. UI chrome (topbar, toolbar, minimap, help, mobile-hint, reading-hint, mobile responsive)
  7. Workbench composition — every artifact's position, rotation, dimensions, and body copy
  8. Case study composition skeleton
  9. Case study copy per page (Cockpit, Fleet, Asset)
  10. Known prototype quirks / intentional behaviors
  11. Cleanup items for rebuild (where to deduplicate, but not change values)

- `REBUILD-PROMPT.md` — 7 phases, each with Deliverable / Source / Gate / Don't-touch:
  1. Scaffold + tokens + fonts + base CSS
  2. Component showcase (10 components)
  3. Canvas engine (workbench mode)
  4. Workbench composition
  5. Case study components
  6. Canvas engine (case mode) + reading mode
  7. Case study pages (Cockpit → Fleet → Asset)

- `PATCH-LIST.md` — status of each older doc.

### Older (context; patch list says what to trust)
- `README.md` — this file (updated to point to the new docs)
- `00-project-brief.md` — still correct
- `01-design-language.md` — tokens have drift; use PROTOTYPE-REFERENCE §1 for token values
- `02-interaction-spec.md` — mostly correct; use PROTOTYPE-REFERENCE §3 for engine math
- `03-architecture.md` — deprecated; use REBUILD-PROMPT.md for project structure
- `04-content.md` — partial drift in case-study copy; use PROTOTYPE-REFERENCE §9 for exact strings
- `05-components.md` — significant drift; use PROTOTYPE-REFERENCE §4, §5 for component specs
- `06-known-gotchas.md` — mostly correct; PROTOTYPE-REFERENCE §10 adds a few missed items

---

## How to start the rebuild

1. Read `PROTOTYPE-REFERENCE.md` — all of it. You won't remember every detail, but you'll know where to find what you need.
2. Read `REBUILD-PROMPT.md` — the 7-phase structure.
3. Start Phase 1. Post status after each phase. Do not chain phases.
4. For every CSS value and every piece of copy: open the prototype HTML, copy verbatim, don't paraphrase.

---

## What this is not

- Not a framework tutorial. Astro is chosen but the engine is vanilla JS / TS.
- Not a design exploration. The design is done; this is a faithful rebuild.
- Not an improvement pass. Do not optimize, rename, or consolidate component APIs across phases without explicit ask.

---

## Locked decisions — see `DECISIONS.md`

All product decisions have been made. The full list is in `DECISIONS.md` — read it before Phase 1. Summary:

- Self-host fonts (Inter, JetBrains Mono, Caveat variable + Kalam static)
- Profile photo stays as the "S" gradient placeholder
- Real LinkedIn + X URLs provided; Read.cv URL flagged to verify
- Email display `hello@sivanesh.tv` with mailto link to real gmail — intentional mismatch
- Case-study images stay as placeholders through Phase 7; real images added post-rebuild
- Polaroid order: Cockpit → Fleet → Asset (unchanged)

Do not re-ask these. Follow `DECISIONS.md`.
