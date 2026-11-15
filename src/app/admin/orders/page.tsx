import { requireAdmin } from "@/lib/auth/guards";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminShell } from "@/components/admin/admin-shell";
import { ShoppingCart, Package } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orders | Admin",
  description: "Manage marketplace orders",
  robots: "noindex",
};

export default async function AdminOrdersPage() {
  const admin = await requireAdmin();

  return (
    <AdminShell user={admin}>
      <div className="mx-auto max-w-7xl py-2">
        <header className="mt-6 flex flex-col gap-5 rounded-3xl bg-primary px-6 py-7 text-primary-foreground shadow-sm sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Marketplace operations</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Orders</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/75 sm:text-base">
              View and manage all marketplace orders. Track payment status, refunds, and order details.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 px-4 py-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent"><ShoppingCart className="h-5 w-5" /></span>
            <span>
              <span className="block text-2xl font-semibold tabular-nums">All Orders</span>
              <span className="block text-xs text-primary-foreground/70">Marketplace</span>
            </span>
          </div>
        </header>

        <AdminOrders />
      </div>
    </AdminShell>
  );
}
