import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead } from "@/lib/notifications";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  unreadOnly: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
});

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to view notifications." }, { status: 401 });
  if (user.status !== "ACTIVE") return NextResponse.json({ message: "This account cannot access notifications." }, { status: 403 });
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ message: "Notification page settings are invalid." }, { status: 400 });

  const [result, unreadCount] = await Promise.all([
    getNotifications(user.id, parsed.data),
    getUnreadNotificationCount(user.id),
  ]);
  return NextResponse.json({ ...result, unreadCount }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to manage notifications." }, { status: 401 });
  if (user.status !== "ACTIVE") return NextResponse.json({ message: "This account cannot manage notifications." }, { status: 403 });
  const result = await markAllNotificationsRead(user.id);
  return NextResponse.json({ markedRead: result.count, unreadCount: 0 });
}
