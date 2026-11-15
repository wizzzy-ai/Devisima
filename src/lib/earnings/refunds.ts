import "server-only";
import { db } from "@/lib/db/prisma";
import { writeFinancialAudit } from "@/lib/payouts/audit";

type AllocationLine = { id: string; weight: number };

function allocate(amount: number, lines: AllocationLine[]) {
  const totalWeight = lines.reduce((sum, line) => sum + line.weight, 0);
  if (amount < 0 || amount > totalWeight || !Number.isSafeInteger(amount) || totalWeight <= 0) {
    throw new Error("The successful refund amount cannot be allocated to the seller sale items.");
  }
  const allocations = lines.map((line) => {
    const exact = amount * line.weight / totalWeight;
    return { id: line.id, amount: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let remainder = amount - allocations.reduce((sum, line) => sum + line.amount, 0);
  for (const line of [...allocations].sort((left, right) => right.remainder - left.remainder || left.id.localeCompare(right.id))) {
    if (!remainder) break;
    line.amount += 1;
    remainder -= 1;
  }
  return new Map(allocations.map((line) => [line.id, line.amount]));
}

export async function reconcileSuccessfulRefundEarnings(refundId: string, actorId?: string) {
  return db.$transaction(async (tx) => {
    const refund = await tx.refund.findUnique({
      where: { id: refundId },
      select: {
        id: true,
        orderId: true,
        amount: true,
        currency: true,
        status: true,
        providerReference: true,
        createdAt: true,
        payment: { select: { orderId: true, status: true, currency: true } },
        order: { select: { reference: true, status: true, currency: true, total: true, payments: { where: { status: "SUCCESS" }, select: { id: true } } } },
      },
    });
    if (!refund || refund.status !== "SUCCESS") return { status: "not_successful" as const, created: 0 };
    if (
      refund.order.status !== "PAID" || refund.order.payments.length === 0 ||
      refund.payment.orderId !== refund.orderId || refund.payment.status !== "SUCCESS" ||
      refund.currency !== refund.order.currency || refund.currency !== refund.payment.currency ||
      !Number.isSafeInteger(refund.amount) || refund.amount <= 0 || refund.amount > refund.order.total
    ) {
      throw new Error("A successful refund must belong to a paid order with a successful payment in the same currency.");
    }
    await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${refund.orderId} FOR UPDATE`;

    const orderItems = await tx.orderItem.findMany({
      where: { orderId: refund.orderId },
      orderBy: [{ id: "asc" }],
      select: {
        id: true,
        productId: true,
        productName: true,
        sellerId: true,
        sellerTransactions: { where: { type: "SALE" }, take: 1, select: { sellerId: true, grossAmount: true, commissionAmount: true, netAmount: true, currency: true, status: true, availableAt: true } },
      },
    });
    const lines = orderItems.flatMap((item) => {
      const sale = item.sellerTransactions[0];
      if (!sale || !sale.grossAmount || sale.sellerId !== item.sellerId || sale.currency !== refund.currency) return [];
      return [{ item, sale, id: item.id, weight: sale.grossAmount }];
    });
    if (!lines.length || lines.length !== orderItems.filter((item) => item.sellerId).length) {
      throw new Error("Seller sale ledger entries must be reconciled before seller refund adjustments can be created.");
    }
    const totalGross = lines.reduce((sum, line) => sum + line.weight, 0);
    const refunds = await tx.refund.findMany({
      where: { orderId: refund.orderId, status: "SUCCESS", OR: [{ createdAt: { lt: refund.createdAt } }, { createdAt: refund.createdAt, id: { lte: refund.id } }] },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, amount: true },
    });
    const missingFromSequence = refunds.findIndex((item) => item.id === refund.id);
    if (missingFromSequence < 0) throw new Error("The refund could not be found in its successful refund sequence.");

    let totalRefunded = 0;
    let created = 0;
    for (const currentRefund of refunds.slice(0, missingFromSequence + 1)) {
      const beforeAmount = totalRefunded;
      totalRefunded += currentRefund.amount;
      if (totalRefunded > refund.order.total) throw new Error("Successful refunds exceed the paid order total.");
      const beforeGrossAmount = Math.round(totalGross * beforeAmount / refund.order.total);
      const afterGrossAmount = Math.round(totalGross * totalRefunded / refund.order.total);
      const beforeGross = beforeGrossAmount ? allocate(beforeGrossAmount, lines) : new Map<string, number>();
      const afterGross = allocate(afterGrossAmount, lines);
      const existing = await tx.sellerTransaction.findMany({
        where: { sellerId: { in: lines.map((line) => line.sale.sellerId) }, sourceKey: { startsWith: `refund:${currentRefund.id}:` } },
        select: { sourceKey: true },
      });
      const existingKeys = new Set(existing.map((entry) => entry.sourceKey));
      for (const line of lines) {
        const sourceKey = `refund:${currentRefund.id}:${line.item.id}`;
        if (existingKeys.has(sourceKey)) continue;
        const grossDelta = (afterGross.get(line.id) ?? 0) - (beforeGross.get(line.id) ?? 0);
        if (!grossDelta) continue;
        const beforeCommission = Math.round(Math.abs(line.sale.commissionAmount) * (beforeGross.get(line.id) ?? 0) / line.sale.grossAmount);
        const afterCommission = Math.round(Math.abs(line.sale.commissionAmount) * (afterGross.get(line.id) ?? 0) / line.sale.grossAmount);
        const commissionDelta = afterCommission - beforeCommission;
        const netDelta = grossDelta - commissionDelta;
        const result = await tx.sellerTransaction.createMany({
          data: [{
            sellerId: line.sale.sellerId,
            orderId: refund.orderId,
            orderItemId: line.item.id,
            productId: line.item.productId,
            type: "REFUND",
            grossAmount: -grossDelta,
            commissionAmount: -commissionDelta,
            netAmount: -netDelta,
            currency: refund.currency,
            status: line.sale.status === "PENDING" && line.sale.availableAt && line.sale.availableAt > new Date() ? "PENDING" : line.sale.status === "PENDING" ? "AVAILABLE" : line.sale.status,
            availableAt: line.sale.availableAt,
            sourceKey,
            description: `Refund adjustment for ${line.item.productName}`,
          }],
          skipDuplicates: true,
        });
        if (!result.count) continue;
        created += 1;
        await writeFinancialAudit(tx, {
          actorId,
          action: "REFUND_EARNING_REVERSED",
          entityType: "SellerTransaction",
          entityId: sourceKey,
          amount: -netDelta,
          currency: refund.currency,
          metadata: {
            orderReference: refund.order.reference,
            refundReference: refund.providerReference,
            orderItemId: line.item.id,
            grossAmount: -grossDelta,
            commissionAmount: -commissionDelta,
          },
        });
      }
    }
    return { status: "reconciled" as const, created };
  }, { isolationLevel: "Serializable" });
}

export async function findUnreconciledSuccessfulRefunds(limit: number) {
  const batchSize = 250;
  const rows: Array<{
    id: string;
    providerReference: string;
    orderId: string;
    amount: number;
    currency: string;
    createdAt: Date;
    order: { reference: string };
  }> = [];
  let offset = 0;

  while (rows.length < limit) {
    const refunds = await db.refund.findMany({
      where: {
        status: "SUCCESS",
        order: { status: "PAID", payments: { some: { status: "SUCCESS" } }, sellerTransactions: { some: { type: "SALE" } } },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      skip: offset,
      take: batchSize,
      select: { id: true, providerReference: true, orderId: true, amount: true, currency: true, createdAt: true, order: { select: { reference: true } } },
    });
    if (!refunds.length) break;
    offset += refunds.length;
    const existing = await db.sellerTransaction.findMany({
      where: { orderId: { in: [...new Set(refunds.map((refund) => refund.orderId))] }, type: "REFUND" },
      select: { sourceKey: true },
    });
    const reconciledRefundIds = new Set(existing.flatMap(({ sourceKey }) => {
      const match = /^refund:([^:]+):/.exec(sourceKey);
      return match ? [match[1]] : [];
    }));
    rows.push(...refunds.filter((refund) => !reconciledRefundIds.has(refund.id)).slice(0, limit - rows.length));
    if (refunds.length < batchSize) break;
  }
  return { total: rows.length, rows };
}
