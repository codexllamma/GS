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

  if (req.method === "POST") {
    const { address, paymentMethod } = req.body;
    if (!address || !paymentMethod) {
      return res.status(400).json({ message: "Address and payment method are required" });
    }

    try {
      // Update user address if not already set
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.address) {
        await prisma.user.update({
          where: { id: userId },   
          data: { address },
        });
      }
    
      // Fetch cart items with product details
      const cartItems = await prisma.cartOrder.findMany({
        where: { userId },
        include: { product: true },
      });

      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      
      // Calculate subtotal, delivery, and total
      const subtotal = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );
      const deliveryCharge = subtotal > 1000 ? 0 : 50; // example rule
      const total = subtotal + deliveryCharge;

      // Create the order with orderItems relationally
      const order = await prisma.order.create({
        data: {
          userId,
          address,
          paymentMethod,
          status: "PENDING",
          subtotal,
          deliveryCharge,
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
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      });

      // Clear cart
      await prisma.cartOrder.deleteMany({ where: { userId } });

      return res.status(201).json(order);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }

  res.setHeader("Allow", ["POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
