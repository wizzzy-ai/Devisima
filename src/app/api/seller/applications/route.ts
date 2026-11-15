import { NextResponse } from "next/server";
import { SellerApplicationHistoryAction } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sellerApplicationSubmissionSchema } from "@/lib/validation/auth";
import { createNotification, sendNotificationEmail } from "@/lib/notifications";
import { notifyAdmins } from "@/lib/payouts/notifications";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to apply to become a seller." }, { status: 401 });
  if (user.role !== "USER") {
    return NextResponse.json({ message: user.role === "SELLER" ? "Your account is already approved as a seller." : "Your account cannot submit a seller application." }, { status: 409 });
  }

  const parsed = sellerApplicationSubmissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Check your application details." }, { status: 400 });
  const applicationId = parsed.data.applicationId;
  const applicationData = {
    storeName: parsed.data.storeName,
    description: parsed.data.description,
    productTypes: parsed.data.productTypes,
    technologies: parsed.data.technologies,
    portfolioUrl: parsed.data.portfolioUrl,
    githubUrl: parsed.data.githubUrl,
    whyJoin: parsed.data.whyJoin,
  };
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    const [ipLimit, userLimit] = await Promise.all([
      checkRateLimit("sellerApplyIp", ip),
      checkRateLimit("sellerApplyUser", user.id),
    ]);
    if (!ipLimit.allowed || !userLimit.allowed) {
      const retryAfter = Math.max(
        ...[ipLimit, userLimit].filter((limit) => !limit.allowed).map((limit) => limit.retryAfter),
      );
      return NextResponse.json(
        { message: "Too many application attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }

    const result = await db.$transaction(async (tx) => {
      const existing = await tx.sellerApplication.findFirst({
        where: applicationId ? { id: applicationId, userId: user.id } : { userId: user.id },
        orderBy: { createdAt: "desc" },
      });

      if (applicationId) {
        if (!existing) return { kind: "NOT_FOUND" as const };
        if (existing.status !== "REJECTED" && existing.status !== "CHANGES_REQUESTED") return { kind: "NOT_RESUBMITTABLE" as const };

        const version = existing.version + 1;
        const updated = await tx.sellerApplication.updateMany({
          where: { id: existing.id, userId: user.id, status: existing.status, version: existing.version },
          data: {
            ...applicationData,
            version,
            status: "PENDING",
            rejectionReason: null,
            adminNotes: null,
            reviewedById: null,
            reviewedAt: null,
          },
        });
        if (updated.count !== 1) return { kind: "CONFLICT" as const };

        await tx.sellerApplicationHistory.create({
          data: {
            applicationId: existing.id,
            action: SellerApplicationHistoryAction.RESUBMITTED,
            version,
            snapshot: applicationData,
          },
        });
        const message = `Your updated application for ${applicationData.storeName} has been submitted and is awaiting review.`;
        await createNotification(tx, {
          userId: user.id,
          type: "SELLER_APPLICATION_SUBMITTED",
          title: "Updated seller application received",
          message,
          link: "/seller/apply",
        });
        await notifyAdmins(tx, {
          type: "SELLER_APPLICATION_SUBMITTED",
          title: "Seller application resubmitted",
          body: `${applicationData.storeName} has resubmitted an application for review.`,
          href: "/admin/seller-applications",
        });
        return { kind: "RESUBMITTED" as const, id: existing.id, storeName: applicationData.storeName, message };
      }

      if (existing) {
        return { kind: existing.status === "PENDING" ? "PENDING" as const : "RESUBMIT_REQUIRED" as const };
      }

      const created = await tx.sellerApplication.create({
        data: { userId: user.id, ...applicationData },
      });
      await tx.sellerApplicationHistory.create({
        data: {
          applicationId: created.id,
          action: SellerApplicationHistoryAction.SUBMITTED,
          version: created.version,
          snapshot: applicationData,
        },
      });
      await notifyAdmins(tx, {
        type: "SELLER_APPLICATION_SUBMITTED",
        title: "Seller application submitted",
        body: "A new seller application is ready for review.",
        href: "/admin/seller-applications",
      });
      return { kind: "CREATED" as const, id: created.id, storeName: created.storeName, createdAt: created.createdAt };
    });

    if (result.kind === "NOT_FOUND") return NextResponse.json({ message: "Seller application not found." }, { status: 404 });
    if (result.kind === "NOT_RESUBMITTABLE") return NextResponse.json({ message: "Only a rejected application can be resubmitted." }, { status: 409 });
    if (result.kind === "CONFLICT") return NextResponse.json({ message: "This application has already been updated. Refresh and try again." }, { status: 409 });
    if (result.kind === "PENDING") return NextResponse.json({ message: "You already have an application under review." }, { status: 409 });
    if (result.kind === "RESUBMIT_REQUIRED") return NextResponse.json({ message: "Edit and resubmit your existing application instead of creating a duplicate." }, { status: 409 });

    if (result.kind === "RESUBMITTED") {
      await sendNotificationEmail({
        userId: user.id,
        type: "SELLER_APPLICATION_SUBMITTED",
        title: "Updated seller application received",
        message: result.message,
        link: "/seller/apply",
      });
      return NextResponse.json({
        message: "Your updated seller application has been submitted for review.",
        application: { id: result.id, status: "PENDING" },
      });
    }

    return NextResponse.json({
      message: "Your seller application has been submitted for review.",
      application: { id: result.id, status: "PENDING", createdAt: result.createdAt },
    }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ message: "You already have an application under review." }, { status: 409 });
    }
    console.error("Seller application submission failed", error);
    return NextResponse.json({ message: "We could not submit your application right now. Please try again." }, { status: 500 });
  }
}
