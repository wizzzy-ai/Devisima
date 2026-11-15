import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { detectImageMime, finalizePrivateAssetUpload, PrivateAssetInputError, readPrivateAsset, removePrivateAsset } from "@/lib/products/private-storage";

export const runtime = "nodejs";

const maxAvatarBytes = 4 * 1024 * 1024;
const imageContentTypes: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};
const imageExtensions: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
const avatarFinalizeSchema = z.object({ uploadToken: z.string().min(1).max(4096) });

function avatarKeyFromImage(image: string | null | undefined) {
  if (!image) return null;
  try {
    const url = new URL(image, "http://devisima.local");
    if (url.pathname !== "/api/accounts/profile/avatar") return null;
    const key = url.searchParams.get("key");
    return key && /^[0-9a-f-]{36}\.(?:png|jpg|webp|gif)$/.test(key) ? key : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Please sign in to upload a profile photo." }, { status: 401 });
  const limit = await checkRateLimit("avatarUpload", user.id);
  if (!limit.allowed) return NextResponse.json({ message: "Too many changes. Please try again later." }, { status: 429 });

  let legacyStorageKey: string | null = null;
  try {
    const directFinalize = request.headers.get("content-type")?.includes("application/json") === true;
    const oldKey = avatarKeyFromImage(user.image);
    const oldDatabasePhoto = oldKey
      ? await db.profilePhoto.findUnique({ where: { id: oldKey }, select: { id: true } })
      : null;
    let image: string;
    let storageKey: string;
    if (directFinalize) {
      const parsed = avatarFinalizeSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return NextResponse.json({ message: "The upload authorization is invalid." }, { status: 400 });
      const saved = await finalizePrivateAssetUpload(parsed.data.uploadToken, { userId: user.id, resourceId: null, kind: "IMAGE" });
      if (saved.mimeType === "image/gif") {
        await removePrivateAsset(saved.storageKey);
        return NextResponse.json({ message: "Upload a PNG, JPEG, or WebP photo." }, { status: 400 });
      }
      legacyStorageKey = saved.storageKey;
      storageKey = saved.storageKey;
      image = `/api/accounts/profile/avatar?key=${encodeURIComponent(storageKey)}`;
      await db.$transaction([
        db.profilePhoto.deleteMany({ where: { userId: user.id } }),
        db.user.update({ where: { id: user.id }, data: { image }, select: { image: true } }),
      ]);
    } else {
      const formData = await request.formData();
      const file = formData.get("avatar");
      if (!(file instanceof File) || !file.size) {
        return NextResponse.json({ message: "Choose a photo to upload." }, { status: 400 });
      }
      if (file.size > maxAvatarBytes) {
        return NextResponse.json({ message: "Profile photos must be 4 MB or smaller." }, { status: 400 });
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      const mimeType = detectImageMime(bytes);
      if (!mimeType || mimeType === "image/gif" || !imageExtensions[mimeType]) {
        return NextResponse.json({ message: "Upload a valid PNG, JPEG, or WebP photo." }, { status: 400 });
      }
      storageKey = `${randomUUID()}.${imageExtensions[mimeType]}`;
      image = `/api/accounts/profile/avatar?key=${encodeURIComponent(storageKey)}`;
      await db.$transaction([
        db.profilePhoto.upsert({
          where: { userId: user.id },
          create: { id: storageKey, userId: user.id, data: bytes, mimeType },
          update: { id: storageKey, data: bytes, mimeType },
        }),
        db.user.update({ where: { id: user.id }, data: { image }, select: { image: true } }),
      ]);
    }

    if (oldKey && oldKey !== storageKey && !oldDatabasePhoto) {
      await removePrivateAsset(oldKey).catch((error) => console.error("Failed to remove replaced profile photo", error));
    }
    return NextResponse.json({ image });
  } catch (error) {
    if (legacyStorageKey) {
      await removePrivateAsset(legacyStorageKey).catch((cleanupError) => console.error("Failed to remove uncommitted profile photo", cleanupError));
    }
    if (error instanceof PrivateAssetInputError || (error instanceof Error && /valid PNG, JPEG, WebP, or GIF image/i.test(error.message))) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Profile photo upload failed", error);
    return NextResponse.json({ message: "We could not upload your photo." }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Please sign in to remove your profile photo." }, { status: 401 });
  const limit = await checkRateLimit("profile", user.id);
  if (!limit.allowed) return NextResponse.json({ message: "Too many changes. Please try again later." }, { status: 429 });

  try {
    const current = await db.user.findUnique({ where: { id: user.id }, select: { image: true } });
    const oldKey = avatarKeyFromImage(current?.image);
    const oldDatabasePhoto = oldKey
      ? await db.profilePhoto.findUnique({ where: { id: oldKey }, select: { id: true } })
      : null;
    await db.$transaction([
      db.profilePhoto.deleteMany({ where: { userId: user.id } }),
      db.user.update({ where: { id: user.id }, data: { image: null } }),
    ]);
    if (oldKey && !oldDatabasePhoto) {
      await removePrivateAsset(oldKey).catch((error) => console.error("Failed to remove profile photo", error));
    }
    return NextResponse.json({ image: null });
  } catch (error) {
    console.error("Profile photo removal failed", error);
    return NextResponse.json({ message: "We could not remove your photo." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key || !/^[0-9a-f-]{36}\.(?:png|jpg|webp|gif)$/.test(key)) {
    return NextResponse.json({ message: "Image not found." }, { status: 404 });
  }

  try {
    const imageUrl = `/api/accounts/profile/avatar?key=${encodeURIComponent(key)}`;
    const owner = await db.user.findFirst({ where: { image: imageUrl }, select: { id: true } });
    if (!owner) return NextResponse.json({ message: "Image not found." }, { status: 404 });
    const databasePhoto = await db.profilePhoto.findUnique({
      where: { id: key },
      select: { data: true, mimeType: true },
    });
    const bytes = databasePhoto ? databasePhoto.data : await readPrivateAsset(key);
    const extension = key.slice(key.lastIndexOf(".") + 1);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": databasePhoto?.mimeType ?? imageContentTypes[extension],
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return NextResponse.json({ message: "Image not found." }, { status: 404 });
  }
}
