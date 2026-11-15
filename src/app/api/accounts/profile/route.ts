import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { profileSchema } from "@/lib/validation/auth";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "Please sign in to update your profile." }, { status: 401 });
  const limit = await checkRateLimit("profile", session.user.id);
  if (!limit.allowed) return NextResponse.json({ message: "Too many changes. Please try again later." }, { status: 429 });
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Check your details." }, { status: 400 });
  try {
    const user = await db.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name },
      select: { name: true, image: true },
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile update failed", error);
    return NextResponse.json({ message: "We could not save your changes." }, { status: 500 });
  }
}
