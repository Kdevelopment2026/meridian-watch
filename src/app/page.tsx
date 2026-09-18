import { Hero } from "@/components/hero/Hero";
import { Assurances } from "@/components/sections/Assurances";
import { Collection } from "@/components/sections/Collection";
import { Craftsmanship } from "@/components/sections/Craftsmanship";
import { Footer } from "@/components/sections/Footer";
import { LimitedSeries } from "@/components/sections/LimitedSeries";
import { SpecBreakdown } from "@/components/sections/SpecBreakdown";
import { Nav } from "@/components/ui/Nav";

export default function Page() {
  return (
    <>
      <Nav />
      <main id="top">
        <Hero />
        <SpecBreakdown />
        <Craftsmanship />
        <LimitedSeries />
        <Collection />
        <Assurances />
      </main>
      <Footer />
    </>
  );
}
