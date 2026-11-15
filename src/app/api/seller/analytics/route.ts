import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { getSellerAnalytics } from "@/lib/analytics";
import { parseAnalyticsRange } from "@/lib/analytics/date-range";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to view seller analytics." }, { status: 401 });
  if (user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ message: "Active seller access is required." }, { status: 403 });
  return NextResponse.json(await getSellerAnalytics(user.id, parseAnalyticsRange(new URL(request.url).searchParams)), { headers: { "Cache-Control": "private, no-store" } });
}
