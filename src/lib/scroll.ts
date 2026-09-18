"use client";

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

export function registerScrollPlugins(): void {
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isCompactViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 820px)").matches;
}

/**
 * Lenis drives the scroll position and GSAP's ticker drives Lenis, so
 * the pinned hero and the rest of the page advance on the same clock.
 * Reduced-motion visitors keep the browser's native scrolling.
 */
export function initSmoothScroll(): () => void {
  registerScrollPlugins();

  if (prefersReducedMotion()) {
    return () => undefined;
  }

  const lenis = new Lenis({
    duration: 1.15,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,
    touchMultiplier: 1.4,
    wheelMultiplier: 0.95,
  });

  lenis.on("scroll", ScrollTrigger.update);

  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
}
