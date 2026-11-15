import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export function generateEmailOtp() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashEmailOtp(userId: string, otp: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required to protect email verification codes.");
  return createHmac("sha256", secret).update(`${userId}:${otp}`).digest("hex");
}

export function matchesEmailOtp(userId: string, otp: string, codeHash: string) {
  const candidate = Buffer.from(hashEmailOtp(userId, otp), "hex");
  const stored = Buffer.from(codeHash, "hex");
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}

export function getEmailOtpMaxAttempts() {
  const configured = Number.parseInt(process.env.EMAIL_OTP_MAX_ATTEMPTS ?? "5", 10);
  return Number.isInteger(configured) && configured >= 1 && configured <= 10 ? configured : 5;
}
