CREATE TYPE "SellerTransactionType" AS ENUM ('SALE', 'REFUND', 'COMMISSION', 'PAYOUT', 'PAYOUT_REVERSAL', 'ADJUSTMENT');
CREATE TYPE "SellerTransactionStatus" AS ENUM ('PENDING', 'AVAILABLE', 'PAID', 'REVERSED', 'FAILED');
CREATE TYPE "SellerPayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED');
CREATE TYPE "PayoutAttemptStatus" AS ENUM ('PROCESSING', 'PAID', 'FAILED', 'REVERSED');
CREATE TYPE "FinancialAuditAction" AS ENUM ('SALE_EARNING_CREATED', 'REFUND_EARNING_REVERSED', 'PAYOUT_REQUESTED', 'PAYOUT_APPROVED', 'PAYOUT_REJECTED', 'PAYOUT_PROCESSING', 'PAYOUT_COMPLETED', 'PAYOUT_FAILED', 'PAYOUT_CANCELLED', 'PAYOUT_RETRIED', 'PAYOUT_ACCOUNT_UPDATED', 'MARKETPLACE_SETTINGS_UPDATED');

CREATE TABLE "MarketplaceSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "commissionRateBps" INTEGER NOT NULL DEFAULT 0,
  "minimumPayout" INTEGER NOT NULL DEFAULT 10000,
  "earningHoldDays" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketplaceSettings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MarketplaceSettings_commissionRateBps_check" CHECK ("commissionRateBps" >= 0 AND "commissionRateBps" <= 10000),
  CONSTRAINT "MarketplaceSettings_minimumPayout_check" CHECK ("minimumPayout" >= 1),
  CONSTRAINT "MarketplaceSettings_earningHoldDays_check" CHECK ("earningHoldDays" >= 0 AND "earningHoldDays" <= 365)
);
INSERT INTO "MarketplaceSettings" ("id", "commissionRateBps", "minimumPayout", "earningHoldDays", "currency", "updatedAt") VALUES ('default', 0, 10000, 0, 'NGN', CURRENT_TIMESTAMP);

CREATE TABLE "SellerPayoutAccount" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "bankCode" TEXT NOT NULL,
  "accountName" TEXT NOT NULL,
  "accountNumberEncrypted" TEXT NOT NULL,
  "accountLast4" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'PAYSTACK',
  "recipientCode" TEXT NOT NULL,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SellerPayoutAccount_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SellerPayout" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "payoutAccountId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "status" "SellerPayoutStatus" NOT NULL DEFAULT 'PENDING',
  "reference" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "recipientCode" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "accountLast4" TEXT NOT NULL,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "processedAt" TIMESTAMP(3),
  "failureReason" TEXT,
  CONSTRAINT "SellerPayout_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SellerPayout_amount_check" CHECK ("amount" > 0)
);
CREATE TABLE "PayoutAttempt" (
  "id" TEXT NOT NULL,
  "payoutId" TEXT NOT NULL,
  "transferReference" TEXT NOT NULL,
  "transferCode" TEXT,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "status" "PayoutAttemptStatus" NOT NULL DEFAULT 'PROCESSING',
  "providerStatus" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PayoutAttempt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PayoutAttempt_amount_check" CHECK ("amount" > 0)
);
CREATE TABLE "SellerTransaction" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "orderId" TEXT,
  "orderItemId" TEXT,
  "productId" TEXT,
  "payoutId" TEXT,
  "type" "SellerTransactionType" NOT NULL,
  "grossAmount" INTEGER NOT NULL,
  "commissionAmount" INTEGER NOT NULL,
  "netAmount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "status" "SellerTransactionStatus" NOT NULL DEFAULT 'PENDING',
  "availableAt" TIMESTAMP(3),
  "sourceKey" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SellerTransaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SellerTransaction_sourceKey_key" UNIQUE ("sourceKey")
);
CREATE TABLE "FinancialAuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" "FinancialAuditAction" NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "amount" INTEGER,
  "currency" TEXT,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinancialAuditLog_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "href" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SellerPayoutAccount_sellerId_key" ON "SellerPayoutAccount"("sellerId");
CREATE INDEX "SellerPayoutAccount_isVerified_updatedAt_idx" ON "SellerPayoutAccount"("isVerified", "updatedAt");
CREATE UNIQUE INDEX "SellerPayout_reference_key" ON "SellerPayout"("reference");
CREATE UNIQUE INDEX "SellerPayout_sellerId_idempotencyKey_key" ON "SellerPayout"("sellerId", "idempotencyKey");
CREATE INDEX "SellerPayout_sellerId_requestedAt_idx" ON "SellerPayout"("sellerId", "requestedAt");
CREATE INDEX "SellerPayout_status_requestedAt_idx" ON "SellerPayout"("status", "requestedAt");
CREATE UNIQUE INDEX "SellerPayout_one_active_per_seller_idx" ON "SellerPayout"("sellerId") WHERE "status" IN ('PENDING', 'PROCESSING');
CREATE UNIQUE INDEX "PayoutAttempt_transferReference_key" ON "PayoutAttempt"("transferReference");
CREATE INDEX "PayoutAttempt_payoutId_createdAt_idx" ON "PayoutAttempt"("payoutId", "createdAt");
CREATE INDEX "PayoutAttempt_status_createdAt_idx" ON "PayoutAttempt"("status", "createdAt");
CREATE INDEX "SellerTransaction_sellerId_createdAt_idx" ON "SellerTransaction"("sellerId", "createdAt");
CREATE INDEX "SellerTransaction_sellerId_status_availableAt_idx" ON "SellerTransaction"("sellerId", "status", "availableAt");
CREATE INDEX "SellerTransaction_orderId_idx" ON "SellerTransaction"("orderId");
CREATE INDEX "SellerTransaction_orderItemId_idx" ON "SellerTransaction"("orderItemId");
CREATE INDEX "SellerTransaction_productId_idx" ON "SellerTransaction"("productId");
CREATE INDEX "SellerTransaction_payoutId_idx" ON "SellerTransaction"("payoutId");
CREATE INDEX "FinancialAuditLog_actorId_createdAt_idx" ON "FinancialAuditLog"("actorId", "createdAt");
CREATE INDEX "FinancialAuditLog_action_createdAt_idx" ON "FinancialAuditLog"("action", "createdAt");
CREATE INDEX "FinancialAuditLog_entityType_entityId_idx" ON "FinancialAuditLog"("entityType", "entityId");
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

ALTER TABLE "MarketplaceSettings" ADD CONSTRAINT "MarketplaceSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SellerPayoutAccount" ADD CONSTRAINT "SellerPayoutAccount_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SellerPayout" ADD CONSTRAINT "SellerPayout_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SellerPayout" ADD CONSTRAINT "SellerPayout_payoutAccountId_fkey" FOREIGN KEY ("payoutAccountId") REFERENCES "SellerPayoutAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PayoutAttempt" ADD CONSTRAINT "PayoutAttempt_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "SellerPayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SellerTransaction" ADD CONSTRAINT "SellerTransaction_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SellerTransaction" ADD CONSTRAINT "SellerTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SellerTransaction" ADD CONSTRAINT "SellerTransaction_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SellerTransaction" ADD CONSTRAINT "SellerTransaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SellerTransaction" ADD CONSTRAINT "SellerTransaction_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "SellerPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialAuditLog" ADD CONSTRAINT "FinancialAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
