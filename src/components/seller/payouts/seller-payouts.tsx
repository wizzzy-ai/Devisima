"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpRight, Building2, CheckCircle2, ChevronLeft, ChevronRight, Clock3, CreditCard, LoaderCircle, RefreshCw, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatMarketplaceMoney } from "@/lib/marketplace/config";

type Payout = {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "CANCELLED";
  reference: string;
  requestedAt: string | Date;
  processedAt: string | Date | null;
  failureReason: string | null;
};

type PayoutData = {
  balance: {
    availableBalance: number;
    pendingEarnings: number;
    totalPaidOut: number;
  };
  minimumPayout: number;
  account: { bankName: string; accountName: string; accountLast4: string; isVerified: boolean } | null;
  hasActivePayout: boolean;
  payouts: Payout[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

type Bank = { name: string; code: string };

export function SellerPayouts({ initialData, sellerFirstName }: { initialData: PayoutData; sellerFirstName: string }) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(initialData.pagination.page);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [amount, setAmount] = useState("");
  const [manageAccount, setManageAccount] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [banksLoading, setBanksLoading] = useState(false);
  const payoutIdempotencyKey = useRef<string | null>(null);

  const refresh = useCallback(async (requestedPage: number) => {
    const response = await fetch(`/api/seller/payouts?page=${requestedPage}`, { cache: "no-store" });
    const result = await response.json() as PayoutData & { message?: string };
    if (!response.ok) throw new Error(result.message || "Could not refresh payout information.");
    setData(result);
    setPage(result.pagination.page);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      refresh(page).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not refresh payout information."));
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [page, refresh]);

  async function loadBanks() {
    if (banks.length) return;
    setBanksLoading(true);
    try {
      const response = await fetch("/api/seller/payout-account/banks", { cache: "no-store" });
      const result = await response.json() as { banks?: Bank[]; message?: string };
      if (!response.ok || !result.banks) throw new Error(result.message || "Banks are temporarily unavailable.");
      setBanks(result.banks);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Banks are temporarily unavailable.");
    } finally {
      setBanksLoading(false);
    }
  }

  async function toggleAccountForm() {
    const nextOpen = !manageAccount;
    setManageAccount(nextOpen);
    setError("");
    if (nextOpen) await loadBanks();
  }

  async function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/seller/payout-account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankCode, accountNumber }),
      });
      const result = await response.json() as { account?: PayoutData["account"]; message?: string };
      if (!response.ok || !result.account) throw new Error(result.message || "Could not save the payout account.");
      setData((current) => ({ ...current, account: result.account ?? null }));
      setAccountNumber("");
      setBankCode("");
      setManageAccount(false);
      setSuccess(result.message || "Payout account verified and saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the payout account.");
    } finally {
      setBusy(false);
    }
  }

  async function requestPayout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    payoutIdempotencyKey.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/seller/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: payoutIdempotencyKey.current, ...(amount ? { amount: Number(amount) } : {}) }),
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Could not submit the payout request.");
      payoutIdempotencyKey.current = null;
      setAmount("");
      setSuccess(result.message || "Payout request submitted for review.");
      await refresh(1);
      window.history.replaceState(null, "", "/seller/payouts");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not submit the payout request.");
    } finally {
      setBusy(false);
    }
  }

  async function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > data.pagination.totalPages) return;
    setError("");
    try {
      await refresh(nextPage);
      window.history.replaceState(null, "", `/seller/payouts?page=${nextPage}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load payout history.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl py-2">
      <section className="relative isolate mb-8 overflow-hidden rounded-[2rem] bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute -right-20 -top-36 -z-10 h-80 w-80 rounded-full border-[40px] border-border/20" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
          Seller studio <span className="mx-2 text-primary-foreground/30">/</span> Payouts
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Your earnings, {sellerFirstName}.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/70 sm:text-base">
          Move your available balance to your verified bank account and keep track of every payout.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#request-payout" className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition hover:bg-accent/90">
            <Wallet className="h-4 w-4" /> Request a payout
          </a>
          <Link href="/seller/earnings" className="flex items-center gap-2 rounded-xl border border-primary-foreground/20 bg-card/5 px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-card/10">
            View earnings <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {error && <div role="alert" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><span>{error}</span><button onClick={() => refresh(page).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Refresh failed."))} className="inline-flex shrink-0 items-center gap-2 font-semibold underline"><RefreshCw className="h-4 w-4" />Retry</button></div>}
      {success && <div role="status" className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">{success}</div>}

      <section className="grid gap-4 sm:grid-cols-3">
        <BalanceCard label="Available to withdraw" value={formatMarketplaceMoney(data.balance.availableBalance)} icon={Wallet} prominent />
        <BalanceCard label="Pending earnings" value={formatMarketplaceMoney(data.balance.pendingEarnings)} icon={Clock3} />
        <BalanceCard label="Successfully paid out" value={formatMarketplaceMoney(data.balance.totalPaidOut)} icon={CheckCircle2} />
      </section>

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <section id="request-payout" className="scroll-mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="text-lg font-semibold text-foreground">Payout account</h2><p className="mt-1 text-sm text-muted-foreground">Verified bank details are stored securely.</p></div>
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          {data.account?.isVerified ? (
            <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-muted/40 p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{data.account.accountName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{data.account.bankName} ···· {data.account.accountLast4}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-primary"><CheckCircle2 className="h-4 w-4" /> Verified</span>
            </div>
          ) : <p className="mt-5 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Add and verify a Nigerian bank account to request a payout.</p>}
          <button type="button" onClick={toggleAccountForm} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted">
            <CreditCard className="h-4 w-4" /> {data.account ? "Change bank account" : "Add bank account"}
          </button>
          {manageAccount && <form onSubmit={saveAccount} className="mt-5 space-y-4 border-t border-border pt-5">
            <label className="block text-sm font-medium text-foreground">Bank
              <select required value={bankCode} onChange={(event) => setBankCode(event.target.value)} disabled={banksLoading || busy} className="mt-1.5 block w-full rounded-xl border border-border bg-background px-3 py-2.5">
                <option value="">{banksLoading ? "Loading banks..." : "Select a bank"}</option>
                {banks.map((bank) => <option key={bank.code} value={bank.code}>{bank.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-foreground">10-digit account number
              <input required inputMode="numeric" autoComplete="off" pattern="[0-9]{10}" maxLength={10} value={accountNumber} onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, "").slice(0, 10))} disabled={busy} className="mt-1.5 block w-full rounded-xl border border-border bg-background px-3 py-2.5" />
            </label>
            <p className="text-xs leading-5 text-muted-foreground">Paystack verifies the account name before saving. Changing bank details is disabled while a payout is pending or processing.</p>
            <button disabled={busy || banksLoading || banks.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
              {busy && <LoaderCircle className="h-4 w-4 animate-spin" />} Verify and save
            </button>
          </form>}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-semibold text-foreground">Request a payout</h2><p className="mt-1 text-sm text-muted-foreground">Requests require administrator review before transfer.</p></div><ArrowDownToLine className="h-5 w-5 text-primary" /></div>
          <form onSubmit={requestPayout} className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-foreground">Amount in NGN <span className="font-normal text-muted-foreground">(leave empty to request all available)</span>
              <input type="number" min={data.minimumPayout} max={data.balance.availableBalance} step="1" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={busy} placeholder={String(data.balance.availableBalance)} className="mt-1.5 block w-full rounded-xl border border-border bg-background px-3 py-2.5" />
            </label>
            <div className="rounded-xl bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">Minimum payout: {formatMarketplaceMoney(data.minimumPayout)}. Requested funds are reserved until the request is completed, rejected, or fails.</div>
            <button disabled={busy || data.hasActivePayout || !data.account?.isVerified || data.balance.availableBalance < data.minimumPayout} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
              {busy && <LoaderCircle className="h-4 w-4 animate-spin" />} Request payout
            </button>
            {data.hasActivePayout && <p className="text-xs text-muted-foreground">You already have a payout request pending or processing.</p>}
          </form>
        </section>
      </div>

      <section className="mt-7 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6"><div><h2 className="text-lg font-semibold text-foreground">Payout history</h2><p className="mt-1 text-sm text-muted-foreground">Your most recent requests and transfer statuses.</p></div><span className="text-xs text-muted-foreground">{data.pagination.total.toLocaleString("en-NG")} total</span></div>
        {data.payouts.length === 0 ? <div className="px-6 py-12 text-center"><Wallet className="mx-auto h-8 w-8 text-muted-foreground" /><h3 className="mt-3 font-semibold text-foreground">No payouts yet</h3><p className="mt-1 text-sm text-muted-foreground">Your payout requests will appear here.</p></div> : <>
          <div className="divide-y divide-border">
            {data.payouts.map((payout) => <article key={payout.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <div className="min-w-0"><p className="font-semibold text-foreground">{formatMarketplaceMoney(payout.amount)}</p><p className="mt-1 truncate text-xs text-muted-foreground">{payout.reference} · {new Date(payout.requestedAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</p>{payout.failureReason && <p className="mt-1 max-w-xl text-xs text-destructive">{payout.failureReason}</p>}</div>
              <StatusBadge status={payout.status} />
            </article>)}
          </div>
          {data.pagination.totalPages > 1 && <div className="flex items-center justify-between border-t border-border px-5 py-3 sm:px-6"><span className="text-sm text-muted-foreground">Page {page} of {data.pagination.totalPages}</span><div className="flex gap-2"><button aria-label="Previous payout history page" disabled={page <= 1} onClick={() => goToPage(page - 1)} className="rounded-lg border border-border p-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><button aria-label="Next payout history page" disabled={page >= data.pagination.totalPages} onClick={() => goToPage(page + 1)} className="rounded-lg border border-border p-2 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div></div>}
        </>}
      </section>
    </div>
  );
}

function BalanceCard({ label, value, icon: Icon, prominent = false }: { label: string; value: string; icon: LucideIcon; prominent?: boolean }) {
  return <article className={`rounded-2xl border p-5 ${prominent ? "border-primary/20 bg-primary text-primary-foreground" : "border-border bg-card"}`}>
    <div className="flex items-center justify-between gap-3"><p className={`text-sm font-medium ${prominent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{label}</p><Icon className={`h-5 w-5 ${prominent ? "text-accent" : "text-primary"}`} /></div>
    <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>
  </article>;
}

function StatusBadge({ status }: { status: Payout["status"] }) {
  const styles = {
    PENDING: "bg-amber-500/10 text-amber-700",
    PROCESSING: "bg-blue-500/10 text-blue-700",
    PAID: "bg-primary/10 text-primary",
    FAILED: "bg-destructive/10 text-destructive",
    CANCELLED: "bg-muted text-muted-foreground",
  }[status];
  const label = status === "PAID" ? "Paid" : status.charAt(0) + status.slice(1).toLowerCase();
  return <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${styles}`}>{label}</span>;
}
