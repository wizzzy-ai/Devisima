import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/prisma";
import { getSellerBalance } from "@/lib/earnings/balance";
import { paystackPayoutProvider } from "@/lib/payouts/paystack-provider";
import { writeFinancialAudit } from "@/lib/payouts/audit";
import { notifyAdmins, notifyUser } from "@/lib/payouts/notifications";
import type { TransferResult } from "@/lib/payouts/provider";
import { sendNotificationEmail } from "@/lib/notifications";
import { detectPayoutRisk, logRiskFlag } from "@/lib/security/risk-detection";

function transferStatus(status: string) {
  const value = status.toLowerCase();
  if (["success", "successful", "processed"].includes(value)) return "PAID" as const;
  if (["failed", "reversed", "otp_failed"].includes(value)) return value === "reversed" ? "REVERSED" as const : "FAILED" as const;
  return null;
}

function assertPayoutTransfersEnabled() {
  if (process.env.PAYSTACK_TRANSFERS_ENABLED !== "true") {
    throw new Error("Payout transfers are disabled until PAYSTACK_TRANSFERS_ENABLED is enabled.");
  }
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!key) throw new Error("Payout transfers require a configured Paystack secret key.");
  if (process.env.NODE_ENV !== "production" && !key.startsWith("sk_test_")) {
    throw new Error("Payout transfers outside production require a Paystack test key.");
  }
}

export async function startPayoutTransfer(payoutId: string, actorId: string, retry: boolean) {
  assertPayoutTransfersEnabled();
  const prepared = await db.$transaction(async (tx) => {
    const payout = await tx.sellerPayout.findUnique({ where: { id: payoutId }, select: { id: true, sellerId: true, amount: true, currency: true, status: true, recipientCode: true, reference: true, seller: { select: { role: true, status: true } }, payoutAccount: { select: { isVerified: true, recipientCode: true } } } });
    if (!payout) return { error: "Payout request not found." } as const;
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${payout.sellerId} FOR UPDATE`;
    const current = await tx.sellerPayout.findUnique({ where: { id: payoutId }, select: { status: true } });
    const allowedStatus = retry ? "FAILED" : "PENDING";
    if (current?.status !== allowedStatus) return { error: "This payout has already been reviewed or processed." } as const;
    if (payout.currency !== "NGN") return { error: "Paystack payouts are currently available in NGN only." } as const;
    if (payout.seller.role !== "SELLER" || payout.seller.status !== "ACTIVE") return { error: "This seller account is no longer active." } as const;
    if (!payout.payoutAccount.isVerified || payout.payoutAccount.recipientCode !== payout.recipientCode) return { error: "The verified payout recipient has changed. Ask the seller to update payout details." } as const;
    const balance = await getSellerBalance(payout.sellerId, tx, payout.id);
    if (balance.availableBalance < payout.amount) return { error: "The seller no longer has enough available balance for this payout." } as const;

    const riskFlags = await detectPayoutRisk(payout.sellerId);
    const highSeverityFlags = riskFlags.filter((flag) => flag.severity === "high");
    if (highSeverityFlags.length > 0) {
      await Promise.all(highSeverityFlags.map((flag) => logRiskFlag(actorId, flag, `payout:${payout.reference}`)));
      return { error: "This seller account has been flagged for review before payout." } as const;
    }

    const transferReference = `dv-${randomUUID()}`;
    const payoutStatus = await tx.sellerPayout.updateMany({ where: { id: payout.id, status: allowedStatus }, data: { status: "PROCESSING", failureReason: null } });
    if (!payoutStatus.count) return { error: "This payout has already been reviewed or processed." } as const;
    const attempt = await tx.payoutAttempt.create({ data: { payoutId: payout.id, transferReference, amount: payout.amount, currency: payout.currency } });
    await tx.sellerTransaction.upsert({
      where: { sourceKey: retry ? `payout:${payout.id}:retry:${attempt.id}` : `payout:${payout.sellerId}:${payout.reference}` },
      create: { sellerId: payout.sellerId, payoutId: payout.id, type: "PAYOUT", grossAmount: 0, commissionAmount: 0, netAmount: -payout.amount, currency: payout.currency, status: "PENDING", sourceKey: retry ? `payout:${payout.id}:retry:${attempt.id}` : `payout:${payout.sellerId}:${payout.reference}`, description: `Payout ${payout.reference}` },
      update: { status: "PENDING" },
    });
    await writeFinancialAudit(tx, { actorId, action: retry ? "PAYOUT_RETRIED" : "PAYOUT_APPROVED", entityType: "SellerPayout", entityId: payout.id, amount: payout.amount, currency: payout.currency, metadata: { reference: payout.reference, transferReference } });
    await writeFinancialAudit(tx, { actorId, action: "PAYOUT_PROCESSING", entityType: "PayoutAttempt", entityId: attempt.id, amount: payout.amount, currency: payout.currency, metadata: { transferReference } });
    await notifyUser(tx, { userId: payout.sellerId, type: "PAYOUT_APPROVED", title: "Payout approved", body: "Your payout request has been approved.", href: "/seller/payouts" });
    await notifyUser(tx, { userId: payout.sellerId, type: "PAYOUT_PROCESSING", title: "Payout processing", body: `Your ${payout.amount.toLocaleString("en-NG")} ${payout.currency} payout is being processed.`, href: "/seller/payouts" });
    return { payout, attempt } as const;
  }, { isolationLevel: "Serializable" });

  if ("error" in prepared) throw new Error(prepared.error);
  await sendNotificationEmail({
    userId: prepared.payout.sellerId,
    type: "PAYOUT_PROCESSING",
    title: "Payout processing",
    message: `Your ${prepared.payout.amount.toLocaleString("en-NG")} ${prepared.payout.currency} payout is being processed.`,
    link: "/seller/payouts",
  });
  const amountMinor = prepared.payout.amount * 100;
  if (!Number.isSafeInteger(amountMinor)) throw new Error("Payout amount is outside the provider range.");
  try {
    const started = await paystackPayoutProvider.initiateTransfer({ amountMinor, recipientCode: prepared.payout.recipientCode, reference: prepared.attempt.transferReference, reason: `Devisima seller payout ${prepared.payout.reference}` });
    if (started.reference !== prepared.attempt.transferReference || started.amount !== amountMinor || started.currency !== prepared.payout.currency) {
      await writeFinancialAudit(db, { actorId: null, action: "PAYOUT_FAILED", entityType: "PayoutAttempt", entityId: prepared.attempt.id, amount: prepared.payout.amount, currency: prepared.payout.currency, metadata: { reason: "Provider response reconciliation required" } });
      await notifyAdmins(db, { type: "PAYOUT_FAILED", title: "Payout requires reconciliation", body: "A payout received an unexpected provider response and needs review.", href: "/admin/payouts" });
      return { status: "PROCESSING" as const, reference: prepared.payout.reference };
    }
    await db.payoutAttempt.update({ where: { id: prepared.attempt.id }, data: { transferCode: started.transferCode, providerStatus: started.status } });
    const final = await paystackPayoutProvider.verifyTransfer(started.reference);
    await applyVerifiedTransfer(final);
  } catch (error) {
    console.error("Payout transfer requires reconciliation", error);
    await notifyAdmins(db, { type: "PAYOUT_FAILED", title: "Payout transfer needs reconciliation", body: "A payout remains reserved while its provider status is confirmed.", href: "/admin/payouts" });
  }
  return { status: "PROCESSING" as const, reference: prepared.payout.reference };
}

export async function applyVerifiedTransfer(transfer: TransferResult) {
  const outcome = transferStatus(transfer.status);
  if (!outcome) return { status: "PROCESSING" as const };
  const attempt = await db.payoutAttempt.findUnique({ where: { transferReference: transfer.reference }, select: { id: true, payoutId: true, amount: true, currency: true, status: true, payout: { select: { id: true, sellerId: true, reference: true, status: true } } } });
  if (!attempt || transfer.amount !== attempt.amount * 100 || transfer.currency !== attempt.currency) return { status: "INVALID" as const };
  if (attempt.status === "PAID" && outcome !== "REVERSED") return { status: "PAID" as const };
  if (attempt.status === "FAILED" || attempt.status === "REVERSED") return { status: attempt.status };

  const changed = await db.$transaction(async (tx) => {
    const latest = await tx.payoutAttempt.findUnique({ where: { id: attempt.id }, select: { status: true } });
    const allowedAttemptStatuses = outcome === "REVERSED" ? ["PAID", "PROCESSING"] : ["PROCESSING"];
    if (!latest || !allowedAttemptStatuses.includes(latest.status as string)) return false;
    const nextPayoutStatus = outcome === "PAID" ? "PAID" : "FAILED";
    const payoutUpdate = await tx.sellerPayout.updateMany({ where: { id: attempt.payoutId, status: outcome === "REVERSED" ? "PAID" : "PROCESSING" }, data: { status: nextPayoutStatus, processedAt: new Date(), ...(outcome === "PAID" ? { failureReason: null } : { failureReason: outcome === "REVERSED" ? "Paystack reversed the transfer." : "Paystack reported the transfer failed." }) } });
    if (!payoutUpdate.count) return false;
    const update = await tx.payoutAttempt.updateMany({ where: { id: attempt.id, status: outcome === "REVERSED" ? "PAID" : "PROCESSING" }, data: { status: outcome, providerStatus: transfer.status } });
    if (!update.count) throw new Error("PAYOUT_ATTEMPT_STATUS_CONFLICT");
    await tx.sellerTransaction.updateMany({ where: { payoutId: attempt.payoutId, type: "PAYOUT", status: { in: ["PENDING", "AVAILABLE", "PAID"] } }, data: { status: outcome === "PAID" ? "PAID" : "FAILED" } });
    const action = outcome === "PAID" ? "PAYOUT_COMPLETED" : "PAYOUT_FAILED";
    await writeFinancialAudit(tx, { actorId: null, action, entityType: "SellerPayout", entityId: attempt.payoutId, amount: attempt.amount, currency: attempt.currency, metadata: { transferReference: transfer.reference, providerStatus: transfer.status } });
    await notifyUser(tx, { userId: attempt.payout.sellerId, type: outcome === "PAID" ? "PAYOUT_COMPLETED" : "PAYOUT_FAILED", title: outcome === "PAID" ? "Payout completed" : "Payout failed", body: outcome === "PAID" ? `Your ${attempt.amount.toLocaleString("en-NG")} ${attempt.currency} payout was sent.` : "Your payout could not be completed. The reserved balance is available again.", href: "/seller/payouts" });
    if (outcome !== "PAID") await notifyAdmins(tx, { type: "PAYOUT_FAILED", title: "Payout transfer failed", body: "A seller payout needs review.", href: "/admin/payouts" });
    return true;
  });
  if (changed) await sendNotificationEmail({
    userId: attempt.payout.sellerId,
    type: outcome === "PAID" ? "PAYOUT_COMPLETED" : "PAYOUT_FAILED",
    title: outcome === "PAID" ? "Payout completed" : "Payout failed",
    message: outcome === "PAID"
      ? `Your ${attempt.amount.toLocaleString("en-NG")} ${attempt.currency} payout was sent.`
      : "Your payout could not be completed. The reserved balance is available again.",
    link: "/seller/payouts",
  });
  return { status: outcome };
}

export async function reconcilePayoutTransfer(reference: string) {
  const transfer = await paystackPayoutProvider.verifyTransfer(reference);
  return applyVerifiedTransfer(transfer);
}
