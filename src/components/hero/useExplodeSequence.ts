"use client";

import { useEffect, useState, type RefObject } from "react";
import { gsap } from "gsap";

import { registerScrollPlugins } from "@/lib/scroll";
import { SETTLE_PROGRESS, WATCH_PARTS, type WatchPart } from "@/lib/watch/parts";
import {
  stage,
  type StageMode,
  type StageQuality,
} from "@/lib/watch/stage";

export interface ExplodeSequenceTargets {
  section: RefObject<HTMLElement | null>;
  pin: RefObject<HTMLDivElement | null>;
  intro: RefObject<HTMLDivElement | null>;
  cue: RefObject<HTMLDivElement | null>;
  /** Set when the browser cannot render the live scene at all. */
  forceStatic?: boolean;
}

export interface ExplodeSequenceState {
  mode: StageMode;
  /**
   * How much the scene is allowed to spend. Decided here and passed
   * down, so the canvas, the watch and the caliber can never disagree
   * about it.
   */
  quality: StageQuality;
  /** Only used by the small-viewport caption. */
  activePart: WatchPart | null;
}

/** Walked back to front to find the part that has most recently settled. */
const NEWEST_FIRST = [...WATCH_PARTS].reverse();

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";
const COMPACT_QUERY = "(max-width: 820px)";

function resolveMode(forceStatic: boolean): StageMode {
  if (forceStatic || window.matchMedia(REDUCE_QUERY).matches) return "static";
  return window.matchMedia(COMPACT_QUERY).matches ? "auto" : "scrub";
}

/**
 * Drives the hero's second phase.
 *
 * Wide viewport, motion allowed  -> pin and scrub under scroll.
 * Small viewport                 -> no pin at all; the watch opens and
 *                                   closes on its own, because pinning
 *                                   fights mobile momentum scrolling and
 *                                   the collapsing address bar.
 * Reduced motion                 -> one held exploded pose, no pin, no
 *                                   loop, every label already up.
 */
export function useExplodeSequence(
  targets: ExplodeSequenceTargets,
): ExplodeSequenceState {
  // The server has no media queries, so the first paint uses the desktop
  // layout and the real mode is settled on mount.
  const [mode, setMode] = useState<StageMode>("scrub");
  const [quality, setQuality] = useState<StageQuality>("high");
  const [activePart, setActivePart] = useState<WatchPart | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia(REDUCE_QUERY);
    const compact = window.matchMedia(COMPACT_QUERY);
    const apply = () => setMode(resolveMode(targets.forceStatic === true));

    apply();
    reduce.addEventListener("change", apply);
    compact.addEventListener("change", apply);
    return () => {
      reduce.removeEventListener("change", apply);
      compact.removeEventListener("change", apply);
    };
  }, [targets.forceStatic]);

  useEffect(() => {
    registerScrollPlugins();

    stage.mode = mode;
    stage.compact = mode === "auto";
    // A small screen or a thin CPU both mean the same thing here.
    const next: StageQuality =
      mode === "auto" || (navigator.hardwareConcurrency ?? 8) <= 4
        ? "low"
        : "high";
    stage.quality = next;
    setQuality(next);

    if (mode === "static") {
      stage.rawProgress = SETTLE_PROGRESS + 0.06;
      stage.progress = stage.rawProgress;
      return;
    }

    if (mode === "auto") {
      const value = { at: 0 };
      const write = () => {
        stage.rawProgress = value.at;
      };
      const loop = gsap
        .timeline({ repeat: -1, defaults: { ease: "power2.inOut" } })
        .to(value, { at: SETTLE_PROGRESS + 0.05, duration: 5.4, onUpdate: write })
        .to({}, { duration: 1.6 })
        .to(value, { at: 0, duration: 4.2, onUpdate: write })
        .to({}, { duration: 1.2 });

      let current: WatchPart | null = null;
      const watchCaption = () => {
        const settled =
          NEWEST_FIRST.find((part) => stage.progress >= part.to - 0.04) ?? null;
        if (settled !== current) {
          current = settled;
          setActivePart(settled);
        }
      };
      gsap.ticker.add(watchCaption);

      return () => {
        gsap.ticker.remove(watchCaption);
        loop.kill();
        stage.rawProgress = 0;
        setActivePart(null);
      };
    }

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: targets.section.current,
          start: "top top",
          // Proportional to the viewport, so a tall monitor does not turn
          // the hero into an endless corridor.
          end: () => `+=${window.innerHeight * 3.9}`,
          pin: targets.pin.current,
          pinSpacing: true,
          scrub: 0.45,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            stage.rawProgress = self.progress;
          },
        },
      });

      timeline
        .to(
          targets.intro.current,
          { autoAlpha: 0, y: -36, duration: 0.14, ease: "none" },
          0,
        )
        .to(targets.cue.current, { autoAlpha: 0, duration: 0.06, ease: "none" }, 0)
        .to({}, { duration: 0.86 });
    });

    return () => {
      context.revert();
      stage.rawProgress = 0;
    };
  }, [mode, targets.section, targets.pin, targets.intro, targets.cue]);

  return { mode, quality, activePart };
}
