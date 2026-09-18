"use client";

import { useEffect, useRef, type RefObject } from "react";

import { WATCH_PARTS, type PartId, type WatchPart } from "@/lib/watch/parts";
import { calloutSurface, registerCallout } from "@/lib/watch/stage";
import styles from "./Hero.module.css";

/**
 * Callout labels are real DOM, not sprites: they stay selectable,
 * translatable and legible to a screen reader, and the leader lines
 * are one SVG the render loop repoints each frame.
 */

const LEFT_ORDER: PartId[] = ["crystal", "dial", "case", "strap"];
const RIGHT_ORDER: PartId[] = ["movement", "caseback", "hands"];

function slotTop(index: number, count: number): string {
  const top = 16;
  const bottom = 84;
  if (count <= 1) return `${(top + bottom) / 2}%`;
  return `${top + ((bottom - top) * index) / (count - 1)}%`;
}

function Callout({
  part,
  top,
  labelRef,
}: {
  part: WatchPart;
  top: string;
  labelRef: (node: HTMLElement | null) => void;
}) {
  return (
    <figure
      ref={labelRef}
      className={styles.callout}
      data-anchor={part.anchor}
      style={{ top }}
    >
      <figcaption>
        <span className={`${styles.calloutStep} numeral`}>
          {String(part.step).padStart(2, "0")}
        </span>
        <span className={styles.calloutName}>{part.name}</span>
        <span className={styles.calloutValue}>{part.value}</span>
      </figcaption>
    </figure>
  );
}

export function CalloutLayer() {
  const labels = useRef(new Map<PartId, HTMLElement>());
  const leaders = useRef(new Map<PartId, SVGPolylineElement>());
  const dots = useRef(new Map<PartId, SVGCircleElement>());

  useEffect(() => {
    const ids = WATCH_PARTS.map((part) => part.id);
    ids.forEach((id) => {
      const label = labels.current.get(id);
      if (!label) return;
      registerCallout(id, {
        label,
        leader: leaders.current.get(id) ?? null,
        dot: dots.current.get(id) ?? null,
      });
    });
    return () => ids.forEach((id) => registerCallout(id, null));
  }, []);

  const bind =
    <T extends Element>(store: RefObject<Map<PartId, T>>, id: PartId) =>
    (node: T | null) => {
      if (node) store.current.set(id, node);
      else store.current.delete(id);
    };

  return (
    <div
      className={styles.calloutLayer}
      role="group"
      aria-label="Part specifications, revealed as the watch comes apart"
    >
      <svg
        className={styles.leaders}
        aria-hidden="true"
        ref={(node) => {
          calloutSurface.el = node;
        }}
      >
        {WATCH_PARTS.map((part) => (
          <g key={part.id}>
            <polyline
              ref={bind<SVGPolylineElement>(leaders, part.id)}
              points=""
              fill="none"
              stroke="var(--color-brass-lit)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              style={{ opacity: 0 }}
            />
            <circle
              ref={bind<SVGCircleElement>(dots, part.id)}
              r="2.5"
              fill="var(--color-brass-lit)"
              style={{ opacity: 0 }}
            />
          </g>
        ))}
      </svg>

      {LEFT_ORDER.map((id, i) => {
        const part = WATCH_PARTS.find((p) => p.id === id)!;
        return (
          <Callout
            key={id}
            part={part}
            top={slotTop(i, LEFT_ORDER.length)}
            labelRef={bind<HTMLElement>(labels, id)}
          />
        );
      })}

      {RIGHT_ORDER.map((id, i) => {
        const part = WATCH_PARTS.find((p) => p.id === id)!;
        return (
          <Callout
            key={id}
            part={part}
            top={slotTop(i, RIGHT_ORDER.length)}
            labelRef={bind<HTMLElement>(labels, id)}
          />
        );
      })}
    </div>
  );
}

/** Small-viewport stand-in: one caption at a time, under the watch. */
export function CalloutCaption({ part }: { part: WatchPart | null }) {
  return (
    <div className={styles.caption} aria-live="polite">
      {part ? (
        <>
          <span className={`${styles.calloutStep} numeral`}>
            {String(part.step).padStart(2, "0")}
          </span>
          <span className={styles.calloutName}>{part.name}</span>
          <span className={styles.calloutValue}>{part.value}</span>
        </>
      ) : null}
    </div>
  );
}
