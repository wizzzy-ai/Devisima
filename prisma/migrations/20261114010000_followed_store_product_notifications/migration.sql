ALTER TYPE "NotificationType" ADD VALUE 'FOLLOWED_STORE_NEW_PRODUCT';

ALTER TABLE "Product" ADD COLUMN "firstPublishedAt" TIMESTAMP(3);

UPDATE "Product"
SET "firstPublishedAt" = "publishedAt"
WHERE "status" = 'PUBLISHED' AND "publishedAt" IS NOT NULL;
