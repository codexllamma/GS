import {
  ProductAggregate,
  ProductSetInput,
} from "../types/products";

export function mapProductToProductSetInput(
  product: ProductAggregate
): ProductSetInput {
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
      optionValues: [
        {
          optionName: "Size",
          name: variant.size,
        },
      ],

      price: (variant.price ?? product.basePrice).toString(),

      inventoryItem: {
        tracked: true,
      },
    })),
  };
}