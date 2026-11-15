import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { getNotificationPreferences } from "@/lib/notifications";

const preferenceSchema = z.object({
  orderEmails: z.boolean().optional(),
  paymentEmails: z.boolean().optional(),
  purchaseEmails: z.boolean().optional(),
  reviewEmails: z.boolean().optional(),
  sellerEmails: z.boolean().optional(),
  payoutEmails: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  systemEmails: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "Choose at least one notification preference.");

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to manage notification preferences." }, { status: 401 });
  if (user.status !== "ACTIVE") return NextResponse.json({ message: "This account cannot manage notification preferences." }, { status: 403 });
  const preferences = await getNotificationPreferences(user.id);
  return NextResponse.json({ preferences }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to manage notification preferences." }, { status: 401 });
  if (user.status !== "ACTIVE") return NextResponse.json({ message: "This account cannot manage notification preferences." }, { status: 403 });
  const parsed = preferenceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Check your notification preferences." }, { status: 400 });
  const preferences = await db.notificationPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...parsed.data },
    update: parsed.data,
    select: {
      orderEmails: true,
      paymentEmails: true,
      purchaseEmails: true,
      reviewEmails: true,
      sellerEmails: true,
      payoutEmails: true,
      marketingEmails: true,
      systemEmails: true,
    },
  });
  return NextResponse.json({ preferences });
}
