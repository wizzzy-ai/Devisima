import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/prisma";
import { getSellerApiUser } from "@/lib/products/access";
import { createPrivateAssetUpload, isDirectPrivateUploadEnabled, PrivateAssetInputError } from "@/lib/products/private-storage";
import { checkRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const uploadRequestSchema = z.object({
  kind: z.enum(["IMAGE", "FILE"]),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().max(100),
  sizeBytes: z.number().int().positive().max(25 * 1024 * 1024),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await getSellerApiUser();
  if (!access.user) return access.response;
  const { id } = await params;
  const product = await db.product.findFirst({ where: { id, sellerId: access.user.id }, select: { id: true, status: true } });
  if (!product) return NextResponse.json({ message: "Product not found." }, { status: 404 });
  if (["PENDING_REVIEW", "ARCHIVED"].includes(product.status)) {
    return NextResponse.json({ message: "This product cannot accept uploads in its current status." }, { status: 409 });
  }
  const parsed = uploadRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Choose a valid image or ZIP file." }, { status: 400 });
  const input = parsed.data;
  const count = await db.productAsset.count({ where: { productId: id, kind: input.kind } });
  if (input.kind === "IMAGE" && count >= 8) return NextResponse.json({ message: "A product can have up to 8 images." }, { status: 400 });
  if (input.kind === "FILE" && count >= 5) return NextResponse.json({ message: "A product can have up to 5 private ZIP files." }, { status: 400 });

  const limit = await checkRateLimit("assetUpload", access.user.id);
  if (!limit.allowed) return NextResponse.json({ message: "Too many uploads. Please try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  try {
    if (!isDirectPrivateUploadEnabled()) return NextResponse.json({ mode: "local" });
    const plan = await createPrivateAssetUpload({ ...input, userId: access.user.id, resourceId: id });
    if (!plan) return NextResponse.json({ mode: "local" });
    return NextResponse.json({ mode: "direct", ...plan });
  } catch (error) {
    if (error instanceof PrivateAssetInputError) return NextResponse.json({ message: error.message }, { status: 400 });
    console.error("Private product upload authorization failed", error);
    return NextResponse.json({ message: "Private upload storage is temporarily unavailable." }, { status: 503 });
  }
}
