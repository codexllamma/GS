import type { NextApiRequest, NextApiResponse } from "next";
import { syncVariantInventory } from "@/lib/shopify/sync/inventory";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { variantId } = req.body;

    if (!variantId || typeof variantId !== "string") {
      return res.status(400).json({ error: "variantId is required" });
    }

    await syncVariantInventory(variantId);

    return res.status(200).json({
      success: true,
      message: `Inventory synchronized with Shopify for variant: ${variantId}`,
    });
  } catch (error: any) {
    console.error("[INVENTORY SYNC ERROR]:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Variant inventory synchronization failed",
    });
  }
}