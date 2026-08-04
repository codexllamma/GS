import { Prisma } from "@/generated/prisma";
import { OrderCreateInput, OrderAggregate } from "../types/orders";

const CURRENCY = "INR";

export function mapOrderToOrderCreateInput(
  order: OrderAggregate
): OrderCreateInput {

  const name = order.user?.name?.trim() ?? "";
  const [firstName, ...lastNameParts] = name.split(" ");

  const first = firstName || "";
  const last = lastNameParts.join(" ");

  const userEmail = order.user?.email ?? undefined;
  const userPhone = order.user?.phoneNumber ?? undefined;

  const address1 = order.address?.line1 ?? "";
  const address2 = order.address?.line2 ?? undefined;
  const city = order.address?.city ?? "";
  const province = order.address?.state ?? "";
  const country = order.address?.country ?? "";
  const zip = order.address?.postal ?? "";

  return {
    currency: CURRENCY,

    email: userEmail,

    financialStatus: order.isPaid ? "PAID" : "PENDING",

    shippingAddress: {
      firstName: first,
      lastName: last,
      address1: address1,
      address2: address2,
      city: city,
      province: province,
      country: country,
      zip: zip,
      phone: userPhone,
    },

    billingAddress: {
      firstName: first,
      lastName: last,
      address1: address1,
      address2: address2,
      city: city,
      province: province,
      country: country,
      zip: zip,
      phone: userPhone,
    },

    lineItems: order.orderItems.map((item) => ({
      quantity: item.quantity,

      variantId: item.variant?.shopifyMapping?.shopifyVariantId ?? "",

      priceSet: {
        shopMoney: {
          amount: item.priceAtPurchase.toFixed(2),
          currencyCode: CURRENCY,
        },
      },
    })),
  };
}