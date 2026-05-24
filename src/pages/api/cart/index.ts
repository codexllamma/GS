// pages/api/cart/index.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;

  try {
    if (!userId) {
      return res.status(200).json({
        mode: "GUEST",
        message: "Handle cart in localStorage",
      });
    }


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

      return res.status(200).json({
        mode: "USER",
        cart: cart || { items: [] },
      });
    }

    if (req.method === "POST") {
      const { variantId, quantity = 1 } = req.body;

      if (!variantId) {
        return res.status(400).json({ message: "variantId is required" });
      }

      let cart = await prisma.cart.findFirst({ where: { userId } });
      if (!cart) {
        cart = await prisma.cart.create({ data: { userId } });
      }

      const existingItem = await prisma.cartItem.findFirst({
        where: { cartId: cart.id, variantId },
      });

  if (existingItem) {

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { stock: true },
  });

  if (!variant) {
    return res.status(404).json({ message: "Variant not found" });
  }

  const newQuantity = existingItem.quantity + quantity;

  // Prevent quantity below 1
  if (newQuantity < 1) {
    return res.status(400).json({
      message: "Quantity cannot be less than 1",
    });
  }

  // Prevent exceeding stock
  if (newQuantity > variant.stock) {
    return res.status(400).json({
      message: `Item already in cart.Only ${variant.stock} items available in stock`,
    });
  }

  const updated = await prisma.cartItem.update({
    where: { id: existingItem.id },
    data: { quantity: newQuantity },
  });

  return res.status(200).json({
    mode: "USER",
    item: updated,
  });
}

      const newItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId,
          quantity,
        },
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      });

      return res.status(201).json({ mode: "USER", item: newItem });
    }

    if (req.method === "PUT") {
      const { cartItemId, quantity, variantId } = req.body;

      if (!cartItemId) {
        return res.status(400).json({ message: "cartItemId is required" });
      }

      if (quantity != null) {

  if (!Number.isInteger(quantity)) {
    return res.status(400).json({
      message: "Quantity must be an integer",
    });
  }

  if (quantity < 1) {
    return res.status(400).json({
      message: "Quantity must be at least 1",
    });
  }

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: {
      variant: true,
    },
  });

  if (!cartItem) {
    return res.status(404).json({
      message: "Cart item not found",
    });
  }

  const availableStock = cartItem.variant.stock;

  if (quantity > availableStock) {
    return res.status(400).json({
      message: `Only ${availableStock} items available in stock`,
    });
  }

  const updatedItem = await prisma.cartItem.update({
  where: { id: cartItemId },
  data: { quantity },

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
});

  return res.status(200).json({
    mode: "USER",
    item: updatedItem,
  });
}

if (variantId) {
        const existingCartItem = await prisma.cartItem.findUnique({
  where: { id: cartItemId },
});

if (!existingCartItem) {
  return res.status(404).json({
    message: "Cart item not found",
  });
}

const newVariant = await prisma.productVariant.findUnique({
  where: { id: variantId },
});

if (!newVariant) {
  return res.status(404).json({
    message: "Variant not found",
  });
}

if (existingCartItem.quantity > newVariant.stock) {
  return res.status(400).json({
    message: `Only ${newVariant.stock} items available for this size`,
  });
}

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
});

        return res.status(200).json({ mode: "USER", item: updatedVariantItem });
      }

      return res
        .status(400)
        .json({ message: "No valid fields provided to update" });
    }

    if (req.method === "DELETE") {
      const { cartItemId } = req.body;

      if (!cartItemId) {
        return res.status(400).json({ message: "cartItemId required" });
      }

      await prisma.cartItem.delete({ where: { id: cartItemId } });

      return res.status(200).json({ mode: "USER", message: "Item removed" });
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error("Cart API error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
