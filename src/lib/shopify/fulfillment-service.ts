import { prisma } from "@/lib/prisma";

/**
 * Pushes tracking information for a specific shipment/package back to Shopify.
 */
export async function syncFulfillmentToShopify(shipmentId: string) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: {
      order: {
        include: {
          shopifyMapping: true,
        },
      },
    },
  });

  if (!shipment || !shipment.order.shopifyMapping?.shopifyOrderId) {
    console.warn(`[SHOPIFY SYNC SKIPPED]: No Shopify Order ID mapping found for shipment ${shipmentId}`);
    return { success: false, reason: "No Shopify order mapping found" };
  }

  if (!shipment.awbCode) {
    throw new Error("Shipment does not have an AWB code assigned yet.");
  }

  // Extract raw Shopify Order ID (e.g., "6751192678513" from "gid://shopify/Order/6751192678513")
  let shopifyNumericId = shipment.order.shopifyMapping.shopifyOrderId;
  if (shopifyNumericId.includes("/")) {
    shopifyNumericId = shopifyNumericId.split("/").pop() || shopifyNumericId;
  }

  const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN; // e.g., "my-store.myshopify.com"
  const shopifyAccessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (!shopifyDomain || !shopifyAccessToken) {
    throw new Error("Shopify environment variables (SHOPIFY_STORE_DOMAIN / SHOPIFY_ADMIN_ACCESS_TOKEN) are missing.");
  }

  // 1. Fetch Fulfillment Orders for the Shopify Order
  const fulfillmentOrdersRes = await fetch(
    `https://${shopifyDomain}/admin/api/2024-04/orders/${shopifyNumericId}/fulfillment_orders.json`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": shopifyAccessToken,
      },
    }
  );

  const fulfillmentOrdersData = await fulfillmentOrdersRes.json();
  if (!fulfillmentOrdersRes.ok || !fulfillmentOrdersData.fulfillment_orders?.length) {
    throw new Error(`Failed to fetch Shopify fulfillment orders: ${JSON.stringify(fulfillmentOrdersData)}`);
  }

  // Find open fulfillment order
  const openFulfillmentOrder = fulfillmentOrdersData.fulfillment_orders.find(
    (fo: any) => fo.status === "open" || fo.status === "in_progress"
  );

  if (!openFulfillmentOrder) {
    console.warn(`[SHOPIFY SYNC WARN]: No open fulfillment orders found for Shopify Order #${shopifyNumericId}`);
    return { success: true, message: "Order is already completely fulfilled in Shopify." };
  }

  // 2. Create Fulfillment in Shopify with Tracking Details
  const fulfillmentPayload = {
    fulfillment: {
      line_items_by_fulfillment_order: [
        {
          fulfillment_order_id: openFulfillmentOrder.id,
        },
      ],
      tracking_info: {
        number: shipment.awbCode,
        url: shipment.trackingUrl || `https://shiprocket.co/tracking/${shipment.awbCode}`,
        company: shipment.courierName || "Shiprocket",
      },
      notify_customer: true, // Triggers Shopify's native "Your order/package has shipped" email
    },
  };

  const createFulfillmentRes = await fetch(
    `https://${shopifyDomain}/admin/api/2024-04/fulfillments.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": shopifyAccessToken,
      },
      body: JSON.stringify(fulfillmentPayload),
    }
  );

  const createFulfillmentData = await createFulfillmentRes.json();

  if (!createFulfillmentRes.ok) {
    throw new Error(`Failed to create Shopify fulfillment: ${JSON.stringify(createFulfillmentData)}`);
  }

  console.log(`[SHOPIFY FULFILLMENT SYNCED]: Order #${shopifyNumericId}, AWB=${shipment.awbCode}`);

  return { success: true, fulfillment: createFulfillmentData.fulfillment };
}