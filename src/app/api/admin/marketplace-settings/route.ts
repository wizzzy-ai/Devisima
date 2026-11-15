import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db/prisma";
import { getMarketplaceSettings } from "@/lib/earnings/balance";
import { writeFinancialAudit } from "@/lib/payouts/audit";

const settingsSchema = z.object({ commissionRateBps: z.number().int().min(0).max(10_000), minimumPayout: z.number().int().min(1).max(100_000_000), earningHoldDays: z.number().int().min(0).max(365) });

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (admin.role !== "ADMIN" || admin.status !== "ACTIVE") return NextResponse.json({ message: "Administrator access is required." }, { status: 403 });
  const settings = await getMarketplaceSettings();
  return NextResponse.json({ settings }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(request: Request) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (admin.role !== "ADMIN" || admin.status !== "ACTIVE") return NextResponse.json({ message: "Administrator access is required." }, { status: 403 });
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Check commission, minimum payout, and hold period values." }, { status: 400 });
  try {
    const settings = await db.$transaction(async (tx) => {
      const saved = await tx.marketplaceSettings.upsert({ where: { id: "default" }, create: { id: "default", ...parsed.data, updatedById: admin.id }, update: { ...parsed.data, updatedById: admin.id } });
      await writeFinancialAudit(tx, { actorId: admin.id, action: "MARKETPLACE_SETTINGS_UPDATED", entityType: "MarketplaceSettings", entityId: saved.id, metadata: parsed.data });
      return saved;
    });
    return NextResponse.json({ settings, message: "Marketplace financial settings saved." });
  } catch {
    return NextResponse.json({ message: "Marketplace settings could not be saved." }, { status: 500 });
  }
}
