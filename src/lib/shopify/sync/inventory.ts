import { prisma } from "@/lib/prisma";

import { inventorySetQuantities } from "../services/inventory";

export async function syncInventory(
  productId: string
): Promise<void> {
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },

    include: {
      variants: {
        include: {
          shopifyMapping: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error("Product not found.");
  }

  const locationId =
    process.env.SHOPIFY_LOCATION_ID;

  if (!locationId) {
    throw new Error(
      "Missing SHOPIFY_LOCATION_ID."
    );
  }

  await inventorySetQuantities({
    name: "available",

    reason: "correction",

    quantities: product.variants.map(
      (variant) => {
        if (
          !variant.shopifyMapping ||
          !variant.shopifyMapping.inventoryItemId
        ) {
          throw new Error(
            `Variant ${variant.id} has not been synchronized with Shopify inventory.`
          );
        }

        return {
          inventoryItemId:
            variant.shopifyMapping.inventoryItemId,

          locationId,

          changeFromQuantity: 0,

          quantity: variant.stock,
        };
      }
    ),
  });
}