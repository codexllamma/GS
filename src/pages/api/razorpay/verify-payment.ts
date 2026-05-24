import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  if (req.method !== "POST") {

    res.setHeader("Allow", ["POST"]);

    return res
      .status(405)
      .end(`Method ${req.method} Not Allowed`);
  }

  const {
    orderId,
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
  } = req.body;

  // -------------------------
  // BASIC VALIDATION
  // -------------------------

  if (
    !orderId ||
    !razorpayPaymentId ||
    !razorpayOrderId ||
    !razorpaySignature
  ) {

    return res.status(400).json({
      message: "Missing required fields",
    });
  }

  // -------------------------
  // SIGNATURE VERIFICATION
  // -------------------------

  const generatedSignature = crypto
    .createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET!
    )
    .update(
      `${razorpayOrderId}|${razorpayPaymentId}`
    )
    .digest("hex");

  if (
    generatedSignature !==
    razorpaySignature
  ) {

    return res.status(400).json({
      message: "Invalid signature",
    });
  }

  try {

    // -------------------------
    // TRANSACTION
    // -------------------------

    await prisma.$transaction(
      async (tx) => {

        // -------------------------
        // LOAD ORDER
        // -------------------------

        const order =
          await tx.order.findUnique({
            where: {
              id: orderId,
            },

            include: {
              orderItems: {
                include: {
                  variant: {
                    include: {
                      product: true,
                    },
                  },
                },
              },
            },
          });

        if (!order) {

          throw new Error(
            "Order not found"
          );
        }

        // -------------------------
        // IDEMPOTENCY CHECK
        // -------------------------

        if (order.isPaid) {

          return;
        }

        // -------------------------
        // STOCK VALIDATION
        // -------------------------

        for (const item of order.orderItems) {

          if (
            item.variant.stock <
            item.quantity
          ) {

            throw new Error(
              `Insufficient stock for ${item.variant.product.name} - ${item.variant.size}`
            );
          }
        }

        // -------------------------
        // STOCK DECREMENT
        // -------------------------

        for (const item of order.orderItems) {

          const result =
            await tx.productVariant.updateMany({
              where: {
                id: item.variantId,

                stock: {
                  gte: item.quantity,
                },
              },

              data: {
                stock: {
                  decrement:
                    item.quantity,
                },
              },
            });

          if (result.count === 0) {

            throw new Error(
              `Failed stock decrement for ${item.variant.product.name} - ${item.variant.size}`
            );
          }
        }

        // -------------------------
        // MARK ORDER PAID
        // -------------------------

        await tx.order.update({
          where: {
            id: orderId,
          },

          data: {

            isPaid: true,

            status: "PROCESSING",

          },
        });

        // -------------------------
        // CLEAR USER CART
        // -------------------------

        const cart =
          await tx.cart.findFirst({
            where: {
              userId: order.userId,
            },
          });

        if (cart) {

          await tx.cartItem.deleteMany({
            where: {
              cartId: cart.id,
            },
          });
        }
      }
    );

    return res.status(200).json({
      message:
        "Payment verified successfully",
    });

  } catch (err: any) {

    console.error(
      "Verify payment error:",
      err
    );

    return res.status(500).json({
      message:
        err?.message ||
        "Failed to verify payment",
    });
  }
}