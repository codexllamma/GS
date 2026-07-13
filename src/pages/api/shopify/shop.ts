import type { NextApiRequest, NextApiResponse } from "next";
import { shopifyFetch } from "@/lib/shopify/client";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const shop = await shopifyFetch("shop.json");

        res.status(200).json(shop);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Shopify request failed" });
    }
}