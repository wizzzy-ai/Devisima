import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { EarningsReconciliation } from "@/components/admin/earnings-reconciliation";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Seller earnings reconciliation | Devisima",
  description: "Review and safely reconcile missing seller earnings from verified paid orders.",
  robots: "noindex",
};

export default async function SellerEarningsReconciliationPage() {
  const admin = await requireAdmin();
  return (
    <AdminShell user={admin}>
      <div className="mx-auto max-w-7xl py-2">
        <header className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Financial controls</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Earnings reconciliation</h1>
          <p className="mt-2 text-sm text-muted-foreground">Inspect and idempotently repair missing seller-ledger rows for successful payments.</p>
        </header>
        <EarningsReconciliation />
      </div>
    </AdminShell>
  );
}
