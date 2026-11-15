import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { getSellerApiUser } from "@/lib/products/access";
import { finalizePrivateAssetUpload, isDirectPrivateUploadEnabled, PrivateAssetInputError, removePrivateAsset, savePrivateAsset } from "@/lib/products/private-storage";
import { checkRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };
const finalizeSchema = z.object({
  uploadToken: z.string().min(1).max(4096),
  kind: z.enum(["IMAGE", "FILE"]),
  isCover: z.boolean().optional(),
});
class AssetLimitError extends Error {}
class ProductStatusChangedError extends Error {}

export async function POST(request: Request, { params }: Context) {
  const access = await getSellerApiUser();
  if (!access.user) return access.response;
  const { id } = await params;
  const product = await db.product.findFirst({ where: { id, sellerId: access.user.id }, include: { _count: { select: { assets: true } } } });
  if (!product) return NextResponse.json({ message: "Product not found." }, { status: 404 });
  if (["PENDING_REVIEW", "ARCHIVED"].includes(product.status)) return NextResponse.json({ message: "This product cannot accept uploads in its current status." }, { status: 409 });
  const directFinalize = request.headers.get("content-type")?.includes("application/json") === true;
  if (!directFinalize) {
    try {
      if (isDirectPrivateUploadEnabled()) {
        return NextResponse.json({ message: "Upload directly through the authorized storage URL." }, { status: 413 });
      }
    } catch (error) {
      console.error("Private product storage is unavailable", error);
      return NextResponse.json({ message: "Private upload storage is temporarily unavailable." }, { status: 503 });
    }
  }
  const parsed = directFinalize ? finalizeSchema.safeParse(await request.json().catch(() => null)) : null;
  if (directFinalize && !parsed?.success) return NextResponse.json({ message: "The upload authorization is invalid." }, { status: 400 });
  const form = directFinalize ? null : await request.formData().catch(() => null);
  const file = form?.get("file");
  const kind = directFinalize ? (parsed?.success ? parsed.data.kind : null) : form?.get("kind");
  if ((kind !== "IMAGE" && kind !== "FILE") || (!directFinalize && !(file instanceof File))) {
    return NextResponse.json({ message: "Choose a valid image or ZIP file." }, { status: 400 });
  }
  const count = await db.productAsset.count({ where: { productId: id, kind } });
  if (kind === "IMAGE" && count >= 8) return NextResponse.json({ message: "A product can have up to 8 images." }, { status: 400 });
  if (kind === "FILE" && count >= 5) return NextResponse.json({ message: "A product can have up to 5 private ZIP files." }, { status: 400 });

  const limit = await checkRateLimit("assetUpload", access.user.id);
  if (!limit.allowed) return NextResponse.json({ message: "Too many uploads. Please try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

  let stored: Awaited<ReturnType<typeof savePrivateAsset>>;
  try {
    if (directFinalize && parsed?.success) {
      stored = await finalizePrivateAssetUpload(parsed.data.uploadToken, { userId: access.user.id, resourceId: id, kind });
    } else if (file instanceof File) {
      stored = await savePrivateAsset(file, kind);
    } else {
      return NextResponse.json({ message: "Choose a valid image or ZIP file." }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof PrivateAssetInputError || (!directFinalize && error instanceof Error)) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Private product upload finalization failed", error);
    return NextResponse.json({ message: "The upload could not be verified. Please try again." }, { status: 503 });
  }
  try {
    const asset = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Product" WHERE "id" = ${id} FOR UPDATE`;
      const currentProduct = await tx.product.findUnique({ where: { id }, select: { status: true } });
      if (!currentProduct || ["PENDING_REVIEW", "ARCHIVED"].includes(currentProduct.status)) {
        throw new ProductStatusChangedError();
      }
      const currentAssetCount = await tx.productAsset.count({ where: { productId: id, kind } });
      if (currentAssetCount >= (kind === "IMAGE" ? 8 : 5)) throw new AssetLimitError();
      if (kind === "IMAGE") {
        const alreadyHasCover = await tx.productAsset.count({ where: { productId: id, kind: "IMAGE", isCover: true } });
        const isCover = (directFinalize && parsed?.success ? parsed.data.isCover : form?.get("isCover") === "true") || alreadyHasCover === 0;
        if (isCover) await tx.productAsset.updateMany({ where: { productId: id, kind: "IMAGE" }, data: { isCover: false } });
        const created = await tx.productAsset.create({ data: { productId: id, kind, ...stored, isCover } });
        const images = await tx.productAsset.findMany({ where: { productId: id, kind: "IMAGE" }, orderBy: [{ isCover: "desc" }, { createdAt: "asc" }], select: { id: true } });
        await tx.product.update({ where: { id }, data: { images: images.map((image) => `/api/products/assets/${image.id}`), ...(currentProduct.status === "PUBLISHED" ? { status: "PENDING_REVIEW", publishedAt: null } : {}) } });
        return created;
      }
      const created = await tx.productAsset.create({ data: { productId: id, kind, ...stored } });
      if (currentProduct.status === "PUBLISHED") await tx.product.update({ where: { id }, data: { status: "PENDING_REVIEW", publishedAt: null } });
      return created;
    });
    return NextResponse.json({ asset: { id: asset.id, kind: asset.kind, fileName: asset.fileName, mimeType: asset.mimeType, sizeBytes: asset.sizeBytes, isCover: asset.isCover } }, { status: 201 });
  } catch (error) {
    await removePrivateAsset(stored.storageKey).catch((cleanupError) => console.error("Failed to remove uncommitted product asset", cleanupError));
    if (error instanceof AssetLimitError) return NextResponse.json({ message: `A product can have up to ${kind === "IMAGE" ? "8 images" : "5 private ZIP files"}.` }, { status: 400 });
    if (error instanceof ProductStatusChangedError) return NextResponse.json({ message: "This product cannot accept uploads in its current status." }, { status: 409 });
    console.error("Product asset metadata save failed", error);
    return NextResponse.json({ message: "The upload could not be saved. Try again." }, { status: 500 });
  }
}
