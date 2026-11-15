"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CircleAlert, LoaderCircle, RefreshCw, Wallet, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatMarketplaceMoney } from "@/lib/marketplace/config";

type PayoutStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED";
type PayoutRow = {
  id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  reference: string;
  requestedAt: string | Date;
  processedAt: string | Date | null;
  failureReason: string | null;
  bankName: string;
  accountLast4: string;
  seller: { id: string; name: string; email: string };
  attempts: { transferReference: string; providerStatus: string | null; status: string; createdAt: string | Date }[];
};
type PayoutFilter = PayoutStatus | "ALL";
type AdminPayoutData = {
  payouts: PayoutRow[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  status: PayoutFilter;
};

const filters: PayoutFilter[] = ["ALL", "PENDING", "PROCESSING", "PAID", "FAILED", "CANCELLED"];

export function AdminPayouts({ initialData }: { initialData: AdminPayoutData }) {
  const [data, setData] = useState(initialData);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  async function refresh(page: number, status: PayoutFilter) {
    const query = new URLSearchParams({ page: String(page), status });
    const response = await fetch(`/api/admin/payouts?${query}`, { cache: "no-store" });
    const result = await response.json() as AdminPayoutData & { message?: string };
    if (!response.ok) throw new Error(result.message || "Could not load payout requests.");
    setData(result);
    window.history.replaceState(null, "", `/admin/payouts?page=${page}&status=${status}`);
  }

  async function act(payout: PayoutRow, action: "APPROVE" | "REJECT" | "RETRY" | "RECONCILE") {
    const reason = rejectionReasons[payout.id]?.trim() ?? "";
    if (action === "REJECT" && reason.length < 5) {
      setError("Enter a clear reason of at least 5 characters before rejecting.");
      return;
    }
    const confirmation = action === "APPROVE"
      ? "Approve this payout and initiate the Paystack transfer?"
      : action === "RETRY"
        ? "Retry this failed payout with a new Paystack transfer attempt?"
        : action === "RECONCILE"
          ? "Verify this transfer's current status with Paystack?"
          : "Reject this payout request and release the reserved balance?";
    if (!window.confirm(confirmation)) return;
    setBusyId(payout.id);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/admin/payouts/${payout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...(action === "REJECT" ? { reason } : {}) }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "The payout action could not be completed.");
      setSuccess(result.message || "Payout updated.");
      await refresh(data.pagination.page, data.status);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The payout action could not be completed.");
    } finally {
      setBusyId("");
    }
  }

  async function changeFilter(status: PayoutFilter) {
    setError("");
    try {
      await refresh(1, status);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load payout requests.");
    }
  }

  async function changePage(page: number) {
    if (page < 1 || page > data.pagination.totalPages) return;
    setError("");
    try {
      await refresh(page, data.status);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load payout requests.");
    }
  }

  return <div className="mx-auto max-w-7xl py-2">
    <header className="mb-7">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Finance operations</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Seller payouts</h1>
      <p className="mt-2 text-sm text-muted-foreground">Review payout requests, initiate approved transfers, and reconcile ambiguous Paystack outcomes.</p>
    </header>
    {error && <div role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><CircleAlert className="h-4 w-4 shrink-0" />{error}</div>}
    {success && <div role="status" className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">{success}</div>}

    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div><h2 className="font-semibold text-foreground">Payout queue</h2><p className="mt-1 text-sm text-muted-foreground">{data.pagination.total.toLocaleString("en-NG")} {data.status === "ALL" ? "total requests" : `${data.status.toLowerCase()} requests`}</p></div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">Status
          <select value={data.status} onChange={(event) => changeFilter(event.target.value as PayoutFilter)} className="rounded-lg border border-border bg-background px-3 py-2 text-foreground">
            {filters.map((filter) => <option key={filter} value={filter}>{filter === "ALL" ? "All statuses" : filter.charAt(0) + filter.slice(1).toLowerCase()}</option>)}
          </select>
        </label>
      </div>
      {data.payouts.length === 0 ? <div className="px-6 py-14 text-center"><Wallet className="mx-auto h-8 w-8 text-muted-foreground" /><h3 className="mt-3 font-semibold text-foreground">No payout requests</h3><p className="mt-1 text-sm text-muted-foreground">Requests will appear here when sellers submit them.</p></div> : <div className="divide-y divide-border">
        {data.payouts.map((payout) => <article key={payout.id} className="p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold text-foreground">{formatMarketplaceMoney(payout.amount)}</h3>
                <Status status={payout.status} />
                <span className="text-xs text-muted-foreground">{new Date(payout.requestedAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</span>
              </div>
              <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{payout.reference}</p>
              <p className="mt-3 text-sm font-medium text-foreground">{payout.seller.name} <span className="font-normal text-muted-foreground">· {payout.seller.email}</span></p>
              <p className="mt-1 text-sm text-muted-foreground">{payout.bankName} ···· {payout.accountLast4} <span className="mx-1">|</span> Request ID {payout.id}</p>
              {payout.failureReason && <p className="mt-2 max-w-3xl rounded-lg bg-destructive/5 p-3 text-sm text-destructive">{payout.failureReason}</p>}
              {payout.attempts[0] && <p className="mt-2 break-all text-xs text-muted-foreground">Latest transfer: {payout.attempts[0].transferReference}{payout.attempts[0].providerStatus ? ` · ${payout.attempts[0].providerStatus}` : " · awaiting provider status"}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:max-w-sm lg:justify-end">
              {payout.status === "PENDING" && <>
                <button disabled={busyId === payout.id} onClick={() => act(payout, "APPROVE")} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"><ActionIcon busy={busyId === payout.id} icon={Check} />Approve &amp; transfer</button>
                <button disabled={busyId === payout.id} onClick={() => act(payout, "REJECT")} className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-semibold text-destructive disabled:opacity-60"><X className="h-4 w-4" />Reject</button>
                <input aria-label={`Rejection reason for payout ${payout.reference}`} value={rejectionReasons[payout.id] ?? ""} onChange={(event) => setRejectionReasons((current) => ({ ...current, [payout.id]: event.target.value }))} maxLength={1000} placeholder="Reason required to reject" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm lg:max-w-52" />
              </>}
              {payout.status === "FAILED" && <button disabled={busyId === payout.id} onClick={() => act(payout, "RETRY")} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"><ActionIcon busy={busyId === payout.id} icon={RefreshCw} />Retry transfer</button>}
              {payout.status === "PROCESSING" && <button disabled={busyId === payout.id} onClick={() => act(payout, "RECONCILE")} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground disabled:opacity-60"><ActionIcon busy={busyId === payout.id} icon={RefreshCw} />Verify with Paystack</button>}
            </div>
          </div>
        </article>)}
      </div>}
      {data.pagination.totalPages > 1 && <footer className="flex items-center justify-between border-t border-border px-5 py-3 sm:px-6">
        <span className="text-sm text-muted-foreground">Page {data.pagination.page} of {data.pagination.totalPages}</span>
        <div className="flex gap-2"><button aria-label="Previous page" disabled={data.pagination.page <= 1} onClick={() => changePage(data.pagination.page - 1)} className="rounded-lg border border-border p-2 disabled:opacity-40"><ArrowLeft className="h-4 w-4" /></button><button aria-label="Next page" disabled={data.pagination.page >= data.pagination.totalPages} onClick={() => changePage(data.pagination.page + 1)} className="rounded-lg border border-border p-2 disabled:opacity-40"><ArrowRight className="h-4 w-4" /></button></div>
      </footer>}
    </section>
  </div>;
}

function Status({ status }: { status: PayoutStatus }) {
  const styles = {
    PENDING: "bg-amber-500/10 text-amber-700",
    PROCESSING: "bg-blue-500/10 text-blue-700",
    PAID: "bg-primary/10 text-primary",
    FAILED: "bg-destructive/10 text-destructive",
    CANCELLED: "bg-muted text-muted-foreground",
  }[status];
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
}

function ActionIcon({ busy, icon: Icon }: { busy: boolean; icon: LucideIcon }) {
  return busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />;
}
