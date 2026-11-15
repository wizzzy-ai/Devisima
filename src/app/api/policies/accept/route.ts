import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { recordPolicyAcceptance } from "@/lib/policy-acceptance";

const validPolicyTypes = ["TERMS", "PRIVACY", "COOKIES", "REFUND_POLICY"] as const;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Please sign in to update consent details." }, { status: 401 });

  const payload = await request.json().catch(() => null);
  const policyType = typeof payload?.policyType === "string" ? payload.policyType : null;
  const version = typeof payload?.version === "string" ? payload.version : undefined;

  if (!policyType || !validPolicyTypes.includes(policyType as (typeof validPolicyTypes)[number])) {
    return NextResponse.json({ message: "A valid policy type is required." }, { status: 400 });
  }

  const acceptance = await recordPolicyAcceptance({
    userId: user.id,
    policyType: policyType as (typeof validPolicyTypes)[number],
    version,
    source: typeof payload?.source === "string" ? payload.source : "app",
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    metadata: payload?.metadata ?? null,
  });

  return NextResponse.json({ accepted: true, acceptance });
}
