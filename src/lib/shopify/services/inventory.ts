import { randomUUID } from "crypto";

import { shopify } from "../client";

import {
  InventorySetQuantitiesInput,
  InventorySetQuantitiesResponse,
} from "../types/products";

const INVENTORY_SET_QUANTITIES_MUTATION = `
mutation InventorySetQuantities(
  $input: InventorySetQuantitiesInput!
  $idempotencyKey: String!
) {
  inventorySetQuantities(input: $input)
    @idempotent(key: $idempotencyKey) {

    inventoryAdjustmentGroup {
      id
      createdAt
      reason
      referenceDocumentUri
    }

    userErrors {
      field
      message
      code
    }
  }
}
`;

export async function inventorySetQuantities(
  input: InventorySetQuantitiesInput
): Promise<void> {
  const data =
    await shopify.graphql<InventorySetQuantitiesResponse>(
      INVENTORY_SET_QUANTITIES_MUTATION,
      {
        input,
        idempotencyKey: randomUUID(),
      }
    );

  const result = data.inventorySetQuantities;

  if (result.userErrors.length > 0) {
    throw new Error(
      result.userErrors
        .map((e) =>
          e.field?.length
            ? `${e.field.join(".")}: ${e.message}`
            : e.message
        )
        .join("\n")
    );
  }
}