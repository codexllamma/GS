// pages/api/checkout/shipping-info.ts

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { addresses } = req.body || {};
    const targetZipcode = addresses?.[0]?.zipcode || "410209";

    // 1. Get credentials safely from environment variables
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
      throw new Error("Shiprocket environment credentials missing.");
    }

    // 2. Authenticate with Shiprocket
    const authRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const authData = await authRes.json();
    const token = authData.token;

    if (!token) {
      throw new Error(`Shiprocket Auth Failed: ${authData.message || JSON.stringify(authData)}`);
    }

    // 3. Query Courier Serviceability from Shiprocket
    const pickupPostcode = process.env.SHIPROCKET_PICKUP_PINCODE || "410209";
    const srRes = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickupPostcode}&delivery_postcode=${targetZipcode}&weight=0.5&cod=1&declared_value=1000`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const srData = await srRes.json();
    const couriers = srData?.data?.available_courier_companies || [];

    const isServiceable = couriers.length > 0;
    const isCodAvailable = couriers.some((courier: any) => courier.cod === 1);

    // 4. Construct Razorpay Shipping Methods (Amounts in PAISE: ₹50 = 5000)
    const shippingMethods: any[] = [];

    // Option 1: Prepaid (Free Shipping)
    shippingMethods.push({
      id: "prepaid_standard",
      name: "Standard Delivery (Prepaid)",
      description: "Delivered in 2-5 business days",
      serviceable: isServiceable,
      shipping_fee: 0, // Displays "FREE" badge
      cod: false,
      cod_fee: 0,
    });

    // Option 2: Cash on Delivery (₹50 COD Fee)
    // Option 2: Cash on Delivery (₹59 Fee)
    if (isCodAvailable) {
      shippingMethods.push({
        id: "cod_standard",
        name: "Cash on Delivery",
        description: "Pay cash upon delivery",
        serviceable: isServiceable && isCodAvailable,
        shipping_fee: 5900,     // Base shipping cost (0 if free shipping)
        cod: true,           // Unlocks the COD payment option
        cod_fee: 0,       // ₹59 in paise (The extra COD surcharge)
      });
    }

    // 5. Map response for Razorpay
    const mappedAddresses = (addresses || []).map((addr: any) => ({
      id: addr.id ?? "0",
      zipcode: addr.zipcode || targetZipcode,
      state_code: addr.state_code || "MH",
      country: "IN",
      shipping_methods: shippingMethods,
    }));

    return res.status(200).json({ addresses: mappedAddresses });
  } catch (error: any) {
    console.error("Shipping Info Error:", error);

    // Graceful fallback options so Magic Checkout does not fail
    return res.status(200).json({
      addresses: [
        {
          id: "0",
          zipcode: "410209",
          state_code: "MH",
          country: "IN",
          shipping_methods: [
            {
              id: "prepaid_fallback",
              name: "Standard Delivery (Prepaid)",
              description: "Delivered in 2-5 business days",
              serviceable: true,
              shipping_fee: 0,
              cod: false,
              cod_fee: 0,
            },
            {
              id: "cod_fallback",
              name: "Cash on Delivery",
              description: "Pay cash upon delivery",
              serviceable: true,
              shipping_fee: 5900, // ₹50
              cod: true,
              cod_fee: 0,
            },
          ],
        },
      ],
    });
  }
}