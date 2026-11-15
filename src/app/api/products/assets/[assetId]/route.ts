import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/guards";
import { readPrivateAsset } from "@/lib/products/private-storage";

export const runtime = "nodejs";

type Context = { params: Promise<{ assetId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { assetId } = await params;
  const asset = await db.productAsset.findUnique({
    where: { id: assetId },
    include: { product: { select: { id: true, status: true, adminRestrictedAt: true, sellerId: true, seller: { select: { role: true, status: true, sellerSuspendedAt: true } } } } },
  });
  if (!asset || asset.kind !== "IMAGE") return NextResponse.json({ message: "Image not found." }, { status: 404 });
  const user = await getCurrentUser();
  const publicListing = asset.product.status === "PUBLISHED"
    && asset.product.adminRestrictedAt === null
    && asset.product.seller.status === "ACTIVE"
    && asset.product.seller.role === "SELLER"
    && asset.product.seller.sellerSuspendedAt === null;
  const hasPurchase = !publicListing && user
    ? await db.purchase.findFirst({
        where: {
          productId: asset.product.id,
          userId: user.id,
          order: { status: "PAID", payments: { some: { status: "SUCCESS" } } },
        },
        select: { id: true },
      }).then(Boolean)
    : false;
  const canView = publicListing || hasPurchase || user?.role === "ADMIN" || (user?.role === "SELLER" && user.id === asset.product.sellerId);
  if (!canView) return NextResponse.json({ message: "Image not found." }, { status: 404 });
  try {
    const bytes = await readPrivateAsset(asset.storageKey);
    return new Response(bytes, {
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Length": String(asset.sizeBytes),
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": publicListing ? "public, max-age=300" : "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ message: "Image file is unavailable." }, { status: 404 });
  }
}
