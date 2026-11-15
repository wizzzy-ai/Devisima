import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmPaystackPayment } from "@/lib/payments/fulfill-order";
import { reconcilePayoutTransfer } from "@/lib/payouts/lifecycle";

const eventSchema = z.object({ event: z.string(), data: z.object({ reference: z.string().min(8).max(100) }) });

function validSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature || !/^[a-f\d]{128}$/i.test(signature)) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest();
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ message: "Webhook is not configured." }, { status: 503 });
  const rawBody = await request.text();
  if (!validSignature(rawBody, request.headers.get("x-paystack-signature"), secret)) return NextResponse.json({ message: "Invalid webhook signature." }, { status: 401 });
  let body: unknown;
  try { body = JSON.parse(rawBody); } catch { return NextResponse.json({ message: "Invalid webhook body." }, { status: 400 }); }
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ received: true });
  try {
    if (parsed.data.event === "charge.success" || parsed.data.event === "charge.failed") {
      await confirmPaystackPayment(parsed.data.data.reference);
    } else if (["transfer.success", "transfer.failed", "transfer.reversed"].includes(parsed.data.event)) {
      const result = await reconcilePayoutTransfer(parsed.data.data.reference);
      if (result.status === "INVALID") return NextResponse.json({ message: "Transfer did not match a stored payout attempt." }, { status: 400 });
    } else {
      return NextResponse.json({ received: true });
    }
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ message: "Payment or transfer event could not be verified yet." }, { status: 503 });
  }
}
