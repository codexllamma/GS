import { prisma } from "@/lib/prisma";
import { mapProductToProductSetInput } from "../mappers/products";
import { syncShopifyProduct } from "../services/products";
import { ShopifyProduct } from "../types/products";
import { persistProductMappings } from "../services/mappings";
import { syncProductInventory } from "./inventory";

export async function syncProduct(
  productId: string
): Promise<ShopifyProduct> {
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    include: {
      variants: true,
      images: true,
      shopifyMapping: true,
      fabric: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  const payload = mapProductToProductSetInput(product);
  const shopifyProduct = await syncShopifyProduct(payload);

  await persistProductMappings(product, shopifyProduct);
  await syncProductInventory(product.id);

  return shopifyProduct;
}