CREATE TABLE "ProductView" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "userId" TEXT,
  "sessionKey" TEXT NOT NULL,
  "viewDate" DATE NOT NULL,
  "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductView_productId_sessionKey_viewDate_key"
  ON "ProductView"("productId", "sessionKey", "viewDate");
CREATE INDEX "ProductView_productId_viewedAt_idx"
  ON "ProductView"("productId", "viewedAt");
CREATE INDEX "ProductView_viewDate_idx"
  ON "ProductView"("viewDate");

ALTER TABLE "ProductView"
  ADD CONSTRAINT "ProductView_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
