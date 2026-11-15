import { DollarSign, Package, ShoppingCart, Star } from "lucide-react";
import { DashboardStatCard } from "./dashboard-stat-card";

export function SellerOverview() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <DashboardStatCard
        title="Total Sales"
        value={0}
        icon={DollarSign}
        href="/seller/earnings"
        description="Lifetime revenue"
      />
      <DashboardStatCard
        title="Products"
        value={0}
        icon={Package}
        href="/seller/products"
        description="Published products"
      />
      <DashboardStatCard
        title="Orders"
        value={0}
        icon={ShoppingCart}
        href="/seller/orders"
        description="Total orders"
      />
      <DashboardStatCard
        title="Reviews"
        value={0}
        icon={Star}
        href="/seller/products"
        description="Product reviews"
      />
    </div>
  );
}
