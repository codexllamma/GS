import {
  ProductAggregate,
  ProductSetInput,
} from "../types/products";

export function mapProductToProductSetInput(
  product: ProductAggregate
): ProductSetInput {
  const itemWeightGrams = product.fabric?.category?.weightGrams ?? 245.0;

  // Sort images: primary image first, followed by supporting gallery images
  const sortedImages = product.images
    ? [...product.images].sort(
        (a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)
      )
    : [];

  const files = sortedImages.map((img) => ({
    originalSource: img.url,
    contentType: "IMAGE" as const,
    alt: product.name,
  }));

  return {
    ...(product.shopifyMapping?.shopifyProductId && {
      id: product.shopifyMapping.shopifyProductId,
    }),

    title: product.name,
    descriptionHtml: product.description,
    vendor: "HIER",
    productType: product.fabric.category.name,
    status: "ACTIVE",

    tags: [
      product.color,
      product.fabric.name,
      product.fabric.category.name,
    ],

    giftCard: false,

    productOptions: [
      {
        name: "Size",
        values: product.variants.map((variant) => ({
          name: variant.size,
        })),
      },
    ],

    files,

    variants: product.variants.map((variant) => ({
      sku: variant.id,
      optionValues: [
        {
          optionName: "Size",
          name: variant.size,
        },
      ],
      price: (variant.price ?? product.basePrice).toString(),
      inventoryItem: {
        tracked: true,
        measurement: {
          weight: {
            value: itemWeightGrams,
            unit: "GRAMS",
          },
        },
      },
    })),
  };
}