import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { z } from "zod";

const payoutSchema = z.object({
  accountName: z.string().min(2, "Account name is required").max(100),
  accountNumber: z.string().min(10, "Account number must be 10 digits").max(10),
  bankName: z.string().min(2, "Bank name is required").max(100),
  bankCode: z.string().min(3, "Bank code must be 3 digits").max(3),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ message: "Seller access required." }, { status: 403 });

  const parsed = payoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid payout data." }, { status: 400 });

  try {
    const existingAccount = await db.sellerPayoutAccount.findUnique({
      where: { sellerId: user.id },
    });

    const accountLast4 = parsed.data.accountNumber.slice(-4);

    if (existingAccount) {
      await db.sellerPayoutAccount.update({
        where: { sellerId: user.id },
        data: {
          accountName: parsed.data.accountName,
          accountLast4,
          bankName: parsed.data.bankName,
          bankCode: parsed.data.bankCode,
          isVerified: false,
        },
      });
    } else {
      await db.sellerPayoutAccount.create({
        data: {
          sellerId: user.id,
          accountName: parsed.data.accountName,
          accountLast4,
          bankName: parsed.data.bankName,
          bankCode: parsed.data.bankCode,
          isVerified: false,
          accountNumberEncrypted: "",
          recipientCode: "",
        },
      });
    }

    return NextResponse.json({ message: "Payout account updated successfully. Verification pending." });
  } catch (error) {
    console.error("Failed to update payout account:", error);
    return NextResponse.json({ message: "Failed to update payout account." }, { status: 500 });
  }
}
