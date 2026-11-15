import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { createNotification, createNotifications, sendNotificationEmail } from "@/lib/notifications";
import type { NotificationType } from "@prisma/client";

const reviewSchema = z.object({ decision: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGES"]), notes: z.string().trim().max(3000).optional().default("") }).refine((data) => data.decision === "APPROVE" || data.notes.length >= 5, "Add clear feedback before requesting changes or rejecting.");
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  if (user.role !== "ADMIN" || user.status !== "ACTIVE") return NextResponse.json({ message: "Administrator access required." }, { status: 403 });
  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message || "Choose a review decision." }, { status: 400 });
  const { id } = await params;
  const status = parsed.data.decision === "APPROVE" ? "PUBLISHED" : parsed.data.decision === "REJECT" ? "REJECTED" : "CHANGES_REQUESTED";
  const reviewed = await db.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        sellerId: true,
        status: true,
        firstPublishedAt: true,
        seller: { select: { name: true, storeName: true } },
      },
    });
    if (!product || product.status !== "PENDING_REVIEW") return null;
    const publishedAt = status === "PUBLISHED" ? new Date() : null;
    const changed = await tx.product.updateMany({
      where: { id, status: "PENDING_REVIEW" },
      data: {
        status,
        moderationNotes: parsed.data.notes || null,
        publishedAt,
        firstPublishedAt: status === "PUBLISHED" && !product.firstPublishedAt ? publishedAt : undefined,
      },
    });
    if (!changed.count) return null;
    const type: NotificationType = status === "PUBLISHED" ? "PRODUCT_APPROVED" : status === "REJECTED" ? "PRODUCT_REJECTED" : "PRODUCT_CHANGES_REQUESTED";
    const title = status === "PUBLISHED" ? "Product approved" : status === "REJECTED" ? "Product not approved" : "Product changes requested";
    const message = status === "PUBLISHED"
      ? `Your product ${product.title} has been approved and is now published.`
      : status === "REJECTED"
        ? `Your product ${product.title} was not approved. Review the moderation feedback in your seller dashboard.`
        : `Changes are needed before ${product.title} can be published. Review the moderation feedback in your seller dashboard.`;
    await createNotification(tx, { userId: product.sellerId, type, title, message, link: `/seller/products/${product.id}/edit` });
    if (status === "PUBLISHED" && !product.firstPublishedAt) {
      const followers = await tx.storeFollow.findMany({
        where: { sellerId: product.sellerId, follower: { status: "ACTIVE" } },
        select: { followerId: true },
      });
      const storeName = product.seller.storeName || product.seller.name;
      await createNotifications(tx, followers
        .filter(({ followerId }) => followerId !== product.sellerId)
        .map(({ followerId }) => ({
          userId: followerId,
          type: "FOLLOWED_STORE_NEW_PRODUCT",
          title: "New product from a store you follow",
          message: `${storeName} just added ${product.title}.`,
          link: `/products/${product.slug}`,
        })));
    }
    return { id: product.id, sellerId: product.sellerId, title, message, link: `/seller/products/${product.id}/edit`, type };
  });
  if (!reviewed) return NextResponse.json({ message: "This product is no longer awaiting review." }, { status: 409 });
  await sendNotificationEmail({ userId: reviewed.sellerId, type: reviewed.type, title: reviewed.title, message: reviewed.message, link: reviewed.link });
  return NextResponse.json({ message: `Product ${status === "PUBLISHED" ? "approved" : status === "REJECTED" ? "rejected" : "returned for changes"}.` });
}
