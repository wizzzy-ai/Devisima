import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { hashToken } from "@/lib/security/tokens";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await checkRateLimit("reset", ip);
  if (!limit.allowed) return NextResponse.json({ message: "Too many attempts. Please try again later." }, { status: 429 });
  const parsed = resetPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Check your password." }, { status: 400 });
  try {
    const tokenHash = hashToken(parsed.data.token);
    const record = await db.authToken.findUnique({ where: { tokenHash } });
    if (!record || record.purpose !== "reset") return NextResponse.json({ message: "This reset link is invalid or has already been used." }, { status: 400 });
    if (record.expiresAt <= new Date()) {
      await db.authToken.delete({ where: { id: record.id } });
      return NextResponse.json({ message: "This reset link has expired. Request a new one." }, { status: 410 });
    }
    const passwordHash = await hash(parsed.data.password, 12);
    await db.$transaction(async (tx) => {
      const deleted = await tx.authToken.deleteMany({ where: { id: record.id, purpose: "reset", expiresAt: { gt: new Date() } } });
      if (deleted.count !== 1) throw new Error("RESET_TOKEN_USED");
      await tx.user.update({ where: { id: record.userId }, data: { passwordHash, sessionVersion: { increment: 1 } } });
      await tx.authToken.deleteMany({ where: { userId: record.userId, purpose: "reset" } });
    });
    return NextResponse.json({ message: "Your password has been updated successfully." });
  } catch (error) {
    if (error instanceof Error && error.message === "RESET_TOKEN_USED") return NextResponse.json({ message: "This reset link is invalid or has already been used." }, { status: 400 });
    console.error("Password reset failed", error);
    return NextResponse.json({ message: "We could not reset your password. Request a new link and try again." }, { status: 500 });
  }
}
