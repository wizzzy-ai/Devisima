CREATE TYPE "SellerApplicationHistoryAction" AS ENUM ('SUBMITTED', 'RESUBMITTED', 'APPROVED', 'REJECTED');

ALTER TABLE "SellerApplication"
ADD COLUMN "rejectionReason" TEXT,
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX "SellerApplication_one_pending_per_user_idx"
ON "SellerApplication"("userId")
WHERE "status" = 'PENDING';

CREATE TABLE "SellerApplicationHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "action" "SellerApplicationHistoryAction" NOT NULL,
    "version" INTEGER NOT NULL,
    "reason" TEXT,
    "internalNote" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SellerApplicationHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SellerApplicationHistory_applicationId_createdAt_idx"
ON "SellerApplicationHistory"("applicationId", "createdAt");

CREATE INDEX "SellerApplicationHistory_reviewerId_createdAt_idx"
ON "SellerApplicationHistory"("reviewerId", "createdAt");

ALTER TABLE "SellerApplicationHistory"
ADD CONSTRAINT "SellerApplicationHistory_applicationId_fkey"
FOREIGN KEY ("applicationId") REFERENCES "SellerApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SellerApplicationHistory"
ADD CONSTRAINT "SellerApplicationHistory_reviewerId_fkey"
FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
