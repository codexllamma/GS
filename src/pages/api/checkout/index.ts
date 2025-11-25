import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = session.user.id;
    const { address, paymentMethod } = req.body as {
      address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postal: string;
        country: string;
      };
      paymentMethod: "COD" | "RAZORPAY";
    };

    if (!address || !paymentMethod) {
      return res
        .status(400)
        .json({ message: "Address and payment method are required" });
    }

    // For now we *force* COD. Razorpay goes live later.
    if (paymentMethod !== "COD") {
      return res.status(400).json({ message: "Only COD is enabled currently" });
    }

    // 1. Upsert address (can be outside the TX)
    let existingAddress = await prisma.address.findFirst({
      where: {
        userId,
        line1: address.line1,
        city: address.city,
        postal: address.postal,
      },
    });

    if (!existingAddress) {
      existingAddress = await prisma.address.create({
        data: {
          userId,
          line1: address.line1,
          line2: address.line2 || null,
          city: address.city,
          state: address.state,
          postal: address.postal,
          country: address.country,
          isDefault: true,
        },
      });
    }

    // 2. Wrap everything else in a single transaction
    const order = await prisma.$transaction(async (tx) => {
      // 2.1. Fetch cart with latest data
      const cart = await tx.cart.findFirst({
        where: { userId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      // 2.2. Calculate subtotal from *live* data
      const subtotal = cart.items.reduce((sum, item) => {
        const unitPrice =
          item.variant.price ?? item.variant.product.basePrice ?? 0;
        return sum + item.quantity * unitPrice;
      }, 0);

      const deliveryCharge = subtotal > 1000 ? 0 : 50;
      const total = subtotal + deliveryCharge;

      // 2.3. Validate and decrement stock atomically
      for (const item of cart.items) {
        const result = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            stock: { gte: item.quantity }, // ensure enough stock
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (result.count === 0) {
          throw new Error(
            `Insufficient stock for variant ${item.variantId} (${item.variant.product.name} - ${item.variant.size})`
          );
        }
      }

      // 2.4. Create order + order items
      const createdOrder = await tx.order.create({
        data: {
          userId,
          addressId: existingAddress.id,
          paymentMethod: "COD",
          subtotal,
          deliveryCharge,
          total,
          isPaid: false, // COD, not actually paid yet
          status: "PROCESSING", // order placed, waiting for shipment
          shipmentStatus: "NOT_CREATED",
          orderItems: {
            create: cart.items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              priceAtPurchase:
                item.variant.price ?? item.variant.product.basePrice ?? 0,
              productId: item.variant.product.id,
            })),
          },
        },
        include: {
          orderItems: {
            include: {
              variant: { include: { product: true } },
            },
          },
        },
      });

      // 2.5. Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return createdOrder;
    });

    // 3. At this point: stock decremented, order created, cart cleared.
    // XpressBees shipment creation will plug in HERE later.

    return res.status(201).json({
      order,
      message: "Cash on Delivery order placed successfully",
    });
  } catch (error: any) {
    console.error("Checkout API error:", error);
    const message =
      error?.message === "Cart is empty"
        ? "Cart is empty"
        : error?.message?.startsWith("Insufficient stock")
        ? error.message
        : "Internal Server Error";

    const statusCode =
      message === "Cart is empty" || message.startsWith("Insufficient stock")
        ? 400
        : 500;

    return res.status(statusCode).json({
      message,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
