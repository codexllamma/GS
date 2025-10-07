
import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

  if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Verify signature
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature !== razorpaySignature) {
    return res.status(400).json({ message: "Invalid signature" });
  }

  try {
    // Update order isPaid
    await prisma.order.update({
      where: { id: orderId },
      data: { isPaid: true, status: "PROCESSING" }, // optional: update status to start shipment
    });

    return res.status(200).json({ message: "Payment verified and order updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update order" });
  }
}
