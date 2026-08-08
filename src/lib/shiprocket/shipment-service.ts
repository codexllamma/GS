import { prisma } from "@/lib/prisma";

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getShiprocketToken(): Promise<string> {
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

// 1. Assign AWB Courier & Lock Flyer Dimensions
export async function assignAwbForShipment(shipmentDbId: string) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentDbId },
    include: {
      order: {
        include: {
          orderItems: true,
        },
      },
    },
  });

  if (!shipment) throw new Error("Shipment record not found in DB.");

  const token = await getShiprocketToken();
  const totalUnits = shipment.order.orderItems.reduce((acc, item) => acc + item.quantity, 0);
  const height = totalUnits === 1 ? 3 : 5;
  const weight = Number((totalUnits * 0.245).toFixed(2));

  // Call Shiprocket AWB Assignment Endpoint
  const res = await fetch("https://apiv2.shiprocket.in/v1/external/courier/assign/awb", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      shipment_id: shipment.shiprocketShipmentId || shipment.shiprocketOrderId,
      length: 22,
      breadth: 18,
      height,
      weight,
    }),
  });

  const result = await res.json();
  if (!res.ok || !result.response?.data?.awb_code) {
    throw new Error(`AWB Assignment Failed: ${JSON.stringify(result)}`);
  }

  const awbData = result.response.data;

  // Update DB Shipment record
  const updatedShipment = await prisma.shipment.update({
    where: { id: shipmentDbId },
    data: {
      awbCode: String(awbData.awb_code),
      courierName: String(awbData.courier_name || "Assigned Courier"),
      trackingUrl: awbData.tracking_url || `https://shiprocket.co/tracking/${awbData.awb_code}`,
      status: "AWB_ASSIGNED",
    },
  });

  return updatedShipment;
}

// 2. Fetch Label PDF URL from Shiprocket
export async function getShipmentLabelUrl(shiprocketShipmentIds: string[]): Promise<string> {
  const token = await getShiprocketToken();

  const res = await fetch("https://apiv2.shiprocket.in/v1/external/courier/generate/label", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      shipment_id: shiprocketShipmentIds,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.label_url) {
    throw new Error(`Label Generation Failed: ${JSON.stringify(data)}`);
  }

  return data.label_url;
}