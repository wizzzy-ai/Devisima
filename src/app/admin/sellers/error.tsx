"use client";

export default function AdminSellersError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-2xl rounded-2xl border border-destructive/20 bg-card p-8 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-destructive">Seller management unavailable</p>
      <h1 className="mt-2 text-xl font-semibold text-foreground">We couldn&apos;t load seller data</h1>
      <p className="mt-2 text-sm text-muted-foreground">Try again to reload seller data. If you were completing an action, check the seller history before repeating it.</p>
      <button type="button" onClick={reset} className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Try again</button>
    </main>
  );
}
