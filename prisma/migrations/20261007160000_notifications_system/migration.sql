CREATE TYPE "NotificationType" AS ENUM (
  'ORDER_CREATED',
  'ORDER_PAID',
  'PAYMENT_FAILED',
  'PURCHASE_READY',
  'DOWNLOAD_AVAILABLE',
  'SELLER_APPLICATION_SUBMITTED',
  'SELLER_APPLICATION_APPROVED',
  'SELLER_APPLICATION_REJECTED',
  'PRODUCT_SUBMITTED',
  'PRODUCT_APPROVED',
  'PRODUCT_REJECTED',
  'PRODUCT_CHANGES_REQUESTED',
  'NEW_REVIEW',
  'REVIEW_APPROVED',
  'REVIEW_REJECTED',
  'PAYOUT_REQUESTED',
  'PAYOUT_APPROVED',
  'PAYOUT_PROCESSING',
  'PAYOUT_COMPLETED',
  'PAYOUT_FAILED',
  'SELLER_SALE',
  'EARNINGS_AVAILABLE',
  'REFUND_REQUESTED',
  'REFUND_APPROVED',
  'REFUND_REJECTED',
  'REFUND_COMPLETED',
  'COUPON_CREATED',
  'SYSTEM'
);

ALTER TABLE "Notification"
  ADD COLUMN "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
  ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Notification" SET "isRead" = true WHERE "readAt" IS NOT NULL;

DROP INDEX IF EXISTS "Notification_userId_readAt_createdAt_idx";
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

CREATE TABLE "NotificationPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderEmails" BOOLEAN NOT NULL DEFAULT true,
  "paymentEmails" BOOLEAN NOT NULL DEFAULT true,
  "purchaseEmails" BOOLEAN NOT NULL DEFAULT true,
  "reviewEmails" BOOLEAN NOT NULL DEFAULT true,
  "sellerEmails" BOOLEAN NOT NULL DEFAULT true,
  "payoutEmails" BOOLEAN NOT NULL DEFAULT true,
  "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
  "systemEmails" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

ALTER TABLE "NotificationPreference"
  ADD CONSTRAINT "NotificationPreference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
