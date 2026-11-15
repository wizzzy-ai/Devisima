import { ShoppingBag, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function RecentPurchases() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Your library</p><h2 className="mt-1 text-lg font-semibold text-foreground">Recent purchases</h2></div>
        <Link href="/purchases" className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary">
          View all <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="rounded-2xl bg-background px-5 py-9 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20"><ShoppingBag className="h-6 w-6 text-foreground" /></span>
        <h3 className="mb-2 text-base font-semibold text-foreground">Your library starts here</h3>
        <p className="mx-auto mb-5 max-w-sm text-sm leading-6 text-muted-foreground">
          Your purchased products will appear here once you make your first purchase.
        </p>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Explore Marketplace
        </Link>
      </div>
    </div>
  );
}
