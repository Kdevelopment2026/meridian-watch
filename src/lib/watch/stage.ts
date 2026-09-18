import type { Object3D } from "three";
import type { PartId } from "./parts";

/**
 * The hero runs at 60fps off a single scroll value. Routing that value
 * through React state would re-render the tree every frame, so the
 * scrub position lives in one mutable module singleton that GSAP
 * writes to and the render loop reads from.
 */

export type StageQuality = "high" | "low";

export type StageMode =
  | "scrub" /** pinned, disassembling under scroll */
  | "auto" /** small viewports: assemble -> explode -> reassemble on a timer */
  | "static"; /** reduced motion: one held exploded pose */

export interface StageState {
  /** 0..1 across the pinned explode, eased in the render loop. */
  progress: number;
  /** The raw value ScrollTrigger writes; `progress` chases it. */
  rawProgress: number;
  mode: StageMode;
  /** -1..1 pointer offset, used for a few degrees of parallax only. */
  pointerX: number;
  pointerY: number;
  /** Radians added by dragging the watch, which decay once released. */
  dragX: number;
  dragY: number;
  dragging: boolean;
  /** Drops texture and shadow cost on weak hardware. */
  quality: StageQuality;
  /** Narrow viewport: the watch centres instead of sitting off-axis. */
  compact: boolean;
}

export const stage: StageState = {
  progress: 0,
  rawProgress: 0,
  mode: "scrub",
  pointerX: 0,
  pointerY: 0,
  dragX: 0,
  dragY: 0,
  dragging: false,
  quality: "high",
  compact: false,
};

/** Live object handles, so callouts can be projected to screen space. */
export const partAnchors = new Map<PartId, Object3D>();

export function registerAnchor(id: PartId, object: Object3D | null): void {
  if (object) partAnchors.set(id, object);
  else partAnchors.delete(id);
}


export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/* ------------------------------------------------------------------ */
/* Callout DOM registry                                                */
/*                                                                     */
/* Labels live in the DOM, not in WebGL, so they stay selectable and   */
/* readable by a screen reader. The render loop writes their screen    */
/* positions directly to these nodes rather than through React state.  */
/* ------------------------------------------------------------------ */

export interface CalloutNodes {
  label: HTMLElement;
  leader: SVGPolylineElement | null;
  dot: SVGCircleElement | null;
}

export const calloutNodes = new Map<PartId, CalloutNodes>();

/**
 * The SVG the leader lines live in. It shares a box with the canvas, so
 * projected points and measured label boxes are both converted into its
 * coordinate space — which is not the viewport's once the hero stops
 * filling the screen.
 */
export const calloutSurface: { el: SVGSVGElement | null } = { el: null };

export function registerCallout(id: PartId, nodes: CalloutNodes | null): void {
  if (nodes) calloutNodes.set(id, nodes);
  else calloutNodes.delete(id);
}
