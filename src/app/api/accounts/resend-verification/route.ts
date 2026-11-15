import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { issueEmailOtp } from "@/services/auth/email-otp";

const genericResponse = {
  message: "If this address needs verification, a new code will be sent shortly.",
  resendInSeconds: 60,
};

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const parsed = forgotPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  try {
    const [ipLimit, emailLimit] = await Promise.all([
      checkRateLimit("verifyIp", ip),
      checkRateLimit("verify", parsed.data.email),
    ]);
    if (!ipLimit.allowed || !emailLimit.allowed) {
      return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
    }
    const user = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (user && !user.emailVerified) {
      try {
        await issueEmailOtp(user.id, user.email, user.name);
      } catch {
        console.error("Verification code delivery failed");
      }
    }
    return NextResponse.json(genericResponse);
  } catch (error) {
    console.error("Verification resend failed", error);
    return NextResponse.json({ message: "We could not process that request right now. Please try again shortly." }, { status: 503 });
  }
}
