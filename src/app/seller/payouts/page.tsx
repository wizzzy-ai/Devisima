import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SellerPayouts } from "@/components/seller/payouts/seller-payouts";
import { requireSeller } from "@/lib/auth/guards";
import { getSellerBalance, getMarketplaceSettings } from "@/lib/earnings/balance";
import { db } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Seller payouts | Devisima",
  description: "Manage your verified payout account and seller payouts.",
  robots: "noindex",
};

export default async function SellerPayoutsPage({ searchParams }: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const seller = await requireSeller();
  if (seller.role !== "SELLER" || seller.status !== "ACTIVE") {
    return <DashboardShell user={seller}><p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Payouts are available to active sellers.</p></DashboardShell>;
  }

  const params = await searchParams;
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const requestedPage = Number(rawPage ?? "1");
  const pageSize = 10;
  const total = await db.sellerPayout.count({ where: { sellerId: seller.id } });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, totalPages) : 1;
  const [balance, settings, account, payouts, activePayout] = await Promise.all([
    getSellerBalance(seller.id),
    getMarketplaceSettings(),
    db.sellerPayoutAccount.findUnique({
      where: { sellerId: seller.id },
      select: { bankName: true, accountName: true, accountLast4: true, isVerified: true },
    }),
    db.sellerPayout.findMany({
      where: { sellerId: seller.id },
      orderBy: { requestedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, amount: true, currency: true, status: true, reference: true, requestedAt: true, processedAt: true, failureReason: true },
    }),
    db.sellerPayout.findFirst({
      where: { sellerId: seller.id, status: { in: ["PENDING", "PROCESSING"] } },
      select: { id: true },
    }),
  ]);

  return <DashboardShell user={seller}><SellerPayouts
    sellerFirstName={seller.name.split(" ")[0]}
    initialData={{
      balance,
      minimumPayout: settings.minimumPayout,
      account,
      hasActivePayout: Boolean(activePayout),
      payouts,
      pagination: { page, pageSize, total, totalPages },
    }}
  /></DashboardShell>;
}
