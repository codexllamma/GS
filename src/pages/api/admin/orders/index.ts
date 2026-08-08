import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.isAdmin) {
    return res.status(401).json({ message: "Unauthorized: Admin access required" });
  }

  if (req.method === "GET") {
    try {
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          address: true,
          shopifyMapping: true, // Populates Shopify Order ID badge
          shipments: true,      // Populates Shiprocket Split Packages count & tabs
          orderItems: {
            include: {
              product: true,
              variant: true,    // Populates Variant Size & Price
            },
          },
        },
      });

      return res.status(200).json(orders);
    } catch (error) {
      console.error("[GET ALL ORDERS ERROR]:", error);
      return res.status(500).json({ message: "Server error fetching orders" });
    }
  }

  res.setHeader("Allow", ["GET"]);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}