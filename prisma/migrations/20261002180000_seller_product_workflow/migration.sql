CREATE TYPE "ProductAssetKind" AS ENUM ('IMAGE', 'FILE');

ALTER TABLE "Product"
  ADD COLUMN "framework" TEXT,
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "requirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "videoUrl" TEXT,
  ADD COLUMN "supportPeriod" TEXT,
  ADD COLUMN "supportInformation" TEXT,
  ADD COLUMN "version" TEXT NOT NULL DEFAULT '1.0.0',
  ADD COLUMN "changelog" TEXT,
  ADD COLUMN "moderationNotes" TEXT;

CREATE TABLE "ProductAsset" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "kind" "ProductAssetKind" NOT NULL,
  "storageKey" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "isCover" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductAsset_storageKey_key" ON "ProductAsset"("storageKey");
CREATE INDEX "ProductAsset_productId_kind_createdAt_idx" ON "ProductAsset"("productId", "kind", "createdAt");

ALTER TABLE "ProductAsset"
  ADD CONSTRAINT "ProductAsset_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
