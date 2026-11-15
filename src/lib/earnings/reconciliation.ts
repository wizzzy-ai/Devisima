import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { getMarketplaceSettings } from "@/lib/earnings/balance";
import { writeFinancialAudit } from "@/lib/payouts/audit";

const eligibleOrderItemWhere: Prisma.OrderItemWhereInput = {
  order: { status: "PAID", payments: { some: { status: "SUCCESS" } } },
  sellerTransactions: { none: { type: "SALE" } },
  OR: [
    { sellerId: { not: "" } },
    { sellerId: null, product: { isNot: null } },
  ],
};

async function findMissing(limit: number) {
  const [total, orderItems] = await Promise.all([
    db.orderItem.count({ where: eligibleOrderItemWhere }),
    db.orderItem.findMany({
      where: eligibleOrderItemWhere,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: limit,
      select: {
        id: true,
        productId: true,
        sellerId: true,
        productName: true,
        priceAtPurchase: true,
        quantity: true,
        commissionRateBps: true,
        commissionAmount: true,
        sellerEarnings: true,
        product: { select: { sellerId: true, seller: { select: { email: true } } } },
        seller: { select: { id: true, email: true } },
        order: {
          select: {
            id: true,
            reference: true,
            currency: true,
            createdAt: true,
            payments: { where: { status: "SUCCESS" }, orderBy: { paidAt: "desc" }, take: 1, select: { paidAt: true } },
          },
        },
      },
    }),
  ]);
  const settings = await getMarketplaceSettings();
  const rows = orderItems.flatMap((item) => {
    const sellerId = item.sellerId ?? item.product?.sellerId;
    const sellerEmail = item.seller?.email ?? item.product?.seller?.email ?? null;
    if (!sellerId) return [];
    const grossAmount = item.priceAtPurchase * item.quantity;
    const commissionRateBps = item.commissionRateBps ?? settings.commissionRateBps;
    const commissionAmount = item.commissionAmount ?? Math.round(grossAmount * commissionRateBps / 10_000);
    const netAmount = item.sellerEarnings ?? grossAmount - commissionAmount;
    const paidAt = item.order.payments[0]?.paidAt ?? item.order.createdAt;
    const availableAt = new Date(paidAt.getTime() + settings.earningHoldDays * 24 * 60 * 60 * 1000);
    return [{
      orderItemId: item.id,
      orderId: item.order.id,
      orderReference: item.order.reference,
      productId: item.productId,
      productName: item.productName,
      sellerId,
      sellerEmail,
      currency: item.order.currency,
      grossAmount,
      commissionAmount,
      netAmount,
      commissionRateBps,
      availableAt,
      status: availableAt > new Date() ? "PENDING" as const : "AVAILABLE" as const,
    }];
  });
  return { total, rows };
}

export async function previewMissingSellerEarnings(limit: number) {
  return findMissing(limit);
}

export async function reconcileMissingSellerEarnings(limit: number, actorId: string) {
  const { rows } = await findMissing(limit);
  let created = 0;
  for (const row of rows) {
    const inserted = await db.$transaction(async (tx) => {
      const result = await tx.sellerTransaction.createMany({
        data: [{
          sellerId: row.sellerId,
          orderId: row.orderId,
          orderItemId: row.orderItemId,
          productId: row.productId,
          type: "SALE",
          grossAmount: row.grossAmount,
          commissionAmount: row.commissionAmount,
          netAmount: row.netAmount,
          currency: row.currency,
          status: row.status,
          availableAt: row.availableAt,
          sourceKey: `sale:${row.orderItemId}`,
          description: `Sale of ${row.productName}`,
        }],
        skipDuplicates: true,
      });
      if (result.count === 0) return false;
      await tx.orderItem.update({
        where: { id: row.orderItemId },
        data: {
          commissionRateBps: row.commissionRateBps,
          commissionAmount: row.commissionAmount,
          sellerEarnings: row.netAmount,
        },
      });
      await writeFinancialAudit(tx, {
        actorId,
        action: "SALE_EARNING_CREATED",
        entityType: "SellerTransaction",
        entityId: `sale:${row.orderItemId}`,
        amount: row.netAmount,
        currency: row.currency,
        metadata: {
          orderReference: row.orderReference,
          grossAmount: row.grossAmount,
          commissionAmount: row.commissionAmount,
          commissionRateBps: row.commissionRateBps,
          reconciled: true,
        },
      });
      return true;
    });
    if (inserted) created += 1;
  }
  return { scanned: rows.length, created };
}
