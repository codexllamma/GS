import { prisma } from "@/lib/prisma";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getShiprocketToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token;
  }

  const res = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(`Shiprocket auth failed: ${data.message || "Invalid credentials"}`);
  }

  cachedToken = { token: data.token, expiresAt: now + 23 * 60 * 60 * 1000 };
  return data.token;
}

export async function executeOrderSplit(internalOrderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: internalOrderId },
    include: {
      user: true,
      address: true,
      shopifyMapping: true,
      orderItems: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });

  if (!order) throw new Error("Order not found in database.");

  const existingShipments = await prisma.shipment.findMany({
    where: { orderId: internalOrderId },
  });
  if (existingShipments.length > 0) {
    return { success: true, message: "Order is already processed.", shipments: existingShipments };
  }

  // Sanitize raw Shopify GID
  let rawOrderId =
    order.shopifyMapping?.shopifyOrderId || order.razorpayOrderId || order.id.slice(0, 8);
  if (rawOrderId.includes("/")) {
    rawOrderId = rawOrderId.split("/").pop() || rawOrderId;
  }

  // Expand line items into individual units with orderItemId link
  const expandedUnits: Array<{ orderItemId: string; name: string; sku: string; price: number }> = [];
  for (const item of order.orderItems) {
    for (let q = 0; q < item.quantity; q++) {
      expandedUnits.push({
        orderItemId: item.id,
        name: item.product?.name || "Product Item",
        sku: item.variantId,
        price: item.priceAtPurchase,
      });
    }
  }

  const totalUnits = expandedUnits.length;
  if (totalUnits === 0) throw new Error("Order has no line items.");

  const token = await getShiprocketToken();

  const customerName = order.user?.name || "Customer";
  const addressLine1 = order.address?.line1 || "Main Address";
  const addressLine2 = order.address?.line2 || "";
  const city = order.address?.city || "City";
  const state = order.address?.state || "State";
  const pincode = order.address?.postal || "000000";
  const email = order.user?.email || "customer@example.com";
  const phone = order.user?.phoneNumber || "9999999999";
  const paymentMethod = order.paymentMethod?.toUpperCase() === "COD" ? "COD" : "Prepaid";
  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || "Home";

  const createdShipments = [];

  // Chunk ANY order into sub-packages of maximum 2 items with explicit flyer dimensions
  for (let i = 0; i < totalUnits; i += 2) {
    const chunk = expandedUnits.slice(i, i + 2);
    const count = chunk.length;
    const subOrderId = `${rawOrderId}-${Math.floor(i / 2) + 1}`;
    const subTotal = chunk.reduce((acc, u) => acc + u.price, 0);

    const uniqueOrderItemIds = Array.from(new Set(chunk.map((u) => u.orderItemId)));

    // Aggregate chunk units by SKU to prevent duplicate SKU entries
    const skuMap = new Map<string, { name: string; sku: string; units: number; price: number }>();
    for (const unit of chunk) {
      const existing = skuMap.get(unit.sku);
      if (existing) {
        existing.units += 1;
      } else {
        skuMap.set(unit.sku, {
          name: unit.name,
          sku: unit.sku,
          units: 1,
          price: unit.price,
        });
      }
    }

    const orderItemsPayload = Array.from(skuMap.values()).map((item) => ({
      name: item.name,
      sku: item.sku,
      units: item.units,
      selling_price: String(item.price),
      discount: "",
      tax: "",
    }));

    const adhocPayload = {
      order_id: subOrderId,
      order_date: new Date().toISOString().slice(0, 10),
      pickup_location: pickupLocation,
      comment: `Package ${Math.floor(i / 2) + 1} for Order #${rawOrderId}`,
      billing_customer_name: customerName,
      billing_last_name: "",
      billing_address: addressLine1,
      billing_address_2: addressLine2,
      billing_city: city,
      billing_pincode: pincode,
      billing_state: state,
      billing_country: "India",
      billing_email: email,
      billing_phone: phone,
      shipping_is_billing: true,
      payment_method: paymentMethod,
      sub_total: subTotal,
      length: 22,
      breadth: 18,
      height: count === 1 ? 3 : 5,
      weight: Number((count * 0.245).toFixed(2)),
      order_items: orderItemsPayload,
    };

    const res = await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(adhocPayload),
    });

    const result = await res.json();

    if (!res.ok || (!result.order_id && !result.shipment_id)) {
      throw new Error(`Failed to create package sub-order ${subOrderId}: ${JSON.stringify(result)}`);
    }

    const created = await prisma.shipment.create({
      data: {
        orderId: internalOrderId,
        shiprocketOrderId: String(result.order_id || subOrderId),
        shiprocketShipmentId: String(result.shipment_id || ""),
        status: "PACKAGE_CREATED",
        orderItems: {
          connect: uniqueOrderItemIds.map((id) => ({ id })),
        },
      },
    });

    createdShipments.push(created);
  }

  // Clean up raw channel master order imported automatically by Shopify channel sync
  try {
    const searchRes = await fetch(
      `https://apiv2.shiprocket.in/v1/external/orders?search=${encodeURIComponent(rawOrderId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const searchData = await searchRes.json();
    const foundOrders: any[] = searchData?.data || [];

    const toCancelIds: number[] = [];

    for (const srOrder of foundOrders) {
      const srChannelId = String(srOrder.channel_order_id || "");
      const srStatus = String(srOrder.status || "").toLowerCase();

      // Strictly match master channel order ID and exclude sub-orders
      const matchesMasterOrder = srChannelId.includes(rawOrderId);
      const isChildOrder = srChannelId.includes("-");
      const isAlreadyCanceled = srStatus.includes("cancel");

      if (matchesMasterOrder && !isChildOrder && !isAlreadyCanceled) {
        toCancelIds.push(srOrder.id);
      }
    }

    if (toCancelIds.length > 0) {
      const cancelRes = await fetch("https://apiv2.shiprocket.in/v1/external/orders/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: toCancelIds }),
      });
      const cancelData = await cancelRes.json();
${toCancelIds.join(", ")}:`, cancelData);
    } else {

    }
  } catch (e) {
    console.warn("[SHIPROCKET MASTER CLEANUP WARN]: Master order cancellation skipped.", e);
  }

  return { success: true, shipments: createdShipments };
}