import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  if (user.role !== "ADMIN" || user.status !== "ACTIVE") return NextResponse.json({ message: "Administrator access required." }, { status: 403 });
  const products = await db.product.findMany({ where: { status: "PENDING_REVIEW" }, include: { category: { select: { name: true } }, seller: { select: { id: true, name: true, email: true } }, assets: { select: { id: true, kind: true, fileName: true, mimeType: true, sizeBytes: true, isCover: true } } }, orderBy: { updatedAt: "asc" } });
  return NextResponse.json({ products });
}
