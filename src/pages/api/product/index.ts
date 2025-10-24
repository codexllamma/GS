import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const products = await prisma.product.findMany({
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
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
