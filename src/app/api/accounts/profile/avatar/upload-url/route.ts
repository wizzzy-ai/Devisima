import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { checkRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

const uploadRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  sizeBytes: z.number().int().positive().max(4 * 1024 * 1024),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Please sign in to upload a profile photo." }, { status: 401 });
  const limit = await checkRateLimit("avatarUpload", user.id);
  if (!limit.allowed) return NextResponse.json({ message: "Too many changes. Please try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

  const parsed = uploadRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Choose a PNG, JPEG, or WebP photo up to 4 MB." }, { status: 400 });
  return NextResponse.json({ mode: "database" });
}
