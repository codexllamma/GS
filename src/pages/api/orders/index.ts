import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const orders = await prisma.order.findMany({
        where: { userId: session.user.id },
        include: {
          orderItems: {
            include: { product: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json(orders);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
