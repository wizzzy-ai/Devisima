import "server-only";

import { db } from "@/lib/db/prisma";
import { verifyPaystackTransaction } from "@/lib/payments/paystack";
import { MARKETPLACE_CURRENCY_MINOR_UNITS } from "@/lib/marketplace/config";
import { getMarketplaceSettings } from "@/lib/earnings/balance";
import { writeFinancialAudit } from "@/lib/payouts/audit";
import { notifyUser } from "@/lib/payouts/notifications";
import { createNotification, sendNotificationEmail } from "@/lib/notifications";
import { releaseCouponUsage } from "@/lib/coupons";

export async function confirmPaystackPayment(reference: string) {
  const payment = await db.payment.findUnique({
    where: { providerReference: reference },
    select: {
      id: true,
      providerReference: true,
      amountMinor: true,
      currency: true,
      status: true,
      order: { select: { id: true, reference: true, userId: true, total: true, currency: true, status: true, items: { select: { id: true, productId: true, sellerId: true, quantity: true, priceAtPurchase: true, productVersion: true, productName: true } } } },
    },
  });
  if (!payment) return { status: "not_found" as const };
  if (payment.status === "SUCCESS" && payment.order.status === "PAID") return { status: "paid" as const, orderId: payment.order.id };

  const providerTransaction = await verifyPaystackTransaction(reference);
  if (providerTransaction.reference !== payment.providerReference) return { status: "invalid" as const, orderId: payment.order.id };
  if (providerTransaction.status === "failed" || providerTransaction.status === "abandoned") {
    const failed = await db.$transaction(async (tx) => {
      const transition = await tx.order.updateMany({ where: { id: payment.order.id, status: { notIn: ["PAID", "FAILED"] } }, data: { status: "FAILED" } });
      if (!transition.count) return false;
      await tx.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
      await releaseCouponUsage(tx, payment.order.id);
      await createNotification(tx, {
        userId: payment.order.userId,
        type: "PAYMENT_FAILED",
        title: "Payment not completed",
        message: "Your payment could not be verified. You can retry checkout from your cart.",
        link: "/cart",
      });
      return true;
    });
    if (failed) await sendNotificationEmail({
      userId: payment.order.userId,
      type: "PAYMENT_FAILED",
      title: "Payment not completed",
      message: "Your payment could not be verified. You can retry checkout from your cart.",
      link: "/cart",
    });
    return { status: "failed" as const, orderId: payment.order.id };
  }
  if (providerTransaction.status !== "success") return { status: "pending" as const, orderId: payment.order.id };
  if (!Number.isSafeInteger(providerTransaction.amount) || BigInt(providerTransaction.amount) !== payment.amountMinor || providerTransaction.currency !== payment.currency || providerTransaction.currency !== payment.order.currency || BigInt(providerTransaction.amount) !== BigInt(payment.order.total) * BigInt(MARKETPLACE_CURRENCY_MINOR_UNITS)) {
    return { status: "invalid" as const, orderId: payment.order.id };
  }

  const result = await db.$transaction(async (tx) => {
    const transition = await tx.order.updateMany({ where: { id: payment.order.id, status: { not: "PAID" } }, data: { status: "PAID" } });
    if (!transition.count) {
      const current = await tx.order.findUnique({ where: { id: payment.order.id }, select: { status: true } });
      return { status: current?.status === "PAID" ? "paid" as const : "pending" as const, notifyEmail: false };
    }

    const paidAt = new Date();
    const settings = await getMarketplaceSettings(tx);
    await tx.payment.update({ where: { id: payment.id }, data: { status: "SUCCESS", paidAt } });
    await createNotification(tx, {
      userId: payment.order.userId,
      type: "ORDER_PAID",
      title: "Payment verified",
      message: `Your order ${payment.order.reference} has been paid successfully.`,
      link: "/purchases",
    });
    await createNotification(tx, {
      userId: payment.order.userId,
      type: "PURCHASE_READY",
      title: "Purchase ready",
      message: "Your purchased products are ready to view and download.",
      link: "/purchases",
    });
    await tx.purchase.createMany({
      data: payment.order.items.map((item) => ({
        userId: payment.order.userId,
        orderId: payment.order.id,
        orderItemId: item.id,
        productId: item.productId,
        sellerId: item.sellerId,
        purchasedPrice: item.priceAtPurchase,
        purchasedVersion: item.productVersion,
        purchasedAt: paidAt,
      })),
      skipDuplicates: true,
    });
    const earningRows = payment.order.items.flatMap((item) => {
      if (!item.sellerId) return [];
      const grossAmount = item.priceAtPurchase * item.quantity;
      const commissionAmount = Math.round(grossAmount * settings.commissionRateBps / 10_000);
      const netAmount = grossAmount - commissionAmount;
      const availableAt = new Date(paidAt.getTime() + settings.earningHoldDays * 24 * 60 * 60 * 1000);
      return [{ item, grossAmount, commissionAmount, netAmount, availableAt }];
    });
    for (const earning of earningRows) {
      await tx.orderItem.update({ where: { id: earning.item.id }, data: { commissionRateBps: settings.commissionRateBps, commissionAmount: earning.commissionAmount, sellerEarnings: earning.netAmount } });
      await tx.sellerTransaction.create({ data: {
        sellerId: earning.item.sellerId!, orderId: payment.order.id, orderItemId: earning.item.id, productId: earning.item.productId,
        type: "SALE", grossAmount: earning.grossAmount, commissionAmount: earning.commissionAmount, netAmount: earning.netAmount,
        currency: payment.order.currency, status: settings.earningHoldDays > 0 ? "PENDING" : "AVAILABLE", availableAt: earning.availableAt,
        sourceKey: `sale:${earning.item.id}`, description: `Sale of ${earning.item.productName}`,
      } });
      await writeFinancialAudit(tx, { action: "SALE_EARNING_CREATED", entityType: "SellerTransaction", entityId: `sale:${earning.item.id}`, amount: earning.netAmount, currency: payment.order.currency, metadata: { orderReference: payment.order.reference, grossAmount: earning.grossAmount, commissionAmount: earning.commissionAmount, commissionRateBps: settings.commissionRateBps } });
    }
    for (const sellerId of new Set(earningRows.map(({ item }) => item.sellerId).filter((id): id is string => Boolean(id)))) {
      const sellerEarnings = earningRows.filter(({ item }) => item.sellerId === sellerId).reduce((sum, earning) => sum + earning.netAmount, 0);
      await notifyUser(tx, { userId: sellerId, type: "SELLER_SALE", title: "New product sale", body: `A verified sale added ${sellerEarnings.toLocaleString("en-NG")} ${payment.order.currency} to your earnings.`, href: "/seller/earnings" });
      if (settings.earningHoldDays === 0) {
        await notifyUser(tx, { userId: sellerId, type: "EARNINGS_AVAILABLE", title: "Earnings available", body: `${sellerEarnings.toLocaleString("en-NG")} ${payment.order.currency} from your new sale is available in your seller balance.`, href: "/seller/earnings" });
      }
    }
    for (const item of payment.order.items) {
      if (item.productId) await tx.product.updateMany({ where: { id: item.productId }, data: { totalSales: { increment: item.quantity } } });
    }
    await tx.cartItem.deleteMany({ where: { productId: { in: payment.order.items.flatMap((item) => item.productId ? [item.productId] : []) }, cart: { userId: payment.order.userId } } });
    return { status: "paid" as const, notifyEmail: true };
  });

  if (result.notifyEmail) await sendNotificationEmail({
    userId: payment.order.userId,
    type: "ORDER_PAID",
    title: "Payment verified",
    message: `Your order ${payment.order.reference} has been paid successfully. Your purchases are ready to view.`,
    link: "/purchases",
  });
  return { status: result.status, orderId: payment.order.id };
}
