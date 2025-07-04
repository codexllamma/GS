import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = session.user.id;

  try {
    if (req.method === "GET") {
      const cartItems = await prisma.cartOrder.findMany({
        where: { userId },
        include: { product: true },
      });
      return res.status(200).json(cartItems);
    }

    if (req.method === "POST") {
      const { productId, quantity } = req.body;
      if (!productId || !quantity) {
        return res.status(400).json({ message: "productId and quantity are required" });
      }

      const existingCartItem = await prisma.cartOrder.findFirst({
        where: { userId, productId },
      });

      if (existingCartItem) {
        const updatedCartItem = await prisma.cartOrder.update({
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + quantity },
        });
        return res.status(200).json(updatedCartItem);
      } else {
        const newCartItem = await prisma.cartOrder.create({
          data: { userId, productId, quantity },
        });
        return res.status(201).json(newCartItem);
      }
    }

    if (req.method === "PUT") {
      const { cartOrderId, quantity } = req.body;
      if (!cartOrderId || quantity == null) {
        return res.status(400).json({ message: "cartOrderId and quantity are required" });
      }

      const updatedCartItem = await prisma.cartOrder.update({
        where: { id: cartOrderId },
        data: { quantity },
      });
      
      return res.status(200).json(updatedCartItem);
    }

    if (req.method === "DELETE") {
      const { cartOrderId } = req.body;
      if (!cartOrderId) {
        return res.status(400).json({ message: "cartOrderId is required" });
      }
      console.log(cartOrderId)
      await prisma.cartOrder.delete({
        where: { id: cartOrderId },
      });
      return res.status(200).json({ message: "Item removed from cart" });
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
