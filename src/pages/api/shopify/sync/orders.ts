import type { NextApiRequest, NextApiResponse } from "next";

import { syncOrder } from "@/lib/shopify/sync/orders";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
    });
  }

  try {
    const { orderId } = req.body;

    const shopifyOrder = await syncOrder(orderId);

    return res.status(200).json(shopifyOrder);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Order synchronization failed",
    });
  }
}