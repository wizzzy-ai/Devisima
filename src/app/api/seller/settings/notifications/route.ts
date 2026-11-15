import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { z } from "zod";

const notificationsSchema = z.object({
  orderEmails: z.boolean().optional(),
  paymentEmails: z.boolean().optional(),
  purchaseEmails: z.boolean().optional(),
  reviewEmails: z.boolean().optional(),
  sellerEmails: z.boolean().optional(),
  payoutEmails: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  systemEmails: z.boolean().optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (user.role !== "SELLER") return NextResponse.json({ message: "Seller access required." }, { status: 403 });

  const parsed = notificationsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid notification data." }, { status: 400 });

  try {
    const existingPreference = await db.notificationPreference.findUnique({
      where: { userId: user.id },
    });

    if (existingPreference) {
      await db.notificationPreference.update({
        where: { userId: user.id },
        data: parsed.data,
      });
    } else {
      await db.notificationPreference.create({
        data: {
          userId: user.id,
          ...parsed.data,
        },
      });
    }

    return NextResponse.json({ message: "Notification preferences updated successfully." });
  } catch (error) {
    console.error("Failed to update notification preferences:", error);
    return NextResponse.json({ message: "Failed to update notification preferences." }, { status: 500 });
  }
}
