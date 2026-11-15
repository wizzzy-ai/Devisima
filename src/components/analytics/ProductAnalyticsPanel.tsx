"use client";

import { useState } from "react";
import type { getProductAnalytics } from "@/lib/analytics";
import { Activity, Download, Eye, Heart, MessageSquare, ShoppingBag, Star, Wallet } from "lucide-react";

type ProductAnalytics = NonNullable<Awaited<ReturnType<typeof getProductAnalytics>>>;

export function ProductAnalyticsPanel({ data }: { data: ProductAnalytics }) {
  const { metrics } = data;
  const items = [
    ["Views", metrics.views, Eye],
    ["Wishlist additions", metrics.wishlistAdds, Heart],
    ["Purchases", metrics.purchases, ShoppingBag],
    ["Downloads", metrics.downloads, Download],
    ["Gross revenue", money(metrics.grossRevenue), Wallet],
    ["Seller earnings", money(metrics.sellerEarnings), Wallet],
    ["Reviews", metrics.reviews, MessageSquare],
    ["Average rating", metrics.averageRating === null ? "N/A" : `${metrics.averageRating.toFixed(1)} / 5`, Star],
    ["Conversion rate", metrics.conversionRate === null ? "N/A" : `${metrics.conversionRate.toFixed(2)}%`, Activity],
  ] as const;
  const [error, setError] = useState("");
  return <section aria-label="Product analytics">
    {error && <p role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}<button type="button" onClick={() => setError("")} className="ml-3 underline">Dismiss</button></p>}
    <form method="get" className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
      <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Period<select name="period" defaultValue={data.range.period} className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground">{[["7d","Last 7 days"],["30d","Last 30 days"],["3m","Last 3 months"],["12m","Last 12 months"],["custom","Custom range"]].map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
      <label className="grid gap-1 text-xs font-semibold text-muted-foreground">From (UTC)<input name="start" type="date" defaultValue={data.range.start.slice(0,10)} className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"/></label>
      <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Through (UTC)<input name="end" type="date" defaultValue={data.range.end.slice(0,10)} className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"/></label>
      <button className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Apply</button>
    </form>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map(([label,value,Icon])=><article key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="mt-3 text-2xl font-semibold text-foreground">{typeof value === "number" ? new Intl.NumberFormat("en-NG").format(value) : value}</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5"/></span></div></article>)}</div>
    <p className="mt-5 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">{metrics.views ? "Conversion rate is purchases divided by unique deduplicated views in this selected period." : "No product views yet. Conversion rate will be available after a meaningful product view is recorded."}</p>
  </section>;
}

function money(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}
