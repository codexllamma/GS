import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  const { orderId, intent } = req.query;

  if (!orderId || typeof orderId !== "string") {
    return res.status(400).json({ message: "Invalid or missing order ID" });
  }

  try {
    // 1. Fetch the specific order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            variant: {
              include: {
                product: {
                  include: { images: true },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 2. Intent: Order Confirmation Page (Allows Guest Checkout access)
    if (intent === "confirmation") {
      return res.status(200).json(order);
    }

    // 3. Intent: User Account / Order Details (Strict Authentication)
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = session.user.id;
    const isAdmin = (session.user as any).isAdmin || false;

    // Verify ownership
    if (!isAdmin && order.userId !== userId) {
      return res.status(403).json({ message: "Forbidden: Access denied to this order" });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}