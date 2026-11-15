import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { issuePasswordReset } from "@/services/auth/tokens";

const response = { message: "If an account matches that email, a reset link will be sent shortly." };
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  const [ipLimit, emailLimit] = await Promise.all([checkRateLimit("forgotIp", ip), checkRateLimit("forgot", `${ip}:${parsed.data.email}`)]);
  if (!ipLimit.allowed || !emailLimit.allowed) return NextResponse.json({ message: "Too many requests. Please try again later." }, { status: 429 });
  try {
    const user = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (user) await issuePasswordReset(user.id, user.email, user.name);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Password reset email request failed", error);
    return NextResponse.json(response);
  }
}
