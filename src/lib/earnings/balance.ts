import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";

type Database = typeof db | Prisma.TransactionClient;

export async function getMarketplaceSettings(database: Database = db) {
  return database.marketplaceSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
}

export async function getSellerBalance(sellerId: string, database: Database = db, excludePayoutId?: string) {
  return (await getSellerBalances([sellerId], database, excludePayoutId)).get(sellerId)!;
}

export async function getSellerBalances(sellerIds: string[], database: Database = db, excludePayoutId?: string) {
  const balances = new Map<string, ReturnType<typeof emptySellerBalance>>();
  for (const sellerId of sellerIds) balances.set(sellerId, emptySellerBalance());
  if (sellerIds.length === 0) return balances;

  const now = new Date();
  const earningWhere: Prisma.SellerTransactionWhereInput = {
    sellerId: { in: sellerIds },
    type: { in: ["SALE", "REFUND", "ADJUSTMENT", "PAYOUT_REVERSAL"] },
    status: { in: ["PENDING", "AVAILABLE", "PAID"] },
  };
  const [lifetime, grossSales, available, pending, payouts, salesCount, nextAvailable] = await Promise.all([
    database.sellerTransaction.groupBy({ by: ["sellerId"], where: earningWhere, _sum: { grossAmount: true, commissionAmount: true, netAmount: true } }),
    database.sellerTransaction.groupBy({ by: ["sellerId"], where: { sellerId: { in: sellerIds }, type: "SALE", status: { in: ["PENDING", "AVAILABLE", "PAID"] } }, _sum: { grossAmount: true } }),
    database.sellerTransaction.groupBy({ by: ["sellerId"], where: { ...earningWhere, OR: [{ availableAt: null }, { availableAt: { lte: now } }] }, _sum: { netAmount: true } }),
    database.sellerTransaction.groupBy({ by: ["sellerId"], where: { ...earningWhere, type: "SALE", availableAt: { gt: now } }, _sum: { netAmount: true } }),
    database.sellerPayout.groupBy({ by: ["sellerId", "status"], where: { sellerId: { in: sellerIds }, status: { in: ["PENDING", "PROCESSING", "PAID"] }, ...(excludePayoutId ? { id: { not: excludePayoutId } } : {}) }, _sum: { amount: true } }),
    database.sellerTransaction.groupBy({ by: ["sellerId"], where: { sellerId: { in: sellerIds }, type: "SALE", status: { in: ["PENDING", "AVAILABLE", "PAID"] } }, _count: { _all: true } }),
    database.sellerTransaction.groupBy({ by: ["sellerId"], where: { sellerId: { in: sellerIds }, type: "SALE", status: "PENDING", availableAt: { gt: now } }, _min: { availableAt: true } }),
  ]);
  for (const row of lifetime) {
    const balance = balances.get(row.sellerId)!;
    balance.grossRevenue = row._sum.grossAmount ?? 0;
    balance.platformCommission = row._sum.commissionAmount ?? 0;
    balance.netEarnings = row._sum.netAmount ?? 0;
  }
  for (const row of grossSales) balances.get(row.sellerId)!.grossSales = row._sum.grossAmount ?? 0;
  for (const row of available) balances.get(row.sellerId)!.availableBalance = row._sum.netAmount ?? 0;
  for (const row of pending) balances.get(row.sellerId)!.pendingEarnings = row._sum.netAmount ?? 0;
  for (const row of payouts) {
    const balance = balances.get(row.sellerId)!;
    if (row.status === "PAID") balance.totalPaidOut += row._sum.amount ?? 0;
    balance.availableBalance -= row._sum.amount ?? 0;
  }
  for (const row of salesCount) balances.get(row.sellerId)!.totalSales = row._count._all;
  for (const row of nextAvailable) balances.get(row.sellerId)!.nextAvailableAt = row._min.availableAt;
  return balances;
}

function emptySellerBalance() {
  return {
    grossRevenue: 0,
    grossSales: 0,
    platformCommission: 0,
    netEarnings: 0,
    pendingEarnings: 0,
    availableBalance: 0,
    totalPaidOut: 0,
    totalSales: 0,
    nextAvailableAt: null as Date | null,
  };
}
