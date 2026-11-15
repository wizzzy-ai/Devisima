import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { encryptAccountNumber } from "@/lib/payouts/account-crypto";
import { paystackPayoutProvider } from "@/lib/payouts/paystack-provider";
import { writeFinancialAudit } from "@/lib/payouts/audit";

const accountSchema = z.object({ bankCode: z.string().min(1).max(20).regex(/^[A-Za-z0-9_-]+$/), accountNumber: z.string().regex(/^\d{10}$/) });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to manage payout details." }, { status: 401 });
  if (user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ message: "Only active sellers can manage payout details." }, { status: 403 });
  const account = await db.sellerPayoutAccount.findUnique({ where: { sellerId: user.id }, select: { bankName: true, bankCode: true, accountName: true, accountLast4: true, isVerified: true, updatedAt: true } });
  return NextResponse.json({ account }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to manage payout details." }, { status: 401 });
  if (user.role !== "SELLER" || user.status !== "ACTIVE") return NextResponse.json({ message: "Only active sellers can manage payout details." }, { status: 403 });
  const parsed = accountSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Enter a valid Nigerian bank and 10-digit account number." }, { status: 400 });
  const limit = await checkRateLimit("payoutAccount", user.id);
  if (!limit.allowed) return NextResponse.json({ message: "Too many payout account changes. Try again later." }, { status: 429 });

  try {
    const banks = await paystackPayoutProvider.listBanks();
    const bank = banks.find((option) => option.code === parsed.data.bankCode);
    if (!bank) return NextResponse.json({ message: "Choose a supported bank." }, { status: 400 });
    const resolved = await paystackPayoutProvider.resolveAccount(parsed.data.accountNumber, bank.code);
    if (resolved.accountNumber !== parsed.data.accountNumber || !resolved.accountName.trim()) return NextResponse.json({ message: "The account details could not be verified." }, { status: 422 });
    const recipient = await paystackPayoutProvider.createRecipient({ accountName: resolved.accountName, accountNumber: resolved.accountNumber, bankCode: bank.code, email: user.email });
    const encrypted = encryptAccountNumber(resolved.accountNumber);
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`;
      const activePayout = await tx.sellerPayout.findFirst({ where: { sellerId: user.id, status: { in: ["PENDING", "PROCESSING"] } }, select: { id: true } });
      if (activePayout) return null;
      const account = await tx.sellerPayoutAccount.upsert({
        where: { sellerId: user.id },
        create: { sellerId: user.id, bankName: recipient.bankName || bank.name, bankCode: bank.code, accountName: resolved.accountName, accountNumberEncrypted: encrypted, accountLast4: resolved.accountNumber.slice(-4), recipientCode: recipient.recipientCode, isVerified: true },
        update: { bankName: recipient.bankName || bank.name, bankCode: bank.code, accountName: resolved.accountName, accountNumberEncrypted: encrypted, accountLast4: resolved.accountNumber.slice(-4), recipientCode: recipient.recipientCode, isVerified: true },
        select: { bankName: true, bankCode: true, accountName: true, accountLast4: true, isVerified: true, updatedAt: true },
      });
      await writeFinancialAudit(tx, { actorId: user.id, action: "PAYOUT_ACCOUNT_UPDATED", entityType: "SellerPayoutAccount", entityId: user.id, metadata: { bankCode: bank.code, accountLast4: resolved.accountNumber.slice(-4) } });
      return account;
    });
    if (!result) return NextResponse.json({ message: "Payout account cannot be changed while a payout is pending or processing." }, { status: 409 });
    return NextResponse.json({ account: result, message: "Bank account verified and saved." });
  } catch {
    return NextResponse.json({ message: "We could not verify or save this payout account. Please try again." }, { status: 503 });
  }
}
