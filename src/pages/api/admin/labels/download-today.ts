import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
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

  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Fetch all shipments created today with an assigned AWB or valid shipment ID
    const todayShipments = await prisma.shipment.findMany({
      where: {
        createdAt: { gte: startOfToday },
        shiprocketShipmentId: { not: "" },
      },
      select: { shiprocketShipmentId: true, shiprocketOrderId: true },
    });

    if (todayShipments.length === 0) {
      return res.status(404).json({ message: "No split packages found for today." });
    }

    const shipmentIds = todayShipments.map((s) => s.shiprocketShipmentId || s.shiprocketOrderId);
    const labelUrl = await getShipmentLabelUrl(shipmentIds);

    // Stream the PDF back to client for instant browser download
    const pdfRes = await fetch(labelUrl);
    if (!pdfRes.ok) throw new Error("Failed to download PDF from Shiprocket");

    const arrayBuffer = await pdfRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=labels-${new Date().toISOString().slice(0, 10)}.pdf`
    );
    return res.status(200).send(buffer);
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to download batch labels",
    });
  }
}