// pages/api/orders/[orderId].ts

import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orderId } = req.query;

  if (!orderId || typeof orderId !== "string") {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  if (req.method === "GET") {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          address: {
            select: {
              line1: true,
              line2: true,
              city: true,
              state: true,
              postal: true,
              country: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  basePrice: true,
                  color: true,
                  fabric: {
                    select: { name: true },
                  },
                  images: {
                    select: { url: true },
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

      // Optional session check: If logged in, ensure non-admins can't view others' orders.
      // For guest checkouts (no session), allow viewing via unguessable UUID orderId.
      const session = await getServerSession(req, res, authOptions);

      if (session?.user && !session.user.isAdmin) {
        // If user is logged in, restrict to their own order
        if (order.userId && order.userId !== session.user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }

      return res.status(200).json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  res.setHeader("Allow", ["GET"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}