import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { useState } from "react";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const [error, setError] = useState();

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
      const serializedCart = cartItems.map((item) => ({
        ...item,
        product: {
          ...item.product,
          createdAt: item.product.createdAt.toISOString(),
        },
      }));
      
      return res.status(200).json(serializedCart);
      
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
        
        return res.status(409).json({
          message: "Product already exists in cart and the quantity can be incremented there."
        });
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

  try {
    // Fetch cart item with product
    const cartOrder = await prisma.cartOrder.findUnique({
      where: { id: cartOrderId },
      include: { product: true },
    });
    
    console.log("Incoming cartOrderId:", cartOrderId);
    if (!cartOrder) {
      return res.status(404).json({ message: "Cart item not found." });
    }

    if (quantity > cartOrder.product.stock) {
    const availableStock = cartOrder.product.stock;
    return res.status(400).json({
      message:
        availableStock === 0
          ? "This product is currently out of stock."
          : `Only ${availableStock} unit${availableStock > 1 ? "s" : ""} available for purchase.`,
    });
   }


    const updatedCartItem = await prisma.cartOrder.update({
      where: { id: cartOrderId },
      data: { quantity },
    });

    return res.status(200).json(updatedCartItem);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error." });
  }
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
