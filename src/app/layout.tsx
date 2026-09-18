import type { Metadata, Viewport } from "next";
import { Archivo, Fraunces } from "next/font/google";

import { SmoothScroll } from "@/components/ui/SmoothScroll";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  // WONK carries the character; opsz drives font-optical-sizing.
  // SOFT was requested and then always set to its default, so it was
  // only ever adding weight to the file.
  axes: ["WONK", "opsz"],
});

const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://meridian.example"),
  title: {
    default: "Meridian — one watch, taken apart",
    template: "%s — Meridian",
  },
  description:
    "Meridian makes one hand-wound mechanical watch. Scroll and it comes apart: crystal, dial, hands, movement, case-back, case and strap, each with what it is made of.",
  openGraph: {
    title: "Meridian — one watch, taken apart",
    description:
      "One hand-wound mechanical watch, shown the only honest way: in pieces.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0c0a09",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${archivo.variable}`}>
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
