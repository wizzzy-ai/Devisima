import { AuditAction, SellerApplicationHistoryAction } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { createNotification, sendNotificationEmail } from "@/lib/notifications";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sellerApplicationReviewSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const reviewer = await getCurrentUser();
  if (!reviewer) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (reviewer.role !== "ADMIN") return NextResponse.json({ message: "You do not have permission to review seller applications." }, { status: 403 });

  const parsed = sellerApplicationReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid review request." }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  try {
    const limit = await checkRateLimit("sellerReviewIp", `${ip}:${reviewer.id}`);
    if (!limit.allowed) return NextResponse.json({ message: "Too many review attempts. Try again later." }, { status: 429 });

    const result = await db.$transaction(async (tx) => {
      const application = await tx.sellerApplication.findUnique({
        where: { id: parsed.data.applicationId },
        include: { user: { select: { id: true, name: true, role: true } } },
      });
      if (!application) return { kind: "NOT_FOUND" as const };
      if (application.status !== "PENDING") return { kind: "ALREADY_REVIEWED" as const };
      if (application.user.role !== "USER") return { kind: "ROLE_CHANGED" as const };

      const decisionAt = new Date();
      if (parsed.data.decision === "APPROVE") {
        const promoted = await tx.user.updateMany({
          where: { id: application.userId, role: "USER" },
          data: { role: "SELLER", sessionVersion: { increment: 1 } },
        });
        if (promoted.count !== 1) return { kind: "ROLE_CHANGED" as const };
      }

      const status = parsed.data.decision === "APPROVE"
        ? "APPROVED"
        : parsed.data.decision === "REQUEST_CHANGES"
          ? "CHANGES_REQUESTED"
          : "REJECTED";
      const rejectionReason = parsed.data.decision === "APPROVE" ? null : parsed.data.rejectionReason!;
      const updated = await tx.sellerApplication.updateMany({
        where: { id: application.id, status: "PENDING", version: application.version },
        data: {
          status,
          rejectionReason,
          adminNotes: parsed.data.adminNotes || null,
          reviewedById: reviewer.id,
          reviewedAt: decisionAt,
        },
      });
      if (updated.count !== 1) throw new Error("SELLER_APPLICATION_REVIEW_CONFLICT");

      await tx.sellerApplicationHistory.create({
        data: {
          applicationId: application.id,
          reviewerId: reviewer.id,
          action: parsed.data.decision === "APPROVE"
            ? SellerApplicationHistoryAction.APPROVED
            : parsed.data.decision === "REQUEST_CHANGES"
              ? SellerApplicationHistoryAction.CHANGES_REQUESTED
              : SellerApplicationHistoryAction.REJECTED,
          version: application.version,
          reason: rejectionReason,
          internalNote: parsed.data.adminNotes || null,
          snapshot: {
            storeName: application.storeName,
            description: application.description,
            productTypes: application.productTypes,
            technologies: application.technologies,
            portfolioUrl: application.portfolioUrl,
            githubUrl: application.githubUrl,
            whyJoin: application.whyJoin,
          },
        },
      });
      await tx.adminAuditLog.create({
        data: {
          adminId: reviewer.id,
          action: parsed.data.decision === "APPROVE"
            ? AuditAction.SELLER_APPROVED
            : parsed.data.decision === "REQUEST_CHANGES"
              ? AuditAction.SELLER_CHANGES_REQUESTED
              : AuditAction.SELLER_REJECTED,
          entityType: "SellerApplication",
          entityId: application.id,
          metadata: JSON.stringify({
            applicantId: application.userId,
            storeName: application.storeName,
            version: application.version,
            decision: parsed.data.decision,
            applicantFacingReason: rejectionReason,
            internalNote: parsed.data.adminNotes || null,
          }),
          ipAddress: ip,
          userAgent: request.headers.get("user-agent"),
        },
      });

      const notificationMessage = parsed.data.decision === "APPROVE"
        ? `Your application for ${application.storeName} was approved. You can now manage your seller account.`
        : parsed.data.decision === "REQUEST_CHANGES"
          ? `Please update your seller application for ${application.storeName}. Feedback: ${rejectionReason} Your account remains active as a buyer.`
          : `Your seller application for ${application.storeName} was not approved. Feedback: ${rejectionReason} Your account remains active as a buyer.`;
      const notificationTitle = parsed.data.decision === "APPROVE"
        ? "Seller application approved"
        : parsed.data.decision === "REQUEST_CHANGES"
          ? "Updates requested for your seller application"
          : "Seller application not approved";
      await createNotification(tx, {
        userId: application.userId,
        type: parsed.data.decision === "APPROVE" ? "SELLER_APPLICATION_APPROVED" : "SELLER_APPLICATION_REJECTED",
        title: notificationTitle,
        message: notificationMessage,
        link: parsed.data.decision === "APPROVE" ? "/seller/dashboard" : "/seller/apply",
      });

      return {
        kind: "REVIEWED" as const,
        applicantId: application.userId,
        applicantName: application.user.name,
        storeName: application.storeName,
        status,
        rejectionReason,
        version: application.version,
        decision: parsed.data.decision,
      };
    });

    if (result.kind === "NOT_FOUND") return NextResponse.json({ message: "Seller application not found." }, { status: 404 });
    if (result.kind === "ALREADY_REVIEWED") return NextResponse.json({ message: "This application has already been reviewed." }, { status: 409 });
    if (result.kind === "ROLE_CHANGED") return NextResponse.json({ message: "The applicant role has changed. Refresh and review the application again." }, { status: 409 });

    const approved = parsed.data.decision === "APPROVE";
    await sendNotificationEmail({
      userId: result.applicantId,
      type: approved ? "SELLER_APPLICATION_APPROVED" : "SELLER_APPLICATION_REJECTED",
      title: approved
        ? "Seller application approved"
        : result.decision === "REQUEST_CHANGES"
          ? "Updates requested for your seller application"
          : "Seller application not approved",
      message: approved
        ? `Your application for ${result.storeName} was approved. You can now manage your seller account.`
        : result.decision === "REQUEST_CHANGES"
          ? `Please update your application for ${result.storeName}. Feedback: ${result.rejectionReason} Your account remains active as a buyer.`
          : `Your application for ${result.storeName} was not approved. Feedback: ${result.rejectionReason} Your account remains active as a buyer.`,
      link: approved ? "/seller/dashboard" : "/seller/apply",
    });
    return NextResponse.json({
      message: approved
        ? "Seller application approved."
        : result.decision === "REQUEST_CHANGES"
          ? "Changes requested from the applicant."
          : "Seller application rejected.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SELLER_APPLICATION_REVIEW_CONFLICT") {
      return NextResponse.json({ message: "This application was reviewed by another administrator." }, { status: 409 });
    }
    console.error("Seller application review failed", error);
    return NextResponse.json({ message: "We could not review this application right now." }, { status: 500 });
  }
}
