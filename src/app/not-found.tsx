"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.assign("/");
  }

  return (
    <main className="not-found-sky relative isolate flex min-h-screen items-center justify-center overflow-hidden px-6 text-foreground">
      <div className="not-found-stars" aria-hidden="true" />
      <div className="not-found-sun" aria-hidden="true" />
      <svg
        className="not-found-clouds"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <filter id="not-found-puff" x="-30%" y="-60%" width="160%" height="220%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.011"
              numOctaves="4"
              seed="7"
              result="noise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="110" result="cloud" />
            <feGaussianBlur in="cloud" stdDeviation="10" />
          </filter>
          <filter id="not-found-puff-soft" x="-30%" y="-60%" width="160%" height="220%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.016"
              numOctaves="4"
              seed="21"
              result="noise"
            />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="80" result="cloud" />
            <feGaussianBlur in="cloud" stdDeviation="7" />
          </filter>
        </defs>
        <g className="not-found-drift not-found-drift-slow" filter="url(#not-found-puff-soft)" opacity=".5">
          <g className="not-found-cloud-fill">
            <ellipse cx="240" cy="190" rx="150" ry="34" />
            <ellipse cx="330" cy="172" rx="100" ry="30" />
            <ellipse cx="1120" cy="260" rx="170" ry="36" />
            <ellipse cx="1210" cy="240" rx="110" ry="30" />
          </g>
        </g>
        <g className="not-found-drift not-found-drift-medium" filter="url(#not-found-puff)">
          <g className="not-found-cloud-shade" transform="translate(0 14)" opacity=".7">
            <ellipse cx="170" cy="470" rx="210" ry="48" />
            <ellipse cx="1290" cy="420" rx="230" ry="52" />
          </g>
          <g className="not-found-cloud-fill" opacity=".9">
            <ellipse cx="150" cy="450" rx="190" ry="46" />
            <ellipse cx="240" cy="418" rx="120" ry="48" />
            <ellipse cx="1300" cy="400" rx="210" ry="50" />
            <ellipse cx="1210" cy="368" rx="130" ry="46" />
          </g>
        </g>
        <g className="not-found-drift not-found-drift-fast" filter="url(#not-found-puff)">
          <g className="not-found-cloud-shade" transform="translate(0 22)" opacity=".7">
            <ellipse cx="200" cy="860" rx="330" ry="90" />
            <ellipse cx="720" cy="900" rx="420" ry="80" />
            <ellipse cx="1250" cy="850" rx="340" ry="95" />
          </g>
          <g className="not-found-cloud-fill">
            <ellipse cx="180" cy="830" rx="300" ry="86" />
            <ellipse cx="330" cy="790" rx="190" ry="78" />
            <ellipse cx="720" cy="880" rx="400" ry="74" />
            <ellipse cx="620" cy="850" rx="210" ry="66" />
            <ellipse cx="1260" cy="820" rx="320" ry="90" />
            <ellipse cx="1130" cy="785" rx="190" ry="76" />
          </g>
        </g>
      </svg>

      <section className="relative z-10 w-full max-w-xl py-12 text-center sm:py-20">
        <div className="not-found-rise flex items-end justify-center gap-1 sm:gap-2" role="img" aria-label="404">
          <span className="not-found-digit" aria-hidden="true">4</span>
          <svg className="not-found-balloon" viewBox="0 0 100 150" aria-hidden="true">
            <defs>
              <clipPath id="not-found-envelope">
                <path d="M50 4C22 4 4 24 4 48c0 20 12 36 26 50l6 8h28l6-8c14-14 26-30 26-50C96 24 78 4 50 4z" />
              </clipPath>
              <radialGradient id="not-found-balloon-shine" cx="34%" cy="28%" r="70%">
                <stop offset="0" stopColor="#fff" stopOpacity=".5" />
                <stop offset=".5" stopColor="#fff" stopOpacity="0" />
                <stop offset="1" stopColor="#000" stopOpacity=".2" />
              </radialGradient>
            </defs>
            <g clipPath="url(#not-found-envelope)">
              <rect width="100" height="110" className="not-found-balloon-light" />
              <path d="M50 4C34 20 30 50 36 106H64C70 50 66 20 50 4z" className="not-found-balloon-primary" />
              <path d="M4 48C10 20 30 6 50 4C28 26 26 70 36 106H30C14 90 4 70 4 48z" className="not-found-balloon-secondary" />
              <path d="M96 48C90 20 70 6 50 4C72 26 74 70 64 106H70C86 90 96 70 96 48z" className="not-found-balloon-secondary" />
              <rect y="66" width="100" height="9" className="not-found-balloon-accent" opacity=".9" />
              <rect width="100" height="110" fill="url(#not-found-balloon-shine)" />
            </g>
            <path d="M36 106L44 126M64 106L56 126M50 106V126" className="not-found-balloon-string" />
            <rect x="41" y="126" width="18" height="13" rx="2" className="not-found-balloon-basket" />
            <path d="M45 126v13M50 126v13M55 126v13" className="not-found-balloon-basket-lines" />
          </svg>
          <span className="not-found-digit" aria-hidden="true">4</span>
        </div>

        <h1 className="not-found-rise mt-8 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ animationDelay: ".12s" }}>
          We can’t find that page
        </h1>
        <p className="not-found-rise mx-auto mt-4 max-w-md text-base leading-7 text-muted-foreground" style={{ animationDelay: ".2s" }}>
          The link may be broken, or the page may have moved. Head back home or return to where you were.
        </p>
        <div className="not-found-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: ".28s" }}>
          <Link
            href="/"
            className={buttonVariants({ variant: "brand", size: "lg", className: "h-auto w-full px-5 py-3 font-bold sm:w-auto" })}
          >
            Back to home
          </Link>
          <Button
            type="button"
            variant="brand"
            size="lg"
            className="h-auto w-full px-5 py-3 font-bold sm:w-auto"
            onClick={goBack}
          >
            Go back
          </Button>
          <Link
            href="/contact"
            className={buttonVariants({ variant: "brand", size: "lg", className: "h-auto w-full px-5 py-3 font-bold sm:w-auto" })}
          >
            Contact support
          </Link>
        </div>
      </section>
    </main>
  );
}
