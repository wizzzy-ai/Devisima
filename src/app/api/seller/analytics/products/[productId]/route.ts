import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { getProductAnalytics } from "@/lib/analytics";
import { parseAnalyticsRange } from "@/lib/analytics/date-range";
import { db } from "@/lib/db/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to view product analytics." }, { status: 401 });
  if (user.status !== "ACTIVE" || !["SELLER", "ADMIN"].includes(user.role)) return NextResponse.json({ message: "Seller or administrator access is required." }, { status: 403 });
  const { productId } = await params;
  const ownerId = user.role === "ADMIN"
    ? (await db.product.findUnique({ where: { id: productId }, select: { sellerId: true } }))?.sellerId
    : user.id;
  if (!ownerId) return NextResponse.json({ message: "Product not found." }, { status: 404 });
  const analytics = await getProductAnalytics(ownerId, productId, parseAnalyticsRange(new URL(request.url).searchParams));
  if (!analytics) return NextResponse.json({ message: "Product not found." }, { status: 404 });
  return NextResponse.json(analytics, { headers: { "Cache-Control": "private, no-store" } });
}
