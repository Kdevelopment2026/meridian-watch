"use client";

import { useEffect } from "react";

import { initSmoothScroll } from "@/lib/scroll";

/** Mounts Lenis and ties it to GSAP's ticker for the whole document. */
export function SmoothScroll() {
  useEffect(() => initSmoothScroll(), []);
  return null;
}
