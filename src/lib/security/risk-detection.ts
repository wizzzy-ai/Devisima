import "server-only";
import { db } from "@/lib/db/prisma";

export type RiskFlag = {
  type: string;
  severity: "low" | "medium" | "high";
  description: string;
  metadata?: Record<string, unknown>;
};

export async function detectPaymentRisk(userId: string, email: string, orderReference: string): Promise<RiskFlag[]> {
  const flags: RiskFlag[] = [];

  const [failedPayments, recentOrders, duplicateReferences, suspiciousPatterns] = await Promise.all([
    db.payment.count({
      where: {
        order: { userId },
        status: "FAILED",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    db.order.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    }),
    db.order.count({
      where: {
        userId,
        reference: orderReference,
      },
    }),
    detectSuspiciousPatterns(userId),
  ]);

  if (failedPayments >= 5) {
    flags.push({
      type: "HIGH_FAILED_PAYMENT_RATE",
      severity: "high",
      description: "Multiple failed payment attempts in the last 24 hours",
      metadata: { failedPayments },
    });
  } else if (failedPayments >= 3) {
    flags.push({
      type: "MODERATE_FAILED_PAYMENT_RATE",
      severity: "medium",
      description: "Several failed payment attempts in the last 24 hours",
      metadata: { failedPayments },
    });
  }

  if (recentOrders >= 10) {
    flags.push({
      type: "RAPID_ORDER_PATTERN",
      severity: "high",
      description: "Unusually high order frequency in the last hour",
      metadata: { recentOrders },
    });
  } else if (recentOrders >= 5) {
    flags.push({
      type: "ELEVATED_ORDER_FREQUENCY",
      severity: "medium",
      description: "High order frequency in the last hour",
      metadata: { recentOrders },
    });
  }

  if (duplicateReferences > 0) {
    flags.push({
      type: "DUPLICATE_ORDER_REFERENCE",
      severity: "high",
      description: "Duplicate order reference detected",
      metadata: { duplicateReferences },
    });
  }

  flags.push(...suspiciousPatterns);

  return flags;
}

async function detectSuspiciousPatterns(userId: string): Promise<RiskFlag[]> {
  const flags: RiskFlag[] = [];

  const [refundRate, recentRefunds] = await Promise.all([
    calculateRefundRate(userId),
    db.refund.count({
      where: {
        order: { userId },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  if (refundRate > 0.5) {
    flags.push({
      type: "HIGH_REFUND_RATE",
      severity: "high",
      description: "High refund rate compared to total orders",
      metadata: { refundRate },
    });
  } else if (refundRate > 0.3) {
    flags.push({
      type: "ELEVATED_REFUND_RATE",
      severity: "medium",
      description: "Elevated refund rate compared to total orders",
      metadata: { refundRate },
    });
  }

  if (recentRefunds >= 3) {
    flags.push({
      type: "MULTIPLE_RECENT_REFUNDS",
      severity: "medium",
      description: "Multiple refund requests in the last 30 days",
      metadata: { recentRefunds },
    });
  }

  return flags;
}

async function calculateRefundRate(userId: string): Promise<number> {
  const [totalOrders, refundedOrders] = await Promise.all([
    db.order.count({
      where: {
        userId,
        status: "PAID",
        payments: { some: { status: "SUCCESS" } },
      },
    }),
    db.order.count({
      where: {
        userId,
        status: "PAID",
        payments: { some: { status: "SUCCESS" } },
        refunds: { some: { status: "SUCCESS" } },
      },
    }),
  ]);

  if (totalOrders === 0) return 0;
  return refundedOrders / totalOrders;
}

export async function detectPayoutRisk(sellerId: string): Promise<RiskFlag[]> {
  const flags: RiskFlag[] = [];

  const [accountChanges, payoutFailures, recentPayouts] = await Promise.all([
    db.sellerPayoutAccount.findFirst({
      where: { sellerId },
      select: { updatedAt: true, isVerified: true },
    }),
    db.sellerPayout.count({
      where: {
        sellerId,
        status: "FAILED",
        requestedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    db.sellerPayout.count({
      where: {
        sellerId,
        requestedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  if (accountChanges && accountChanges.updatedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
    flags.push({
      type: "RECENT_PAYOUT_ACCOUNT_CHANGE",
      severity: "medium",
      description: "Payout account details changed recently",
      metadata: { changedAt: accountChanges.updatedAt },
    });
  }

  if (!accountChanges?.isVerified) {
    flags.push({
      type: "UNVERIFIED_PAYOUT_ACCOUNT",
      severity: "high",
      description: "Payout account is not verified",
    });
  }

  if (payoutFailures >= 3) {
    flags.push({
      type: "MULTIPLE_PAYOUT_FAILURES",
      severity: "high",
      description: "Multiple failed payout attempts in the last 30 days",
      metadata: { payoutFailures },
    });
  } else if (payoutFailures >= 1) {
    flags.push({
      type: "PAYOUT_FAILURE_HISTORY",
      severity: "medium",
      description: "Previous payout failures detected",
      metadata: { payoutFailures },
    });
  }

  if (recentPayouts >= 5) {
    flags.push({
      type: "RAPID_PAYOUT_REQUESTS",
      severity: "medium",
      description: "Multiple payout requests in the last 7 days",
      metadata: { recentPayouts },
    });
  }

  return flags;
}

export async function logRiskFlag(userId: string, flag: RiskFlag, context?: string) {
  await db.adminAuditLog.create({
    data: {
      adminId: userId,
      action: "ADMIN_NOTE_ADDED",
      entityType: "RiskFlag",
      entityId: flag.type,
      metadata: JSON.stringify({
        ...flag,
        context,
        timestamp: new Date().toISOString(),
      }),
    },
  });
}
