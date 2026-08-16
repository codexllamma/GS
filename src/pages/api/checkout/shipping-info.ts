import type { NextApiRequest, NextApiResponse } from "next";

// 1. In-Memory Shiprocket Token Cache (Tokens are valid for 10 days)
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getShiprocketToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error("Shiprocket environment credentials missing.");
  }

  const res = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!data?.token) {
    throw new Error(`Shiprocket auth failed: ${data?.message || "Invalid credentials"}`);
  }

  cachedToken = data.token;
  // Cache for 24 hours
  tokenExpiresAt = now + 24 * 60 * 60 * 1000;

  return cachedToken!;
}

// 2. Default Shipping Methods Helper
function getDefaultShippingMethods(isServiceable = true, isCodAvailable = true) {
  const methods = [
    {
      id: "prepaid_standard",
      name: "Standard Delivery (Prepaid)",
      description: "Delivered in 2-5 business days",
      serviceable: isServiceable,
      shipping_fee: 0, // Free
      cod: false,
      cod_fee: 0,
    },
  ];

  if (isCodAvailable) {
    methods.push({
      id: "cod_standard",
      name: "Cash on Delivery",
      description: "Pay cash upon delivery",
      serviceable: isServiceable,
      shipping_fee: 5000, // ₹50 COD fee in paise
      cod: true,
      cod_fee: 0,
    });
  }

  return methods;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { addresses } = req.body || {};
  const primaryAddress = addresses?.[0];
  const targetZipcode = primaryAddress?.zipcode || "410209";
  const pickupPostcode = process.env.SHIPROCKET_PICKUP_PINCODE || "410209";

  try {
    // 3. Fast Timeout Abort Controller (1.8s cutoff to beat Razorpay's 2.5s timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    const token = await getShiprocketToken();

    const srRes = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickupPostcode}&delivery_postcode=${targetZipcode}&weight=0.5&cod=1&declared_value=1000`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const srData = await srRes.json();
    const couriers = srData?.data?.available_courier_companies || [];

    const isServiceable = couriers.length > 0;
    const isCodAvailable = couriers.some((c: any) => c.cod === 1);

    const shippingMethods = getDefaultShippingMethods(isServiceable, isCodAvailable);

    // 4. Map back maintaining exact incoming address IDs
    const mappedAddresses = (addresses && addresses.length > 0 ? addresses : [{ id: "0", zipcode: targetZipcode }]).map(
      (addr: any) => ({
        id: String(addr.id ?? "0"),
        zipcode: addr.zipcode || targetZipcode,
        state_code: addr.state_code || "MH",
        country: addr.country || "IN",
        shipping_methods: shippingMethods,
      })
    );

    return res.status(200).json({ addresses: mappedAddresses });
  } catch (error: any) {
    console.warn("Shipping Info fallback triggered:", error?.message || error);

    // 5. Bulletproof Fallback: Guarantees Razorpay always gets a matching ID within ~10ms
    const fallbackMethods = getDefaultShippingMethods(true, true);
    const fallbackAddresses = (addresses && addresses.length > 0 ? addresses : [{ id: "0", zipcode: targetZipcode }]).map(
      (addr: any) => ({
        id: String(addr.id ?? "0"),
        zipcode: addr.zipcode || targetZipcode,
        state_code: addr.state_code || "MH",
        country: addr.country || "IN",
        shipping_methods: fallbackMethods,
      })
    );

    return res.status(200).json({ addresses: fallbackAddresses });
  }
}