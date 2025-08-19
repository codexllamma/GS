/*
  Warnings:

  - The `category` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."Category" AS ENUM ('HOODIE', 'TRACKS', 'JEANS', 'TSHIRTS', 'SHIRTS', 'TROUSERS');

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "category",
ADD COLUMN     "category" "public"."Category";
