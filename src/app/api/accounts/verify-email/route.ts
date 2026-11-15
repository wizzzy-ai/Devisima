import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { getEmailOtpMaxAttempts, matchesEmailOtp } from "@/lib/security/email-otp";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { hashToken } from "@/lib/security/tokens";
import { verifyOtpSchema } from "@/lib/validation/auth";

const invalidCodeMessage = "That code is incorrect. Please check your email and try again.";

async function verifyLegacyLink(token: string) {
  if (token.length < 32 || token.length > 256) {
    return NextResponse.json({ message: "This verification link is invalid." }, { status: 400 });
  }
  const record = await db.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.purpose !== "verify") {
    return NextResponse.json({ message: "This verification link is invalid or has already been used." }, { status: 400 });
  }
  if (record.expiresAt <= new Date()) {
    await db.authToken.delete({ where: { id: record.id } });
    return NextResponse.json({ message: "This verification link has expired. Request a new code." }, { status: 410 });
  }
  await db.$transaction(async (tx) => {
    const deleted = await tx.authToken.deleteMany({ where: { id: record.id, purpose: "verify", expiresAt: { gt: new Date() } } });
    if (deleted.count !== 1) throw new Error("VERIFY_TOKEN_USED");
    await tx.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } });
  });
  return NextResponse.json({ message: "Your email has been verified. You can now sign in." });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (typeof body?.token === "string" && typeof body?.otp !== "string") {
    try {
      return await verifyLegacyLink(body.token);
    } catch (error) {
      if (error instanceof Error && error.message === "VERIFY_TOKEN_USED") {
        return NextResponse.json({ message: "This verification link is invalid or has already been used." }, { status: 400 });
      }
      console.error("Legacy email verification failed", error);
      return NextResponse.json({ message: "We could not verify your email right now. Please try again." }, { status: 500 });
    }
  }

  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Enter your email and 6-digit code." }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  let limits: Awaited<ReturnType<typeof checkRateLimit>>[];
  try {
    limits = await Promise.all([
      checkRateLimit("verifyOtpIp", ip),
      checkRateLimit("verifyOtpEmail", parsed.data.email),
    ]);
  } catch (error) {
    console.error("Email verification rate-limit check failed", error);
    return NextResponse.json({ message: "Verification is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
  if (limits.some((limit) => !limit.allowed)) {
    return NextResponse.json({ message: "Too many attempts. Please wait before trying again." }, { status: 429 });
  }

  const now = new Date();
  const maxAttempts = getEmailOtpMaxAttempts();

  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, emailVerified: true } });
      if (!user) return "invalid" as const;
      if (user.emailVerified) return "already-verified" as const;

      const record = await tx.emailVerification.findUnique({ where: { userId: user.id } });
      if (!record || record.usedAt) return "invalid" as const;
      if (record.expiresAt <= now) {
        await tx.emailVerification.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: now } });
        return "expired" as const;
      }
      if (record.attempts >= maxAttempts) {
        await tx.emailVerification.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: now } });
        return "too-many-attempts" as const;
      }

      if (!matchesEmailOtp(user.id, parsed.data.otp, record.codeHash)) {
        const incremented = await tx.emailVerification.updateMany({
          where: { id: record.id, usedAt: null, expiresAt: { gt: now }, attempts: { lt: maxAttempts } },
          data: { attempts: { increment: 1 } },
        });
        if (incremented.count !== 1) return "too-many-attempts" as const;
        const updated = await tx.emailVerification.findUnique({ where: { id: record.id }, select: { attempts: true } });
        if (updated && updated.attempts >= maxAttempts) {
          await tx.emailVerification.updateMany({ where: { id: record.id, usedAt: null }, data: { usedAt: now } });
          return "too-many-attempts" as const;
        }
        return "invalid" as const;
      }

      const markedUsed = await tx.emailVerification.updateMany({
        where: { id: record.id, userId: user.id, codeHash: record.codeHash, usedAt: null, expiresAt: { gt: now }, attempts: { lt: maxAttempts } },
        data: { usedAt: now },
      });
      if (markedUsed.count !== 1) return "invalid" as const;
      await tx.user.update({ where: { id: user.id }, data: { emailVerified: now } });
      return "verified" as const;
    });

    if (result === "verified") return NextResponse.json({ message: "Your email has been verified." });
    if (result === "already-verified") return NextResponse.json({ message: "This email is already verified. You can sign in." }, { status: 409 });
    if (result === "expired") return NextResponse.json({ message: "This code has expired. Please request a new code." }, { status: 410 });
    if (result === "too-many-attempts") return NextResponse.json({ message: "Too many attempts. Please request a new verification code." }, { status: 429 });
    return NextResponse.json({ message: invalidCodeMessage }, { status: 400 });
  } catch (error) {
    console.error("Email OTP verification failed", error);
    return NextResponse.json({ message: "We could not verify your email right now. Please try again." }, { status: 500 });
  }
}
