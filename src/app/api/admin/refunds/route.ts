import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { RefundStatus } from "@prisma/client";

export async function GET(request: Request) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (admin.role !== "ADMIN") return NextResponse.json({ message: "Administrator access is required." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const rawStatus = searchParams.get("status");
  const rawPage = searchParams.get("page");
  const pageSize = 20;
  const page = Number.isSafeInteger(Number(rawPage)) && Number(rawPage) > 0 ? Number(rawPage) : 1;

  const status = rawStatus && Object.values(RefundStatus).includes(rawStatus as RefundStatus)
    ? rawStatus as RefundStatus
    : "ALL";

  const where = status === "ALL" ? {} : { status };

  const [total, refunds] = await Promise.all([
    db.refund.count({ where }),
    db.refund.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        orderId: true,
        providerReference: true,
        amount: true,
        currency: true,
        status: true,
        reason: true,
        buyerExplanation: true,
        adminDecision: true,
        reviewedById: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
        order: {
          select: {
            id: true,
            reference: true,
            userId: true,
            total: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({
    refunds,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    status,
  });
}
