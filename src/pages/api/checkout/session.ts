import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { CartSnapshotItem, CreateCheckoutSessionPayload } from "@/types/checkout";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { items, pincode } = req.body as CreateCheckoutSessionPayload;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items selected for checkout" });
    }

    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user ? (session.user as { id: string }).id : null;
    const userEmail = session?.user?.email || null;

    // 1. Fetch live database records for all selected variants
    const variantIds = items.map((i) => i.variantId);
    const dbVariants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true },
    });

    let totalAmount = 0;
    const cartSnapshot: CartSnapshotItem[] = [];

    // 2. Validate Stock & Price strictly against DB
    for (const item of items) {
      const dbVariant = dbVariants.find((v) => v.id === item.variantId);

      if (!dbVariant || dbVariant.product.isDeleted) {
        return res.status(400).json({
          success: false,
          message: `Product variant no longer available. Please update your cart.`,
        });
      }

      if (dbVariant.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${dbVariant.stock} unit(s) remaining for ${dbVariant.product.name} (${dbVariant.size}).`,
          variantId: dbVariant.id,
          actualStock: dbVariant.stock,
        });
      }

      const itemPrice =
        dbVariant.price && dbVariant.price > 0
          ? dbVariant.price
          : dbVariant.product.basePrice;

      totalAmount += itemPrice * item.quantity;

      cartSnapshot.push({
        variantId: dbVariant.id,
        productId: dbVariant.productId,
        productName: dbVariant.product.name,
        size: dbVariant.size,
        price: itemPrice,
        quantity: item.quantity,
      });
    }

    // 3. Create CheckoutSession record matching Prisma schema
    const checkoutSession = await prisma.checkoutSession.create({
      data: {
        userId: userId ?? null,
        pincode: pincode || "",
        cartSnapshot: JSON.parse(JSON.stringify(cartSnapshot)),
        amount: totalAmount,
        status: "PENDING",
      },
    });

    // 4. Transform items to Razorpay line_items for Magic Checkout (Amounts in Paise)
    const lineItems = cartSnapshot.map((item) => {
      const itemPriceInPaise = Math.round(item.price * 100);
      return {
        sku: item.variantId,
        variant_id: item.variantId,
        name: `${item.productName} (${item.size})`,
        price: itemPriceInPaise,
        offer_price: itemPriceInPaise,
        quantity: item.quantity,
        weight: 500,
      };
    });

    // 5. Create Razorpay Order with Magic Checkout parameters
    const totalAmountInPaise = Math.round(totalAmount * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmountInPaise,
      currency: "INR",
      receipt: checkoutSession.id,
      line_items_total: totalAmountInPaise, // Mandatory for Magic Checkout
      line_items: lineItems,               // Mandatory for Magic Checkout
      notes: {
        checkoutSessionId: checkoutSession.id,
        userId: userId || "GUEST",
        country: "IN",
      },
    } as any);

    // 6. Save razorpayOrderId to CheckoutSession
    await prisma.checkoutSession.update({
      where: { id: checkoutSession.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    return res.status(200).json({
      success: true,
      sessionId: checkoutSession.id,
      razorpayOrderId: razorpayOrder.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: totalAmount,
      currency: "INR",
      userPrefill: {
        email: userEmail,
      },
    });
  } catch (error: any) {
    console.error("CheckoutSession creation error:", error);
    return res.status(500).json({
      message: error.message || "Failed to create checkout session",
    });
  }
}