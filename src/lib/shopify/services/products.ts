import { shopify } from "../client";

import {
  ProductSetInput,
  ProductSetResponse,
  ShopifyProduct,
} from "../types/products";

const PRODUCT_SET_MUTATION = `
mutation ProductSet(
  $input: ProductSetInput!,
  $synchronous: Boolean!
) {
  productSet(
    input: $input,
    synchronous: $synchronous
  ) {
    product {
      id
      title

      variants(first: 100) {
        nodes {
          id

          selectedOptions {
          name
          value
          }
          
          inventoryItem {
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

export async function syncShopifyProduct(
    input: ProductSetInput
): Promise<ShopifyProduct>{
  const data =
    await shopify.graphql<ProductSetResponse>(
      PRODUCT_SET_MUTATION,
      {
        input,
        synchronous: true,
      }
    );

  const result = data.productSet;

  if (result.userErrors.length > 0) {
    throw new Error(
      result.userErrors
        .map((e) => e.message)
        .join("\n")
    );
  }

  if (!result.product) {
    throw new Error(
      "Shopify did not return a product."
    );
  }

  return result.product;
}