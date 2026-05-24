// pages/api/cart/import-local.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  try {

    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed",
      });
    }

    const session = await getServerSession(
      req,
      res,
      authOptions
    );

    if (!session?.user?.id) {
      return res.status(401).json({
        error: "Not authenticated",
      });
    }

    const userId = session.user.id;

    // -------------------------
    // GUEST ITEMS
    // -------------------------

    const guestItems = Array.isArray(req.body?.items)
      ? req.body.items
      : [];

    if (!guestItems.length) {
      return res.status(200).json({
        message: "Nothing to merge",
        items: [],
      });
    }

    // -------------------------
    // GET / CREATE USER CART
    // -------------------------

    let userCart = await prisma.cart.findFirst({
      where: { userId },

      include: {
        items: true,
      },
    });

    if (!userCart) {

      userCart = await prisma.cart.create({
        data: {
          userId,
        },

        include: {
          items: true,
        },
      });
    }

    // -------------------------
    // MAP EXISTING DB ITEMS
    // -------------------------

    const dbMap = new Map<
      string,
      {
        id: string;
        quantity: number;
      }
    >();

    userCart.items.forEach((item) => {

      dbMap.set(item.variantId, {
        id: item.id,
        quantity: item.quantity,
      });
    });

    // -------------------------
    // BUILD TRANSACTION OPS
    // -------------------------

    const ops = [];

    for (const g of guestItems) {

      const variantId = g?.variantId;

      if (!variantId) continue;

      // fetch stock
      const variant = await prisma.productVariant.findUnique({
        where: {
          id: variantId,
        },

        select: {
          stock: true,
        },
      });

      // variant deleted / invalid
      if (!variant) continue;

      const guestQty =
        typeof g.quantity === "number"
          ? g.quantity
          : 1;

      // -------------------------
      // EXISTING ITEM
      // -------------------------

      if (dbMap.has(variantId)) {

        const dbEntry = dbMap.get(variantId)!;

        const mergedQty = Math.min(
          dbEntry.quantity + guestQty,
          variant.stock
        );

        ops.push(
          prisma.cartItem.update({
            where: {
              id: dbEntry.id,
            },

            data: {
              quantity: mergedQty,
            },
          })
        );

      } else {

        // -------------------------
        // NEW ITEM
        // -------------------------

        const safeQty = Math.min(
          guestQty,
          variant.stock
        );

        // don't insert zero-stock items
        if (safeQty < 1) continue;

        ops.push(
          prisma.cartItem.create({
            data: {
              cartId: userCart.id,
              variantId,
              quantity: safeQty,
            },
          })
        );
      }
    }

    // -------------------------
    // EXECUTE TRANSACTION
    // -------------------------

    if (ops.length) {
      await prisma.$transaction(ops);
    }

    // -------------------------
    // FETCH FINAL HYDRATED CART
    // -------------------------

    const finalItems = await prisma.cartItem.findMany({
      where: {
        cartId: userCart.id,
      },

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
      message: "Guest cart merged successfully",
      items: finalItems,
    });

  } catch (error) {

    console.error(
      "Guest cart merge error:",
      error
    );

    return res.status(500).json({
      error: "Internal server error",
    });
  }
}