/**
 * The disassembly order is the site's spine. It drives the 3D explode,
 * the callout labels, and the spec grid further down the page, so the
 * order and the copy are declared once, here.
 *
 * Every quantity a buyer could hold us to is left as [PLACEHOLDER].
 * Material and finishing language is brand copy, not a claim.
 */

export type PartId =
  | "strap"
  | "caseback"
  | "movement"
  | "crystal"
  | "dial"
  | "hands"
  | "case";

export type Vec3 = [number, number, number];

export interface WatchPart {
  id: PartId;
  /** 1-indexed position in the disassembly sequence. */
  step: number;
  name: string;
  /** Headline value for the callout and the spec grid. */
  value: string;
  /** One sentence of supporting detail. */
  detail: string;
  /** Resting offset while the watch is whole. */
  assembled: Vec3;
  /** Offset once the part has drifted clear. */
  exploded: Vec3;
  /**
   * A point on the part itself, in the part's own space, for the
   * callout's leader line to land on. Without this the line points at
   * the group origin, which for the strap or the case-back is nowhere
   * near the thing being named.
   */
  anchorAt: Vec3;
  /** Euler rotation applied across the drift, in radians. */
  tumble: Vec3;
  /**
   * Scale the part reaches once clear of the case. An exploded diagram
   * is allowed this liberty: the hands are unreadable at true scale and
   * the strap will not fit the frame at it.
   */
  scaleTo?: number;
  /** Scrub progress at which the part starts to move. */
  from: number;
  /** Scrub progress at which the part has settled. */
  to: number;
  /** Which margin the callout hangs from on wide screens. */
  anchor: "left" | "right";
}

export const WATCH_PARTS: WatchPart[] = [
  {
    id: "strap",
    step: 1,
    name: "Strap",
    value: "Black alligator, hand-closed",
    detail:
      "Squared scales, cut so the run narrows toward the buckle. Closed by one pair of hands, saddle-stitched down both edges.",
    assembled: [0, 0, 0],
    exploded: [-1.95, -0.45, 0.12],
    anchorAt: [0, -1.55, -0.6],
    tumble: [0.2, -0.22, 0.08],
    scaleTo: 0.55,
    from: 0.05,
    to: 0.24,
    anchor: "left",
  },
  {
    id: "caseback",
    step: 2,
    name: "Case-back",
    value: "Screw-down sapphire",
    detail:
      "Six threads and a gasket. Opened only by someone who intends to put it back.",
    assembled: [0, 0, 0],
    exploded: [2.05, -0.82, -1.2],
    anchorAt: [0, 0, -0.14],
    tumble: [0.28, 0.3, -0.16],
    from: 0.13,
    to: 0.33,
    anchor: "right",
  },
  {
    id: "movement",
    step: 3,
    name: "Movement",
    value: "Caliber M.01, hand-wound",
    detail:
      "Hand-wound, jewelled through the train, and left open to the case-back so you can watch it run.",
    assembled: [0, 0, 0],
    exploded: [1.62, 1.02, -0.15],
    anchorAt: [0.3, 0.22, -0.1],
    tumble: [-0.12, -0.26, 0.12],
    from: 0.22,
    to: 0.45,
    anchor: "right",
  },
  {
    id: "crystal",
    step: 4,
    name: "Crystal",
    value: "Box sapphire, double-coated",
    detail:
      "Domed the old way, so the dial bends slightly as you tilt it toward the light.",
    assembled: [0, 0, 0],
    exploded: [0.05, 1.05, 0.62],
    anchorAt: [0.46, 0.44, 0.14],
    tumble: [0.2, 0.3, 0.05],
    from: 0.32,
    to: 0.54,
    anchor: "left",
  },
  {
    id: "dial",
    step: 5,
    name: "Dial",
    value: "Grey sunburst, unsigned",
    detail:
      "Brushed from the centre out, so it opens under the light and closes toward the rehaut. Nothing is printed on it.",
    assembled: [0, 0, 0],
    exploded: [-2.0, 0.95, 0.4],
    anchorAt: [0.42, -0.42, 0.03],
    tumble: [0.1, 0.3, -0.1],
    from: 0.42,
    to: 0.63,
    anchor: "left",
  },
  {
    id: "hands",
    step: 6,
    name: "Hands",
    value: "Polished steel, faceted",
    detail:
      "Cut, then brought to a mirror by hand. Each one carries a single bright line that turns with the wrist.",
    assembled: [0, 0, 0],
    exploded: [0.42, -1.3, 1.15],
    anchorAt: [0, 0, 0.06],
    tumble: [0.05, -0.05, 0.52],
    scaleTo: 0.9,
    from: 0.52,
    to: 0.73,
    anchor: "right",
  },
  {
    id: "case",
    step: 7,
    name: "Case",
    value: "Cold-forged steel, mirror-polished",
    detail:
      "Turned from one billet, chamfered by hand, and sealed against water at the back and the crown.",
    assembled: [0, 0, 0],
    exploded: [0, -0.1, -0.6],
    anchorAt: [0.94, 0.2, 0],
    tumble: [0.03, 0.16, -0.04],
    from: 0.6,
    to: 0.8,
    anchor: "left",
  },
];

export const PART_BY_ID = Object.fromEntries(
  WATCH_PARTS.map((part) => [part.id, part]),
) as Record<PartId, WatchPart>;

/** Where the case comes to rest, so the camera can close in on it. */
export const CASE_REST = PART_BY_ID.case.exploded;

/** Progress at which the last part has settled and the hold begins. */
export const SETTLE_PROGRESS = 0.82;

/**
 * Eased 0..1 travel for one part at a given global scrub progress.
 * Slow in, slower out — nothing on this site arrives abruptly.
 */
export function partProgress(part: WatchPart, progress: number): number {
  const span = part.to - part.from;
  if (span <= 0) return progress >= part.to ? 1 : 0;
  const raw = (progress - part.from) / span;
  const clamped = raw < 0 ? 0 : raw > 1 ? 1 : raw;
  // cubic in-out
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

/** Opacity for a part's callout label, cross-fading in as it settles. */
export function calloutOpacity(part: WatchPart, progress: number): number {
  const fadeIn = part.to - 0.07;
  const fadeFull = part.to + 0.02;
  if (progress <= fadeIn) return 0;
  if (progress >= fadeFull) return 1;
  return (progress - fadeIn) / (fadeFull - fadeIn);
}
