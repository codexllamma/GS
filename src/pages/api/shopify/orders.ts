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

    if (!orderId) {
      return res.status(400).json({
        error: "orderId is required",
      });
    }

    const order = await syncOrder(orderId);

    return res.status(200).json(order);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to synchronize order.",
    });
  }
}