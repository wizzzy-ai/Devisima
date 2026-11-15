import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { writeFinancialAudit } from "@/lib/payouts/audit";
import { notifyUser } from "@/lib/payouts/notifications";
import { reconcilePayoutTransfer, startPayoutTransfer } from "@/lib/payouts/lifecycle";
import { sendNotificationEmail } from "@/lib/notifications";
import { checkRateLimit } from "@/lib/security/rate-limit";

const decisionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "RETRY", "RECONCILE"]),
  reason: z.string().trim().max(1000).optional(),
}).refine((input) => input.action !== "REJECT" || Boolean(input.reason && input.reason.length >= 5), {
  message: "Provide a clear reason for rejecting this payout.",
  path: ["reason"],
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ message: "Sign in to review payouts." }, { status: 401 });
  if (admin.role !== "ADMIN" || admin.status !== "ACTIVE") return NextResponse.json({ message: "Administrator access required." }, { status: 403 });
  const rateLimit = await checkRateLimit("adminPayoutAction", admin.id);
  if (!rateLimit.allowed) return NextResponse.json({ message: "Too many payout actions. Try again later." }, { status: 429 });
  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid payout decision." }, { status: 400 });
  const { id } = await params;

  if (parsed.data.action === "RECONCILE") {
    const payout = await db.sellerPayout.findUnique({
      where: { id },
      select: { status: true, attempts: { orderBy: { createdAt: "desc" }, take: 1, select: { transferReference: true } } },
    });
    if (!payout) return NextResponse.json({ message: "Payout request not found." }, { status: 404 });
    if (payout.status !== "PROCESSING" || !payout.attempts[0]) return NextResponse.json({ message: "This payout has no transfer awaiting reconciliation." }, { status: 409 });
    try {
      const result = await reconcilePayoutTransfer(payout.attempts[0].transferReference);
      if (result.status === "INVALID") return NextResponse.json({ message: "Paystack verification did not match the stored transfer. The payout remains reserved for investigation." }, { status: 502 });
      return NextResponse.json({ message: result.status === "PROCESSING" ? "Paystack still reports the transfer as processing; funds remain reserved." : `Paystack transfer status verified: ${result.status.toLowerCase()}.` });
    } catch (error) {
      console.error("Payout provider reconciliation failed", error);
      return NextResponse.json({ message: "Paystack could not confirm this transfer. The payout remains reserved; retry verification later." }, { status: 503 });
    }
  }

  if (parsed.data.action === "APPROVE" || parsed.data.action === "RETRY") {
    try {
      const result = await startPayoutTransfer(id, admin.id, parsed.data.action === "RETRY");
      return NextResponse.json({ message: result.status === "PROCESSING" ? "Payout is being processed; provider verification is pending." : "Payout processed." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payout transfer could not be started.";
      const disabled = message.includes("PAYSTACK_TRANSFERS_ENABLED");
      console.error("Admin payout transfer action failed", error);
      return NextResponse.json({ message: disabled ? "Transfers are disabled. Enable PAYSTACK_TRANSFERS_ENABLED after completing provider setup." : message }, { status: disabled ? 503 : 409 });
    }
  }

  const reason = parsed.data.reason!;
  let outcome: Awaited<ReturnType<typeof rejectPayout>>;
  try {
    outcome = await rejectPayout(id, admin.id, reason);
  } catch (error) {
    console.error("Admin payout rejection failed", error);
    return NextResponse.json({ message: "Payout rejection failed. No payout state was changed." }, { status: 500 });
  }
  if (outcome.kind === "NOT_FOUND") return NextResponse.json({ message: "Payout request not found." }, { status: 404 });
  if (outcome.kind === "REVIEWED") return NextResponse.json({ message: "This payout is no longer awaiting review." }, { status: 409 });
  await sendNotificationEmail({
    userId: outcome.sellerId,
    type: "PAYOUT_FAILED",
    title: "Payout request not approved",
    message: outcome.message,
    link: "/seller/payouts",
  });
  return NextResponse.json({ message: "Payout request rejected and its reservation released." });
}

async function rejectPayout(id: string, adminId: string, reason: string) {
  return db.$transaction(async (tx) => {
    const payout = await tx.sellerPayout.findUnique({
      where: { id },
      select: { id: true, sellerId: true, amount: true, currency: true, reference: true, status: true },
    });
    if (!payout) return { kind: "NOT_FOUND" as const };
    const changed = await tx.sellerPayout.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "CANCELLED", processedAt: new Date(), failureReason: reason },
    });
    if (!changed.count) return { kind: "REVIEWED" as const };
    await tx.sellerTransaction.updateMany({
      where: { payoutId: id, type: "PAYOUT", status: "PENDING" },
      data: { status: "FAILED" },
    });
    await writeFinancialAudit(tx, {
      actorId: adminId,
      action: "PAYOUT_REJECTED",
      entityType: "SellerPayout",
      entityId: id,
      amount: payout.amount,
      currency: payout.currency,
      metadata: { reference: payout.reference, reason },
    });
    await notifyUser(tx, {
      userId: payout.sellerId,
      type: "PAYOUT_FAILED",
      title: "Payout request not approved",
      body: `Your payout request was not approved. Reason: ${reason}`,
      href: "/seller/payouts",
    });
    return { kind: "REJECTED" as const, sellerId: payout.sellerId, message: `Your payout request was not approved. Reason: ${reason}` };
  });
}
