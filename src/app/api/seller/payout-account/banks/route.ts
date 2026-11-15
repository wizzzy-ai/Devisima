import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { paystackPayoutProvider } from "@/lib/payouts/paystack-provider";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to manage payout details." }, { status: 401 });
  if (user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ message: "Only active sellers can manage payout details." }, { status: 403 });
  try {
    return NextResponse.json({ banks: await paystackPayoutProvider.listBanks() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ message: "Bank list is temporarily unavailable." }, { status: 503 });
  }
}
