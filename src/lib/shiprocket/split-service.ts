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
  // Query order with nested variant and shopifyMapping inclusions
  const order = await prisma.order.findUnique({
    where: { id: internalOrderId },
    include: {
      orderItems: {
        include: {
          variant: {
            include: {
              shopifyMapping: true,
            },
          },
        },
      },
    },
  });

  if (!order) throw new Error("Order not found in database.");

  // Check if order was already processed
  const existingShipments = await prisma.shipment.findMany({
    where: { orderId: internalOrderId },
  });
  if (existingShipments.length > 0) {
    return { success: true, message: "Order is already split.", shipments: existingShipments };
  }

  const token = await getShiprocketToken();
  const shiprocketChannelOrderId = order.razorpayOrderId || order.id.slice(0, 8);

  // Expand items into individual units using raw variantId (matching raw Shopify SKU)
  const expandedUnits: Array<{ sku: string; price: number }> = [];
  for (const item of order.orderItems) {
    const sku = item.variantId; // Raw unsliced CUID matching Shopify SKU
    for (let q = 0; q < item.quantity; q++) {
      expandedUnits.push({ sku, price: item.priceAtPurchase });
    }
  }

  const totalUnits = expandedUnits.length;
  if (totalUnits === 0) throw new Error("Order has no line items.");

  // CASE 1: 1 or 2 Items -> Patch Flyer Dimensions Only
  if (totalUnits <= 2) {
    const height = totalUnits === 1 ? 3 : 5;
    const weight = Number((totalUnits * 0.245).toFixed(2));

    const res = await fetch("https://apiv2.shiprocket.in/v1/external/orders/update/adhoc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        order_id: shiprocketChannelOrderId,
        length: 22,
        width: 18,
        height,
        weight,
      }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(`Shiprocket patch error: ${JSON.stringify(result)}`);

    const shipment = await prisma.shipment.create({
      data: {
        orderId: internalOrderId,
        shiprocketOrderId: shiprocketChannelOrderId,
        shiprocketShipmentId: String(result.shipment_id || ""),
        status: "DIMENSIONS_UPDATED",
      },
    });

    return { success: true, shipments: [shipment] };
  }

  // CASE 2: 3+ Items -> Split Into Packages of Max 2 Items Each
  const shipmentsPayload = [];
  for (let i = 0; i < totalUnits; i += 2) {
    const chunk = expandedUnits.slice(i, i + 2);
    const count = chunk.length;

    // Consolidate duplicate SKUs inside the package
    const skuMap = new Map<string, number>();
    for (const unit of chunk) {
      skuMap.set(unit.sku, (skuMap.get(unit.sku) || 0) + 1);
    }

    shipmentsPayload.push({
      order_items: Array.from(skuMap.entries()).map(([sku, quantity]) => ({ sku, quantity })),
      length: 22,
      width: 18,
      height: count === 1 ? 3 : 5,
      weight: Number((count * 0.245).toFixed(2)),
    });
  }

  const res = await fetch("https://apiv2.shiprocket.in/v1/external/orders/split", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      order_id: shiprocketChannelOrderId,
      shipment: shipmentsPayload,
    }),
  });

  const result = await res.json();
  if (!res.ok) throw new Error(`Shiprocket split failed: ${JSON.stringify(result)}`);

  const createdShipments = [];
  const splitPackages = result.shipments || result.data || [];

  if (Array.isArray(splitPackages) && splitPackages.length > 0) {
    for (const pkg of splitPackages) {
      const created = await prisma.shipment.create({
        data: {
          orderId: internalOrderId,
          shiprocketOrderId: String(pkg.order_id || shiprocketChannelOrderId),
          shiprocketShipmentId: String(pkg.shipment_id || ""),
          status: "SPLIT_CREATED",
        },
      });
      createdShipments.push(created);
    }
  } else {
    for (let idx = 0; idx < shipmentsPayload.length; idx++) {
      const created = await prisma.shipment.create({
        data: {
          orderId: internalOrderId,
          shiprocketOrderId: `${shiprocketChannelOrderId}-${idx + 1}`,
          status: "SPLIT_CREATED",
        },
      });
      createdShipments.push(created);
    }
  }

  return { success: true, shipments: createdShipments };
}