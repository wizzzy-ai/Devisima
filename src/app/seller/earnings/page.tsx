import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, CircleDollarSign, Clock3, Package, Wallet } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireSeller } from "@/lib/auth/guards";
import { getSellerEarningsHistory } from "@/lib/earnings/history";
import { formatMarketplaceMoney } from "@/lib/marketplace/config";

export const metadata: Metadata = {
  title: "Seller earnings | Devisima",
  description: "View your verified product sales, earnings, and payout balance.",
  robots: "noindex",
};

export default async function SellerEarningsPage({ searchParams }: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const seller = await requireSeller();
  if (seller.role !== "SELLER" || seller.status !== "ACTIVE") {
    return <DashboardShell user={seller}><p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Seller earnings are available to active sellers.</p></DashboardShell>;
  }

  const params = await searchParams;
  const requestedPage = Number.parseInt(Array.isArray(params.page) ? params.page[0] ?? "1" : params.page ?? "1", 10);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const { summary, transactions, pagination } = await getSellerEarningsHistory(seller.id, page);
  const hasSales = summary.totalSales > 0;
  const cards = [
    { label: "Total revenue", amount: summary.grossRevenue, icon: CircleDollarSign, note: "Net of recorded refunds and adjustments" },
    { label: "Gross sales", amount: summary.grossSales, icon: ArrowUpRight, note: "Verified product sales" },
    { label: "Platform fees", amount: summary.platformCommission, icon: ArrowDownRight, note: "Commission on recorded sales" },
    { label: "Net earnings", amount: summary.netEarnings, icon: Wallet, note: "After fees and recorded adjustments" },
    { label: "Pending earnings", amount: summary.pendingEarnings, icon: Clock3, note: "Held until the release date" },
    { label: "Available balance", amount: summary.availableBalance, icon: Wallet, note: "After pending payout reservations" },
    { label: "Paid out", amount: summary.totalPaidOut, icon: ArrowUpRight, note: "Successfully completed payouts" },
  ];

  return (
    <DashboardShell user={seller}>
      <div className="mx-auto max-w-7xl py-2">
        <section className="relative isolate mb-8 overflow-hidden rounded-[2rem] bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-36 -z-10 h-80 w-80 rounded-full border-[40px] border-border/20" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Seller studio <span className="mx-2 text-primary-foreground/30">/</span> Earnings
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {hasSales ? `Your earnings, ${seller.name.split(" ")[0]}.` : `Welcome to your earnings, ${seller.name.split(" ")[0]}.`}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/70 sm:text-base">
            Follow your verified sales, available balance, and payouts all in one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/seller/payouts" className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition hover:bg-accent/90">
              <Wallet className="h-4 w-4" /> Manage payouts
            </Link>
            <Link href="/seller/products" className="flex items-center gap-2 rounded-xl border border-primary-foreground/20 bg-card/5 px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-card/10">
              <Package className="h-4 w-4" /> Manage listings <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {!hasSales ? (
          <section className="rounded-2xl border border-border bg-card px-6 py-14 text-center sm:px-10">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><CircleDollarSign className="h-7 w-7" /></span>
            <h2 className="mt-5 text-xl font-semibold text-foreground">No earnings yet</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Once customers purchase your products, your earnings and transaction history will appear here.</p>
            <Link href="/seller/products" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">View my products</Link>
          </section>
        ) : (
          <>
            <section aria-label="Earnings summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map(({ label, amount, icon: Icon, note }) => (
                <article key={label} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                  </div>
                  <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{formatMarketplaceMoney(amount)}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{note}</p>
                </article>
              ))}
              <article className="rounded-2xl border border-border bg-card p-5">
                <p className="text-sm font-medium text-muted-foreground">Number of sales</p>
                <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{summary.totalSales.toLocaleString("en-NG")}</p>
                <p className="mt-2 text-xs text-muted-foreground">Verified product line items</p>
              </article>
            </section>

            <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4 sm:px-6">
                <h2 className="text-lg font-semibold text-foreground">Transaction history</h2>
                <p className="mt-1 text-sm text-muted-foreground">Every row is backed by your seller ledger.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Product / transaction</th>
                      <th className="px-5 py-3 font-semibold">Order</th>
                      <th className="px-5 py-3 text-right font-semibold">Gross sale</th>
                      <th className="px-5 py-3 text-right font-semibold">Platform fee</th>
                      <th className="px-5 py-3 text-right font-semibold">Net</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="align-middle">
                        <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{transaction.createdAt.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</td>
                        <td className="max-w-64 px-5 py-4">
                          <p className="truncate font-medium text-foreground">{transaction.product?.title ?? transaction.description}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{transaction.type.replaceAll("_", " ").toLowerCase()}</p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {transaction.order ? <span className="font-medium text-foreground">Order {transaction.order.reference}</span> : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums">{formatMarketplaceMoney(transaction.grossAmount)}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums text-muted-foreground">{transaction.commissionAmount > 0 ? `−${formatMarketplaceMoney(transaction.commissionAmount)}` : transaction.commissionAmount < 0 ? `+${formatMarketplaceMoney(Math.abs(transaction.commissionAmount))}` : "—"}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums">{formatMarketplaceMoney(transaction.netAmount)}</td>
                        <td className="px-5 py-4"><StatusBadge status={transaction.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-sm">
                <p className="text-muted-foreground">Page {pagination.page} of {pagination.totalPages} · {pagination.total.toLocaleString("en-NG")} transactions</p>
                <div className="flex gap-2">
                  {pagination.page > 1 && <Link href={`/seller/earnings?page=${pagination.page - 1}`} className="rounded-lg border border-border px-3 py-2 font-medium text-foreground hover:bg-muted">Previous</Link>}
                  {pagination.page < pagination.totalPages && <Link href={`/seller/earnings?page=${pagination.page + 1}`} className="rounded-lg border border-border px-3 py-2 font-medium text-foreground hover:bg-muted">Next</Link>}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style = status === "AVAILABLE" || status === "PAID"
    ? "bg-emerald-50 text-emerald-700"
    : status === "PENDING"
      ? "bg-amber-50 text-amber-700"
      : status === "REVERSED"
        ? "bg-rose-50 text-rose-700"
        : "bg-muted text-muted-foreground";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{status.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase())}</span>;
}
