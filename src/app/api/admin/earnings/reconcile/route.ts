import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { previewMissingSellerEarnings, reconcileMissingSellerEarnings } from "@/lib/earnings/reconciliation";

export const runtime = "nodejs";

const requestSchema = z.object({
  action: z.enum(["preview", "apply"]).default("preview"),
  limit: z.number().int().min(1).max(100).default(50),
});

export async function GET(request: Request) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (admin.role !== "ADMIN") return NextResponse.json({ message: "Administrator access is required." }, { status: 403 });
  const rawLimit = Number(new URL(request.url).searchParams.get("limit") ?? "50");
  const limit = Number.isSafeInteger(rawLimit) ? Math.min(100, Math.max(1, rawLimit)) : 50;
  try {
    const result = await previewMissingSellerEarnings(limit);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Seller earnings reconciliation preview failed", error);
    return NextResponse.json({ message: "The reconciliation preview could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (admin.role !== "ADMIN") return NextResponse.json({ message: "Administrator access is required." }, { status: 403 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Choose a valid reconciliation action and batch size." }, { status: 400 });
  try {
    if (parsed.data.action === "preview") {
      return NextResponse.json(await previewMissingSellerEarnings(parsed.data.limit), { headers: { "Cache-Control": "private, no-store" } });
    }
    const result = await reconcileMissingSellerEarnings(parsed.data.limit, admin.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Seller earnings reconciliation failed", error);
    return NextResponse.json({ message: "Missing seller earnings could not be reconciled." }, { status: 500 });
  }
}
