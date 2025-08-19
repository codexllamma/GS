import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.isAdmin) {
    return res.status(403).json({ message: "Forbidden: Admins only." });
  }

  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ message: "Invalid ID" });
  }

  if (req.method === "PUT") {
    const { name, description, price, image, category, stock } = req.body;
    if (!name || !description || !price || !image || !category || !stock) {
      return res.status(400).json({ message: "All fields are required." });
    }
    try {
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: { name, description, price, image, category, stock },
      });
      res.status(200).json(updatedProduct);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update product." });
    }
  } else if (req.method === "DELETE") {
    try {
      await prisma.product.update({ where: { id } , data: { isDeleted:  true },});
      res.status(200).json({ message: "Product deleted successfully." });
    } catch (error) {
      console.error(error);
      console.error("Delete error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      res.status(500).json({ message: "Failed to delete product." });
    }
  } else {
    res.setHeader("Allow", ["PUT", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
