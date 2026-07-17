import type { NextApiRequest, NextApiResponse } from "next";

import { syncProduct } from "@/lib/shopify/sync/products";

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
    const { productId } = req.body;

    const product = await syncProduct(productId);

    return res.status(200).json(product);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Product synchronization failed",
    });
  }
}