"use client";

import { useEffect, useState } from "react";

import { Action } from "./Action";
import styles from "./Nav.module.css";

const LINKS = [
  { href: "#specification", label: "The watch" },
  { href: "#craft", label: "How it is made" },
  { href: "#limited", label: "Edition" },
  { href: "#collection", label: "Collection" },
];

/**
 * Transparent over the hero, then fills once the watch is behind you.
 */
export function Nav() {
  const [settled, setSettled] = useState(false);

  // The bar fills only once the hero has actually left the frame. The
  // hero is pinned, so scroll position and what you can see disagree for
  // most of it; measuring the hero's own height is what stays correct.
  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const navHeight =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--nav-height",
          ),
        ) * 16 || 72;
      setSettled(window.scrollY > hero.offsetHeight - navHeight);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header className={styles.nav} data-settled={settled ? "true" : "false"}>
      <a className={styles.skip} href="#specification">
        Skip to the specification
      </a>
      <nav className={styles.inner} aria-label="Primary">
        <a className={styles.wordmark} href="#top">
          Meridian
        </a>
        <ul className={styles.links}>
          {LINKS.map((link) => (
            <li key={link.href}>
              <a className={styles.link} href={link.href}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <Action href="#limited" variant="quiet">
          Reserve
        </Action>
      </nav>
    </header>
  );
}
