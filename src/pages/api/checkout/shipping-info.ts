// pages/api/checkout/shipping-info.ts

import type { NextApiRequest, NextApiResponse } from "next";

// 1. In-Memory Shiprocket Token Cache (Valid for 24h)
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getShiprocketToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) {
    console.log("[SHIPPING-INFO] ⚡ Using cached Shiprocket auth token.");
    return cachedToken;
  }

  const email = process.env.SHIPROCKET_EMAIL || "codexllamma@gmail.com";
  const password = process.env.SHIPROCKET_PASSWORD || "ObRdh%^Oxj1wtuR8@VPtmxW8DBLkmg*@";

  console.log(`[SHIPPING-INFO] 🔑 Authenticating with Shiprocket as: ${email}...`);

  try {
    const res = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data?.token) {
      cachedToken = data.token;
      tokenExpiry = now + 24 * 60 * 60 * 1000;
      console.log("[SHIPPING-INFO] ✅ Shiprocket authentication successful. Token cached.");
      return cachedToken;
    } else {
      console.error("[SHIPPING-INFO] ❌ Shiprocket Auth rejected:", data);
    }
  } catch (err: any) {
    console.error("[SHIPPING-INFO] ❌ Shiprocket Auth network exception:", err?.message || err);
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  console.log("\n========================================================");
  console.log(`[SHIPPING-INFO] 🚀 Incoming Request [${new Date().toISOString()}]`);
  console.log("[SHIPPING-INFO] Request Body:", JSON.stringify(req.body, null, 2));

  if (req.method !== "POST") {
    console.warn(`[SHIPPING-INFO] ⚠️ Method ${req.method} not allowed.`);
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { addresses } = req.body || {};
  const targetZipcode = addresses?.[0]?.zipcode || "410209";
  const pickupPostcode = process.env.SHIPROCKET_PICKUP_PINCODE || "410209";

  // Standard shipping methods (COD = ₹59 -> 5900 paise)
  const defaultShippingMethods = [
    {
      id: "prepaid_standard",
      name: "Standard Delivery (Prepaid)",
      description: "Delivered in 2-4 business days",
      serviceable: true,
      shipping_fee: 0, // Free shipping
      cod: false,
      cod_fee: 0,
    },
    {
      id: "cod_standard",
      name: "Cash on Delivery",
      description: "Pay cash upon delivery",
      serviceable: true,
      shipping_fee: 5900, // ₹59 in paise
      cod: true,
      cod_fee: 0,
    },
  ];

  try {
    // 1.8s Timeout Controller (Protects against Razorpay's 2.5s gateway drop)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("[SHIPPING-INFO] ⏱️ Shiprocket query timed out after 1800ms. Aborting to fallback.");
      controller.abort();
    }, 1800);

    const token = await getShiprocketToken();
    let isCodAvailable = true;

    if (token) {
      const url = `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickupPostcode}&delivery_postcode=${targetZipcode}&weight=0.5&cod=1&declared_value=1000`;
      console.log(`[SHIPPING-INFO] 📦 Querying Shiprocket Serviceability for Pincode: ${targetZipcode}...`);

      const srRes = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const srData = await srRes.json();
      console.log("[SHIPPING-INFO] 📦 Raw Shiprocket Serviceability Status:", srRes.status);

      const couriers = srData?.data?.available_courier_companies || [];
      console.log(`[SHIPPING-INFO] 🚚 Found ${couriers.length} available courier partner(s).`);

      if (couriers.length > 0) {
        isCodAvailable = couriers.some((c: any) => c.cod === 1);
        console.log(`[SHIPPING-INFO] 💵 COD Availability on ${targetZipcode}:`, isCodAvailable);
      } else {
        console.warn(`[SHIPPING-INFO] ⚠️ No specific couriers returned by Shiprocket for ${targetZipcode}. Defaulting to active delivery.`);
      }
    } else {
      clearTimeout(timeoutId);
      console.warn("[SHIPPING-INFO] ⚠️ No auth token available. Falling back to default delivery methods.");
    }

    const availableMethods = isCodAvailable
      ? defaultShippingMethods
      : defaultShippingMethods.filter((m) => !m.cod);

    const mappedAddresses = (addresses?.length ? addresses : [{ id: "0", zipcode: targetZipcode }]).map(
      (addr: any) => ({
        id: String(addr.id ?? "0"),
        zipcode: addr.zipcode || targetZipcode,
        state_code: addr.state_code || "MH",
        country: addr.country || "IN",
        shipping_methods: availableMethods,
      })
    );

    const responsePayload = { addresses: mappedAddresses };
    const elapsedTime = Date.now() - startTime;

    console.log(`[SHIPPING-INFO] ✨ Responding with 200 OK (${elapsedTime}ms):`, JSON.stringify(responsePayload, null, 2));
    console.log("========================================================\n");

    return res.status(200).json(responsePayload);
  } catch (error: any) {
    const elapsedTime = Date.now() - startTime;
    console.error(`[SHIPPING-INFO] 🚨 Error encountered (${elapsedTime}ms):`, error?.message || error);

    // Fallback response guaranteeing strict schema compliance
    const fallbackAddresses = (addresses?.length ? addresses : [{ id: "0", zipcode: targetZipcode }]).map(
      (addr: any) => ({
        id: String(addr.id ?? "0"),
        zipcode: addr.zipcode || targetZipcode,
        state_code: addr.state_code || "MH",
        country: addr.country || "IN",
        shipping_methods: defaultShippingMethods,
      })
    );

    const fallbackPayload = { addresses: fallbackAddresses };
    console.log("[SHIPPING-INFO] 🛡️ Returning fallback payload to prevent Magic Checkout freeze:", JSON.stringify(fallbackPayload, null, 2));
    console.log("========================================================\n");

    return res.status(200).json(fallbackPayload);
  }
}