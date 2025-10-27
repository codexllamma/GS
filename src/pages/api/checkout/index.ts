import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import Razorpay from "razorpay";

// Initialize Razorpay
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
      return res
        .status(400)
        .json({ message: "Address and payment method are required" });
    }

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

    // ✅ 2. Fetch user's cart
    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: { images: true },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // ✅ 3. Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) =>
        sum +
        item.quantity *
          (item.variant.price ?? item.variant.product.basePrice ?? 0),
      0
    );
    const deliveryCharge = subtotal > 1000 ? 0 : 50;
    const total = subtotal + deliveryCharge;

    console.log("Checkout → Subtotal:", subtotal, "Total:", total);

    // ✅ 4. Create order
    const order = await prisma.order.create({
      data: {
        userId,
        addressId: existingAddress.id, // 👈 foreign key fix
        paymentMethod,
        subtotal,
        deliveryCharge,
        total,
        isPaid: false,
        status: "PENDING",
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
          include: { variant: { include: { product: true } } },
        },
      },
    });

    // ✅ 5. Clear cart
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    // ✅ 6. Handle payment flow
    if (paymentMethod === "RAZORPAY") {
      const razorpayOrder = await razorpay.orders.create({
        amount: total * 100, // paise
        currency: "INR",
        receipt: `order_rcpt_${order.id.slice(0, 20)}`,
        notes: {
          userId,
          internalOrderId: order.id,
        },
      });

      return res.status(201).json({
        order,
        razorpayOrder,
        message: "Proceed to Razorpay payment",
      });
    }

    // ✅ 7. COD fallback
    const codOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PROCESSING",
        isPaid: true,
      },
    });

    return res.status(201).json({
      order: codOrder,
      message: "Cash on Delivery order placed successfully",
    });
  } catch (error: any) {
    console.error("Checkout API error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}
