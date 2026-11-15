import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { requireAdmin } from "@/lib/auth/guards";
import { getAdminAnalytics } from "@/lib/analytics";
import { getAnalyticsDateRange } from "@/lib/analytics/date-range";

export const metadata: Metadata = { title: "Marketplace analytics | Devisima", description: "Real marketplace performance and financial reporting.", robots: "noindex" };

export default async function AdminAnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const period = single(params.period);
  const start = single(params.start);
  const end = single(params.end);
  const range = getAnalyticsDateRange(period, start, end);
  const data = await getAdminAnalytics(range);
  const exportHref = `/api/admin/analytics/export?${new URLSearchParams({
    period: range.period,
    start: range.start.toISOString().slice(0, 10),
    end: new Date(range.end.getTime() - 1).toISOString().slice(0, 10),
  })}`;
  return <AdminShell user={admin}><div className="mx-auto max-w-7xl py-2"><header className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Marketplace reporting</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Analytics &amp; insights</h1><p className="mt-2 text-sm text-muted-foreground">Financial totals use completed orders with successful payments and the seller earnings ledger.</p></header><AnalyticsDashboard kind="admin" data={data} exportHref={exportHref} /></div></AdminShell>;
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
