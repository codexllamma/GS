import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).send("Method Not Allowed");
  }

  // Use the verified production domain
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.xn--hir-7la.com";

  try {
    const products = await prisma.product.findMany({
      where: { isDeleted: false },
      include: {
        images: {
          orderBy: { isPrimary: "desc" },
        },
        variants: true,
        fabric: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const itemsXml = products
      .map((product) => {
        // Fallback to placeholder if no images exist
        const primaryImage =
          product.images[0]?.url || "https://placehold.co/600x800/png?text=HIER+Product";

        // Aggregate stock across all sizes
        const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
        const availability = totalStock > 0 ? "in stock" : "out of stock";
        
        // Safely extract category
        const categoryName = product.fabric?.category?.name || "Clothing";

        return `
    <item>
      <g:id>${product.id}</g:id>
      <g:title><![CDATA[${product.name}]]></g:title>
      <g:description><![CDATA[${product.description || product.name}]]></g:description>
      <g:link>${BASE_URL}/?product=${product.id}</g:link>
      <g:image_link><![CDATA[${primaryImage}]]></g:image_link>
      <g:brand>HIÈR</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${product.basePrice} INR</g:price>
      <g:product_type><![CDATA[${categoryName}]]></g:product_type>
      <g:color><![CDATA[${product.color}]]></g:color>
      <g:google_product_category>1604</g:google_product_category>
    </item>`;
      })
      .join("");

    const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>HIÈR Catalog</title>
    <link>${BASE_URL}</link>
    <description>HIÈR Official Headless Catalog Feed</description>
    ${itemsXml}
  </channel>
</rss>`;

    // Tell the browser and Meta to interpret this strictly as XML
    res.setHeader("Content-Type", "text/xml; charset=UTF-8");
    // Cache the feed for 1 hour to prevent database spam from Meta's crawlers
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    
    return res.status(200).send(feedXml);
  } catch (error: any) {
    console.error("[META FEED ERROR]:", error);
    return res.status(500).send("Internal Server Error");
  }
}