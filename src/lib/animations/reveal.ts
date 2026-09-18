"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { prefersReducedMotion, registerScrollPlugins } from "@/lib/scroll";

/**
 * The page has exactly one scroll-reveal device: structural hairlines
 * draw themselves left to right as a section arrives. Text does not
 * fade or rise — the hero is where the motion budget is spent, and
 * every section animating itself in would cheapen it.
 */
export function useDrawnRules(scope: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    if (prefersReducedMotion()) {
      root.querySelectorAll<HTMLElement>("[data-draw]").forEach((el) => {
        el.style.transform = "none";
      });
      return;
    }

    registerScrollPlugins();

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-draw]").forEach((el) => {
        gsap.fromTo(
          el,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.5,
            ease: "expo.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              once: true,
            },
          },
        );
      });
    }, root);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [scope]);
}
