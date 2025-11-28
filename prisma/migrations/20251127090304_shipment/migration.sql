-- CreateEnum
CREATE TYPE "public"."BatchStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."ShipmentBatch" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "runAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "status" "public"."BatchStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "ShipmentBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Shipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "sequenceIndex" INTEGER NOT NULL,
    "batchId" TEXT,
    "awb" TEXT,
    "labelUrl" TEXT,
    "shippingService" TEXT,
    "weightKg" DOUBLE PRECISION,
    "lengthCm" DOUBLE PRECISION,
    "breadthCm" DOUBLE PRECISION,
    "heightCm" DOUBLE PRECISION,
    "pickupSlot" TEXT,
    "status" "public"."ShipmentStatus" NOT NULL DEFAULT 'NOT_CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShipmentEvent" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "code" TEXT,
    "message" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShipmentBatch_runAt_idx" ON "public"."ShipmentBatch"("runAt");

-- CreateIndex
CREATE INDEX "Shipment_awb_idx" ON "public"."Shipment"("awb");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_orderItemId_sequenceIndex_key" ON "public"."Shipment"("orderItemId", "sequenceIndex");

-- AddForeignKey
ALTER TABLE "public"."Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shipment" ADD CONSTRAINT "Shipment_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "public"."OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Shipment" ADD CONSTRAINT "Shipment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "public"."ShipmentBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShipmentEvent" ADD CONSTRAINT "ShipmentEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "public"."Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
