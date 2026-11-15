ALTER TABLE "OrderItem" ADD COLUMN "productVersion" TEXT;
ALTER TABLE "Purchase" ADD COLUMN "purchasedPrice" INTEGER;
ALTER TABLE "Purchase" ADD COLUMN "purchasedVersion" TEXT;

UPDATE "Purchase" SET
  "purchasedPrice" = "OrderItem"."priceAtPurchase",
  "purchasedVersion" = "OrderItem"."productVersion"
FROM "OrderItem"
WHERE "Purchase"."orderItemId" = "OrderItem"."id";

ALTER TABLE "Purchase" ALTER COLUMN "purchasedPrice" SET NOT NULL;

CREATE TABLE "Download" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "fileId" TEXT,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Download_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Download_purchaseId_downloadedAt_idx" ON "Download"("purchaseId", "downloadedAt");
CREATE INDEX "Download_userId_downloadedAt_idx" ON "Download"("userId", "downloadedAt");
CREATE INDEX "Download_productId_downloadedAt_idx" ON "Download"("productId", "downloadedAt");
CREATE INDEX "Download_fileId_downloadedAt_idx" ON "Download"("fileId", "downloadedAt");

ALTER TABLE "Download" ADD CONSTRAINT "Download_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Download" ADD CONSTRAINT "Download_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Download" ADD CONSTRAINT "Download_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Download" ADD CONSTRAINT "Download_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "ProductAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
