// pages/api/cart/import-local.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id)
    return res.status(401).json({ error: "Not authenticated" });

  const userId = session.user.id;

  // Guest items
  const guestItems = Array.isArray(req.body?.items) ? req.body.items : [];

  if (!guestItems.length)
    return res.status(200).json({ message: "Nothing to merge", items: [] });

  let userCart = await prisma.cart.findFirst({
    where: { userId },
    include: {
      items: true,
    },
  });

  if (!userCart) {
    userCart = await prisma.cart.create({
      data: { userId },
      include: { items: true },
    });
  }

  const dbItems = userCart.items;
  const dbMap = new Map<string, { id: string; quantity: number }>();
  dbItems.forEach((i) => dbMap.set(i.variantId, { id: i.id, quantity: i.quantity }));

  const ops = [];

  for (const g of guestItems) {
    const variantId = g?.variant?.id;
    if (!variantId) continue;

    if (dbMap.has(variantId)) {
      // Item exists → merge (sum qty)
      const dbEntry = dbMap.get(variantId)!;
      const newQty = dbEntry.quantity + g.quantity;

      ops.push(
        prisma.cartItem.update({
          where: { id: dbEntry.id },
          data: { quantity: newQty },
        })
      );
    } else {
      // Insert new record
      ops.push(
        prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            variantId,
            quantity: g.quantity,
          },
        })
      );
    }
  }

  if (ops.length) await prisma.$transaction(ops);

  const finalItems = await prisma.cartItem.findMany({
    where: { cartId: userCart.id },
    include: {
      variant: {
        include: {
          product: {
            include: {
              images: true,
              variants: true,
              fabric: { include: { category: true } },
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
}
