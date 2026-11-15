CREATE TYPE "SellerApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "SellerApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "productTypes" TEXT NOT NULL,
    "technologies" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "portfolioUrl" TEXT,
    "additionalInfo" TEXT,
    "status" "SellerApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SellerApplication_userId_createdAt_idx" ON "SellerApplication"("userId", "createdAt");
CREATE INDEX "SellerApplication_status_createdAt_idx" ON "SellerApplication"("status", "createdAt");
CREATE INDEX "SellerApplication_reviewedById_idx" ON "SellerApplication"("reviewedById");
CREATE UNIQUE INDEX "SellerApplication_one_pending_per_user" ON "SellerApplication"("userId") WHERE "status" = 'PENDING';

ALTER TABLE "SellerApplication" ADD CONSTRAINT "SellerApplication_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SellerApplication" ADD CONSTRAINT "SellerApplication_reviewedById_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
