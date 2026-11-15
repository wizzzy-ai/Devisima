import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { readPrivateAsset } from "@/lib/products/private-storage";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; assetId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  if (user.role !== "ADMIN" || user.status !== "ACTIVE") return NextResponse.json({ message: "Administrator access required." }, { status: 403 });
  const { id, assetId } = await params;
  const asset = await db.productAsset.findFirst({ where: { id: assetId, productId: id, kind: "FILE" } });
  if (!asset) return NextResponse.json({ message: "Private product file not found." }, { status: 404 });
  try {
    const bytes = await readPrivateAsset(asset.storageKey);
    return new Response(bytes, { headers: { "Content-Type": "application/zip", "Content-Length": String(asset.sizeBytes), "Content-Disposition": `attachment; filename="${asset.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}"`, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ message: "Private product file is unavailable." }, { status: 404 });
  }
}
