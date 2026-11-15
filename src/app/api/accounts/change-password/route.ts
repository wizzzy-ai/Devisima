import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { compare } from "bcryptjs";
import { passwordSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to change your password." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { currentPassword, newPassword } = body || {};

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ message: "Current password and new password are required." }, { status: 400 });
  }

  const passwordValidation = passwordSchema.safeParse(newPassword);
  if (!passwordValidation.success) {
    return NextResponse.json({ message: passwordValidation.error.issues[0]?.message ?? "Invalid password." }, { status: 400 });
  }

  try {
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true, sessionVersion: true },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const isCurrentPasswordValid = await compare(currentPassword, currentUser.passwordHash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 });
    }

    const bcrypt = await import("bcryptjs");
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        sessionVersion: currentUser.sessionVersion + 1,
      },
    });

    return NextResponse.json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Password change failed:", error);
    return NextResponse.json({ message: "Could not change your password. Please try again." }, { status: 500 });
  }
}
