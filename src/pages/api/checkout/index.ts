import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

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

  try {

    // -----------------------------------
    // AUTH
    // -----------------------------------

    const session = await getServerSession(
      req,
      res,
      authOptions
    );

    if (!session?.user?.id) {

      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const userId = session.user.id;

    // -----------------------------------
    // BODY
    // -----------------------------------

    const {
      address,
      paymentMethod,
    } = req.body;

    if (!address || !paymentMethod) {

      return res.status(400).json({
        message:
          "Address and payment method are required",
      });
    }

    // -----------------------------------
    // ADDRESS
    // -----------------------------------

    let existingAddress =
      await prisma.address.findFirst({
        where: {
          userId,
          line1: address.line1,
          city: address.city,
          postal: address.postal,
        },
      });

    if (!existingAddress) {

      existingAddress =
        await prisma.address.create({
          data: {
            userId,

            line1: address.line1,

            line2:
              address.line2 || null,

            city: address.city,

            state: address.state,

            postal: address.postal,

            country: address.country,

            isDefault: true,
          },
        });
    }

    // -----------------------------------
    // LOAD CART
    // -----------------------------------

    const cart = await prisma.cart.findFirst({
      where: {
        userId,
      },

      include: {
        items: {
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

    if (!cart || cart.items.length === 0) {

      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    // -----------------------------------
    // TOTALS
    // -----------------------------------

    const subtotal = cart.items.reduce(
      (sum, item) => {

        const price =
          item.variant.price ??
          item.variant.product.basePrice ??
          0;

        return (
          sum +
          item.quantity * price
        );
      },
      0
    );

    const deliveryCharge = 0;

    const total =
      subtotal + deliveryCharge;

    // -----------------------------------
    // COD FLOW
    // -----------------------------------

    if (paymentMethod === "COD") {

      const order =
        await prisma.$transaction(
          async (tx) => {

            // -------------------------
            // STOCK VALIDATION +
            // DECREMENT
            // -------------------------

            for (const item of cart.items) {

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
                  `Insufficient stock for ${item.variant.product.name} - ${item.variant.size}`
                );
              }
            }

            // -------------------------
            // CREATE ORDER
            // -------------------------

            const createdOrder =
              await tx.order.create({
                data: {

                  userId,

                  addressId:
                    existingAddress.id,

                  paymentMethod,

                  subtotal,

                  deliveryCharge,

                  total,

                  status: "PROCESSING",

                  isPaid: false,

                  shipmentStatus:
                    "NOT_CREATED",

                  orderItems: {
                    create:
                      cart.items.map(
                        (item) => ({
                          variantId:
                            item.variantId,

                          quantity:
                            item.quantity,

                          priceAtPurchase:
                            item.variant.price ??
                            item.variant.product.basePrice ??
                            0,

                          productId:
                            item.variant.product.id,
                        })
                      ),
                  },
                },

                include: {
                  orderItems: true,
                },
              });

            // -------------------------
            // CLEAR CART
            // -------------------------

            await tx.cartItem.deleteMany({
              where: {
                cartId: cart.id,
              },
            });

            return createdOrder;
          }
        );

      return res.status(201).json({
        order,
        message:
          "Cash on Delivery order placed",
      });
    }

    // -----------------------------------
    // RAZORPAY FLOW
    // -----------------------------------

    if (paymentMethod === "RAZORPAY") {

      // -------------------------
      // ONLY VALIDATE STOCK
      // NO DECREMENT YET
      // -------------------------

      for (const item of cart.items) {

        if (
          item.variant.stock <
          item.quantity
        ) {

          return res.status(400).json({
            message:
              `Insufficient stock for ${item.variant.product.name} - ${item.variant.size}`,
          });
        }
      }

      // -------------------------
      // CREATE PENDING ORDER
      // -------------------------

      const pendingOrder =
        await prisma.order.create({
          data: {

            userId,

            addressId:
              existingAddress.id,

            paymentMethod,

            subtotal,

            deliveryCharge,

            total,

            status: "PENDING",

            isPaid: false,

            shipmentStatus:
              "NOT_CREATED",

            orderItems: {
              create:
                cart.items.map(
                  (item) => ({
                    variantId:
                      item.variantId,

                    quantity:
                      item.quantity,

                    priceAtPurchase:
                      item.variant.price ??
                      item.variant.product.basePrice ??
                      0,

                    productId:
                      item.variant.product.id,
                  })
                ),
            },
          },

          include: {
            orderItems: true,
          },
        });

      // -------------------------
      // CREATE RAZORPAY ORDER
      // -------------------------

      const razorpayOrder =
        await razorpay.orders.create({
          amount:
            Math.round(
              pendingOrder.total * 100
            ),

          currency: "INR",

          receipt:
            `rpay_${pendingOrder.id.slice(0, 8)}`,

          notes: {
            internalOrderId:
              pendingOrder.id,

            userId,
          },
        });

      return res.status(201).json({
        order: pendingOrder,

        razorpayOrder,

        message:
          "Proceed to payment",
      });
    }

    // -----------------------------------
    // INVALID METHOD
    // -----------------------------------

    return res.status(400).json({
      message: "Invalid payment method",
    });

  } catch (error: any) {

    console.error(
      "Checkout API error:",
      error
    );

    const msg =
      error?.message ||
      "Internal Server Error";

    const isClientErr =
      msg === "Cart is empty" ||
      msg.startsWith(
        "Insufficient stock"
      );

    return res
      .status(
        isClientErr
          ? 400
          : 500
      )
      .json({
        message: msg,
      });
  }
}
