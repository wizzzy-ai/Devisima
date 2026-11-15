"use client";

import Link from "next/link";
import type { getAdminAnalytics, getSellerAnalytics } from "@/lib/analytics";
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, Download, Eye, MessageSquare, Package, ShoppingBag, Star, Users, Wallet } from "lucide-react";

type AdminData = Awaited<ReturnType<typeof getAdminAnalytics>>;
type SellerData = Awaited<ReturnType<typeof getSellerAnalytics>>;
type Data = AdminData | SellerData;

const periods = [
  ["today", "Today"], ["yesterday", "Yesterday"], ["7d", "Last 7 days"],
  ["30d", "Last 30 days"], ["3m", "Last 3 months"], ["12m", "Last 12 months"],
  ["custom", "Custom range"],
];

export function AnalyticsDashboard({ kind, data, exportHref }: { kind: "admin" | "seller"; data: Data; exportHref: string }) {
  const isAdmin = kind === "admin";
  const summary = data.summary;
  const cards = isAdmin
    ? [
      { label: "Gross revenue", value: money((summary as AdminData["summary"]).revenue), change: data.comparison.revenue, icon: Wallet },
      { label: "Paid orders", value: number((summary as AdminData["summary"]).orders), change: data.comparison.orders, icon: ShoppingBag },
      { label: "Units sold", value: number((summary as AdminData["summary"]).unitsSold), change: (data as AdminData).comparison.unitsSold, icon: Package },
      { label: "Platform commission", value: money((summary as AdminData["summary"]).commission), change: (data as AdminData).comparison.commission, icon: Activity },
      { label: "Seller earnings", value: money((summary as AdminData["summary"]).sellerEarnings), change: data.comparison.sellerEarnings, icon: Wallet },
      { label: "Average order value", value: money((summary as AdminData["summary"]).averageOrderValue), icon: BarChart3 },
      { label: "Refunds", value: money((summary as AdminData["summary"]).refunds), icon: ArrowDownRight },
      { label: "Coupon discounts", value: money((summary as AdminData["summary"]).couponDiscounts), icon: ShoppingBag },
      { label: "Net platform revenue", value: money((summary as AdminData["summary"]).netPlatformRevenue), icon: Wallet },
      { label: "Users", value: number((summary as AdminData["summary"]).users), icon: Users },
      { label: "Sellers", value: number((summary as AdminData["summary"]).sellers), icon: Users },
      { label: "Products", value: number((summary as AdminData["summary"]).products), icon: Package },
    ]
    : [
      { label: "Gross sales revenue", value: money((summary as SellerData["summary"]).grossRevenue), change: data.comparison.revenue, icon: Wallet },
      { label: "Seller earnings", value: money((summary as SellerData["summary"]).sellerEarnings), change: data.comparison.sellerEarnings, icon: Wallet },
      { label: "Orders", value: number((summary as SellerData["summary"]).orders), change: data.comparison.orders, icon: ShoppingBag },
      { label: "Sales", value: number((summary as SellerData["summary"]).sales), change: (data as SellerData).comparison.sales, icon: BarChart3 },
      { label: "Products", value: number((summary as SellerData["summary"]).products), icon: Package },
      { label: "Average order value", value: optionalMoney((summary as SellerData["summary"]).averageOrderValue), icon: Wallet },
      { label: "Reviews", value: number((summary as SellerData["summary"]).reviews), icon: MessageSquare },
      { label: "Average rating", value: optionalRating((summary as SellerData["summary"]).averageRating), icon: Star },
      { label: "Product views", value: number((summary as SellerData["summary"]).views), icon: Eye },
      { label: "Downloads", value: number((summary as SellerData["summary"]).downloads), icon: Download },
      { label: "Wishlist additions", value: number((summary as SellerData["summary"]).wishlistAdds), icon: Activity },
      { label: "Conversion rate", value: optionalPercent((summary as SellerData["summary"]).conversionRate), icon: BarChart3 },
    ];
  const series = data.revenueSeries;
  const rangeStart = data.range.start.slice(0, 10);
  const rangeEnd = data.range.end.slice(0, 10);

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-end md:justify-between">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Period
            <select name="period" defaultValue={data.range.period} className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground">
              {periods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">From (UTC)
            <input name="start" type="date" defaultValue={rangeStart} className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground" />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Through (UTC)
            <input name="end" type="date" defaultValue={rangeEnd} className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground" />
          </label>
          <button className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90">Apply</button>
        </form>
        <Link href={exportHref} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted"><Download className="h-4 w-4" />Export sales CSV</Link>
      </div>

      <section aria-label="Analytics summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, change, icon: Icon }) => <article key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">{value}</p></div><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span></div>{change !== undefined && <Comparison value={change} />}</article>)}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-foreground">Revenue performance</h2><p className="mt-1 text-xs text-muted-foreground">Paid sales, financial ledger values, and successful refunds. Dates use UTC.</p></div><div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"><Legend color="#0F4C5C" label="Gross revenue" /><Legend color="#35D0BA" label={isAdmin ? "Platform commission" : "Seller earnings"} />{isAdmin && <Legend color="#d99b3d" label="Seller earnings" />}</div></div>
        {series.some((item) => item.gross > 0) ? <RevenueChart data={series} showSellerEarnings={isAdmin} /> : <EmptyMetric message="Not enough data yet" detail="A verified successful order is needed before revenue trends can be displayed." />}
        <div className="mt-4 flex justify-between text-xs text-muted-foreground"><span>{new Date(data.range.start).toLocaleDateString()}</span><span>{new Date(data.range.end).toLocaleDateString()}</span></div>
      </section>

      {isAdmin ? <AdminBreakdowns data={data as AdminData} /> : <SellerBreakdowns data={data as SellerData} />}
    </div>
  );
}

function AdminBreakdowns({ data }: { data: AdminData }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Best-selling products</h2>
        {data.topProducts.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[34rem] text-left text-sm"><thead className="text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="pb-3">Product</th><th className="pb-3">Units</th><th className="pb-3">Gross</th><th className="pb-3">Commission</th></tr></thead><tbody className="divide-y divide-border">{data.topProducts.map((product) => <tr key={product.id}><td className="py-3 pr-4"><span className="block font-semibold text-foreground">{product.title}</span><span className="text-xs text-muted-foreground">{product.category}</span></td><td className="py-3">{number(product.sales)}</td><td className="py-3">{money(product.grossRevenue)}</td><td className="py-3">{money(product.grossRevenue - product.sellerEarnings)}</td></tr>)}</tbody></table></div> : <EmptyMetric message="Not enough data yet" detail="Verified product sales will appear here." />}
      </section>
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Category performance</h2>
        {data.categories.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[30rem] text-left text-sm"><thead className="text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="pb-3">Category</th><th className="pb-3">Products</th><th className="pb-3">Units</th><th className="pb-3">Gross revenue</th></tr></thead><tbody className="divide-y divide-border">{data.categories.map((category) => <tr key={category.id}><td className="py-3 font-semibold text-foreground">{category.name}</td><td className="py-3">{number(category.products)}</td><td className="py-3">{number(category.unitsSold)}</td><td className="py-3">{money(category.grossRevenue)}</td></tr>)}</tbody></table></div> : <EmptyMetric message="Not enough data yet" detail="Paid orders linked to products in a category will appear here." />}
      </section>
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Coupon performance</h2>
        {data.coupons.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[28rem] text-left text-sm"><thead className="text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="pb-3">Code</th><th className="pb-3">Paid orders</th><th className="pb-3">Discount</th><th className="pb-3">Net sales</th></tr></thead><tbody className="divide-y divide-border">{data.coupons.map((coupon) => <tr key={coupon.code}><td className="py-3 font-semibold text-foreground">{coupon.code}</td><td className="py-3">{number(coupon.orders)}</td><td className="py-3">{money(coupon.discounts)}</td><td className="py-3">{money(coupon.revenue)}</td></tr>)}</tbody></table></div> : <EmptyMetric message="No coupon sales in this period" detail="Only paid coupon orders are included." />}
      </section>
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Reviews</h2>
        <p className="mt-1 text-sm text-muted-foreground">{number(data.summary.reviews)} non-deleted reviews · {optionalRating(data.summary.averageRating)} average rating (all reviews)</p>
        <RatingDistribution rows={data.ratingDistribution} />
        <p className="mt-3 text-xs text-muted-foreground">The current review model has no approval status; statistics follow the existing public rule and exclude deleted reviews.</p>
      </section>
    </div>
  );
}

function SellerBreakdowns({ data }: { data: SellerData }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Product performance</h2>
        <p className="mt-1 text-sm text-muted-foreground">Metrics are limited to your products and the selected UTC period.</p>
        {data.products.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[52rem] text-left text-sm"><thead className="text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="pb-3">Product</th><th className="pb-3">Sales</th><th className="pb-3">Gross revenue</th><th className="pb-3">Downloads</th><th className="pb-3">Wishlist adds</th><th className="pb-3">Reviews</th><th className="pb-3">Rating</th><th className="pb-3">Conversion</th></tr></thead><tbody className="divide-y divide-border">{data.products.map((product) => <tr key={product.id}><td className="py-3 pr-3"><Link href={`/seller/products/${product.id}`} className="font-semibold text-primary hover:underline">{product.title}</Link><span className="block text-xs text-muted-foreground">{product.status.toLowerCase().replaceAll("_", " ")}</span></td><td className="py-3">{number(product.sales)}</td><td className="py-3">{money(product.revenue)}</td><td className="py-3">{number(product.downloads)}</td><td className="py-3">{number(product.wishlistAdds)}</td><td className="py-3">{number(product.reviewCount)}</td><td className="py-3">{optionalRating(product.averageRating)}</td><td className="py-3">{optionalPercent(product.conversionRate)}</td></tr>)}</tbody></table></div> : <EmptyMetric message="No products to report yet" detail="Your products will appear here as you create them." />}
      </section>
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">Review distribution</h2>
        <p className="mt-1 text-sm text-muted-foreground">{number(data.summary.periodReviews)} non-deleted reviews in this period · {number(data.summary.reviews)} total</p>
        <RatingDistribution rows={data.ratingDistribution} />
      </section>
    </div>
  );
}

function RevenueChart({ data, showSellerEarnings }: { data: Data["revenueSeries"]; showSellerEarnings: boolean }) {
  const width = 840;
  const height = 250;
  const max = Math.max(1, ...data.flatMap((point) => [point.gross, point.commission, ...(showSellerEarnings ? [point.earnings] : [])]));
  const line = (key: "gross" | "commission" | "earnings") => data.map((point, index) => {
    const x = data.length > 1 ? (index / (data.length - 1)) * width : width / 2;
    const y = height - (point[key] / max) * (height - 16) - 8;
    return `${index === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");
  return <div className="w-full overflow-hidden"><svg role="img" aria-label="Revenue line chart" viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" preserveAspectRatio="none"><line x1="0" y1={height - 1} x2={width} y2={height - 1} stroke="#dce3dd" strokeWidth="1" /><path d={line("gross")} fill="none" stroke="#0F4C5C" strokeWidth="3" vectorEffect="non-scaling-stroke" />{showSellerEarnings && <path d={line("earnings")} fill="none" stroke="#d99b3d" strokeWidth="2" vectorEffect="non-scaling-stroke" />}<path d={line("commission")} fill="none" stroke="#35D0BA" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />{data.map((point, index) => <circle key={point.date} cx={data.length > 1 ? (index / (data.length - 1)) * width : width / 2} cy={height - (point.gross / max) * (height - 16) - 8} r="3" fill="#0F4C5C"><title>{new Date(point.date).toLocaleDateString()}: {money(point.gross)}</title></circle>)}</svg></div>;
}

function RatingDistribution({ rows }: { rows: { rating: number; count: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return <div className="mt-4 space-y-2">{rows.toReversed().map((row) => <div key={row.rating} className="flex items-center gap-3 text-xs"><span className="w-12 text-muted-foreground">{row.rating} star</span><span className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-accent" style={{ width: `${(row.count / max) * 100}%` }} /></span><span className="w-8 text-right font-semibold text-foreground">{number(row.count)}</span></div>)}</div>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />{label}</span>;
}

function Comparison({ value }: { value: number | null }) {
  if (value === null) return <p className="mt-2 text-xs text-muted-foreground">No previous-period data for comparison</p>;
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return <p className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${positive ? "text-emerald-700" : "text-rose-700"}`}><Icon className="h-3.5 w-3.5" />{Math.abs(value).toFixed(1)}% vs previous equivalent period</p>;
}

function EmptyMetric({ message, detail }: { message: string; detail: string }) {
  return <div className="rounded-xl bg-muted/50 px-4 py-8 text-center"><p className="font-semibold text-foreground">{message}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div>;
}

function money(value: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
}

function optionalMoney(value: number | null) {
  return value === null ? "N/A" : money(value);
}

function number(value: number) {
  return new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(value);
}

function optionalRating(value: number | null) {
  return value === null ? "N/A" : `${value.toFixed(1)} / 5`;
}

function optionalPercent(value: number | null) {
  return value === null ? "N/A" : `${value.toFixed(2)}%`;
}
