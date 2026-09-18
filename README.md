# Meridian — Luxury Watch Brand Experience

*(Working title — swap in the real brand name before launch.)*

A cinematic, single-product site for a high-end watch brand, built around one
idea: **the hero watch comes apart as you scroll**, and the pieces double as the
spec sheet.

`CLAUDE.md` holds the full technical spec and the build plan. This README is the
human-facing overview of what is actually in the repo today.

## The concept

You land on a watch turning slowly in a dark room. Scroll, and the viewport
pins: the strap falls away, the case-back lifts, the movement floats out, the
crystal separates from the dial, the hands come off, and the case is left as an
empty ring. Each part settles into its own place on screen and a small label
fades in beside it, joined to the part by a thin leader line. When the last part
has settled, the pin releases and the page carries on.

It is the exploded technical diagram, done as brand theatre rather than a table.

## How the hero is built

The watch is **rendered live in WebGL**, not played back as a video or a
pre-rendered frame sequence. The case, crystal, dial, markers, hands, case-back
and strap are generated in code from lathe profiles, extruded shapes and
canvas-drawn textures, then lit by a studio rig of area lights built for the
scene. Every material is matched to the supplied photography: mirror-polished
steel, a grey sunburst dial with applied batons doubled at twelve, and a black
alligator strap that runs its full length and closes on a pin buckle.

**The movement runs.** The caliber is modelled after the reference
photography — barrel and ratchet at the top, the train down the right, the
balance and its hairspring under a cock at the bottom left — and it is not a
still. The going train turns at geared ratios, the escape wheel steps rather
than sweeps, and the pallet fork rocks with the balance, so what you are
watching is an escapement rather than a set of spinning discs. Its finishing is
drawn rather than mapped: perlage on the main plate, Cotes de Geneve on the
bridges, ruby jewels in polished chatons, blued screws.

Once every part has settled, the last stretch of the scroll is a slow push
into the empty case.

The dial shows the visitor's **real local time**, not the 10:10 pose product
photography uses. Each hand carries the fraction of the one below it, and the
seconds hand sweeps rather than steps.

**Drag the watch to turn it**, at any point in the disassembly. Mouse and pen
only: on a touchscreen a drag is how you scroll, and taking that over would be
worse than the feature is worth. The turn decays back to the resting sway a few
seconds after you let go.

This departs from the frame-sequence plan in `CLAUDE.md`. The reasons are in
that file under **As built**.

The hero runs in one of three modes, chosen on mount and re-chosen if the
viewport or the visitor's motion preference changes:

| Mode | When | Behaviour |
| --- | --- | --- |
| `scrub` | Wide viewport, motion allowed | Pinned for about 3 viewport heights, disassembly scrubbed by scroll |
| `auto` | Viewport under 820px | Nothing is pinned. The watch opens and closes on a loop, with one caption at a time |
| `static` | `prefers-reduced-motion: reduce`, or no WebGL | Nothing is pinned and nothing moves. The exploded photograph, with all seven parts named outright beside it |

Scroll position is written into a single mutable value that the render loop
reads, so scrolling never re-renders the React tree. The labels are real DOM
elements, so they stay selectable and legible to a screen reader; only their
leader lines are recomputed per frame. The canvas stops rendering entirely once
the hero leaves the viewport.

## Tech stack

- **Next.js (App Router) + TypeScript**, strict mode
- **Tailwind CSS** for layout utilities, CSS custom properties for design tokens
- **three.js + React Three Fiber + drei** for the watch, the collection row and their lighting
- **GSAP + ScrollTrigger** to pin the hero and drive the disassembly off scroll
- **Lenis** for smooth scrolling site-wide, tied to the GSAP ticker

## Getting started

```bash
npm install --legacy-peer-deps
npm run dev
```

Open `http://localhost:3000`.

`npm run build` produces a fully static site in `out/`. There is no server
rendering at request time and no API route, so the build can be dropped on any
static host. Set `SITE_BASE_PATH` to serve the same build from a sub-path:

```bash
SITE_BASE_PATH=/demos/meridian npm run build
```

`--legacy-peer-deps` is needed because React Three Fiber declares optional peer
dependencies on Expo, which npm otherwise tries to resolve against React 19.

## Project structure

```
├── src/
│   ├── app/
│   │   ├── layout.tsx              # fonts, metadata, smooth scroll
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── hero/
│   │   │   ├── Hero.tsx            # composition, the three modes, drag
│   │   │   ├── ExplodeStage.tsx    # canvas, lighting, camera rig, projection
│   │   │   ├── WatchModel.tsx      # the watch, generated in code
│   │   │   ├── MovementPhoto.tsx   # the caliber, photographed
│   │   │   ├── ExplodeStill.tsx    # the no-motion, no-WebGL hero
│   │   │   ├── SpecCallout.tsx     # labels and leader lines
│   │   │   ├── useExplodeSequence.ts
│   │   │   └── Hero.module.css
│   │   ├── sections/               # SpecBreakdown, Craftsmanship,
│   │   │                           # LimitedSeries, Collection +
│   │   │                           # CollectionStage, Assurances, Footer
│   │   └── ui/                     # Nav, Action, Rule, DialMark,
│   │                               # Plate, Marked, SmoothScroll
│   ├── images/                     # the supplied photography
│   ├── lib/
│   │   ├── animations/reveal.ts    # the one scroll-reveal device
│   │   ├── scroll.ts               # Lenis + GSAP ticker
│   │   └── watch/
│   │       ├── parts.ts            # the disassembly order and all copy
│   │       ├── stage.ts            # shared render state
│   │       └── dialTexture.ts      # dial and movement plate, drawn to canvas
│   └── styles/tokens.css           # colour, type, spacing, motion
├── README.md
└── CLAUDE.md
```

`src/lib/watch/parts.ts` is the spine. The disassembly order, each part's
resting place, its label copy and its timing window are declared once there, and
drive both the 3D scene and the specification grid further down the page.

## Photography

Four frames live in `src/images/`, and each is used for something specific:

| File | Where it appears |
| --- | --- |
| `hero-assembled.jpg` | Craftsmanship, twice: the closed case, and the strap |
| `hero-exploded.jpg` | The hero for reduced motion and for browsers without WebGL |
| `movement-apart.jpg` | Craftsmanship: the caliber taken apart |
| `movement-whole.jpg` | Reference for the modelled caliber; not currently shipped |

The originals are kept beside them under their supplied filenames. The
craftsmanship plates are desaturated and grained in CSS rather than pre-edited,
so the treatment can be changed in one place.

## Design direction

Dark, editorial, unhurried. A warm near-black ground, aged brass used sparingly
and mostly as reflected light on the metal, warm off-white text. Fraunces for
the voice, Archivo for everything functional. The motion budget is spent almost
entirely on the hero: elsewhere the only scroll-triggered effect is a hairline
that draws itself as a section arrives.

The watch carries no name on its dial, and no real brand's name, mark or
photography appears anywhere in the code or copy.

## Copy, and what is deliberately absent

There is no placeholder text anywhere on the site. Rather than invent
specifications, the copy does not claim any: no case dimensions, no water
resistance rating, no jewel or component count, no frequency, no power reserve,
no warranty term, no edition size. Every line describes a material or a process,
which is true of the watch as built.

When the real figures exist they belong in `src/lib/watch/parts.ts` for the
seven parts, and in the Limited Series, Collection, Assurances and Footer
sections for everything else.

## Status and what is left

Built: scaffold and tokens, the live 3D hero in all three modes, the spec
callouts, every content section, and the reduced-motion and small-viewport
paths. `npm run build` and `npm run lint` both pass.

Not done: a Lighthouse pass on a throttled connection, and cross-browser checks
in Safari and mobile Safari. The real brand name and the real specifications
still need to be supplied.
