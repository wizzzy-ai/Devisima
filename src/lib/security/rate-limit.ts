import { db } from "@/lib/db/prisma";
import { createHash } from "crypto";

type Rule = { limit: number; windowMs: number };
const rules: Record<string, Rule> = {
  login: { limit: 8, windowMs: 15 * 60_000 }, loginIp: { limit: 40, windowMs: 15 * 60_000 }, register: { limit: 5, windowMs: 60 * 60_000 }, registerEmail: { limit: 4, windowMs: 60 * 60_000 },
  forgot: { limit: 4, windowMs: 60 * 60_000 }, forgotIp: { limit: 30, windowMs: 60 * 60_000 }, reset: { limit: 6, windowMs: 15 * 60_000 }, verify: { limit: 5, windowMs: 60 * 60_000 }, verifyIp: { limit: 25, windowMs: 60 * 60_000 },
  verifyOtpIp: { limit: 30, windowMs: 15 * 60_000 }, verifyOtpEmail: { limit: 10, windowMs: 15 * 60_000 }, profile: { limit: 12, windowMs: 15 * 60_000 },
  sellerApplyIp: { limit: 5, windowMs: 60 * 60_000 }, sellerApplyUser: { limit: 3, windowMs: 24 * 60 * 60_000 }, sellerReviewIp: { limit: 60, windowMs: 15 * 60_000 },
  "admin:suspend": { limit: 20, windowMs: 60 * 60_000 }, "admin:restore": { limit: 20, windowMs: 60 * 60_000 }, "admin:role-change": { limit: 10, windowMs: 60 * 60_000 },
  "admin:seller-approve": { limit: 30, windowMs: 60 * 60_000 }, "admin:seller-reject": { limit: 30, windowMs: 60 * 60_000 },
  downloadUser: { limit: 60, windowMs: 60 * 60_000 },
  assetUpload: { limit: 30, windowMs: 60 * 60_000 },
  avatarUpload: { limit: 30, windowMs: 60 * 60_000 },
  productView: { limit: 300, windowMs: 60 * 60_000 },
  payoutAccount: { limit: 6, windowMs: 60 * 60_000 }, payoutRequest: { limit: 5, windowMs: 24 * 60 * 60_000 }, adminPayoutAction: { limit: 60, windowMs: 15 * 60_000 },
  assistantChatUser: { limit: 500, windowMs: 60 * 60_000 }, assistantChatIp: { limit: 500, windowMs: 60 * 60_000 },
};

export async function checkRateLimit(action: keyof typeof rules, identity: string) {
  const rule = rules[action];
  const digest = createHash("sha256").update(identity).digest("hex");
  const key = `${action}:${digest}`;
  const now = new Date();
  const resetAt = new Date(now.getTime() + rule.windowMs);
  const prefix = `${action}:%`;
  const rows = await db.$queryRaw<Array<{ count: number; resetAt: Date }>>`
    WITH cleanup AS (
      DELETE FROM "RateLimitBucket" WHERE "key" LIKE ${prefix} AND "resetAt" <= ${now}
    )
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "updatedAt") VALUES (${key}, 1, ${resetAt}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimitBucket"."resetAt" <= ${now} THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimitBucket"."resetAt" <= ${now} THEN ${resetAt} ELSE "RateLimitBucket"."resetAt" END,
      "updatedAt" = ${now}
    RETURNING "count", "resetAt"`;
  const bucket = rows[0];
  return { allowed: !!bucket && bucket.count <= rule.limit, retryAfter: Math.max(1, Math.ceil(((bucket?.resetAt ?? resetAt).getTime() - now.getTime()) / 1000)) };
}
