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
      customer {
        id
        email
      }
      lineItems(first: 100) {
        nodes {
          id
          quantity
          variant { id }
          product { id }
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
);

  const response = await shopify.graphql<OrderCreateResponse>(
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

  if (result.userErrors && result.userErrors.length > 0) {
    const errorMessage = result.userErrors
      .map(({ field, message }) => `${field?.join(".") || "order"}: ${message}`)
      .join("\n");

    console.error("[SHOPIFY SYNC USER ERRORS]:", errorMessage);
    throw new Error(`Shopify Order Creation Failed:\n${errorMessage}`);
  }

  if (!result.order) {
    console.error("[SHOPIFY SYNC ERROR] No order returned:", response);
    throw new Error("Shopify did not return an order.");
  }

`);
  return result.order;
}