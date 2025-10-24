import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { categoryId } = req.query;

  try {
    if (req.method === "GET") {
      if (!categoryId || typeof categoryId !== "string") {
        return res.status(400).json({ message: "categoryId is required" });
      }

      const fabrics = await prisma.fabric.findMany({
        where: { categoryId },
        orderBy: { name: "asc" },
        select: { id: true, name: true, categoryId: true },
      });

      return res.status(200).json(fabrics);
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error("Error fetching fabrics:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
