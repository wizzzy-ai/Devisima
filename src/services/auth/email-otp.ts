import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/prisma";
import { generateEmailOtp, hashEmailOtp } from "@/lib/security/email-otp";
import { sendVerificationCodeEmail } from "@/services/email";

const OTP_LIFETIME_MS = 10 * 60_000;
const RESEND_COOLDOWN_MS = 60_000;

export async function issueEmailOtp(userId: string, email: string, name: string) {
  const now = new Date();
  const otp = generateEmailOtp();
  const codeHash = hashEmailOtp(userId, otp);
  const expiresAt = new Date(now.getTime() + OTP_LIFETIME_MS);
  const cooldownEndsAt = new Date(now.getTime() - RESEND_COOLDOWN_MS);

  const inserted = await db.$queryRaw<Array<{ id: string }>>`
    INSERT INTO "EmailVerification"
      ("id", "userId", "codeHash", "expiresAt", "attempts", "usedAt", "lastSentAt", "createdAt")
    VALUES
      (${randomUUID()}, ${userId}, ${codeHash}, ${expiresAt}, 0, NULL, ${now}, ${now})
    ON CONFLICT ("userId") DO UPDATE SET
      "codeHash" = EXCLUDED."codeHash",
      "expiresAt" = EXCLUDED."expiresAt",
      "attempts" = 0,
      "usedAt" = NULL,
      "lastSentAt" = EXCLUDED."lastSentAt",
      "createdAt" = EXCLUDED."createdAt"
    WHERE "EmailVerification"."lastSentAt" <= ${cooldownEndsAt}
    RETURNING "id"`;

  if (inserted.length === 0) {
    const current = await db.emailVerification.findUnique({ where: { userId }, select: { lastSentAt: true } });
    const retryAfter = current
      ? Math.max(1, Math.ceil((current.lastSentAt.getTime() + RESEND_COOLDOWN_MS - now.getTime()) / 1000))
      : 1;
    return { sent: false as const, retryAfter };
  }

  await sendVerificationCodeEmail(email, name, otp);
  return { sent: true as const, retryAfter: 60 };
}
