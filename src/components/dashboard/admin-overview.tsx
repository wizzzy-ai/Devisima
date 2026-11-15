import { Users, Store, Package, ShoppingCart, DollarSign, AlertCircle } from "lucide-react";
import { DashboardStatCard } from "./dashboard-stat-card";

export function AdminOverview() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <DashboardStatCard
        title="Total Users"
        value={0}
        icon={Users}
        href="/admin/users"
        description="Registered users"
      />
      <DashboardStatCard
        title="Total Sellers"
        value={0}
        icon={Store}
        href="/admin/seller-applications"
        description="Active sellers"
      />
      <DashboardStatCard
        title="Total Products"
        value={0}
        icon={Package}
        href="/admin/products"
        description="Published products"
      />
      <DashboardStatCard
        title="Total Orders"
        value={0}
        icon={ShoppingCart}
        href="/admin/orders"
        description="Completed orders"
      />
      <DashboardStatCard
        title="Revenue"
        value={0}
        icon={DollarSign}
        href="/admin/reports"
        description="Platform revenue"
      />
      <DashboardStatCard
        title="Pending Applications"
        value={0}
        icon={AlertCircle}
        href="/admin/seller-applications"
        description="Awaiting review"
      />
    </div>
  );
}
