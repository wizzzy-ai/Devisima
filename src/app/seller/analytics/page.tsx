import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { requireSeller } from "@/lib/auth/guards";
import { getSellerAnalytics } from "@/lib/analytics";
import { getAnalyticsDateRange } from "@/lib/analytics/date-range";

export const metadata: Metadata = { title: "Seller analytics | Devisima", description: "Sales and performance analytics for your Devisima store.", robots: "noindex" };

export default async function SellerAnalyticsPage({ searchParams }: PageProps<"/seller/analytics">) {
  const seller = await requireSeller();
  if (seller.role !== "SELLER" || seller.status !== "ACTIVE") redirect("/forbidden");
  const params = await searchParams;
  const range = getAnalyticsDateRange(single(params.period), single(params.start), single(params.end));
  const data = await getSellerAnalytics(seller.id, range);
  const exportHref = `/api/seller/analytics/export?${new URLSearchParams({
    period: range.period,
    start: range.start.toISOString().slice(0, 10),
    end: new Date(range.end.getTime() - 1).toISOString().slice(0, 10),
  })}`;
  return <DashboardShell user={seller}><div className="mx-auto max-w-7xl py-2"><header className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Seller studio</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Analytics &amp; insights</h1><p className="mt-2 text-sm text-muted-foreground">Only your products, sales, downloads, reviews and store earnings are included.</p></header><AnalyticsDashboard kind="seller" data={data} exportHref={exportHref} /></div></DashboardShell>;
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
