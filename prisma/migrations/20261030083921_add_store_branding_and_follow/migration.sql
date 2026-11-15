-- AlterTable
ALTER TABLE "User" ADD COLUMN     "storeAccentColor" TEXT DEFAULT '#35D0BA',
ADD COLUMN     "storeBanner" TEXT,
ADD COLUMN     "storeCategory" TEXT,
ADD COLUMN     "storeDescription" TEXT,
ADD COLUMN     "storeFacebook" TEXT,
ADD COLUMN     "storeInstagram" TEXT,
ADD COLUMN     "storeLinkedin" TEXT,
ADD COLUMN     "storeLogo" TEXT,
ADD COLUMN     "storeName" TEXT,
ADD COLUMN     "storeSupportEmail" TEXT,
ADD COLUMN     "storeTwitter" TEXT,
ADD COLUMN     "storeUrl" TEXT,
ADD COLUMN     "storeVisibility" TEXT DEFAULT 'public';

-- CreateTable
CREATE TABLE "StoreFollow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "followedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreFollow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreFollow_followerId_idx" ON "StoreFollow"("followerId");

-- CreateIndex
CREATE INDEX "StoreFollow_sellerId_idx" ON "StoreFollow"("sellerId");

-- CreateIndex
CREATE INDEX "StoreFollow_followedAt_idx" ON "StoreFollow"("followedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StoreFollow_followerId_sellerId_key" ON "StoreFollow"("followerId", "sellerId");

-- AddForeignKey
ALTER TABLE "StoreFollow" ADD CONSTRAINT "StoreFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreFollow" ADD CONSTRAINT "StoreFollow_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
