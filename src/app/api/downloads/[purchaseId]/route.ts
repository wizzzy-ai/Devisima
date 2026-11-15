import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { createDownloadToken } from "@/lib/products/download-token";
import { getAppUrl } from "@/lib/app-url";

const cuid = z.string().cuid();
type Context = { params: Promise<{ purchaseId: string }> };

export async function GET(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to download this purchase." }, { status: 401 });
  if (user.status !== "ACTIVE") return NextResponse.json({ message: "This account cannot download purchases." }, { status: 403 });

  const { purchaseId } = await params;
  const fileId = new URL(request.url).searchParams.get("fileId");
  const parsedPurchaseId = cuid.safeParse(purchaseId);
  const parsedFileId = cuid.safeParse(fileId);
  if (!parsedPurchaseId.success || !parsedFileId.success) return NextResponse.json({ message: "This file is unavailable." }, { status: 404 });
  const safePurchaseId = parsedPurchaseId.data;
  const safeFileId = parsedFileId.data;

  try {
    const purchase = await db.purchase.findFirst({
      where: {
        id: safePurchaseId,
        userId: user.id,
        order: { status: "PAID", payments: { some: { status: "SUCCESS" } } },
        product: { assets: { some: { id: safeFileId, kind: "FILE" } } },
      },
      select: { id: true, productId: true, orderId: true },
    });
    if (!purchase || !purchase.productId) return NextResponse.json({ message: "This file is unavailable for your purchase." }, { status: 404 });

    const hasSuccessfulRefund = await db.refund.findFirst({
      where: { orderId: purchase.orderId, status: "SUCCESS" },
      select: { id: true },
    });
    if (hasSuccessfulRefund) {
      return NextResponse.json({ message: "Downloads are not available for refunded purchases." }, { status: 403 });
    }

    const expiresAt = Date.now() + 2 * 60_000;
    const token = createDownloadToken({ purchaseId: safePurchaseId, userId: user.id, fileId: safeFileId, expiresAt, nonce: randomUUID() });
    return NextResponse.redirect(getAppUrl(`/api/downloads/file?token=${encodeURIComponent(token)}`), 302);
  } catch {
    return NextResponse.json({ message: "We could not prepare this download. Please try again." }, { status: 503 });
  }
}
