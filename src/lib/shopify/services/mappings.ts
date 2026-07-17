import { prisma } from "@/lib/prisma";

import { ProductAggregate,ShopifyProduct } from "../types/products";

import { OrderAggregate,ShopifyOrder } from "../types/orders";


export async function persistProductMappings(
  product: ProductAggregate,
  shopifyProduct: ShopifyProduct
): Promise<void> {
  // Persist Product Mapping
  await prisma.shopifyProductMapping.upsert({
    where: {
      productId: product.id,
    },
    update: {
      shopifyProductId: shopifyProduct.id,
    },
    create: {
      productId: product.id,
      shopifyProductId: shopifyProduct.id,
    },
  });

  // Build lookup: Size -> Shopify Variant
  const variantLookup = new Map(
    shopifyProduct.variants.nodes.map((variant) => [
      variant.selectedOptions.find(
        (option) => option.name === "Size"
      )?.value,
      variant,
    ])
  );

  // Persist Variant Mappings
  for (const variant of product.variants) {
    const shopifyVariant = variantLookup.get(variant.size);

    if (!shopifyVariant) {
      throw new Error(
        `No Shopify variant found for size "${variant.size}".`
      );
    }

    await prisma.shopifyVariantMapping.upsert({
      where: {
        variantId: variant.id,
      },
      update: {
        shopifyVariantId: shopifyVariant.id,
        inventoryItemId:
          shopifyVariant.inventoryItem.id,
      },
      create: {
        variantId: variant.id,
        shopifyVariantId: shopifyVariant.id,
        inventoryItemId:
          shopifyVariant.inventoryItem.id,
      },
    });
  }
}

export async function persistOrderMappings(
    order: OrderAggregate,
    shopifyOrder: ShopifyOrder
): Promise<void> {
    await prisma.shopifyOrderMapping.upsert({
        where: {
            orderId: order.id,
        },
        update: {
            shopifyOrderId: shopifyOrder.id,
        },
        create: {
            orderId: order.id,
            shopifyOrderId: shopifyOrder.id,
        },
    });
}