import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { getSellerApiUser } from "@/lib/products/access";
import { readPrivateAsset, removePrivateAsset } from "@/lib/products/private-storage";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string; assetId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const access = await getSellerApiUser();
  if (!access.user) return access.response;
  const { id, assetId } = await params;
  const body = await request.json().catch(() => null);
  if (body?.isCover !== true) return NextResponse.json({ message: "Choose this image as the cover to continue." }, { status: 400 });
  const asset = await db.productAsset.findFirst({ where: { id: assetId, productId: id, kind: "IMAGE", product: { sellerId: access.user.id } }, select: { id: true } });
  if (!asset) return NextResponse.json({ message: "Product image not found." }, { status: 404 });
  const product = await db.product.findUnique({ where: { id }, select: { status: true } });
  if (!product || ["PENDING_REVIEW", "ARCHIVED"].includes(product.status)) return NextResponse.json({ message: "This product cannot be changed in its current status." }, { status: 409 });
  await db.$transaction(async (tx) => {
    await tx.productAsset.updateMany({ where: { productId: id, kind: "IMAGE" }, data: { isCover: false } });
    await tx.productAsset.update({ where: { id: assetId }, data: { isCover: true } });
    const images = await tx.productAsset.findMany({ where: { productId: id, kind: "IMAGE" }, orderBy: [{ isCover: "desc" }, { createdAt: "asc" }], select: { id: true } });
    await tx.product.update({ where: { id }, data: { images: images.map((image) => `/api/products/assets/${image.id}`), ...(product.status === "PUBLISHED" ? { status: "PENDING_REVIEW", publishedAt: null } : {}) } });
  });
  return NextResponse.json({ message: "Cover image updated." });
}

export async function GET(_request: Request, { params }: Context) {
  const access = await getSellerApiUser();
  if (!access.user) return access.response;
  const { id, assetId } = await params;
  const asset = await db.productAsset.findFirst({ where: { id: assetId, productId: id, product: { sellerId: access.user.id } } });
  if (!asset || asset.kind !== "FILE") return NextResponse.json({ message: "Private product file not found." }, { status: 404 });
  try {
    const bytes = await readPrivateAsset(asset.storageKey);
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": String(asset.sizeBytes),
        "Content-Disposition": `attachment; filename="${asset.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ message: "Private product file is unavailable." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const access = await getSellerApiUser();
  if (!access.user) return access.response;
  const { id, assetId } = await params;
  const asset = await db.productAsset.findFirst({ where: { id: assetId, productId: id, product: { sellerId: access.user.id } } });
  if (!asset) return NextResponse.json({ message: "Product file not found." }, { status: 404 });
  if (["PENDING_REVIEW", "ARCHIVED"].includes((await db.product.findUnique({ where: { id }, select: { status: true } }))?.status ?? "")) {
    return NextResponse.json({ message: "This product cannot be changed in its current status." }, { status: 409 });
  }
  await db.$transaction(async (tx) => {
    if (asset.kind === "IMAGE") {
      await tx.productAsset.delete({ where: { id: assetId } });
      const images = await tx.productAsset.findMany({ where: { productId: id, kind: "IMAGE" }, orderBy: [{ isCover: "desc" }, { createdAt: "asc" }], select: { id: true } });
      if (images.length && !(await tx.productAsset.findFirst({ where: { productId: id, kind: "IMAGE", isCover: true }, select: { id: true } }))) {
        await tx.productAsset.update({ where: { id: images[0].id }, data: { isCover: true } });
      }
      await tx.product.update({ where: { id }, data: { images: images.map((image) => `/api/products/assets/${image.id}`) } });
    } else {
      await tx.productAsset.delete({ where: { id: assetId } });
    }
    const product = await tx.product.findUnique({ where: { id }, select: { status: true } });
    if (product?.status === "PUBLISHED") await tx.product.update({ where: { id }, data: { status: "PENDING_REVIEW", publishedAt: null } });
  });
  await removePrivateAsset(asset.storageKey).catch((error) => console.error("Failed to remove private product asset", error));
  return NextResponse.json({ message: "File removed." });
}
