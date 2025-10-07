
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
    console.log("Checkout request body:", req.body);

    if (!session?.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = session.user.id;
    

    const { address, paymentMethod } = req.body;

    if (!address || !paymentMethod) {
      return res.status(400).json({ message: "Address and payment method are required" });
    }

    // Update user address if missing
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.address) {
      await prisma.user.update({ where: { id: userId }, data: { address } });
    }

    // Fetch cart
    const cartItems = await prisma.cartOrder.findMany({
      where: { userId },
      include: { product: true },
    });
    console.log("Checkout → userId from session:", userId);
    console.log("Checkout → fetched cart items:", cartItems);
    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Pricing
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const deliveryCharge = subtotal > 1000 ? 0 : 50;
    const total = subtotal + deliveryCharge;

    console.log("Cart Items:", cartItems);
    console.log("Subtotal:", subtotal, "Total:", total);
    console.log("Creating order...");

    // Create order in DB
    const order = await prisma.order.create({
      data: {
        userId,
        address,
        paymentMethod,
        subtotal,
        isPaid: false,
        deliveryCharge,
        status: "PENDING",
        total,
        orderItems: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: item.product.price,
          })),
        },
      },
      include: {
        orderItems: { include: { product: true } },
      },
    });

    // Clear cart
    await prisma.cartOrder.deleteMany({ where: { userId } });

    // Handle payments
    if (paymentMethod === "RAZORPAY") {

      const razorpayOrder = await razorpay.orders.create({
        amount: total * 100, // in paise
        currency: "INR",
        receipt: `order_rcpt_${order.id.slice(0, 20)}`,
      });

      return res.status(201).json({
        order,
        razorpayOrder,
        message: "Proceed to online payment",
      });
    }

    // COD fallback
    return res.status(201).json({
      order,
      message: "COD order placed successfully",
    });
  } catch (error) {
    console.error("Checkout Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
