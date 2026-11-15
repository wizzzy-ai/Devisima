"use client";

export default function HomeError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F7F5EF] px-5 py-16">
      <section className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#0F4C5C]">Temporarily unavailable</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#101820]">We couldn&apos;t load the homepage.</h1>
        <p className="mt-2 text-sm leading-6 text-[#68756d]">
          Some Devisima content isn&apos;t responding right now. Please try again in a moment.
        </p>
        <button
          type="button"
          onClick={retry}
          className="mt-6 rounded-xl bg-[#0F4C5C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0a3b48] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35D0BA] focus-visible:ring-offset-2"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
