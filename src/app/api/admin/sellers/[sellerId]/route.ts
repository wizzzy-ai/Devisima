import { AuditAction, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { createNotification, sendNotificationEmail } from "@/lib/notifications";
import { checkRateLimit } from "@/lib/security/rate-limit";

const reason = z.string().trim().min(10, "Provide a reason of at least 10 characters.").max(1500);
const confirmedAction = z.object({ confirm: z.literal(true), reason });
const actionSchema = z.discriminatedUnion("action", [
  confirmedAction.extend({ action: z.literal("SUSPEND") }),
  confirmedAction.extend({ action: z.literal("REINSTATE") }),
  confirmedAction.extend({ action: z.literal("RESTRICT_PRODUCT"), productId: z.string().cuid() }),
  confirmedAction.extend({ action: z.literal("RESTORE_PRODUCT"), productId: z.string().cuid() }),
  z.object({
    action: z.literal("MESSAGE"),
    confirm: z.literal(true),
    title: z.string().trim().min(3).max(100),
    message: z.string().trim().min(10).max(1500),
  }),
]);

export async function POST(request: Request, { params }: { params: Promise<{ sellerId: string }> }) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (admin.role !== "ADMIN" || admin.status !== "ACTIVE") return NextResponse.json({ message: "Administrator access is required." }, { status: 403 });

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Check the action details." }, { status: 400 });
  const { sellerId } = await params;
  if (!/^[\w-]{20,30}$/.test(sellerId)) return NextResponse.json({ message: "Seller not found." }, { status: 404 });

  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const limit = await checkRateLimit("sellerReviewIp", `${ip}:${admin.id}`);
    if (!limit.allowed) return NextResponse.json({ message: "Too many seller-management actions. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

    const result = await db.$transaction(async (tx) => {
      const seller = await tx.user.findFirst({
        where: { id: sellerId, role: "SELLER", sellerApplications: { some: { status: "APPROVED" } } },
        select: { id: true, name: true, sellerSuspendedAt: true, status: true },
      });
      if (!seller) return { kind: "NOT_SELLER" as const };

      const input = parsed.data;
      let auditAction: AuditAction;
      let entityType = "User";
      let entityId = seller.id;
      let notification: { title: string; message: string; link: string } | null = null;
      let metadata: Record<string, string> = {};

      if (input.action === "SUSPEND" || input.action === "REINSTATE") {
        const suspending = input.action === "SUSPEND";
        if (suspending && seller.sellerSuspendedAt) return { kind: "ALREADY_SUSPENDED" as const };
        if (!suspending && !seller.sellerSuspendedAt) return { kind: "NOT_SUSPENDED" as const };
        const changed = await tx.user.updateMany({
          where: { id: seller.id, role: "SELLER", sellerSuspendedAt: suspending ? null : { not: null } },
          data: {
            sellerSuspendedAt: suspending ? new Date() : null,
            sellerSuspensionReason: suspending ? input.reason : null,
          },
        });
        if (changed.count !== 1) return { kind: "CONFLICT" as const };
        auditAction = suspending ? AuditAction.SELLER_SUSPENDED : AuditAction.SELLER_REINSTATED;
        metadata = { reason: input.reason, previousSellerSuspendedAt: seller.sellerSuspendedAt?.toISOString() ?? "" };
        notification = suspending
          ? { title: "Seller access temporarily restricted", message: `Seller access has been temporarily restricted. Your Devisima account remains active for buyer features and existing purchases. Reason: ${input.reason}`, link: "/seller/apply" }
          : { title: "Seller access reinstated", message: `Your seller access has been reinstated. You can access your seller dashboard again. Reason: ${input.reason}`, link: "/seller/dashboard" };
      } else if (input.action === "RESTRICT_PRODUCT" || input.action === "RESTORE_PRODUCT") {
        const restricting = input.action === "RESTRICT_PRODUCT";
        const product = await tx.product.findFirst({
          where: {
            id: input.productId,
            sellerId: seller.id,
            ...(restricting ? { status: "PUBLISHED", adminRestrictedAt: null } : { adminRestrictedAt: { not: null } }),
          },
          select: { id: true, title: true, status: true, adminRestrictedAt: true },
        });
        if (!product) return { kind: "PRODUCT_CONFLICT" as const };
        const changed = await tx.product.updateMany({
          where: { id: product.id, sellerId: seller.id, adminRestrictedAt: product.adminRestrictedAt },
          data: {
            adminRestrictedAt: restricting ? new Date() : null,
            adminRestrictionReason: restricting ? input.reason : null,
          },
        });
        if (changed.count !== 1) return { kind: "PRODUCT_CONFLICT" as const };
        auditAction = restricting ? AuditAction.SELLER_PRODUCT_RESTRICTED : AuditAction.SELLER_PRODUCT_RESTORED;
        entityType = "Product";
        entityId = product.id;
        metadata = { sellerId: seller.id, productTitle: product.title, reason: input.reason };
        notification = {
          title: restricting ? "Product temporarily unavailable" : product.status === "PUBLISHED" ? "Product listing restored" : "Product restriction removed",
          message: restricting
            ? `${product.title} has been temporarily removed from the marketplace while it is reviewed. Reason: ${input.reason}`
            : product.status === "PUBLISHED"
              ? `${product.title} has been restored to the marketplace. Reason: ${input.reason}`
              : `The restriction on ${product.title} has been removed. Its current moderation status remains ${product.status.replaceAll("_", " ")}. Reason: ${input.reason}`,
          link: `/seller/products/${product.id}/edit`,
        };
      } else {
        auditAction = AuditAction.SELLER_MESSAGE_SENT;
        metadata = { title: input.title, message: input.message };
        notification = { title: input.title, message: input.message, link: "/notifications" };
      }

      await tx.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: auditAction,
          entityType,
          entityId,
          metadata: JSON.stringify(metadata),
          ipAddress: ip,
          userAgent: request.headers.get("user-agent"),
        },
      });
      if (notification) {
        await createNotification(tx, {
          userId: seller.id,
          type: "SYSTEM",
          title: notification.title,
          message: notification.message,
          link: notification.link,
        });
      }
      return { kind: "UPDATED" as const, notification };
    });

    if (result.kind === "NOT_SELLER") return NextResponse.json({ message: "Approved seller not found." }, { status: 404 });
    if (result.kind === "ALREADY_SUSPENDED") return NextResponse.json({ message: "Seller access is already restricted." }, { status: 409 });
    if (result.kind === "NOT_SUSPENDED") return NextResponse.json({ message: "Seller access is not restricted." }, { status: 409 });
    if (result.kind === "CONFLICT") return NextResponse.json({ message: "Seller status changed. Refresh and try again." }, { status: 409 });
    if (result.kind === "PRODUCT_CONFLICT") return NextResponse.json({ message: "The product is no longer in the expected state. Refresh and try again." }, { status: 409 });

    if (result.notification) {
      await sendNotificationEmail({
        userId: sellerId,
        type: "SYSTEM",
        title: result.notification.title,
        message: result.notification.message,
        link: result.notification.link,
      });
    }
    return NextResponse.json({ message: "Seller management action completed." });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ message: "Seller or product not found." }, { status: 404 });
    }
    console.error("Admin seller action failed", error);
    return NextResponse.json({ message: "The seller action could not be completed." }, { status: 500 });
  }
}
