import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { executeOrderSplit } from "@/lib/shiprocket/split-service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Find orders created today with no associated shipment packages yet
    const pendingOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOfToday },
        shipments: { none: {} },
      },
      select: { id: true },
    });

    const results = {
      total: pendingOrders.length,
      processed: 0,
      failed: 0,
      errors: [] as Array<{ orderId: string; error: string }>,
    };

    for (const order of pendingOrders) {
      try {
        await executeOrderSplit(order.id);
        results.processed++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({ orderId: order.id, error: err?.message || "Unknown error" });
      }
    }

    return res.status(200).json({ success: true, results });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Batch operation failed",
    });
  }
}