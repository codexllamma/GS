import { shopify } from "@/lib/shopify/client";

export async function getShop() {
  const data = await shopify.get("shop.json");
  return data.shop;
}