import "server-only";
import type { FinancialAuditAction, Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";

type Database = typeof db | Prisma.TransactionClient;

export async function writeFinancialAudit(database: Database, input: {
  actorId?: string | null;
  action: FinancialAuditAction;
  entityType: string;
  entityId: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await database.financialAuditLog.create({ data: {
    actorId: input.actorId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    amount: input.amount,
    currency: input.currency,
    metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
  } });
}
