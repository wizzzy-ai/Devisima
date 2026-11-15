import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function encryptionKey() {
  const secret = process.env.PAYOUT_ENCRYPTION_KEY;
  if (!secret) throw new Error("Payout account encryption is not configured.");
  const key = Buffer.from(secret, "base64");
  if (key.length !== 32) throw new Error("Payout account encryption is not configured.");
  return key;
}

export function encryptAccountNumber(accountNumber: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(accountNumber, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptAccountNumber(value: string) {
  const [version, ivPart, tagPart, dataPart, extra] = value.split(".");
  if (version !== "v1" || !ivPart || !tagPart || !dataPart || extra !== undefined) throw new Error("Encrypted payout account data is invalid.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataPart, "base64url")), decipher.final()]).toString("utf8");
}
