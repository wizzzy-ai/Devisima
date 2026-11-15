import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { getMarketplaceSettings, getSellerBalance } from "@/lib/earnings/balance";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { writeFinancialAudit } from "@/lib/payouts/audit";
import { notifyAdmins, notifyUser } from "@/lib/payouts/notifications";
import { sendNotificationEmail } from "@/lib/notifications";

const payoutRequestSchema = z.object({ idempotencyKey: z.string().uuid(), amount: z.number().int().positive().optional() });

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to view payouts." }, { status: 401 });
  if (user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ message: "Only active sellers can view payouts." }, { status: 403 });
  const requestedPage = Number(new URL(request.url).searchParams.get("page") ?? "1");
  const pageSize = 10;
  const total = await db.sellerPayout.count({ where: { sellerId: user.id } });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, totalPages) : 1;
  const [balance, settings, account, payouts, activePayout] = await Promise.all([
    getSellerBalance(user.id),
    getMarketplaceSettings(),
    db.sellerPayoutAccount.findUnique({
      where: { sellerId: user.id },
      select: { bankName: true, accountName: true, accountLast4: true, isVerified: true },
    }),
    db.sellerPayout.findMany({
      where: { sellerId: user.id },
      orderBy: { requestedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, amount: true, currency: true, status: true, reference: true, requestedAt: true, processedAt: true, failureReason: true },
    }),
    db.sellerPayout.findFirst({
      where: { sellerId: user.id, status: { in: ["PENDING", "PROCESSING"] } },
      select: { id: true },
    }),
  ]);
  return NextResponse.json({
    balance,
    minimumPayout: settings.minimumPayout,
    account,
    hasActivePayout: Boolean(activePayout),
    payouts,
    pagination: { page, pageSize, total, totalPages },
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to request a payout." }, { status: 401 });
  if (user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ message: "Only active sellers can request payouts." }, { status: 403 });
  const parsed = payoutRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Refresh the page and submit a valid payout request." }, { status: 400 });
  const rateLimit = await checkRateLimit("payoutRequest", user.id);
  if (!rateLimit.allowed) return NextResponse.json({ message: "Too many payout requests. Try again later." }, { status: 429 });

  try {
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`;
      const seller = await tx.user.findUnique({ where: { id: user.id }, select: { role: true, status: true } });
      if (seller?.role !== "SELLER" || seller.status !== "ACTIVE") return { error: "This seller account cannot request a payout.", status: 403 } as const;
      const previous = await tx.sellerPayout.findUnique({ where: { sellerId_idempotencyKey: { sellerId: user.id, idempotencyKey: parsed.data.idempotencyKey } }, select: { id: true, reference: true, amount: true, status: true } });
      if (previous) return { payout: previous, reused: true } as const;
      const account = await tx.sellerPayoutAccount.findUnique({ where: { sellerId: user.id }, select: { id: true, bankName: true, accountLast4: true, recipientCode: true, isVerified: true } });
      if (!account?.isVerified || !account.recipientCode) return { error: "Add and verify a payout bank account first.", status: 409 } as const;
      const active = await tx.sellerPayout.findFirst({ where: { sellerId: user.id, status: { in: ["PENDING", "PROCESSING"] } }, select: { id: true } });
      if (active) return { error: "A payout request is already pending or processing.", status: 409 } as const;
      const settings = await getMarketplaceSettings(tx);
      if (settings.currency !== "NGN") return { error: "Seller payouts are currently available in NGN only.", status: 409 } as const;
      const balance = await getSellerBalance(user.id, tx);
      const amount = parsed.data.amount ?? balance.availableBalance;
      if (balance.availableBalance < settings.minimumPayout) return { error: `The minimum payout is ${settings.minimumPayout.toLocaleString("en-NG")} ${settings.currency}.`, status: 409 } as const;
      if (amount < settings.minimumPayout) return { error: "The requested amount is below the minimum payout.", status: 400 } as const;
      if (amount > balance.availableBalance) return { error: "The requested amount exceeds your available balance.", status: 409 } as const;

      const reference = `payout_${randomUUID()}`;
      const payout = await tx.sellerPayout.create({ data: {
        sellerId: user.id, payoutAccountId: account.id, amount, currency: settings.currency, reference,
        idempotencyKey: parsed.data.idempotencyKey, recipientCode: account.recipientCode, bankName: account.bankName, accountLast4: account.accountLast4,
      }, select: { id: true, reference: true, amount: true, currency: true, status: true } });
      await tx.sellerTransaction.create({ data: { sellerId: user.id, payoutId: payout.id, type: "PAYOUT", grossAmount: 0, commissionAmount: 0, netAmount: -amount, currency: settings.currency, status: "PENDING", sourceKey: `payout:${user.id}:${parsed.data.idempotencyKey}`, description: `Payout request ${reference}` } });
      await writeFinancialAudit(tx, { actorId: user.id, action: "PAYOUT_REQUESTED", entityType: "SellerPayout", entityId: payout.id, amount, currency: settings.currency, metadata: { reference } });
      await notifyUser(tx, { userId: user.id, type: "PAYOUT_REQUESTED", title: "Payout requested", body: `Your ${amount.toLocaleString("en-NG")} ${settings.currency} payout request is awaiting review.`, href: "/seller/payouts" });
      await notifyAdmins(tx, { type: "PAYOUT_REQUESTED", title: "New seller payout request", body: `A seller requested a payout of ${amount.toLocaleString("en-NG")} ${settings.currency}.`, href: "/admin/payouts" });
      return { payout, reused: false } as const;
    }, { isolationLevel: "Serializable" });
    if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status });
    if (!result.reused) await sendNotificationEmail({
      userId: user.id,
      type: "PAYOUT_REQUESTED",
      title: "Payout request received",
      message: `Your ${result.payout.amount.toLocaleString("en-NG")} ${result.payout.currency} payout request is awaiting review.`,
      link: "/seller/payouts",
    });
    return NextResponse.json({ payout: result.payout, message: result.reused ? "This payout request was already received." : "Payout request submitted for admin review." }, { status: result.reused ? 200 : 201 });
  } catch {
    return NextResponse.json({ message: "We could not create your payout request. Refresh your balance and try again." }, { status: 409 });
  }
}
