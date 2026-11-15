"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { formatMarketplaceMoney } from "@/lib/marketplace/config";

type MissingEarning = {
  orderItemId: string;
  orderReference: string;
  productName: string;
  sellerId: string;
  sellerEmail: string | null;
  currency: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  commissionRateBps: number;
};

type Preview = { total: number; rows: MissingEarning[] };
type MissingRefund = { id: string; providerReference: string; amount: number; currency: string; order: { reference: string } };
type RefundPreview = { total: number; rows: MissingRefund[] };

async function requestPreview(): Promise<Preview> {
  const response = await fetch("/api/admin/earnings/reconcile?limit=100", { cache: "no-store" });
  const result = await response.json() as Preview | { message?: string };
  if (!response.ok || !("rows" in result) || !("total" in result)) {
    throw new Error("message" in result ? result.message : "Could not load missing earnings.");
  }
  return result;
}

async function requestRefundPreview(): Promise<RefundPreview> {
  const response = await fetch("/api/admin/earnings/reconcile-refunds?limit=100", { cache: "no-store" });
  const result = await response.json() as RefundPreview | { message?: string };
  if (!response.ok || !("rows" in result) || !("total" in result)) {
    throw new Error("message" in result ? result.message : "Could not load successful refunds.");
  }
  return result;
}

export function EarningsReconciliation() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState("");
  const [refundPreview, setRefundPreview] = useState<RefundPreview | null>(null);
  const [refundLoading, setRefundLoading] = useState(true);
  const [refundApplying, setRefundApplying] = useState(false);
  const [refundMessage, setRefundMessage] = useState("");

  async function loadPreview() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/earnings/reconcile?limit=100", { cache: "no-store" });
      const result = await response.json() as Preview | { message?: string };
      if (!response.ok || !("rows" in result) || !("total" in result)) {
        throw new Error("message" in result ? result.message : "Could not load missing earnings.");
      }
      setPreview(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load missing earnings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    requestPreview()
      .then((result) => {
        if (active) setPreview(result);
      })
      .catch((error: unknown) => {
        if (active) setMessage(error instanceof Error ? error.message : "Could not load missing earnings.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    requestRefundPreview()
      .then((result) => {
        if (active) setRefundPreview(result);
      })
      .catch((error: unknown) => {
        if (active) setRefundMessage(error instanceof Error ? error.message : "Could not load successful refunds.");
      })
      .finally(() => {
        if (active) setRefundLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function reconcile() {
    if (!window.confirm("Create missing seller earnings for the verified paid orders shown? This cannot be undone.")) return;
    setApplying(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/earnings/reconcile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "apply", limit: 100 }),
      });
      const result = await response.json() as { scanned?: number; created?: number; message?: string };
      if (!response.ok || typeof result.created !== "number") throw new Error(result.message || "Reconciliation failed.");
      setMessage(`Scanned ${result.scanned ?? 0} eligible order items and created ${result.created} missing earnings.`);
      await loadPreview();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Reconciliation failed.");
    } finally {
      setApplying(false);
    }
  }

  async function reconcileRefunds() {
    if (!window.confirm("Create negative seller ledger adjustments for the successful refunds shown? This cannot be undone.")) return;
    setRefundApplying(true);
    setRefundMessage("");
    try {
      const response = await fetch("/api/admin/earnings/reconcile-refunds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ limit: 100 }),
      });
      const result = await response.json() as { scanned?: number; created?: number; message?: string };
      if (!response.ok || typeof result.created !== "number") throw new Error(result.message || "Refund reconciliation failed.");
      setRefundMessage(`Reconciled ${result.scanned ?? 0} successful refunds and created ${result.created} seller adjustments.`);
      const updated = await requestRefundPreview();
      setRefundPreview(updated);
    } catch (error) {
      setRefundMessage(error instanceof Error ? error.message : "Refund reconciliation failed.");
    } finally {
      setRefundApplying(false);
    }
  }

  return (
    <div className="space-y-6">
    <section className="rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Paid orders missing seller earnings</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            Only PAID orders with a SUCCESS payment are included. Missing sale entries use the order-item commission snapshot when present; otherwise they use the current marketplace commission setting.
          </p>
        </div>
        <button onClick={loadPreview} disabled={loading || applying} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {message && <p role="status" className="border-b border-border px-5 py-3 text-sm text-foreground sm:px-6">{message}</p>}
      {loading ? (
        <div className="flex items-center gap-2 px-6 py-10 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" /> Checking the verified sales ledger…</div>
      ) : !preview?.rows.length ? (
        <p className="px-6 py-10 text-sm text-muted-foreground">No missing seller earnings found in the first 100 eligible order items. Eligible items found: {preview?.total ?? 0}.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Product</th><th className="px-5 py-3">Seller</th><th className="px-5 py-3 text-right">Gross</th><th className="px-5 py-3 text-right">Fee</th><th className="px-5 py-3 text-right">Net earning</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.rows.map((row) => (
                  <tr key={row.orderItemId}>
                    <td className="px-5 py-4 font-medium">{row.orderReference}</td>
                    <td className="px-5 py-4">{row.productName}</td>
                    <td className="px-5 py-4 text-muted-foreground">{row.sellerEmail ?? row.sellerId}</td>
                    <td className="px-5 py-4 text-right tabular-nums">{formatMarketplaceMoney(row.grossAmount)}</td>
                    <td className="px-5 py-4 text-right tabular-nums">{formatMarketplaceMoney(row.commissionAmount)} <span className="text-xs text-muted-foreground">({(row.commissionRateBps / 100).toFixed(2)}%)</span></td>
                    <td className="px-5 py-4 text-right font-semibold tabular-nums">{formatMarketplaceMoney(row.netAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
            <p className="text-sm text-muted-foreground">Showing {preview.rows.length} of {preview.total}. Apply processes at most 100 rows per run.</p>
            <button onClick={reconcile} disabled={applying || loading} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {applying && <LoaderCircle className="h-4 w-4 animate-spin" />} {applying ? "Reconciling…" : "Create missing earnings"}
            </button>
          </div>
        </>
      )}
    </section>
    <section className="rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Successful refunds missing seller adjustments</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">Refunds are allocated proportionally across original line-item gross sales, with rounding remainder distributed deterministically. A full order refund reverses the complete original seller earnings, including orders with coupons. Original sale entries remain unchanged.</p>
        </div>
        <button onClick={() => { setRefundLoading(true); void requestRefundPreview().then(setRefundPreview).catch((error: unknown) => setRefundMessage(error instanceof Error ? error.message : "Could not load successful refunds.")).finally(() => setRefundLoading(false)); }} disabled={refundLoading || refundApplying} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>
      {refundMessage && <p role="status" className="border-b border-border px-5 py-3 text-sm text-foreground sm:px-6">{refundMessage}</p>}
      {refundLoading ? (
        <div className="flex items-center gap-2 px-6 py-10 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" /> Checking successful refund records…</div>
      ) : !refundPreview?.rows.length ? (
        <p className="px-6 py-10 text-sm text-muted-foreground">No unreconciled successful refunds found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Refund reference</th><th className="px-5 py-3 text-right">Refund amount</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {refundPreview.rows.map((refund) => <tr key={refund.id}><td className="px-5 py-4 font-medium">{refund.order.reference}</td><td className="px-5 py-4 text-muted-foreground">{refund.providerReference}</td><td className="px-5 py-4 text-right tabular-nums">{formatMarketplaceMoney(refund.amount)}</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
            <p className="text-sm text-muted-foreground">Showing up to 100 successful refunds.</p>
            <button onClick={reconcileRefunds} disabled={refundApplying || refundLoading} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {refundApplying && <LoaderCircle className="h-4 w-4 animate-spin" />} {refundApplying ? "Reconciling…" : "Create refund adjustments"}
            </button>
          </div>
        </>
      )}
    </section>
    </div>
  );
}
