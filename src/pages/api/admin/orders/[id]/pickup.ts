import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { scheduleShiprocketPickup } from "@/lib/shiprocket/split-service"; // Adjust your path

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });
  
  const { id } = req.query;

  try {
    // 1. Fetch order & shipments
    const order = await prisma.order.findUnique({
      where: { id: String(id) },
      include: { shipments: true },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    // 2. We only need to trigger pickup for the FIRST valid shipment ID for the entire order block
    const validShipment = order.shipments.find(s => s.shiprocketShipmentId && s.awbCode);
    
    if (!validShipment) {
      return res.status(400).json({ message: "No valid AWBs found. Generate AWBs first before scheduling pickup." });
    }

    // 3. Trigger Pickup via Shiprocket
    const result = await scheduleShiprocketPickup(validShipment.shiprocketShipmentId!);
    
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("[PICKUP ERROR]", error);
    return res.status(500).json({ message: error.message || "Failed to schedule pickup" });
  }
}