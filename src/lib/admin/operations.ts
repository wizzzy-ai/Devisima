import { db } from "@/lib/db/prisma";
import { AuditAction, UserStatus, Role, SellerApplicationStatus } from "@prisma/client";
import { createAuditLog } from "./audit";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { headers } from "next/headers";

export async function suspendUser(targetUserId: string, adminId: string, reason?: string) {
  // Check rate limit
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = await checkRateLimit("admin:suspend", `${ip}:${adminId}`);
  if (!rateLimit.allowed) {
    throw new Error("Too many suspension attempts. Please try again later.");
  }

  // Verify target user exists
  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  // Prevent self-suspension
  if (targetUserId === adminId) {
    throw new Error("You cannot suspend yourself");
  }

  // Update user status
  await db.user.update({
    where: { id: targetUserId },
    data: {
      status: UserStatus.SUSPENDED,
      sessionVersion: { increment: 1 }, // Invalidate sessions
    },
  });

  // Create audit log
  await createAuditLog({
    adminId,
    action: AuditAction.USER_SUSPENDED,
    entityType: "User",
    entityId: targetUserId,
    metadata: {
      reason,
      previousStatus: targetUser.status,
      previousRole: targetUser.role,
    },
    ipAddress: ip,
  });

  return { success: true };
}

export async function restoreUser(targetUserId: string, adminId: string, reason?: string) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = await checkRateLimit("admin:restore", `${ip}:${adminId}`);
  if (!rateLimit.allowed) {
    throw new Error("Too many restore attempts. Please try again later.");
  }

  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  await db.user.update({
    where: { id: targetUserId },
    data: {
      status: UserStatus.ACTIVE,
    },
  });

  await createAuditLog({
    adminId,
    action: AuditAction.USER_RESTORED,
    entityType: "User",
    entityId: targetUserId,
    metadata: {
      reason,
      previousStatus: targetUser.status,
    },
    ipAddress: ip,
  });

  return { success: true };
}

export async function changeUserRole(targetUserId: string, newRole: Role, adminId: string, reason?: string) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = await checkRateLimit("admin:role-change", `${ip}:${adminId}`);
  if (!rateLimit.allowed) {
    throw new Error("Too many role change attempts. Please try again later.");
  }

  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  if (targetUserId === adminId) {
    throw new Error("You cannot change your own role");
  }

  const previousRole = targetUser.role;

  await db.user.update({
    where: { id: targetUserId },
    data: {
      role: newRole,
      sessionVersion: { increment: 1 },
    },
  });

  await createAuditLog({
    adminId,
    action: AuditAction.ROLE_CHANGED,
    entityType: "User",
    entityId: targetUserId,
    metadata: {
      reason,
      previousRole,
      newRole,
    },
    ipAddress: ip,
  });

  return { success: true };
}

export async function approveSellerApplication(applicationId: string, adminId: string) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = await checkRateLimit("admin:seller-approve", `${ip}:${adminId}`);
  if (!rateLimit.allowed) {
    throw new Error("Too many approval attempts. Please try again later.");
  }

  const application = await db.sellerApplication.findUnique({
    where: { id: applicationId },
    include: { user: true },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  if (application.status !== SellerApplicationStatus.PENDING) {
    throw new Error("Application has already been reviewed");
  }

  // Transaction: update application status and user role
  await db.$transaction(async (tx) => {
    // Update application
    await tx.sellerApplication.update({
      where: { id: applicationId },
      data: {
        status: SellerApplicationStatus.APPROVED,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });

    // Update user role to SELLER
    await tx.user.update({
      where: { id: application.userId },
      data: {
        role: Role.SELLER,
        sessionVersion: { increment: 1 },
      },
    });
  });

  // Create audit log
  await createAuditLog({
    adminId,
    action: AuditAction.SELLER_APPROVED,
    entityType: "SellerApplication",
    entityId: applicationId,
    metadata: {
      applicantId: application.userId,
      applicantName: application.user.name,
      applicantEmail: application.user.email,
      storeName: application.storeName,
    },
    ipAddress: ip,
  });

  // Send approval email
  try {
    const { sendSellerApprovalEmail } = await import("@/services/email");
    await sendSellerApprovalEmail(application.user.email, application.user.name, application.storeName);
  } catch (error) {
    console.error("Failed to send seller approval email:", error);
    // Don't fail the operation if email fails
  }

  return { success: true };
}

export async function rejectSellerApplication(applicationId: string, adminId: string, reason?: string) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = await checkRateLimit("admin:seller-reject", `${ip}:${adminId}`);
  if (!rateLimit.allowed) {
    throw new Error("Too many rejection attempts. Please try again later.");
  }

  const application = await db.sellerApplication.findUnique({
    where: { id: applicationId },
    include: { user: true },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  if (application.status !== SellerApplicationStatus.PENDING) {
    throw new Error("Application has already been reviewed");
  }

  await db.sellerApplication.update({
    where: { id: applicationId },
    data: {
      status: SellerApplicationStatus.REJECTED,
      adminNotes: reason,
      reviewedById: adminId,
      reviewedAt: new Date(),
    },
  });

  await createAuditLog({
    adminId,
    action: AuditAction.SELLER_REJECTED,
    entityType: "SellerApplication",
    entityId: applicationId,
    metadata: {
      applicantId: application.userId,
      applicantName: application.user.name,
      applicantEmail: application.user.email,
      storeName: application.storeName,
      reason,
    },
    ipAddress: ip,
  });

  // Send rejection email
  try {
    const { sendSellerRejectionEmail } = await import("@/services/email");
    await sendSellerRejectionEmail(application.user.email, application.user.name, reason || "");
  } catch (error) {
    console.error("Failed to send seller rejection email:", error);
  }

  return { success: true };
}

export async function getDashboardStats() {
  const [
    totalUsers,
    totalSellers,
    totalProducts,
    totalOrders,
    revenue,
    pendingApplications,
    pendingProducts,
    pendingRefunds,
    pendingPayouts,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: Role.SELLER, status: "ACTIVE" } }),
    db.product.count(),
    db.order.count(),
    db.order.aggregate({
      where: { status: "PAID", payments: { some: { status: "SUCCESS" } } },
      _sum: { total: true },
    }),
    db.sellerApplication.count({ where: { status: SellerApplicationStatus.PENDING } }),
    db.product.count({ where: { status: "PENDING_REVIEW" } }),
    db.refund.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
    db.sellerPayout.count({ where: { status: "PENDING" } }),
  ]);

  return {
    totalUsers,
    totalSellers,
    totalProducts,
    totalOrders,
    revenue: revenue._sum.total ?? 0,
    pendingApplications,
    pendingProducts,
    pendingRefunds,
    pendingPayouts,
  };
}
