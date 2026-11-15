import { Prisma, PolicyType } from "@prisma/client";
import { db } from "@/lib/db/prisma";

export const POLICY_VERSIONS = {
  TERMS: "2026-10-10",
  PRIVACY: "2026-10-10",
  COOKIES: "2026-10-10",
  REFUND_POLICY: "2026-10-10",
} as const;

const POLICY_TYPES = [
  "TERMS",
  "PRIVACY",
  "COOKIES",
  "REFUND_POLICY",
] as const satisfies readonly PolicyType[];

export type PolicyTypeValue = (typeof POLICY_TYPES)[number];

export async function recordPolicyAcceptance({
  userId,
  policyType,
  version,
  source = "app",
  ipAddress,
  metadata,
}: {
  userId: string;
  policyType: PolicyTypeValue;
  version?: string;
  source?: string;
  ipAddress?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  const targetVersion = version ?? POLICY_VERSIONS[policyType as keyof typeof POLICY_VERSIONS];

  return db.policyAcceptance.upsert({
    where: {
      userId_policyType_version: {
        userId,
        policyType,
        version: targetVersion,
      },
    },
    create: {
      userId,
      policyType,
      version: targetVersion,
      source,
      ipAddress: ipAddress ?? undefined,
      metadata: metadata ?? undefined,
    },
    update: {
      source,
      ipAddress: ipAddress ?? undefined,
      metadata: metadata ?? undefined,
      acceptedAt: new Date(),
    },
  });
}
