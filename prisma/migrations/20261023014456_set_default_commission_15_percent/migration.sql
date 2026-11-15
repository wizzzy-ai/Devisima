-- AlterTable
ALTER TABLE "MarketplaceSettings" ALTER COLUMN "commissionRateBps" SET DEFAULT 1500;

-- AlterTable
ALTER TABLE "NotificationPreference" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "MarketplaceSettings_updatedById_idx" ON "MarketplaceSettings"("updatedById");
