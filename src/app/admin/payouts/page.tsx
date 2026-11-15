import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminPayouts } from "@/components/admin/payouts/admin-payouts";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { SellerPayoutStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Seller payouts | Devisima administration",
  description: "Review seller payout requests and reconcile Paystack transfers.",
  robots: "noindex",
};

export default async function AdminPayoutsPage({ searchParams }: {
  searchParams: Promise<{ page?: string | string[]; status?: string | string[] }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const rawStatus = Array.isArray(params.status) ? params.status[0] : params.status;
  const requestedPage = Number(rawPage ?? "1");
  const status = rawStatus && Object.values(SellerPayoutStatus).includes(rawStatus as SellerPayoutStatus)
    ? rawStatus as SellerPayoutStatus
    : "ALL";
  const where = status === "ALL" ? {} : { status };
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

  return <AdminShell user={admin}><AdminPayouts
    initialData={{
      payouts,
      pagination: { page, pageSize, total, totalPages },
      status,
    }}
  /></AdminShell>;
}
