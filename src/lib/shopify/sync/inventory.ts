import { prisma } from "@/lib/prisma";
import {
  inventorySetQuantities,
  getInventoryQuantity,
} from "../services/inventory";

/**
 * Bulk syncs inventory for ALL variants under a product
 */
export async function syncProductInventory(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: {
        include: {
          shopifyMapping: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error(`Product not found for ID: ${productId}`);
  }

  const locationId = process.env.SHOPIFY_LOCATION_ID;
  if (!locationId) {
    throw new Error("Missing SHOPIFY_LOCATION_ID.");
  }

  const mappedVariants = product.variants.filter(
    (variant) => variant.shopifyMapping?.inventoryItemId
  );

  if (mappedVariants.length === 0) {
    console.warn(`[SYNC PRODUCT INVENTORY] No mapped variants found for product ${productId}. Skipping.`);
    return;
  }

  // Fetch current live stock for each variant on Shopify
  const quantities = await Promise.all(
    mappedVariants.map(async (variant) => {
      const inventoryItemId = variant.shopifyMapping!.inventoryItemId;
      const currentShopifyQty = await getInventoryQuantity(inventoryItemId, locationId);

      return {
        inventoryItemId,
        locationId,
        changeFromQuantity: currentShopifyQty,
        quantity: variant.stock,
      };
    })
  );

  await inventorySetQuantities({
    name: "available",
    reason: "correction",
    quantities,
  });
}

/**
 * Targeted sync for a SINGLE variant
 */
export async function syncVariantInventory(variantId: string): Promise<void> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      shopifyMapping: true,
    },
  });

  if (!variant) {
    throw new Error(`Variant not found for ID: ${variantId}`);
  }

  if (!variant.shopifyMapping?.inventoryItemId) {
    throw new Error(
      `Variant ${variantId} has not been synchronized with Shopify inventory.`
    );
  }

  const locationId = process.env.SHOPIFY_LOCATION_ID;
  if (!locationId) {
    throw new Error("Missing SHOPIFY_LOCATION_ID.");
  }

  const inventoryItemId = variant.shopifyMapping.inventoryItemId;

  // Fetch current live stock from Shopify to satisfy changeFromQuantity requirement
  const currentShopifyQty = await getInventoryQuantity(inventoryItemId, locationId);

  await inventorySetQuantities({
    name: "available",
    reason: "correction",
    quantities: [
      {
        inventoryItemId,
        locationId,
        changeFromQuantity: currentShopifyQty,
        quantity: variant.stock,
      },
    ],
  });
}