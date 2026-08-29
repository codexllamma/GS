import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { productIds } = req.body;

  if (!productIds || !Array.isArray(productIds)) {
    return res.status(400).json({ message: "Invalid product IDs array" });
  }

  try {
    const images = await prisma.productImage.findMany({
      where: {
        productId: { in: productIds },
        isPrimary: false,
      },
      select: {
        id: true,
        productId: true,
        url: true,
        isPrimary: true,
      },
      orderBy: { id: "asc" },
    });

    return res.status(200).json({ images });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch gallery batch" });
  }
}
