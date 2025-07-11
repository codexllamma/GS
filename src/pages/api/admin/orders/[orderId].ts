import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) return res.status(401).json({ message: "Unauthorized" });

  const { orderId } = req.query;

  if (req.method === "GET") {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId as string },
        include: {
          user: true,
          orderItems: {
            include: { product: true },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // If user is not admin, ensure they own the order
      if (!session.user.isAdmin && order.userId !== session.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      return res.status(200).json(order);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
