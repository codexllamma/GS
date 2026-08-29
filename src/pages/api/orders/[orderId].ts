import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orderId, intent } = req.query;

  if (!orderId || typeof orderId !== "string") {
    return res.status(400).json({ message: "Invalid or missing order ID" });
  }

  /* ==========================================
     1. GET: Fetch Order Details
     ========================================== */
  if (req.method === "GET") {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          address: true,
          shipments: true,
          orderItems: {
            include: {
              variant: {
                select: {
                  id: true,
                  size: true,
                  price: true,
                  stock: true,
                  product: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                      color: true,
                      basePrice: true,
                      fabric: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                      images: {
                        select: {
                          id: true,
                          url: true,
                          isPrimary: true,
                        },
                        orderBy: {
                          isPrimary: "desc",
                        },
                      },
                    },
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

      if (intent === "confirmation") {
        return res.status(200).json(order);
      }

      const session = await getServerSession(req, res, authOptions);
      if (!session?.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = session.user.id;
      const isAdmin = (session.user as any).isAdmin || false;

      if (!isAdmin && order.userId !== userId) {
        return res.status(403).json({ message: "Forbidden: Access denied" });
      }

      return res.status(200).json(order);
    } catch (error) {
      console.error("[ORDER FETCH ERROR]:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  /* ==========================================
     2. PATCH / POST: Cancel Order & Restock
     ========================================== */
  if (req.method === "PATCH" || req.method === "POST") {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user?.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = session.user.id;
      const isAdmin = (session.user as any).isAdmin || false;

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: true,
          shipments: true,
        },
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (!isAdmin && order.userId !== userId) {
        return res.status(403).json({ message: "Forbidden: Access denied" });
      }

      if (order.status === "CANCELLED") {
        return res.status(400).json({ message: "Order is already cancelled." });
      }

      if (["SHIPPED", "DELIVERED"].includes(order.status)) {
        return res.status(400).json({
          message: "Order cannot be cancelled once it has shipped or delivered.",
        });
      }

      const updatedOrder = await prisma.$transaction(async (tx) => {
        const cancelled = await tx.order.update({
          where: { id: orderId },
          data: {
            status: "CANCELLED",
            shipmentStatus: "CANCELLED",
          },
        });

        for (const item of order.orderItems) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }

        return cancelled;
      });

      return res.status(200).json({
        success: true,
        message: "Order successfully cancelled and inventory restocked.",
        order: updatedOrder,
      });
    } catch (error: any) {
      console.error("[ORDER CANCEL ERROR]:", error);
      return res.status(500).json({ message: error?.message || "Internal Server Error" });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH", "POST"]);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}