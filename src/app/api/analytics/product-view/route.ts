import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";

const viewSchema = z.object({ slug: z.string().min(1).max(180) });
const sessionCookie = "devisima_analytics_session";

export async function POST(request: Request) {
  const parsed = viewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "A valid product is required." }, { status: 400 });
  const product = await db.product.findFirst({
    where: {
      slug: parsed.data.slug,
      status: "PUBLISHED",
      adminRestrictedAt: null,
      seller: { status: "ACTIVE", role: "SELLER", sellerSuspendedAt: null },
    },
    select: { id: true, sellerId: true },
  });
  if (!product) return NextResponse.json({ message: "Product not found." }, { status: 404 });

  const user = await getCurrentUser();
  if (user?.status === "ACTIVE" && user.id === product.sellerId) return NextResponse.json({ tracked: false });

  const cookieStore = await cookies();
  let visitorToken = cookieStore.get(sessionCookie)?.value;
  let setCookie = false;
  if (!visitorToken || !/^[0-9a-f-]{36}$/i.test(visitorToken)) {
    visitorToken = randomUUID();
    setCookie = true;
  }
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("Product view tracking requires AUTH_SECRET.");
    return NextResponse.json({ message: "View tracking is temporarily unavailable." }, { status: 503 });
  }
  const sessionKey = createHash("sha256").update(`${secret}:${visitorToken}`).digest("hex");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await checkRateLimit("productView", ip);
  if (!limit.allowed) return NextResponse.json({ tracked: false }, { status: 429 });

  const now = new Date();
  const viewDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const record = await db.productView.upsert({
    where: { productId_sessionKey_viewDate: { productId: product.id, sessionKey, viewDate } },
    create: { productId: product.id, userId: user?.status === "ACTIVE" ? user.id : null, sessionKey, viewDate },
    update: {},
    select: { id: true },
  });
  const response = NextResponse.json({ tracked: true });
  if (setCookie) response.cookies.set(sessionCookie, visitorToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return record ? response : NextResponse.json({ tracked: false });
}
