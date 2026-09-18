# CLAUDE.md

Instructions for Claude Code working in this repo. Read this in full before
writing any code, and especially before touching the hero.

## What this project is

A one-product, cinema-grade marketing site for a placeholder luxury watch
brand ("Meridian" — replace with the real name when there is one). The entire
site is built around a single signature interaction: the hero watch
disassembles as the visitor scrolls, and the falling-apart pieces double as
the site's spec sheet.

## Design north star

- Premium and restrained, not "template SaaS." Generous negative space, slow
  easing, nothing bouncy or cartoonish.
- Dark base palette (near-black, not pure `#000`), one metallic accent color
  (aged brass / champagne / brushed steel — pick one and use it sparingly),
  warm off-white text.
- A serif display face for headlines with real character (e.g. Fraunces,
  Canela, GT Sectra) paired with a clean grotesk for body/UI (e.g. Neue
  Montreal, General Sans, Inter).
- Editorial photography treatment for the craftsmanship section — black and
  white or desaturated, serif pull-quote typography.
- The mood board had a few patterns worth borrowing as *ideas*, never as
  layouts to copy: a dark hero built around a single watch, thin leader-lines
  connecting callout labels to parts of the watch, "numbered/limited edition"
  framing, a trust-stats footer. Build an original composition around these
  ideas — don't recreate any single reference site's layout, spacing, or copy.
- **Never use real watch brand names, logos, or product photography** (Rolex,
  Vacheron Constantin, Omega, Oris, Chronoswiss, etc.) in code, copy,
  comments, or placeholder assets.
- **The watch itself should be unbranded** — a clean dial with no printed
  name or logo. This reads as premium on its own, needs no fake logo to
  invent or keep consistent across frames, and carries zero trademark risk.
  The site's own identity (nav wordmark, headline copy, packaging) is what
  carries the brand; the watch prop doesn't have to.

## The signature interaction — read before touching the hero

This is two distinct animation phases, not one.

**Phase A — Ambient loop.** On load, a short (6–10s), silent, autoplaying,
looping video of the watch sits behind the headline and CTA. This is all a
visitor sees before they scroll. Standard
`<video muted loop playsInline autoPlay>`, mp4 + webm sources, poster image
for slow connections.

**Phase B — Pinned explode scrub.** Once the visitor scrolls past the hero,
pin the viewport (`ScrollTrigger` with `pin: true`) for a scroll distance of
roughly 250–350vh, and scrub a pre-rendered **frame sequence** — not a
scrubbed `<video>` element — drawn to a `<canvas>`, one frame per small
increment of scroll progress. The sequence shows the watch coming apart in a
deliberate order (e.g. strap → case-back → movement → crystal → dial → hands
→ case), each piece drifting to its own resting position on screen.

Why a canvas frame sequence instead of scrubbing a real `<video>`: seeking a
video element frame-accurately is unreliable across browsers and stutters
under fast scroll. Pre-decoded image frames on a canvas, indexed directly by
scroll progress, is the technique reliable enough for a hero interaction (the
same approach Apple's product pages use). Don't reach for video-scrubbing
libraries as a shortcut here.

As each piece nears its resting position, cross-fade in a small label
anchored to its on-screen coordinates (material, caliber, water resistance,
power reserve, strap material — whatever's true of the actual product). Once
every piece has settled, hold for a beat, then release the pin and continue
into the next section in normal document flow.

### As built — read this before rewriting the hero

The hero was built as a **real-time WebGL scene**, not as a pre-rendered frame
sequence drawn to a canvas. Nothing about the plan above was wrong; the brief
changed under it. The site was asked for as an *immersive, premium 3D* site,
and no frame sequence, video, model file or photography was ever supplied.

What that means in practice:

- The watch is generated in code in `src/components/hero/WatchModel.tsx` —
  lathe profiles for the case, crystal and case-back, extruded shapes for the
  hands, strap and buckle, and canvas-drawn textures for the dial and the
  alligator. Every material is matched to the photography in `src/images/`.
- **The movement is a photograph, not geometry.** `MovementPhoto.tsx` carries
  the real caliber on a soft-masked plane and cross-fades it from whole to
  taken apart as the scrub runs on. Do not replace it with modelled parts: no
  procedural going train reads like the real thing.
- The dial keeps the visitor's local time rather than the 10:10 pose.
- The watch can be dragged to turn, mouse and pen only.
- Lighting is a small studio rig of `Lightformer` area lights in
  `ExplodeStage.tsx`. Polished steel has no colour of its own, so the rig is
  what makes the case read as metal. Change it carefully.
- `ScrollTrigger` still owns the pin and still supplies the scrub progress.
  Only the thing being scrubbed changed: a live scene instead of an image
  index.
- Callout positions are **projected from the live scene each frame**, so they
  track their parts automatically. The per-frame label nudging the plan
  anticipated is not needed.

The reasons to prefer this over a frame sequence here:

- It is actually three-dimensional. Parallax, the pointer tilt and the camera
  dolly are real, and the parts can be repositioned by editing one array in
  `src/lib/watch/parts.ts` rather than re-rendering 120 frames.
- The whole site's visual payload is about 0.9 MB, well inside the 6 MB
  budget, with no image decode cost and nothing to lazy-load.
- There is no asset pipeline to keep in sync with the copy.

The trade is that it needs WebGL and it costs GPU time while visible. Both are
handled: there is a drawn SVG fallback for browsers without WebGL, the render
loop stops when the hero scrolls out of view, and small viewports drop to a
cheaper material set.

**If the brand later commissions real renders or footage**, the frame-sequence
plan below is still the right way to use them, and the part data, callout
layout and scroll wiring would carry over unchanged. Do not switch back on
taste alone.

### Where the frame sequence comes from

Three options, roughly in order of effort:

1. **AI-generated video** (Seedance, Veo, Kling, or Higgsfield) prompted for a
   slow-motion watch-disassembly shot, then frame-extracted and cleaned up.
   Fastest way to get a working prototype; least precise control over exactly
   where each part lands, so callout label positions may need manual
   per-frame adjustment.
2. **A 3D model rendered in Blender**, animated along an explode curve and
   exported frame-by-frame as WebP. More setup, but gives pixel-perfect,
   reproducible part positions and makes re-shooting at a different
   resolution or aspect ratio trivial.
3. **Real photography/videography** of an actual watch, shot coming apart and
   composited into a frame sequence. Highest fidelity, highest cost, and
   requires an actual watch to shoot (or licensed stock footage of a
   generic/non-branded piece).

Start with option 1 to get the interaction working end-to-end, and only
invest in option 2 if the brand direction firms up and warrants pixel-perfect
control.

Going unbranded (plain dial, no printed logo) simplifies all three options —
there's no logo to keep consistent frame-to-frame or composite in afterward,
and it makes stock/generic 3D models or AI-generated footage usable as-is.

## Performance & accessibility rules

- Respect `prefers-reduced-motion`: skip Phase B entirely for those users —
  show one static "exploded" hero image and go straight into normal scroll.
- Preload only the first ~10–15 frames; lazy-load the rest just ahead of
  scroll position, not all at once on page load.
- Budget the whole hero interaction (video + frames) under roughly 6MB
  decoded. Compress aggressively — WebP or AVIF for frames, H.264 + a webm
  fallback for the loop.
- Keep the pinned scroll distance proportional to viewport height so it
  doesn't feel endless on very tall monitors.
- Mobile fallback: scroll-jacking is unreliable on mobile browsers (address
  bar show/hide, momentum scrolling fights with pinning). Either shorten the
  pin distance significantly or replace Phase B on small viewports with a
  simple autoplaying assemble → explode → reassemble loop that doesn't
  require pinning at all.

## Tech stack & rationale

- **Next.js (App Router) + TypeScript** — standard, fast, good image/video
  handling out of the box.
- **Tailwind CSS** — utility styling for everything except the design tokens,
  which live in one place (see below) so the palette/type scale can change
  without hunting through components.
- **GSAP + ScrollTrigger** — the de facto tool for scroll-pinned, scrubbed
  animation; nothing else handles this pattern as reliably.
- **Lenis** — smooth/inertia scrolling site-wide so the rest of the page
  doesn't feel jarring next to the hero.
- **Framer Motion** — smaller UI-level interactions (nav state, button
  hovers, card reveals) where GSAP would be overkill.
- **React Three Fiber** (optional, later) — only bring this in if/when the
  explode sequence graduates from a 2D frame sequence to an actual
  interactive 3D model.

## Coding conventions

- TypeScript strict mode, no implicit `any`.
- Co-locate a section's component, its styles, and any section-specific hook
  in one folder under `src/components/`.
- All colors, spacing, and type-scale values live in `src/styles/tokens.css`
  as CSS custom properties — never hardcode a hex value or a magic pixel
  number in a component.
- GSAP timelines live in `src/lib/animations/`, one file per section,
  imported into the component that uses them — keep raw
  `gsap.to()`/`ScrollTrigger.create()` calls out of JSX where practical.
- Name the hero's canvas-driving hook something explicit like
  `useExplodeSequence`, not `useHero`.

## Project structure

```
├── public/
│   ├── video/hero-loop.{mp4,webm}
│   └── frames/explode/frame-0001.webp … frame-0120.webp
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── hero/
│   │   │   ├── HeroVideo.tsx        # Phase A
│   │   │   ├── ExplodeCanvas.tsx    # Phase B canvas + scrub logic
│   │   │   └── SpecCallout.tsx      # per-part label
│   │   ├── sections/
│   │   │   ├── SpecBreakdown.tsx
│   │   │   ├── Craftsmanship.tsx
│   │   │   ├── LimitedSeries.tsx
│   │   │   ├── Collection.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/
│   ├── lib/
│   │   ├── animations/
│   │   │   ├── hero.ts
│   │   │   └── ...
│   │   └── scroll.ts               # Lenis setup + GSAP ticker sync
│   └── styles/
│       └── tokens.css
```

## Section-by-section content plan

1. **Nav** — minimal, transparent over the hero, solidifies (background fill)
   once scrolled past it.
2. **Hero** — the signature interaction above.
3. **Spec breakdown** — the callouts from the explode sequence, restated as a
   clean grid once everything has settled (material, movement, water
   resistance, power reserve, strap).
4. **Craftsmanship** — editorial black-and-white photography, serif
   pull-quotes, the "made by hand" story.
5. **Limited series** — if the brand is positioned as limited-run: edition
   size, numbering, availability.
6. **Collection** — 3–5 other models in a consistent card treatment
   (carousel or grid).
7. **Trust footer** — warranty length, authentication guarantee, whatever
   stats are actually true — don't invent numbers, leave placeholders
   clearly marked `[PLACEHOLDER]` until real ones are supplied.
8. **Footer** — nav, socials, legal.

## Build phases

- [x] **Phase 0** — scaffold Next.js + Tailwind + GSAP + Lenis, design
      tokens, empty section shells.
- [x] **Phase 1** — static hero (single still image, headline, CTA) so the
      page has a working floor before any animation exists.
- [x] **Phase 2** — ambient hero state. Built as the live 3D scene at rest
      rather than a loop video: the watch sways slowly and the balance and
      seconds hand run. No autoplay policy to fight.
- [x] **Phase 3** — explode sequence MVP: pinned `ScrollTrigger`, scrub
      driving a live WebGL disassembly.
- [x] **Phase 4** — spec callouts, projected from the scene and joined to
      their parts with leader lines.
- [x] **Phase 5** — remaining content sections (spec breakdown,
      craftsmanship, limited series, collection, assurances, footer).
- [x] **Phase 6** — `prefers-reduced-motion` path (held exploded pose, no
      pin, labels already up) and small-viewport fallback (no pin, an
      assemble/explode/reassemble loop with one caption at a time).
- [ ] **Phase 7** — performance pass. Done so far: fonts self-hosted through
      `next/font`, photography served through `next/image` as AVIF/WebP, the
      hero's render loop halted off-screen and the collection row's halted
      until it scrolls into view, cheaper materials under 820px. Still to do:
      Lighthouse on a throttled connection, and Safari and mobile Safari
      checks.
- [ ] **Phase 8** — deploy.

## Commands

```bash
npm run dev      # local dev server
npm run build    # production build
npm run lint     # lint
```

## Things to avoid

- Don't reproduce any single reference site's layout, spacing, or copy —
  match the mood, not the composition.
- Don't use real watch brand names, logos, or product photography anywhere.
- Don't ship Phase 3/4 without also shipping Phase 6 (reduced-motion + mobile
  fallback) — a scroll-jacked hero with no fallback is a real accessibility
  and mobile-usability problem, not a nice-to-have.
- Don't invent real-sounding stats/prices/warranty terms in shipped copy —
  use `[PLACEHOLDER]` until real numbers are supplied.
