import type { CSSProperties } from "react";
import Image, { type StaticImageData } from "next/image";

import styles from "./Plate.module.css";

export interface PlateProps {
  image: StaticImageData;
  alt: string;
  caption: string;
  /** CSS object-position, used to crop to one detail of the frame. */
  focus: string;
  /** Scale the frame up to crop further in than `cover` can reach. */
  zoom?: number;
  /** Point the zoom pulls toward. */
  origin?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}

export function Plate({
  image,
  alt,
  caption,
  focus,
  zoom = 1,
  origin = "50% 50%",
  sizes,
  priority = false,
  className,
}: PlateProps) {
  return (
    <figure className={[styles.plate, className].filter(Boolean).join(" ")}>
      <Image
        src={image}
        alt={alt}
        fill
        sizes={sizes}
        placeholder="blur"
        priority={priority}
        className={styles.image}
        style={
          {
            objectPosition: focus,
            transformOrigin: origin,
            "--plate-zoom": zoom,
          } as CSSProperties
        }
      />
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
}
