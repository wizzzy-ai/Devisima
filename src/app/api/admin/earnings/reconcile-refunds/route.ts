import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { findUnreconciledSuccessfulRefunds, reconcileSuccessfulRefundEarnings } from "@/lib/earnings/refunds";

export const runtime = "nodejs";

const requestSchema = z.object({ limit: z.number().int().min(1).max(100).default(50) });

export async function GET(request: Request) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (admin.role !== "ADMIN") return NextResponse.json({ message: "Administrator access is required." }, { status: 403 });
  const rawLimit = Number(new URL(request.url).searchParams.get("limit") ?? "50");
  const limit = Number.isSafeInteger(rawLimit) ? Math.min(100, Math.max(1, rawLimit)) : 50;
  try {
    return NextResponse.json(await findUnreconciledSuccessfulRefunds(limit), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Seller refund reconciliation preview failed", error);
    return NextResponse.json({ message: "The refund reconciliation preview could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (admin.role !== "ADMIN") return NextResponse.json({ message: "Administrator access is required." }, { status: 403 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Choose a valid refund reconciliation batch size." }, { status: 400 });
  try {
    const { rows } = await findUnreconciledSuccessfulRefunds(parsed.data.limit);
    let scanned = 0;
    let created = 0;
    for (const refund of rows) {
      const result = await reconcileSuccessfulRefundEarnings(refund.id, admin.id);
      if (result.status === "reconciled") {
        scanned += 1;
        created += result.created;
      }
    }
    return NextResponse.json({ scanned, created });
  } catch (error) {
    console.error("Seller refund reconciliation failed", error);
    return NextResponse.json({ message: "Successful refund earnings could not be reconciled." }, { status: 500 });
  }
}
