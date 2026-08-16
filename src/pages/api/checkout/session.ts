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

    let rawSubtotal = 0;
    let totalQuantity = 0;
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

      rawSubtotal += itemPrice * item.quantity;
      totalQuantity += item.quantity;

      cartSnapshot.push({
        variantId: dbVariant.id,
        productId: dbVariant.productId,
        productName: dbVariant.product.name,
        size: dbVariant.size,
        price: itemPrice,
        quantity: item.quantity,
      });
    }

    // 3. Calculate Tiered Volume Discount
    let discountPercent = 0;
    if (totalQuantity === 2) {
      discountPercent = 3;
    } else if (totalQuantity >= 3) {
      discountPercent = 5;
    }

    const discountAmount = Math.round((rawSubtotal * discountPercent) / 100);
    const finalPayableTotal = Math.max(0, rawSubtotal - discountAmount);
    const finalAmountInPaise = Math.round(finalPayableTotal * 100);

    // 4. Create CheckoutSession record in DB
    const checkoutSession = await prisma.checkoutSession.create({
      data: {
        userId: userId ?? null,
        pincode: pincode || "",
        cartSnapshot: JSON.parse(JSON.stringify(cartSnapshot)),
        amount: finalPayableTotal,
        status: "PENDING",
      },
    });

    // 5. Build Razorpay Magic Checkout line items with proportionate offer prices
    const lineItems = cartSnapshot.map((item) => {
      const originalPriceInPaise = Math.round(item.price * 100);
      const discountedPriceInPaise = Math.round(
        item.price * (1 - discountPercent / 100) * 100
      );

      return {
        sku: item.variantId,
        variant_id: item.variantId,
        name: `${item.productName} (${item.size})`,
        price: originalPriceInPaise,
        offer_price: discountedPriceInPaise,
        quantity: item.quantity,
        weight: 500,
      };
    });

    // 6. Create Razorpay Order with Magic Checkout parameters
    const razorpayOrder = await razorpay.orders.create({
      amount: finalAmountInPaise,
      currency: "INR",
      receipt: checkoutSession.id,
      line_items_total: finalAmountInPaise,
      line_items: lineItems,
      notes: {
        checkoutSessionId: checkoutSession.id,
        userId: userId || "GUEST",
        discountPercent: `${discountPercent}%`,
        discountAmount: `₹${discountAmount}`,
        country: "IN",
      },
    } as any);

    // 7. Save razorpayOrderId to CheckoutSession
    await prisma.checkoutSession.update({
      where: { id: checkoutSession.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    return res.status(200).json({
      success: true,
      sessionId: checkoutSession.id,
      razorpayOrderId: razorpayOrder.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: finalPayableTotal,
      currency: "INR",
      pricing: {
        subtotal: rawSubtotal,
        totalQuantity,
        discountPercent,
        discountAmount,
        finalTotal: finalPayableTotal,
      },
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