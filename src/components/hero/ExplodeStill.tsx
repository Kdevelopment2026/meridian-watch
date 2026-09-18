import Image from "next/image";

import { Marked } from "@/components/ui/Marked";
import { WATCH_PARTS } from "@/lib/watch/parts";
import exploded from "@/images/hero-exploded.jpg";
import styles from "./ExplodeStill.module.css";

/**
 * The hero for anyone who has asked for reduced motion, or whose
 * browser has no WebGL. Nothing is pinned, nothing scrubs and nothing
 * moves: the watch is shown already apart, and every part is named
 * outright rather than revealed.
 */
export function ExplodeStill() {
  return (
    <div className={styles.still}>
      <div className={styles.frame}>
        <Image
          src={exploded}
          alt="The watch shown apart: sapphire crystal, grey sunburst dial and hands, the case, the movement, and the case-back, with the alligator strap beside them."
          sizes="(max-width: 900px) 92vw, 46vw"
          placeholder="blur"
          priority
          className={styles.image}
        />
      </div>

      <ol className={styles.parts}>
        {WATCH_PARTS.map((part) => (
          <li key={part.id} className={styles.part}>
            <span className={`${styles.step} numeral`}>
              {String(part.step).padStart(2, "0")}
            </span>
            <span className={styles.name}>{part.name}</span>
            <span className={styles.value}>{part.value}</span>
            <p className={styles.detail}>
              <Marked text={part.detail} />
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
