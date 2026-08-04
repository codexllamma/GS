import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { addresses } = req.body || {};
    const targetZipcode = addresses?.[0]?.zipcode || "410209";

    // 1. Authenticate with Shiprocket directly (Your working credentials)
    const authRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }),
    });
    const authData = await authRes.json();
    const token = authData.token;

    if (!token) {
      throw new Error("Shiprocket Auth Failed");
    }

    // 2. Query Courier Serviceability (The exact call from your curl test)
    const srRes = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=410209&delivery_postcode=${targetZipcode}&weight=0.5&cod=1&declared_value=1000`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const srData = await srRes.json();
    const couriers = srData?.data?.available_courier_companies || [];

    // 3. Map Shiprocket couriers into Razorpay Magic Checkout format
    const shippingMethods = couriers.map((courier: any) => ({
      id: String(courier.courier_company_id),
      name: String(courier.courier_name),
      description: `Delivered by ${courier.etd || "2-3 days"}`,
      serviceable: true,
      shipping_fee: Math.round(Number(courier.rate || 0) * 100), // ₹105.36 -> 10536 paise
      cod: courier.cod === 1,
      cod_fee: Math.round(Number(courier.cod_charges || 0) * 100), // ₹52.00 -> 5200 paise
    }));

    const mappedAddresses = (addresses || []).map((addr: any) => ({
      id: addr.id ?? "0",
      zipcode: addr.zipcode || targetZipcode,
      state_code: addr.state_code || "MH",
      country: "IN",
      shipping_methods: shippingMethods.length > 0 ? shippingMethods : [
        {
          id: "standard",
          name: "Standard Delivery",
          description: "Delivered in 2-3 days",
          serviceable: true,
          shipping_fee: 0,
          cod: true,
          cod_fee: 0,
        }
      ],
    }));

    return res.status(200).json({ addresses: mappedAddresses });
  } catch (error: any) {
    console.error("Shipping Info Error:", error);
    // Fallback so checkout NEVER blocks the user
    return res.status(200).json({
      addresses: [
        {
          id: "0",
          zipcode: "410209",
          state_code: "MH",
          country: "IN",
          shipping_methods: [
            {
              id: "1",
              name: "Standard Delivery",
              description: "Delivered in 2-3 business days",
              serviceable: true,
              shipping_fee: 0,
              cod: true,
              cod_fee: 0,
            },
          ],
        },
      ],
    });
  }
}