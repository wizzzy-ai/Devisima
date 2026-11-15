import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/guards";
import { createNotification } from "@/lib/notifications";

const refundRequestSchema = z.object({
  reason: z.string().min(10, "Please provide a detailed reason (at least 10 characters)"),
  explanation: z.string().optional(),
  evidence: z.record(z.any()).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ purchaseId: string }> },
) {
  const user = await requireAuth();
  const { purchaseId } = await params;
  const payload = refundRequestSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ message: payload.error.errors[0].message }, { status: 400 });
  }

  if (!purchaseId || !/^c[a-z0-9]{20,30}$/i.test(purchaseId)) {
    return NextResponse.json({ message: "The purchase ID is invalid." }, { status: 400 });
  }

  const purchase = await db.purchase.findFirst({
    where: {
      id: purchaseId,
      userId: user.id,
      order: { status: "PAID", payments: { some: { status: "SUCCESS" } } },
    },
    select: {
      id: true,
      purchasedPrice: true,
      orderId: true,
      orderItem: { select: { quantity: true } },
      order: {
        select: {
          id: true,
          reference: true,
          payments: { where: { status: "SUCCESS" }, orderBy: { paidAt: "desc" }, take: 1, select: { providerReference: true } },
        },
      },
    },
  });

  if (!purchase) {
    return NextResponse.json({ message: "This purchase could not be found or is not eligible for a refund request." }, { status: 404 });
  }

  const existingRefund = await db.refund.findFirst({
    where: { orderId: purchase.orderId, status: { in: ["PENDING", "PROCESSING", "SUCCESS"] } },
    select: { id: true, status: true },
  });

  if (existingRefund) {
    return NextResponse.json({ message: `A refund request for ${purchase.order.reference} is already ${existingRefund.status.toLowerCase()}.` }, { status: 409 });
  }

  const paymentReference = purchase.order.payments[0]?.providerReference;
  if (!paymentReference) {
    return NextResponse.json({ message: "This order does not have a valid payment record for a refund request." }, { status: 409 });
  }

  const amount = purchase.purchasedPrice * purchase.orderItem.quantity;
  const refund = await db.$transaction(async (tx) => {
    const created = await tx.refund.create({
      data: {
        orderId: purchase.orderId,
        paymentReference,
        providerReference: `RF-${randomUUID()}`,
        amount,
        currency: "NGN",
        reason: payload.data.reason,
        buyerExplanation: payload.data.explanation,
        buyerEvidence: payload.data.evidence,
        status: "PENDING",
      },
      select: { id: true, status: true, providerReference: true },
    });

    await tx.refundHistory.create({
      data: {
        refundId: created.id,
        actorId: user.id,
        action: "SUBMITTED",
        notes: payload.data.reason,
        evidence: payload.data.evidence,
        newStatus: "PENDING",
      },
    });

    await createNotification(tx, {
      userId: user.id,
      type: "REFUND_REQUESTED",
      title: "Refund requested",
      message: `We received your refund request for order ${purchase.order.reference}. We will review it as soon as possible.`,
      link: `/purchases/${purchaseId}`,
    });

    return created;
  });

  return NextResponse.json({ message: `Refund request submitted for ${purchase.order.reference}.`, refund }, { status: 201 });
}
