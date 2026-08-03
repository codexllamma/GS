import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import Razorpay from "razorpay";
// import { checkShiprocketPincode } from "@/lib/shiprocket";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

interface GuestCartInputItem {
  variantId: string;
  quantity: number;
}

interface CartSnapshotItem {
  variantId: string;
  productId: string;
  name: string;
  size: string;
  quantity: number;
  priceAtPurchase: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // 1. Non-blocking Session Check
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id ?? null;

    const { pincode, guestItems } = req.body as {
      pincode?: string;
      guestItems?: GuestCartInputItem[];
    };

    if (!pincode) {
      return res.status(400).json({ message: "PIN code is required" });
    }

    // 2. PIN Code Serviceability Check
    /*
    const isServiceable = await checkShiprocketPincode(pincode);
    if (!isServiceable) {
      return res.status(400).json({
        message: "Delivery is currently unavailable for this PIN code.",
      });
    }
      */

    // 3. Cart Normalization & Stock Validation
    const snapshotItems: CartSnapshotItem[] = [];

    if (userId) {
      // Logged-in user: load cart from DB
      const cart = await prisma.cart.findFirst({
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
        return res.status(400).json({ message: "Cart is empty" });
      }

      for (const item of cart.items) {
        if (item.variant.stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${item.variant.product.name} - ${item.variant.size}`,
          });
        }

        const price =
          item.variant.price ?? item.variant.product.basePrice ?? 0;

        snapshotItems.push({
          variantId: item.variantId,
          productId: item.variant.product.id,
          name: item.variant.product.name,
          size: item.variant.size,
          quantity: item.quantity,
          priceAtPurchase: price,
        });
      }
    } else {
      // Guest user: validate provided guestItems
      if (!Array.isArray(guestItems) || guestItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      const variantIds = guestItems.map((gi) => gi.variantId).filter(Boolean);

      const variants = await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
      });

      const variantMap = new Map(variants.map((v) => [v.id, v]));

      for (const gi of guestItems) {
        const variant = variantMap.get(gi.variantId);

        if (!variant) {
          return res.status(400).json({
            message: "One or more items in your cart are no longer available.",
          });
        }

        const qty = typeof gi.quantity === "number" && gi.quantity > 0 ? gi.quantity : 1;

        if (variant.stock < qty) {
          return res.status(400).json({
            message: `Insufficient stock for ${variant.product.name} - ${variant.size}`,
          });
        }

        const price = variant.price ?? variant.product.basePrice ?? 0;

        snapshotItems.push({
          variantId: variant.id,
          productId: variant.product.id,
          name: variant.product.name,
          size: variant.size,
          quantity: qty,
          priceAtPurchase: price,
        });
      }
    }

    // 4. Calculate Totals
    const subtotal = snapshotItems.reduce(
      (sum, item) => sum + item.quantity * item.priceAtPurchase,
      0
    );
    const deliveryCharge = 0;
    const total = subtotal + deliveryCharge;
    const amountInPaise = Math.round(total * 100);

    // 5. Create CheckoutSession in DB
    const checkoutSession = await prisma.checkoutSession.create({
      data: {
        userId,
        pincode,
        cartSnapshot: snapshotItems as any,
        amount: total,
        status: "PENDING",
      },
    });

    // 6. Create Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `chk_${checkoutSession.id.slice(-12)}`,
      notes: {
        checkoutSessionId: checkoutSession.id,
        userId: userId ?? "GUEST",
        pincode,
      },
    });

    // Attach Razorpay Order ID to session
    await prisma.checkoutSession.update({
      where: { id: checkoutSession.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    return res.status(200).json({
      success: true,
      checkoutSessionId: checkoutSession.id,
      razorpayOrder,
    });
  } catch (error: any) {
    console.error("Checkout API error:", error);

    const msg = error?.message || "Internal Server Error";
    const isClientErr =
      msg === "Cart is empty" ||
      msg.startsWith("Insufficient stock") ||
      msg.includes("PIN code");

    return res.status(isClientErr ? 400 : 500).json({ message: msg });
  }
}