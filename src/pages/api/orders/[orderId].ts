import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { orderId } = req.query;
  if (!orderId || typeof orderId !== "string") {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  const userId = session.user.id;
  const isAdmin = (session.user as any).isAdmin || false;

  try {
    const order = await prisma.order.findFirst({
      where: isAdmin ? { id: orderId } : { id: orderId, userId },
      include: {
        address: true,
        orderItems: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order record not found" });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order detail:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}