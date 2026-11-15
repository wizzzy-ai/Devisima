import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { verifyDownloadToken } from "@/lib/products/download-token";
import { readPrivateAsset } from "@/lib/products/private-storage";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to download this purchase." }, { status: 401 });
  if (user.status !== "ACTIVE") return NextResponse.json({ message: "This account cannot download purchases." }, { status: 403 });

  const token = new URL(request.url).searchParams.get("token") ?? "";
  let payload: ReturnType<typeof verifyDownloadToken>;
  try { payload = verifyDownloadToken(token); } catch { payload = null; }
  if (!payload || payload.userId !== user.id) return NextResponse.json({ message: "This download link is invalid or expired." }, { status: 403 });

  try {
    const limit = await checkRateLimit("downloadUser", user.id);
    if (!limit.allowed) return NextResponse.json({ message: "You have requested downloads too quickly. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

    const purchase = await db.purchase.findFirst({
      where: {
        id: payload.purchaseId,
        userId: user.id,
        order: { status: "PAID", payments: { some: { status: "SUCCESS" } } },
        product: { assets: { some: { id: payload.fileId, kind: "FILE" } } },
      },
      select: {
        id: true,
        productId: true,
        orderId: true,
        product: { select: { assets: { where: { id: payload.fileId, kind: "FILE" }, take: 1, select: { id: true, storageKey: true, fileName: true, mimeType: true, sizeBytes: true } } } },
      },
    });
    const file = purchase?.product?.assets[0];
    if (!purchase || !purchase.productId || !file) return NextResponse.json({ message: "This file is no longer available for your purchase." }, { status: 404 });

    const hasSuccessfulRefund = await db.refund.findFirst({
      where: { orderId: purchase.orderId, status: "SUCCESS" },
      select: { id: true },
    });
    if (hasSuccessfulRefund) {
      return NextResponse.json({ message: "Downloads are not available for refunded purchases." }, { status: 403 });
    }

    const bytes = await readPrivateAsset(file.storageKey);
    await db.download.create({ data: { purchaseId: purchase.id, userId: user.id, productId: purchase.productId, fileId: file.id } });
    const asciiName = file.fileName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
    return new Response(bytes, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(bytes.byteLength || file.sizeBytes),
        "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store, max-age=0",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch {
    return NextResponse.json({ message: "The file is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
