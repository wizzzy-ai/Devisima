import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { registerSchema } from "@/lib/validation/auth";
import { issueEmailOtp } from "@/services/auth/email-otp";
import { POLICY_VERSIONS, recordPolicyAcceptance } from "@/lib/policy-acceptance";

const registrationMessage = "If this address is eligible, a verification code will be sent shortly. Check your email or sign in if you already verified it.";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  let limit: Awaited<ReturnType<typeof checkRateLimit>>;
  try {
    limit = await checkRateLimit("register", ip);
  } catch (error) {
    console.error("Registration rate-limit check failed", error);
    return NextResponse.json({ message: "Registration is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
  if (!limit.allowed) return NextResponse.json({ message: "Too many attempts. Please try again later." }, { status: 429 });
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Check your details." }, { status: 400 });
  const { name, email, password } = parsed.data;
  let emailLimit: Awaited<ReturnType<typeof checkRateLimit>>;
  try {
    emailLimit = await checkRateLimit("registerEmail", email);
  } catch (error) {
    console.error("Registration email rate-limit check failed", error);
    return NextResponse.json({ message: "Registration is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }
  if (!emailLimit.allowed) return NextResponse.json({ message: "Too many attempts. Please try again later." }, { status: 429 });
  try {
    const existing = await db.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, emailVerified: true } });
    if (existing) {
      if (!existing.emailVerified) await issueEmailOtp(existing.id, existing.email, existing.name);
      return NextResponse.json({ message: registrationMessage }, { status: 202 });
    }
    const user = await db.user.create({
      data: { name, email, passwordHash: await hash(password, 12), termsAcceptedAt: new Date() },
    });
    await Promise.all([
      recordPolicyAcceptance({ userId: user.id, policyType: "TERMS", version: POLICY_VERSIONS.TERMS, source: "register" }),
      recordPolicyAcceptance({ userId: user.id, policyType: "PRIVACY", version: POLICY_VERSIONS.PRIVACY, source: "register" }),
      recordPolicyAcceptance({ userId: user.id, policyType: "COOKIES", version: POLICY_VERSIONS.COOKIES, source: "register" }),
    ]);
    await issueEmailOtp(user.id, user.email, user.name);
    return NextResponse.json({ message: registrationMessage }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ message: registrationMessage }, { status: 202 });
    }
    console.error("Registration failed", error);
    return NextResponse.json({ message: "We could not complete registration right now. Please try again or request another code shortly." }, { status: 500 });
  }
}
