import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  try {

    if (req.method !== "POST") {
      return res.status(405).json({
        message: "Method not allowed",
      });
    }

    const { variantIds } = req.body;

    if (
      !Array.isArray(variantIds) ||
      variantIds.length === 0
    ) {
      return res.status(200).json({
        variants: [],
      });
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        id: {
          in: variantIds,
        },
      },

      include: {
        product: {
          include: {

            images: true,
            variants: true,

            fabric: {
              include: {
                category: true,
              },
            },

          },
        },
      },
    });

    return res.status(200).json({ variants });

  } catch (error) {

    console.error("Hydrate guest cart error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}