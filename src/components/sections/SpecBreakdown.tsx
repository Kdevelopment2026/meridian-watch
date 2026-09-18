"use client";

import { useRef } from "react";

import { Marked } from "@/components/ui/Marked";
import { Rule } from "@/components/ui/Rule";
import { useDrawnRules } from "@/lib/animations/reveal";
import { WATCH_PARTS } from "@/lib/watch/parts";
import styles from "./SpecBreakdown.module.css";

export function SpecBreakdown() {
  const scope = useRef<HTMLElement>(null);
  useDrawnRules(scope);

  return (
    <section
      ref={scope}
      id="specification"
      className={`${styles.section} section`}
      aria-labelledby="specification-title"
    >
      <div className="shell">
        <div className={styles.head}>
          <h2 id="specification-title" className={`${styles.title} type-display`}>
            Everything that just came apart
          </h2>
          <p className={styles.note}>
            The same seven parts, in the order a watchmaker takes them off.
            What each one is made of, and what was done to it before it went
            back in.
          </p>
        </div>

        <div className={styles.table}>
          {WATCH_PARTS.map((part) => (
            <div key={part.id}>
              <Rule />
              <div className={styles.row}>
                <span className={`${styles.step} numeral`}>
                  {String(part.step).padStart(2, "0")}
                </span>
                <span className={styles.name}>{part.name}</span>
                <p className={styles.value}>{part.value}</p>
                <p className={styles.detail}>
                  <Marked text={part.detail} />
                </p>
              </div>
            </div>
          ))}
          <Rule />
        </div>
      </div>
    </section>
  );
}
