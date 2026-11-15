import { requireAuth } from "@/lib/auth/guards";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";
import { RecentPurchases } from "@/components/dashboard/recent-purchases";
import { WishlistPreview } from "@/components/dashboard/wishlist-preview";
import { RecommendedProducts } from "@/components/dashboard/recommended-products";
import { BecomeSellerCTA } from "@/components/dashboard/become-seller-cta";
import { SellerOverview } from "@/components/dashboard/seller-overview";
import { SellerQuickActions } from "@/components/dashboard/seller-quick-actions";
import { getBuyerAnalytics } from "@/lib/analytics";
import { ShoppingBag, Download, Heart, MessageSquare, Wallet } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Devisima",
  description: "Manage your Devisima account.",
  robots: "noindex",
};

export default async function DashboardPage() {
  const user = await requireAuth("/dashboard");

  // Redirect suspended users to forbidden page
  if (user.status === "SUSPENDED") {
    redirect("/forbidden");
  }

  // Redirect admins to the admin panel immediately
  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  const buyerAnalytics = user.role === "USER" ? await getBuyerAnalytics(user.id) : null;

  return (
    <DashboardShell user={user}>
      <DashboardGreeting userName={user.name} />

      {user.role === "USER" && (
        <>
          <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Your account</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">At a glance</h2></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <DashboardStatCard
              title="Purchases"
              value={buyerAnalytics?.purchases ?? 0}
              icon={ShoppingBag}
              href="/purchases"
              description="Products purchased"
            />
            <DashboardStatCard
              title="Downloads"
              value={buyerAnalytics?.downloads ?? 0}
              icon={Download}
              href="/downloads"
              description="Available downloads"
            />
            <DashboardStatCard
              title="Wishlist"
              value={buyerAnalytics?.wishlist ?? 0}
              icon={Heart}
              href="/wishlist"
              description="Saved products"
            />
            <DashboardStatCard
              title="Reviews"
              value={buyerAnalytics?.reviews ?? 0}
              icon={MessageSquare}
              href="/reviews"
              description="Submitted reviews"
            />
            <DashboardStatCard
              title="Total spending"
              value={new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(buyerAnalytics?.spending ?? 0)}
              icon={Wallet}
              href="/purchases"
              description="Verified paid purchases"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2 mb-8">
            <RecentPurchases />
            <WishlistPreview userId={user.id} />
          </div>

          <RecommendedProducts />

          <div className="mt-8">
            <BecomeSellerCTA />
          </div>
        </>
      )}

      {user.role === "SELLER" && (
        <>
          <SellerOverview />

          <div className="mt-8">
            <SellerQuickActions />
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mt-8">
            <RecentPurchases />
            <WishlistPreview userId={user.id} />
          </div>

          <div className="mt-8">
            <RecommendedProducts />
          </div>
        </>
      )}

    </DashboardShell>
  );
}
