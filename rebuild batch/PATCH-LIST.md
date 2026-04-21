# Patch list — status of the existing docs

After this rebuild starts, **`PROTOTYPE-REFERENCE.md` and `REBUILD-PROMPT.md` are the primary docs.** The earlier docs (`00`–`06`, `README.md`) remain in the bundle as context, but their status has changed. This doc says what to trust.

---

## Priority order for any question

1. **Prototype HTML file** (the `.html` in the bundle, e.g. `portfolio-workbench.html`) — always the truth
2. **`PROTOTYPE-REFERENCE.md`** — a verbatim extract from the HTML; line numbers cite back to the prototype
3. **`REBUILD-PROMPT.md`** — phased plan grounded in the above
4. **`DECISIONS.md`** — locked-in product answers (fonts, social URLs, email, placeholders)
5. **`00-project-brief.md`** — still trustworthy
6. **`02-interaction-spec.md`** — mostly correct but behind on responsive reader sizing (see below)
7. **`06-known-gotchas.md`** — still mostly correct
8. **`04-content.md`** — partially correct, has paraphrase drift in case-study copy (see below)
9. **`01-design-language.md`** — has token-value drift (see below)
10. **`05-components.md`** — had significant drift from the prototype; treat as context only
11. **`03-architecture.md`** — deprecated; project structure in `REBUILD-PROMPT.md` supersedes

When two sources disagree, go up the list, not down. Prototype wins every time.

---

## Per-doc status

### `README.md` — UPDATE NEEDED
The existing README pitches the old doc-first approach. Replace the front-matter with a pointer to the new priority order (the four bullets above). The rest of the index is still useful. See the new README I'll ship alongside this patch list.

### `00-project-brief.md` — KEEP AS-IS
Goals, audience, stack, tone. All still correct. No edits.

### `01-design-language.md` — HAS DRIFT; USE PROTOTYPE-REFERENCE §1 INSTEAD
Specific drift:
- Missing `--ink-4:#a8a197` token (used by case studies — `.r-outcome-l`, etc.)
- Missing `--paper:#fbfaf4` token (used by every paper artifact on case studies)
- Inconsistent naming: workbench calls it `--fm2`, case studies call it `--fk`. Real token is Kalam, weights 400 and 700. Pick `--fk` for the rebuild.
- Some color values were approximated; use the exact hex from `PROTOTYPE-REFERENCE.md` §1

**For tokens: use `PROTOTYPE-REFERENCE.md` §1. For the principles / tone / voice sections of `01`, keep as-is — those are useful context.**

### `02-interaction-spec.md` — MOSTLY CORRECT; CHECK §3 FOR ENGINE MATH
Good:
- Pan/zoom/inertia values
- Keyboard shortcuts list
- Middle-click autoscroll suppression
- Zone nav behavior

Behind on:
- **Responsive reader sizing** — `computeReaderLayout()` is not fully described. The real formula is in `PROTOTYPE-REFERENCE.md` §3.14 with viewport buckets 420/640/1100/1600 → widths 580/720/900/1080/1160 and font multipliers 1.45/1.3/1.1/1.0.
- **Section-anchored artifacts** — `refreshZoneTargets()` repositions `[data-anchor]` elements based on actual rendered `.r-section` positions. Not described in `02`. Real logic in `PROTOTYPE-REFERENCE.md` §3.15.
- **Canvas height grows dynamically** — `CANVAS_H` extends to fit the rendered reader plus 400px buffer. Missing from `02`.

For the engine JS: use `PROTOTYPE-REFERENCE.md` §3 as the spec. `02` is useful for the *rationale* behind each interaction, not the implementation.

### `03-architecture.md` — DEPRECATED
The file/folder structure prescribed in `03` wasn't followed and the new one in `REBUILD-PROMPT.md` is better grounded. Do not follow `03`. If anything about project layout is unclear, use `REBUILD-PROMPT.md`'s Phase 1 + 2 + 5 + 6 file paths as the canonical structure.

You can leave `03` in the bundle for historical context but flag it as deprecated at the top.

### `04-content.md` — PARTIAL DRIFT
The workbench copy is correct. The case-study copy has paraphrase drift in a few places:
- Fleet § 02 section heading — I had written something like "Two personas. One interface. Zero room for failure." in the doc; the prototype has the pullquote `Two different people. Completely different needs. One interface that couldn't afford to <em>fail either of them.</em>` and NO h2 above it. The doc version is invented.
- Some callout text in cockpit/fleet/asset was summarized rather than quoted

**For case-study copy: read directly from the prototype HTML reader column.** Lines are in `PROTOTYPE-REFERENCE.md` §9. `04-content.md` is fine for character counts, hierarchy, and content structure thinking — just don't trust the string text verbatim.

### `05-components.md` — TREAT AS CONTEXT ONLY
This doc had significant drift from the prototype across 12+ components (audited in the previous session). Specifically:
- `PrincipleCard`: doc said red 2px border; prototype has 1px subtle grey border
- `ContextCard`: doc said `#2a2a2c`; prototype has `#1a1a1c`
- `ContactCard`: doc had it CREAM; prototype has it DARK
- `Photo`: doc said grey gradient aspect-ratio; prototype has 180×180 square warm-tan
- `ZoneLabel`: doc said Inter; prototype has Caveat
- `Marker`: sizes differ between workbench (24/38/54) and case (22/34/48)
- `TodoList`: doc had ✓; prototype has ✗ in red Caveat
- Plus others

**Use `PROTOTYPE-REFERENCE.md` §4, §5 for every component spec.** `05-components.md` still has useful rationale about why each component exists and what problem it solves — read it for context, not for CSS values.

### `06-known-gotchas.md` — MOSTLY CORRECT, MISSING A FEW
Correct:
- Canvas positioning (`top:50%; left:50%; transform-origin:0 0`)
- The 18 engine invariants
- Reduced-motion fallback
- Help overlay sessionStorage keys

Missing:
- Asset prototype latent bug (`.context-card` CSS missing on asset — rebuild should add)
- `.r-callout::before` "the hard part" label is hardcoded in prototype; rebuild should make it a prop
- Principle title is Inter 26px (not Caveat) — common incorrect assumption
- `.sticky em` and `.r-body em` are both NOT italic (Caveat is already informal; body em is meant to be calm)
- Marker sizes differ between workbench/case studies
- Polaroid hover uses `!important` to nuke instance rotation — keep the `!important`

These additions are captured in `PROTOTYPE-REFERENCE.md` §10.

---

## Summary for the builder (Claude Code or human)

1. **Open `PROTOTYPE-REFERENCE.md` first.** It's your index into the prototype HTML.
2. **Open the relevant prototype HTML alongside it.** The reference file cites line numbers so you can verify.
3. **Use `REBUILD-PROMPT.md` as your phase checklist.** Don't skip phases.
4. **The old docs (00–06) are background reading, not spec.** Read them for tone, principles, and rationale — but never copy CSS values or component behaviors from them without checking against the prototype first.
5. **When two things conflict, the prototype HTML wins.** Full stop.
