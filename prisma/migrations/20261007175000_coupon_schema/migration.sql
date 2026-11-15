DO $$
BEGIN
  CREATE TYPE "CouponDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Cart"
  ADD COLUMN IF NOT EXISTS "couponCode" TEXT,
  ADD COLUMN IF NOT EXISTS "couponDiscountAmount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "couponCode" TEXT,
  ADD COLUMN IF NOT EXISTS "couponDiscountAmount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "Coupon" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "discountType" "CouponDiscountType" NOT NULL,
  "discountValue" INTEGER NOT NULL,
  "minimumOrderAmount" INTEGER NOT NULL DEFAULT 0,
  "maximumDiscountAmount" INTEGER,
  "usageLimit" INTEGER,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "perUserLimit" INTEGER,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdById" TEXT NOT NULL,
  "sellerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CouponProduct" (
  "id" TEXT NOT NULL,
  "couponId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  CONSTRAINT "CouponProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CouponCategory" (
  "id" TEXT NOT NULL,
  "couponId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  CONSTRAINT "CouponCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CouponSeller" (
  "id" TEXT NOT NULL,
  "couponId" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  CONSTRAINT "CouponSeller_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CouponUsage" (
  "id" TEXT NOT NULL,
  "couponId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderId" TEXT,
  "discountAmount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX IF NOT EXISTS "Coupon_expiresAt_idx" ON "Coupon"("expiresAt");
CREATE INDEX IF NOT EXISTS "Coupon_isActive_idx" ON "Coupon"("isActive");
CREATE INDEX IF NOT EXISTS "Coupon_createdById_idx" ON "Coupon"("createdById");
CREATE INDEX IF NOT EXISTS "Coupon_sellerId_idx" ON "Coupon"("sellerId");

CREATE UNIQUE INDEX IF NOT EXISTS "CouponProduct_couponId_productId_key" ON "CouponProduct"("couponId", "productId");
CREATE INDEX IF NOT EXISTS "CouponProduct_productId_idx" ON "CouponProduct"("productId");
CREATE UNIQUE INDEX IF NOT EXISTS "CouponCategory_couponId_categoryId_key" ON "CouponCategory"("couponId", "categoryId");
CREATE INDEX IF NOT EXISTS "CouponCategory_categoryId_idx" ON "CouponCategory"("categoryId");
CREATE UNIQUE INDEX IF NOT EXISTS "CouponSeller_couponId_sellerId_key" ON "CouponSeller"("couponId", "sellerId");
CREATE INDEX IF NOT EXISTS "CouponSeller_sellerId_idx" ON "CouponSeller"("sellerId");
CREATE UNIQUE INDEX IF NOT EXISTS "CouponUsage_couponId_userId_orderId_key" ON "CouponUsage"("couponId", "userId", "orderId");
CREATE INDEX IF NOT EXISTS "CouponUsage_couponId_createdAt_idx" ON "CouponUsage"("couponId", "createdAt");
CREATE INDEX IF NOT EXISTS "CouponUsage_userId_createdAt_idx" ON "CouponUsage"("userId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"Coupon"'::regclass AND conname = 'Coupon_createdById_fkey') THEN
    ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"CouponProduct"'::regclass AND conname = 'CouponProduct_couponId_fkey') THEN
    ALTER TABLE "CouponProduct" ADD CONSTRAINT "CouponProduct_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"CouponProduct"'::regclass AND conname = 'CouponProduct_productId_fkey') THEN
    ALTER TABLE "CouponProduct" ADD CONSTRAINT "CouponProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"CouponCategory"'::regclass AND conname = 'CouponCategory_couponId_fkey') THEN
    ALTER TABLE "CouponCategory" ADD CONSTRAINT "CouponCategory_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"CouponCategory"'::regclass AND conname = 'CouponCategory_categoryId_fkey') THEN
    ALTER TABLE "CouponCategory" ADD CONSTRAINT "CouponCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"CouponSeller"'::regclass AND conname = 'CouponSeller_couponId_fkey') THEN
    ALTER TABLE "CouponSeller" ADD CONSTRAINT "CouponSeller_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"CouponUsage"'::regclass AND conname = 'CouponUsage_couponId_fkey') THEN
    ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"CouponUsage"'::regclass AND conname = 'CouponUsage_userId_fkey') THEN
    ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"CouponUsage"'::regclass AND conname = 'CouponUsage_orderId_fkey') THEN
    ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
