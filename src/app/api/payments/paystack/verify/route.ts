import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { confirmPaystackPayment } from "@/lib/payments/fulfill-order";
import { paystackReferenceSchema } from "@/lib/validation/checkout";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to verify this payment." }, { status: 401 });
  if (user.status !== "ACTIVE") return NextResponse.json({ message: "This account cannot access this order." }, { status: 403 });
  const body = await request.json().catch(() => null) as { reference?: unknown } | null;
  const parsed = paystackReferenceSchema.safeParse(body?.reference);
  if (!parsed.success) return NextResponse.json({ message: "This payment reference is not valid." }, { status: 400 });

  const payment = await db.payment.findUnique({ where: { providerReference: parsed.data }, select: { order: { select: { id: true, userId: true } } } });
  if (!payment || payment.order.userId !== user.id) return NextResponse.json({ message: "This payment could not be found." }, { status: 404 });

  try {
    const result = await confirmPaystackPayment(parsed.data);
    if (result.status === "paid") return NextResponse.json({ status: "paid", orderId: result.orderId });
    if (result.status === "pending") return NextResponse.json({ status: "pending", message: "Paystack is still confirming this payment." }, { status: 202 });
    if (result.status === "failed") return NextResponse.json({ status: "failed", message: "Paystack did not complete this payment." }, { status: 402 });
    return NextResponse.json({ status: "invalid", message: "We could not verify this payment. Contact support if your account was charged." }, { status: 409 });
  } catch {
    return NextResponse.json({ status: "pending", message: "Payment confirmation is temporarily unavailable. Try again shortly." }, { status: 503 });
  }
}
