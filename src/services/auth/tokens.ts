import { db } from "@/lib/db/prisma";
import { createToken, hashToken } from "@/lib/security/tokens";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/services/email";

export async function issueVerification(userId: string, email: string, name: string) {
  const { token, tokenHash } = createToken();
  await db.$transaction([
    db.authToken.deleteMany({ where: { userId, purpose: "verify" } }),
    db.authToken.create({ data: { userId, purpose: "verify", tokenHash, expiresAt: new Date(Date.now() + 24 * 60 * 60_000) } }),
  ]);
  await sendVerificationEmail(email, name, token);
}

export async function issuePasswordReset(userId: string, email: string, name: string) {
  const { token, tokenHash } = createToken();
  await db.$transaction([
    db.authToken.deleteMany({ where: { userId, purpose: "reset" } }),
    db.authToken.create({ data: { userId, purpose: "reset", tokenHash, expiresAt: new Date(Date.now() + 60 * 60_000) } }),
  ]);
  await sendPasswordResetEmail(email, name, token);
}

export async function verifyToken(token: string, purpose: "verify" | "reset") {
  const found = await db.authToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!found || found.purpose !== purpose) return { status: "invalid" as const };
  if (found.expiresAt <= new Date()) {
    await db.authToken.delete({ where: { id: found.id } });
    return { status: "expired" as const };
  }
  return { status: "valid" as const, record: found };
}
