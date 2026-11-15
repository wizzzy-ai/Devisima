"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, Search, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const searchExamples = [
  "Try “brand kit”",
  "Try “invoice app”",
  "Try “website template”",
];

export function MarketplaceHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [searchFocused, setSearchFocused] = useState(false);
  const [placeholder, setPlaceholder] = useState(searchExamples[0]);

  useEffect(() => {
    if (searchQuery || searchFocused) return;

    let exampleIndex = 0;
    let characterCount = searchExamples[0].length;
    let deleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    const animatePlaceholder = () => {
      if (document.hidden) return;

      const example = searchExamples[exampleIndex];
      if (!deleting && characterCount === example.length) {
        deleting = true;
        timeout = setTimeout(animatePlaceholder, 1500);
        return;
      }
      if (deleting && characterCount === 0) {
        exampleIndex = (exampleIndex + 1) % searchExamples.length;
        deleting = false;
        timeout = setTimeout(animatePlaceholder, 250);
        return;
      }

      characterCount += deleting ? -1 : 1;
      setPlaceholder(example.slice(0, characterCount));
      timeout = setTimeout(animatePlaceholder, deleting ? 32 : 68);
    };

    const handleVisibilityChange = () => {
      clearTimeout(timeout);
      if (document.hidden) return;

      exampleIndex = 0;
      characterCount = 0;
      deleting = false;
      setPlaceholder("");
      timeout = setTimeout(animatePlaceholder, 250);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (!document.hidden) timeout = setTimeout(animatePlaceholder, 1800);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [searchFocused, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    else params.delete("q");
    params.delete("page");
    router.push(`/marketplace?${params.toString()}`);
  };

  return (
    <section className="relative isolate overflow-hidden bg-primary px-4 pb-12 pt-12 text-primary-foreground sm:pb-16 sm:pt-16">
      <div className="pointer-events-none absolute -right-24 -top-36 -z-10 h-[28rem] w-[28rem] rounded-full border-[1px] border-border/20 sm:right-8 sm:top-[-20rem] sm:h-[48rem] sm:w-[48rem]" />
      <div className="pointer-events-none absolute -right-6 top-12 -z-10 h-44 w-44 rounded-full bg-accent opacity-90 blur-[1px] sm:right-[15%] sm:top-16 sm:h-52 sm:w-52" />
      <div className="pointer-events-none absolute right-16 top-20 -z-10 h-44 w-44 rounded-full border border-border/30 sm:right-[20%] sm:top-24 sm:h-52 sm:w-52" />
      <div className="container mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            <Sparkles className="h-3.5 w-3.5" /> The independent digital goods market
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.04] tracking-[-0.045em] sm:text-6xl">
            Good ideas deserve <span className="text-accent">good tools.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-primary-foreground/70 sm:text-lg">
            Find software, templates, and clever little shortcuts made by people who know their craft.
          </p>
          <form onSubmit={handleSearch} className="mt-8 max-w-2xl">
            <label className="sr-only" htmlFor="marketplace-search">Search the marketplace</label>
            <div className="flex items-center gap-2 rounded-2xl border border-primary-foreground/15 bg-card p-2 shadow-lg focus-within:ring-4 focus-within:ring-primary/20">
              <Search className="ml-3 h-5 w-5 shrink-0 text-foreground" />
              <input
                id="marketplace-search"
                type="search"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  setPlaceholder(searchExamples[0]);
                  setSearchFocused(true);
                }}
                onBlur={() => setSearchFocused(false)}
                className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground sm:text-base"
              />
              <button type="submit" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-5">
                Search <ArrowDownRight className="hidden h-4 w-4 sm:block" />
              </button>
            </div>
          </form>
        </div>
        <div className="mt-10 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-primary-foreground/50">
          <span className="h-2 w-2 rounded-full bg-accent" /> Find your next unfair advantage
        </div>
      </div>
    </section>
  );
}
