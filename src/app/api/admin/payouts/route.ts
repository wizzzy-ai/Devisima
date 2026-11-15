import { NextResponse } from "next/server";
import { SellerPayoutStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ message: "Sign in to view payouts." }, { status: 401 });
  if (admin.role !== "ADMIN" || admin.status !== "ACTIVE") return NextResponse.json({ message: "Administrator access required." }, { status: 403 });

  const params = new URL(request.url).searchParams;
  const requestedPage = Number(params.get("page") ?? "1");
  const requestedStatus = params.get("status");
  const status = requestedStatus && Object.values(SellerPayoutStatus).includes(requestedStatus as SellerPayoutStatus)
    ? requestedStatus as SellerPayoutStatus
    : undefined;
  const where = status ? { status } : {};
  const pageSize = 20;
  const total = await db.sellerPayout.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, totalPages) : 1;
  const payouts = await db.sellerPayout.findMany({
      where,
      orderBy: { requestedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        reference: true,
        requestedAt: true,
        processedAt: true,
        failureReason: true,
        bankName: true,
        accountLast4: true,
        seller: { select: { id: true, name: true, email: true } },
        attempts: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { transferReference: true, providerStatus: true, status: true, createdAt: true },
        },
      },
    });
  return NextResponse.json({
    payouts,
    pagination: { page, pageSize, total, totalPages },
    status: status ?? "ALL",
  }, { headers: { "Cache-Control": "private, no-store" } });
}
