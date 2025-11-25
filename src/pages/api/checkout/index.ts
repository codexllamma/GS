import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

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
    const { address, paymentMethod } = req.body;

    if (!address || !paymentMethod) {
      return res.status(400).json({ message: "Address and payment method are required" });
    }

    // 1) Ensure address exists or create
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

    // 2) Transaction: validate stock, create order, clear cart
    const order = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findFirst({
        where: { userId },
        include: {
          items: {
            include: { variant: { include: { product: true } } },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      const subtotal = cart.items.reduce((sum, item) => {
        const price = item.variant.price ?? item.variant.product.basePrice ?? 0;
        return sum + item.quantity * price;
      }, 0);

      const deliveryCharge = 0;
      const total = subtotal + deliveryCharge;

      for (const item of cart.items) {
        const result = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        if (result.count === 0) {
          throw new Error(
            `Insufficient stock for ${item.variant.product.name} - ${item.variant.size}`
          );
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          userId,
          addressId: existingAddress.id,
          paymentMethod,
          subtotal,
          deliveryCharge,
          total,
          status: paymentMethod === "COD" ? "PROCESSING" : "PENDING",
          isPaid: paymentMethod === "COD",
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
        include: { orderItems: true },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return createdOrder;
    });

    // 3) Payment flow based on method
    if (paymentMethod === "RAZORPAY") {
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(order.total * 100),
        currency: "INR",
        receipt: `rpay_${order.id.slice(0, 8)}`,
        notes: {
          internalOrderId: order.id,
          userId,
        },
      });

      return res.status(201).json({
        order,
        razorpayOrder,
        message: "Proceed to payment",
      });
    }

    // COD fallback
    return res.status(201).json({
      order,
      message: "Cash on Delivery order placed",
    });

  } catch (error: any) {
    console.error("Checkout API error:", error);

    const msg = error?.message || "Internal Server Error";
    const isClientErr =
      msg === "Cart is empty" || msg.startsWith("Insufficient stock");

    return res.status(isClientErr ? 400 : 500).json({ message: msg });
  }
}
