import "server-only";
import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const maxImageBytes = 10 * 1024 * 1024;
const maxZipBytes = 25 * 1024 * 1024;
const uploadExpirySeconds = 5 * 60;
const imageExtensions: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };
const validStoredKey = /^(?:[0-9a-f-]{36}|pending\/[0-9a-f-]{36})\.(?:png|jpg|webp|gif|zip)$/i;
const storageRoot = path.resolve(/* turbopackIgnore: true */ process.env.PRIVATE_PRODUCT_STORAGE_DIR || path.join(process.cwd(), ".private-product-storage"));

type AssetKind = "IMAGE" | "FILE";
export class PrivateAssetInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrivateAssetInputError";
  }
}

type UploadClaims = {
  key: string;
  userId: string;
  resourceId: string | null;
  kind: AssetKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  expiresAt: number;
};

let s3Client: S3Client | undefined;

function getS3Store() {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const endpoint = process.env.S3_ENDPOINT;
  const configured = [bucket, region, accessKeyId, secretAccessKey, endpoint].some(Boolean);

  if (!configured && process.env.NODE_ENV !== "production") return null;
  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new Error("S3 private storage is not fully configured.");
  }

  s3Client ??= new S3Client({
    region,
    endpoint,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client: s3Client, bucket };
}

export function isDirectPrivateUploadEnabled() {
  return getS3Store() !== null;
}

function safeStoredPath(key: string) {
  if (!validStoredKey.test(key)) throw new Error("Invalid private storage key.");
  const fullPath = path.resolve(/* turbopackIgnore: true */ storageRoot, ...key.split("/"));
  if (!fullPath.startsWith(`${storageRoot}${path.sep}`)) throw new Error("Invalid private storage path.");
  return fullPath;
}

export function detectImageMime(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  const signature = String.fromCharCode(...bytes.slice(0, 6));
  if (signature === "GIF87a" || signature === "GIF89a") return "image/gif";
  return null;
}

function isZip(bytes: Uint8Array) {
  return bytes[0] === 0x50 && bytes[1] === 0x4b && [0x03, 0x05, 0x07].includes(bytes[2]) && [0x04, 0x06, 0x08].includes(bytes[3]);
}

function sanitizeFileName(name: string, extension: string) {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || `product.${extension}`;
}

function tokenSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required to sign private uploads.");
  return secret;
}

function signClaims(claims: UploadClaims) {
  const encoded = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", tokenSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyClaims(token: string): UploadClaims {
  if (token.length > 4096) throw new PrivateAssetInputError("The upload authorization is invalid.");
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) throw new PrivateAssetInputError("The upload authorization is invalid.");
  const expected = createHmac("sha256", tokenSecret()).update(encoded).digest();
  let received: Buffer;
  try {
    received = Buffer.from(signature, "base64url");
  } catch {
    throw new PrivateAssetInputError("The upload authorization is invalid.");
  }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new PrivateAssetInputError("The upload authorization is invalid.");
  }
  let claims: UploadClaims;
  try {
    claims = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as UploadClaims;
  } catch {
    throw new PrivateAssetInputError("The upload authorization is invalid.");
  }
  if (
    !claims || typeof claims.userId !== "string" ||
    !(claims.resourceId === null || typeof claims.resourceId === "string") ||
    (claims.kind !== "IMAGE" && claims.kind !== "FILE") ||
    typeof claims.fileName !== "string" || typeof claims.mimeType !== "string" ||
    !Number.isSafeInteger(claims.sizeBytes) || !Number.isSafeInteger(claims.expiresAt) ||
    !validStoredKey.test(claims.key) || !claims.key.startsWith("pending/") ||
    claims.expiresAt <= Date.now()
  ) {
    throw new PrivateAssetInputError("The upload authorization is invalid or expired.");
  }
  return claims;
}

export async function createPrivateAssetUpload(input: {
  userId: string;
  resourceId: string | null;
  kind: AssetKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const store = getS3Store();
  if (!store) return null;

  const extension = input.kind === "IMAGE" ? imageExtensions[input.mimeType] : input.mimeType === "application/zip" ? "zip" : undefined;
  const maximum = input.kind === "IMAGE" ? maxImageBytes : maxZipBytes;
  if (!extension) throw new PrivateAssetInputError(input.kind === "IMAGE" ? "Upload a PNG, JPEG, WebP, or GIF image." : "Upload a valid .zip product file.");
  if (input.kind === "FILE" && !input.fileName.toLowerCase().endsWith(".zip")) {
    throw new PrivateAssetInputError("Upload a valid .zip product file.");
  }
  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > maximum) {
    throw new PrivateAssetInputError(input.kind === "IMAGE" ? "Images must be 10 MB or smaller." : "Product ZIP files must be 25 MB or smaller.");
  }
  const key = `pending/${randomUUID()}.${extension}`;
  const claims: UploadClaims = {
    key,
    userId: input.userId,
    resourceId: input.resourceId,
    kind: input.kind,
    fileName: sanitizeFileName(input.fileName, extension),
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    expiresAt: Date.now() + uploadExpirySeconds * 1000,
  };
  const uploadUrl = await getSignedUrl(
    store.client,
    new PutObjectCommand({ Bucket: store.bucket, Key: key, ContentType: input.mimeType, ContentLength: input.sizeBytes }),
    { expiresIn: uploadExpirySeconds, signableHeaders: new Set(["content-type", "content-length"]) },
  );
  return {
    uploadUrl,
    uploadToken: signClaims(claims),
    headers: { "Content-Type": input.mimeType },
    expiresIn: uploadExpirySeconds,
  };
}

export async function finalizePrivateAssetUpload(
  token: string,
  expected: { userId: string; resourceId: string | null; kind: AssetKind },
) {
  const claims = verifyClaims(token);
  if (claims.userId !== expected.userId || claims.resourceId !== expected.resourceId || claims.kind !== expected.kind) {
    throw new PrivateAssetInputError("The upload authorization does not match this request.");
  }
  const store = getS3Store();
  if (!store) throw new PrivateAssetInputError("Direct uploads are not enabled.");

  const head = await store.client.send(new HeadObjectCommand({ Bucket: store.bucket, Key: claims.key }));
  const maximum = claims.kind === "IMAGE" ? maxImageBytes : maxZipBytes;
  if (!Number.isSafeInteger(head.ContentLength) || head.ContentLength !== claims.sizeBytes || head.ContentLength > maximum) {
    await removePrivateAsset(claims.key);
    throw new PrivateAssetInputError(claims.kind === "IMAGE" ? "The uploaded image size did not match the authorized size." : "The uploaded ZIP size did not match the authorized size.");
  }

  const range = await store.client.send(new GetObjectCommand({ Bucket: store.bucket, Key: claims.key, Range: "bytes=0-15" }));
  const signatureBytes = range.Body ? await range.Body.transformToByteArray() : new Uint8Array();
  const detectedMime = claims.kind === "IMAGE" ? detectImageMime(signatureBytes) : isZip(signatureBytes) ? "application/zip" : null;
  if (!detectedMime || detectedMime !== claims.mimeType) {
    await removePrivateAsset(claims.key);
    throw new PrivateAssetInputError(claims.kind === "IMAGE" ? "Upload a valid image that matches its declared format." : "Upload a valid .zip product file.");
  }

  const extension = claims.key.slice(claims.key.lastIndexOf(".") + 1);
  const storageKey = claims.key.slice("pending/".length);
  const copySource = `${store.bucket}/${claims.key.split("/").map(encodeURIComponent).join("/")}`;
  await store.client.send(new CopyObjectCommand({
    Bucket: store.bucket,
    Key: storageKey,
    CopySource: copySource,
    ContentType: detectedMime,
    MetadataDirective: "REPLACE",
    CacheControl: claims.kind === "IMAGE" ? "public, max-age=300" : "private, no-store",
  }));
  await store.client.send(new DeleteObjectCommand({ Bucket: store.bucket, Key: claims.key }))
    .catch((error) => console.error("Failed to remove finalized upload staging object", error));
  return {
    storageKey,
    mimeType: detectedMime,
    sizeBytes: head.ContentLength,
    fileName: sanitizeFileName(claims.fileName, extension),
  };
}

export async function savePrivateAsset(file: File, kind: AssetKind) {
  if (!file.size) throw new Error("The selected file is empty.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  let mimeType: string;
  let extension: string;

  if (kind === "IMAGE") {
    if (file.size > maxImageBytes) throw new Error("Images must be 10 MB or smaller.");
    const detected = detectImageMime(bytes);
    if (!detected) throw new Error("Upload a valid PNG, JPEG, WebP, or GIF image.");
    extension = imageExtensions[detected];
    mimeType = detected;
  } else {
    if (file.size > maxZipBytes) throw new Error("Product ZIP files must be 25 MB or smaller.");
    if (!file.name.toLowerCase().endsWith(".zip") || !isZip(bytes)) throw new Error("Upload a valid .zip product file.");
    extension = "zip";
    mimeType = "application/zip";
  }

  const storageKey = `${randomUUID()}.${extension}`;
  const store = getS3Store();
  if (store) {
    await store.client.send(new PutObjectCommand({
      Bucket: store.bucket,
      Key: storageKey,
      Body: bytes,
      ContentType: mimeType,
      CacheControl: kind === "IMAGE" ? "public, max-age=300" : "private, no-store",
    }));
  } else {
    await mkdir(storageRoot, { recursive: true });
    await writeFile(safeStoredPath(storageKey), bytes, { flag: "wx", mode: 0o600 });
  }
  return { storageKey, mimeType, sizeBytes: file.size, fileName: sanitizeFileName(file.name, extension) };
}

export async function readPrivateAsset(storageKey: string) {
  if (!validStoredKey.test(storageKey) || storageKey.startsWith("pending/")) {
    throw new Error("Invalid private storage key.");
  }
  const store = getS3Store();
  if (store) {
    const response = await store.client.send(new GetObjectCommand({ Bucket: store.bucket, Key: storageKey }));
    if (!response.Body) throw new Error("The private asset is unavailable.");
    return Buffer.from(await response.Body.transformToByteArray());
  }
  return readFile(/* turbopackIgnore: true */ safeStoredPath(storageKey));
}

export async function removePrivateAsset(storageKey: string) {
  if (!validStoredKey.test(storageKey)) throw new Error("Invalid private storage key.");
  const store = getS3Store();
  if (store) {
    await store.client.send(new DeleteObjectCommand({ Bucket: store.bucket, Key: storageKey }));
    return;
  }
  await rm(safeStoredPath(storageKey), { force: true });
}
