import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = session.user.id;

  try {
    if (req.method === "GET") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          addresses: {
            where: { isDefault: true },
            take: 1,
          },
        },
      });

      if (!user) return res.status(404).json({ message: "User not found" });

      return res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.addresses?.[0] || null,
      });
    }

    if (req.method === "PUT") {
      const { address } = req.body;

      if (
        !address ||
        !address.line1 ||
        !address.city ||
        !address.state ||
        !address.postal ||
        !address.country
      ) {
        return res.status(400).json({ message: "Incomplete address details" });
      }

      const existingDefault = await prisma.address.findFirst({
        where: { userId, isDefault: true },
      });

      let updatedAddress;
      if (existingDefault) {
        
        updatedAddress = await prisma.address.update({
          where: { id: existingDefault.id },
          data: {
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            postal: address.postal,
            country: address.country,
          },
        });
      } else {
        
        updatedAddress = await prisma.address.create({
          data: {
            userId,
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            postal: address.postal,
            country: address.country,
            isDefault: true,
          },
        });
      }

      return res.status(200).json(updatedAddress);
    }

    
    res.setHeader("Allow", ["GET", "PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error("User API error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
