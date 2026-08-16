// pages/api/product/[id].ts

import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "FREE SIZE"];

function sortVariants<T extends { size: string }>(variants: T[]): T[] {
  if (!variants || !Array.isArray(variants)) return [];

  return [...variants].sort((a, b) => {
    const indexA = SIZE_ORDER.indexOf(a.size?.trim().toUpperCase());
    const indexB = SIZE_ORDER.indexOf(b.size?.trim().toUpperCase());

    const rankA = indexA === -1 ? 999 : indexA;
    const rankB = indexB === -1 ? 999 : indexB;

    return rankA - rankB;
  });
}

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

    // Sort variants to guarantee XS -> S -> M -> L -> XL hierarchy
    const sortedProduct = {
      ...product,
      variants: sortVariants(product.variants),
    };

    return res.status(200).json(sortedProduct);
  } catch (error) {
    console.error("[API PRODUCT ID ERROR]:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}