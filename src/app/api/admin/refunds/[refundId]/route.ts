import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { createNotification, sendNotificationEmail } from "@/lib/notifications";
import { writeFinancialAudit } from "@/lib/payouts/audit";

const refundDecisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "MORE_INFO_REQUIRED"]),
  notes: z.string().min(5, "Please provide a detailed explanation for your decision"),
  evidence: z.record(z.any()).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ refundId: string }> },
) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (admin.role !== "ADMIN") return NextResponse.json({ message: "Administrator access is required." }, { status: 403 });

  const { refundId } = await params;
  const refund = await db.refund.findUnique({
    where: { id: refundId },
    select: {
      id: true,
      orderId: true,
      paymentReference: true,
      providerReference: true,
      amount: true,
      currency: true,
      status: true,
      reason: true,
      buyerExplanation: true,
      buyerEvidence: true,
      adminDecision: true,
      adminEvidence: true,
      reviewedById: true,
      reviewedAt: true,
      providerStatus: true,
      processedAt: true,
      failureReason: true,
      createdAt: true,
      updatedAt: true,
      order: {
        select: {
          id: true,
          reference: true,
          total: true,
          status: true,
          userId: true,
          items: {
            select: {
              id: true,
              productId: true,
              productName: true,
              productSlug: true,
              sellerId: true,
              sellerName: true,
              priceAtPurchase: true,
              quantity: true,
            },
          },
        },
      },
      payment: {
        select: {
          id: true,
          status: true,
          amountMinor: true,
          paidAt: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      history: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          action: true,
          notes: true,
          evidence: true,
          previousStatus: true,
          newStatus: true,
          createdAt: true,
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!refund) {
    return NextResponse.json({ message: "Refund request not found." }, { status: 404 });
  }

  return NextResponse.json(refund);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ refundId: string }> },
) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (admin.role !== "ADMIN") return NextResponse.json({ message: "Administrator access is required." }, { status: 403 });

  const { refundId } = await params;
  const payload = refundDecisionSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ message: payload.error.errors[0].message }, { status: 400 });
  }

  const refund = await db.refund.findUnique({
    where: { id: refundId },
    select: {
      id: true,
      orderId: true,
      status: true,
      amount: true,
      currency: true,
      order: {
        select: {
          id: true,
          reference: true,
          userId: true,
          status: true,
          payments: { where: { status: "SUCCESS" }, select: { id: true, providerReference: true } },
        },
      },
    },
  });

  if (!refund) {
    return NextResponse.json({ message: "Refund request not found." }, { status: 404 });
  }

  if (refund.status !== "PENDING") {
    return NextResponse.json({ message: "This refund request has already been reviewed." }, { status: 409 });
  }

  if (refund.order.status !== "PAID") {
    return NextResponse.json({ message: "The associated order is not in a valid state for refund review." }, { status: 409 });
  }

  const result = await db.$transaction(async (tx) => {
    const previousStatus = refund.status;
    const newStatus = payload.data.decision === "MORE_INFO_REQUIRED" ? "PENDING" : payload.data.decision;

    const updated = await tx.refund.update({
      where: { id: refundId },
      data: {
        status: newStatus,
        adminDecision: payload.data.decision,
        adminEvidence: payload.data.evidence,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
      select: { id: true, status: true, providerReference: true },
    });

    await tx.refundHistory.create({
      data: {
        refundId: refund.id,
        actorId: admin.id,
        action: payload.data.decision === "MORE_INFO_REQUIRED" ? "MORE_INFO_REQUESTED" : payload.data.decision,
        notes: payload.data.notes,
        evidence: payload.data.evidence,
        previousStatus,
        newStatus,
      },
    });

    await writeFinancialAudit(tx, {
      actorId: admin.id,
      action: payload.data.decision === "APPROVED" ? "REFUND_APPROVED" : payload.data.decision === "REJECTED" ? "REFUND_REJECTED" : "REFUND_MORE_INFO",
      entityType: "Refund",
      entityId: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      metadata: {
        orderReference: refund.order.reference,
        decision: payload.data.decision,
        notes: payload.data.notes,
      },
    });

    if (payload.data.decision === "APPROVED") {
      await tx.refund.update({
        where: { id: refundId },
        data: { status: "PROCESSING" },
      });

      await tx.refundHistory.create({
        data: {
          refundId: refund.id,
          actorId: admin.id,
          action: "PROCESSING",
          notes: "Refund approved and sent to payment provider for processing",
          previousStatus: newStatus,
          newStatus: "PROCESSING",
        },
      });

      await createNotification(tx, {
        userId: refund.order.userId,
        type: "REFUND_APPROVED",
        title: "Refund approved",
        message: `Your refund request for order ${refund.order.reference} has been approved and is being processed.`,
        link: `/purchases`,
      });

      await sendNotificationEmail({
        userId: refund.order.userId,
        type: "REFUND_APPROVED",
        title: "Refund approved",
        message: `Your refund request for order ${refund.order.reference} has been approved and is being processed.`,
        link: "/purchases",
      });
    } else if (payload.data.decision === "REJECTED") {
      await createNotification(tx, {
        userId: refund.order.userId,
        type: "REFUND_REJECTED",
        title: "Refund request reviewed",
        message: `Your refund request for order ${refund.order.reference} has been reviewed. Please check your refund details for more information.`,
        link: `/purchases`,
      });

      await sendNotificationEmail({
        userId: refund.order.userId,
        type: "REFUND_REJECTED",
        title: "Refund request reviewed",
        message: `Your refund request for order ${refund.order.reference} has been reviewed. Please check your refund details for more information.`,
        link: "/purchases",
      });
    } else {
      await createNotification(tx, {
        userId: refund.order.userId,
        type: "REFUND_REQUESTED",
        title: "More information needed for refund",
        message: `We need more information about your refund request for order ${refund.order.reference}. Please check your refund details.`,
        link: `/purchases`,
      });

      await sendNotificationEmail({
        userId: refund.order.userId,
        type: "REFUND_REQUESTED",
        title: "More information needed for refund",
        message: `We need more information about your refund request for order ${refund.order.reference}. Please check your refund details.`,
        link: "/purchases",
      });
    }

    return updated;
  });

  return NextResponse.json({
    message: `Refund request ${payload.data.decision.toLowerCase()}.`,
    refund: result,
  });
}
