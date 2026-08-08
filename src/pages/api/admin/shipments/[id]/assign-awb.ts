import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { assignAwbForShipment } from "@/lib/shiprocket/shipment-service";
import { syncFulfillmentToShopify } from "@/lib/shopify/fulfillment-service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Missing shipment ID" });
  }

  try {
    // 1. Assign AWB code in Shiprocket and update DB
    const shipment = await assignAwbForShipment(id);

    // 2. Sync tracking details & AWB code upstream to Shopify
    try {
      await syncFulfillmentToShopify(shipment.id);
    } catch (shopifyErr: any) {
      console.warn(`[SHOPIFY FULFILLMENT SYNC WARN]: AWB assigned for ${id}, but Shopify sync failed:`, shopifyErr?.message);
    }

    return res.status(200).json({ success: true, shipment });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to assign AWB",
    });
  }
}