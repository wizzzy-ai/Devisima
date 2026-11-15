import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/guards";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to request account deletion." }, { status: 401 });

  try {
    const account = await db.user.update({
      where: { id: user.id },
      data: {
        status: "SUSPENDED",
        email: `${user.id}@deletions.local`,
        name: "Deleted User",
      },
      select: { id: true, status: true },
    });

    return NextResponse.json({
      message: "Your account deletion request is in progress. Please contact support if you need assistance.",
      account,
    });
  } catch (error) {
    console.error("Privacy deletion request failed", error);
    return NextResponse.json({ message: "We could not process your deletion request right now." }, { status: 500 });
  }
}
