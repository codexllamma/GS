// pages/api/razorpay/verify-payment.ts

import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { syncOrder } from "@/lib/shopify/sync/orders";
import { syncVariantInventory } from "@/lib/shopify/sync/inventory";

interface CartSnapshotItem {
  variantId: string;
  productId: string;
  quantity: number;
  price: number;
  title?: string;
  size?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  // Parameter extraction with key aliases
  const razorpay_order_id = req.body.razorpay_order_id;
  const razorpay_payment_id = req.body.razorpay_payment_id;
  const razorpay_signature = req.body.razorpay_signature;
  const checkoutSessionId =
    req.body.checkoutSessionId || req.body.sessionId || req.body.checkout_session_id;

  const missingParams = [];
  if (!razorpay_order_id) missingParams.push("razorpay_order_id");
  if (!razorpay_payment_id) missingParams.push("razorpay_payment_id");
  if (!razorpay_signature) missingParams.push("razorpay_signature");
  if (!checkoutSessionId) missingParams.push("checkoutSessionId");

  if (missingParams.length > 0) {
    console.error("[VERIFY-PAYMENT] Missing parameters:", missingParams);
    return res.status(400).json({
      success: false,
      message: `Missing required verification parameters: ${missingParams.join(", ")}`,
      receivedKeys: Object.keys(req.body),
    });
  }

  // 1. Verify HMAC SHA256 Signature
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET!;
  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    console.error("[VERIFY-PAYMENT] HMAC Signature Mismatch!");
    return res.status(400).json({ success: false, message: "Invalid payment signature." });
  }

  try {
    // 2. Fetch target CheckoutSession
    const session = await prisma.checkoutSession.findUnique({
      where: { id: checkoutSessionId },
    });

    if (!session) {
      console.error(`[VERIFY-PAYMENT] No CheckoutSession found for ID: "${checkoutSessionId}"`);
      return res.status(404).json({
        success: false,
        message: `Checkout session not found for ID: ${checkoutSessionId}`,
      });
    }

    const cartSnapshot = (session.cartSnapshot as unknown as CartSnapshotItem[]) || [];

    // Idempotency check: if session is already completed, return existing order
    if (session.status === "COMPLETED") {
      const existingOrder = await prisma.order.findUnique({
        where: { checkoutSessionId: session.id },
      });
      return res.status(200).json({
        success: true,
        message: "Order already processed.",
        orderId: existingOrder?.id,
        purchasedVariantIds: cartSnapshot.map((item) => item.variantId),
      });
    }

    // 3. Fetch Razorpay Order and Payment API details in parallel
    const razorpayAuth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    const [rzpOrderRes, rzpPaymentRes] = await Promise.all([
      fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
        headers: { Authorization: `Basic ${razorpayAuth}` },
      }),
      fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
        headers: { Authorization: `Basic ${razorpayAuth}` },
      }),
    ]);

    const orderData = rzpOrderRes.ok ? await rzpOrderRes.json() : {};
    const paymentData = rzpPaymentRes.ok ? await rzpPaymentRes.json() : {};

    // Extract customer contact info
    const customerEmail =
      orderData.customer_details?.email || paymentData.email || null;
    const customerPhone =
      orderData.customer_details?.contact || paymentData.contact || null;

    // Extract complete shipping address across potential Magic Checkout paths
    let rawAddress = orderData.customer_details?.shipping_address;

    if (!rawAddress && paymentData.notes?.shipping_address) {
      try {
        rawAddress =
          typeof paymentData.notes.shipping_address === "string"
            ? JSON.parse(paymentData.notes.shipping_address)
            : paymentData.notes.shipping_address;
      } catch (e) {
        rawAddress = null;
      }
    }

    if (!rawAddress) {
      rawAddress = paymentData.customer_details?.shipping_address || {};
    }

    const line1 = rawAddress.line1 || rawAddress.address1 || rawAddress.address || "N/A";
    const line2 = rawAddress.line2 || rawAddress.address2 || "";
    const city = rawAddress.city || "N/A";
    const state = rawAddress.state || rawAddress.province || "N/A";
    const postal =
      rawAddress.zipcode || rawAddress.pincode || rawAddress.postal || session.pincode || "";
    const country = rawAddress.country || "India";

    const bodyName =
      req.body.name && typeof req.body.name === "string"
        ? req.body.name.trim().replace(/\s+/g, " ")
        : null;

    const derivedEmailName = customerEmail
      ? customerEmail.split("@")[0].replace(/[0-9_.-]+/g, " ").trim()
      : null;

    const fullName =
      bodyName ||
      rawAddress.name ||
      `${rawAddress.first_name || ""} ${rawAddress.last_name || ""}`.trim() ||
      derivedEmailName ||
      "Valued Customer";

    // 4. Prisma Atomic Transaction
    const { createdOrder, purchasedVariantIds } = await prisma.$transaction(async (tx) => {
      // Step A: Upsert User
      let user = null;
      const searchCriteria = customerEmail
        ? { email: customerEmail }
        : customerPhone
        ? { phoneNumber: customerPhone }
        : null;

      if (searchCriteria) {
        user = await tx.user.upsert({
          where: searchCriteria,
          update: {
            ...(fullName && fullName !== "Valued Customer" ? { name: fullName } : {}),
          },
          create: {
            email: customerEmail || undefined,
            phoneNumber: customerPhone || undefined,
            name: fullName,
          },
        });
      }

      // Step B: Create Address
      const address = await tx.address.create({
        data: {
          userId: user ? user.id : session.userId || "",
          line1,
          line2,
          city,
          state,
          postal,
          country,
        },
      });

      // Step C: Create Order with nested OrderItems
      const newOrder = await tx.order.create({
        data: {
          userId: user?.id || session.userId,
          addressId: address.id,
          checkoutSessionId: session.id,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          subtotal: session.amount,
          deliveryCharge: 0.0,
          total: session.amount,
          status: "PROCESSING",
          paymentMethod: "RAZORPAY",
          isPaid: true,
          orderItems: {
            create: cartSnapshot.map((item) => ({
              variantId: item.variantId,
              productId: item.productId,
              quantity: item.quantity,
              priceAtPurchase: item.price,
            })),
          },
        },
      });

      // Step D: Decrement Variant Stock Levels locally
      for (const item of cartSnapshot) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      // Step E: Mark CheckoutSession COMPLETED
      await tx.checkoutSession.update({
        where: { id: session.id },
        data: { status: "COMPLETED" },
      });

      return {
        createdOrder: newOrder,
        purchasedVariantIds: cartSnapshot.map((item) => item.variantId),
      };
    });

    // 5. Shopify Auto-Sync (Awaited with try/catch so serverless containers do not freeze execution)
    try {
      console.log(`[SHOPIFY AUTO-SYNC] Syncing Order ${createdOrder.id}`);

      // Sync order & customer profile to Shopify
      await syncOrder(createdOrder.id);

      // Sync stock levels for each purchased variant
      for (const variantId of purchasedVariantIds) {
        await syncVariantInventory(variantId);
      }

      console.log(`[SHOPIFY AUTO-SYNC SUCCESS] Completed for Order ${createdOrder.id}`);
    } catch (syncErr) {
      console.error(`[SHOPIFY AUTO-SYNC ERROR] Order ${createdOrder.id} sync failed:`, syncErr);
    }

    console.log("================ [VERIFY-PAYMENT END SUCCESS] ================");

    return res.status(200).json({
      success: true,
      message: "Payment verified, order created, and stock updated.",
      orderId: createdOrder.id,
      purchasedVariantIds,
    });
  } catch (error: any) {
    console.error("================ [VERIFY-PAYMENT EXCEPTION] ================");
    console.error("[VERIFY-PAYMENT ERROR]:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error.",
    });
  }
}