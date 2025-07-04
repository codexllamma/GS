// /pages/api/product/index.ts

import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: "desc" },
      });
      res.status(200).json(products);
    } catch (error) {
      console.error("[GET_PRODUCTS_ERROR]", error);
      res.status(500).json({ message: "Failed to fetch products." });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
