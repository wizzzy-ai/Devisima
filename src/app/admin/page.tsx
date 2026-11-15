import { requireAdmin } from "@/lib/auth/guards";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { PendingActions } from "@/components/admin/pending-actions";
import { RecentOrders } from "@/components/admin/recent-orders";
import { RecentUsers } from "@/components/admin/recent-users";
import { Users, Store, Package, ShoppingCart, DollarSign, AlertTriangle } from "lucide-react";
import { getDashboardStats } from "@/lib/admin/operations";
import { getRevenueSeries } from "@/lib/analytics";
import { getAnalyticsDateRange } from "@/lib/analytics/date-range";
import { AdminRevenuePreview } from "@/components/admin/admin-revenue-preview";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - Devisima",
  description: "Monitor and manage the Devisima marketplace.",
  robots: "noindex",
};

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const [stats, revenueSeries] = await Promise.all([
    getDashboardStats(),
    getRevenueSeries(getAnalyticsDateRange("30d")),
  ]);

  return (
    <AdminShell user={user}>
      <section className="relative isolate mb-8 overflow-hidden rounded-[2rem] bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-20 -top-36 -z-10 h-80 w-80 rounded-full border-[40px] border-border/20" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Devisima <span className="mx-2 text-primary-foreground/30">/</span> Control room</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Marketplace overview</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/70 sm:text-base">A clear view of what’s happening across your marketplace, from new members to work that needs a review.</p>
      </section>

      <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">The big picture</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Marketplace health</h2></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <AdminStatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          description="Registered users"
        />
        <AdminStatCard
          title="Sellers"
          value={stats.totalSellers}
          icon={Store}
          description="Approved sellers"
        />
        <AdminStatCard
          title="Products"
          value={stats.totalProducts}
          icon={Package}
          description="Marketplace products"
        />
        <AdminStatCard
          title="Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
          description="Total orders"
        />
        <AdminStatCard
          title="Revenue"
          value={stats.revenue > 0 ? `₦${stats.revenue.toLocaleString()}` : "—"}
          icon={DollarSign}
          description="Platform revenue"
        />
        <AdminStatCard
          title="Pending Actions"
          value={stats.pendingApplications + stats.pendingProducts + stats.pendingRefunds + stats.pendingPayouts}
          icon={AlertTriangle}
          description="Requires attention"
        />
      </div>

      <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Keep things moving</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Work & performance</h2></div>
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <PendingActions />
        <AdminRevenuePreview data={revenueSeries} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentOrders />
        <RecentUsers />
      </div>
    </AdminShell>
  );
}
