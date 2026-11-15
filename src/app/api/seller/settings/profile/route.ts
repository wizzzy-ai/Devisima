import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email().optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ message: "Seller access required." }, { status: 403 });

  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid profile data." }, { status: 400 });

  try {
    await db.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name },
    });

    return NextResponse.json({ message: "Profile updated successfully." });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json({ message: "Failed to update profile." }, { status: 500 });
  }
}
