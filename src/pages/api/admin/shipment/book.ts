import type { NextApiRequest, NextApiResponse } from "next";
import { getXpressBeesToken } from "@/lib/tokenManager";
import prisma from "@/lib/prisma";
import axios from "axios";

const XB_BASE_URL =
  process.env.XB_API_BASE || "https://shipment.xpressbees.com/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { shipmentId } = req.body;

  if (!shipmentId) {
    return res.status(400).json({ error: "shipmentId is required" });
  }

  try {
    // 1. Load shipment and related data
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: {
          include: {
            address: true,
            user: true,
          },
        },
        orderItem: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    const order = shipment.order;
    const address = order.address;
    const item = shipment.orderItem;
    const product = item.product;
    const variant = item.variant;

    if (!address) {
      return res.status(400).json({ error: "Order address missing" });
    }

    // 2. Get valid XpressBees token
    const token = await getXpressBeesToken();

    // 3. Build XpressBees payload
    const payload = {
      data: [
        {
          order_number: shipment.id, // unique per shipment
          waybill_number: "", // let XB auto-generate
          shipping_charges: 0,
          discount: 0,
          cod_charges: 0,
          payment_type: order.paymentMethod === "COD" ? 2 : 1, // 1 = prepaid, 2 = COD

          customer_name: order.user?.name || "Customer",
          customer_mobile: order.user?.phoneNumber || "0000000000",
          customer_email: order.user?.email || "",

          customer_address: `${address.line1}, ${address.line2 || ""}`,
          customer_city: address.city,
          customer_state: address.state,
          customer_pincode: address.postal,
          customer_address_type: "home",

          collectable_amount: order.paymentMethod === "COD" ? order.total : 0,

          order_items: [
            {
              name: product.name,
              sku: `${product.id}-${variant.size}`,
              quantity: 1, // shipment always 1
              price: item.priceAtPurchase,
              weight: shipment.weightKg || 0.2,
            },
          ],

          package_weight: 0.35,
          package_dimensions: {
            length: 36,
            breadth: 25,
            height: 3,
          },

          pickup_details: {
            name: "THKR FUTURETECH PRIVATE LIMITED", // CHANGE THIS to your pickup name
            mobile: "9920511572", // CHANGE THIS
            address: "A-606, Parth Avenue CHS, Sec-20, Kamothe, Navi Mumbai",
            city: "Navi Mumbai",
            state: "Maharashtra",
            pincode: "410209",
          },

          return_address: {
            name: "THKR FUTURETECH PRIVATE LIMITED", // CHANGE THIS to your pickup name
            mobile: "9920511572", // CHANGE THIS
            address: "A-606, Parth Avenue CHS, Sec-20, Kamothe, Navi Mumbai",
            city: "Navi Mumbai",
            state: "Maharashtra",
            pincode: "410209",
          },
        },
      ],
    };

    console.log("📦 XpressBees Payload:", JSON.stringify(payload, null, 2));

    // 4. Call XpressBees API
    const resp = await axios.post(
      `${XB_BASE_URL}/shipments2`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = resp.data;

    if (!result?.data?.[0]?.awb_number) {
      console.error("XpressBees error:", result);
      return res.status(500).json({ error: "Failed to create shipment", details: result });
    }

    const awb = result.data[0].awb_number;

    // 5. Save AWB and update status
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        awb,
        status: "BOOKED",
        shippingService: result.data[0].courier_name || "XpressBees",
      },
    });

    return res.json({
      success: true,
      awb,
    });
  } catch (error: any) {
    console.error("Shipment booking error:", error.response?.data || error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.response?.data || error.message,
    });
  }
}
