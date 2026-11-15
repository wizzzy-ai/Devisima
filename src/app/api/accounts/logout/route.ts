import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/prisma";

export async function POST() {
  const session = await auth();
  if (session?.user?.id) await db.user.update({ where: { id: session.user.id }, data: { sessionVersion: { increment: 1 } } });
  return NextResponse.json({ ok: true });
}
