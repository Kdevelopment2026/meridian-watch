"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { DialMark, type IndexStyle } from "@/components/ui/DialMark";
import { prefersReducedMotion } from "@/lib/scroll";
import styles from "./Collection.module.css";

const CollectionStage = dynamic(
  () => import("./CollectionStage").then((m) => m.CollectionStage),
  { ssr: false, loading: () => null },
);

interface Model {
  ref: string;
  name: string;
  description: string;
  /** Flat treatment, used where the live scene cannot run. */
  dialFlat: string;
  accent: string;
  indices: IndexStyle;
  subdial?: boolean;
  /** Live treatment: a tint over the same sunburst the hero dial uses. */
  dial: string;
  marker: string;
  hand: string;
}

const MODELS: Model[] = [
  {
    ref: "Ref. A1",
    name: "Slate",
    description: "Grey sunburst, polished batons, doubled at twelve.",
    dialFlat: "#31333a",
    accent: "#cfc8bb",
    indices: "baton",
    dial: "#cdd1d5",
    marker: "#e4e8ea",
    hand: "#eef1f3",
  },
  {
    ref: "Ref. A2",
    name: "Ivory",
    description: "Lacquered ivory over brass, warmed markers.",
    dialFlat: "#cdc4b1",
    accent: "#3a342c",
    indices: "baton",
    dial: "#f7ecd2",
    marker: "#c8a463",
    hand: "#d8bd85",
  },
  {
    ref: "Ref. B1",
    name: "Nocturne",
    description: "Deep blue sunburst, steel markers, no register.",
    dialFlat: "#15294a",
    accent: "#c9d4e4",
    indices: "dot",
    dial: "#4272c9",
    marker: "#dfe6ee",
    hand: "#eef3f8",
  },
  {
    ref: "Ref. C1",
    name: "Graphite",
    description: "Near-black dial, gilt markers, flat crystal.",
    dialFlat: "#2a2823",
    accent: "#c3a367",
    indices: "sector",
    dial: "#8e8a85",
    marker: "#c9a468",
    hand: "#d9c08a",
  },
];

export function Collection() {
  const slots = useRef<(HTMLElement | null)[]>([]);
  const hovered = useRef(-1);
  const [live, setLive] = useState(false);

  // The live row needs WebGL, and it turns, so it is not offered to
  // anyone who has asked for less motion.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    try {
      const probe = document.createElement("canvas");
      setLive(Boolean(probe.getContext("webgl2") ?? probe.getContext("webgl")));
    } catch {
      setLive(false);
    }
  }, []);

  return (
    <section
      id="collection"
      className={`${styles.section} section`}
      aria-labelledby="collection-title"
    >
      <div className="shell">
        <div className={styles.head}>
          <h2 id="collection-title" className={`${styles.title} type-display`}>
            The same watch, four ways to read it
          </h2>
          <p className={styles.note}>
            One case, one movement, four dials. Choosing between them is the
            only decision we ask you to make.
          </p>
        </div>

        <div className={styles.row}>
          <ul className={styles.list}>
            {MODELS.map((model, index) => (
              <li
                key={model.ref}
                className={styles.item}
                onPointerEnter={() => {
                  hovered.current = index;
                }}
                onPointerLeave={() => {
                  hovered.current = -1;
                }}
              >
                <figure
                  className={styles.figure}
                  data-live={live ? "true" : "false"}
                  ref={(node) => {
                    slots.current[index] = node;
                  }}
                  aria-label={
                    live
                      ? `${model.ref} ${model.name}, shown turning`
                      : undefined
                  }
                  role={live ? "img" : undefined}
                >
                  {live ? null : (
                    <DialMark
                      dial={model.dialFlat}
                      accent={model.accent}
                      indices={model.indices}
                      subdial={model.subdial}
                      title={`${model.ref} ${model.name}, drawn dial`}
                    />
                  )}
                </figure>
                <span className={styles.ref}>
                  {model.ref} {model.name}
                </span>
                <p className={styles.desc}>{model.description}</p>
                <p className={styles.status}>Available to order</p>
              </li>
            ))}
          </ul>

          {live ? (
            <CollectionStage models={MODELS} slots={slots} hovered={hovered} />
          ) : null}
        </div>
      </div>
    </section>
  );
}
