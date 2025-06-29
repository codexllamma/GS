import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.isAdmin) {
    return res.status(403).json({ message: "Forbidden: Admins only." });
  }

  if (req.method === "GET") {
    try {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: "desc" },
      });
      res.status(200).json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch products." });
    }
  } else if (req.method === "POST") {
    const { name, description, price, image, category, stock } = req.body;
    if (!name || !description || !price || !image || !category || !stock) {
      return res.status(400).json({ message: "All fields are required." });
    }
    try {
      const product = await prisma.product.create({
        data: { name, description, price, image, category, stock },
      });
      res.status(201).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create product." });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
