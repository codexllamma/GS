import type { NextApiRequest, NextApiResponse } from "next";
import { executeOrderSplit } from "@/lib/shiprocket/split-service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ success: false, message: "Missing order ID" });
  }

  try {
    const result = await executeOrderSplit(id);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Split operation failed",
    });
  }
}