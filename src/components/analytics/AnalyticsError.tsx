"use client";

import { useEffect } from "react";

export default function AnalyticsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error("Analytics page failed to load:", error);
  }, [error]);

  return (
    <main className="grid min-h-[60vh] place-items-center bg-background px-4 py-12">
      <section className="max-w-md rounded-2xl border border-border bg-card p-7 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">Analytics couldn’t load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your analytics are temporarily unavailable. Please try again.</p>
        <button type="button" onClick={retry} className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">Retry</button>
      </section>
    </main>
  );
}
