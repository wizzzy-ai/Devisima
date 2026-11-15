import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const tokenPayloadSchema = z.object({
  purchaseId: z.string().cuid(),
  userId: z.string().cuid(),
  fileId: z.string().cuid(),
  expiresAt: z.number().int().positive(),
  nonce: z.string().uuid(),
});

function signingKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Download signing is not configured.");
  return createHmac("sha256", secret).update("devisima-download-v1").digest();
}

export function createDownloadToken(payload: z.infer<typeof tokenPayloadSchema>) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", signingKey()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyDownloadToken(token: string) {
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra !== undefined || !/^[A-Za-z0-9_-]{43}$/.test(signature)) return null;
  const expected = createHmac("sha256", signingKey()).update(encoded).digest();
  let received: Buffer;
  try { received = Buffer.from(signature, "base64url"); } catch { return null; }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const parsed = tokenPayloadSchema.safeParse(JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")));
    if (!parsed.success || parsed.data.expiresAt <= Date.now()) return null;
    return parsed.data;
  } catch {
    return null;
  }
}
