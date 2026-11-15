import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { getSalesExportRows } from "@/lib/analytics";
import { parseAnalyticsRange } from "@/lib/analytics/date-range";
import { salesRowsToCsv } from "@/lib/analytics/csv";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to export seller analytics." }, { status: 401 });
  if (user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ message: "Active seller access is required." }, { status: 403 });
  const range = parseAnalyticsRange(new URL(request.url).searchParams);
  const csv = salesRowsToCsv(await getSalesExportRows(range, user.id));
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="devisima-seller-sales-${range.start.toISOString().slice(0, 10)}.csv"`, "Cache-Control": "private, no-store" } });
}
