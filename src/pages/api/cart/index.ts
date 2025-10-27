import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ message: "Unauthorized" });

  const userId = session.user.id;

  try {
    
    if (req.method === "GET") {
      const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    images: true,
                    variants: true,
                    fabric: {             
                      include: {
                        category: true,
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


      return res.status(200).json(cart || { items: [] });
    }

    
    if (req.method === "POST") {
      const { variantId, quantity = 1 } = req.body;

      if (!variantId) return res.status(400).json({ message: "variantId is required" });

      
      let cart = await prisma.cart.findFirst({ where: { userId } });
      if (!cart) {
        cart = await prisma.cart.create({ data: { userId } });
      }

      
      const existingItem = await prisma.cartItem.findFirst({
        where: { cartId: cart.id, variantId },
      });

      if (existingItem) {
        
        const updated = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
        });
        return res.status(200).json(updated);
      }

      
      const newItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId,
          quantity,
        },
        include: {
          variant: {
            include: { product: true },
          },
        },
      });

      return res.status(201).json(newItem);
    }

    
    if (req.method === "PUT") {
        const { cartItemId, quantity, variantId } = req.body;
        if (!cartItemId)
          return res.status(400).json({ message: "cartItemId is required" });

        
        if (quantity != null) {
          const updatedItem = await prisma.cartItem.update({
            where: { id: cartItemId },
            data: { quantity },
          });
          return res.status(200).json(updatedItem);
        }

        
        if (variantId) {
          const updatedVariantItem = await prisma.cartItem.update({
            where: { id: cartItemId },
            data: { variantId },
            include: {
              variant: {
                include: {
                  product: {
                    include: {
                      images: true,
                      variants: true,
                    },
                  },
                },
              },
            },
          });

          return res.status(200).json(updatedVariantItem);
        }


        return res.status(400).json({ message: "No valid fields provided to update" });
      }


    
    if (req.method === "DELETE") {
      const { cartItemId } = req.body;
      if (!cartItemId) return res.status(400).json({ message: "cartItemId required" });

      await prisma.cartItem.delete({ where: { id: cartItemId } });
      return res.status(200).json({ message: "Item removed" });
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error("Cart API error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
