import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  // 🔒 Only admins allowed
  if (!session?.user?.isAdmin) {
    return res.status(403).json({ message: "Forbidden: Admins only." });
  }

  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ message: "Invalid product ID." });
  }

  switch (req.method) {
    /**
     * 🧩 PUT - Update product (base details + optional variants)
     */
    case "PUT": {
      const { name, description, basePrice, color, fabricId, variants, images } = req.body;

      if (!name || !description || !basePrice || !color || !fabricId) {
        return res.status(400).json({ message: "Missing required fields." });
      }

      try {
        // Update main product data
        const updatedProduct = await prisma.product.update({
          where: { id },
          data: {
            name,
            description,
            color,
            basePrice: Number(basePrice),
            fabricId,
            // optional cascade updates
            ...(Array.isArray(images) && images.length > 0 && {
              images: {
                deleteMany: {}, // clear existing
                create: images.map((url: string, i: number) => ({
                  url,
                  isPrimary: i === 0,
                })),
              },
            }),
            ...(Array.isArray(variants) && variants.length > 0 && {
              variants: {
                deleteMany: {}, // remove existing variants
                create: variants.map(
                  (variant: { size: string; price?: number; stock?: number }) => ({
                    size: variant.size,
                    price: variant.price ?? null,
                    stock: variant.stock ?? 0,
                  })
                ),
              },
            }),
          },
          include: {
            variants: true,
            images: true,
          },
        });

        return res.status(200).json(updatedProduct);
      } catch (error) {
        console.error("Update product error:", error);
        return res.status(500).json({ message: "Failed to update product." });
      }
    }

    /**
     * 🗑️ DELETE - Soft delete product
     */
    case "DELETE": {
      try {
        await prisma.product.update({
          where: { id },
          data: { isDeleted: true },
        });
        return res.status(200).json({ message: "Product deleted successfully." });
      } catch (error) {
        console.error("Delete product error:", error);
        return res.status(500).json({ message: "Failed to delete product." });
      }
    }

    default: {
      res.setHeader("Allow", ["PUT", "DELETE"]);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }
}
