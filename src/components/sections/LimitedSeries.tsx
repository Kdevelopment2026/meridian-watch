"use client";

import { useRef } from "react";

import { Action } from "@/components/ui/Action";
import { Marked } from "@/components/ui/Marked";
import { Rule } from "@/components/ui/Rule";
import { useDrawnRules } from "@/lib/animations/reveal";
import styles from "./LimitedSeries.module.css";

const FACTS = [
  { label: "Allocation", value: "Made in batches, never in runs" },
  { label: "Numbering", value: "Engraved on the case-back" },
  { label: "The list", value: "Open, and answered in order" },
];

export function LimitedSeries() {
  const scope = useRef<HTMLElement>(null);
  useDrawnRules(scope);

  return (
    <section
      ref={scope}
      id="limited"
      className={`${styles.section} section`}
      aria-labelledby="limited-title"
    >
      <div className="shell">
        <div className={styles.inner}>
          {/* The engraving as it appears on the case-back. */}
          <svg
            className={styles.mark}
            viewBox="0 0 200 200"
            role="img"
            aria-label="Case-back engraving reading number 001"
          >
            <circle className={styles.ring} cx="100" cy="100" r="92" />
            <circle className={styles.ringFaint} cx="100" cy="100" r="84" />
            <circle className={styles.ringFaint} cx="100" cy="100" r="58" />
            <text
              className={styles.numeral}
              x="100"
              y="100"
              textAnchor="middle"
              dominantBaseline="central"
            >
              001
            </text>
          </svg>

          <h2 id="limited-title" className={`${styles.title} type-display`}>
            Numbered in the order it was finished
          </h2>

          <p className={styles.body}>
            Each watch carries the number it held on the bench, not the number
            it held in the order book. We will publish the size of the series
            when the last movement is spoken for, and not before.
          </p>

          <Action href="#collection">Join the list</Action>

          <div className={styles.facts}>
            {FACTS.map((fact) => (
              <div key={fact.label}>
                <Rule />
                <div className={styles.fact}>
                  <span className={styles.factLabel}>{fact.label}</span>
                  <span className={styles.factValue}>
                    <Marked text={fact.value} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
