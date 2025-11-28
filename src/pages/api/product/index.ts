import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      // --- START CHANGES ---
      // 1. Get page and limit from query params (default: Page 1, Limit 9)
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 9;
      const skip = (page - 1) * limit;

      const products = await prisma.product.findMany({
        take: limit, // Fetch only specific amount
        skip: skip,  // Skip previous items
        // --- END CHANGES (Rest remains existing logic) ---
        where: { isDeleted: false },
        orderBy: [
          { sortOrder: "desc" }, // Priority 1: Custom Order (High numbers first)
          { createdAt: "desc" }  // Priority 2: Newest first (Tie-breaker)
        ],
        include: {
          images: true,
          variants: true,
          fabric: {
            include: {
              category: true,
            },
          },
        },
      });

      // Clean up nested Prisma objects for frontend
      // (This logic remains exactly the same, it just processes fewer items per call now)
      const serializedProducts = products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        basePrice: p.basePrice,
        color: p.color,
        fabric: p.fabric?.name || null,
        category: p.fabric?.category?.name || null,
        images: p.images.map((img) => ({
          url: img.url,
          isPrimary: img.isPrimary,
        })),
        variants: p.variants.map((v) => ({
          size: v.size,
          price: v.price,
          stock: v.stock,
        })),
        createdAt: p.createdAt,
      }));

      return res.status(200).json(serializedProducts);
    } catch (error) {
      console.error("[GET_PRODUCTS_ERROR]", error);
      return res.status(500).json({ message: "Failed to fetch products." });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}