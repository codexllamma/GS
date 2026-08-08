import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { getShipmentLabelUrl } from "@/lib/shiprocket/shipment-service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.isAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Missing shipment ID" });
  }

  try {
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      select: { shiprocketShipmentId: true, shiprocketOrderId: true },
    });

    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    const targetId = shipment.shiprocketShipmentId || shipment.shiprocketOrderId;
    const labelUrl = await getShipmentLabelUrl([targetId]);

    return res.status(200).json({ success: true, labelUrl });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch label",
    });
  }
}