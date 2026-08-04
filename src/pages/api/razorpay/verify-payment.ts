// pages/api/razorpay/verify-payment.ts

import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

interface CartSnapshotItem {
  variantId: string;
  productId: string;
  quantity: number;
  price: number;
  title?: string;
  size?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("================ [VERIFY-PAYMENT START] ================");
  console.log("[DEBUG] HTTP Method:", req.method);
  console.log("[DEBUG] Raw Request Body:", JSON.stringify(req.body, null, 2));

  if (req.method !== "POST") {
    console.log("[DEBUG ERROR] Method not allowed:", req.method);
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  // Support parameter name variations
  const razorpay_order_id = req.body.razorpay_order_id;
  const razorpay_payment_id = req.body.razorpay_payment_id;
  const razorpay_signature = req.body.razorpay_signature;
  const checkoutSessionId =
    req.body.checkoutSessionId || req.body.sessionId || req.body.checkout_session_id;

  console.log("[DEBUG] Extracted Verification Parameters:");
  console.log("  - razorpay_order_id:", razorpay_order_id ?? "MISSING");
  console.log("  - razorpay_payment_id:", razorpay_payment_id ?? "MISSING");
  console.log("  - razorpay_signature:", razorpay_signature ? "[PRESENT]" : "MISSING");
  console.log("  - checkoutSessionId:", checkoutSessionId ?? "MISSING");

  const missingParams = [];
  if (!razorpay_order_id) missingParams.push("razorpay_order_id");
  if (!razorpay_payment_id) missingParams.push("razorpay_payment_id");
  if (!razorpay_signature) missingParams.push("razorpay_signature");
  if (!checkoutSessionId) missingParams.push("checkoutSessionId");

  if (missingParams.length > 0) {
    console.error("[DEBUG ERROR] Failed parameter validation. Missing keys:", missingParams);
    return res.status(400).json({
      success: false,
      message: `Missing required verification parameters: ${missingParams.join(", ")}`,
      receivedBody: req.body,
    });
  }

  // 1. Verify Razorpay HMAC SHA256 Signature
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET!;
  if (!secret) {
    console.error("[DEBUG ERROR] Neither RAZORPAY_WEBHOOK_SECRET nor RAZORPAY_KEY_SECRET is set in environment!");
  }

  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  console.log("[DEBUG] Signature Check:");
  console.log("  - Expected Signature:", generatedSignature);
  console.log("  - Received Signature:", razorpay_signature);
  console.log("  - Signatures Match?:", generatedSignature === razorpay_signature);

  if (generatedSignature !== razorpay_signature) {
    console.error("[DEBUG ERROR] HMAC Signature Mismatch!");
    return res.status(400).json({ success: false, message: "Invalid payment signature." });
  }

  try {
    // 2. Fetch target CheckoutSession
    console.log(`[DEBUG] Fetching CheckoutSession from DB for ID: "${checkoutSessionId}"...`);
    const session = await prisma.checkoutSession.findUnique({
      where: { id: checkoutSessionId },
    });

    if (!session) {
      console.error(`[DEBUG ERROR] No CheckoutSession found in database for ID: "${checkoutSessionId}"`);
      return res.status(404).json({ success: false, message: `Checkout session not found for ID: ${checkoutSessionId}` });
    }

    console.log("[DEBUG] CheckoutSession Found:");
    console.log("  - Status:", session.status);
    console.log("  - Amount:", session.amount);
    console.log("  - User ID:", session.userId ?? "Guest");

    const cartSnapshot = (session.cartSnapshot as unknown as CartSnapshotItem[]) || [];
    console.log(`[DEBUG] Cart Snapshot contains ${cartSnapshot.length} items.`);

    // Idempotency check
    if (session.status === "COMPLETED") {
      console.log("[DEBUG] Session already COMPLETED. Returning existing order...");
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

    // 3. Fetch payment info from Razorpay API
    console.log(`[DEBUG] Fetching Payment details from Razorpay API for ID: "${razorpay_payment_id}"...`);
    const razorpayAuth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: { Authorization: `Basic ${razorpayAuth}` },
    });

    console.log("[DEBUG] Razorpay API Response Status:", rzpRes.status);
    const paymentData = rzpRes.ok ? await rzpRes.json() : {};
    if (!rzpRes.ok) {
      console.warn("[DEBUG WARNING] Could not fetch payment details from Razorpay REST API:", paymentData);
    }

    const customerEmail = paymentData.email || null;
    const customerPhone = paymentData.contact || null;
    console.log("  - Customer Email:", customerEmail ?? "N/A");
    console.log("  - Customer Phone:", customerPhone ?? "N/A");

    const rawAddress = paymentData.notes?.shipping_address
      ? JSON.parse(paymentData.notes.shipping_address)
      : paymentData.customer_details?.shipping_address || {};

    const fullName =
      rawAddress.name ||
      `${rawAddress.first_name || ""} ${rawAddress.last_name || ""}`.trim() ||
      "HIÈR Customer";

    // 4. Prisma Atomic Database Transaction
    console.log("[DEBUG] Starting Prisma Transaction...");
    const { createdOrder, purchasedVariantIds } = await prisma.$transaction(async (tx) => {
      // Step A: Upsert User
      let user = null;
      const searchCriteria = customerEmail
        ? { email: customerEmail }
        : customerPhone
        ? { phoneNumber: customerPhone }
        : null;

      if (searchCriteria) {
        console.log("[DEBUG Transaction] Upserting User with criteria:", searchCriteria);
        user = await tx.user.upsert({
          where: searchCriteria,
          update: {},
          create: {
            email: customerEmail || undefined,
            phoneNumber: customerPhone || undefined,
            name: fullName,
          },
        });
        console.log("[DEBUG Transaction] User resolved ID:", user.id);
      }

      // Step B: Create Address Record
      console.log("[DEBUG Transaction] Creating Address record...");
      const address = await tx.address.create({
        data: {
          userId: user ? user.id : session.userId || "",
          line1: rawAddress.line1 || rawAddress.address1 || "N/A",
          line2: rawAddress.line2 || rawAddress.address2 || "",
          city: rawAddress.city || "N/A",
          state: rawAddress.state || rawAddress.province || "N/A",
          postal: rawAddress.zipcode || rawAddress.pincode || session.pincode,
          country: rawAddress.country || "India",
        },
      });
      console.log("[DEBUG Transaction] Address created ID:", address.id);

      // Step C: Create Order
      console.log("[DEBUG Transaction] Creating Order record...");
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
      console.log("[DEBUG Transaction] Order created ID:", newOrder.id);

      // Step D: Decrement Stock
      console.log("[DEBUG Transaction] Decrementing stock for variants...");
      for (const item of cartSnapshot) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      // Step E: Complete Session
      console.log("[DEBUG Transaction] Marking CheckoutSession as COMPLETED...");
      await tx.checkoutSession.update({
        where: { id: session.id },
        data: { status: "COMPLETED" },
      });

      return {
        createdOrder: newOrder,
        purchasedVariantIds: cartSnapshot.map((item) => item.variantId),
      };
    });

    console.log("[DEBUG] Transaction successful! Order ID:", createdOrder.id);
    console.log("================ [VERIFY-PAYMENT END SUCCESS] ================");

    return res.status(200).json({
      success: true,
      message: "Payment verified, order created, and stock updated.",
      orderId: createdOrder.id,
      purchasedVariantIds,
    });
  } catch (error: any) {
    console.error("================ [VERIFY-PAYMENT EXCEPTION] ================");
    console.error("[DEBUG ERROR] Exception Message:", error?.message);
    console.error("[DEBUG ERROR] Full Error Stack:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error.",
      errorDetails: String(error),
    });
  }
}