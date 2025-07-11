import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}
