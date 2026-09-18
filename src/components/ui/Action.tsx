import type { AnchorHTMLAttributes } from "react";

import styles from "./Action.module.css";

export interface ActionProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "primary" | "quiet";
}

/**
 * Every call to action on this site is a line of text over a hairline.
 * Nothing is a filled button: a filled button is louder than the watch.
 */
export function Action({
  variant = "primary",
  className,
  children,
  ...rest
}: ActionProps) {
  return (
    <a
      className={[styles.action, variant === "quiet" ? styles.quiet : "", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </a>
  );
}
