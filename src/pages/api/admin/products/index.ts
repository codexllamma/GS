import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.isAdmin) {
    return res.status(403).json({ message: "Forbidden: Admins only." });
  }

  try {
    switch (req.method) {
    
      case "GET": {
        const products = await prisma.product.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            fabric: { include: { category: true } },
            variants: true,
            images: true,
          },
        });
        return res.status(200).json(products);
      }

      case "POST": {
        const {
          name,
          description,
          basePrice,
          color,
          fabricId,
          images,
          variants,
        } = req.body;

        // Validate required fields
        if (!name || !description || !basePrice || !color || !fabricId) {
          return res.status(400).json({ message: "Missing required fields." });
        }

        if (!Array.isArray(images) || images.length === 0) {
          return res.status(400).json({ message: "At least one image is required." });
        }

        if (!Array.isArray(variants) || variants.length === 0) {
          return res.status(400).json({ message: "At least one variant is required." });
        }

        // Create product with relations
        const product = await prisma.product.create({
          data: {
            name,
            description,
            basePrice: Number(basePrice),
            color,
            fabric: {
              connect: { id: fabricId },
            },
            images: {
              create: images.map((url: string, index: number) => ({
                url,
                isPrimary: index === 0,
              })),
            },
            variants: {
              create: variants.map((v: any) => ({
                size: v.size,
                price: Number(v.price) || 0,
                stock: Number(v.stock) || 0,
              })),
            },
          },
          include: {
            fabric: { include: { category: true } },
            variants: true,
            images: true,
          },
        });

        return res.status(201).json(product);
      }


      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error("Admin product handler error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
