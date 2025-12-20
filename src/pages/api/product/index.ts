import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  
  if (req.method === "GET") {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 9;
      const skip = (page - 1) * limit;

      const category = req.query.category as string;
      const search = req.query.search as string;

      const whereClause: any = { isDeleted: false };

      // 1. Filter by Category (Strict Match)
      if (category && category !== "All") {
        whereClause.fabric = {
          category: {
            name: { equals: category, mode: "insensitive" },
          },
        };
      }

      // 2. Smart Search (Tokenized)
      // "White Shirt" -> Matches products having BOTH "White" AND "Shirt"
      if (search) {
        const searchTerms = search.trim().split(/\s+/);
        
        whereClause.AND = searchTerms.map((term) => ({
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { description: { contains: term, mode: "insensitive" } },
            { color: { contains: term, mode: "insensitive" } },
            // Also search within the Category Name (e.g., searching "Polo" finds items in Polo category)
            { 
              fabric: { 
                category: { 
                  name: { contains: term, mode: "insensitive" } 
                } 
              } 
            }
          ],
        }));
      }

      const products = await prisma.product.findMany({
        take: limit,
        skip: skip,
        where: whereClause,
        orderBy: [
          { sortOrder: "desc" },
          { createdAt: "desc" } 
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