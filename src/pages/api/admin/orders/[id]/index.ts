import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) return res.status(401).json({ message: "Unauthorized" });

  // Extract 'id' instead of 'orderId' to match the folder name [id]
  const { id } = req.query;
  const orderId = id as string;

  if (!orderId) {
    return res.status(400).json({ message: "Missing order ID" });
  }

  // --- GET ORDER DETAILS ---
  if (req.method === "GET") {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          address: true,
          shopifyMapping: true,
          shipments: true,
          orderItems: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // If user is not admin, ensure they own the order
      if (!session.user.isAdmin && order.userId !== session.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      return res.status(200).json(order);
    } catch (error) {
      console.error("[GET ORDER ERROR]:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  // --- UPDATE ORDER STATUS (ADMIN ONLY) ---
  if (req.method === "PUT") {
    if (!session.user.isAdmin) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }

    try {
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Missing status field" });
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status },
      });

      return res.status(200).json(updatedOrder);
    } catch (error) {
      console.error("[UPDATE ORDER ERROR]:", error);
      return res.status(500).json({ message: "Failed to update order status" });
    }
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}