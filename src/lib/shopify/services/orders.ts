import { shopify } from "../client";

import {
  OrderCreateInput,
  OrderCreateResponse,
  ShopifyOrder,
} from "../types/orders";

const ORDER_CREATE_MUTATION = `
mutation OrderCreate(
  $order: OrderCreateOrderInput!
  $options: OrderCreateOptionsInput
) {
  orderCreate(
    order: $order
    options: $options
  ) {
    order {
      id
      name
      number

      lineItems(first: 100) {
        nodes {
          id
          quantity

          variant {
            id
          }

          product {
            id
          }
        }
      }
    }

    userErrors {
      field
      message
    }
  }
}
`;

export async function syncShopifyOrder(
  payload: OrderCreateInput
): Promise<ShopifyOrder> {
  const response =
    await shopify.graphql<OrderCreateResponse>(
      ORDER_CREATE_MUTATION,
      {
        order: payload,

        options: {
          inventoryBehaviour: "BYPASS",
          sendReceipt: false,
          sendFulfillmentReceipt: false,
        },
      }
    );

  const result = response.orderCreate;

  if (result.userErrors.length > 0) {
    throw new Error(
      result.userErrors
        .map(({ field, message }) => {
          const location = field?.join(".") ?? "order";
          return `${location}: ${message}`;
        })
        .join("\n")
    );
  }

  if (!result.order) {
    throw new Error("Shopify did not return an order.");
  }

  return result.order;
}