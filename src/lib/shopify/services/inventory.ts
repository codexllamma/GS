import { randomUUID } from "crypto";
import { shopify } from "../client";
import {
  InventorySetQuantitiesInput,
  InventorySetQuantitiesResponse,
} from "../types/products";

const GET_INVENTORY_LEVEL_QUERY = `
query GetInventoryLevel($id: ID!) {
  inventoryItem(id: $id) {
    inventoryLevels(first: 10) {
      nodes {
        location {
          id
        }
        quantities(names: ["available"]) {
          name
          quantity
        }
      }
    }
  }
}
`;

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

/**
 * Fetches the current 'available' stock quantity from Shopify for a specific inventory item
 */
export async function getInventoryQuantity(
  inventoryItemId: string,
  locationId: string
): Promise<number> {
  try {
    const data = await shopify.graphql<any>(GET_INVENTORY_LEVEL_QUERY, {
      id: inventoryItemId,
    });

    const nodes = data?.inventoryItem?.inventoryLevels?.nodes || [];
    const targetLevel = nodes.find((node: any) => node.location?.id === locationId) || nodes[0];

    if (!targetLevel) return 0;

    const availableQty = targetLevel.quantities?.find((q: any) => q.name === "available");
    return availableQty ? availableQty.quantity : 0;
  } catch {
    return 0;
  }
}

export async function inventorySetQuantities(
  input: InventorySetQuantitiesInput
): Promise<void> {
  const data = await shopify.graphql<InventorySetQuantitiesResponse>(
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