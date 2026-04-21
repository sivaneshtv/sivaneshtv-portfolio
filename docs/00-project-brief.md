# 00 · Project Brief

**For:** Claude Code (the agent rebuilding this portfolio)
**From:** Sivanesh TV
**Status:** Prototype complete. This doc sets the framing for the rebuild.

---

## What this is

A **portfolio site for Sivanesh TV**, a product designer based in Pune, India, specialising in interfaces for critical operations — drone autonomy, fleet tools, infrastructure-management systems. The site documents work done at FlytBase (ex-) in roles ranging from lead designer to co-designer, with three in-depth case studies.

The site is **not a conventional scrolling portfolio.** It's modeled after a whiteboard: a pannable, zoomable canvas where the hero, about, work links, process, and contact all live as artifacts (sticky notes, index cards, polaroids, markers, arrows, diagrams, printouts) pinned to an infinite surface.

Each case study follows the same pattern — a central reader column with the written narrative, surrounded by scattered artifacts (principle cards, diagrams, quotes, stickies, printouts) that give the case visual depth and support the argument.

## Why a whiteboard

The aesthetic is the argument. These products ship for operators working in critical-ops environments where the interface is part of a regulatory safety case. The portfolio reflects how the designer thinks: structure before style, scattered thoughts that add up to a coherent argument, decisions visible alongside their evidence.

It's also genuinely differentiated. Most portfolios are scroll + image + caption. This one makes the visitor *do* something — pan, click, explore. A recruiter who lasts 90 seconds on a whiteboard will read more than they would on a linear page.

## Who visits

Three audiences, in order of how much care each needs:

1. **Recruiters and hiring managers** — non-designer tech folks. Need the basics fast. First 30 seconds: name, role, where based, what he does, what he's shipped. The workbench hero + work polaroids must deliver this at-a-glance.
2. **Design leads evaluating craft** — read case studies in depth. Care about structural thinking, defensible decisions, writing quality, and visible process. Case study reader columns must reward this reader.
3. **Colleagues / peers browsing out of curiosity** — like to see personality, tools, working style, side interests. The About and How-I-work zones are for them.

A good portfolio serves all three. The whiteboard metaphor handles 2 and 3 naturally (panning the canvas = exploring). The challenge is not losing audience 1 — so the hero must be immediately legible and the work polaroids must be click-to-case-study without effort.

## The designer's voice

A few things that should come through in every copy choice and every design decision:

- **Structural thinking over stylistic flourish.** The portfolio's signature belief is *"Structure before style. Always. Style is how structure shows itself."* Every case study opens with a signature structural principle (Cockpit: *"Push or overlay"*; Fleet: *"Grouping, not filtering"*; Asset: *"Everything else FlytBase built was about the flight. This one was about the asset."*)
- **Plainspoken, not precious.** Short sentences. Real phrasing from real transcripts where possible. No "passionate about user-centered design" boilerplate.
- **Evidence over ornament.** Where possible, a diagram, a real screenshot, a real quote. Decorative arrows and rotations are only there to signal whiteboard — never to substitute for content.
- **Honest attribution.** If Arpita designed the Reports page in Asset Management, say so, quietly. If Prathamesh collaborated on Cockpit, say so. Overclaiming is the fastest way to destroy credibility with hiring managers who've seen a thousand portfolios.

## What success looks like

The rebuild is successful if:

**Performance.** First Contentful Paint < 1.5s on 3G-throttled mobile. The canvas is large but should never feel laggy at pan/zoom. Mobile must be genuinely usable — not merely "doesn't crash" but actually good to read on.

**Accessibility.** The site is an unusual spatial experience, but content must be **readable** — the case study prose needs proper semantic HTML so screen readers can traverse it. There should be an accessible **"read the case study as a linear article"** path for each case. The canvas is an enhancement layer, not the only way to get to content.

**Craft floor.** Typography, color contrast, shadow quality, border-radius, animation easing — all at the level of designers who care about this stuff. The prototype HTML roughly establishes this floor; don't drop below it.

**Maintainability.** Adding a new case study = writing one MDX file and adding a polaroid to the workbench. Tweaking a principle card's wording = editing one string. No hardcoded absolute positions scattered across 50 places.

## What's out of scope for v1

- A blog
- Multiple languages / i18n (English only)
- Dark mode (the whiteboard aesthetic is light-paper-based; a dark mode would be a different product)
- Custom CMS / admin panel (content in MDX, editing = git commit)
- Analytics beyond basic (Plausible or similar, client-side, privacy-respecting)
- Auth / gated content (everything public)

## What's shipping in v1

- **Workbench homepage** — `/` — hero + about + work + how-I-work + contact, all on one canvas
- **Three case study pages** — `/cockpit`, `/fleet`, `/asset` — each a reader column + scattered artifacts on its own canvas
- **Shared canvas engine** — pan, zoom, middle-click pan, spacebar+drag pan, minimap, zone navigation, reading mode (case studies only)
- **Responsive** — mobile + tablet + desktop. Case studies have a reading-mode column-fill adaptation on mobile that's essential to get right.

## Reference files

The prototype HTML is in this handoff bundle:

- `sivanesh-workbench.html` — homepage prototype
- `cockpit-canvas.html` — Cockpit View 2.0 case study prototype
- `fleet-canvas.html` — Fleet View case study prototype
- `asset-canvas.html` — Asset Management case study prototype

**These are design references, not source to port.** They're single-file mockups with inline styles, embedded JS, hand-placed coordinates. The rebuild should:

- Preserve the design language exactly (fonts, colors, spacing, component look)
- Preserve the interaction model exactly (pan/zoom/reading-mode rules in `02-interaction-spec.md`)
- Preserve content exactly (copy in `04-content.md` is the source of truth)
- **Not** reproduce the hand-coded absolute positioning — use a real component system with a zone/layout abstraction
- **Not** reproduce the single-file constraint — proper project structure

The HTML is where you go when a doc is ambiguous about how something should LOOK. The docs are where you go when anything needs to be REBUILT.

## Open questions flagged for your attention

Places where the prototype made a choice but Sivanesh and I both agreed it might need revisiting:

1. **Canvas dimensions.** 6000×4200 for workbench, 5000×6800 for cases. These are decent but not sacred. If a better layout emerges during rebuild, adjust — keep the "content island with whitespace moats" composition approach.
2. **Reading mode default.** Case studies currently open IN reading mode (column centered, camera auto-flies between sections as you scroll). If your instinct is to open in explore mode and let readers opt in, raise it with Sivanesh before shipping.
3. **Zone navigation menu.** The top-left dropdown with Intro/About/Work/Process/Contact works but feels undercooked. Consider a clean sidebar, a minimap-integrated nav, or something else.
4. **Case study order.** Cockpit → Fleet → Asset is chronological-ish but not thematic. Could reorder to lead with the strongest or newest.

## The one-line pitch

> A product designer's portfolio, built as the thing he'd actually sketch on: a whiteboard.
