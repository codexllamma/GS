/*
  Warnings:

  - The values [ONLINE] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."PaymentMethod_new" AS ENUM ('COD', 'RAZORPAY');
ALTER TABLE "public"."Order" ALTER COLUMN "paymentMethod" TYPE "public"."PaymentMethod_new" USING ("paymentMethod"::text::"public"."PaymentMethod_new");
ALTER TYPE "public"."PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "public"."PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
COMMIT;
