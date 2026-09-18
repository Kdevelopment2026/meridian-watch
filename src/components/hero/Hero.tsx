"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { Action } from "@/components/ui/Action";
import { stage } from "@/lib/watch/stage";
import { CalloutCaption, CalloutLayer } from "./SpecCallout";
import { useExplodeSequence } from "./useExplodeSequence";
import styles from "./Hero.module.css";

import { ExplodeStill } from "./ExplodeStill";

const ExplodeStage = dynamic(
  () => import("./ExplodeStage").then((m) => m.ExplodeStage),
  {
    ssr: false,
    loading: () => null,
  },
);

function hasWebgl(): boolean {
  try {
    const probe = document.createElement("canvas");
    return Boolean(
      probe.getContext("webgl2") ??
        probe.getContext("webgl") ??
        probe.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);

  const [webgl, setWebgl] = useState(true);
  const { mode, activePart } = useExplodeSequence({
    section,
    pin,
    intro,
    cue,
    forceStatic: !webgl,
  });
  const [onScreen, setOnScreen] = useState(true);

  // Without WebGL there is no scene to scrub, so the hero falls back to
  // the photograph of the watch already apart.
  useEffect(() => setWebgl(hasWebgl()), []);

  // No reason to keep a WebGL loop running behind three screens of text.
  useEffect(() => {
    const node = pin.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // A few degrees of parallax on pointer move. Enough to feel like the
  // object has weight, not enough to notice as an effect.
  useEffect(() => {
    if (mode === "static") return;
    const onMove = (event: PointerEvent) => {
      stage.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      stage.pointerY = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mode]);

  // Drag to turn the watch, at any point in the disassembly. Mouse and
  // pen only: on a touchscreen a drag is how you scroll the page, and
  // taking that over would be worse than the feature is worth.
  useEffect(() => {
    const node = frame.current;
    if (!node || mode === "static") return;

    let pointerId: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const down = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerId = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      stage.dragging = true;
      node.setPointerCapture(event.pointerId);
      node.dataset.dragging = "true";
    };

    const move = (event: PointerEvent) => {
      if (pointerId !== event.pointerId || !stage.dragging) return;
      stage.dragX += ((event.clientX - lastX) / window.innerWidth) * 3.4;
      stage.dragY += ((event.clientY - lastY) / window.innerHeight) * 2.2;
      // Keep it a turn of the wrist, not a free orbit.
      stage.dragY = Math.max(-0.5, Math.min(0.5, stage.dragY));
      lastX = event.clientX;
      lastY = event.clientY;
    };

    const up = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
      stage.dragging = false;
      node.releasePointerCapture?.(event.pointerId);
      delete node.dataset.dragging;
    };

    node.addEventListener("pointerdown", down);
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerup", up);
    node.addEventListener("pointercancel", up);
    return () => {
      node.removeEventListener("pointerdown", down);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", up);
      node.removeEventListener("pointercancel", up);
      stage.dragging = false;
    };
  }, [mode]);

  return (
    <section
      ref={section}
      id="hero"
      className={styles.hero}
      aria-labelledby="hero-title"
    >
      <div ref={pin} className={styles.pin} data-mode={mode}>
        <div ref={intro} className={styles.intro}>
          <div className={styles.introInner}>
            <h1 id="hero-title" className={`${styles.headline} type-display`}>
              Nothing on it is there to be seen from across a room.
            </h1>
            <p className={styles.lede}>
              Meridian makes one watch. Keep scrolling and it comes apart, which
              is the only honest way to show what you are buying.
            </p>
            <div className={styles.actions}>
              <Action href="#limited">Reserve a number</Action>
              <Action href="#specification" variant="quiet">
                Read the specification
              </Action>
            </div>
          </div>
        </div>

        {mode === "static" ? (
          <ExplodeStill />
        ) : (
          <div ref={frame} className={styles.frame}>
            <div className={styles.stage}>
              <ExplodeStage
                reducedMotion={false}
                quality={mode === "auto" ? "low" : "high"}
                paused={!onScreen}
              />
            </div>

            <div className={styles.vignette} />
            <div className={styles.grain} />

            {mode === "auto" ? (
              <CalloutCaption part={activePart} />
            ) : (
              <CalloutLayer />
            )}
          </div>
        )}

        <p className={styles.plate}>
          <span>Edition</span>
          <span className={`${styles.plateNumber} numeral`}>No. 001</span>
        </p>

        <div ref={cue} className={styles.cue}>
          <span className={styles.cueTrack} aria-hidden="true" />
          <span>Drag to turn it. Scroll to open the case.</span>
        </div>
      </div>

      {/* Marks the end of the pinned hero for the navigation bar. */}
      <div id="hero-end" aria-hidden="true" className={styles.sentinel} />
    </section>
  );
}
