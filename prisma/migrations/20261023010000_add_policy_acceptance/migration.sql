CREATE TYPE "PolicyType" AS ENUM ('TERMS', 'PRIVACY', 'COOKIES', 'REFUND_POLICY');

CREATE TABLE "PolicyAcceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "policyType" "PolicyType" NOT NULL,
    "version" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'unknown',
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "metadata" JSONB,

    CONSTRAINT "PolicyAcceptance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PolicyAcceptance_userId_policyType_version_key"
    ON "PolicyAcceptance"("userId", "policyType", "version");
CREATE INDEX "PolicyAcceptance_userId_policyType_idx"
    ON "PolicyAcceptance"("userId", "policyType");
CREATE INDEX "PolicyAcceptance_acceptedAt_idx"
    ON "PolicyAcceptance"("acceptedAt");

ALTER TABLE "PolicyAcceptance"
    ADD CONSTRAINT "PolicyAcceptance_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
