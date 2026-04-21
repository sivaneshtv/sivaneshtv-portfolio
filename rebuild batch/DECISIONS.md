# Decisions — locked in by Sivanesh · 2026-04-21

These are the answers to the open questions flagged in `REBUILD-PROMPT.md`. Treat them as confirmed. Don't re-ask.

---

## 1 · Fonts — self-host

Self-host all four font families in `public/fonts/`:

- **Inter** — variable font (`InterVariable.woff2`), weights 300–700
- **JetBrains Mono** — variable font (`JetBrainsMono[wght].woff2`), weights 300–500
- **Caveat** — variable font (`Caveat[wght].woff2`), weights 400–700
- **Kalam** — static files (no variable version exists): `Kalam-Light.woff2` (300), `Kalam-Regular.woff2` (400), `Kalam-Bold.woff2` (700)

Load via `@font-face` in `src/styles/base.css` with `font-display: swap`. Preload Inter + JetBrains Mono in `<head>` (used on every page, above the fold). Do not preload Caveat/Kalam — they appear lower or in handwritten accents.

Remove the Google Fonts `<link>` tag from the prototype HTML when porting. No network font fetching in production.

Download sources (latest as of 2026-04):
- Inter: https://rsms.me/inter/
- JetBrains Mono: https://www.jetbrains.com/lp/mono/
- Caveat: https://fonts.google.com/specimen/Caveat → "Download family"
- Kalam: https://fonts.google.com/specimen/Kalam → "Download family"

Unzip, pick the `.woff2` files only (no `.ttf`, no `.otf`), drop them in `public/fonts/`. The variable fonts ship as a single file each; Kalam ships as three.

---

## 2 · Profile photo — placeholder for now

Keep the "S" warm-tan gradient placeholder from the prototype (`portfolio-workbench.html` lines 622–625, CSS §4.7 in `PROTOTYPE-REFERENCE.md`). Do not replace with an image.

Sivanesh will supply the real photo later via the assets folder (see §5 below).

---

## 3 · Social URLs — real values

In the contact card (§7.8 of `PROTOTYPE-REFERENCE.md`, `portfolio-workbench.html` lines 868–880), replace the `href="#"` placeholders with:

```html
<div class="socials">
  <a href="https://www.linkedin.com/in/sivanesh-t-v-product-designer" target="_blank" rel="noopener">LinkedIn ↗</a>
  <a href="/assets/sivanesh-tv-resume.pdf" target="_blank" rel="noopener" data-pending-asset>Read.cv ↗</a>
  <a href="https://x.com/dunkadamics" target="_blank" rel="noopener">Twitter ↗</a>
</div>
```

**Notes on the Read.cv link:**
- There is no read.cv profile. This link points to a resume PDF that Sivanesh will place in the assets folder later.
- Use `/assets/sivanesh-tv-resume.pdf` as the href now. The file won't exist yet — that's fine, the link will 404 until Sivanesh drops the PDF in `public/assets/`.
- Keep `data-pending-asset` on the element so Sivanesh can grep for it later to find every asset-dependent link in the codebase.
- Do not change the label text ("Read.cv ↗"). That's the intended UX — it reads like a Read.cv link but opens a PDF, which is what Sivanesh uses in place of the platform.

**The "Twitter" label is correct as-is** even though the URL is `x.com` — the prototype copy says Twitter and that's the intent.

---

## 4 · Email — display vs link mismatch (intentional)

The contact card shows `hello@sivanesh.tv` in the UI but the mailto link goes to `sssiva.1999@gmail.com`. This is intentional for UX polish — the branded alias reads better visually, the actual inbox is gmail.

Replace the email block in §7.8 with:

```html
<a href="mailto:sssiva.1999@gmail.com" class="email">
  <span>hello@sivanesh.tv</span>
  <span class="arr">→</span>
</a>
```

**Critical:** the `href` is `sssiva.1999@gmail.com` (real inbox). The visible `<span>` is `hello@sivanesh.tv` (display alias). Do not "fix" this mismatch — it's the spec.

Same rule anywhere else an email appears (if any copy mentions an email address in body text, use `hello@sivanesh.tv` for display).

---

## 5 · Case study images — placeholders stay

All `.img-slot` placeholders (`PROTOTYPE-REFERENCE.md` §5.11) remain as placeholders through Phase 7. They ship as dashed-border cards with label/title/desc/dims, not as `<img>` tags.

Sivanesh will provide real screenshots after Phase 7 is complete via an `assets/` folder. At that point, a separate post-rebuild pass will:

1. Match each image asset to the corresponding `.img-slot` by its numbered label ("Image slot 01 · Hero shot", "Image slot 02 · Evidence", etc.)
2. Swap the `<div class="img-slot-inner">` placeholder for an `<img src="/assets/cockpit-01-hero.webp" alt="...">` (alt text comes from the `img-slot-title`)
3. Keep the `.img-slot-cap` row (it's the caption line, not a placeholder)

The ImgSlot component (Phase 5 deliverable) should already support this: when `src` is passed, render the image; when `src` is empty, render the placeholder. Design the prop interface that way from the start so the swap is a one-line data edit per slot.

---

## 6 · Polaroid order on workbench — correct as-is

Order stays: **Cockpit → Fleet → Asset**. The prototype has them at:

- Polaroid 1 (Cockpit): `left:3500px; top:1700px; rotate(-3deg)` → `href="cockpit-canvas.html"`
- Polaroid 2 (Fleet): `left:3920px; top:1950px; rotate(4deg)` → `href="fleet-canvas.html"`
- Polaroid 3 (Asset): `left:3600px; top:2250px; rotate(2deg)` → `href="asset-canvas.html"`

When porting to Astro, the hrefs become `/cockpit`, `/fleet`, `/asset` (or whatever route names Phase 7 uses — match those).

---

## TL;DR for the builder

| Question | Answer |
|---|---|
| Self-host fonts? | Yes — Inter, JetBrains Mono, Caveat (variable); Kalam (3 static weights) |
| Profile photo? | Keep "S" gradient placeholder |
| LinkedIn URL | `https://www.linkedin.com/in/sivanesh-t-v-product-designer` |
| Read.cv URL | `/assets/sivanesh-tv-resume.pdf` — PDF dropped later, no platform URL |
| Twitter/X URL | `https://x.com/dunkadamics` (label stays "Twitter") |
| Email display | `hello@sivanesh.tv` |
| Email link (href) | `mailto:sssiva.1999@gmail.com` — intentional mismatch, do not "fix" |
| Case study images? | Keep placeholders; Sivanesh adds real ones post-Phase-7 |
| Polaroid order | Cockpit → Fleet → Asset (unchanged) |
