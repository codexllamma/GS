// pages/api/product/[id].ts

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Invalid product ID." });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        variants: true,
        fabric: {
          include: { category: true },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error("[API PRODUCT ID ERROR]:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}