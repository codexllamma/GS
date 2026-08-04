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
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, checkoutSessionId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !checkoutSessionId) {
    return res.status(400).json({ success: false, message: "Missing required verification parameters." });
  }

  // 1. Verify Razorpay HMAC SHA256 Signature
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET!;
  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: "Invalid payment signature." });
  }

  try {
    // 2. Fetch target CheckoutSession
    const session = await prisma.checkoutSession.findUnique({
      where: { id: checkoutSessionId },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: "Checkout session not found." });
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

    // 3. Fetch detailed payment/customer info from Razorpay REST API
    const razorpayAuth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");

    const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: { Authorization: `Basic ${razorpayAuth}` },
    });

    const paymentData = rzpRes.ok ? await rzpRes.json() : {};
    const customerEmail = paymentData.email || null;
    const customerPhone = paymentData.contact || null;

    // Extract address details passed by Magic Checkout
    const rawAddress = paymentData.notes?.shipping_address
      ? JSON.parse(paymentData.notes.shipping_address)
      : paymentData.customer_details?.shipping_address || {};

    const fullName = rawAddress.name || rawAddress.first_name 
      ? `${rawAddress.first_name || ""} ${rawAddress.last_name || ""}`.trim() 
      : "HIÈR Customer";

    // 4. Prisma Atomic Database Transaction
    const { createdOrder, purchasedVariantIds } = await prisma.$transaction(async (tx) => {
      // Step A: Upsert User (by Email or Phone)
      let user = null;
      const searchCriteria = customerEmail
        ? { email: customerEmail }
        : customerPhone
        ? { phoneNumber: customerPhone }
        : null;

      if (searchCriteria) {
        user = await tx.user.upsert({
          where: searchCriteria,
          update: {}, // Do nothing if user already exists
          create: {
            email: customerEmail || undefined,
            phoneNumber: customerPhone || undefined,
            name: fullName,
          },
        });
      }

      // Step B: Create Address Record
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

      // Step C: Create Order
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

      // Step D: Decrement ProductVariant Stock Levels
      for (const item of cartSnapshot) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      // Step E: Mark CheckoutSession as COMPLETED
      await tx.checkoutSession.update({
        where: { id: session.id },
        data: { status: "COMPLETED" },
      });

      return {
        createdOrder: newOrder,
        purchasedVariantIds: cartSnapshot.map((item) => item.variantId),
      };
    });
    /*
    // 5. Asynchronous Background Sync to Shopify (Non-blocking)
    (async () => {
      try {
        const shopifyCustomerId = await getOrCreateShopifyCustomer({
          email: customerEmail,
          phone: customerPhone,
          firstName: rawAddress.first_name || fullName.split(" ")[0],
          lastName: rawAddress.last_name || fullName.split(" ").slice(1).join(" "),
          address: {
            address1: rawAddress.line1 || rawAddress.address1,
            address2: rawAddress.line2 || rawAddress.address2,
            city: rawAddress.city,
            province: rawAddress.state || rawAddress.province,
            zip: rawAddress.zipcode || rawAddress.pincode || session.pincode,
            country: "India",
          },
        });

        const shopifyOrder = await createShopifyOrder({
          localOrderId: createdOrder.id,
          shopifyCustomerId,
          email: customerEmail,
          phone: customerPhone,
          shippingAddress: rawAddress,
          items: cartSnapshot.map((item) => ({
            title: item.title || "HIÈR Product",
            quantity: item.quantity,
            price: item.price,
          })),
          totalPrice: session.amount,
        });

        if (shopifyOrder?.id) {
          await prisma.shopifyOrderMapping.create({
            data: {
              orderId: createdOrder.id,
              shopifyOrderId: String(shopifyOrder.id),
            },
          });
        }
      } catch (shopifyErr) {
        console.error(`[Shopify Async Sync Failed] Order ${createdOrder.id}:`, shopifyErr);
      }
    })();

    // 6. Return response with purchasedVariantIds for frontend store cleanup
    return res.status(200).json({
      success: true,
      message: "Payment verified, order created, and stock updated.",
      orderId: createdOrder.id,
      purchasedVariantIds,
    });
    */
  } catch (error: any) {
    console.error("[Payment Verification Error]:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error." });
  }
}