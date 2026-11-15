import { NextResponse } from "next/server";
import { db } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/guards";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in to view your cart." }, { status: 401 });
  if (user.status !== "ACTIVE") return NextResponse.json({ message: "This account cannot view a cart." }, { status: 403 });
  const count = await db.cartItem.count({ where: { cart: { userId: user.id } } });
  return NextResponse.json({ count }, { headers: { "Cache-Control": "private, no-store" } });
}
