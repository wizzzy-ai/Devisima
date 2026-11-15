import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { z } from "zod";

const storeSchema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters").max(100).optional(),
  storeDescription: z.string().max(2000).optional(),
  storeLogo: z.string().url().optional().or(z.literal("")),
  storeBanner: z.string().url().optional().or(z.literal("")),
  storeUrl: z.string().url().optional().or(z.literal("")),
  storeCategory: z.string().max(100).optional(),
  storeAccentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
  storeTwitter: z.string().url().optional().or(z.literal("")),
  storeSupportEmail: z.string().email().optional().or(z.literal("")),
  storeVisibility: z.enum(["public", "private"]).optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ message: "Seller access required." }, { status: 403 });

  const parsed = storeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid store data." }, { status: 400 });

  try {
    const application = await db.sellerApplication.findFirst({
      where: { userId: user.id, status: "APPROVED" },
    });

    if (!application) {
      return NextResponse.json({ message: "Approved seller application not found." }, { status: 404 });
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        storeName: parsed.data.storeName || null,
        storeDescription: parsed.data.storeDescription || null,
        storeLogo: parsed.data.storeLogo || null,
        storeBanner: parsed.data.storeBanner || null,
        storeUrl: parsed.data.storeUrl || null,
        storeCategory: parsed.data.storeCategory || null,
        storeAccentColor: parsed.data.storeAccentColor || "#35D0BA",
        storeTwitter: parsed.data.storeTwitter || null,
        storeSupportEmail: parsed.data.storeSupportEmail || null,
        storeVisibility: parsed.data.storeVisibility || "public",
      },
    });

    return NextResponse.json({ message: "Store settings updated successfully." });
  } catch (error) {
    console.error("Failed to update store settings:", error);
    return NextResponse.json({ message: "Failed to update store settings." }, { status: 500 });
  }
}
