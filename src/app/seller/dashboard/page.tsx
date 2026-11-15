import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, CheckCircle2, Clock3, Package, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SellerGreeting } from "@/components/seller/SellerGreeting";
import { SellerFollowers } from "@/components/dashboard/SellerFollowers";
import { requireSeller } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { getSellerAnalytics } from "@/lib/analytics";
import { getAnalyticsDateRange } from "@/lib/analytics/date-range";

export default async function SellerDashboardPage() {
  const user = await requireSeller();

  // Redirect suspended users to forbidden page
  if (user.status === "SUSPENDED") {
    redirect("/forbidden");
  }

  if (user.role !== "SELLER" || user.status !== "ACTIVE") redirect("/forbidden");

  const [total, published, review, drafts, sellerApplication] = await Promise.all([
    db.product.count({ where: { sellerId: user.id, status: { not: "ARCHIVED" } } }),
    db.product.count({ where: { sellerId: user.id, status: "PUBLISHED" } }),
    db.product.count({ where: { sellerId: user.id, status: "PENDING_REVIEW" } }),
    db.product.count({ where: { sellerId: user.id, status: "DRAFT" } }),
    db.sellerApplication.findFirst({
      where: { userId: user.id, status: "APPROVED" },
      select: { storeName: true },
    }),
  ]);
  const analytics = await getSellerAnalytics(user.id, getAnalyticsDateRange("30d"));
  const cards = [
    { name: "All listings", count: total, detail: "Your complete catalog", icon: Package, tint: "bg-accent" },
    { name: "Published", count: published, detail: "Live in the marketplace", icon: CheckCircle2, tint: "bg-accent/20" },
    { name: "In review", count: review, detail: "With our review team", icon: Clock3, tint: "bg-destructive/10" },
    { name: "Drafts", count: drafts, detail: "Ready when you are", icon: Sparkles, tint: "bg-muted" },
  ];
  return <DashboardShell user={user}><div className="mx-auto max-w-7xl py-2">
    <SellerGreeting userName={sellerApplication?.storeName || user.name} />
    <div className="mb-4 mt-9"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Your shop at a glance</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Listing overview</h2></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({name,count,detail,icon:Icon,tint})=><div key={name} className="rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-muted-foreground">{name}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{count}</p></div><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tint}`}><Icon className="h-5 w-5 text-foreground"/></span></div><p className="mt-3 text-xs text-muted-foreground">{detail}</p></div>)}</div>
    <section className="mt-9 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Last 30 days</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Shop performance</h2></div>
        <Link href="/seller/analytics" className="text-sm font-semibold text-primary hover:underline">View detailed analytics <ArrowUpRight className="ml-1 inline h-4 w-4"/></Link>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PerformanceMetric label="Gross sales" value={formatMoney(analytics.summary.grossRevenue)} />
        <PerformanceMetric label="Seller earnings" value={formatMoney(analytics.summary.sellerEarnings)} />
        <PerformanceMetric label="Orders" value={analytics.summary.orders.toLocaleString("en-NG")} />
        <PerformanceMetric label="Product views" value={analytics.summary.views.toLocaleString("en-NG")} />
      </div>
    </section>
  <div className="mt-9">
    <SellerFollowers sellerId={user.id} />
  </div>
  </div></DashboardShell>;
}

function PerformanceMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-muted/40 p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p></div>;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
}
