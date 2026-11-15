import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { markNotificationRead } from "@/lib/notifications";

export async function PATCH(_request: Request, { params }: { params: Promise<{ notificationId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to manage notifications." }, { status: 401 });
  if (user.status !== "ACTIVE") return NextResponse.json({ message: "This account cannot manage notifications." }, { status: 403 });
  const { notificationId } = await params;
  const updated = await markNotificationRead(user.id, notificationId);
  if (!updated.count) {
    const existing = await db.notification.findFirst({ where: { id: notificationId, userId: user.id }, select: { id: true } });
    if (!existing) return NextResponse.json({ message: "Notification not found." }, { status: 404 });
  }
  return NextResponse.json({ markedRead: true });
}
