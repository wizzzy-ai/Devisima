"use client";

export default function ProductDetailsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-[60vh] place-items-center bg-[#F7F5EF] px-5 py-16">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#0F4C5C]">Product unavailable</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#101820]">We couldn’t load this product.</h1>
        <p className="mt-2 text-sm leading-6 text-[#68756d]">Please try again. If the problem continues, come back later.</p>
        <button type="button" onClick={reset} className="mt-6 rounded-xl bg-[#0F4C5C] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0a3b48]">Try again</button>
      </div>
    </main>
  );
}
