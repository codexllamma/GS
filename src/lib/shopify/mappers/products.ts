import {
  ProductAggregate,
  ProductSetInput,
} from "../types/products";

export function mapProductToProductSetInput(
  product: ProductAggregate
): ProductSetInput {
  // Extract category weight or default to 245.0 grams
  const itemWeightGrams = product.fabric?.category?.weightGrams ?? 245.0;

  return {
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

    variants: product.variants.map((variant) => ({
      sku: variant.id, // Full raw unsliced DB variant ID (e.g. "cmo1iorjb001yla0b0quuiz15")

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