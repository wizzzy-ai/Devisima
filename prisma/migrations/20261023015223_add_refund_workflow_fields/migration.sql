/*
  Warnings:

  - Made the column `reason` on table `Refund` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "RefundHistoryAction" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'MORE_INFO_REQUESTED', 'INFO_PROVIDED', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'ESCALATED');

-- AlterTable
ALTER TABLE "Refund" ADD COLUMN     "adminDecision" TEXT,
ADD COLUMN     "adminEvidence" JSONB,
ADD COLUMN     "buyerEvidence" JSONB,
ADD COLUMN     "buyerExplanation" TEXT,
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "providerResponse" JSONB,
ADD COLUMN     "providerStatus" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ALTER COLUMN "reason" SET NOT NULL;

-- CreateTable
CREATE TABLE "RefundHistory" (
    "id" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "RefundHistoryAction" NOT NULL,
    "notes" TEXT,
    "evidence" JSONB,
    "previousStatus" "RefundStatus",
    "newStatus" "RefundStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefundHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RefundHistory_refundId_createdAt_idx" ON "RefundHistory"("refundId", "createdAt");

-- CreateIndex
CREATE INDEX "RefundHistory_actorId_createdAt_idx" ON "RefundHistory"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "Refund_reviewedById_idx" ON "Refund"("reviewedById");

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundHistory" ADD CONSTRAINT "RefundHistory_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundHistory" ADD CONSTRAINT "RefundHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
