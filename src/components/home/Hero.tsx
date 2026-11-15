import Link from "next/link";
import { ArrowRight, Search, Sparkles, Star } from "lucide-react";
import Ferrofluid from "./Ferrofluid";
import Lanyard from "@/components/Lanyard";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#f7f8ee] text-[#122f2b]">
      <div className="absolute inset-y-0 right-0 w-full opacity-35 md:left-[38%] md:w-[62%] md:opacity-90">
        <Ferrofluid
          colors={["#0F4C5C", "#35D0BA", "#B9E84A"]}
          speed={0.3}
          scale={1.2}
          turbulence={0.8}
          fluidity={0.15}
          rimWidth={0.25}
          sharpness={3}
          shimmer={1.2}
          glow={2.5}
          flowDirection="down"
          opacity={0.92}
          mouseInteraction={true}
          mouseStrength={1.2}
          mouseRadius={0.4}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#f7f8ee] via-[#f7f8ee]/95 to-transparent md:w-[72%]" />
      <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-[#d6ec83]/30 blur-3xl" />

      <div className="relative z-10 mx-auto grid min-h-[690px] max-w-7xl items-center gap-12 px-5 pb-16 pt-28 sm:px-8 md:grid-cols-[1.05fr_.95fr] md:pb-24 md:pt-32">
        <div className="max-w-[640px]">
          <div className="hero-intro hero-intro-1 mb-7 inline-flex items-center gap-2 rounded-full border border-[#d7dfc0] bg-white/75 px-4 py-2 text-sm font-semibold text-[#3c5c42] shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4 text-[#8aa82b]" />
            A better place to find your next tool
          </div>
          <h1 className="hero-intro hero-intro-2 text-[3.2rem] font-semibold leading-[.98] tracking-[-.065em] sm:text-6xl lg:text-[4.65rem]">
            Good ideas deserve <span className="text-[#277f70]">great software.</span>
          </h1>
          <p className="hero-intro hero-intro-3 mt-7 max-w-[540px] text-lg leading-8 text-[#52645b] sm:text-xl">
            Find ready-made software, thoughtful templates, and digital tools that help you get from idea to done.
          </p>

          <form action="/marketplace" className="hero-intro hero-intro-4 mt-9 flex max-w-[560px] items-center gap-2 rounded-2xl border border-[#e2e6d5] bg-white p-2 shadow-[0_14px_40px_rgba(25,55,42,.10)] focus-within:border-[#74b4a4]">
            <Search className="ml-3 h-5 w-5 shrink-0 text-[#829087]" />
            <input
              type="search"
              name="q"
              placeholder="What are you looking for?"
              aria-label="Search the marketplace"
              className="h-12 min-w-0 flex-1 bg-transparent text-sm text-[#173d36] outline-none placeholder:text-[#929c92] sm:text-base"
            />
            <button type="submit" className="inline-flex h-12 items-center gap-3 rounded-[4px] border-2 border-[#0F4C5C] bg-white px-4 text-base font-bold text-[#0F4C5C] shadow-[4px_4px_0_#0F4C5C] transition-all hover:-translate-y-0.5 hover:bg-[#f7f8f6] sm:px-5">
              Search <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="hero-intro hero-intro-5 mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[#617168]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#344f42]"><Star className="h-4 w-4 fill-[#d9a92e] text-[#d9a92e]" /> Built for makers</span>
            <span className="hidden h-4 w-px bg-[#cfd7c8] sm:block" />
            <span>Software, templates &amp; tools</span>
            <span className="hidden h-4 w-px bg-[#cfd7c8] sm:block" />
            <span>Made by independent creators</span>
          </div>
          <div className="hero-intro hero-intro-6 mt-9 flex flex-wrap items-center gap-4">
            <Link href="/marketplace" className="inline-flex h-12 items-center gap-3 rounded-[4px] border-2 border-[#0F4C5C] bg-white px-5 text-base font-bold text-[#0F4C5C] shadow-[4px_4px_0_#0F4C5C] transition-all hover:-translate-y-0.5 hover:bg-[#f7f8f6]">
              Explore the marketplace <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="hero-art-enter relative hidden min-h-[420px] md:block" aria-hidden="true">
          <div style={{ width: '100%', height: '600px' }}>
            <Lanyard
              frontImage="/logo.png"
              backImage="/icon.png"
              strapImage="/lanyard-strap.svg"
              imageFit="contain"
              cardColor="#ffffff"
              orientation="portrait"
              finish="glossy"
              cornerRadius={0.3}
              size={0.7}
              anchor="center"
              strapLength={0.5}
              strapColor="#111111"
              strapWidth={0.65}
              metal="silver"
              gravity={1}
              damping={0.5}
              elasticity={0.5}
              breeze={0.5}
              interactive
              intro
            />
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-background/70 to-transparent" />
    </section>
  );
}
