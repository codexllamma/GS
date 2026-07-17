

import { Prisma } from "@/generated/prisma";
import { OrderCreateInput,OrderAggregate } from "../types/orders";

const CURRENCY = "INR";

export function mapOrderToOrderCreateInput(
  order: OrderAggregate
): OrderCreateInput {

  const name = order.user.name?.trim() ?? "";
  const [firstName, ...lastNameParts] = name.split(" ");

  const first = firstName || "";
  const last = lastNameParts.join(" ");

  return {
    currency: CURRENCY,

    email: order.user.email ?? undefined,

    financialStatus: order.isPaid ? "PAID" : "PENDING",

    shippingAddress: {
      firstName: first,
      lastName: last,
      address1: order.address.line1,
      address2: order.address.line2 ?? undefined,
      city: order.address.city,
      province: order.address.state,
      country: order.address.country,
      zip: order.address.postal,
      phone: order.user.phoneNumber ?? undefined,
    },

    billingAddress: {
      firstName: first,
      lastName: last,
      address1: order.address.line1,
      address2: order.address.line2 ?? undefined,
      city: order.address.city,
      province: order.address.state,
      country: order.address.country,
      zip: order.address.postal,
      phone: order.user.phoneNumber ?? undefined,
    },

    lineItems: order.orderItems.map((item) => ({
      quantity: item.quantity,

      variantId: item.variant.shopifyMapping!.shopifyVariantId,

      priceSet: {
        shopMoney: {
          amount: item.priceAtPurchase.toFixed(2),
          currencyCode: CURRENCY,
        },
      },
    })),
  };
}