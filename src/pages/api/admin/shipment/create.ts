import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import axios from "axios";
import { getXpressBeesToken } from "@/lib/tokenManager";

const XB_BASE_URL =
  process.env.XB_API_BASE || "https://shipment.xpressbees.com/api";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  
  const { orderId, orderItemId } = req.body;

  if (!orderId || !orderItemId) {
    return res.status(400).json({ error: "orderId and orderItemId required" });
  }

  try {
    // 1. Load the order + orderItem + product + address
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: {
          include: {
            address: true,
            user: true,
          },
        },
        product: true,
        variant: true,
      },
    });

    if (!orderItem) {
      return res.status(404).json({ error: "OrderItem not found" });
    }

    const order = orderItem.order;
    const address = order.address;

    const fullAddress = [address.line1, address.line2]
  .filter(Boolean)           // removes null/undefined/""
  .join(", ");               // combine with comma


    if (!address) {
      return res.status(400).json({ error: "Order does not contain address" });
    }

    // 2. Determine next sequenceIndex
    const existingShipments = await prisma.shipment.findMany({
      where: { orderItemId },
    });
    const sequenceIndex = existingShipments.length;

    // 3. Create shipment in DB
    const shipment = await prisma.shipment.create({
      data: {
        orderId,
        orderItemId,
        sequenceIndex,
        status: "NOT_CREATED",
      },
    });

    // 4. Build XpressBees payload
    const payload = {
  order_number: shipment.id,                       // UNIQUE PER SHIPMENT
  shipping_charges: order.deliveryCharge || 0,
  discount: 0,                                      // optional
  cod_charges: order.paymentMethod === "COD" ? 30 : 0,
  payment_type: order.paymentMethod === "COD" ? "cod" : "prepaid",
  order_amount: orderItem.priceAtPurchase,         // per item amount
  package_weight: 300,                             // grams (XB expects grams)
  package_length: 20,
  package_breadth: 15,
  package_height: 2,
  request_auto_pickup: "yes",

  consignee: {
    name: order.user?.name || "",
    address: address.line1,
    address_2: address.line2 || "",
    city: address.city,
    state: address.state,
    pincode: address.postal,
    phone: order.user?.phoneNumber || "9999999999",
  },

  pickup: {
    warehouse_name: "Warehouse 1",
    name: "Shiv",
    address: "Your Pickup Address",
    address_2: "",
    city: "Navi Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    phone: "9999999999",
  },

  order_items: [
    {
      name: orderItem.product.name,
      qty: "1",
      price: String(orderItem.priceAtPurchase),
      sku: `${orderItem.product.id}-${orderItem.variant.size}`,
    }
  ],

  courier_id: "1",                                  // XB default
  collectable_amount: 1,
};

//order.paymentMethod === "COD"
      //? orderItem.priceAtPurchase


    // 5. Get token
    const token = await getXpressBeesToken();

    // 6. Book shipment at XpressBees
    const resp = await axios.post(`${XB_BASE_URL}/shipments2`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const awb = resp.data?.data?.[0]?.awb_number;

    if (!awb) {
      console.error("XpressBees Error:", resp.data);
      return res.status(500).json({ error: "Failed to book shipment" });
    }

    // 7. Update shipment with AWB
    const updatedShipment = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        awb,
        status: "BOOKED",
        shippingService: resp.data?.data?.[0]?.courier_name || "XpressBees",
      },
    });

    return res.json({
      success: true,
      shipment: updatedShipment,
    });
  } catch (err: any) {
    console.error("Shipment Create + Book Error:", err.response?.data || err);
    return res.status(500).json({
      error: "Internal Server Error",
      details: err.response?.data || err.message,
    });
  }
}
