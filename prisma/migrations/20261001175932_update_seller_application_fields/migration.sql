/*
  Warnings:

  - You are about to drop the column `additionalInfo` on the `SellerApplication` table. All the data in the column will be lost.
  - The `productTypes` column on the `SellerApplication` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "SellerApplication" DROP COLUMN "additionalInfo",
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "whyJoin" TEXT,
DROP COLUMN "productTypes",
ADD COLUMN     "productTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
