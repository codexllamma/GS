/*
  Warnings:

  - You are about to drop the column `productId` on the `CartItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Cart` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cartId,variantId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."ShipmentStatus" AS ENUM ('NOT_CREATED', 'BOOKED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RTO', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "public"."CartItem" DROP CONSTRAINT "CartItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CartItem" DROP CONSTRAINT "CartItem_variantId_fkey";

-- AlterTable
ALTER TABLE "public"."CartItem" DROP COLUMN "productId";

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "awb" TEXT,
ADD COLUMN     "labelUrl" TEXT,
ADD COLUMN     "shipmentStatus" "public"."ShipmentStatus" NOT NULL DEFAULT 'NOT_CREATED';

-- AlterTable
ALTER TABLE "public"."ProductVariant" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "price" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "public"."Cart"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_variantId_key" ON "public"."CartItem"("cartId", "variantId");

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
