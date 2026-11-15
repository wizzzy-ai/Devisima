import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { getUserAuditLogs } from "@/lib/admin/audit";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (admin.role !== Role.ADMIN) return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });

  try {
    const { userId } = await params;
    const logs = await getUserAuditLogs(userId);
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
