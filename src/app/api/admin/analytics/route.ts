import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { getAdminAnalytics } from "@/lib/analytics";
import { parseAnalyticsRange } from "@/lib/analytics/date-range";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to view marketplace analytics." }, { status: 401 });
  if (user.role !== "ADMIN" || user.status !== "ACTIVE") return NextResponse.json({ message: "Administrator access is required." }, { status: 403 });
  return NextResponse.json(await getAdminAnalytics(parseAnalyticsRange(new URL(request.url).searchParams)), { headers: { "Cache-Control": "private, no-store" } });
}
