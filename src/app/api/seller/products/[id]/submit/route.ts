import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { getSellerApiUser } from "@/lib/products/access";
import { validateProductForReview } from "@/lib/products/validation";
import { notifyAdmins } from "@/lib/payouts/notifications";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Context) {
  const access = await getSellerApiUser();
  if (!access.user) return access.response;
  const { id } = await params;
  const product = await db.product.findFirst({
    where: { id, sellerId: access.user.id },
    include: { assets: { select: { kind: true, isCover: true } } },
  });
  if (!product) return NextResponse.json({ message: "Product not found." }, { status: 404 });
  if (!["DRAFT", "REJECTED", "CHANGES_REQUESTED"].includes(product.status)) return NextResponse.json({ message: "This product cannot be submitted in its current status." }, { status: 409 });
  const issue = validateProductForReview(product, product.assets.some((asset) => asset.kind === "IMAGE" && asset.isCover), product.assets.filter((asset) => asset.kind === "FILE").length);
  if (issue) return NextResponse.json({ message: issue }, { status: 400 });
  const sellerId = access.user.id;
  const submitted = await db.$transaction(async (tx) => {
    const updated = await tx.product.updateMany({ where: { id, sellerId, status: product.status }, data: { status: "PENDING_REVIEW", publishedAt: null, moderationNotes: null } });
    if (!updated.count) return false;
    await notifyAdmins(tx, {
      type: "PRODUCT_SUBMITTED",
      title: "Product submitted for review",
      body: "A seller product is awaiting moderation.",
      href: "/admin/products",
    });
    return true;
  });
  if (!submitted) return NextResponse.json({ message: "The product changed before submission. Refresh and try again." }, { status: 409 });
  return NextResponse.json({ message: "We'll let you know once the review is complete. You can check its status under My Products." });
}
