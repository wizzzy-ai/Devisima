import { ArrowUpRight, Store, TrendingUp, DollarSign } from "lucide-react";
import Link from "next/link";

export function BecomeSellerCTA() {
  return (
    <div className="relative isolate overflow-hidden rounded-[1.75rem] border border-border bg-muted p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full border-[30px] border-primary-foreground/50" />
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">For the makers</p>
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground">Build it. Sell it. Earn from it.</h2>
          <p className="max-w-lg text-sm leading-6 text-muted-foreground">
            Have software you&apos;ve built? Turn your work into a product and sell it on Devisima.
          </p>
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-foreground" />
              <span className="text-sm text-muted-foreground">Global marketplace</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-foreground" />
              <span className="text-sm text-muted-foreground">Reach new customers</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-foreground" />
              <span className="text-sm text-muted-foreground">Earn from your work</span>
            </div>
          </div>
        </div>
        <Link
          href="/seller/apply"
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Become a seller <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
