import type { NextApiRequest, NextApiResponse } from "next";
import Razorpay from "razorpay";

// Initialize Razorpay instance using Server Environment Variables
const razorpay = new Razorpay({
  key_id: (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

interface CartItem {
  id?: string;
  variantId?: string;
  productName?: string;
  name?: string;
  price: number;      // Amount in Rupees (e.g. 1499)
  quantity: number;
  size?: string;
  weight?: number;    // Weight in kg or grams
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { cartItems, userId } = req.body || {};

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart items are required" });
    }

    // 1. Map cart items into strict Razorpay + Shiprocket line_item format
    const lineItems = cartItems.map((item: CartItem, index: number) => {
      // Ensure SKU / Variant ID string exists
      const rawVariantId = String(
        item.variantId || item.id || `variant_${index + 1}`
      );

      // Construct clean display name
      const baseName = item.productName || item.name || "Product Item";
      const fullName = item.size ? `${baseName} (${item.size})` : baseName;

      // Price Conversion: Force positive integer in paise (e.g., ₹1499 -> 149900 paise)
      const priceInPaise = Math.round(
        item.price < 10000 ? item.price * 100 : item.price
      );

      // Package Weight: Shiprocket strictly requires weight in grams (default: 500g)
      let weightInGrams = 500;
      if (item.weight) {
        weightInGrams =
          item.weight < 20
            ? Math.round(item.weight * 1000)
            : Math.round(item.weight);
      }

      return {
        sku: rawVariantId,
        variant_id: rawVariantId,
        name: String(fullName),
        price: priceInPaise,
        offer_price: priceInPaise,
        quantity: Number(item.quantity) || 1,
        weight: weightInGrams,
      };
    });

    // 2. Sum line items directly to prevent 1-paise floating-point rounding drift
    const calculatedLineItemsTotal = lineItems.reduce(
      (sum, item) => sum + item.offer_price * item.quantity,
      0
    );

    if (calculatedLineItemsTotal <= 0) {
      return res.status(400).json({ message: "Invalid cart total amount" });
    }

    const receiptId = `rcpt_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 7)}`;

    // 3. Construct Razorpay Order Payload for Magic Checkout
    const orderOptions = {
      amount: calculatedLineItemsTotal,
      currency: "INR",
      receipt: receiptId,
      line_items_total: calculatedLineItemsTotal, // MUST strictly equal sum of line items
      line_items: lineItems,
      notes: {
        userId: String(userId || "GUEST"),
        country: "IN", // Explicit ISO-2 Country Code
        source: "nextjs_magic_checkout",
      },
    };

    // 4. Create the Razorpay Order
    const razorpayOrder = await razorpay.orders.create(orderOptions as any);

    return res.status(200).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId:
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Razorpay Magic Checkout Session Error:", error);
    return res.status(500).json({
      message:
        error?.error?.description ||
        error?.message ||
        "Failed to create order session",
    });
  }
}