import "server-only";
import { db } from "@/lib/db/prisma";
import { getSellerBalance } from "@/lib/earnings/balance";

const pageSize = 25;

export async function getSellerEarningsHistory(sellerId: string, requestedPage: number) {
  const total = await db.sellerTransaction.count({ where: { sellerId } });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const [summary, transactions] = await Promise.all([
    getSellerBalance(sellerId),
    db.sellerTransaction.findMany({
      where: { sellerId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        type: true,
        grossAmount: true,
        commissionAmount: true,
        netAmount: true,
        currency: true,
        status: true,
        availableAt: true,
        description: true,
        createdAt: true,
        order: { select: { id: true, reference: true } },
        product: { select: { title: true } },
      },
    }),
  ]);
  const now = new Date();
  return {
    summary,
    transactions: transactions.map((transaction) => ({
      ...transaction,
      status: transaction.status === "PENDING" && transaction.availableAt && transaction.availableAt <= now
        ? "AVAILABLE"
        : transaction.status,
    })),
    pagination: { page, pageSize, total, totalPages },
  };
}
