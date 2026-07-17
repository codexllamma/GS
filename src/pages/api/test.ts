// pages/api/shopify/debug.ts

import type { NextApiRequest, NextApiResponse } from "next";

import { shopify } from "@/lib/shopify/client";

const QUERY = `
query {
  productVariant(id:  "gid://shopify/ProductVariant/43661748502641" ) {
    id
    title

    inventoryItem {
      id
      tracked
    }
  }
}
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const data = await shopify.graphql(QUERY);

  res.status(200).json(data);
}